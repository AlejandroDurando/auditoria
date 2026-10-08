import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileCheck2,
  Upload,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Landmark,
  Trash2,
  Plus,
  Sparkles,
  Paperclip,
  X,
  Eye,
  ExternalLink,
  Download,
  HelpCircle,
  Info,
  Loader2,
  Copy,
  PanelLeft,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Hash,
  PackageSearch,
  BookUser,
  Stamp,
  ChevronDown,
  Zap,
  Moon,
  Sun,
  Table2
} from 'lucide-react';
import { PlanillaControlFF } from './components/PlanillaControlFF';
import { ResultadosExpediente } from './components/ResultadosExpediente';
import { ExpedientesLector } from './components/ExpedientesLector';
import { BuscadorGlobal, type EntradaHistorial } from './components/BuscadorGlobal';
import { GuiaTelefonica } from './components/GuiaTelefonica';
import { irA, useRuta } from './lib/navegacion';
import type { ExpedienteLector } from '../api/expedientes';
import { Matriculador } from './components/Matriculador';
import { formatHistoryTitle, hasAccountingCode, renderBold, safeText, toSentenceCase } from './lib/formato';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { VALIDATIONS, VALIDATIONS_VIATICOS } from './constants';
import { processDocument, type AuditResult, type PaymentData } from './lib/gemini';
import { PIMYS_CODES } from './lib/codes';
import {
  AUTORIZACIONES_POR_CODIGO,
  AUTORIZACIONES_POR_SECTOR,
  ZONAS,
  ZONAS_SUCURSAL,
  getCustomCodigos,
  getCustomSectores,
  addCodigo,
  removeCodigo,
  addSector,
  removeSector,
  type AutorizacionCodigo,
  type AutorizacionSector,
} from './lib/authorizations';
import { PdfCanvasViewer } from './components/PdfCanvasViewer';
import { PdfScrollViewer } from './components/PdfScrollViewer';
import { InteractiveNormativa } from './components/InteractiveNormativa';
import { useRef } from 'react';
import { SECTOR_MAPPING, datosRevisivaAuditoria, descargarRevisiva } from './lib/revisiva';
export { SECTOR_MAPPING };

const EPE_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUYAAACaCAMAAADighEiAAAAmVBMVEX///8AN24ANW0AGWD4+foAM2wAMWv09vg6WIMAMW0bQXNGZo6lscMAJ2bd5OwAJWUALGgAHmJWcZQAImQAHWIAKmjo7fLFztrQ2OF7jqkAGGAgSHmdqr66xdNof57W3uauuspyh6SElq8AP3WNnbQ4VoEtUX9lfJxDYYqTpLq0v82rtse/ydbm6e6CkqsrU4FbdJYADl0AAFeGYhOSAAANgklEQVR4nO2da2OyPA+Ab6qgiFAQEZwHcDoPUzef9///uFd0B4s0bSF1m9v12bVLekqTNPz7p0ZrH2fjxfTgrJejuaEAMZh2FpHKH18zHy3bvenLZrydJIOWohBC2V5Hc6Ly34xUukm707URhG7kW5ZJlPoxDHPNtDX11f68CDEIMS0/ilwaBuRp1U3rqTDdvstmn2RTks50ZLtpTlY+dX1TUXmf+DOmvVezakMlENN2w/nCq6jC5mRq15NtKNdRMpyHdj1RozHTYs01XQKJQmdXQYnpsBP6lTV4oiAbh+clrdnPEfp82WTzoW57JRArHMWKSpy8IsjmPos7ypYhxgIMkstG0wChyRLMoKdy3kyWAb5sZSRPKEo8dsWItwtRGi3BN6VXdtJGko0O4I4GqwbSUUDmzcuGuy5OsyWY/a6UEluzBzTZ4BWQWTXNkk/MNtPyEK3hEsKFhBYnJtopV5CtOFyHoPbm+4G9YtruWWgtl9AQ6rG56uPJZvWAnpIO5ozxX5jG25hm4zVBBmsxHWEaXAWTmKHbR5XUZTasVgdvLpRBKHip2WLt+Gdcvtk4RLZIQsag2+vcGnNM6JY7RDYTKNc2cChuTyRipkeiyWz8xH3karGHbWzxpn5zjX5XMxnTKtNn77zjcm7YTQdbNuKWm43NJfqaIx2mh7puMgksjtflCb9ru1yLbfyd65Zm4xuNshtac61BttdSNWroyfCnTBeOVrPxTOl0RF/RxpVJ/MZBYd/KnadSUNYmAHzLUs3JeFVJye441SGbuynR4kLqjDZtP3JDGtnEmHckMFlXEt9NRmRamxM/jIQTOrq6y2ykzmhV2Uh2rcWsL+zGcgOrvRpusjjxBq3mdRtCPK69QyKBs+RMy4s3TihQJCnajs8NCdn69tNZtnRfSbYTqWguksh1ul7l9s/w3WRkLqXGE15P8M822LY8kX/2KNu66yHEx5ojwS2JjsbycnLZcrcoc6nSjmADcjNGtqVg9rqdDYJsOVP4ILNot+Y8PPPItQV41h6HGXhksJEm+LeGTccosh2J4Y2RKjnoAfhuMshZUsYSWj1MTDcJwSVNHSTZRP+U0ZcMI4p54vYjF2P7ZAsta+aMgSO6AZpsoq0mUJSQT5PvJqMTtaYGUNbBpXN/A8tWZvpVpAVaVYg97fl7vTjGVgD0/5KPI6MFntJSUQdZZtAlMFLctCBS/ng1VHco8J+2P+4xM+jsjEpvcxXxoJ5AN6gqE/4Co6ptgb4ie//2qz30KzJHlA1OTlJebBAbrlBqZmMOqMaPRQ3O2VA10wJiAN2UFM05AXw3WbmzBAJS0McRM4DCgNYa7kGNR2hYVQ9QGL7ZGPFd/xwgl9uHwQNOWSqRgCNNC8qLvLrk12PE7cqVS3i4oAOc1O/zDDCwrtJXa/IM2VXqkwSE35XyNuVFgIber0QTyJIrBNBrAvqjg5qprCzALhzuxX/OMIYuyjSTkQ3z8BxAt2lci+BfzHeTGaouljVkfb+N/gDKpSQdLIdEDpjhJZuTK0nGXdRkqShTApkXxJeRDfFacRxVaN6HqOc0cG4q21Xgcn0Po4FpV6jn9ABM7LZVdyyYA7ezQvxQCHh2vI8+7L3wq+bdl7GD3cjteizZmz/gJlNzEYBG2nGjPRvfgsTeurJdGjGC8LtZD8o6hwA3mdoKc8D/+n1Hf9Er2+XI8ycIBuwdaMDvK1QyPg5wxOPhbbmivsC54nLkW7CDvS4hY3am/IMzULB30hE8y96Pq6Y4qlqHy5HnW3IosEcUsFf1ZXU4yBzRI4J3+XTLdnFEgXeB2pAR44sdc9cimQ88mDTePXdfeiPbFeVM2O/52BrfPBiFRwigO642lnQ2GQlEhCF1fUu8BZH+/iaykUsHKXilqo11YNR4uEE22UWyrd7kNebCoPZ4WJWCf0ivVXDGHH3cKvleOQwu78ktvYIVckBUH2JXIfhwuMEmem0uHaSg064+rBMRDFYgQT/nv6c3r/fSJE6Qnx0UCJhra6LXAMnxL6IrQDAXg0tPrL7npCcemK1R/yME69LA0mw2Ni48e/w8OQwKwQ6+2YiExfh+9Y4aIxs/boyBhVurQ9jdnLkz6b1ZMDlrYGy1NgXfueZHl5bBOkf1ThHGQSpwJdUkYt1kaqVZFCG0XfBu6H3IxDhI9T72YZ2IrZoFVEBIcBUJ1rvSmLi6XjWy0dlUn1gkMq7D3HrVyERn+anYOaZl14J9mBhrs1Gt8KUkrrjQKhu9NInBEXMnzVY9GLF0+a2s0CnNSQCPGDfDlA3siv/muhJ6NhA/cDjxBzitAjO6CpvfuMlk/1boRwyxqDvjZseA5vd7dgoO4GVQPckLBNe1afpuYPYyoD/wMqj67gEGdE34qNlkkN/KtGSx/fxxZPAQLmfjBA6Dga/3cDNPQGcSWGRGGSAGaTk9WVbT4Wa7S2XS7YFw7lVNybpANwsywky5Akq8BXjPpC6B8khx08ngiDjFzHLhZ6OKCn1VBdyM4XI9qoBWCOo+zHeTwYW+qgM6DBSThgSAVgFq4jfmIwQ5wGzsQkGWmuzB+AhmeiN/iSHnon4gkA3VAAdLhqm/+eHDP8yAQl/1gLP3UKcjnFoAFKpShW/voL6VugS+fkaYi0AQ1AqwbjIef6OKUA/NCwRBrRBxFTThoDjBegUMuMkspDoPV4CPi470EU9rgeOFUMWsbA7AIwTcRyOXiGIk9IBmhHui8juRgVGtg+/Z1GU2/hOd1UZenBmtWocw8YrQzkvtB018N5mlyWzMkZFtiPNYSyJzgvghdRYTr3qxJMBsxPVZsUhkThxlC53Fcx3Zzsjly1kRDexlL/ewxHGcpILsWI+tsdQC3q5mNf9/CLnY+Jtsq9x7FCeqsr2xk6+TalrWqRgapa6I/9hHCHzXtzazMSfWI1tW1hf43o2LoEAgZbYcfom3Yj0xZJxKoQtBwcHykQdLdlSkUAAPqNVho3r+ioAlO6rSLx95ucqNShCL6QFwk5UXNkUDrmZUjQdOX0/o2eYFrwbfEC6k2eNTbcuC4F4Y9uhpSjarHb4Bp8tN9sHAwM5k479aFlTMU6fgXebf3HWajWcEFfPUAYpUPCOn+Lpbpnl+tYIQNzejDPjxdQXZgJHvNlDHjNUOUNACN7ZUzhbx2yaGIJ1kEmHuIX0m9RW4lJlazcY3di6mbAEYMU1MxGSliLkvAdFVVF8+l9RAlM2HR76F9wWLQiUTfgKx+aRVfR80EWUTpkF0+0iDVkhcWXHtHVu32fjBNkCSTSJxZTBD+IahcZVqBLjJUMPuIK1ZhKJIqbi6NwsQHhKy2mku+bU6Mj06K5dtGLoIssmFSwebEa17arPZrEBBHK1usmtaCLLJO0iTRTvIP5RbeegKbjKgyARuwSQp2dYBrSWbysgPtsNXM6I08q0K3x1mSy4BJd5CZCXJyZYNX4lP3Wqy8T4yxcdLto/T3tKI+kGYO4WjI75vi5NiTcYmGIe8H/q3MRvL8JIsl22uKptVdeTztw9ePMm23fF48zicrXqOCNbeGa95v1ujJg9XoIJsqNV+//jjjz/++OOPP/74A53mHfFlSmwt/IfGvfC/27qkPtkYCE6+7wJunWt5sg69HyXmuWZfsap3y7tRIjFNO6KhvoR/LnG7f4PKl/ohVuQGtLNeLZ4Fb+E1kDr0hyuRmJbvhkF/dFhsk4Ge58oCvN7DLUrZaoLk+qPzdu9lG988zPHJYCYsLP0tISf9BQ/z3uM43t98AbO0hlih9dtx1N/xADGWzqy7U7Jpdl1NLEy9JXNxMc38PceD4Qw3E6/C/FuHwpcL1fghSiRmPv+sTnu1mSTVrUES3aKC9DfkeABHbtgw27NFlu7rmtPpYuSi5jR+f0z7eID482VvkcWI9ku6aAdRhYj3D4MYJwOwYb+uXrqJp+M6tx+/uj/TOJHiNP8iq+O8dHe11y+M13WOmryvOUlOB0gQLXuzcSxVjAuDQdehrn0XmjwZgNS12rMxwvNeZVrZwQx1lvHVDTHtyA2ikTM9GjBfeQFpTVZh6P+4wzv3INCwHyxXmyz9Gg/CFbtpJ0TJW74Fnx6ELP7iC/AVrXhoBd97Tp49WP3GvPfYjfffY/6Vkbwsw295p8sPkJAaS2eo6EH4KpLFqPGNTPOzAdOYO8PNrooH4QvxNk8R6jOxyvqj5mg9HU/Sr4sS18Mbr/tfpMncgDnNv9lmkv6s+VfGoLu26S2viycDkNrzp8M4S77v+aHOYHtw9WuS5CG4owForKePWfKFIRCNtJ57Ps5DuDIF5gYMjcxRb7GNb3+Buy2tydRADrKcQ0h98nQYbuMfYcCg0NzNkObkaf5R13BevrUBrY94OKr5OtOkgXX2YN35+oVpJo9GDa85XU72g1+twE/SxVO1t6C2r71kzM/C27w+qJrmJHR+z0kizX689lUiOT7B/QjN/bDvOn3JSA7pH37+pU4frW3PpOL4QzTH/azUHTJ4Xvmw19wMZr/RPFSmuZsaXNOcuCOcisa/gWY8m5fGH8w+6oe57p9mMpxfGZT09QYF3e6O5HF5eV20fKQPK/w+0s0oPF8XSbi+T9fhjfA2a+qalr0V//QPkP3W6d25wf1/1c9KegDe7akAAAAASUVORK5CYII=';


