import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, ExternalLink, FileText, Loader2, RefreshCw, Download, Search, Table2, X, XCircle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import type { ArchivoPdf, ExpedienteLector } from '../../api/expedientes';
import { ResultadosExpediente } from './ResultadosExpediente';
import { PdfScrollViewer } from './PdfScrollViewer';
import { datosRevisivaLector, descargarRevisiva } from '../lib/revisiva';
import { ClaveAcceso, guardarClave, leerClave } from './ClaveAcceso';

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
    <div className="fixed top-0 right-0 bottom-0 z-50 w-full lg:w-[var(--ancho-pdf)] border-l-[0.5px] border-[#E2E0D8]"
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
        className="hidden lg:block absolute left-0 top-0 h-full w-[6px] -ml-[3px] cursor-col-resize z-10 hover:bg-[#004741]/40 transition-colors"
        title="Arrastrar para cambiar el ancho"
      />
      <div className="h-full w-full bg-[#F2EFE6] shadow-xl flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-[0.5px] border-[#E8E6DE]">
          <span className="text-sm font-medium text-slate-800 truncate">{archivo.nombre}</span>
          <div className="flex items-center gap-1 shrink-0">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir en una pestaña nueva"
                className="p-1.5 text-slate-500 hover:text-[#004741] hover:bg-[#E8EFEE] rounded-[6px]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button type="button" onClick={onCerrar} title="Cerrar"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-[#E5E1D5] rounded-[6px] bg-transparent border-none cursor-pointer outline-none">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="p-6 text-sm text-[#A32D2D]">{error}</div>
          ) : base64 ? (
            <PdfScrollViewer base64={base64} fileName={archivo.nombre} />
          ) : (
            <div className="p-6 text-sm text-[#9A9890] flex items-center gap-2">
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
      e === 'OK' ? "bg-[#D4E8E6] text-[#003330]" :
      e === 'ERROR' ? "bg-[#FCEBEB] text-[#A32D2D]" :
      "bg-amber-50 text-amber-800"
    )}>
      {e === 'OK' ? <CheckCircle2 className="w-3 h-3" /> : e === 'ERROR' ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {e === 'OK' ? 'OK' : e === 'ERROR' ? 'Con errores' : 'A revisar'}
    </span>
  );
}

