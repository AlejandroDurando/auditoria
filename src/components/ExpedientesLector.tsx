import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Download, ExternalLink, FileSpreadsheet, FileText, ListFilter, Loader2, RefreshCw, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import type { ArchivoPdf, ExpedienteLector } from '../../api/expedientes';
import { ResultadosExpediente } from './ResultadosExpediente';
import { PdfScrollViewer } from './PdfScrollViewer';
import { datosRevisivaLector, descargarRevisiva } from '../lib/revisiva';
import { ClaveAcceso } from './ClaveAcceso';
import { cargarExpedientes, fijarClave, useExpedientesLector } from '../lib/expedientesLector';
import { irA, useRuta, volverA } from '../lib/navegacion';
import { clavesDeHallazgos, hallazgosDe } from '../lib/hallazgos';
import {
  BandaError, Clave, Contador, Encabezado, EstadoBadge, FilasEsqueleto, Panel, Pestanas, Punto, Vacio,
  boton, estadoDe, ROTULO_ESTADO, type Estado,
} from './ui';

// Expedientes auditados por el lector de expedientes, leidos del Google Sheet
// a traves de /api/expedientes, con la clave de acceso (ClaveAcceso).
const REGIONES = ['Rafaela', 'Sucursal Noroeste', 'Sucursal Oeste', 'Sucursal Reconquista'] as const;
type Region = typeof REGIONES[number];

const nroRendicion = (e: ExpedienteLector) => Number((e.rendicion || '').replace(/\D/g, '')) || 0;

function aBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