const MODELS = [
  { id: 'gemini-3.5-flash',       label: 'Gemini Rápido (3.5 Flash)', desc: 'Para muchos archivos / Recomendado' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini Complejo (Pro)',     desc: 'Para texto difuso / Lento' },
] as const;
type ModelId = typeof MODELS[number]['id'];

function RapidaTab({ selectedModel, setSelectedModel, showNotification, saveToHistory }: {
  selectedModel: ModelId;
  setSelectedModel: (m: ModelId) => void;
  showNotification: (title: string, msg: string, type?: 'success' | 'error' | 'info') => void;
  saveToHistory: (result: import('./lib/gemini').AuditResult, id: string) => void;
}) {
  const [files, setFiles] = useState<Array<{ name: string; base64: string }>>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<import('./lib/gemini').AuditResult | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(0);
  const [leftWidth, setLeftWidth] = useState(420);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; w: number } | null>(null);

  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, w: leftWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const delta = e.clientX - dragStartRef.current.x;
      const newW = Math.min(Math.max(dragStartRef.current.w + delta, 280), 700);
      setLeftWidth(newW);
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragStartRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    Promise.all(
      acceptedFiles.map(
        f =>
          new Promise<{ name: string; base64: string }>(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
              const base64 = (e.target?.result as string).split(',')[1];
              resolve({ name: f.name, base64 });
            };
            reader.readAsDataURL(f);
          })
      )
    ).then(nuevos => {
      setFiles(prev => [...prev, ...nuevos]);
      setResult(null);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  } as any);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setActiveFileIdx(i => (i >= idx && i > 0 ? i - 1 : i));
    setResult(null);
  };

  const handleAnalizar = async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await processDocument(files, 'Rapida', selectedModel as any);
      setResult(res);
      setExpandedPayment(0);
      if (res?.payments?.length) {
        saveToHistory(res, `rapida-${Date.now()}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = /429|quota|RESOURCE_EXHAUSTED|high demand|UNAVAILABLE/.test(msg);
      showNotification(
        'Error',
        isRateLimit
          ? 'Límite de solicitudes de Gemini alcanzado. Esperá 1-2 minutos y volvé a intentarlo.'
          : 'No se pudieron analizar los comprobantes. Si subiste muchos archivos, probá con menos por vez.',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const activeFile = files[activeFileIdx] || null;

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-acento" />;
    if (status === 'fail') return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="flex flex-1 min-h-0 h-full gap-0">
      {/* Left panel — form + results */}
      <div style={{ width: leftWidth }} className="shrink-0 flex flex-col h-full overflow-y-auto bg-hundida p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-superficie rounded-[10px] border-[0.5px] border-linea flex items-center justify-center caja">
            <Zap className="w-4 h-4 text-acento" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold text-tinta tracking-tight leading-none">Auditoría Rápida</h1>
            <p className="text-[11px] text-tenue mt-0.5">Pagos sueltos, sin carátula ni Libro Diario.</p>
          </div>
        </div>

        {/* Model selector */}
        <div className="mb-3">
          <select
            value={selectedModel}
            onChange={(e) => {
              const val = e.target.value as ModelId;
              setSelectedModel(val);
              localStorage.setItem('epe_selected_model', val);
            }}
            className="w-full px-3 py-2 text-xs font-medium rounded-[8px] border border-linea bg-superficie text-slate-700 outline-none cursor-pointer hover:border-acento/40 transition-colors"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-[1.5px] border-dashed rounded-[10px] p-5 text-center cursor-pointer transition-colors mb-3",
            isDragActive ? "border-acento bg-marca-suave" : "border-linea bg-superficie hover:border-acento/40"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-6 h-6 text-tenue-2" />
            <p className="text-xs text-tenue">
              {files.length ? 'Agregá más comprobantes o hacé clic' : 'Arrastrá los comprobantes o hacé clic'}
            </p>
            <p className="text-[10px] text-tenue-2">Solo PDF · podés subir varios pagos juntos</p>
          </div>
        </div>

        {/* Lista de archivos cargados */}
        {files.length > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue">
                {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
              </span>
              <button
                onClick={() => { setFiles([]); setResult(null); setActiveFileIdx(0); }}
                className="text-[10px] font-medium text-tenue hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none outline-none p-0"
              >
                Limpiar todo
              </button>
            </div>
            {files.map((f, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFileIdx(idx)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-colors border-[0.5px]",
                  idx === activeFileIdx
                    ? "bg-marca-suave border-acento/30"
                    : "bg-superficie border-linea hover:bg-hundida"
                )}
              >
                <FileText className={cn("w-3.5 h-3.5 shrink-0", idx === activeFileIdx ? "text-acento" : "text-tenue")} />
                <span className="text-[11px] text-tinta truncate flex-1 min-w-0" title={f.name}>{f.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="text-tenue hover:text-red-500 transition-colors shrink-0 bg-transparent border-none outline-none p-0 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAnalizar}
          disabled={!files.length || isProcessing}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all mb-5",
            files.length && !isProcessing
              ? "bg-marca text-white hover:bg-marca-hover"
              : "bg-linea text-tenue-2 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Analizando...</span></>
          ) : (
            <><Zap className="w-4 h-4" /><span>{files.length > 1 ? `Analizar ${files.length} archivos` : 'Analizar comprobante'}</span></>
          )}
        </button>

        {/* Results */}
        {result && result.payments && result.payments.length > 0 && (
          <div className="space-y-3">
            {/* Resumen del lote */}
            <div className="bg-marca-suave border-[0.5px] border-acento/20 rounded-[10px] p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-acento">
                  {result.payments.length} {result.payments.length === 1 ? 'pago analizado' : 'pagos analizados'}
                </span>
                <span className="text-[11px] font-semibold text-acento font-mono">
                  {formatCurrency(result.payments.reduce((a, p) => a + (typeof p?.amount === 'number' && !isNaN(p.amount) ? p.amount : 0), 0))}
                </span>
              </div>
              {result.overallSummary && (
                <p className="text-[11px] text-tinta-2 leading-relaxed mt-1.5">{safeText(result.overallSummary)}</p>
              )}
            </div>

            {/* Un bloque por pago */}
            {result.payments.map((pago, idx) => {
              const vals = pago?.validations || [];
              const errores = vals.filter(v => v?.status === 'fail').length;
              const obs = vals.filter(v => v?.status === 'warning').length;
              const abierto = expandedPayment === idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "bg-superficie border-[0.5px] rounded-[10px] overflow-hidden caja",
                    errores > 0 ? "border-l-2 border-l-error-acento border-linea" : "border-linea"
                  )}
                >
                  <button
                    onClick={() => setExpandedPayment(abierto ? null : idx)}
                    className="w-full text-left px-4 py-3 hover:bg-hundida/50 transition-colors cursor-pointer bg-transparent border-none outline-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-tinta leading-tight truncate" title={pago?.providerName}>
                          {pago?.providerName || '—'}
                        </p>
                        <p className="text-[10px] text-tenue mt-0.5">N° {pago?.orderNumber || '—'}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-acento font-mono leading-tight">
                            {formatCurrency(pago?.amount)}
                          </p>
                          <p className="text-[10px] mt-0.5">
                            {errores > 0 ? (
                              <span className="text-error font-medium">{errores} {errores === 1 ? 'error' : 'errores'}</span>
                            ) : obs > 0 ? (
                              <span className="text-amber-700 font-medium">{obs} obs.</span>
                            ) : (
                              <span className="text-acento font-medium">Sin observaciones</span>
                            )}
                          </p>
                        </div>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-tenue transition-transform shrink-0", abierto ? "rotate-180" : "")} />
                      </div>
                    </div>
                  </button>

                  {abierto && (
                    <div className="border-t border-linea divide-y divide-linea">
                      {vals.map((v, vi) => (
                        <div key={v?.id || vi} className="flex items-start gap-2.5 px-4 py-2.5">
                          {statusIcon(v?.status)}
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-tinta uppercase mr-1.5">{v?.id}</span>
                            <p className="text-[11px] text-tinta-2 mt-0.5 leading-relaxed">
                              {(safeText(v?.observations) || '—').split('\n').map((line, li, arr) => (
                                <React.Fragment key={li}>
                                  {renderBold(line)}
                                  {li < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {result && (!result.payments || result.payments.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4">
            <p className="text-[12px] font-semibold text-amber-800 mb-1">No se detectaron pagos</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              La IA no pudo extraer ningún pago de los archivos cargados. Probá subiendo menos archivos por vez, o verificá que los PDFs sean legibles.
            </p>
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onDividerMouseDown}
        className="w-[5px] shrink-0 h-full cursor-col-resize bg-linea hover:bg-marca/40 transition-colors active:bg-marca/60"
      />

      {/* Right panel — PDF viewer */}
      <div className="flex-1 min-w-0 h-full bg-hundida-2 flex flex-col">
        {activeFile ? (
          <PdfScrollViewer base64={activeFile.base64} fileName={activeFile.name} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-tenue-2">
            <FileText className="w-12 h-12" />
            <p className="text-sm">Los comprobantes aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

const SECCION_DE_TAB: Record<string, string> = {
  Dashboard: 'dashboard', Historial: 'historial', Lector: 'lector', Revisiva: 'revisiva',
  Planilla: 'planilla', Rapida: 'rapida', 'Códigos': 'codigos', Matriculador: 'matriculador',
  Autorizaciones: 'autorizaciones', Normativa: 'normativa', Guia: 'guia',
};
const TAB_DE_SECCION: Record<string, string> = Object.fromEntries(
  Object.entries(SECCION_DE_TAB).map(([tab, seccion]) => [seccion, tab]));
const NOMBRE_DE_TAB: Record<string, string> = {
  Lector: 'Expedientes del lector', Rapida: 'Auditoría rápida', Revisiva: 'Planilla revisiva',
  Planilla: 'Planilla control', Autorizaciones: 'Autorizaciones PIMyS', Guia: 'Guía telefónica',
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('epe_dark_mode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    try { localStorage.setItem('epe_dark_mode', String(darkMode)); } catch {}
  }, [darkMode]);

  // La seccion activa vive en la direccion (#/historial, #/lector/<id>…): el
  // "atras" del navegador vuelve a la seccion anterior en vez de salir.
  const ruta = useRuta();
  const activeTab = TAB_DE_SECCION[ruta.seccion] ?? 'Dashboard';
  const setActiveTab = useCallback((tab: string) => irA(SECCION_DE_TAB[tab] ?? 'dashboard'), []);

  // ── Autorizaciones PIMyS agregadas por el usuario ──────────────────────────
  const [customCodigos, setCustomCodigos] = useState<AutorizacionCodigo[]>([]);
  const [customSectores, setCustomSectores] = useState<AutorizacionSector[]>([]);
  const [showFormCodigo, setShowFormCodigo] = useState(false);
  const [showFormSector, setShowFormSector] = useState(false);
  const [formCodigo, setFormCodigo] = useState({
    codigos: '', concepto: '', tipo: 'fijo' as 'fijo' | 'zona',
    firmantes: '', Rafaela: '', Noroeste: '', Oeste: '', Reconquista: '', nota: '',
  });
  const [formSector, setFormSector] = useState({ sector: '', agentes: '', jefes: '' });

  useEffect(() => {
    setCustomCodigos(getCustomCodigos());
    setCustomSectores(getCustomSectores());
  }, []);

  const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  const handleAddCodigo = () => {
    const codigos = splitList(formCodigo.codigos);
    if (!codigos.length || !formCodigo.concepto.trim()) {
      showNotification('Faltan datos', 'Indicá al menos un código y el concepto.', 'error');
      return;
    }
    if (formCodigo.tipo === 'fijo') {
      const firmantes = splitList(formCodigo.firmantes);
      if (!firmantes.length) {
        showNotification('Faltan datos', 'Indicá al menos un autorizante.', 'error');
        return;
      }
      setCustomCodigos(addCodigo({
        codigos, concepto: formCodigo.concepto.trim(), tipo: 'fijo',
        firmantes, nota: formCodigo.nota.trim() || undefined,
      }));
    } else {
      const zonas = ZONAS
        .filter(z => formCodigo[z].trim())
        .map(z => ({ zona: z, alcance: ZONAS_SUCURSAL[z], firmante: formCodigo[z].trim() }));
      if (!zonas.length) {
        showNotification('Faltan datos', 'Indicá el autorizante de al menos una sucursal.', 'error');
        return;
      }
      setCustomCodigos(addCodigo({
        codigos, concepto: formCodigo.concepto.trim(), tipo: 'zona',
        zonas, nota: formCodigo.nota.trim() || undefined,
      }));
    }
    setFormCodigo({ codigos: '', concepto: '', tipo: 'fijo', firmantes: '', Rafaela: '', Noroeste: '', Oeste: '', Reconquista: '', nota: '' });
    setShowFormCodigo(false);
    showNotification('Autorización agregada', 'El auditor la tendrá en cuenta en las próximas auditorías.', 'success');
  };

  const handleAddSector = () => {
    const agentes = splitList(formSector.agentes);
    const jefes = splitList(formSector.jefes);
    if (!formSector.sector.trim() || !agentes.length || !jefes.length) {
      showNotification('Faltan datos', 'Completá sector, agente(s) y jefe(s) autorizante(s).', 'error');
      return;
    }
    setCustomSectores(addSector({ sector: formSector.sector.trim(), agentes, jefes }));
    setFormSector({ sector: '', agentes: '', jefes: '' });
    setShowFormSector(false);
    showNotification('Autorización agregada', 'El auditor la tendrá en cuenta en las próximas auditorías.', 'success');
  };
  const [planillasOpen, setPlanillasOpen] = useState(false);
  useEffect(() => { if (activeTab === 'Revisiva' || activeTab === 'Planilla') setPlanillasOpen(true); }, [activeTab]);
  const [dashboardMode, setDashboardMode] = useState<'Expedientes' | 'Viáticos'>('Expedientes');
  const [activeCodeCategory, setActiveCodeCategory] = useState<keyof typeof PIMYS_CODES>('Sucursales');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditProgressLabel, setAuditProgressLabel] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{id: string, date: string, FF: string, summary: string, result: AuditResult}>>([]);
  const [copiedInforme, setCopiedInforme] = useState(false);
  const [copiedExpediente, setCopiedExpediente] = useState(false);
  const [copiedFecha, setCopiedFecha] = useState(false);
  const [copiedImporte, setCopiedImporte] = useState(false);
  const [pdfResponsable, setPdfResponsable] = useState('');
  const [pdfFdoFijoNo, setPdfFdoFijoNo] = useState('');
  const [pdfReparticion, setPdfReparticion] = useState('');
  const [pdfGciaSuc, setPdfGciaSuc] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [planillaInitialData, setPlanillaInitialData] = useState<{sector:string;expediente:string;fondoFijo:string;fecha:string} | null>(null);

  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [auditFilesMap, setAuditFilesMap] = useState<Record<string, { id: string; name: string; size: number; base64: string; objectUrl: string }[]>>({});
  const [activePdfViewer, setActivePdfViewer] = useState<{ fileUrl: string; fileName: string; pageNumber?: number; fileBase64?: string } | null>(null);

  const [selectedModel, setSelectedModel] = useState<ModelId>(() => {
    try {
      const saved = localStorage.getItem('epe_selected_model') as ModelId;
      return MODELS.find(m => m.id === saved) ? saved : 'gemini-3.5-flash';
    } catch {
      return 'gemini-3.5-flash';
    }
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const showNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setNotification({ title, message, type });
  }, []);

  const [pdfWidth, setPdfWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarOculta, setSidebarOculta] = useState(() => {
    try { return localStorage.getItem('sidebarOculta') === '1'; } catch { return false; }
  });
  // En un celular la barra lateral ocupaba casi todo el ancho: ahi arranca
  // oculta, se abre por encima de la pagina y se cierra al elegir una seccion.
  const [pantallaAngosta, setPantallaAngosta] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [menuMovil, setMenuMovil] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const cambio = () => { setPantallaAngosta(mql.matches); setMenuMovil(false); };
    mql.addEventListener('change', cambio);
    return () => mql.removeEventListener('change', cambio);
  }, []);
  const barraOculta = pantallaAngosta ? !menuMovil : sidebarOculta;
  const alternarSidebar = () => {
    if (pantallaAngosta) {
      setMenuMovil(v => !v);
      return;
    }
    setSidebarOculta(v => {
      try { localStorage.setItem('sidebarOculta', v ? '0' : '1'); } catch { /* sin storage */ }
      return !v;
    });
    // Las vistas que miden su ancho (panel del PDF) se vuelven a acomodar.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  };
  useEffect(() => { setMenuMovil(false); }, [activeTab]);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const sidebarDragRef = useRef<{ startX: number; startW: number } | null>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsLargeScreen(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startWidth: pdfWidth
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const newWidth = dragRef.current.startWidth - deltaX;
      
      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.85;
      setPdfWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, pdfWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isSidebarDragging || !sidebarDragRef.current) return;
      const delta = e.clientX - sidebarDragRef.current.startX;
      setSidebarWidth(Math.min(Math.max(sidebarDragRef.current.startW + delta, 180), 400));
    };
    const onUp = () => {
      if (!isSidebarDragging) return;
      setIsSidebarDragging(false);
      sidebarDragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isSidebarDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isSidebarDragging]);

  useEffect(() => {
    const saved = localStorage.getItem('epe_audit_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar entradas con formato viejo/incompatible y reparar las que tengan
          // campos de tipo incorrecto (ej. summary u overallSummary como objeto).
          const valid = parsed
            .filter(item =>
              item && typeof item === 'object' &&
              item.result && Array.isArray(item.result.payments)
            )
            .map(item => ({
              ...item,
              summary: safeText(item.summary ?? item.result?.overallSummary),
              result: {
                ...item.result,
                overallSummary: safeText(item.result?.overallSummary),
              },
            }));
          setHistory(valid);
          localStorage.setItem('epe_audit_history', JSON.stringify(valid));
        }
      } catch (e) {
        localStorage.removeItem('epe_audit_history');
      }
    }
  }, []);

  const getInitialResponsible = (res: any) => {
    if (res?.responsable) return res.responsable;
    if (res?.payments) {
      for (const p of res.payments) {
        if (p?.validations) {
          const v4 = p.validations.find((v: any) => v?.id?.toLowerCase() === 'v4');
          if (v4 && v4.observations) {
            const match = v4.observations.match(/Responsable de FF:\s*([^\n\r]+)/i) || 
                          v4.observations.match(/Responsable:\s*([^\n\r]+)/i);
            if (match && match[1]) {
              return match[1].trim();
            }
          }
        }
      }
    }
    return "";
  };

  /** Planilla revisiva de una auditoria: sector y responsable por la agencia
   *  que leyo la auditoria (lib/revisiva). Si no se identifica el sector,
   *  quedan el responsable y la reparticion que trae el expediente. */
  const revisivaDe = (res: AuditResult) => {
    const datos = datosRevisivaAuditoria(res);
    if (datos.sector) return datos;
    return {
      ...datos,
      responsable: getInitialResponsible(res),
      reparticion: res.agenciaSucursal ? formatHistoryTitle(res.agenciaSucursal) : '',
    };
  };

  useEffect(() => {
    if (result) {
      const datos = revisivaDe(result);
      setPdfResponsable(datos.responsable);
      setPdfFdoFijoNo(datos.fondoFijo);
      setPdfReparticion(datos.reparticion);
      setPdfGciaSuc(datos.gciaSuc);
      setSelectedSector(datos.sector);
    } else {
      setPdfResponsable('');
      setPdfFdoFijoNo('');
      setPdfReparticion('');
      setPdfGciaSuc('');
    }
  }, [result]);

  const saveToHistory = (auditResult: AuditResult, customId: string) => {
    const newEntry = {
      id: customId,
      date: new Date().toISOString(),
      FF: auditResult.fondoFijoId,
      summary: auditResult.overallSummary,
      result: auditResult
    };
    setHistory(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('epe_audit_history', JSON.stringify(updated));
      return updated;
    });
  };

  const abrirAuditoria = useCallback((entry: EntradaHistorial) => {
    setResult(entry.result);
    setActiveAuditId(entry.id);
    // 'Rapida' no es un modo del selector del Dashboard: su reporte se
    // renderiza igual que el de Expedientes.
    setDashboardMode(entry.result.mode === 'Viáticos' ? 'Viáticos' : 'Expedientes');
    setActiveTab('Dashboard');
  }, [setActiveTab]);
  const abrirExpedienteLector = useCallback((e: ExpedienteLector) => irA('lector', e.id), []);

  const deleteHistoryEntry = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      localStorage.setItem('epe_audit_history', JSON.stringify(updated));
      return updated;
    });
    if (activeAuditId === id) {
      setActiveAuditId(null);
      setResult(null);
    }
    showNotification('Auditoría Eliminada', 'La auditoría fue eliminada del historial con éxito.', 'success');
  };

  const exportHistory = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `respaldo_auditorias_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('Exportación Exitosa', 'El historial se ha descargado correctamente.', 'success');
    } catch (error) {
      showNotification('Error al Exportar', 'No se pudo generar la copia de seguridad.', 'error');
    }
  };

  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedData)) {
          throw new Error('Formato inválido. Debe ser una lista de auditorías.');
        }

        const isValid = importedData.every(item => item && typeof item === 'object' && 'id' in item && 'date' in item);
        if (!isValid) {
          throw new Error('Al menos una entrada de auditoría no cumple con el formato correcto.');
        }

        setHistory(prev => {
          const merged = [...importedData];
          prev.forEach(existingItem => {
            if (!merged.some(importedItem => importedItem.id === existingItem.id)) {
              merged.push(existingItem);
            }
          });
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          localStorage.setItem('epe_audit_history', JSON.stringify(merged));
          return merged;
        });

        showNotification('Importación Completa', `Se han importado ${importedData.length} auditorías al historial.`, 'success');
        event.target.value = '';
      } catch (err: any) {
        showNotification('Error al Importar', err.message || 'El formato del archivo JSON no es correcto.', 'error');
        event.target.value = '';
      }
    };
    fileReader.readAsText(file);
  };

  const getFileCategoryInfo = (fileName: string): { label: string; weight: number; color: string } => {
    const name = fileName.toLowerCase();
    if (name.includes('caratula') || name.includes('carátula') || name.includes('portada')) {
      return { label: 'Carátula', weight: 1, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    }
    if (
      name.includes('pago') || 
      name.includes('comprobante') || 
      name.includes('factura') || 
      name.includes('recibo') || 
      name.includes('vale') || 
      name.includes('ticket') || 
      name.includes('comp') || 
      name.includes('fac_') || 
      name.includes('rec_') ||
      name.includes('debito') ||
      name.includes('débito') ||
      name.includes('credito') ||
      name.includes('crédito') ||
      name.includes('banco') ||
      name.includes('extracto')
    ) {
      return { label: 'Pagos / Comprobantes', weight: 2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
    if (name.includes('libro') || name.includes('diario') || name.includes('diar') || name.includes('planilla')) {
      return { label: 'Libro Diario', weight: 3, color: 'bg-amber-50 text-amber-700 border-amber-100' };
    }
    if (name.includes('balance') || name.includes('invers') || name.includes('rendicion') || name.includes('rendición')) {
      return { label: 'Balance de Inversión', weight: 4, color: 'bg-blue-50 text-blue-700 border-blue-100' };
    }
    return { label: 'Otro formato', weight: 5, color: 'bg-hundida-2 text-slate-600 border-slate-200' };
  };

  const [selectedFiles, setSelectedFiles] = useState<{ id: string; name: string; size: number; base64: string; objectUrl: string }[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const nonPdf = acceptedFiles.some(file => file.type !== 'application/pdf');
    if (nonPdf) {
      showNotification('Archivo no permitido', 'Por favor, sube solamente archivos PDF.', 'error');
      return;
    }

    const listPromises = acceptedFiles.map(file => {
      return new Promise<{ id: string; name: string; size: number; base64: string; objectUrl: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: file.size,
            base64,
            objectUrl: URL.createObjectURL(file)
          });
        };
        reader.onerror = () => reject(new Error(`Error leyendo el archivo ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    try {
      const newFiles = await Promise.all(listPromises);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    } catch (err: any) {
      console.error(err);
      showNotification('Error de lectura', err.message || 'Error al procesar los archivos.', 'error');
    }
  }, []);

  const handleStartAudit = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Expediente vacío', 'Por favor, agrega al menos un archivo PDF para auditar.', 'info');
      return;
    }

    setIsProcessing(true);
    setAuditProgress(0);
    setAuditProgressLabel('Cargando archivos PDF e inicializando motores de auditoría...');
    setResult(null);

    // Initialize progress interval
    let currentProgress = 0;
    const interval = setInterval(() => {
      let increment = 0;
      if (currentProgress < 20) {
        increment = Math.floor(Math.random() * 4) + 4; // 4-7%
      } else if (currentProgress < 50) {
        increment = Math.floor(Math.random() * 3) + 2; // 2-4%
      } else if (currentProgress < 80) {
        increment = Math.floor(Math.random() * 2) + 1; // 1-2%
      } else if (currentProgress < 98) {
        increment = Math.random() > 0.5 ? 1 : 0.5; // 0.5-1%
      }
      
      currentProgress = Math.min(98, currentProgress + increment);
      setAuditProgress(Math.round(currentProgress));

      if (currentProgress < 15) {
        setAuditProgressLabel("Iniciando auditoría y cargando archivos PDF...");
      } else if (currentProgress < 35) {
        setAuditProgressLabel("Analizando estructura de carátulas y extrayendo metadatos...");
      } else if (currentProgress < 55) {
        setAuditProgressLabel("Leyendo 'Balance de Inversión' y verificando cuadre de saldos...");
      } else if (currentProgress < 75) {
        setAuditProgressLabel("Identificando transferencias en la planilla Libro Diario y leyendo descripciones...");
      } else if (currentProgress < 90) {
        setAuditProgressLabel("Cruzando códigos de imputación múltiples, aprobadores y comprobantes de compras...");
      } else if (currentProgress < 98) {
        setAuditProgressLabel("Validando constancias ARCA, vigencia de fechas y CUITs cruzados...");
      } else {
        setAuditProgressLabel("Estructurando informe final y consolidando resultados de auditoría...");
      }
    }, 700);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const pdfFiles = selectedFiles.map(f => ({ name: f.name, base64: f.base64 }));
      const auditResult = await processDocument(pdfFiles, dashboardMode, selectedModel, controller.signal);
      
      // Clear interval and complete progress smoothly
      clearInterval(interval);
      setAuditProgress(100);
      setAuditProgressLabel('¡Auditoría completada exitosamente!');
      
      // Small visual delay so user sees 100% complete
      await new Promise(resolve => setTimeout(resolve, 600));

      const newAuditId = Date.now().toString();
      setActiveAuditId(newAuditId);
      
      // Cache these active files for interactive viewing
      setAuditFilesMap(prev => ({
        ...prev,
        [newAuditId]: [...selectedFiles]
      }));

      setResult(auditResult);
      saveToHistory(auditResult, newAuditId);

      // Autocompletar Planilla Control con datos de la auditoría
      const rawFecha = auditResult.expedienteFecha || '';
      let fechaISO = '';
      if (rawFecha) {
        const parts = rawFecha.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const year = y.length === 2 ? `20${y}` : y;
          fechaISO = `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
      }
      setPlanillaInitialData({
        sector: auditResult.agenciaSucursal || '',
        expediente: auditResult.expedienteNumero || '',
        fondoFijo: auditResult.fondoFijoNumero || '',
        fecha: fechaISO || new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      clearInterval(interval);
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('Cancel')) {
        console.log('Auditoría cancelada por el usuario (AbortError).');
        return;
      }
      console.error('Error in processing:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRateLimit = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
      const isJsonTruncated = err instanceof SyntaxError || errMsg.toLowerCase().includes('syntaxerror') || errMsg.includes('Expected') || errMsg.includes('JSON');
      showNotification(
        'Error de Auditoría',
        isRateLimit
          ? 'Límite de solicitudes de Gemini alcanzado. La app ya reintentó automáticamente con todas las claves disponibles. Esperá 1-2 minutos y volvé a intentarlo — el límite se recupera solo.'
          : isJsonTruncated
            ? 'La respuesta de Gemini fue cortada a mitad porque el expediente tiene demasiados documentos. Soluciones: (1) Probá el modelo Pro. (2) Auditá los pagos de a uno con "Auditoría Rápida". (3) Reducí la cantidad de archivos adjuntos.'
            : selectedModel === 'gemini-3.1-pro-preview'
              ? 'Hubo un error al procesar los archivos. Al utilizar el modelo Pro con muchos archivos, es común sufrir demoras extremas o cortes por límites de tiempo del navegador. Te recomendamos reintentar seleccionando el modelo "Gemini 3.5 Flash" (Rápido) en la sección de arriba.'
              : `Error: ${errMsg.length > 200 ? errMsg.slice(0, 200) + '…' : errMsg}`,
        'error'
      );
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    showNotification(
      'Auditoría Cancelada',
      'El proceso de auditoría ha sido detenido manualmente y se han liberado los recursos asociados. Puedes volver a de iniciarla o cambiar de modelo cuando desees.',
      'info'
    );
  };

  const handleDownloadPdf = () => {
    try {
      descargarRevisiva({ responsable: pdfResponsable, fondoFijo: pdfFdoFijoNo, reparticion: pdfReparticion, gciaSuc: pdfGciaSuc });
    } catch (e: any) {
      showNotification('Error al generar PDF', e.message || 'Ocurrió un error inesperado al intentar crear el documento.', 'error');
    }
  };

  const handleViewPdf = (fileIdx: number, pageNum?: number) => {
    const filesList = activeAuditId ? auditFilesMap[activeAuditId] : selectedFiles;
    
    if (!filesList || filesList.length === 0) {
      showNotification('Archivos faltantes', "La visualización en tiempo real requiere los archivos PDF originales. Para habilitarla, puedes volver a cargarlos en la pantalla principal o usar una sesión activa.", 'info');
      return;
    }
    
    const targetIdx = (fileIdx >= 0 && fileIdx < filesList.length) ? fileIdx : 0;
    const file = filesList[targetIdx];
    
    if (file && file.objectUrl) {
      setActivePdfViewer({
        fileUrl: file.objectUrl,
        fileName: file.name,
        pageNumber: pageNum || 1,
        fileBase64: file.base64
      });
    } else {
      showNotification('Enlace no disponible', "No se encontró el enlace local para este archivo PDF.", 'error');
    }
  };

  const handleOpenPdfInNewTab = (fileUrl: string, fileName: string, pageNum?: number) => {
    const filesList = activeAuditId ? auditFilesMap[activeAuditId] : selectedFiles;
    const fileObj = filesList?.find(f => f.objectUrl === fileUrl);
    
    if (!fileObj) {
      showNotification('Archivo no encontrado', "No se encontró el archivo original para exportar.", 'error');
      return;
    }

    try {
      // Abriendo una ventana vacía y escribiendo el elemento embed
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName} - Auditoría EPE (Pág ${pageNum || 1})</title>
              <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #334155; }
                iframe, embed { border: none; width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <embed src="data:application/pdf;base64,${fileObj.base64}#page=${pageNum || 1}" type="application/pdf" />
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback: descarga directa si se bloquea popup
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${fileObj.base64}`;
        link.download = fileName;
        link.click();
      }
    } catch (e) {
      console.error("Popup block or document write error:", e);
      // Fallback a descarga
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${fileObj.base64}`;
      link.download = fileName;
      link.click();
    }
  };

  const generateReportText = useCallback(() => {
    if (!result) return "";
    
    const lines: string[] = [];
    const ffName = result.fondoFijoNumero || "N/D";
    const solicitante = result.responsable || getInitialResponsible(result) || "N/D";
    const fecha = new Date().toLocaleDateString('es-AR');
    
    lines.push(`📋 INFORME DE AUDITORÍA - FONDO FIJO ${ffName}`);
    lines.push(`Solicitante: ${solicitante}`);
    lines.push(`Fecha: ${fecha}`);
    lines.push(`--------------------------------------------------\n`);
    
    let issueCount = 1;

    // 1. Balance de inversion
    if (result.balance_inversion && result.mode !== 'Viáticos') {
      const v14 = result.balance_inversion.validacion_v14;
      if (v14 && (v14.resultado === 'error' || v14.resultado === 'warning')) {
        const severityLabel = v14.resultado === 'error' ? '❌ ERROR' : '⚠️ ATENCIÓN';
        lines.push(`${issueCount}. ${severityLabel} [Balance de Inversión]:`);
        lines.push(`   Detalle: ${v14.detalle}`);
        lines.push(``);
        issueCount++;
      }

      const conc = result.balance_inversion.conciliacion_total;
      if (conc && !conc.coinciden) {
        lines.push(`${issueCount}. ❌ ERROR [Conciliación de totales]:`);
        lines.push(`   Balance de Inversión: ${formatCurrency(conc.importe_balance || 0)}`);
        lines.push(`   Total Banco a Reponer (Libro Diario): ${formatCurrency(conc.importe_libro_diario || 0)}`);
        lines.push(`   Suma de pagos bancarios: ${formatCurrency(conc.suma_pagos_bancarios || 0)}`);
        if (conc.detalle) lines.push(`   Detalle: ${safeText(conc.detalle)}`);
        lines.push(``);
        issueCount++;
      }
    }

    if (result.duplicados && result.duplicados.length > 0) {
      lines.push(`${issueCount}. ❌ ERROR [Documentación duplicada]:`);
      result.duplicados.forEach(d => {
        lines.push(`   • ${safeText(d.identificador)}: ${safeText(d.motivo)}${d.paginas ? ` (${safeText(d.paginas)})` : ''}`);
      });
      lines.push(``);
      issueCount++;
    }

    // 2. Payments list
    const rulesList = result.mode === 'Viáticos' ? VALIDATIONS_VIATICOS : VALIDATIONS;
    
    const paymentsList = result.payments || [];
    paymentsList.forEach((payment, idx) => {
      const validationsList = payment?.validations || [];
      const failedOrWarnVals = validationsList.filter(v => v && (v.status === 'fail' || v.status === 'warning'));
      if (failedOrWarnVals.length > 0) {
        const provName = payment.providerName || "Proveedor N/D";
        const pimysTitle = payment.orderNumber ? `PIMyS N° ${payment.orderNumber}` : `Pago #${idx + 1}`;
        const amountStr = payment.amount ? ` (Importe: ${formatCurrency(payment.amount)})` : "";
        
        lines.push(`${issueCount}. 🔸 EN: ${pimysTitle} - ${provName}${amountStr}:`);
        
        failedOrWarnVals.forEach(val => {
          if (!val) return;
          const ruleId = val.id || "";
          const ruleTemplate = rulesList.find(r => r.id.toLowerCase() === ruleId.toLowerCase());
          const ruleLabel = ruleTemplate ? `${ruleTemplate.label}: ${ruleTemplate.title}` : ruleId;
          const statusIcon = val.status === 'fail' ? '❌ ERROR' : '⚠️ OBSERVACIÓN';
          
          lines.push(`   • [${statusIcon}] - ${ruleLabel}:`);
          
          const rawObs = val.observations || val.observation || '';
          const cleanObs = rawObs.split('\n');
          cleanObs.forEach(obsLine => {
            if (obsLine.trim()) {
              lines.push(`     > ${obsLine.trim()}`);
            }
          });
        });
        lines.push(``);
        issueCount++;
      }
    });

    if (issueCount === 1) {
      lines.push(`✅ ¡Fondo sin observaciones! No se identificaron desvíos ni errores tras completar la auditoría.`);
    } else {
      lines.push(`--------------------------------------------------`);
      lines.push(`Por favor, resuelva las observaciones señaladas antes de proceder con el reintegro de la rendición.`);
    }

    // Alerta Patrimonio para Código 202 — solo si V3 indica código 202
    const paymentsWith202 = (result.payments || []).filter(payment => {
      const v3 = payment?.validations?.find(val => val?.id === 'v3');
      return v3 ? hasAccountingCode(v3.observations, '202') : false;
    });

    if (paymentsWith202.length > 0) {
      lines.push(`\n==================================================`);
      lines.push(`⚠️ ENVIAR EXPEDIENTE A PATRIMONIO PARA ALTA BIEN DE USO`);
      lines.push(`Se ha detectado imputación con código contable 202 (Adquisición de útiles, herramientas y Equipos de trabajo).`);
      lines.push(`Comprobantes identificados:`);
      paymentsWith202.forEach(p => {
        const provName = p.providerName ? p.providerName.toUpperCase() : 'PROVEEDOR N/D';
        const orderNo = p.orderNumber || 'S/N';
        const amtStr = p.amount ? ` - Monto: ${formatCurrency(p.amount)}` : '';
        lines.push(`   • Proveedor: ${provName} | Factura/PIMyS N°: ${orderNo}${amtStr}`);
      });
      lines.push(`==================================================`);
    }
    
    return lines.join('\n');
  }, [result]);

  const copyInformeToClipboard = () => {
    const textReport = generateReportText();
    navigator.clipboard.writeText(textReport).then(() => {
      setCopiedInforme(true);
      setTimeout(() => setCopiedInforme(false), 2000);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true
  } as any);

  return (
    <div className="flex h-screen bg-lienzo text-tinta font-sans overflow-hidden">
      {/* Custom Notification Modal/Toast Overlay */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-superficie rounded-[12px] max-w-md w-full border-[0.5px] border-linea overflow-hidden caja"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    notification.type === 'error' && "bg-error-fondo text-error",
                    notification.type === 'success' && "bg-ok-fondo text-ok-tinta",
                    notification.type === 'info' && "bg-blue-50 text-acento"
                  )}>
                    {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
                    {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {notification.type === 'info' && <Info className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-medium text-slate-900">{notification.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{notification.message}</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-hundida border-t-[0.5px] border-linea flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="px-4 py-1.5 bg-marca hover:bg-marca-hover text-white text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none shadow-none"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-superficie rounded-[12px] max-w-md w-full border-[0.5px] border-linea overflow-hidden caja"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-medium text-slate-900">¿Eliminar auditoría del historial?</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Esta acción eliminará de forma permanente la auditoría seleccionada de tu historial. No se podrá recuperar.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-hundida border-t-[0.5px] border-linea flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-1.5 bg-superficie border border-linea-fuerte hover:bg-realce text-slate-700 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none shadow-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmId) {
                      deleteHistoryEntry(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="px-4 py-1.5 bg-peligro hover:bg-peligro-hover text-white text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none shadow-none"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {pantallaAngosta && menuMovil && (
        <div className="fixed inset-0 z-30 bg-black/25" onClick={() => setMenuMovil(false)} aria-hidden="true" />
      )}
      {!barraOculta && <aside
        style={{ width: pantallaAngosta ? Math.min(sidebarWidth, 280) : sidebarWidth }}
        className={cn(
          "shrink-0 border-r-[0.5px] border-linea flex flex-col bg-superficie",
          pantallaAngosta ? "fixed inset-y-0 left-0 z-40 shadow-[0_0_40px_rgba(0,0,0,0.18)]" : "shadow-none z-20 relative"
        )}>
        {/* Sidebar resize handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsSidebarDragging(true);
            sidebarDragRef.current = { startX: e.clientX, startW: sidebarWidth };
          }}
          className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize z-30 hover:bg-marca/40 transition-colors"
        />
        <div className="h-[56px] shrink-0 px-5 flex items-center border-b-[0.5px] border-linea">
          <div className="flex flex-col select-none w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-[28px] h-[28px] bg-marca rounded-[6px] flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-[12px] font-semibold text-tinta tracking-[0.05em] leading-none whitespace-nowrap">AUDITOR EXPEDIENTES</h1>
              <button type="button" onClick={alternarSidebar} title="Ocultar barra lateral" aria-label="Ocultar barra lateral"
                className="ml-auto p-1 text-tenue hover:text-tinta hover:bg-realce rounded-[6px] bg-transparent border-none cursor-pointer outline-none">
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <SidebarItem icon={Clock} label="Historial" active={activeTab === 'Historial'} onClick={() => setActiveTab('Historial')} />
            <SidebarItem icon={Table2} label="Expedientes del lector" active={activeTab === 'Lector'} onClick={() => setActiveTab('Lector')} />

            {/* Planillas — desplegable */}
            <div>
              <div
                onClick={() => setPlanillasOpen(o => !o)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 border-l-[3px] font-medium text-sm select-none",
                  (activeTab === 'Revisiva' || activeTab === 'Planilla')
                    ? "border-l-acento bg-marca-suave text-acento"
                    : "border-l-transparent text-slate-500 hover:bg-realce hover:text-slate-900"
                )}
              >
                <FileSpreadsheet className={cn("w-5 h-5 shrink-0", (activeTab === 'Revisiva' || activeTab === 'Planilla') ? "text-acento" : "text-slate-400")} />
                <span className="flex-1">Planillas</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", planillasOpen ? "rotate-180" : "")} />
              </div>
              {planillasOpen && (
                <div className="ml-6 border-l-[0.5px] border-linea">
                  <div
                    onClick={() => setActiveTab('Revisiva')}
                    className={cn(
                      "flex items-center gap-2 pl-5 pr-4 py-2.5 cursor-pointer text-[13px] transition-colors select-none",
                      activeTab === 'Revisiva' ? "text-acento font-medium" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Planilla Revisiva
                  </div>
                  <div
                    onClick={() => setActiveTab('Planilla')}
                    className={cn(
                      "flex items-center gap-2 pl-5 pr-4 py-2.5 cursor-pointer text-[13px] transition-colors select-none",
                      activeTab === 'Planilla' ? "text-acento font-medium" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Planilla Control
                  </div>
                </div>
              )}
            </div>

            <SidebarItem icon={Zap} label="Auditoría Rápida" active={activeTab === 'Rapida'} onClick={() => setActiveTab('Rapida')} />
            <SidebarItem icon={Hash} label="Códigos" active={activeTab === 'Códigos'} onClick={() => setActiveTab('Códigos')} />
            <SidebarItem icon={PackageSearch} label="Matriculador" active={activeTab === 'Matriculador'} onClick={() => setActiveTab('Matriculador')} />
            <SidebarItem icon={BookUser} label="Guía telefónica" active={activeTab === 'Guia'} onClick={() => setActiveTab('Guia')} />
            <SidebarItem icon={Stamp} label="Autorizaciones PIMyS" active={activeTab === 'Autorizaciones'} onClick={() => setActiveTab('Autorizaciones')} />
            <SidebarItem icon={ShieldCheck} label="Normativa" active={activeTab === 'Normativa'} onClick={() => setActiveTab('Normativa')} />
          </div>
        </nav>

        <div className="px-6 py-4 border-t-[0.5px] border-linea">
          <p className="text-[10px] text-tenue uppercase tracking-[0.06em] font-medium">Rafaela, Sta Fe</p>
        </div>
      </aside>}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-lienzo">
        {/* Header */}
        <header className="h-[56px] shrink-0 border-b-[0.5px] border-linea flex items-center gap-3 px-4 sm:px-8 bg-superficie sticky top-0 z-40">
          {barraOculta && (
            <button type="button" onClick={alternarSidebar} title="Mostrar barra lateral" aria-label="Mostrar barra lateral"
              className="-ml-1 sm:-ml-4 p-1.5 text-tenue hover:text-tinta hover:bg-realce rounded-[6px] bg-transparent border-none cursor-pointer outline-none shrink-0">
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-tenue font-normal min-w-0">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-tenue-2 shrink-0" />
            <span className="font-medium text-tinta truncate">{NOMBRE_DE_TAB[activeTab] ?? activeTab}</span>
          </div>
          <div className="flex-1 min-w-0 flex justify-end">
            <BuscadorGlobal historial={history} onAbrirLector={abrirExpedienteLector} onAbrirHistorial={abrirAuditoria} />
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors cursor-pointer outline-none border border-linea-fuerte bg-superficie text-tinta-2 hover:text-acento hover:bg-realce"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <div className={cn(activeTab === 'Rapida' ? "flex-1 flex flex-col overflow-hidden" : "p-8 max-w-6xl mx-auto w-full")}>
          {activeTab === 'Dashboard' && (
            <>
              <div className="flex w-fit p-[3px] bg-hundida rounded-[8px] mb-8 gap-[2px] items-center select-none">
                <button
                  type="button"
                  onClick={() => { setDashboardMode('Expedientes'); setSelectedFiles([]); setResult(null); setActiveAuditId(null); setActivePdfViewer(null); }}
                  className={cn(
                    "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] border-none",
                    dashboardMode === 'Expedientes'
                      ? "bg-superficie border-[0.5px] border-linea rounded-[6px] text-acento font-medium shadow-none"
                      : "bg-transparent text-tinta-2 font-normal"
                  )}
                >
                  Expedientes
                </button>

                <button
                  type="button"
                  onClick={() => { setDashboardMode('Viáticos'); setSelectedFiles([]); setResult(null); setActiveAuditId(null); setActivePdfViewer(null); }}
                  className={cn(
                    "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] border-none",
                    dashboardMode === 'Viáticos'
                      ? "bg-superficie border-[0.5px] border-linea rounded-[6px] text-acento font-medium shadow-none"
                      : "bg-transparent text-tinta-2 font-normal"
                  )}
                >
                  Viáticos
                </button>
              </div>

              {!result && !isProcessing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <div className="mb-8">
                    <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-2">Nuevo {dashboardMode === 'Expedientes' ? 'Expediente' : 'Viático'}</h2>
                    <p className="text-sm text-slate-500 max-w-2xl">
                      {dashboardMode === 'Expedientes' 
                        ? 'Sube uno o más archivos PDF del expediente para iniciar la auditoría automática integrada.'
                        : 'Sube uno o más archivos PDF para iniciar el control de viáticos.'}
                    </p>
                  </div>

                  {/* Model Selector Card */}
                  <div className="mb-8 bg-superficie rounded-[12px] border-[0.5px] border-linea p-5 caja">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-acento" />
                          <span>Motor de Inteligencia Artificial (IA)</span>
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                          Selecciona el modelo de IA de acuerdo a la cantidad y peso de tus comprobantes.
                        </p>
                      </div>
                      
                      <div className="shrink-0">
                        <select
                          value={selectedModel}
                          onChange={(e) => {
                            const val = e.target.value as ModelId;
                            setSelectedModel(val);
                            localStorage.setItem('epe_selected_model', val);
                          }}
                          className="px-3 py-2 text-xs font-medium rounded-[8px] border border-linea bg-superficie text-slate-700 outline-none cursor-pointer hover:border-acento/40 transition-colors"
                        >
                          {MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-[2px] border-dashed rounded-[12px] h-64 flex flex-col items-center justify-center transition-all cursor-pointer bg-superficie group caja",
                      isDragActive ? "border-acento bg-marca-suave" : "border-linea hover:border-acento/40 hover:bg-hundida"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105",
                      isDragActive ? "bg-marca-suave text-acento" : "bg-hundida-2 text-slate-400"
                    )}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-0.5">Arrastra uno o más archivos PDF aquí</p>
                    <p className="text-xs text-slate-400">O haz clic para explorar tus archivos</p>
                    <div className="mt-4">
                      <div className="px-3 py-1 bg-hundida-2 text-tenue text-[10px] font-medium rounded uppercase tracking-[0.06em]">Múltiples archivos permitidos</div>
                    </div>
                  </div>

                  {/* List of files with clean, premium design */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-8 bg-superficie rounded-[12px] border-[0.5px] border-linea p-6 caja">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-[0.5px] border-linea">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-acento" />
                          <h3 className="text-sm font-medium text-slate-800">Archivos para Auditar ({selectedFiles.length})</h3>
                        </div>
                        <button
                          onClick={() => setSelectedFiles([])}
                          className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline transition-colors cursor-pointer outline-none bg-transparent border-none"
                        >
                          Limpiar todos
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedFiles.map((file, idx) => {
                          const cat = getFileCategoryInfo(file.name);
                          return (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-3 bg-realce border-[0.5px] border-linea rounded-[8px] transition-all hover:bg-hundida-2/50"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 bg-rose-50 rounded-[8px] flex items-center justify-center text-rose-500 shrink-0 border-[0.5px] border-rose-100 font-normal text-[11px] font-semibold">
                                  #{idx + 1}
                                </div>
                                <div className="truncate">
                                  <div className="flex flex-wrap items-center gap-1.5 truncate">
                                    <p className="text-xs font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 uppercase tracking-wider", cat.color)}>
                                      {cat.label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer outline-none border-none bg-transparent"
                                title="Eliminar archivo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end items-center border-t-[0.5px] border-linea pt-6">
                        <p className="text-xs text-tenue sm:mr-auto">
                          Se analizarán {selectedFiles.length} documento{selectedFiles.length > 1 ? 's' : ''} de forma consolidada por la IA.
                        </p>
                        <button
                          onClick={handleStartAudit}
                          className="w-full sm:w-auto px-4 py-2 bg-marca text-white text-xs font-medium rounded-[7px] hover:bg-marca-hover transition-all shadow-none flex items-center justify-center gap-1.5 cursor-pointer outline-none border-none"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Iniciar Auditoría Combinada</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : isProcessing ? (
                <div className="mt-16 max-w-xl mx-auto flex flex-col items-center justify-center px-4">
                  <div className="w-full bg-superficie rounded-[12px] border-[0.5px] border-linea p-8 flex flex-col relative overflow-hidden caja">
                    {/* Visual gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-marca" />
                    
                    {/* Live Percentage Circle or Big Display */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-tenue">Procesamiento de IA</span>
                        <h3 className="text-sm font-medium text-slate-900 mt-0.5">Auditoría EPE Digital</h3>
                      </div>
                      <div className="flex items-baseline font-mono text-3xl font-medium text-acento select-none">
                        <span>{auditProgress}</span>
                        <span className="text-xs text-tenue font-normal">%</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-1.5 bg-hundida rounded-full overflow-hidden mt-3 relative">
                      <div 
                        className="h-full bg-marca rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${auditProgress}%` }}
                      />
                    </div>

                    {/* Live label description */}
                    <p className="text-xs font-normal text-slate-600 mt-5 min-h-[40px] leading-relaxed transition-all duration-300">
                      {auditProgressLabel || "Inicializando módulos..."}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-linea my-6 w-full" />

                    {/* Interactive workflow checklist */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-medium uppercase tracking-[0.06em] text-tenue">Fases del análisis consolidado</h4>
                      
                      {/* Phase 1 */}
                      <div className="flex items-center gap-3.5">
                        {auditProgress >= 30 ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-acento animate-spin" />
                          </div>
                      )}
                        <span className={cn(
                          "text-xs transition-colors duration-200",
                          auditProgress >= 30 ? "text-slate-400 line-through font-normal" : "text-slate-800 font-medium text-sm"
                        )}>
                          Carga de archivos de soporte y carátula del expediente
                        </span>
                      </div>

                      {/* Phase 2 */}
                      <div className="flex items-center gap-3.5">
                        {auditProgress >= 60 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : auditProgress >= 30 ? (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-acento animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-superficie shrink-0" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors duration-200",
                          auditProgress >= 60 ? "text-slate-400 line-through font-normal" : 
                          auditProgress >= 30 ? "text-slate-700 font-medium" : "text-slate-400"
                        )}>
                          Lectura del Balance de Inversión y cuadre matemático
                        </span>
                      </div>

                      {/* Phase 3 */}
                      <div className="flex items-center gap-3.5">
                        {auditProgress >= 85 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : auditProgress >= 60 ? (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-acento animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-superficie shrink-0" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors duration-200",
                          auditProgress >= 85 ? "text-slate-400 line-through font-normal" : 
                          auditProgress >= 60 ? "text-slate-700 font-medium" : "text-slate-400"
                        )}>
                          Rastreo de Códigos Múltiples de imputación en Libro Diario
                        </span>
                      </div>

                      {/* Phase 4 */}
                      <div className="flex items-center gap-3.5">
                        {auditProgress >= 100 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : auditProgress >= 85 ? (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-acento animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-superficie shrink-0" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors duration-200",
                          auditProgress >= 100 ? "text-slate-400 line-through font-normal" : 
                          auditProgress >= 85 ? "text-slate-700 font-medium" : "text-slate-400"
                        )}>
                          Cruce y validación de Proveedores, Aprobadores, CUIT y ARCA
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-linea my-5 w-full" />

                    {/* Cancel button */}
                    <button
                      onClick={handleCancelAudit}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-[7px] transition-all border-[0.5px] border-rose-100 hover:border-rose-200 cursor-pointer outline-none flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Cancelar Auditoría</span>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs text-center leading-relaxed max-w-sm">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Nuestra IA compara de forma cruzada toda la información sin necesidad de servidores intermedios.</span>
                  </div>
                </div>
              ) : (
                <ResultadosExpediente
                  result={result}
                  expandedPayment={expandedPayment}
                  setExpandedPayment={setExpandedPayment}
                  onNuevaAuditoria={() => { setResult(null); setSelectedFiles([]); setActiveAuditId(null); setActivePdfViewer(null); }}
                  onViewPdf={handleViewPdf}
                  onIrRevisiva={() => setActiveTab('Revisiva')}
                  onDescargarRevisiva={() => {
                    const datos = revisivaDe(result);
                    descargarRevisiva(datos, `Planilla revisiva FF ${datos.fondoFijo} ${datos.reparticion}`.trim().replace(/\s+/g, ' ') + '.pdf');
                  }}
                  onIrPlanilla={() => { setPlanillasOpen(true); setActiveTab('Planilla'); }}
                  informeTexto={generateReportText()}
                />
              )}
            </>
          )}

          {activeTab === 'Lector' && <ExpedientesLector />}

          {activeTab === 'Matriculador' && <Matriculador />}

          {activeTab === 'Guia' && <GuiaTelefonica />}

          {activeTab === 'Historial' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
                    <FileText className="w-6 h-6 text-tenue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium tracking-tight text-slate-900">Historial</h2>
                    <p className="text-xs text-tenue mt-0.5">Auditorías previas completadas — {history.length} en total.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportHistory}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-superficie border border-linea-fuerte text-slate-700 text-xs font-medium rounded-[7px] hover:bg-realce hover:text-slate-900 transition-all cursor-pointer shadow-none outline-none select-none"
                    title="Exportar respaldo de historial en formato JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Copia</span>
                  </button>
                  <label
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-ok-fondo border border-ok-linea text-ok-tinta text-xs font-medium rounded-[7px] hover:bg-marca-suave transition-all cursor-pointer shadow-none outline-none select-none"
                    title="Importar un archivo de respaldo JSON"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar Copia</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importHistory}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="p-16 text-center border-[0.5px] border-dashed border-linea rounded-[12px] bg-superficie/50">
                  <FileText className="w-12 h-12 text-tenue/40 mx-auto mb-4" />
                  <p className="text-tenue font-medium text-sm">No hay auditorías registradas todavía.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(entry => (
                    <div 
                      key={entry.id} 
                      className="bg-superficie border-[0.5px] border-linea p-6 rounded-[12px] flex flex-col sm:flex-row gap-6 sm:items-center justify-between group animate-fade-in caja elevable"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.result?.mode === 'Viáticos' ? (
                            <span className="px-[10px] py-[3px] bg-purple-100/60 text-purple-700 rounded-[20px] text-[11px] font-medium leading-none">
                              Viáticos
                            </span>
                          ) : entry.result?.mode === 'Rapida' ? (
                            <span className="px-[10px] py-[3px] bg-amber-100/70 text-amber-800 rounded-[20px] text-[11px] font-medium leading-none inline-flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Rápida
                            </span>
                          ) : (
                            <span className="px-[10px] py-[3px] bg-ok-fondo text-ok-tinta rounded-[20px] text-[11px] font-medium leading-none">
                              Expediente
                            </span>
                          )}

                          {entry.result?.agenciaSucursal || entry.result?.fondoFijoNumero ? (
                            <h3 className="text-sm font-medium text-slate-800">
                              {(() => {
                                const val = entry.result?.agenciaSucursal || '';
                                if (!val) return '';
                                const lower = val.toLowerCase();
                                if (
                                  lower.includes('agencia') || 
                                  lower.includes('delegación') || 
                                  lower.includes('delegacion') || 
                                  lower.includes('unidad') || 
                                  lower.includes('sucursal') || 
                                  lower.includes('sector')
                                ) {
                                  return formatHistoryTitle(val);
                                }
                                return `Agencia ${formatHistoryTitle(val)}`;
                              })()}
                              {entry.result.agenciaSucursal && entry.result.fondoFijoNumero ? ' — ' : ''}
                              {entry.result.fondoFijoNumero ? formatHistoryTitle(entry.result.fondoFijoNumero) : ''}
                            </h3>
                          ) : entry.result?.mode === 'Rapida' ? (
                            <h3 className="text-sm font-medium text-slate-800">
                              {(entry.result.payments || []).length}{' '}
                              {(entry.result.payments || []).length === 1 ? 'pago suelto' : 'pagos sueltos'}
                            </h3>
                          ) : (
                            <span className="text-xs font-medium bg-hundida text-slate-600 px-2.5 py-1 rounded-md">
                              FF-{entry.FF || 'Sin ID'}
                            </span>
                          )}

                          {entry.result?.expedienteNumero && (
                            <span className="text-xs font-medium bg-hundida text-slate-500 border border-linea px-2 py-0.5 rounded-md font-mono">
                              Exp. {entry.result.expedienteNumero}
                              {entry.result.expedienteFecha ? ` (${entry.result.expedienteFecha})` : ''}
                            </span>
                          )}

                          <span className="text-xs text-tenue ml-auto sm:ml-2">
                            {new Date(entry.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{safeText(entry.summary)}</p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button 
                          onClick={() => abrirAuditoria(entry)}
                          className="py-[6px] px-[14px] bg-superficie border border-linea-fuerte text-acento text-[13px] font-medium rounded-[7px] hover:bg-marca-suave transition-all shadow-none cursor-pointer select-none outline-none"
                        >
                          Ver Reporte
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(entry.id);
                          }}
                          title="Eliminar auditoría"
                          className="p-2 text-tenue hover:text-red-600 hover:bg-red-50 rounded-[7px] transition-all cursor-pointer outline-none border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Normativa' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
                  <ShieldCheck className="w-6 h-6 text-acento" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Marco Normativo</h2>
                  <p className="text-xs text-tenue mt-0.5">Reglas, límites y responsables vigentes para Fondos Fijos.</p>
                </div>
              </div>

              <InteractiveNormativa />
            </motion.div>
          )}

          {activeTab === 'Planilla' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PlanillaControlFF initialData={planillaInitialData} />
            </motion.div>
          )}

          {activeTab === 'Rapida' && (
            <RapidaTab selectedModel={selectedModel} setSelectedModel={setSelectedModel} showNotification={showNotification} saveToHistory={saveToHistory} />
          )}

          {activeTab === 'Códigos' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
                  <FileCheck2 className="w-6 h-6 text-acento" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Códigos PIMyS</h2>
                  <p className="text-xs text-tenue mt-0.5">Diccionario completo de conceptos y códigos autorizados.</p>
                </div>
              </div>

              <div className="flex p-[3px] bg-hundida rounded-[8px] mb-6 gap-[2px] w-fit select-none items-center">
                {(Object.keys(PIMYS_CODES) as Array<keyof typeof PIMYS_CODES>).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCodeCategory(cat)}
                    className={cn(
                      "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] whitespace-nowrap border-none leading-none",
                      activeCodeCategory === cat 
                        ? "bg-superficie border-[0.5px] border-linea rounded-[6px] text-acento font-medium shadow-none"
                        : "bg-transparent text-tinta-2 font-normal"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-tenue" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    value={codeSearchQuery}
                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                    className="block w-full pl-[36px] pr-[12px] py-[8px] border border-linea-fuerte rounded-[8px] bg-superficie text-[13px] text-tinta placeholder-tenue focus:border-acento focus:ring-0 outline-none"
                    placeholder="Buscar por código o palabra..."
                  />
                </div>
              </div>

              <div className="bg-superficie rounded-[12px] border-[0.5px] border-linea overflow-hidden mb-6 caja">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-hundida/50 text-[10px] text-tenue uppercase font-medium tracking-[0.06em]">
                      <tr className="bg-hundida border-b-[1.5px] border-linea-fuerte">
                        <th className="p-[12px_16px] border-r-[0.5px] border-linea" style={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>Código</th>
                        <th className="p-[12px_16px]">Descripción Completa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PIMYS_CODES[activeCodeCategory]
                        .filter(item => {
                          if (!codeSearchQuery) return true;
                          const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const query = normalizeStr(codeSearchQuery);
                          return item.code.toString().includes(query) || normalizeStr(item.descripcion).includes(query);
                        })
                        .map((item, idx) => (
                        <tr key={idx} className="border-b border-linea hover:bg-realce/50 transition-colors">
                          <td className="p-[12px_16px] font-mono font-medium text-acento border-r-[0.5px] border-linea align-top text-base whitespace-nowrap" style={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                            {item.code}
                          </td>
                          <td className="p-[12px_16px] text-tinta leading-[1.5] font-normal align-top text-[13px]">
                            {item.descripcion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Autorizaciones' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
                  <Stamp className="w-6 h-6 text-acento" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Autorizaciones PIMyS</h2>
                  <p className="text-xs text-tenue mt-0.5">Firmas obligatorias según el código de gasto o el agente solicitante.</p>
                </div>
              </div>

              {/* ── Por código de gasto ───────────────────────────────── */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-marca rounded-full" />
                  <h3 className="text-[10px] font-medium text-acento uppercase tracking-[0.06em]">
                    Según código de gasto
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormCodigo(v => !v)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-marca hover:bg-marca-hover text-white text-xs font-semibold rounded-[7px] transition-all cursor-pointer border-none outline-none shadow-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showFormCodigo ? 'Cancelar' : 'Agregar código'}</span>
                </button>
              </div>

              {showFormCodigo && (
                <div className="bg-superficie rounded-[12px] border border-acento/30 p-5 mb-4 space-y-3 caja">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Código(s) *</label>
                      <input type="text" value={formCodigo.codigos} placeholder="Ej: 610 o 610, 611"
                        onChange={e => setFormCodigo({ ...formCodigo, codigos: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Concepto *</label>
                      <input type="text" value={formCodigo.concepto} placeholder="Descripción del gasto"
                        onChange={e => setFormCodigo({ ...formCodigo, concepto: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1.5">Tipo de autorización</label>
                    <div className="flex gap-2">
                      {(['fijo', 'zona'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setFormCodigo({ ...formCodigo, tipo: t })}
                          className={cn("text-[12px] py-1.5 px-3 rounded-[6px] border transition-all cursor-pointer outline-none",
                            formCodigo.tipo === t
                              ? "bg-marca text-white border-acento font-medium"
                              : "bg-hundida text-slate-700 border-linea-fuerte")}>
                          {t === 'fijo' ? 'Misma persona siempre' : 'Depende de la sucursal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formCodigo.tipo === 'fijo' ? (
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Autorizante(s) *</label>
                      <input type="text" value={formCodigo.firmantes} placeholder="Ej: Sergio Cenci, Gustavo Fernández (separá con coma si vale cualquiera)"
                        onChange={e => setFormCodigo({ ...formCodigo, firmantes: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {ZONAS.map(z => (
                        <div key={z}>
                          <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">{z}</label>
                          <input type="text" value={formCodigo[z]} placeholder="Nombre del jefe"
                            onChange={e => setFormCodigo({ ...formCodigo, [z]: e.target.value })}
                            className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Nota aclaratoria (opcional)</label>
                    <input type="text" value={formCodigo.nota} placeholder="Ej: la autorización llega por correo"
                      onChange={e => setFormCodigo({ ...formCodigo, nota: e.target.value })}
                      className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                  </div>

                  <button type="button" onClick={handleAddCodigo}
                    className="bg-marca hover:bg-marca-hover text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition-all cursor-pointer border-none outline-none">
                    Guardar autorización
                  </button>
                </div>
              )}

              <div className="space-y-3 mb-10">
                {[...AUTORIZACIONES_POR_CODIGO, ...customCodigos].map((auth, idx) => (
                  <div
                    key={auth.id || idx}
                    className="bg-superficie rounded-[12px] border-[0.5px] border-linea p-5 relative caja"
                  >
                    {auth.custom && auth.id && (
                      <button type="button" onClick={() => setCustomCodigos(removeCodigo(auth.id!))}
                        title="Eliminar esta autorización"
                        className="absolute top-4 right-4 p-1.5 text-tenue hover:text-error rounded-[6px] transition-all cursor-pointer border-none bg-transparent outline-none">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {auth.codigos.map(c => (
                        <span
                          key={c}
                          className="font-mono text-[13px] font-medium text-acento bg-ok-fondo border-[0.5px] border-ok-linea px-2 py-0.5 rounded-[6px]"
                        >
                          {c}
                        </span>
                      ))}
                      <span className="text-[13px] text-slate-800 font-medium">{auth.concepto}</span>
                    </div>

                    {auth.tipo === 'fijo' ? (
                      <div className="mt-3 flex items-start gap-2 text-[13px]">
                        <span className="text-tenue shrink-0">Autoriza:</span>
                        <strong className="font-semibold text-slate-900 break-all">{(auth.firmantes || []).join(' o ')}</strong>
                      </div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                          <thead>
                            <tr className="bg-hundida border-b-[1.5px] border-linea-fuerte text-[10px] text-tenue uppercase tracking-[0.06em]">
                              <th className="p-[8px_12px] font-medium whitespace-nowrap">Sucursal</th>
                              <th className="p-[8px_12px] font-medium">Alcance</th>
                              <th className="p-[8px_12px] font-medium whitespace-nowrap">Autoriza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(auth.zonas || []).map(z => (
                              <tr key={z.zona} className="border-b border-linea last:border-0">
                                <td className="p-[8px_12px] font-medium text-slate-800 align-top whitespace-nowrap">{z.zona}</td>
                                <td className="p-[8px_12px] text-tinta-2 align-top leading-[1.5] text-[12px]">{z.alcance}</td>
                                <td className="p-[8px_12px] align-top whitespace-nowrap">
                                  <strong className="font-semibold text-slate-900">{z.firmante}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {auth.excepcion && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-[8px] p-3">
                        <p className="text-[11px] font-semibold text-amber-800 mb-1">
                          Excepción — {auth.excepcion.motivo}
                        </p>
                        <p className="text-[12px] text-amber-800 leading-relaxed">
                          Si el solicitante es <strong className="font-semibold">{auth.excepcion.agentes.join(', ')}</strong>, no se exige el autorizante habitual: en ese caso autoriza <strong className="font-semibold">{auth.excepcion.firmantes.join(' o ')}</strong>.
                        </p>
                      </div>
                    )}

                    {auth.nota && (
                      <p className="mt-3 text-[12px] text-tinta-2 leading-relaxed border-l-2 border-linea-fuerte pl-3">
                        {auth.nota}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Por sector / agente solicitante ───────────────────── */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-marca rounded-full" />
                  <h3 className="text-[10px] font-medium text-acento uppercase tracking-[0.06em]">
                    Según el agente solicitante del PIMyS
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormSector(v => !v)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-marca hover:bg-marca-hover text-white text-xs font-semibold rounded-[7px] transition-all cursor-pointer border-none outline-none shadow-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showFormSector ? 'Cancelar' : 'Agregar sector'}</span>
                </button>
              </div>

              {showFormSector && (
                <div className="bg-superficie rounded-[12px] border border-acento/30 p-5 mb-4 space-y-3 caja">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Sector *</label>
                      <input type="text" value={formSector.sector} placeholder="Ej: Laboratorio"
                        onChange={e => setFormSector({ ...formSector, sector: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Agente(s) solicitante(s) *</label>
                      <input type="text" value={formSector.agentes} placeholder="Ej: Juan Pérez, Ana Gómez"
                        onChange={e => setFormSector({ ...formSector, agentes: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Jefe(s) autorizante(s) *</label>
                      <input type="text" value={formSector.jefes} placeholder="Ej: Carlos Ruiz"
                        onChange={e => setFormSector({ ...formSector, jefes: e.target.value })}
                        className="w-full px-3 py-2 border border-linea-fuerte rounded-[8px] bg-campo text-[13px] outline-none focus:border-acento" />
                    </div>
                  </div>
                  <p className="text-[11px] text-tenue">Si hay más de un nombre, separalos con coma: alcanza con la firma de cualquiera de ellos.</p>
                  <button type="button" onClick={handleAddSector}
                    className="bg-marca hover:bg-marca-hover text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition-all cursor-pointer border-none outline-none">
                    Guardar autorización
                  </button>
                </div>
              )}
              <p className="text-[12px] text-tenue mb-4 leading-relaxed max-w-2xl">
                Si el campo <strong className="font-medium text-slate-700">Solicitante</strong> del PIMyS corresponde a alguno de estos agentes, el formulario debe llevar la firma del jefe autorizante de su sector.
              </p>

              <div className="bg-superficie rounded-[12px] border-[0.5px] border-linea overflow-hidden caja">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-hundida border-b-[1.5px] border-linea-fuerte text-[10px] text-tenue uppercase tracking-[0.06em]">
                        <th className="p-[12px_16px] font-medium whitespace-nowrap">Sector</th>
                        <th className="p-[12px_16px] font-medium">Agente solicitante</th>
                        <th className="p-[12px_16px] font-medium">Jefe autorizante</th>
                        <th className="p-[12px_16px] font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...AUTORIZACIONES_POR_SECTOR, ...customSectores].map((s, idx) => (
                        <tr key={s.id || idx} className="border-b border-linea last:border-0 hover:bg-realce/50 transition-colors">
                          <td className="p-[12px_16px] font-medium text-slate-800 align-top leading-[1.4]">{s.sector}</td>
                          <td className="p-[12px_16px] text-tinta align-top leading-[1.6]">
                            {s.agentes.join(' o ')}
                          </td>
                          <td className="p-[12px_16px] align-top leading-[1.6]">
                            <strong className="font-semibold text-slate-900">{s.jefes.join(' o ')}</strong>
                          </td>
                          <td className="p-[12px_16px] align-top text-right">
                            {s.custom && s.id && (
                              <button type="button" onClick={() => setCustomSectores(removeSector(s.id!))}
                                title="Eliminar esta autorización"
                                className="p-1.5 text-tenue hover:text-error rounded-[6px] transition-all cursor-pointer border-none bg-transparent outline-none">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-6 text-[12px] text-tenue leading-relaxed max-w-2xl">
                Estas reglas se aplican automáticamente en la validación <strong className="font-medium text-slate-700">V4 (Aprobadores)</strong> de cada auditoría.
              </p>
            </motion.div>
          )}

          {activeTab === 'Revisiva' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-6"
              id="revisiva-tab-container"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center text-acento caja">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Planilla Revisiva</h2>
                  <p className="text-xs text-tenue mt-0.5">Asistente de autocompletado y emisión del informe revisivo oficial de la EPE.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Control Panel: Left (col-span-5) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between h-5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parámetros de Entrada</span>
                  </div>
                  <div className="bg-superficie rounded-[12px] border-[0.5px] border-linea p-6 space-y-4 caja">
                    <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-acento" />
                      <span>Filtro y Autocompletado</span>
                    </h3>

                    {/* GCIA/SUC Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" id="gcia-suc-label">
                        Administración (GCIA / SUC)
                      </label>
                      <select
                        id="gcia-suc-dropdown"
                        value={pdfGciaSuc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPdfGciaSuc(val);
                          setSelectedSector('');
                          setPdfResponsable('');
                          setPdfReparticion('');
                        }}
                        className="block w-full px-3 py-2 border border-linea-fuerte rounded-lg text-sm bg-superficie text-slate-900 focus:border-acento outline-none font-medium"
                      >
                        <option value="">Seleccionar...</option>
                        {Object.keys(SECTOR_MAPPING).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sector Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" id="sector-label">
                        Sector / Dependencia
                      </label>
                      <select
                        id="sector-dropdown"
                        value={selectedSector}
                        disabled={!pdfGciaSuc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSector(val);
                          if (val) {
                            const list = SECTOR_MAPPING[pdfGciaSuc] || [];
                            const matched = list.find(x => x.label === val);
                            if (matched) {
                              setPdfResponsable(matched.responsible);
                              setPdfReparticion(matched.label.toUpperCase());
                            }
                          } else {
                            setPdfResponsable('');
                            setPdfReparticion('');
                          }
                        }}
                        className={cn(
                          "block w-full px-3 py-2 border border-linea-fuerte rounded-lg text-sm bg-superficie text-slate-900 focus:border-acento outline-none font-medium",
                          !pdfGciaSuc && "opacity-60 cursor-not-allowed bg-realce"
                        )}
                      >
                        <option value="">
                          {!pdfGciaSuc ? "Primero elija GCIA/SUC..." : "Seleccionar Sector..."}
                        </option>
                        {pdfGciaSuc && (SECTOR_MAPPING[pdfGciaSuc] || []).map((item) => (
                          <option key={item.label} value={item.label}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mapped Fields (Pre-filled + Editable) */}
                    <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-acento uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Responsable (Autocompletado)</span>
                          <span className="text-[10px] text-slate-400 font-normal">Editable</span>
                        </label>
                        <input
                          id="responsable-input"
                          type="text"
                          value={pdfResponsable}
                          onChange={(e) => setPdfResponsable(e.target.value)}
                          className="block w-full px-3 py-2 border border-linea-fuerte rounded-lg text-sm bg-superficie text-slate-900 focus:border-acento outline-none font-medium"
                          placeholder="Responsable oficial del sector"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Repartición</span>
                          <span className="text-[10px] text-slate-400 font-normal">Editable</span>
                        </label>
                        <input
                          id="reparticion-input"
                          type="text"
                          value={pdfReparticion}
                          onChange={(e) => setPdfReparticion(e.target.value)}
                          className="block w-full px-3 py-2 border border-linea-fuerte rounded-lg text-sm bg-superficie text-slate-900 focus:border-acento outline-none font-medium"
                          placeholder="Nombre asignado de la repartición"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Fondo Fijo N°
                          </label>
                          <input
                            id="fdo-fijo-input"
                            type="text"
                            value={pdfFdoFijoNo}
                            onChange={(e) => setPdfFdoFijoNo(e.target.value)}
                            className="block w-full px-3 py-2 border border-linea-fuerte rounded-lg text-sm bg-superficie text-slate-900 focus:border-acento outline-none font-medium font-mono"
                            placeholder="Ej. FF-01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        type="button"
                        id="generate-revisiva-btn"
                        onClick={handleDownloadPdf}
                        className="w-full py-2.5 bg-marca text-white hover:bg-marca-hover text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Generar y descargar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfGciaSuc('');
                          setSelectedSector('');
                          setPdfResponsable('');
                          setPdfReparticion('');
                          setPdfFdoFijoNo('');
                        }}
                        className="w-full py-2 border border-slate-200 bg-superficie hover:bg-realce text-slate-600 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Limpiar Selección
                      </button>
                    </div>
                  </div>

                  {/* Summary Mapping Lists grouped elegantly */}
                  <div className="bg-superficie border border-linea rounded-xl p-5 text-slate-600 text-xs space-y-3 caja">
                    <h4 className="font-semibold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                      <Info className="w-3.5 h-3.5 text-amber-700" />
                      <span>Grilla de Responsables Registrados</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Estructura oficial de dependencias y agentes asignados:
                    </p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 divide-y divide-slate-100">
                      {Object.entries(SECTOR_MAPPING).map(([gcia, sectors]) => (
                        <div key={gcia} className="pt-2 first:pt-0">
                          <span className="font-semibold text-acento text-[9.5px] uppercase tracking-wide block mb-1">
                            {gcia}
                          </span>
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {sectors.map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                                <span className="text-slate-600 font-medium truncate max-w-[190px]" title={s.label}>
                                  {s.label}
                                </span>
                                <span className="text-acento font-mono text-[10.5px] font-bold shrink-0">
                                  {s.responsible}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Sheet Preview: Right (col-span-7) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between h-5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vista Previa Dinámica de Formulario</span>
                    <span className="text-[10.5px] text-slate-400 italic">Formato reglamentario</span>
                  </div>

                  <div className="bg-hundida rounded-[12px] p-6 shadow-inner overflow-x-hidden">
                    {/* Simulated Paper Sheet */}
                    <div className="papel w-[580px] mx-auto bg-superficie text-black font-sans border-[0.5px] border-slate-300 p-8 space-y-4 shadow-md" style={{ minHeight: '750px' }} id="simulated-paper-page">
                      {/* Paper Header */}
                      <div className="border border-black grid grid-cols-12 items-center text-center divide-x divide-black text-[9px]">
                        <div className="col-span-4 p-2 flex flex-col items-center justify-center bg-superficie">
                          <div className="flex flex-col items-center justify-center select-none">
                            {/* Official-specification EPE Brand Logo (Uploaded by the user as Base64) */}
                            <img 
                              src={EPE_LOGO_BASE64} 
                              alt="EPE Logo" 
                              className="w-[96px] h-auto object-contain select-none"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                        <div className="col-span-8 p-3 flex items-center justify-center text-center font-bold text-[10px]">
                          Empresa Provincial de la Energía de Santa Fe
                        </div>
                      </div>

                      {/* Document Title */}
                      <div className="pt-2 text-[10px]">
                        <p className="font-bold uppercase tracking-wide text-black mb-0.5">INFORME REVISIVA PRACTICADA:</p>
                        <div className="w-full h-[0.5px] bg-black" />
                      </div>

                      {/* Fields Table */}
                      <div className="border border-black text-[8px] leading-tight">
                        <div className="grid grid-cols-12 font-bold uppercase tracking-wider border-b border-black text-center divide-x divide-black py-0.5 bg-hundida-2">
                          <div className="col-span-4">Responsable</div>
                          <div className="col-span-2">Fdo.Fijo Nro.</div>
                          <div className="col-span-3">Repartición</div>
                          <div className="col-span-3">Gcia./Suc.</div>
                        </div>
                        <div className="grid grid-cols-12 uppercase divide-x divide-black text-center min-h-[22px] items-center py-1 font-mono text-[8px]">
                          <div className="col-span-4 px-1 truncate font-bold text-acento">
                            {pdfResponsable || <span className="text-slate-300 italic font-sans text-[7px]">No ingresado</span>}
                          </div>
                          <div className="col-span-2 px-1 font-semibold">
                            {pdfFdoFijoNo || <span className="text-slate-300 italic font-sans text-[7px]">N/D</span>}
                          </div>
                          <div className="col-span-3 px-1 truncate font-semibold">
                            {pdfReparticion || <span className="text-slate-300 italic font-sans text-[7px]">No ingresado</span>}
                          </div>
                          <div className="col-span-3 px-1 font-bold text-slate-800">
                            {pdfGciaSuc || <span className="text-slate-300 italic font-sans text-[7px]">N/D</span>}
                          </div>
                        </div>
                      </div>

                      {/* Body Structure */}
                      <div className="space-y-3.5 text-[7px]">
                        <div>
                          <p className="font-bold uppercase text-[8px] mb-0.5">REVISION DE CUENTAS:</p>
                          <p className="font-bold text-[7.5px]">1-Requisitos legales y formales que deben cumplirse en las Rendiciones de Cuentas</p>
                          <p className="italic text-slate-500 font-medium mb-1">Capítulo II – Resol.008/06 – T.C.P.</p>
                          
                          {/* Main checklist table */}
                          <div className="border border-black grid grid-cols-2 divide-x divide-black">
                            <div className="divide-y divide-black">
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Documentación Legítima</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Completados de manera indeleble</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Totalidad de los antecedentes</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Tachaduras o enmiendas no salvadas</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-red-600">NO</span>
                              </div>
                            </div>
                            <div className="divide-y divide-black">
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Lugar y Fecha de Emisión</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Organismo Adquirente</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Concepto</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                              <div className="grid grid-cols-10 p-0.5 pl-1.5 items-center">
                                <span className="col-span-8">Importe Total en letras y N°</span>
                                <span className="col-span-2 text-center text-[8px] font-bold text-emerald-600">✓</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional standards list */}
                        <div className="border border-black divide-y divide-black">
                          <div className="grid grid-cols-2 p-1 pl-1.5 items-center">
                            <span>Expresan el carácter provisorio de la documentación</span>
                            <span className="text-center font-bold text-[8px] text-red-600">NO</span>
                          </div>
                          <div className="grid grid-cols-2 p-1 pl-1.5 items-center">
                            <span>Cumplen con las normas impositivas y previsionales</span>
                            <span className="text-center font-bold text-[8px] text-emerald-600">✓</span>
                          </div>
                          <div className="grid grid-cols-2 p-1 pl-1.5 items-center">
                            <span>Justificación del pago (Firma aclaración y Nro. de Doc. en Fact./Recibo definitivo)</span>
                            <span className="text-center font-bold text-[8px] text-emerald-600">✓</span>
                          </div>
                        </div>

                        {/* Chapter I / IV and Legal dispositions */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <div className="space-y-1">
                            <p className="font-bold text-[7.5px]">2 – Capítulo I – Resolución 008/06 T.C.P.</p>
                            <div className="border border-black divide-y divide-black">
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Presentados en término</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Corresponden las fechas</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-bold text-[7.5px]">3 – Capítulo IV – Resolución 008/06 T.C.P.</p>
                            <div className="border border-black divide-y divide-black">
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Balance de Inversión, relac. gastos</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Suscripto por los responsables</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Suscripto por Jefe de Sucursal</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Legal Disp of pimys */}
                        <div className="space-y-1">
                          <p className="font-bold text-[7.5px]">4 – Disp. Legales sobre conceptos y Procedimientos en vigencia.</p>
                          <div className="border border-black grid grid-cols-2 divide-x divide-black">
                            <div className="divide-y divide-black">
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Pedido debidamente cumplido (Pimys)</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Conceptos autorizados</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none">✓</span>
                              </div>
                            </div>
                            <div className="divide-y divide-black">
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Pedidos de presupuestos</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none font-bold">✓</span>
                              </div>
                              <div className="flex justify-between p-1 pl-1.5">
                                <span>Recepción conforme a normativa</span>
                                <span className="font-bold text-emerald-600 pr-1.5 select-none font-bold">✓</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Signature block */}
                        <div className="grid grid-cols-2 pt-6 text-center font-bold text-[6.5px] tracking-tight">
                          <div className="flex flex-col items-center">
                            <div className="w-2/3 h-[0.5px] bg-slate-400 mb-1" />
                            <span>REVISOR</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-2/3 h-[0.5px] bg-slate-400 mb-1" />
                            <span>JEFE COORD.REND.CTAS</span>
                          </div>
                        </div>

                        {/* Footer date */}
                        <div className="flex justify-between items-center text-[7px] text-slate-500 font-semibold pt-2 border-t border-dotted border-slate-300">
                          <span>FECHA DE REVISIÓN: {new Date().toLocaleDateString('es-AR')}</span>
                          <span className="uppercase tracking-tighter text-[6.2px]">Gerencia de Administración - Finanzas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


        </div>
      </main>

      {/* PDF Viewer Side Panel */}
      <AnimatePresence>
          {activePdfViewer && (
            <motion.div
              initial={{ x: '100%', opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full lg:w-auto h-full border-l border-slate-200 bg-superficie shadow-2xl flex flex-col relative z-30 shrink-0"
              style={{ width: isLargeScreen ? `${pdfWidth}px` : '100%' }}
            >
              {/* Splitter Handle for resizing */}
              {isLargeScreen && (
                <div
                  onMouseDown={startResize}
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center bg-realce/50 border-r border-slate-200 hover:bg-marca/20 transition-all z-50 group",
                    isDragging && "bg-marca/35 border-acento/50 w-2.5"
                  )}
                  title="Arrastrar para redimensionar"
                >
                  <div className="w-[3px] h-14 bg-slate-300 group-hover:bg-marca/50 rounded-full transition-colors" />
                </div>
              )}

              {/* Sidebar Content Container (indented on large screens to clear the splitter) */}
              <div className="flex-1 flex flex-col min-h-0 lg:pl-2 w-full h-full">
                {/* Header of the PDF Viewer */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-realce">
                  <div className="flex items-center gap-2 overflow-hidden mr-4">
                    <div className="p-2 bg-marca/10 rounded-lg text-acento shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-bold text-slate-900 truncate" title={activePdfViewer.fileName}>
                        {activePdfViewer.fileName}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Download Button */}
                    <button
                      onClick={() => {
                        if (activePdfViewer.fileBase64) {
                          const link = document.createElement('a');
                          link.href = `data:application/pdf;base64,${activePdfViewer.fileBase64}`;
                          link.download = activePdfViewer.fileName;
                          link.click();
                        } else {
                          showNotification('Descarga inválida', "No se encontró el contenido del archivo original para descargar.", 'error');
                        }
                      }}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer outline-none border-none bg-transparent"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Expand / Open PDF in new tab using handleOpenPdfInNewTab */}
                    <button
                      onClick={() => handleOpenPdfInNewTab(activePdfViewer.fileUrl, activePdfViewer.fileName, activePdfViewer.pageNumber)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-acento rounded-lg transition-colors cursor-pointer outline-none border-none bg-transparent"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setActivePdfViewer(null)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer outline-none border-none bg-transparent"
                      title="Cerrar visor"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sandbox Tip Bar */}
                <div className="px-4 py-2 bg-marca/5 border-b border-acento/10 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-acento shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-acento">Consejo:</span> El documento se visualiza directamente en tiempo real. Si necesitas verlo externo, puedes abrir o descargar desde arriba.
                  </div>
                </div>

                {/* If there are multiple files, we can also let them navigate between files in the same sidebar! */}
                {(() => {
                  const filesList = activeAuditId ? auditFilesMap[activeAuditId] : selectedFiles;
                  if (filesList && filesList.length > 1) {
                    return (
                      <div className="px-4 py-2 border-b border-slate-100 bg-realce/50 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
                        <span className="font-semibold text-slate-400 mr-1 uppercase text-[10px] tracking-wider shrink-0">Documentos:</span>
                        {filesList.map((file) => {
                          const isActive = file.objectUrl === activePdfViewer.fileUrl;
                          return (
                            <button
                              key={file.id}
                              onClick={() => setActivePdfViewer({
                                fileUrl: file.objectUrl,
                                fileName: file.name,
                                pageNumber: 1,
                                fileBase64: file.base64
                              })}
                              className={cn(
                                "px-2.5 py-1 rounded-md border text-xs font-semibold transition-all cursor-pointer truncate max-w-[120px] outline-none",
                                isActive 
                                  ? "bg-marca text-white border-acento" 
                                  : "bg-superficie text-slate-600 border-slate-200 hover:bg-hundida-2"
                              )}
                              title={file.name}
                            >
                              {file.name}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* PDF Scroll Viewer - continuous scroll, all pages stacked */}
                <div className="flex-1 relative overflow-hidden h-full min-h-0 bg-hundida-2">
                  <PdfScrollViewer
                    base64={activePdfViewer.fileBase64 || ''}
                    fileName={activePdfViewer.fileName}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
      "flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 border-l-[3px] font-medium text-sm select-none",
      active 
        ? "!border-l-acento !rounded-tl-none !rounded-bl-none rounded-tr-[6px] rounded-br-[6px] bg-marca-suave !text-acento !font-medium" 
        : "border-l-transparent text-slate-500 hover:bg-realce hover:text-slate-900"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-acento" : "text-slate-400")} />
      <span>{label}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, iconColor, iconBg, title, description }: { icon: any, iconColor: string, iconBg: string, title: string, description: string }) {
  return (
    <div className="bg-superficie p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

interface ValidationDotProps {
  status: 'pass' | 'fail' | 'warning';
  title: string;
  key?: React.Key | number | string;
}

function ValidationDot({ status, title }: ValidationDotProps) {
  const colors = {
    pass: 'bg-emerald-500 shadow-emerald-500/20',
    fail: 'bg-rose-500 shadow-rose-500/20',
    warning: 'bg-amber-400 shadow-amber-500/20'
  };

  return (
    <div 
      className={cn("w-2.5 h-2.5 rounded-full shadow-sm", colors[status])}
      title={title}
    />
  );
}

