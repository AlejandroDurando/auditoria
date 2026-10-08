// Expedientes auditados por el lector (repo lector-expedientes), leidos de
// los Google Sheets regionales. Solo lectura, con la cuenta de servicio del
// lector; los Sheets siguen privados. Pide la clave LECTOR_ACCESS_KEY en el
// encabezado 'x-lector-key'.
//
// Variables de entorno (Vercel):
//   GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY      cuenta de servicio del lector
//   SHEET_ID_RAFAELA, SHEET_ID_NOROESTE, SHEET_ID_OESTE, SHEET_ID_RECONQUISTA (opcional)
//   LECTOR_ACCESS_KEY                           clave que pide la vista
//   R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//                                               PDF y catalogo de matriculas en Cloudflare R2
//                                               (token de solo lectura)
//
// GET /api/expedientes            -> { expedientes }
// GET /api/expedientes?pdf=<clave> -> { url } firmada, vence en PDF_VENCE segundos
// GET /api/expedientes?catalogo=1 -> catalogo de matriculas (Matriculador)

import { createHash, timingSafeEqual } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import { JWT } from 'google-auth-library';
import type { AuditResult, PaymentData, ValidationResult } from '../src/lib/gemini';

export interface ArchivoPdf {
  nombre: string;
  clave: string;
  tamano: number;
}

export interface ExpedienteLector {
  id: string;
  carpeta?: string;
  archivos: ArchivoPdf[];
  region: string;
  hoja: string;
  expediente: string;
  rendicion: string;
  fecha?: string;
  responsable?: string;
  auditado?: string;
  estado: string;
  nPagos: number;
  result: AuditResult;
}

type Celda = string | number | boolean | null | undefined;
type Fila = Celda[];

const SUFIJO_DETALLE = ' — Detalle';
const VALIDACIONES_EXPEDIENTE = new Set(['V14', 'V15', 'V16', 'V17']);

const REGIONES: Array<{ region: string; env: string }> = [
  { region: 'Rafaela', env: 'SHEET_ID_RAFAELA' },
  { region: 'Sucursal Noroeste', env: 'SHEET_ID_NOROESTE' },
  { region: 'Sucursal Oeste', env: 'SHEET_ID_OESTE' },
  { region: 'Sucursal Reconquista', env: 'SHEET_ID_RECONQUISTA' },
];

// ─── Conversion de las filas del Sheet ────────────────────────────────────────

const texto = (c: Celda): string => (c == null ? '' : String(c)).trim();

