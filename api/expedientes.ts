// Expedientes auditados por el lector (repo lector-expedientes), leidos de
// los Google Sheets regionales. Solo lectura, con la cuenta de servicio del
// lector; los Sheets siguen privados. Pide la clave LECTOR_ACCESS_KEY en el
// encabezado 'x-lector-key'.
//
// Variables de entorno (Vercel):
//   GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY      cuenta de servicio del lector
//   SHEET_ID_RAFAELA, SHEET_ID_NOROESTE, SHEET_ID_OESTE
//   LECTOR_ACCESS_KEY                           clave que pide la vista

import { createHash, timingSafeEqual } from 'node:crypto';
import { JWT } from 'google-auth-library';
import type { AuditResult, PaymentData, ValidationResult } from '../src/lib/gemini';

export interface ExpedienteLector {
  id: string;
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

  const pagos: PaymentData[] = [];
  const deExpediente: Record<string, ValidationResult> = {};
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
    fondoFijoNumero: hoja,
    agenciaSucursal: region,
    responsable,
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
    region, hoja, expediente, rendicion, fecha, responsable, auditado,
    estado, nPagos: pagos.length, result,
  };
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
    return titulos.includes(hoja) ? [`'${d}'!A:F`, `'${hoja}'!A:N`] : [`'${d}'!A:F`];
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
  try {
    const t = await token();
    const planillas = REGIONES.filter(r => process.env[r.env]);
    const listas = await Promise.all(planillas.map(r => leerPlanilla(r.region, process.env[r.env] as string, t)));
    res.status(200).json({ expedientes: listas.flat() });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'No se pudo leer el Google Sheet.' });
  }
}
