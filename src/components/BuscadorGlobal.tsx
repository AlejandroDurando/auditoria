import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookUser, CheckCircle2, Clock, Loader2, Phone, Search, Table2, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AuditResult, PaymentData } from '../lib/gemini';
import type { ExpedienteLector } from '../../api/expedientes';
import { cargarExpedientes, useExpedientesLector } from '../lib/expedientesLector';
import { buscarEnGuia, cargarGuia, useGuia } from '../lib/guia';
import { irA } from '../lib/navegacion';
import { PESO, buscar, camposDePago, tokensDe, type Campo } from '../lib/busqueda';

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

// Campos de cada expediente y de sus pagos, armados una sola vez.
const camposPagos = new WeakMap<PaymentData[], Array<{ pago: PaymentData; campos: Campo[] }>>();
const pagosConCampos = (pagos: PaymentData[], archivos?: Array<{ nombre: string }>) => {
  let c = camposPagos.get(pagos);
  if (!c) {
    c = pagos.map(p => ({ pago: p, campos: camposDePago(p, archivos?.[p.sourceFileIdx ?? -1]?.nombre) }));
    camposPagos.set(pagos, c);
  }
  return c;
};

/** Texto del expediente fuera de sus pagos: validaciones de expediente,
 *  balance, conciliacion y repetidos. */
const textoResultado = (r: AuditResult | undefined) => !r ? '' : [
  r.balance_inversion?.validacion_v14?.detalle, r.balance_inversion?.conciliacion_total?.detalle,
  (r.validacionesExpediente || []).map(v => v.observations).join(' '),
  (r.duplicados || []).map(d => `${d.identificador} ${d.motivo}`).join(' '),
].join(' ');

const ESTADO: Record<string, string> = { OK: 'ok', ERROR: 'error con errores', REVISAR: 'revisar a revisar' };

interface Resultado {
  clave: string;
  tipo: 'lector' | 'historial' | 'guia';
  titulo: string;
  detalle: string;
  estado?: string;
  pago?: PaymentData;
  /** Donde coincidio ('Factura 0002-00000098', 'Expediente 2026-00081008'). */
  motivo?: string;
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

  const tokens = useMemo(() => tokensDe(consulta), [consulta]);

  const grupos = useMemo(() => {
    if (!tokens.length) return { lector: [] as Resultado[], historial: [] as Resultado[], guia: [] as Resultado[], totalLector: 0, totalHistorial: 0, totalGuia: 0 };
    const deLector: Array<Resultado & { orden: number }> = [];
    for (const e of expedientes || []) {
      const r = e.result;
      const cabecera: Campo[] = [
        { etiqueta: 'FF', valor: e.rendicion, peso: PESO.ff, tipo: 'id' },
        { etiqueta: 'Expediente', valor: e.expediente, peso: PESO.expediente, tipo: 'id', sufijo: true },
        { etiqueta: 'Fondo', valor: `${e.hoja} ${e.region} ${e.carpeta || ''}`, peso: PESO.agencia, tipo: 'texto' },
        { etiqueta: 'Responsable', valor: e.responsable || '', peso: PESO.responsable, tipo: 'texto' },
        { etiqueta: 'Fecha', valor: e.fecha || '', peso: PESO.fecha, tipo: 'texto' },
        { etiqueta: 'Importe total', valor: typeof r.totalAmount === 'number' ? String(r.totalAmount) : '', peso: PESO.importe, tipo: 'importe' },
        { etiqueta: 'Estado', valor: `${ESTADO[e.estado.toUpperCase()] || e.estado} lector`, peso: PESO.estado, tipo: 'texto' },
        { etiqueta: 'Documento', valor: (e.archivos || []).map(a => a.nombre.replace(/\.pdf$/i, '')).join(' · '), peso: PESO.archivo, tipo: 'texto' },
        { etiqueta: 'Expediente', valor: textoResultado(r), peso: PESO.texto, tipo: 'texto' },
      ];
      const c = buscar(cabecera, pagosConCampos(r.payments || [], e.archivos), tokens);
      if (!c) continue;
      deLector.push({
        clave: `l-${e.id}`, tipo: 'lector', estado: e.estado, pago: c.pago, motivo: c.motivo,
        titulo: `FF N° ${e.rendicion || '—'} · ${e.hoja}`,
        detalle: `Exp. ${e.expediente}${e.fecha ? ` (${e.fecha})` : ''} · ${e.region}`,
        abrir: () => onAbrirLector(e),
        orden: c.puntos * 10000 + (Number((e.rendicion || '').replace(/\D/g, '')) || 0),
      });
    }
    deLector.sort((a, b) => b.orden - a.orden);
    const deHistorial: Resultado[] = [];
    const ordenHistorial: number[] = [];
    for (const h of historial) {
      const r = h.result || ({} as AuditResult);
      const cabecera: Campo[] = [
        { etiqueta: 'FF', valor: `${(r.fondoFijoNumero || '').replace(/\D/g, '')} ${h.FF || ''}`, peso: PESO.ff, tipo: 'id' },
        { etiqueta: 'Expediente', valor: r.expedienteNumero || '', peso: PESO.expediente, tipo: 'id', sufijo: true },
        { etiqueta: 'Fondo', valor: r.agenciaSucursal || '', peso: PESO.agencia, tipo: 'texto' },
        { etiqueta: 'Responsable', valor: r.responsable || '', peso: PESO.responsable, tipo: 'texto' },
        { etiqueta: 'Fecha', valor: r.expedienteFecha || '', peso: PESO.fecha, tipo: 'texto' },
        { etiqueta: 'Importe total', valor: typeof r.totalAmount === 'number' ? String(r.totalAmount) : '', peso: PESO.importe, tipo: 'importe' },
        { etiqueta: 'Resumen', valor: `${h.summary || ''} ${r.mode || ''} historial dashboard ${textoResultado(r)}`, peso: PESO.texto, tipo: 'texto' },
      ];
      const c = buscar(cabecera, pagosConCampos(r.payments || []), tokens);
      if (!c) continue;
      const titulo = [r.agenciaSucursal, r.fondoFijoNumero].filter(Boolean).join(' — ')
        || (r.mode === 'Rapida' ? `${(r.payments || []).length} pagos sueltos` : `FF-${h.FF || 'sin ID'}`);
      deHistorial.push({
        clave: `h-${h.id}`, tipo: 'historial', pago: c.pago, motivo: c.motivo, titulo,
        detalle: [r.expedienteNumero ? `Exp. ${r.expedienteNumero}` : '',
          `auditado ${new Date(h.date).toLocaleDateString('es-AR')}`].filter(Boolean).join(' · '),
        abrir: () => onAbrirHistorial(h),
      });
      ordenHistorial.push(c.puntos);
    }
    const historialOrdenado = deHistorial.map((x, i) => ({ x, n: ordenHistorial[i] }))
      .sort((a, b) => b.n - a.n).map(y => y.x);
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
      historial: historialOrdenado.slice(0, MAXIMO), totalHistorial: historialOrdenado.length,
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
        {(r.pago || r.motivo) && (
          <span className="block text-xs text-acento truncate mt-0.5">
            {r.pago && <>Pago: {r.pago.providerName}{r.pago.orderNumber ? ` · PIMyS ${r.pago.orderNumber}` : ''}</>}
            {r.motivo && !(r.pago && /^(PIMyS|Proveedor) /.test(r.motivo)) && <>{r.pago ? ' · ' : ''}{r.motivo}</>}
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
        placeholder="Buscar FF, expediente, PIMyS, factura, proveedor…"
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