function numero(c: Celda): number | undefined {
  if (typeof c === 'number') return c;
  const t = texto(c);
  if (!t) return undefined;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

/** '$1.154.132,92' -> 1154132.92 */
function pesos(t: string): number | undefined {
  const n = Number(t.replace(/[$\s.]/g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function estadoAStatus(estado: string): ValidationResult['status'] {
  const e = estado.toUpperCase();
  if (e === 'OK') return 'pass';
  if (e === 'ERROR') return 'fail';
  return 'warning';
}

/** Bloques de una pestaña: cada uno empieza con 'EXPEDIENTE ...' en la columna A. */
function bloques(filas: Fila[]): Map<string, Fila[]> {
  const salida = new Map<string, Fila[]>();
  let actual: Fila[] | null = null;
  for (const fila of filas) {
    const a = texto(fila[0]);
    if (a.startsWith('EXPEDIENTE ')) {
      actual = [fila];
      salida.set(a, actual);
    } else if (actual) {
      actual.push(fila);
    }
  }
  return salida;
}

/** 'EXPEDIENTE 2026-00047111 · FF N° 219' -> ['2026-00047111', '219'] */
function partesClave(clave: string): [string, string] {
  const m = clave.match(/^EXPEDIENTE\s+(.+?)\s+·\s+FF\s+N°\s+(.+)$/);
  return m ? [m[1], m[2]] : [clave.replace(/^EXPEDIENTE\s+/, ''), ''];
}

/** 'Fecha: 02/09/2026 · Responsable: 72146 - Malier ... · 5 pagos · Auditado: 30/09/2026 22:30' */
function datosCabecera(datos: string) {
  const campo = (rotulo: string) => {
    const m = datos.match(new RegExp(`${rotulo}:\\s*([^·]+)`));
    const v = m ? m[1].trim() : '';
    return v && v !== '—' ? v : undefined;
  };
  return { fecha: campo('Fecha'), responsable: campo('Responsable'), auditado: campo('Auditado') };
}

/** Datos numericos del bloque del resumen: carátula, totales e importe de cada pago. */
function leerResumen(bloque: Fila[]) {
  let montoAsignado: number | undefined;
  let saldoBanco: number | undefined;
  const totales: { balance?: number; libro?: number; suma?: number } = {};
  const importes: Array<number | undefined> = [];
  let enPagos = false;
  for (const fila of bloque.slice(1)) {
    const a = texto(fila[0]);
    if (a.startsWith('Monto asignado')) {
      montoAsignado = numero(fila[1]);
      saldoBanco = numero(fila[3]);
    } else if (a.startsWith('Total a reponer')) {
      totales.balance = numero(fila[2]);
      totales.libro = numero(fila[4]);
      totales.suma = numero(fila[6]);
    } else if (a === 'PIMyS' && texto(fila[1]) === 'Proveedor') {
      enPagos = true;
    } else if (enPagos) {
      if (/^V\d+$/.test(a) || fila.every(c => !texto(c))) {
        enPagos = false;
      } else {
        importes.push(numero(fila[2]));
      }
    }
  }
  return { montoAsignado, saldoBanco, totales, importes };
}

/** 'El balance cuadra: $4.500.000,00 - $3.925.117,25 = $574.882,75 (declarado: $574.882,75)' */
function cuentaV14(detalle: string) {
  const m = detalle.match(/(\$[\d.,]+)\s*-\s*(\$[\d.,]+)\s*=\s*(-?\$[\d.,]+)/);
  if (!m) return {};
  const calculado = pesos(m[3].replace('-', ''));
  return {
    pendiente: pesos(m[2]),
    calculado: calculado === undefined ? undefined : (m[3].startsWith('-') ? -calculado : calculado),
  };
}

export function convertirExpediente(region: string, hoja: string, clave: string,
                                    detalle: Fila[], resumen: Fila[] | undefined): ExpedienteLector {
  const [expediente, rendicion] = partesClave(clave);
  const cabecera = detalle[0];
  const estado = texto(cabecera[4]);
  const { fecha, responsable, auditado } = datosCabecera(texto(cabecera[5]));
  const { montoAsignado, saldoBanco, totales, importes } = leerResumen(resumen || []);

  const carpeta = texto(cabecera[6]) || undefined;
  const pagos: PaymentData[] = [];
  const archivoDePago: Array<string | undefined> = [];
  const deExpediente: Record<string, ValidationResult> = {};
  let rotacion: AuditResult['rotacion'];
  for (const fila of detalle.slice(1)) {
    const id = texto(fila[2]);
    if (id === 'PAGO') {
      const leido = texto(fila[5]).match(/Leido por OCR:\s*(.+)$/);
      pagos.push({
        orderNumber: texto(fila[1]),
        providerName: texto(fila[3]),
        amount: importes[pagos.length] ?? NaN,
        validations: [],
        leidoPorOcr: leido ? leido[1].trim() : undefined,
      });
      archivoDePago.push(texto(fila[6]) || undefined);
      continue;
    }
    if (id === 'ROT') {
      // 'Afectan el indice: $794.800,34 (6 pagos) | No afectan: 514
      // Prosumidores $42.722,73 (1 pago)' (exportar_sheet.texto_rotacion).
      const t = texto(fila[5]);
      const af = t.match(/Afectan el indice: (\$\s?[\d.,]+) \((\d+) pagos?\)/);
      const no = [...t.matchAll(/No afectan: (\d{3}) ([^$|]*?) (\$\s?[\d.,]+) \((\d+) pagos?\)/g)];
      if (af && no.length) {
        rotacion = {
          afecta: pesos(af[1]) ?? 0,
          pagosAfecta: Number(af[2]),
          noAfecta: no.map(m => ({ codigo: m[1], concepto: m[2].trim(), importe: pesos(m[3]) ?? 0, pagos: Number(m[4]) })),
          aviso: /Falta el importe/.test(t) ? 'Falta el importe de algún pago: verificar.' : undefined,
        };
      }
      continue;
    }
    if (!/^[VD]\d+$/.test(id)) continue;
    const v: ValidationResult = {
      id: id.toLowerCase(),
      title: texto(fila[3]),
      status: estadoAStatus(texto(fila[4])),
      observations: texto(fila[5]),
    };
    if (VALIDACIONES_EXPEDIENTE.has(id)) deExpediente[id] = v;
    else if (pagos.length) pagos[pagos.length - 1].validations.push(v);
  }

  // Sin importe en el resumen (factura leida por OCR): el que cita V6
  // ('Importe: $70.500,01 ...').
  for (const p of pagos) {
    if (Number.isFinite(p.amount)) continue;
    const v6 = p.validations.find(v => v.id === 'v6');
    const m = v6?.observations.match(/Importe:?\s*(\$\s?[\d.,]+)/);
    const n = m ? pesos(m[1]) : undefined;
    if (n !== undefined) p.amount = n;
  }

  // Vales de combustible o de ruedas que el lector leyo con IA: V10 los
  // nombra ('Vale N° 18146 - PRECIO TOTAL: $51.801,60', 'Letra no legible en
  // vale N° 18146') y la pagina los muestra en su seccion.
  for (const p of pagos) {
    const v10 = p.validations.find(v => v.id === 'v10')?.observations || '';
    const vales: NonNullable<PaymentData['vales']> = [];
    for (const m of v10.matchAll(/Vale N° (\S+) - PRECIO TOTAL: (\$\s?\d[\d.]*,\d{2})/g)) {
      vales.push({ numero: m[1], precioTotal: m[2], legible: true });
    }
    for (const m of v10.matchAll(/Letra no legible en vale N° ([^.\s]+(?: numero)?)/g)) {
      vales.push({ numero: m[1], legible: false });
    }
    if (vales.length) p.vales = vales;
  }

  // V14 y V16 van a su lugar en el Balance si dieron OK o ERROR; un REVISAR,
  // y V15 y V17, a la lista de validaciones del expediente.
  const otras: ValidationResult[] = [];
  const v14 = deExpediente.V14;
  const v16 = deExpediente.V16;
  const cuenta = v14 ? cuentaV14(v14.observations) : {};
  const result: AuditResult = {
    mode: 'Expedientes',
    payments: pagos,
    overallSummary: '',
    totalAmount: totales.libro ?? totales.balance ?? totales.suma,
    expedienteNumero: expediente,
    expedienteFecha: fecha,
    fondoFijoNumero: rendicion ? `FF N° ${rendicion}` : undefined,
    agenciaSucursal: hoja,
    responsable,
    rotacion,
  };
  if (v14 || montoAsignado !== undefined) {
    result.balance_inversion = {
      presente: true,
      monto_asignado: montoAsignado,
      saldo_banco_declarado: saldoBanco,
      total_pendiente: cuenta.pendiente,
      saldo_banco_calculado: cuenta.calculado,
      rendiciones_pendientes: totales.balance !== undefined && rendicion
        ? [{ numero: `${rendicion} (esta rendición)`, importe: totales.balance }]
        : [],
    };
    if (v14 && v14.status !== 'warning') {
      result.balance_inversion.validacion_v14 = {
        resultado: v14.status === 'pass' ? 'ok' : 'error',
        detalle: v14.observations,
      };
    }
    if (v16 && v16.status !== 'warning') {
      result.balance_inversion.conciliacion_total = {
        importe_balance: totales.balance,
        importe_libro_diario: totales.libro,
        suma_pagos_bancarios: totales.suma,
        coinciden: v16.status === 'pass',
        detalle: v16.observations,
      };
    }
  }
  for (const id of ['V14', 'V15', 'V16', 'V17']) {
    const v = deExpediente[id];
    if (!v) continue;
    const ubicada = (id === 'V14' && result.balance_inversion?.validacion_v14)
      || (id === 'V16' && result.balance_inversion?.conciliacion_total);
    if (!ubicada) otras.push(v);
  }
  if (otras.length) result.validacionesExpediente = otras;

  return {
    id: `${region}|${hoja}|${clave}`,
    carpeta, archivos: [], archivoDePago,
    region, hoja, expediente, rendicion, fecha, responsable, auditado,
    estado, nPagos: pagos.length, result,
  } as ExpedienteLector;
}

// ─── Google Sheets ────────────────────────────────────────────────────────────

async function token(): Promise<string> {
  const email = process.env.GOOGLE_SA_EMAIL;
  const key = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Faltan GOOGLE_SA_EMAIL o GOOGLE_SA_PRIVATE_KEY.');
  const jwt = new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const { token: t } = await jwt.getAccessToken();
  if (!t) throw new Error('No se obtuvo el token de Google.');
  return t;
}

async function getJson(url: string, t: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error(`Google Sheets respondio ${r.status}`);
  return r.json();
}

async function leerPlanilla(region: string, id: string, t: string): Promise<ExpedienteLector[]> {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}`;
  const meta = await getJson(`${base}?fields=sheets.properties.title`, t);
  const titulos: string[] = (meta.sheets || []).map((s: any) => s.properties.title);
  const detalles = titulos.filter(x => x.endsWith(SUFIJO_DETALLE));
  if (!detalles.length) return [];
  const rangos = detalles.flatMap(d => {
    const hoja = d.slice(0, -SUFIJO_DETALLE.length);
    return titulos.includes(hoja) ? [`'${d}'!A:G`, `'${hoja}'!A:N`] : [`'${d}'!A:G`];
  });
  const params = new URLSearchParams({ valueRenderOption: 'UNFORMATTED_VALUE' });
  rangos.forEach(r => params.append('ranges', r));
  const datos = await getJson(`${base}/values:batchGet?${params}`, t);
  const valores = new Map<string, Fila[]>();
  for (const vr of datos.valueRanges || []) {
    const hoja = String(vr.range).replace(/^'?(.*?)'?!.*$/, '$1').replace(/''/g, "'");
    valores.set(hoja, vr.values || []);
  }

  const salida: ExpedienteLector[] = [];
  for (const d of detalles) {
    const hoja = d.slice(0, -SUFIJO_DETALLE.length);
    const resumen = bloques(valores.get(hoja) || []);
    for (const [clave, bloque] of bloques(valores.get(d) || [])) {
      salida.push(convertirExpediente(region, hoja, clave, bloque, resumen.get(clave)));
    }
  }
  return salida;
}

// ─── PDF en Cloudflare R2 ─────────────────────────────────────────────────────

const PDF_VENCE = 300;

function r2() {
  const { R2_ACCOUNT_ID: cuenta, R2_BUCKET: bucket, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: secreto } = process.env;
  if (!cuenta || !bucket || !id || !secreto) return null;
  return {
    base: `https://${cuenta}.r2.cloudflarestorage.com/${bucket}`,
    cliente: new AwsClient({ accessKeyId: id, secretAccessKey: secreto, service: 's3', region: 'auto' }),
  };
}

const rutaR2 = (clave: string) => clave.split('/').map(encodeURIComponent).join('/');

/** Todos los PDF del bucket, agrupados por carpeta ('FF N° 219 Las Rosas'). */
async function listarPdfs(): Promise<Map<string, ArchivoPdf[]>> {
  const salida = new Map<string, ArchivoPdf[]>();
  const cfg = r2();
  if (!cfg) return salida;
  let continuacion: string | undefined;
  do {
    const url = new URL(cfg.base);
    url.searchParams.set('list-type', '2');
    if (continuacion) url.searchParams.set('continuation-token', continuacion);
    const r = await cfg.cliente.fetch(url.toString());
    if (!r.ok) throw new Error(`R2 respondio ${r.status}`);
    const xml = await r.text();
    const sinEntidades = (t: string) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const clave = sinEntidades((m[1].match(/<Key>([\s\S]*?)<\/Key>/) || [])[1] || '');
      const tamano = Number((m[1].match(/<Size>(\d+)<\/Size>/) || [])[1] || 0);
      const corte = clave.indexOf('/');
      if (corte < 0 || !/\.pdf$/i.test(clave)) continue;
      const carpeta = clave.slice(0, corte);
      if (!salida.has(carpeta)) salida.set(carpeta, []);
      salida.get(carpeta)!.push({ nombre: clave.slice(corte + 1), clave, tamano });
    }
    continuacion = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? sinEntidades((xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/) || [])[1] || '')
      : undefined;
  } while (continuacion);
  return salida;
}

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Carpeta del expediente: la que anoto el lector o, en los bloques
 *  exportados antes de la columna PDF, la del numero de rendicion cuyo nombre
 *  comparte una palabra con la pestaña ('FF N° 84 Ag Rafaela' / 'Ag. Rafaela'). */