export function ExpedientesLector() {
  const [clave, setClave] = useState<string>(leerClave);
  const [expedientes, setExpedientes] = useState<ExpedienteLector[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
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

  const cargar = useCallback(async (conClave: string) => {
    if (!conClave) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch('/api/expedientes', { headers: { 'x-lector-key': conClave } });
      if (r.status === 401) {
        guardarClave('');
        setClave('');
        setError('La clave de acceso no es correcta.');
        return;
      }
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
      setExpedientes(datos.expedientes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron leer los expedientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { if (clave) cargar(clave); }, [clave, cargar]);

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

  if (!clave) {
    return <ClaveAcceso titulo="Expedientes del lector" error={error} onClave={setClave} />;
  }

  if (actual) {
    return (
      <div ref={columnaRef} style={anchoColumna ? { width: anchoColumna.ancho, maxWidth: 'none', marginLeft: anchoColumna.corrimiento } : undefined}>
        <button
          type="button"
          onClick={() => { setSeleccionado(null); setExpandedPayment(null); }}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#004741] transition-colors cursor-pointer bg-transparent border-none outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a los expedientes del lector
        </button>
        {actual.archivos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-2 px-1">
              Documentos del expediente ({actual.archivos.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {actual.archivos.map(a => (
                <button
                  key={a.clave}
                  type="button"
                  onClick={() => setPdfAbierto(a)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2EFE6] border-[0.5px] border-[#E2E0D8] rounded-[7px] text-xs text-slate-700 hover:text-[#004741] hover:bg-[#E8EFEE] transition-all cursor-pointer outline-none"
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
            className="inline-flex items-center gap-2 py-[7px] px-[13px] bg-[#004741] text-white text-[13px] font-medium rounded-[7px] hover:bg-[#003330] transition-all cursor-pointer outline-none"
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
          <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shadow-none">
            <Table2 className="w-6 h-6 text-[#9A9890]" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900">Expedientes del lector</h2>
            <p className="text-xs text-[#9A9890] mt-0.5">
              Auditados por el lector y exportados al Google Sheet{expedientes ? ` — ${expedientes.length} en total` : ''}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cargar(clave)}
            disabled={cargando}
            className="px-3 py-1.5 bg-[#F2EFE6] border border-[#D3D1C7] hover:bg-[#E5E1D5] text-slate-700 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => { guardarClave(''); setClave(''); setExpedientes(null); }}
            className="px-3 py-1.5 bg-transparent text-slate-500 hover:text-slate-900 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none"
            title="Olvidar la clave en este navegador"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="flex w-fit max-w-full overflow-x-auto p-[3px] bg-[#EEECE5] rounded-[8px] mb-6 gap-[2px] items-center select-none">
        {REGIONES.map(r => {
          const cantidad = filtrados.filter(e => e.region === r).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={cn(
                "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] border-none",
                region === r
                  ? "bg-[#F2EFE6] border-[0.5px] border-[#E2E0D8] rounded-[6px] text-[#004741] font-medium shadow-none"
                  : "bg-transparent text-[#6B6A65] font-normal"
              )}
            >
              {r}{expedientes ? ` (${cantidad})` : ''}
            </button>
          );
        })}
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-[#9A9890] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por N° de expediente, rendición, fondo, fecha o estado"
          className="w-full bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[8px] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#004741]"
        />
      </div>

      {error && (
        <div className="bg-[#FFF8F8] border border-[#F8CCCC] rounded-[12px] p-4 mb-6 text-xs text-[#A32D2D]">{error}</div>
      )}

      {cargando && !expedientes ? (
        <div className="p-16 text-center text-[#9A9890] text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Leyendo el Google Sheet…
        </div>
      ) : grupos.length === 0 ? (
        <div className="p-16 text-center border-[0.5px] border-dashed border-[#E8E6DE] rounded-[12px] bg-[#F2EFE6]/50">
          <p className="text-[#9A9890] font-medium text-sm">
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
            <div key={g.titulo} className="bg-[#EEECE5]/60 border-[0.5px] border-[#E8E6DE] rounded-[12px] overflow-hidden">
              <button
                type="button"
                onClick={() => alternar(g.titulo)}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-5 py-4 bg-transparent border-none cursor-pointer outline-none text-left hover:bg-[#E5E1D5]/60 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronRight className={cn("w-4 h-4 text-[#9A9890] transition-transform duration-200", abierta && "rotate-90")} />
                  <span className="text-sm font-medium text-slate-800">{g.titulo}</span>
                  <span className="text-xs text-[#9A9890]">{g.items.length} {g.items.length === 1 ? 'expediente' : 'expedientes'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {errores > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FCEBEB] text-[#A32D2D]">{errores} con errores</span>}
                  {revisar > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">{revisar} a revisar</span>}
                  {errores === 0 && revisar === 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#D4E8E6] text-[#003330]">Todo OK</span>}
                </div>
              </button>
              {abierta && (
              <div className="space-y-3 px-4 pb-4">
                {g.items.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { setSeleccionado(e.id); setExpandedPayment(null); }}
                    className="w-full text-left bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] p-5 rounded-[12px] shadow-none flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-[#ECE8DC] transition-all cursor-pointer outline-none"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <EstadoChip estado={e.estado} />
                      <span className="text-sm font-medium text-slate-800">FF N° {e.rendicion || '—'}</span>
                      <span className="text-xs font-medium bg-[#E8E4D8] text-slate-500 border border-[#E8E6DE] px-2 py-0.5 rounded-md font-mono">
                        Exp. {e.expediente}{e.fecha ? ` (${e.fecha})` : ''}
                      </span>
                      <span className="text-xs text-[#9A9890]">{e.nPagos} {e.nPagos === 1 ? 'pago' : 'pagos'}</span>
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
