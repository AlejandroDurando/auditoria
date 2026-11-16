import { VALIDATIONS, VALIDATIONS_VIATICOS } from '../constants';
import type { AuditResult, PaymentData } from './gemini';
import { estadoDe, type Estado } from '../components/ui';

// Lectura de un resultado de auditoria para mostrarlo: las validaciones de
// cada pago en su orden, y los hallazgos (todo lo que no dio OK) del
// expediente. No decide nada: solo ordena lo que ya traen los datos.

export interface ValidacionVista {
  id: string;          // 'V7', 'D2'
  titulo: string;
  estado: Estado;
  observaciones: string;
}

export interface Hallazgo extends ValidacionVista {
  /** Pago al que pertenece; sin pago, es una validacion del expediente. */
  pago?: PaymentData;
  pagoIdx?: number;
}

type Modo = AuditResult['mode'];

/** Validaciones de un pago, en orden. El lector trae cada una con su titulo;
 *  la auditoria con IA usa la lista fija del modo, y la que no vino queda en
 *  Revisar ("dato no analizado"). */
export function validacionesDePago(pago: PaymentData | undefined, modo: Modo): ValidacionVista[] {
  const lista = (pago?.validations || []).filter(Boolean);
  const conTitulos = lista.length > 0 && lista.every(v => v.title);
  const plantilla = conTitulos
    ? lista.map(v => ({ id: v.id, label: v.id.toUpperCase(), title: v.title as string }))
    : modo === 'Viáticos' ? VALIDATIONS_VIATICOS : VALIDATIONS.filter(v => v.id !== 'v14');
  return plantilla.map(v => {
    const res = lista.find(r => r.id && r.id.toLowerCase() === v.id.toLowerCase());
    return {
      id: v.label,
      titulo: v.title,
      estado: res ? estadoDe(res.status) : 'revisar',
      observaciones: res?.observations || 'Dato no analizado por la IA.',
    };
  });
}

/** Peor estado de una lista: Error le gana a Revisar y Revisar a OK. */
export function peorEstado(estados: Estado[]): Estado {
  if (estados.includes('error')) return 'error';
  if (estados.includes('revisar')) return 'revisar';
  return 'ok';
}

const numero = (id: string) => Number(id.replace(/\D/g, '')) || 0;

/** Validaciones del expediente (balance, conciliacion, repetidos y las que no
 *  tienen lugar propio), con el estado que corresponde mostrar.
 *
 *  La API guarda V14 y V16 como "cuadra / no cuadra": un REVISAR llega igual
 *  que un ERROR. Si el expediente no esta en ERROR (`estadoExpediente`), lo
 *  que no cuadra se muestra como Revisar. */
export function validacionesDeExpediente(result: AuditResult | null, estadoExpediente?: string): ValidacionVista[] {
  if (!result) return [];
  const noAcusa = !!estadoExpediente && estadoDe(estadoExpediente) !== 'error';
  const malo: Estado = noAcusa ? 'revisar' : 'error';
  const salida: ValidacionVista[] = [];
  const balance = result.mode !== 'Viáticos' ? result.balance_inversion : undefined;
  if (balance?.validacion_v14) {
    const r = balance.validacion_v14.resultado;
    salida.push({
      id: 'V14', titulo: 'Balance de inversión',
      estado: r === 'ok' ? 'ok' : r === 'error' ? malo : 'revisar',
      observaciones: balance.validacion_v14.detalle || '',
    });
  }
  if (balance?.conciliacion_total) {
    salida.push({
      id: 'V16', titulo: 'Conciliación del importe a reponer',
      estado: balance.conciliacion_total.coinciden ? 'ok' : malo,
      observaciones: balance.conciliacion_total.detalle || '',
    });
  }
  for (const v of result.validacionesExpediente || []) {
    salida.push({
      id: v.id.toUpperCase(), titulo: v.title || v.id.toUpperCase(),
      estado: estadoDe(v.status), observaciones: v.observations || '',
    });
  }
  return salida.sort((a, b) => numero(a.id) - numero(b.id));
}

/** Todo lo que no dio OK: primero los Error, despues los Revisar; dentro de
 *  cada uno, en el orden de los pagos y al final lo del expediente. */
export function hallazgosDe(result: AuditResult | null, estadoExpediente?: string): Hallazgo[] {
  if (!result) return [];
  const lista: Hallazgo[] = [];
  (result.payments || []).forEach((pago, pagoIdx) => {
    for (const v of validacionesDePago(pago, result.mode)) {
      if (v.estado !== 'ok') lista.push({ ...v, pago, pagoIdx });
    }
  });
  for (const v of validacionesDeExpediente(result, estadoExpediente)) {
    if (v.estado !== 'ok') lista.push(v);
  }
  for (const d of result.duplicados || []) {
    lista.push({
      id: 'Repetido', titulo: 'Documentación repetida', estado: 'error',
      observaciones: [d.identificador, d.motivo, d.paginas && `Ubicación: ${d.paginas}`].filter(Boolean).join(' · '),
    });
  }
  const orden: Record<Estado, number> = { error: 0, revisar: 1, ok: 2 };
  return lista
    .map((h, i) => ({ h, i }))
    .sort((a, b) => orden[a.h.estado] - orden[b.h.estado] || a.i - b.i)
    .map(x => x.h);
}

/** Claves de los hallazgos sin repetir (V7, V13…), con su peor estado, en
 *  orden numerico: la columna Hallazgos de la lista de expedientes. */
export function clavesDeHallazgos(hallazgos: Hallazgo[]): Array<{ id: string; estado: Estado }> {
  const porId = new Map<string, Estado>();
  for (const h of hallazgos) {
    porId.set(h.id, peorEstado([h.estado, porId.get(h.id) || 'ok']));
  }
  return [...porId.entries()]
    .map(([id, estado]) => ({ id, estado }))
    .sort((a, b) => (numero(a.id) || 99) - (numero(b.id) || 99) || a.id.localeCompare(b.id));
}

/** Estado general de un resultado: el que trae el expediente si viene del
 *  lector; si no, el peor de sus hallazgos. */
export function estadoGeneral(result: AuditResult | null, estadoExpediente?: string): Estado {
  if (estadoExpediente) return estadoDe(estadoExpediente);
  return peorEstado(hallazgosDe(result).map(h => h.estado));
}