function carpetaDe(e: ExpedienteLector, carpetas: string[]): string | undefined {
  if (e.carpeta && carpetas.includes(e.carpeta)) return e.carpeta;
  const nro = e.rendicion.replace(/\D/g, '').replace(/^0+/, '');
  const candidatas = carpetas.filter(c => {
    const m = c.match(/^FF\s+N°\s*0*(\d+)\s/);
    return m && m[1] === nro;
  });
  if (candidatas.length <= 1) return candidatas[0];
  const palabras = sinAcentos(e.hoja).split(/[^a-z]+/).filter(p => p.length > 3);
  return candidatas.find(c => palabras.some(p => sinAcentos(c).includes(p)));
}

function asociarPdfs(expedientes: ExpedienteLector[], pdfs: Map<string, ArchivoPdf[]>) {
  const carpetas = [...pdfs.keys()];
  for (const e of expedientes as Array<ExpedienteLector & { archivoDePago?: Array<string | undefined> }>) {
    const carpeta = carpetaDe(e, carpetas);
    e.archivos = carpeta ? pdfs.get(carpeta) || [] : [];
    e.result.payments.forEach((p, i) => {
      let idx = e.archivos.findIndex(a => a.nombre === e.archivoDePago?.[i]);
      if (idx < 0 && !e.archivoDePago?.[i] && p.providerName) {
        // Bloques exportados antes de la columna PDF: el proveedor sale del
        // nombre del archivo, asi que se busca el unico archivo que empieza
        // con el. Dos archivos del mismo proveedor: no se elige ninguno.
        const prov = sinAcentos(p.providerName);
        const posibles = e.archivos.map((a, j) => [sinAcentos(a.nombre), j] as const)
          .filter(([n]) => n.startsWith(prov));
        if (posibles.length === 1) idx = posibles[0][1];
      }
      if (idx >= 0) { p.sourceFileIdx = idx; p.pageNumber = 1; }
    });
    delete e.archivoDePago;
  }
}

