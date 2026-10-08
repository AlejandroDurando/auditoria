import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, ExternalLink, FileText, Loader2, RefreshCw, Download, Search, Table2, X, XCircle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import type { ArchivoPdf, ExpedienteLector } from '../../api/expedientes';
import { ResultadosExpediente } from './ResultadosExpediente';
import { PdfScrollViewer } from './PdfScrollViewer';
import { datosRevisivaLector, descargarRevisiva } from '../lib/revisiva';
import { ClaveAcceso } from './ClaveAcceso';
import { cargarExpedientes, fijarClave, useExpedientesLector } from '../lib/expedientesLector';
import { irA, useRuta, volverA } from '../lib/navegacion';

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
function VisorPdf({ archivo, clave, onCerrar, ancho, onAncho }: {
  archivo: ArchivoPdf; clave: string; onCerrar: () => void; ancho: number; onAncho: (px: number) => void;
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
    <div className="fixed top-0 right-0 bottom-0 z-50 w-full lg:w-[var(--ancho-pdf)] border-l-[0.5px] border-linea"
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
        className="hidden lg:block absolute left-0 top-0 h-full w-[6px] -ml-[3px] cursor-col-resize z-10 hover:bg-marca/40 transition-colors"
        title="Arrastrar para cambiar el ancho"
      />
      <div className="h-full w-full bg-superficie shadow-xl flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-[0.5px] border-linea">
          <span className="text-sm font-medium text-slate-800 truncate">{archivo.nombre}</span>
          <div className="flex items-center gap-1 shrink-0">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir en una pestaña nueva"
                className="p-1.5 text-slate-500 hover:text-acento hover:bg-marca-suave rounded-[6px]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button type="button" onClick={onCerrar} title="Cerrar"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-realce rounded-[6px] bg-transparent border-none cursor-pointer outline-none">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="p-6 text-sm text-error">{error}</div>
          ) : base64 ? (
            <PdfScrollViewer base64={base64} fileName={archivo.nombre} />
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

function EstadoChip({ estado }: { estado: string }) {
  const e = estado.toUpperCase();
  return (
    <span className={cn(
      "px-[10px] py-[3px] rounded-[20px] text-[11px] font-medium leading-none inline-flex items-center gap-1",
      e === 'OK' ? "bg-ok-fondo text-ok-tinta" :
      e === 'ERROR' ? "bg-error-fondo text-error" :
      "bg-amber-50 text-amber-800"
    )}>
      {e === 'OK' ? <CheckCircle2 className="w-3 h-3" /> : e === 'ERROR' ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {e === 'OK' ? 'OK' : e === 'ERROR' ? 'Con errores' : 'A revisar'}
    </span>
  );
}

export function ExpedientesLector() {
  const { clave, expedientes, cargando, error } = useExpedientesLector();
  const [busqueda, setBusqueda] = useState('');
  // El expediente abierto es parte de la direccion (#/lector/<id>): el "atras"
  // del navegador vuelve a la lista.
  const ruta = useRuta();
  const seleccionado = ruta.seccion === 'lector' ? ruta.detalle : null;
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [pdfAbierto, setPdfAbierto] = useState<ArchivoPdf | null>(null);
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
      const izquierda = area + 32;
      setAnchoColumna({
        ancho: Math.max(320, window.innerWidth - anchoPdf - izquierda - 32),
        corrimiento: Math.min(0, area - contenedor),
      });
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [pdfAbierto, anchoPdf]);
  const [region, setRegion] = useState<Region>('Rafaela');
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

  useEffect(() => { if (clave) cargarExpedientes(); }, [clave]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = expedientes || [];
    if (!q) return lista;
    return lista.filter(e => [e.expediente, e.rendicion, e.hoja, e.region, e.fecha, e.responsable, e.estado]
      .some(x => (x || '').toLowerCase().includes(q)));
  }, [expedientes, busqueda]);

  // La region elegida, agrupada por agencia (pestaña del Sheet) y, dentro de
  // cada una, de la rendicion mas nueva a la mas vieja.
  const grupos = useMemo(() => {
    const salida: Array<{ titulo: string; items: ExpedienteLector[] }> = [];
    for (const e of filtrados.filter(x => x.region === region)) {
      const grupo = salida.find(g => g.titulo === e.hoja);
      if (grupo) grupo.items.push(e); else salida.push({ titulo: e.hoja, items: [e] });
    }
    salida.forEach(g => g.items.sort((a, b) => nroRendicion(b) - nroRendicion(a)));
    return salida;
  }, [filtrados, region]);

  const alternar = (titulo: string) => setAbiertas(prev => {
    const nuevo = new Set(prev);
    if (nuevo.has(titulo)) nuevo.delete(titulo); else nuevo.add(titulo);
    return nuevo;
  });

  const actual = (expedientes || []).find(e => e.id === seleccionado) || null;
  useEffect(() => {
    setExpandedPayment(null);
    setPdfAbierto(null);
    // Al volver a la lista queda en la region del expediente que se abrio
    // (puede venir del buscador del encabezado).
    if (actual) setRegion(actual.region as Region);
  }, [actual?.id]);

  if (!clave) {
    return <ClaveAcceso titulo="Expedientes del lector" error={error} onClave={fijarClave} />;
  }

  if (actual) {
    return (
      <div ref={columnaRef} style={anchoColumna ? { width: anchoColumna.ancho, maxWidth: 'none', marginLeft: anchoColumna.corrimiento } : undefined}>
        <button
          type="button"
          onClick={() => volverA('lector')}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-acento transition-colors cursor-pointer bg-transparent border-none outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a los expedientes del lector
        </button>
        {actual.archivos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-2 px-1">
              Documentos del expediente ({actual.archivos.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {actual.archivos.map(a => (
                <button
                  key={a.clave}
                  type="button"
                  onClick={() => setPdfAbierto(a)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-superficie border-[0.5px] border-linea rounded-[7px] text-xs text-slate-700 hover:text-acento hover:bg-marca-suave transition-all cursor-pointer outline-none"
                  title={a.nombre}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[260px]">{a.nombre.replace(/\.pdf$/i, '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <ResultadosExpediente
          result={actual.result}
          expandedPayment={expandedPayment}
          setExpandedPayment={setExpandedPayment}
          etiqueta={`Lector de expedientes${actual.auditado ? ` · ${actual.auditado}` : ''}`}
          onViewPdf={actual.archivos.length ? (idx) => setPdfAbierto(actual.archivos[idx] || null) : undefined}
        />
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => descargarRevisiva(datosRevisivaLector(actual),
              `Planilla revisiva ${actual.carpeta || `FF N ${actual.rendicion} ${actual.hoja}`}.pdf`.replace(/°/g, ''))}
            className="inline-flex items-center gap-2 py-[7px] px-[13px] bg-marca text-white text-[13px] font-medium rounded-[7px] hover:bg-marca-hover transition-all cursor-pointer outline-none"
          >
            <Download className="w-4 h-4" />
            Descargar planilla revisiva
          </button>
        </div>
        {pdfAbierto && <VisorPdf archivo={pdfAbierto} clave={clave} onCerrar={() => setPdfAbierto(null)} ancho={anchoPdf} onAncho={setAnchoPdf} />}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
            <Table2 className="w-6 h-6 text-tenue" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900">Expedientes del lector</h2>
            <p className="text-xs text-tenue mt-0.5">
              Auditados por el lector y exportados al Google Sheet{expedientes ? ` — ${expedientes.length} en total` : ''}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargarExpedientes(true)}
            disabled={cargando}
            className="px-3 py-1.5 bg-superficie border border-linea-fuerte hover:bg-realce text-slate-700 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => fijarClave('')}
            className="px-3 py-1.5 bg-transparent text-slate-500 hover:text-slate-900 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none"
            title="Olvidar la clave en este navegador"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="flex w-fit max-w-full overflow-x-auto p-[3px] bg-hundida rounded-[8px] mb-6 gap-[2px] items-center select-none">
        {REGIONES.map(r => {
          const cantidad = filtrados.filter(e => e.region === r).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={cn(
                "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] border-none whitespace-nowrap",
                region === r
                  ? "bg-superficie border-[0.5px] border-linea rounded-[6px] text-acento font-medium shadow-none"
                  : "bg-transparent text-tinta-2 font-normal"
              )}
            >
              {r}{expedientes ? ` (${cantidad})` : ''}
            </button>
          );
        })}
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-tenue absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por N° de expediente, rendición, fondo, fecha o estado"
          className="w-full bg-superficie border-[0.5px] border-linea rounded-[8px] pl-9 pr-3 py-2 text-sm outline-none focus:border-acento"
        />
      </div>

      {error && (
        <div className="bg-error-suave border border-error-linea rounded-[12px] p-4 mb-6 text-xs text-error">{error}</div>
      )}

      {cargando && !expedientes ? (
        <div className="p-16 text-center text-tenue text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Leyendo el Google Sheet…
        </div>
      ) : grupos.length === 0 ? (
        <div className="p-16 text-center border-[0.5px] border-dashed border-linea rounded-[12px] bg-superficie/50">
          <p className="text-tenue font-medium text-sm">
            {busqueda ? `No se encontraron expedientes de ${region} para "${busqueda}".` : `No hay expedientes de ${region} en el Google Sheet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(g => {
            const abierta = abiertas.has(g.titulo) || !!busqueda.trim();
            const cuenta = (estado: string) => g.items.filter(e => e.estado.toUpperCase() === estado).length;
            const errores = cuenta('ERROR');
            const revisar = g.items.length - errores - cuenta('OK');
            return (
            <div key={g.titulo} className="bg-superficie border-[0.5px] border-linea rounded-[12px] overflow-hidden caja">
              <button
                type="button"
                onClick={() => alternar(g.titulo)}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-5 py-4 bg-transparent border-none cursor-pointer outline-none text-left hover:bg-realce transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronRight className={cn("w-4 h-4 text-tenue transition-transform duration-200", abierta && "rotate-90")} />
                  <span className="text-sm font-medium text-slate-800">{g.titulo}</span>
                  <span className="text-xs text-tenue">{g.items.length} {g.items.length === 1 ? 'expediente' : 'expedientes'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {errores > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-error-fondo text-error">{errores} con errores</span>}
                  {revisar > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">{revisar} a revisar</span>}
                  {errores === 0 && revisar === 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ok-fondo text-ok-tinta">Todo OK</span>}
                </div>
              </button>
              {abierta && (
              <div className="space-y-3 px-4 pb-4">
                {g.items.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => irA('lector', e.id)}
                    className="w-full text-left bg-lienzo/45 border-[0.5px] border-linea p-4 sm:px-5 rounded-[10px] flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-superficie hover:border-linea-fuerte transition-all cursor-pointer outline-none caja"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <EstadoChip estado={e.estado} />
                      <span className="text-sm font-medium text-slate-800">FF N° {e.rendicion || '—'}</span>
                      <span className="text-xs font-medium bg-hundida text-slate-500 border border-linea px-2 py-0.5 rounded-md font-mono">
                        Exp. {e.expediente}{e.fecha ? ` (${e.fecha})` : ''}
                      </span>
                      <span className="text-xs text-tenue">{e.nPagos} {e.nPagos === 1 ? 'pago' : 'pagos'}</span>
                    </div>
                    <span className="text-sm font-mono font-medium text-slate-700 shrink-0">
                      {typeof e.result.totalAmount === 'number' ? formatCurrency(e.result.totalAmount) : ''}
                    </span>
                  </button>
                ))}
              </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
