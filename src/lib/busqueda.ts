// Busqueda con jerarquia para el buscador del encabezado (pedido del usuario,
// 11/2026). Cada expediente y cada pago se describen como campos con un peso:
// un numero que es el del fondo fijo pesa mas que el mismo numero como PIMyS,
// y este mas que como N° de factura, proveedor, fecha, importe o texto de una
// validacion. Los numeros se comparan enteros (sin ceros adelante), no como
// pedazos de otro numero: '98' es el FF 98 o la factura 0002-00000098, no el
// importe $ 1.982,00. El N° de expediente, el de factura, el de PIMyS y el
// CUIT se encuentran tambien por sus ultimas cifras ('1008' de 2026-00081008).

import type { PaymentData } from './gemini';

export type TipoCampo = 'id' | 'importe' | 'texto';

export interface Campo {
  etiqueta: string;
  valor: string;
  peso: number;
  tipo: TipoCampo;
  /** Numero que tambien se encuentra por sus ultimas cifras. */
  sufijo?: boolean;
}

export const PESO = {
  ff: 1000, expediente: 900, pimys: 800, factura: 750, proveedor: 700, agencia: 650,
  responsable: 600, codigo: 550, fecha: 500, vale: 500, cuit: 450, importe: 450,
  estado: 400, agentes: 450, archivo: 300, fechaPago: 300, texto: 150,
};

export const normalizar = (s: unknown) =>
  (typeof s === 'string' ? s : s != null ? String(s) : '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const sinCeros = (s: string) => s.replace(/^0+(?=\d)/, '');
const FECHA = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;

/** Palabras de la consulta. Las fechas ('12/11/2026') van enteras; los
 *  importes pierden el punto de miles y los centavos ('$ 1.098,00' -> 1098). */
export function tokensDe(consulta: string): string[] {
  let q = normalizar(consulta);
  const fechas = q.match(FECHA) || [];
  q = q.replace(FECHA, ' ')
    .replace(/(?<=\d)\.(?=\d{3}\b)/g, '')
    .replace(/(\d),\d{1,2}\b/g, '$1');
  const todas = [...fechas, ...q.split(/[^a-z0-9ñ]+/).filter(Boolean)];
  // 'bomba de agua': el 'de' no ayuda a encontrar nada.
  const utiles = todas.filter(t => !VACIAS.has(t));
  return utiles.length ? utiles : todas;
}

const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a', 'al', 'con', 'por',
  'para', 'sin', 'un', 'una', 'o', 'u', 'n', 'nro', 'nº']);

/** Numeros de un texto, enteros y por partes: '0002-00000098' -> 98, 2 y
 *  200000098; '$ 1.098,50' -> 1098 (los centavos y los grupos de miles no
 *  son numeros: '98' no es '$ 16.361,98' ni '$ 651.098,12'). */
function numerosDe(v: string): string[] {
  const salida: string[] = [];
  for (const crudo of v.match(/\d+(?:[.,\-/]\d+)*/g) || []) {
    const x = crudo.replace(/,\d{1,2}$/, '');
    if (/^\d{1,3}(?:\.\d{3})+$/.test(x)) { salida.push(x.replace(/\./g, '')); continue; }
    salida.push(x.replace(/\D/g, ''), ...x.split(/[.,\-/]/));
  }
  return salida.map(sinCeros);
}

/** Cuanto pesa la coincidencia de una palabra de la consulta con un campo
 *  (0: no coincide). */
export function puntaje(t: string, c: Campo): number {
  const v = normalizar(c.valor);
  if (!v) return 0;
  if (t.includes('/')) return v.includes(t) ? c.peso : 0;          // fecha
  if (/^\d+$/.test(t)) {
    const tz = sinCeros(t);
    if (c.tipo === 'importe') {
      const n = Number(c.valor);
      return !isNaN(n) && (String(Math.trunc(n)) === tz || String(Math.round(n * 100)) === tz) ? c.peso : 0;
    }
    const nums = numerosDe(v);
    if (nums.includes(tz)) return c.peso;
    if (c.tipo === 'id' && c.sufijo && t.length >= 3 && nums.some(n => n.length > tz.length && n.endsWith(tz))) {
      return c.peso * 0.9;
    }
    return 0;
  }
  if (/\d/.test(t)) return v.replace(/[^a-z0-9ñ]/g, '').includes(t) ? c.peso : 0;  // '2a781'
  const palabras = v.split(/[^a-z0-9ñ]+/);
  if (palabras.includes(t)) return c.peso;
  if (palabras.some(w => w.startsWith(t))) return c.peso * 0.85;
  if (t.length >= 4 && v.includes(t)) return c.peso * 0.4;
  return 0;
}

/** Trozo del texto donde aparece la palabra, para mostrar donde coincidio. */
function trozo(c: Campo, t: string): string {
  const v = c.valor.replace(/\s+/g, ' ').trim();
  if (v.length <= 70) return v;
  const plano = normalizar(v);
  let i = /^\d+$/.test(t) ? plano.search(new RegExp(`(?<!\\d)0*${t}(?!\\d)`)) : plano.indexOf(t);
  if (i < 0) i = plano.indexOf(t);
  if (i < 0) return `${v.slice(0, 67)}…`;
  const desde = Math.max(0, i - 30);
  return `${desde > 0 ? '…' : ''}${v.slice(desde, desde + 70)}${desde + 70 < v.length ? '…' : ''}`;
}