async function urlFirmada(clave: string): Promise<string | null> {
  const cfg = r2();
  if (!cfg) return null;
  const url = new URL(`${cfg.base}/${rutaR2(clave)}`);
  url.searchParams.set('X-Amz-Expires', String(PDF_VENCE));
  const firmado = await cfg.cliente.sign(url.toString(), { method: 'GET', aws: { signQuery: true } });
  return firmado.url;
}

// ─── Catálogo de matrículas (Matriculador) ────────────────────────────────────
// Lo arma y lo sube a R2 el lector (matriculas.py). Pesa unos 270 KB: se
// devuelve entero y la busqueda se hace en el navegador.
const CLAVE_CATALOGO = 'catalogo/matriculas.json';

async function catalogoMatriculas(): Promise<{ estado: number; cuerpo: string }> {
  const cfg = r2();
  if (!cfg) return { estado: 500, cuerpo: JSON.stringify({ error: 'Falta configurar R2.' }) };
  const r = await cfg.cliente.fetch(`${cfg.base}/${rutaR2(CLAVE_CATALOGO)}`);
  if (r.status === 404) {
    return { estado: 404, cuerpo: JSON.stringify({ error: 'Todavía no se subió el catálogo de matrículas (python3 matriculas.py en el lector).' }) };
  }
  if (!r.ok) return { estado: 502, cuerpo: JSON.stringify({ error: 'No se pudo leer el catálogo de matrículas.' }) };
  return { estado: 200, cuerpo: await r.text() };
}

