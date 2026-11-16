import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookUser, CheckCircle2, Clock, Loader2, Phone, Search, Table2, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AuditResult, PaymentData } from '../lib/gemini';
import type { ExpedienteLector } from '../../api/expedientes';
import { cargarExpedientes, useExpedientesLector } from '../lib/expedientesLector';
import { buscarEnGuia, cargarGuia, useGuia } from '../lib/guia';
import { irA } from '../lib/navegacion';

// Buscador del encabezado: busca a la vez en los expedientes del lector, en
// el historial de auditorias del dashboard y en la guia telefonica. De cada
// expediente mira todo lo que trae: numero, fondo, carpeta, archivos, pagos
// (PIMyS, proveedor, codigo, importe) y el texto de las validaciones. Muestra los resultados en una
// lista desplegable; elegir uno lo abre.

export interface EntradaHistorial {
  id: string;
  date: string;
  FF: string;
  summary: string;
  result: AuditResult;
}

const normalizar = (s: unknown) =>
  (typeof s === 'string' ? s : s != null ? String(s) : '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const palabras = (consulta: string) => normalizar(consulta).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Los numeros tambien sin separadores: '30-71770897-7' se encuentra como
 *  '30717708977', '0005-00000822' como '000500000822' y '$1.104.293,01' como
 *  '1104293,01' o '110429301'. */
const conNumerosJuntos = (t: string) =>
  `${t} ${t.replace(/(?<=\d)[.\-/](?=\d)/g, '')} ${t.replace(/(?<=\d)[.\-/,](?=\d)/g, '')}`;

// Texto de un pago en el que se busca: PIMyS, proveedor, codigos de gasto,
// importe y lo que dicen sus validaciones (N° de factura, CUIT, aprobadores,
// fechas, movil…). Se arma una sola vez por pago.
const textosDePago = new WeakMap<PaymentData, string>();
const textoPago = (p: PaymentData) => {
  let t = textosDePago.get(p);
  if (t === undefined) {
    const importe = typeof p.amount === 'number' && !isNaN(p.amount)
      ? `${p.amount.toFixed(2).replace('.', ',')} ${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '';
    t = conNumerosJuntos(normalizar([
      `pimys ${p.orderNumber}`, p.providerName, (p.codigos || []).map(c => `codigo ${c}`).join(' '), importe,
      p.leidoPorOcr ? 'ocr' : '', (p.validations || []).map(v => v?.observations || '').join(' '),
      (p.vales || []).map(v => `vale ${v.numero}`).join(' '),
    ].join(' ')));
    textosDePago.set(p, t);
  }
  return t;
};

/** Texto del expediente fuera de sus pagos: validaciones de expediente,
 *  balance, conciliacion y repetidos. */
const textoResultado = (r: AuditResult | undefined) => !r ? '' : [
  r.balance_inversion?.validacion_v14?.detalle, r.balance_inversion?.conciliacion_total?.detalle,
  (r.validacionesExpediente || []).map(v => v.observations).join(' '),
  (r.duplicados || []).map(d => `${d.identificador} ${d.motivo}`).join(' '),
  typeof r.totalAmount === 'number' ? `${r.totalAmount.toFixed(2).replace('.', ',')} ${r.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '',
].join(' ');

const ESTADO: Record<string, string> = { OK: 'ok', ERROR: 'error con errores', REVISAR: 'revisar a revisar' };

/** Todas las palabras de la consulta tienen que aparecer en el expediente o
 *  en uno de sus pagos. Si hizo falta mirar los pagos, se dice cual. */
function coincide(cabecera: string, pagos: PaymentData[], tokens: string[]): { ok: boolean; pago?: PaymentData } {
  const faltan = tokens.filter(t => !cabecera.includes(t));
  if (!faltan.length) return { ok: true };
  const pago = pagos.find(p => { const tp = textoPago(p); return faltan.every(t => tp.includes(t)); });
  return pago ? { ok: true, pago } : { ok: false };
}

interface Resultado {
  clave: string;
  tipo: 'lector' | 'historial' | 'guia';
  titulo: string;
  detalle: string;
  estado?: string;
  pago?: PaymentData;
  abrir: () => void;
}

const MAXIMO = 30;

function Icono({ estado, tipo }: { estado?: string; tipo: Resultado['tipo'] }) {
  if (tipo === 'guia') return <Phone className="w-4 h-4 text-acento shrink-0" />;
  const e = (estado || '').toUpperCase();
  if (e === 'OK') return <CheckCircle2 className="w-4 h-4 text-ok-tinta shrink-0" />;
  if (e === 'ERROR') return <XCircle className="w-4 h-4 text-error shrink-0" />;
  if (e) return <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />;
  return <Clock className="w-4 h-4 text-tenue shrink-0" />;
}

export function BuscadorGlobal({ historial, onAbrirLector, onAbrirHistorial }: {
  historial: EntradaHistorial[];
  onAbrirLector: (e: ExpedienteLector) => void;
  onAbrirHistorial: (e: EntradaHistorial) => void;
}) {
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [marcado, setMarcado] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const { clave, expedientes, cargando } = useExpedientesLector();
  const { guia } = useGuia();
  const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  // ⌘K / Ctrl+K desde cualquier lugar.
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        entrada.current?.focus();
        entrada.current?.select();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (ev: MouseEvent) => { if (!caja.current?.contains(ev.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  const tokens = useMemo(() => palabras(consulta), [consulta]);

  const grupos = useMemo(() => {
    if (!tokens.length) return { lector: [] as Resultado[], historial: [] as Resultado[], guia: [] as Resultado[], totalLector: 0, totalHistorial: 0, totalGuia: 0 };
    const deLector: Array<Resultado & { orden: number }> = [];
    for (const e of expedientes || []) {
      const cabecera = conNumerosJuntos(normalizar([
        `ff n ${e.rendicion} rendicion ${e.rendicion} fondo ${e.rendicion}`, e.hoja, e.region, `exp ${e.expediente} expediente`,
        e.fecha, e.responsable, e.carpeta, ESTADO[e.estado.toUpperCase()] || e.estado, 'lector',
        (e.archivos || []).map(a => a.nombre.replace(/\.pdf$/i, '')).join(' '), textoResultado(e.result),
      ].join(' ')));
      const c = coincide(cabecera, e.result.payments || [], tokens);
      if (!c.ok) continue;
      deLector.push({
        clave: `l-${e.id}`, tipo: 'lector', estado: e.estado, pago: c.pago,
        titulo: `FF N° ${e.rendicion || '—'} · ${e.hoja}`,
        detalle: `Exp. ${e.expediente}${e.fecha ? ` (${e.fecha})` : ''} · ${e.region}`,
        abrir: () => onAbrirLector(e),
        orden: Number((e.rendicion || '').replace(/\D/g, '')) || 0,
      });
    }
    deLector.sort((a, b) => b.orden - a.orden);
    const deHistorial: Resultado[] = [];
    for (const h of historial) {
      const r = h.result || ({} as AuditResult);
      const cabecera = conNumerosJuntos(normalizar([
        r.expedienteNumero, r.expedienteFecha, r.agenciaSucursal, r.fondoFijoNumero, `ff ${h.FF}`,
        h.summary, r.responsable, r.mode, 'historial dashboard', textoResultado(r),
      ].join(' ')));
      const c = coincide(cabecera, r.payments || [], tokens);
      if (!c.ok) continue;
      const titulo = [r.agenciaSucursal, r.fondoFijoNumero].filter(Boolean).join(' — ')
        || (r.mode === 'Rapida' ? `${(r.payments || []).length} pagos sueltos` : `FF-${h.FF || 'sin ID'}`);
      deHistorial.push({
        clave: `h-${h.id}`, tipo: 'historial', pago: c.pago, titulo,
        detalle: [r.expedienteNumero ? `Exp. ${r.expedienteNumero}` : '',
          `auditado ${new Date(h.date).toLocaleDateString('es-AR')}`].filter(Boolean).join(' · '),
        abrir: () => onAbrirHistorial(h),
      });
    }
    // Guia telefonica: solo coincidencias exactas; la seccion busca parecidos.
    const deGuia: Resultado[] = [];
    const enGuia = guia ? buscarEnGuia(guia, consulta) : null;
    if (enGuia && !enGuia.aproximada) {
      for (const r of enGuia.resultados) {
        const c = r.contacto;
        const nombres = c.agentes.filter((_, i) => r.agentes.has(i));
        deGuia.push({
          clave: `g-${r.indice}`, tipo: 'guia',
          titulo: (nombres.length ? nombres : c.agentes).join(' · ') || c.sector,
          detalle: [c.interno && `Interno ${c.interno}`, c.directo && `Directo ${c.directo}`, `${c.sector} · ${c.zona}`].filter(Boolean).join(' · '),
          abrir: () => irA('guia', consulta.trim()),
        });
      }
    }
    return {
      lector: deLector.slice(0, MAXIMO), totalLector: deLector.length,
      historial: deHistorial.slice(0, MAXIMO), totalHistorial: deHistorial.length,
      guia: deGuia.slice(0, 8), totalGuia: deGuia.length,
    };
  }, [tokens, consulta, expedientes, historial, guia, onAbrirLector, onAbrirHistorial]);

  const todos = [...grupos.lector, ...grupos.historial, ...grupos.guia];
  useEffect(() => { setMarcado(0); }, [consulta]);
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${marcado}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [marcado]);

  const elegir = (r: Resultado) => {
    r.abrir();
    setConsulta('');
    setAbierto(false);
    entrada.current?.blur();
  };

  const alTeclear = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Escape') {
      if (consulta) setConsulta(''); else entrada.current?.blur();
      setAbierto(false);
    } else if (ev.key === 'ArrowDown' && todos.length) {
      ev.preventDefault(); setAbierto(true); setMarcado(i => (i + 1) % todos.length);
    } else if (ev.key === 'ArrowUp' && todos.length) {
      ev.preventDefault(); setMarcado(i => (i - 1 + todos.length) % todos.length);
    } else if (ev.key === 'Enter' && todos[marcado]) {
      ev.preventDefault(); elegir(todos[marcado]);
    }
  };

  const fila = (r: Resultado, indice: number) => (
    <button
      key={r.clave}
      type="button"
      data-indice={indice}
      onMouseMove={() => setMarcado(indice)}
      onClick={() => elegir(r)}
      className={cn(
        "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[0.375rem] text-left bg-transparent border-none cursor-pointer outline-none",
        indice === marcado && "bg-realce"
      )}
    >
      <span className="mt-0.5"><Icono estado={r.estado} tipo={r.tipo} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-tinta truncate">{r.titulo}</span>
        <span className="block text-xs text-tenue truncate">{r.detalle}</span>
        {r.pago && (
          <span className="block text-xs text-acento truncate mt-0.5">
            Pago: {r.pago.providerName}{r.pago.orderNumber ? ` · PIMyS ${r.pago.orderNumber}` : ''}
          </span>
        )}
      </span>
    </button>
  );

  const encabezado = (icono: React.ReactNode, titulo: string, total: number, mostrados: number) => (
    <div className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1 text-[0.6875rem] font-medium text-tenue">
      {icono}
      <span>{titulo}</span>
      <span className="ml-auto cifras">
        {total > mostrados ? `${mostrados} de ${total}` : total}
      </span>
    </div>
  );

  const mostrar = abierto && tokens.length > 0;

  return (
    <div ref={caja} className="relative w-full sm:w-[min(25rem,42vw)]">
      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-tenue pointer-events-none" aria-hidden="true" />
      <input
        ref={entrada}
        type="search"
        value={consulta}
        onChange={e => { setConsulta(e.target.value); setAbierto(true); }}
        onFocus={() => { setAbierto(true); if (clave) { cargarExpedientes(); cargarGuia(); } }}
        onKeyDown={alTeclear}
        placeholder="Buscar expediente, proveedor, PIMyS…"
        aria-label="Buscar en todos los expedientes"
        className="w-full h-7 bg-campo border border-linea-fuerte rounded-[0.375rem] pl-8 pr-14 text-sm text-tinta placeholder:text-tenue outline-none transition-colors focus:border-acento [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {consulta ? (
          <button type="button" onClick={() => { setConsulta(''); entrada.current?.focus(); }} title="Borrar"
            className="p-1 text-tenue hover:text-tinta bg-transparent border-none cursor-pointer outline-none flex">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1 h-[1.125rem] rounded-[0.25rem] border border-linea-fuerte font-mono text-[0.6875rem] text-tenue">
            {esMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        )}
      </div>

      {mostrar && (
        <div ref={lista} className="absolute z-50 right-0 top-full mt-1.5 w-full sm:w-[min(32.5rem,90vw)] max-h-[min(70vh,35rem)] overflow-y-auto bg-superficie border border-linea rounded-[0.5rem] caja-alta p-1.5">
          {grupos.lector.length > 0 && (
            <>
              {encabezado(<Table2 className="w-3.5 h-3.5" />, 'Expedientes auditados', grupos.totalLector, grupos.lector.length)}
              {grupos.lector.map((r, i) => fila(r, i))}
            </>
          )}
          {grupos.historial.length > 0 && (
            <>
              {encabezado(<Clock className="w-3.5 h-3.5" />, 'Historial', grupos.totalHistorial, grupos.historial.length)}
              {grupos.historial.map((r, i) => fila(r, grupos.lector.length + i))}
            </>
          )}
          {grupos.guia.length > 0 && (
            <>
              {encabezado(<BookUser className="w-3.5 h-3.5" />, 'Guía telefónica', grupos.totalGuia, grupos.guia.length)}
              {grupos.guia.map((r, i) => fila(r, grupos.lector.length + grupos.historial.length + i))}
            </>
          )}
          {!todos.length && !cargando && (
            <p className="px-3 py-6 text-center text-sm text-tenue">No hay resultados para "{consulta}".</p>
          )}
          {cargando && (
            <p className="px-3 py-2 text-xs text-tenue flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Leyendo los expedientes auditados…
            </p>
          )}
          {!clave && (
            <p className="px-3 py-2 text-xs text-tenue border-t border-linea mt-1">
              Para buscar también en los expedientes auditados y en la guía telefónica, ingresá la clave en "Expedientes auditados".
            </p>
          )}
        </div>
      )}
    </div>
  );
}