// Visor del PDF guardado en R2: la API devuelve una URL firmada que vence en
// minutos y el PDF se descarga directo del bucket.
function VisorPdf({ archivo, clave, onCerrar, ancho, onAncho, pagina }: {
  archivo: ArchivoPdf; clave: string; onCerrar: () => void; ancho: number; onAncho: (px: number) => void;
  pagina?: { n: number; vez: number };
}) {
  const [base64, setBase64] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setBase64(null);
    setError(null);
    (async () => {
      try {
        const r = await fetch(`/api/expedientes?pdf=${encodeURIComponent(archivo.clave)}`, {
          headers: { 'x-lector-key': clave },
        });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
        const pdf = await fetch(datos.url);
        if (!pdf.ok) throw new Error(`No se pudo descargar el PDF (${pdf.status}).`);
        const b64 = aBase64(await pdf.arrayBuffer());
        if (activo) { setUrl(datos.url); setBase64(b64); }
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudo abrir el PDF.');
      }
    })();
    return () => { activo = false; };
  }, [archivo.clave, clave]);

  return (
    // Panel fijo a la derecha, sin fondo que bloquee: la auditoria sigue
    // visible y con scroll a la izquierda.
    <div className="fixed top-0 right-0 bottom-0 z-50 w-full lg:w-[var(--ancho-pdf)] border-l border-linea"
      style={{ '--ancho-pdf': `${ancho}px` } as React.CSSProperties}>
      {/* Borde izquierdo arrastrable para cambiar el ancho del PDF. */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const mover = (ev: MouseEvent) => onAncho(window.innerWidth - ev.clientX);
          const soltar = () => {
            window.removeEventListener('mousemove', mover);
            window.removeEventListener('mouseup', soltar);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          };
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          window.addEventListener('mousemove', mover);
          window.addEventListener('mouseup', soltar);
        }}
        className="hidden lg:block absolute left-0 top-0 h-full w-[0.375rem] -ml-[3px] cursor-col-resize z-10 hover:bg-marca/40 transition-colors"
        title="Arrastrar para cambiar el ancho"
      />
      <div className="h-full w-full bg-superficie flotante flex flex-col">
        <div className="flex items-center justify-between gap-3 h-11 pl-3.5 pr-2 border-b border-linea shrink-0">
          <span className="text-sm font-medium text-tinta truncate">{archivo.nombre.replace(/\.pdf$/i, '')}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir en una pestaña nueva" aria-label="Abrir en una pestaña nueva"
                className={boton.icono}>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            <button type="button" onClick={onCerrar} title="Cerrar" aria-label="Cerrar el PDF" className={boton.icono}>
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="p-6 text-sm text-error">{error}</div>
          ) : base64 ? (
            <PdfScrollViewer base64={base64} fileName={archivo.nombre} pagina={pagina} />
          ) : (
            <div className="p-6 text-sm text-tenue flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Abriendo el PDF…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Documento que usa cada validacion, en orden de preferencia: el ojo abre el
// PDF del pago en esa hoja (indice del lector). Sin la hoja, la 1.
const DOCUMENTO_DE: Record<string, string[]> = {
  V1: ['factura', 'pimys'], V2: ['pimys'], V3: ['pimys'], V4: ['pimys'], V11: ['pimys'],
  V6: ['factura', 'sap'], V7: ['factura', 'sap'], V13: ['factura', 'pimys'],
  V8: ['transferencia', 'recibo', 'arca', 'factura'], V9: ['arca'],
  V10: ['transferencia', 'recibo', 'sap', 'nota'], V12: ['orden_sap', 'vale'],
};

function hojaDe(archivo: ArchivoPdf | undefined, validacion?: string): number {
  const hojas = archivo?.hojas || {};
  for (const tipo of DOCUMENTO_DE[(validacion || '').toUpperCase()] || []) {
    if (hojas[tipo]) return hojas[tipo];
  }
  return 1;
}

const ROTULO_TIPO: Record<string, string> = {
  caratula: 'Carátula', pago: 'Pago', libro_diario: 'Libro Diario', balance: 'Balance de Inversión',
  reporte: 'Reporte de proveedores', otro: 'Otro',
};

/** Menu con los documentos del expediente, en el orden de la carpeta:
 *  carátula, pagos, Libro Diario y Balance (indice del lector). */
function DocumentosExpediente({ archivos, abierto, onAbrir }: {
  archivos: ArchivoPdf[]; abierto: ArchivoPdf | null; onAbrir: (a: ArchivoPdf) => void;
}) {
  const [desplegado, setDesplegado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!desplegado) return;
    const afuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setDesplegado(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setDesplegado(false); };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', afuera); document.removeEventListener('keydown', tecla); };
  }, [desplegado]);
  let pago = 0;
  // La lista se despliega debajo con el ancho del nombre mas largo (con tope
  // en el ancho de la pantalla) y todos los documentos a la vista.
  return (
    <div ref={caja} className="relative min-w-[min(100%,17rem)] max-w-full border border-linea-fuerte rounded-[0.375rem] bg-superficie">
      <button
        type="button"
        onClick={() => setDesplegado(d => !d)}
        aria-expanded={desplegado}
        className="w-full h-[1.75rem] flex items-center gap-2 px-2.5 text-left text-sm font-medium text-tinta bg-transparent border-none rounded-[0.375rem] cursor-pointer hover:bg-realce transition-colors"
      >
        <FileText className="w-3.5 h-3.5 text-tenue shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">Documentos del expediente <span className="font-normal text-tenue cifras">({archivos.length})</span></span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-tenue transition-transform', desplegado && 'rotate-180')} aria-hidden="true" />
      </button>
      {desplegado && (
        <ol className="absolute z-30 left-0 top-full mt-1.5 w-max min-w-full max-w-[min(42rem,calc(100vw-2rem))] m-0 p-1 list-none bg-superficie border border-linea rounded-[0.5rem] flotante">
          {archivos.map(a => {
            const tipo = a.tipo || 'otro';
            const rotulo = tipo === 'pago' ? `Pago ${++pago}` : ROTULO_TIPO[tipo] || 'Documento';
            return (
              <li key={a.clave}>
                <button
                  type="button"
                  onClick={() => { onAbrir(a); setDesplegado(false); }}
                  className={cn(
                    "w-full flex items-baseline gap-3 px-2 py-1.5 rounded-[0.375rem] text-left text-sm cursor-pointer bg-transparent border-none hover:bg-realce transition-colors",
                    abierto?.clave === a.clave ? "text-acento font-medium" : "text-tinta"
                  )}
                  title={a.nombre}
                >
                  <span className="w-[4.75rem] sm:w-[8.5rem] shrink-0 text-xs font-normal text-tenue sm:whitespace-nowrap">{a.tipo ? rotulo : ''}</span>
                  <span className="min-w-0 break-words">{a.nombre.replace(/\.pdf$/i, '')}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// Columnas de la tabla: estado, rendicion, expediente, fecha, pagos,
// hallazgos e importe.
const COLUMNAS = '6.5rem 5.75rem 9.25rem 5.75rem 3.25rem minmax(8.75rem, 1fr) 8.25rem';
type Filtro = 'todos' | Estado;

/** Datos de la planilla control de un expediente auditado: la cabecera y,
 *  como observaciones, lo que no dio OK. */
export interface DatosPlanillaControl {
  sector: string; expediente: string; fondoFijo: string; fecha: string;
  filas: Array<{ orden: string; observacion: string }>;
}

// Palabras que marcan la parte de una observacion que dice que esta mal.
const SENALA = /falta|no coincide|no figura|distint|difier|posterior|vencid|fuera de|no se pudo|no se encontr|no se ley|repetid|ilegible|no habilitad|no cuadra|no cumple|supera|excede|\bsin\b/i;

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Observacion resumida para la planilla: la parte del texto que dice que
 *  esta mal, sin la clave interna (V7, D2). El nombre del control va adelante
 *  solo si el texto no lo nombra ("Pedido vs factura: No figura …"). */
function resumen(titulo: string, texto: string): string {
  const limpio = texto.replace(/\*\*/g, '').replace(/\s*\((?:OCR|IA)\)/g, '');
  // Bloques ('Aprobador 1: … | Aprobador 2: … · Codigo 226: … FALTA'): el primero que señala el problema.
  const bloques = limpio.split(/\s[·|]\s|\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  let frase = (bloques.find(x => SENALA.test(x)) || bloques[0] || '').replace(/[.\s]+$/, '');
  if (frase.length > 150) {
    // Bloque largo: la oracion que señala el problema y, si entra, la anterior
    // (el dato). No corta en 'S. A.' ni dentro de un importe.
    const oraciones = frase.split(/(?<!\b[A-Z])\.\s+(?=[A-ZÁÉÍÓÚÑ0-9])/).map(x => x.trim()).filter(Boolean);
    const n = Math.max(oraciones.findIndex(x => SENALA.test(x)), 0);
    const conAnterior = n > 0 ? `${oraciones[n - 1]}. ${oraciones[n]}` : oraciones[n];
    frase = conAnterior.length <= 150 ? conAnterior : oraciones[n];
    if (frase.length > 150) frase = `${frase.slice(0, 147).trimEnd()}…`;
  }
  const nombrado = sinTildes(titulo).split(/[^a-z0-9]+/).filter(w => w.length >= 4)
    .some(w => sinTildes(frase).includes(w));
  return !frase ? titulo : nombrado ? frase : `${titulo}: ${frase}`;
}

// Documento del expediente al que corresponde cada control que no es de un pago.
const DOCUMENTO_DE_EXPEDIENTE: Record<string, string> = { V14: 'balance', V15: 'libro_diario' };

/** El N° de orden es el del documento en TIMBÓ: la carátula es el 1 y cada
 *  pago sigue en el orden de la carpeta (el mismo de la lista Documentos). */
function datosPlanillaControl(e: ExpedienteLector): DatosPlanillaControl {
  const ordenDe = (indice: number | undefined) => (indice !== undefined && indice >= 0 ? String(indice + 1) : '');
  return {
    sector: e.hoja,
    expediente: e.expediente,
    fondoFijo: e.rendicion,
    fecha: '',
    filas: hallazgosDe(e.result, e.estado).map(h => ({
      orden: h.pago
        // Sin el indice de documentos: caratula 1, primer pago 2…
        ? ordenDe(h.pago.sourceFileIdx ?? (h.pagoIdx !== undefined ? h.pagoIdx + 1 : undefined))
        : ordenDe(e.archivos.findIndex(a => a.tipo === DOCUMENTO_DE_EXPEDIENTE[h.id])),
      observacion: resumen(h.titulo, h.observaciones),
    }))
      // En el orden de TIMBÓ; lo que no tiene documento, al final.
      .map((f, i) => ({ f, i }))
      .sort((a, b) => (Number(a.f.orden) || 9999) - (Number(b.f.orden) || 9999) || a.i - b.i)
      .map(x => x.f),
  };
}

export function ExpedientesLector({ onPlanillaControl }: { onPlanillaControl?: (datos: DatosPlanillaControl) => void }) {
  const { clave, expedientes, cargando, error } = useExpedientesLector();
  const [busqueda, setBusqueda] = useState('');
  // El expediente abierto es parte de la direccion (#/lector/<id>): el "atras"
  // del navegador vuelve a la lista.
  const ruta = useRuta();
  const seleccionado = ruta.seccion === 'lector' ? ruta.detalle : null;
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [pdfAbierto, setPdfAbiertoCrudo] = useState<ArchivoPdf | null>(null);
  const [paginaPdf, setPaginaPdf] = useState<{ n: number; vez: number } | undefined>(undefined);
  const setPdfAbierto = (a: ArchivoPdf | null, n = 1) => {
    setPdfAbiertoCrudo(a);
    setPaginaPdf(a ? { n, vez: Date.now() } : undefined);
  };
  // Con el PDF abierto, la auditoria se angosta hasta el borde del panel
  // (48% derecho de la pantalla) para seguir viendose y scrolleando.
  const columnaRef = useRef<HTMLDivElement>(null);
  const [anchoColumna, setAnchoColumna] = useState<{ ancho: number; corrimiento: number } | null>(null);
  const [anchoPdf, setAnchoPdfCrudo] = useState(() => {
    try { const v = Number(localStorage.getItem('anchoPdfLector')); if (v) return v; } catch { /* sin storage */ }
    return Math.round(window.innerWidth * 0.48);
  });
  const setAnchoPdf = (px: number) => {
    const v = Math.round(Math.min(Math.max(px, 360), window.innerWidth - 400));
    setAnchoPdfCrudo(v);
    try { localStorage.setItem('anchoPdfLector', String(v)); } catch { /* sin storage */ }
  };
  useLayoutEffect(() => {
    const medir = () => {
      const el = columnaRef.current;
      if (!pdfAbierto || !el || window.innerWidth < 1024) { setAnchoColumna(null); return; }
      // La columna ocupa todo el espacio libre: desde el borde del area
      // principal (o de la barra lateral) hasta el panel del PDF, sin el
      // margen del centrado.
      const contenedor = el.parentElement!.getBoundingClientRect().left;
      const area = (el.closest('main') as HTMLElement | null)?.getBoundingClientRect().left ?? contenedor;
      // padding lateral del area principal (px-8 = 2rem), en px reales
      const margen = 2 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const izquierda = area + margen;
      setAnchoColumna({
        ancho: Math.max(320, window.innerWidth - anchoPdf - izquierda - margen),
        corrimiento: Math.min(0, area - contenedor),
      });
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [pdfAbierto, anchoPdf]);
  const [region, setRegion] = useState<Region>('Rafaela');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  // Carpetas que el usuario abrio o cerro a mano. Las demas arrancan abiertas
  // si tienen algo que no dio OK.
  const [alternadas, setAlternadas] = useState<Record<string, boolean>>({});

  useEffect(() => { if (clave) cargarExpedientes(); }, [clave]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = expedientes || [];
    if (!q) return lista;
    return lista.filter(e => [e.expediente, e.rendicion, e.hoja, e.region, e.fecha, e.responsable, e.estado]
      .some(x => (x || '').toLowerCase().includes(q)));
  }, [expedientes, busqueda]);

  const deRegion = useMemo(() => filtrados.filter(x => x.region === region), [filtrados, region]);
  const cuentaRegion = useMemo(() => ({
    todos: deRegion.length,
    error: deRegion.filter(e => estadoDe(e.estado) === 'error').length,
    revisar: deRegion.filter(e => estadoDe(e.estado) === 'revisar').length,
    ok: deRegion.filter(e => estadoDe(e.estado) === 'ok').length,
  }), [deRegion]);

  // La region elegida, agrupada por carpeta (pestaña del Sheet) y, dentro de
  // cada una, de la rendicion mas nueva a la mas vieja. Los contadores de la
  // carpeta son de toda la carpeta, no solo de lo que deja pasar el filtro.
  const grupos = useMemo(() => {
    const salida: Array<{ titulo: string; items: ExpedienteLector[]; total: number; errores: number; revisar: number }> = [];
    for (const e of deRegion) {
      let grupo = salida.find(g => g.titulo === e.hoja);
      if (!grupo) { grupo = { titulo: e.hoja, items: [], total: 0, errores: 0, revisar: 0 }; salida.push(grupo); }
      const estado = estadoDe(e.estado);
      grupo.total++;
      if (estado === 'error') grupo.errores++;
      if (estado === 'revisar') grupo.revisar++;
      if (filtro === 'todos' || filtro === estado) grupo.items.push(e);
    }
    salida.forEach(g => g.items.sort((a, b) => nroRendicion(b) - nroRendicion(a)));
    return salida.filter(g => g.items.length > 0);
  }, [deRegion, filtro]);

  // Claves de lo que no dio OK en cada expediente (columna Hallazgos).
  const hallazgosPorId = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof clavesDeHallazgos>>();
    for (const e of deRegion) mapa.set(e.id, clavesDeHallazgos(hallazgosDe(e.result, e.estado)));
    return mapa;
  }, [deRegion]);

  const alternar = (titulo: string, abierta: boolean) => setAlternadas(prev => ({ ...prev, [titulo]: !abierta }));

  const actual = (expedientes || []).find(e => e.id === seleccionado) || null;
  useEffect(() => {
    setExpandedPayment(null);
    setPdfAbierto(null);
    // Al volver a la lista queda en la region del expediente que se abrio
    // (puede venir del buscador del encabezado).
    if (actual) setRegion(actual.region as Region);
  }, [actual?.id]);

  if (!clave) {
    return <ClaveAcceso titulo="Expedientes auditados" error={error} onClave={fijarClave} />;
  }

  if (actual) {
    return (
      <div ref={columnaRef} style={anchoColumna ? { width: anchoColumna.ancho, maxWidth: 'none', marginLeft: anchoColumna.corrimiento } : undefined}>
        <button
          type="button"
          onClick={() => volverA('lector')}
          className={cn(boton.fantasma, '-ml-2 mb-3 h-[1.625rem] text-xs')}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Volver a los expedientes auditados
        </button>
        <ResultadosExpediente
          result={actual.result}
          expandedPayment={expandedPayment}
          setExpandedPayment={setExpandedPayment}
          titulo={`FF N° ${actual.rendicion || '—'}`}
          estadoExpediente={actual.estado}
          etiqueta={actual.auditado ? `Auditado el ${actual.auditado}` : ''}
          acciones={<>
            {actual.archivos.length > 0 && (
              <DocumentosExpediente archivos={actual.archivos} abierto={pdfAbierto} onAbrir={setPdfAbierto} />
            )}
            <button
              type="button"
              onClick={() => descargarRevisiva(datosRevisivaLector(actual),
                `Planilla revisiva ${actual.carpeta || `FF N ${actual.rendicion} ${actual.hoja}`}.pdf`.replace(/°/g, ''))}
              className={boton.primario}
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Planilla revisiva
            </button>
            {onPlanillaControl && (
              <button type="button" onClick={() => onPlanillaControl(datosPlanillaControl(actual))} className={boton.secundario}>
                <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                Planilla control
              </button>
            )}
          </>}
          onViewPdf={actual.archivos.length ? (idx, _pag, validacion) =>
            setPdfAbierto(actual.archivos[idx] || null, hojaDe(actual.archivos[idx], validacion)) : undefined}
        />
        {pdfAbierto && <VisorPdf archivo={pdfAbierto} clave={clave} onCerrar={() => setPdfAbierto(null)} ancho={anchoPdf} onAncho={setAnchoPdf} pagina={paginaPdf} />}
      </div>
    );
  }

  const total = (expedientes || []).length;
  const regionesConDatos = new Set((expedientes || []).map(e => e.region)).size;
  const hayFiltro = !!busqueda.trim() || filtro !== 'todos';
  const FILTROS: Array<{ valor: Filtro; rotulo: string }> = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'error', rotulo: ROTULO_ESTADO.error },
    { valor: 'revisar', rotulo: ROTULO_ESTADO.revisar },
    { valor: 'ok', rotulo: ROTULO_ESTADO.ok },
  ];

  return (
    <div>
      <Encabezado
        titulo="Expedientes auditados"
        detalle={expedientes
          ? `${total} ${total === 1 ? 'expediente' : 'expedientes'} en ${regionesConDatos} ${regionesConDatos === 1 ? 'región' : 'regiones'}`
          : 'Auditados por el lector y exportados al Google Sheet'}
        acciones={<>
          <button type="button" onClick={() => cargarExpedientes(true)} disabled={cargando} className={boton.secundario}>
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
            Actualizar
          </button>
          <button type="button" onClick={() => fijarClave('')} className={boton.fantasma} title="Olvidar la clave en este navegador">
            Salir
          </button>
        </>}
      />

      <Pestanas
        rotulo="Región"
        valor={region}
        onCambio={setRegion}
        opciones={REGIONES.map(r => ({
          valor: r, rotulo: r,
          cantidad: expedientes ? filtrados.filter(e => e.region === r).length : undefined,
        }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 my-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
              className={cn(
                "inline-flex items-center gap-1.5 h-[1.625rem] px-[0.5625rem] rounded-[0.375rem] border text-xs cursor-pointer transition-colors",
                filtro === f.valor
                  ? "border-transparent bg-hundida-2 text-tinta font-medium"
                  : "border-linea bg-transparent text-tinta-2 hover:bg-realce"
              )}
            >
              {f.valor !== 'todos' && <Punto estado={f.valor} />}
              {f.rotulo}
              {expedientes && <span className="font-normal text-tenue cifras">{cuentaRegion[f.valor]}</span>}
            </button>
          ))}
        </div>
        <label className="relative flex-[0_1_16.25rem] min-w-[11.25rem]">
          <ListFilter className="w-3.5 h-3.5 text-tenue absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={`Filtrar en ${region}`}
            aria-label={`Filtrar los expedientes de ${region} por número, rendición, fondo, fecha o estado`}
            className="w-full h-7 bg-campo border border-linea rounded-[0.375rem] pl-8 pr-2.5 text-sm text-tinta placeholder:text-tenue outline-none focus:border-acento transition-colors"
          />
        </label>
      </div>

      {error && (
        <BandaError className="mb-3" onReintentar={() => cargarExpedientes(true)}>{error}</BandaError>
      )}

      <Panel className="overflow-x-auto">
        <div className="min-w-[52.5rem]">
          <div className="grid items-center gap-x-3 h-8 px-3.5 border-b border-linea text-xs text-tenue" style={{ gridTemplateColumns: COLUMNAS }}>
            <span>Estado</span><span>Rendición</span><span>Expediente</span><span>Fecha</span>
            <span className="text-right">Pagos</span><span>Hallazgos</span><span className="text-right">Importe</span>
          </div>

          {cargando && !expedientes ? (
            <>
              <FilasEsqueleto filas={9} columnas={COLUMNAS} />
              <p className="sr-only" role="status">Leyendo el Google Sheet…</p>
            </>
          ) : grupos.length === 0 ? (
            <Vacio accion={hayFiltro ? (
              <button type="button" onClick={() => { setBusqueda(''); setFiltro('todos'); }}
                className="text-sm font-medium text-acento bg-transparent border-none p-0 cursor-pointer hover:underline">
                Quitar los filtros
              </button>
            ) : undefined}>
              {error && !expedientes
                ? 'No se pudieron leer los expedientes.'
                : hayFiltro
                  ? `Ningún expediente de ${region} coincide con el filtro.`
                  : `Todavía no hay expedientes de ${region} en el Google Sheet.`}
            </Vacio>
          ) : grupos.map(g => {
            const conHallazgos = g.errores > 0 || g.revisar > 0;
            const abierta = hayFiltro || (alternadas[g.titulo] ?? conHallazgos);
            return (
              <React.Fragment key={g.titulo}>
                <button
                  type="button"
                  onClick={() => alternar(g.titulo, abierta)}
                  aria-expanded={abierta}
                  className="w-full flex items-center gap-2 h-[2.125rem] pl-2.5 pr-3.5 bg-barra border-none border-b border-linea cursor-pointer text-left hover:bg-barra-activa/60 transition-colors"
                  style={{ borderBottom: '1px solid var(--color-linea)' }}
                >
                  <ChevronRight className={cn("w-3.5 h-3.5 text-tinta-2 transition-transform duration-150", abierta && "rotate-90")} aria-hidden="true" />
                  <span className="text-sm font-semibold text-tinta">{g.titulo}</span>
                  <span className="text-xs text-tenue">{g.total} {g.total === 1 ? 'expediente' : 'expedientes'}</span>
                  <span className="flex-1" />
                  <span className="flex items-center gap-3">
                    {g.errores > 0 && <Contador estado="error">{g.errores} error</Contador>}
                    {g.revisar > 0 && <Contador estado="revisar">{g.revisar} revisar</Contador>}
                    {!conHallazgos && <Contador estado="ok">Todo OK</Contador>}
                  </span>
                </button>
                {abierta && g.items.map(e => {
                  const claves = hallazgosPorId.get(e.id) || [];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => irA('lector', e.id)}
                      className="w-full grid items-center gap-x-3 h-9 px-3.5 bg-transparent border-none cursor-pointer text-left text-sm hover:bg-realce transition-colors"
                      style={{ gridTemplateColumns: COLUMNAS, borderBottom: '1px solid var(--color-linea-suave)' }}
                    >
                      <span><EstadoBadge estado={estadoDe(e.estado)} /></span>
                      <span className="font-medium text-tinta">FF N° {e.rendicion || '—'}</span>
                      <span className="font-mono text-xs text-tinta-2 truncate">{e.expediente}</span>
                      <span className="text-tinta-2 cifras">{e.fecha || '—'}</span>
                      <span className="text-right text-tinta-2 cifras">{e.nPagos}</span>
                      <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {claves.length === 0
                          ? <span className="text-tenue">—</span>
                          : claves.slice(0, 6).map(c => <Clave key={c.id} estado={c.estado}>{c.id}</Clave>)}
                        {claves.length > 6 && <span className="text-xs text-tenue">+{claves.length - 6}</span>}
                      </span>
                      <span className="text-right cifras text-tinta">
                        {typeof e.result.totalAmount === 'number' ? formatCurrency(e.result.totalAmount) : ''}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