// ─── Clave de acceso ──────────────────────────────────────────────────────────

function claveValida(recibida: unknown): boolean {
  const esperada = process.env.LECTOR_ACCESS_KEY;
  if (!esperada || typeof recibida !== 'string' || !recibida) return false;
  const h = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(h(recibida), h(esperada));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo no permitido.' });
    return;
  }
  if (!process.env.LECTOR_ACCESS_KEY) {
    res.status(500).json({ error: 'Falta configurar LECTOR_ACCESS_KEY.' });
    return;
  }
  if (!claveValida(req.headers['x-lector-key'])) {
    res.status(401).json({ error: 'Clave de acceso incorrecta.' });
    return;
  }
  if (req.query?.catalogo !== undefined) {
    try {
      const { estado, cuerpo } = await catalogoMatriculas();
      if (estado === 200) res.setHeader('Cache-Control', 'private, max-age=600');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(estado).send(cuerpo);
    } catch (e) {
      console.error(e);
      res.status(502).json({ error: 'No se pudo leer el catálogo de matrículas.' });
    }
    return;
  }
  const pdf = req.query?.pdf;
  if (pdf !== undefined) {
    // Solo PDF dentro de una carpeta: 'FF N° 219 Las Rosas/archivo.pdf'.
    if (typeof pdf !== 'string' || !/^[^/]+\/[^/]+\.pdf$/i.test(pdf) || pdf.includes('..')) {
      res.status(400).json({ error: 'Archivo no valido.' });
      return;
    }
    const url = await urlFirmada(pdf);
    if (!url) {
      res.status(500).json({ error: 'Falta configurar R2.' });
      return;
    }
    res.status(200).json({ url, vence: PDF_VENCE });
    return;
  }
  try {
    const t = await token();
    const planillas = REGIONES.filter(r => process.env[r.env]);
    const [listas, pdfs] = await Promise.all([
      Promise.all(planillas.map(r => leerPlanilla(r.region, process.env[r.env] as string, t))),
      listarPdfs().catch(e => { console.error(e); return new Map<string, ArchivoPdf[]>(); }),
    ]);
    const expedientes = listas.flat();
    asociarPdfs(expedientes, pdfs);
    res.status(200).json({ expedientes });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'No se pudo leer el Google Sheet.' });
  }
}