const FACTURA = /n[°º]?\s*de\s*factura:?\s*([0-9a-z][0-9a-z\-]*)/gi;
const CUIT = /\b\d{2}-?\d{8}-?\d\b/g;
const obs = (p: PaymentData, id: string) =>
  (p.validations || []).filter(v => (v?.id || '').toLowerCase() === id).map(v => v.observations || '').join(' ');

/** Quienes firmaron el PIMyS (V4: aprobadores y Responsable de FF; V11), sin
 *  la lista de los que podrian autorizar ('requiere ... o Fabio Ingaramo o ...'). */
const firmantes = (p: PaymentData) => [
  ...[...obs(p, 'v4').matchAll(/(?:Aprobador\s*\d*|Responsable FF|Solicitante):\s*([^|·]+)/gi)].map(m => m[1].trim()),
  obs(p, 'v11').split(':')[0],
].filter(Boolean).join(' · ');

/** Campos de un pago: PIMyS, factura (de V7 y del nombre del PDF), proveedor,
 *  codigos, importe, CUIT, fechas, vales, agentes que firman y el resto del
 *  texto de las validaciones. */
export function camposDePago(p: PaymentData, archivo?: string): Campo[] {
  const v7 = obs(p, 'v7');
  const facturas = [...v7.matchAll(FACTURA)].map(m => m[1]);
  const delArchivo = archivo?.match(/fact\.?\s*([0-9a-z\-]+)/i)?.[1];
  const todas = (p.validations || []).map(v => v?.observations || '').join(' ');
  return [
    { etiqueta: 'PIMyS', valor: p.orderNumber || '', peso: PESO.pimys, tipo: 'id', sufijo: true },
    { etiqueta: 'Factura', valor: [...facturas, delArchivo].filter(Boolean).join(' · ') || v7, peso: PESO.factura, tipo: 'id', sufijo: true },
    { etiqueta: 'Proveedor', valor: p.providerName || '', peso: PESO.proveedor, tipo: 'texto' },
    { etiqueta: 'Código', valor: (p.codigos || []).join(' '), peso: PESO.codigo, tipo: 'id' },
    { etiqueta: 'Importe', valor: typeof p.amount === 'number' ? String(p.amount) : '', peso: PESO.importe, tipo: 'importe' },
    { etiqueta: 'CUIT', valor: [...new Set(todas.match(CUIT) || [])].join(' · '), peso: PESO.cuit, tipo: 'id', sufijo: true },
    { etiqueta: 'Fecha', valor: [...new Set(todas.match(FECHA) || [])].join(' · '), peso: PESO.fechaPago, tipo: 'texto' },
    { etiqueta: 'Vale', valor: (p.vales || []).map(x => x.numero).join(' '), peso: PESO.vale, tipo: 'id' },
    { etiqueta: 'Firmó', valor: firmantes(p), peso: PESO.agentes, tipo: 'texto' },
    { etiqueta: 'Validaciones', valor: todas, peso: PESO.texto, tipo: 'texto' },
  ];
}

export interface Coincidencia {
  puntos: number;
  pago?: PaymentData;
  /** Donde coincidio lo mas importante ('Factura 0002-00000098'). */
  motivo?: string;
}

function mejor(t: string, campos: Campo[]): { puntos: number; campo?: Campo } {
  let salida: { puntos: number; campo?: Campo } = { puntos: 0 };
  for (const c of campos) {
    const n = puntaje(t, c);
    if (n > salida.puntos) salida = { puntos: n, campo: c };
  }
  return salida;
}

/** Todas las palabras tienen que coincidir en la cabecera del expediente o en
 *  uno de sus pagos. Gana el pago que suma mas. */
export function buscar(cabecera: Campo[], pagos: Array<{ pago: PaymentData; campos: Campo[] }>,
  tokens: string[]): Coincidencia | null {
  const enCabecera = tokens.map(t => ({ t, ...mejor(t, cabecera) }));
  const candidatos: Array<{ puntos: number; pago?: PaymentData; partes: Array<{ t: string; puntos: number; campo?: Campo }> }> = [];
  if (enCabecera.every(x => x.puntos > 0)) {
    candidatos.push({ puntos: enCabecera.reduce((a, x) => a + x.puntos, 0), partes: enCabecera });
  }
  for (const { pago, campos } of pagos) {
    const partes = enCabecera.map(h => {
      const p = mejor(h.t, campos);
      return p.puntos > h.puntos ? { t: h.t, ...p } : h;
    });
    if (!partes.every(x => x.puntos > 0)) continue;
    const usaPago = partes.some((x, i) => x !== enCabecera[i]);
    candidatos.push({ puntos: partes.reduce((a, x) => a + x.puntos, 0), pago: usaPago ? pago : undefined, partes });
  }
  if (!candidatos.length) return null;
  const elegido = candidatos.reduce((a, b) => (b.puntos > a.puntos ? b : a));
  const principal = elegido.partes.reduce((a, b) => (b.puntos > a.puntos ? b : a));
  const motivo = principal.campo && principal.campo.etiqueta !== 'FF'
    ? `${principal.campo.etiqueta} ${trozo(principal.campo, principal.t)}` : undefined;
  return { puntos: elegido.puntos, pago: elegido.pago, motivo };
}
