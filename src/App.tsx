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
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Hash,
  ChevronDown,
  Zap,
  Moon,
  Sun
} from 'lucide-react';
import { PlanillaControlFF } from './components/PlanillaControlFF';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { VALIDATIONS, VALIDATIONS_VIATICOS } from './constants';
import { processDocument, type AuditResult, type PaymentData } from './lib/gemini';
import { PIMYS_CODES } from './lib/codes';
import { PdfCanvasViewer } from './components/PdfCanvasViewer';
import { PdfScrollViewer } from './components/PdfScrollViewer';
import { InteractiveNormativa } from './components/InteractiveNormativa';
import { useRef } from 'react';
import { jsPDF } from 'jspdf';

const EPE_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUYAAACaCAMAAADighEiAAAAmVBMVEX///8AN24ANW0AGWD4+foAM2wAMWv09vg6WIMAMW0bQXNGZo6lscMAJ2bd5OwAJWUALGgAHmJWcZQAImQAHWIAKmjo7fLFztrQ2OF7jqkAGGAgSHmdqr66xdNof57W3uauuspyh6SElq8AP3WNnbQ4VoEtUX9lfJxDYYqTpLq0v82rtse/ydbm6e6CkqsrU4FbdJYADl0AAFeGYhOSAAANgklEQVR4nO2da2OyPA+Ab6qgiFAQEZwHcDoPUzef9///uFd0B4s0bSF1m9v12bVLekqTNPz7p0ZrH2fjxfTgrJejuaEAMZh2FpHKH18zHy3bvenLZrydJIOWohBC2V5Hc6Ly34xUukm707URhG7kW5ZJlPoxDHPNtDX11f68CDEIMS0/ilwaBuRp1U3rqTDdvstmn2RTks50ZLtpTlY+dX1TUXmf+DOmvVezakMlENN2w/nCq6jC5mRq15NtKNdRMpyHdj1RozHTYs01XQKJQmdXQYnpsBP6lTV4oiAbh+clrdnPEfp82WTzoW57JRArHMWKSpy8IsjmPos7ypYhxgIMkstG0wChyRLMoKdy3kyWAb5sZSRPKEo8dsWItwtRGi3BN6VXdtJGko0O4I4GqwbSUUDmzcuGuy5OsyWY/a6UEluzBzTZ4BWQWTXNkk/MNtPyEK3hEsKFhBYnJtopV5CtOFyHoPbm+4G9YtruWWgtl9AQ6rG56uPJZvWAnpIO5ozxX5jG25hm4zVBBmsxHWEaXAWTmKHbR5XUZTasVgdvLpRBKHip2WLt+Gdcvtk4RLZIQsag2+vcGnNM6JY7RDYTKNc2cChuTyRipkeiyWz8xH3karGHbWzxpn5zjX5XMxnTKtNn77zjcm7YTQdbNuKWm43NJfqaIx2mh7puMgksjtflCb9ru1yLbfyd65Zm4xuNshtac61BttdSNWroyfCnTBeOVrPxTOl0RF/RxpVJ/MZBYd/KnadSUNYmAHzLUs3JeFVJye441SGbuynR4kLqjDZtP3JDGtnEmHckMFlXEt9NRmRamxM/jIQTOrq6y2ykzmhV2Uh2rcWsL+zGcgOrvRpusjjxBq3mdRtCPK69QyKBs+RMy4s3TihQJCnajs8NCdn69tNZtnRfSbYTqWguksh1ul7l9s/w3WRkLqXGE15P8M822LY8kX/2KNu66yHEx5ojwS2JjsbycnLZcrcoc6nSjmADcjNGtqVg9rqdDYJsOVP4ILNot+Y8PPPItQV41h6HGXhksJEm+LeGTccosh2J4Y2RKjnoAfhuMshZUsYSWj1MTDcJwSVNHSTZRP+U0ZcMI4p54vYjF2P7ZAsta+aMgSO6AZpsoq0mUJSQT5PvJqMTtaYGUNbBpXN/A8tWZvpVpAVaVYg97fl7vTjGVgD0/5KPI6MFntJSUQdZZtAlMFLctCBS/ng1VHco8J+2P+4xM+jsjEpvcxXxoJ5AN6gqE/4Co6ptgb4ie//2qz30KzJHlA1OTlJebBAbrlBqZmMOqMaPRQ3O2VA10wJiAN2UFM05AXw3WbmzBAJS0McRM4DCgNYa7kGNR2hYVQ9QGL7ZGPFd/xwgl9uHwQNOWSqRgCNNC8qLvLrk12PE7cqVS3i4oAOc1O/zDDCwrtJXa/IM2VXqkwSE35XyNuVFgIber0QTyJIrBNBrAvqjg5qprCzALhzuxX/OMIYuyjSTkQ3z8BxAt2lci+BfzHeTGaouljVkfb+N/gDKpSQdLIdEDpjhJZuTK0nGXdRkqShTApkXxJeRDfFacRxVaN6HqOc0cG4q21Xgcn0Po4FpV6jn9ABM7LZVdyyYA7ezQvxQCHh2vI8+7L3wq+bdl7GD3cjteizZmz/gJlNzEYBG2nGjPRvfgsTeurJdGjGC8LtZD8o6hwA3mdoKc8D/+n1Hf9Er2+XI8ycIBuwdaMDvK1QyPg5wxOPhbbmivsC54nLkW7CDvS4hY3am/IMzULB30hE8y96Pq6Y4qlqHy5HnW3IosEcUsFf1ZXU4yBzRI4J3+XTLdnFEgXeB2pAR44sdc9cimQ88mDTePXdfeiPbFeVM2O/52BrfPBiFRwigO642lnQ2GQlEhCF1fUu8BZH+/iaykUsHKXilqo11YNR4uEE22UWyrd7kNebCoPZ4WJWCf0ivVXDGHH3cKvleOQwu78ktvYIVckBUH2JXIfhwuMEmem0uHaSg064+rBMRDFYgQT/nv6c3r/fSJE6Qnx0UCJhra6LXAMnxL6IrQDAXg0tPrL7npCcemK1R/yME69LA0mw2Ni48e/w8OQwKwQ6+2YiExfh+9Y4aIxs/boyBhVurQ9jdnLkz6b1ZMDlrYGy1NgXfueZHl5bBOkf1ThHGQSpwJdUkYt1kaqVZFCG0XfBu6H3IxDhI9T72YZ2IrZoFVEBIcBUJ1rvSmLi6XjWy0dlUn1gkMq7D3HrVyERn+anYOaZl14J9mBhrs1Gt8KUkrrjQKhu9NInBEXMnzVY9GLF0+a2s0CnNSQCPGDfDlA3siv/muhJ6NhA/cDjxBzitAjO6CpvfuMlk/1boRwyxqDvjZseA5vd7dgoO4GVQPckLBNe1afpuYPYyoD/wMqj67gEGdE34qNlkkN/KtGSx/fxxZPAQLmfjBA6Dga/3cDNPQGcSWGRGGSAGaTk9WVbT4Wa7S2XS7YFw7lVNybpANwsywky5Akq8BXjPpC6B8khx08ngiDjFzHLhZ6OKCn1VBdyM4XI9qoBWCOo+zHeTwYW+qgM6DBSThgSAVgFq4jfmIwQ5wGzsQkGWmuzB+AhmeiN/iSHnon4gkA3VAAdLhqm/+eHDP8yAQl/1gLP3UKcjnFoAFKpShW/voL6VugS+fkaYi0AQ1AqwbjIef6OKUA/NCwRBrRBxFTThoDjBegUMuMkspDoPV4CPi470EU9rgeOFUMWsbA7AIwTcRyOXiGIk9IBmhHui8juRgVGtg+/Z1GU2/hOd1UZenBmtWocw8YrQzkvtB018N5mlyWzMkZFtiPNYSyJzgvghdRYTr3qxJMBsxPVZsUhkThxlC53Fcx3Zzsjly1kRDexlL/ewxHGcpILsWI+tsdQC3q5mNf9/CLnY+Jtsq9x7FCeqsr2xk6+TalrWqRgapa6I/9hHCHzXtzazMSfWI1tW1hf43o2LoEAgZbYcfom3Yj0xZJxKoQtBwcHykQdLdlSkUAAPqNVho3r+ioAlO6rSLx95ucqNShCL6QFwk5UXNkUDrmZUjQdOX0/o2eYFrwbfEC6k2eNTbcuC4F4Y9uhpSjarHb4Bp8tN9sHAwM5k479aFlTMU6fgXebf3HWajWcEFfPUAYpUPCOn+Lpbpnl+tYIQNzejDPjxdQXZgJHvNlDHjNUOUNACN7ZUzhbx2yaGIJ1kEmHuIX0m9RW4lJlazcY3di6mbAEYMU1MxGSliLkvAdFVVF8+l9RAlM2HR76F9wWLQiUTfgKx+aRVfR80EWUTpkF0+0iDVkhcWXHtHVu32fjBNkCSTSJxZTBD+IahcZVqBLjJUMPuIK1ZhKJIqbi6NwsQHhKy2mku+bU6Mj06K5dtGLoIssmFSwebEa17arPZrEBBHK1usmtaCLLJO0iTRTvIP5RbeegKbjKgyARuwSQp2dYBrSWbysgPtsNXM6I08q0K3x1mSy4BJd5CZCXJyZYNX4lP3Wqy8T4yxcdLto/T3tKI+kGYO4WjI75vi5NiTcYmGIe8H/q3MRvL8JIsl22uKptVdeTztw9ePMm23fF48zicrXqOCNbeGa95v1ujJg9XoIJsqNV+//jjjz/++OOPP/74A53mHfFlSmwt/IfGvfC/27qkPtkYCE6+7wJunWt5sg69HyXmuWZfsap3y7tRIjFNO6KhvoR/LnG7f4PKl/ohVuQGtLNeLZ4Fb+E1kDr0hyuRmJbvhkF/dFhsk4Ge58oCvN7DLUrZaoLk+qPzdu9lG988zPHJYCYsLP0tISf9BQ/z3uM43t98AbO0hlih9dtx1N/xADGWzqy7U7Jpdl1NLEy9JXNxMc38PceD4Qw3E6/C/FuHwpcL1fghSiRmPv+sTnu1mSTVrUES3aKC9DfkeABHbtgw27NFlu7rmtPpYuSi5jR+f0z7eID482VvkcWI9ku6aAdRhYj3D4MYJwOwYb+uXrqJp+M6tx+/uj/TOJHiNP8iq+O8dHe11y+M13WOmryvOUlOB0gQLXuzcSxVjAuDQdehrn0XmjwZgNS12rMxwvNeZVrZwQx1lvHVDTHtyA2ikTM9GjBfeQFpTVZh6P+4wzv3INCwHyxXmyz9Gg/CFbtpJ0TJW74Fnx6ELP7iC/AVrXhoBd97Tp49WP3GvPfYjfffY/6Vkbwsw295p8sPkJAaS2eo6EH4KpLFqPGNTPOzAdOYO8PNrooH4QvxNk8R6jOxyvqj5mg9HU/Sr4sS18Mbr/tfpMncgDnNv9lmkv6s+VfGoLu26S2viycDkNrzp8M4S77v+aHOYHtw9WuS5CG4owForKePWfKFIRCNtJ57Ps5DuDIF5gYMjcxRb7GNb3+Buy2tydRADrKcQ0h98nQYbuMfYcCg0NzNkObkaf5R13BevrUBrY94OKr5OtOkgXX2YN35+oVpJo9GDa85XU72g1+twE/SxVO1t6C2r71kzM/C27w+qJrmJHR+z0kizX689lUiOT7B/QjN/bDvOn3JSA7pH37+pU4frW3PpOL4QzTH/azUHTJ4Xvmw19wMZr/RPFSmuZsaXNOcuCOcisa/gWY8m5fGH8w+6oe57p9mMpxfGZT09QYF3e6O5HF5eV20fKQPK/w+0s0oPF8XSbi+T9fhjfA2a+qalr0V//QPkP3W6d25wf1/1c9KegDe7akAAAAASUVORK5CYII=';

export const SECTOR_MAPPING: Record<string, { label: string; responsible: string }[]> = {
  RAFAELA: [
    { label: "Compras", responsible: "D. Cordero" },
    { label: "Movilidades", responsible: "C. Ternengo" },
    { label: "U.T. Adm Rafaela", responsible: "J. Chianalino" },
    { label: "Ag. Rafaela", responsible: "G. Cabrera" },
    { label: "Ag. Maria Juana", responsible: "C. Cernotti" },
    { label: "Ag. Norte", responsible: "M. Re" },
    { label: "Viáticos Rafaela", responsible: "A. Giorgetti" }
  ],
  NOROESTE: [
    { label: "Suc Noroeste (Ceres)", responsible: "E. Argañaraz" },
    { label: "Ag. San Guillermo", responsible: "M. Astudillo" },
    { label: "Ag. San Cristobal", responsible: "J. Arta" },
    { label: "Ag. Tostado", responsible: "E. Roldan" },
    { label: "Ag. Sunchales", responsible: "D. Cipolatti" }
  ],
  OESTE: [
    { label: "Suc Oeste (Cañada de Gómez)", responsible: "L. Biasutti" },
    { label: "Ag. El Trebol", responsible: "M. Pietrani" },
    { label: "Ag. Las Rosas", responsible: "D. Malier" },
    { label: "Ag. San Jorge", responsible: "M. Bravin" }
  ]
};

const MODELS = [
  { id: 'gemini-3.5-flash',       label: 'Gemini Rápido (3.5 Flash)', desc: 'Para muchos archivos / Recomendado' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini Complejo (Pro)',     desc: 'Para texto difuso / Lento' },
] as const;
type ModelId = typeof MODELS[number]['id'];

function RapidaTab({ selectedModel, setSelectedModel, showNotification }: {
  selectedModel: ModelId;
  setSelectedModel: (m: ModelId) => void;
  showNotification: (title: string, msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);
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
    const f = acceptedFiles[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setFile({ name: f.name, base64 });
      setResult(null);
    };
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  } as any);

  const handleAnalizar = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await processDocument([{ name: file.name, base64: file.base64 }], 'Rapida', selectedModel as any);
      setResult(res);
    } catch (err) {
      showNotification('Error', 'No se pudo analizar el comprobante. Verificá la conexión e intentá de nuevo.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-[#004741]" />;
    if (status === 'fail') return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="flex flex-1 min-h-0 h-full gap-0">
      {/* Left panel — form + results */}
      <div style={{ width: leftWidth }} className="shrink-0 flex flex-col h-full overflow-y-auto bg-[#E8E4D8] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-[#F2EFE6] rounded-[10px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#004741]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold text-[#1A1A1A] tracking-tight leading-none">Auditoría Rápida</h1>
            <p className="text-[11px] text-[#9A9890] mt-0.5">Comprobante único, sin expediente.</p>
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
            className="w-full px-3 py-2 text-xs font-medium rounded-[8px] border border-[#E8E6DE] bg-[#F2EFE6] text-slate-700 outline-none cursor-pointer hover:border-[#004741]/40 transition-colors"
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
            isDragActive ? "border-[#004741] bg-[#E8EFEE]" : "border-[#E8E6DE] bg-[#F2EFE6] hover:border-[#004741]/40"
          )}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-[#004741]" />
              <span className="text-sm font-medium text-[#1A1A1A] truncate max-w-[220px]">{file.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }} className="text-[#9A9890] hover:text-red-500 transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="w-6 h-6 text-[#BDBBB2]" />
              <p className="text-xs text-[#9A9890]">Arrastrá el comprobante o hacé clic</p>
              <p className="text-[10px] text-[#BDBBB2]">Solo PDF</p>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalizar}
          disabled={!file || isProcessing}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all mb-5",
            file && !isProcessing
              ? "bg-[#004741] text-white hover:bg-[#003330]"
              : "bg-[#E8E6DE] text-[#BDBBB2] cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Analizando...</span></>
          ) : (
            <><Zap className="w-4 h-4" /><span>Analizar comprobante</span></>
          )}
        </button>

        {/* Results */}
        {result && result.payments && result.payments.length > 0 && (
          <div className="space-y-3">
            <div className="bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[10px] p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[10px] text-[#9A9890] uppercase tracking-wide font-medium mb-0.5">Proveedor</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{result.payments[0].providerName || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#9A9890] uppercase tracking-wide font-medium mb-0.5">Importe</p>
                  <p className="text-sm font-semibold text-[#004741]">{formatCurrency(result.payments[0].amount)}</p>
                </div>
              </div>
              <div className="text-[11px] text-[#9A9890]">N° {result.payments[0].orderNumber}</div>
              {result.overallSummary && (
                <p className="text-[11px] text-[#6B6963] mt-2 pt-2 border-t border-[#F0EDE8] leading-relaxed">{safeText(result.overallSummary)}</p>
              )}
            </div>

            {/* Validations */}
            <div className="bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[10px] overflow-hidden">
              <button
                onClick={() => setExpandedPayment(expandedPayment === 0 ? null : 0)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"
              >
                <span>Validaciones</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-[#9A9890] transition-transform", expandedPayment === 0 ? "rotate-180" : "")} />
              </button>
              {expandedPayment === 0 && (
                <div className="border-t border-[#F0EDE8] divide-y divide-[#F0EDE8]">
                  {result.payments[0].validations?.map((v) => (
                    <div key={v.id} className="flex items-start gap-2.5 px-4 py-2.5">
                      {statusIcon(v.status)}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#1A1A1A] uppercase mr-1.5">{v.id}</span>
                        <p className="text-[11px] text-[#6B6963] mt-0.5 whitespace-pre-line leading-relaxed">{v.observations}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onDividerMouseDown}
        className="w-[5px] shrink-0 h-full cursor-col-resize bg-[#E8E6DE] hover:bg-[#004741]/40 transition-colors active:bg-[#004741]/60"
      />

      {/* Right panel — PDF viewer */}
      <div className="flex-1 min-w-0 h-full bg-[#DED9CC] flex flex-col">
        {file ? (
          <PdfScrollViewer base64={file.base64} fileName={file.name} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#BDBBB2]">
            <FileText className="w-12 h-12" />
            <p className="text-sm">El comprobante aparecerá aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('epe_dark_mode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    try { localStorage.setItem('epe_dark_mode', String(darkMode)); } catch {}
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [planillasOpen, setPlanillasOpen] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'Expedientes' | 'Viáticos'>('Expedientes');
  const [activeCodeCategory, setActiveCodeCategory] = useState<keyof typeof PIMYS_CODES>('Sucursales');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
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

  const determineGciaSuc = (reparticion: string): string => {
    if (!reparticion) return '';
    const r = reparticion.toLowerCase();
    if (
      r.includes('oeste') ||
      r.includes('cañada de gomez') ||
      r.includes('cañada de gómez') ||
      r.includes('trebol') ||
      r.includes('trébol') ||
      r.includes('rosas') ||
      r.includes('jorge')
    ) {
      return 'OESTE';
    }
    if (
      r.includes('noroeste') ||
      r.includes('ceres') ||
      r.includes('guillermo') ||
      r.includes('cristobal') ||
      r.includes('cristóbal') ||
      r.includes('tostado') ||
      r.includes('sunchales')
    ) {
      return 'NOROESTE';
    }
    if (
      r.includes('rafaela') ||
      r.includes('compras') ||
      r.includes('abastecimiento') ||
      r.includes('movilidades') ||
      r.includes('maria juana') ||
      r.includes('maría juana')
    ) {
      return 'RAFAELA';
    }
    return '';
  };

  useEffect(() => {
    if (result) {
      const responsableVal = getInitialResponsible(result);
      setPdfResponsable(responsableVal);
      setPdfFdoFijoNo(result.fondoFijoNumero || '');
      const reparticionVal = result.agenciaSucursal ? formatHistoryTitle(result.agenciaSucursal) : '';
      setPdfReparticion(reparticionVal);
      setPdfGciaSuc(determineGciaSuc(result.agenciaSucursal || ''));
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

  const filteredHistory = history.filter(entry => {
    if (!auditSearchQuery.trim()) return true;
    
    const normalize = (str: string) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const query = normalize(auditSearchQuery);
    
    const expNum = normalize(entry.result?.expedienteNumero || '');
    const expFecha = normalize(entry.result?.expedienteFecha || '');
    const agency = normalize(entry.result?.agenciaSucursal || '');
    const ffNum = normalize(entry.result?.fondoFijoNumero || '');
    const ffId = normalize(entry.FF || '');
    const summary = normalize(entry.summary || '');
    const resp = normalize(entry.result?.responsable || '');
    
    return expNum.includes(query) || 
           expFecha.includes(query) || 
           agency.includes(query) || 
           ffNum.includes(query) || 
           ffId.includes(query) || 
           summary.includes(query) ||
           resp.includes(query);
  });

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
    return { label: 'Otro formato', weight: 5, color: 'bg-[#DED9CC] text-slate-600 border-slate-200' };
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
      showNotification(
        'Error de Auditoría',
        isRateLimit
          ? 'Límite de solicitudes de Gemini alcanzado. La app ya reintentó automáticamente con todas las claves disponibles. Esperá 1-2 minutos y volvé a intentarlo — el límite se recupera solo.'
          : selectedModel === 'gemini-3.1-pro-preview'
            ? 'Hubo un error al procesar los archivos. Al utilizar el modelo Pro con muchos archivos, es común sufrir demoras extremas o cortes por límites de tiempo del navegador. Te recomendamos reintentar seleccionando el modelo "Gemini 3.5 Flash" (Rápido) en la sección de arriba.'
            : 'Hubo un error al procesar los archivos de auditoría. Comprueba la conexión y vuelve a intentarlo.',
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
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const drawPdfCheckmark = (x: number, y: number) => {
        doc.setDrawColor(0, 110, 86);
        doc.setLineWidth(0.45);
        doc.line(x - 1.5, y + 0.2, x - 0.3, y + 1.4);
        doc.line(x - 0.3, y + 1.4, x + 1.8, y - 1.2);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
      };
      
      // Standard Helvetica
      doc.setFont('helvetica', 'normal');
      
      // Outer border for the header box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.rect(15, 12, 180, 21); // x=15 to 195, height 21 (from y=12 to 33)
      doc.line(55, 12, 55, 33); // divider vertical at x=55
      
      // Draw EPE Logo in left cell (x=15 to x=55, y=12 to y=33) using Base64 uploaded by the user
      doc.addImage(EPE_LOGO_BASE64, 'PNG', 16, 13.5, 38, 18);
      
      // Right cell text: "Empresa Provincial de la Energía de Santa Fe"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text('Empresa Provincial de la Energía de Santa Fe', 59, 22.5);
      
      // Title: INFORME REVISIVA PRACTICADA
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME  REVISIVA  PRACTICADA:', 15, 41);
      // single line underline
      doc.setLineWidth(0.35);
      doc.line(15, 42.5, 115, 42.5);
      
      // Metadata table: RESPONSABLE | FDO.FIJO NRO. | REPARTICION | GCIA./SUC.
      doc.rect(15, 47, 180, 14); // height 14 (from y=47 to 61)
      doc.line(15, 53, 195, 53); // horizontal row divider at y=53
      
      // Column vertical lines
      doc.line(65, 47, 65, 61);
      doc.line(90, 47, 90, 61);
      doc.line(145, 47, 145, 61);
      
      // Headers
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text('RESPONSABLE', (15 + 65)/2, 51.5, { align: 'center' });
      doc.text('FDO.FIJO NRO.', (65 + 90)/2, 51.5, { align: 'center' });
      doc.text('REPARTICION', (90 + 145)/2, 51.5, { align: 'center' });
      doc.text('GCIA./SUC.', (145 + 195)/2, 51.5, { align: 'center' });
      
      // Values
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(pdfResponsable || '', (15 + 65)/2, 58, { align: 'center', maxWidth: 47 });
      doc.text(pdfFdoFijoNo || '', (65 + 90)/2, 58, { align: 'center', maxWidth: 22 });
      doc.text(pdfReparticion || '', (90 + 145)/2, 58, { align: 'center', maxWidth: 52 });
      doc.text(pdfGciaSuc || '', (145 + 195)/2, 58, { align: 'center', maxWidth: 47 });
      
      // REVISION DE CUENTAS heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('REVISION DE CUENTAS:', 15, 68);
      doc.line(15, 69.5, 57, 69.5);
      
      // Subheading 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('1-Requisitos legales y formales que deben cumplirse en las Rendiciones de Cuentas', 15, 74);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Capítulo II – Resol.008/06 – T.C.P.', 15, 78);
      
      // Table 1 (4 rows, starts at y = 81)
      doc.setLineWidth(0.3);
      doc.rect(15, 81, 180, 28);
      doc.line(15, 88, 195, 88);
      doc.line(15, 95, 195, 95);
      doc.line(15, 102, 195, 102);
      
      doc.line(105, 81, 105, 109); // center split
      doc.line(91, 81, 91, 109); // left checkbox layout
      doc.line(181, 81, 181, 109); // right checkbox layout
      
      doc.setFontSize(8);
      
      // Table 1 Rows - Left Column
      doc.text('Documentación Legítima', 17, 85.5);
      drawPdfCheckmark(98, 85);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Completados de manera indeleble', 17, 92.5);
      drawPdfCheckmark(98, 92);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Totalidad de los antecedentes', 17, 99.5);
      drawPdfCheckmark(98, 99);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Tachaduras o enmiendas no salvadas', 17, 106.5);
      doc.setFont('helvetica', 'bold');
      doc.text('NO', 98, 106.5, { align: 'center' });
      
      // Table 1 Rows - Right Column
      doc.setFont('helvetica', 'normal');
      doc.text('Lugar y Fecha de Emisión', 107, 85.5);
      drawPdfCheckmark(188, 85);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Organismo Adquirente', 107, 92.5);
      drawPdfCheckmark(188, 92);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Concepto', 107, 99.5);
      drawPdfCheckmark(188, 99);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Importe Total en letras y N°', 107, 106.5);
      drawPdfCheckmark(188, 106);
      
      // Table 2 (2 Rows, starts at y = 113)
      doc.rect(15, 113, 180, 20);
      doc.line(15, 123, 195, 123);
      doc.line(105, 113, 105, 133);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Expresan el carácter provisorio de la', 17, 117.5);
      doc.text('documentación', 17, 121.5);
      doc.setFont('helvetica', 'bold');
      doc.text('NO', 150, 119.5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.text('Cumplen con las normas impositivas y', 17, 127.5);
      doc.text('previsionales', 17, 131.5);
      drawPdfCheckmark(150, 129);
      
      // Table 3 (1 Row, starts at y = 137)
      doc.rect(15, 137, 180, 11);
      doc.line(105, 137, 105, 148);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Justificación del pago (Firma aclaración y Nro.', 17, 141.5);
      doc.text('de Doc. en Fact./Recibo definitivo)', 17, 145.5);
      drawPdfCheckmark(150, 143.5);
      
      // Section 2: y starts at 152
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('2 – Capítulo I – Resolución 008/06 T.C.P.', 15, 155);
      
      // Table 4 (2 rows, starts at y = 157)
      doc.setLineWidth(0.3);
      doc.rect(15, 157, 180, 14);
      doc.line(15, 164, 195, 164);
      doc.line(105, 157, 105, 171);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Presentados en término', 17, 161.5);
      drawPdfCheckmark(150, 161);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Corresponden las fechas', 17, 168.5);
      drawPdfCheckmark(150, 168);
      
      // Section 3: y starts at 175
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('3 – Capítulo IV – Resolución 008/06 T.C.P.', 15, 178);
      
      // Table 5 (3 rows, starts at y = 180)
      doc.rect(15, 180, 180, 21);
      doc.line(15, 187, 195, 187);
      doc.line(15, 194, 195, 194);
      doc.line(105, 180, 105, 201);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Balance de Inversión, relación de gastos', 17, 184.5);
      drawPdfCheckmark(150, 184);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Suscripto por los responsables', 17, 191.5);
      drawPdfCheckmark(150, 191);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Suscripto por el Jefe de Sucursal', 17, 198.5);
      drawPdfCheckmark(150, 198);
      
      // Section 4: y starts at 205
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('4 – Disp. Legales sobre conceptos y Procedimientos en vigencia.', 15, 208);
      
      // Table 6 (4 rows, starts at y = 210)
      doc.rect(15, 210, 180, 28);
      doc.line(15, 217, 195, 217);
      doc.line(15, 224, 195, 224);
      doc.line(15, 231, 195, 231);
      doc.line(105, 210, 105, 238);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Pedido debidamente cumplido (Pimys)', 17, 214.5);
      drawPdfCheckmark(150, 214);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Conceptos autorizados', 17, 221.5);
      drawPdfCheckmark(150, 221);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Pedidos de presupuestos', 17, 228.5);
      drawPdfCheckmark(150, 228);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Recepción conforme a normativa', 17, 235.5);
      drawPdfCheckmark(150, 235);
      
      // Signatures (at y = 250)
      doc.setLineWidth(0.35);
      doc.setDrawColor(0, 0, 0);
      doc.line(15, 252, 75, 252);
      doc.line(135, 252, 195, 252);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('REVISOR', 45, 256, { align: 'center' });
      doc.text('JEFE COORD.REND.CTAS', 165, 256, { align: 'center' });
      
      const currentDate = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`FECHA DE REVISIÓN:  ${currentDate}`, 15, 266);
      
      // Footer Address (left aligned)
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Gerencia de Administración - Área Finanzas - Primera Junta 2558', 15, 276);
      doc.text('3000 - Santa Fe - Teléfono / Fax: (042) 4505768 - 4505776 / 4505775', 15, 281);
      
      const filename = 'revisiva.pdf';
      doc.save(filename);
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

    // Alerta Patrimonio para Código 202
    const paymentsWith202 = (result.payments || []).filter(payment => {
      const inLibroDiario = hasAccountingCode(payment?.libroDiarioText, '202');
      const inAnyObs = payment?.validations?.some(val => hasAccountingCode(val?.observations, '202'));
      return inLibroDiario || inAnyObs;
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
    <div className="flex h-screen bg-[#E8E4D8] text-slate-900 font-sans overflow-hidden font-sans">
      {/* Custom Notification Modal/Toast Overlay */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 bg-slate-850/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F2EFE6] rounded-[12px] max-w-md w-full shadow-none border-[0.5px] border-[#E8E6DE] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    notification.type === 'error' && "bg-[#FCEBEB] text-[#A32D2D]",
                    notification.type === 'success' && "bg-[#D4E8E6] text-[#003330]",
                    notification.type === 'info' && "bg-blue-50 text-[#004741]"
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
              
              <div className="px-6 py-4 bg-[#E8E4D8] border-t-[0.5px] border-[#E8E6DE] flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="px-4 py-1.5 bg-[#004741] hover:bg-[#003330] text-white text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none shadow-none"
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
          <div className="fixed inset-0 bg-slate-850/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F2EFE6] rounded-[12px] max-w-md w-full shadow-none border-[0.5px] border-[#E8E6DE] overflow-hidden"
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
              
              <div className="px-6 py-4 bg-[#E8E4D8] border-t-[0.5px] border-[#E8E6DE] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-1.5 bg-[#F2EFE6] border border-[#D3D1C7] hover:bg-[#E5E1D5] text-slate-700 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none shadow-none"
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
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none border-none shadow-none"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside style={{ width: sidebarWidth }} className="shrink-0 border-r-[0.5px] border-[#E8E6DE] flex flex-col bg-[#F2EFE6] shadow-none z-20 relative">
        {/* Sidebar resize handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsSidebarDragging(true);
            sidebarDragRef.current = { startX: e.clientX, startW: sidebarWidth };
          }}
          className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize z-30 hover:bg-[#004741]/40 transition-colors"
        />
        <div className="p-6 border-b-[0.5px] border-[#E8E6DE]">
          <div className="flex flex-col select-none">
            <div className="flex items-center gap-2">
              <div className="w-[28px] h-[28px] bg-[#004741] rounded-[6px] flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-[13px] font-medium text-[#1A1A1A] tracking-tight leading-none">Auditor EPE</h1>
            </div>
            <p className="text-[11px] text-[#9A9890] pl-[36px] mt-1.5 leading-none">
              Rendición de Cuentas
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <SidebarItem icon={Clock} label="Historial" active={activeTab === 'Historial'} onClick={() => setActiveTab('Historial')} />

            {/* Planillas — desplegable */}
            <div>
              <div
                onClick={() => setPlanillasOpen(o => !o)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 border-l-[3px] font-medium text-sm select-none",
                  (activeTab === 'Revisiva' || activeTab === 'Planilla')
                    ? "border-l-[#004741] bg-[#E8EFEE] text-[#004741]"
                    : "border-l-transparent text-slate-500 hover:bg-[#E5E1D5] hover:text-slate-900"
                )}
              >
                <FileSpreadsheet className={cn("w-5 h-5 shrink-0", (activeTab === 'Revisiva' || activeTab === 'Planilla') ? "text-[#004741]" : "text-slate-400")} />
                <span className="flex-1">Planillas</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", planillasOpen ? "rotate-180" : "")} />
              </div>
              {planillasOpen && (
                <div className="ml-6 border-l-[0.5px] border-[#E8E6DE]">
                  <div
                    onClick={() => setActiveTab('Revisiva')}
                    className={cn(
                      "flex items-center gap-2 pl-5 pr-4 py-2.5 cursor-pointer text-[13px] transition-colors select-none",
                      activeTab === 'Revisiva' ? "text-[#004741] font-medium" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Planilla Revisiva
                  </div>
                  <div
                    onClick={() => setActiveTab('Planilla')}
                    className={cn(
                      "flex items-center gap-2 pl-5 pr-4 py-2.5 cursor-pointer text-[13px] transition-colors select-none",
                      activeTab === 'Planilla' ? "text-[#004741] font-medium" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Planilla Control
                  </div>
                </div>
              )}
            </div>

            <SidebarItem icon={Zap} label="Auditoría Rápida" active={activeTab === 'Rapida'} onClick={() => setActiveTab('Rapida')} />
            <SidebarItem icon={Hash} label="Códigos" active={activeTab === 'Códigos'} onClick={() => setActiveTab('Códigos')} />
            <SidebarItem icon={ShieldCheck} label="Normativa" active={activeTab === 'Normativa'} onClick={() => setActiveTab('Normativa')} />
          </div>
        </nav>

        <div className="p-4 border-t-[0.5px] border-[#E8E6DE] bg-[#F2EFE6]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-[#E8EFEE] text-[#004741] rounded-full flex items-center justify-center text-xs font-medium shrink-0">
              AL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 leading-none">Alejandro D.</p>
              <p className="text-[10px] text-[#9A9890] uppercase tracking-[0.06em] font-medium mt-1">Rafaela, Sta Fe</p>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer outline-none border-none bg-transparent hover:bg-[#E8EFEE] text-[#9A9890] hover:text-[#004741]"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-[#E8E4D8]">
        {/* Header */}
        <header className="h-[42px] border-b-[0.5px] border-[#E8E6DE] flex items-center justify-between px-8 bg-[#F2EFE6] sticky top-0 z-10 shadow-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[12px] text-[#9A9890] font-normal">
              <span>Home</span>
              <ChevronRight className="w-3 h-3 text-[#BDBBB2]" />
              <span className="font-medium text-[#1A1A1A]">{activeTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9890]" />
              <input 
                type="text" 
                placeholder="Buscar expediente..." 
                value={auditSearchQuery}
                onChange={(e) => {
                  setAuditSearchQuery(e.target.value);
                  if (e.target.value && activeTab !== 'Historial') {
                    setActiveTab('Historial');
                  }
                }}
                className="bg-[#E8E4D8] border-[0.5px] border-[#E2E0D8] rounded-[6px] pl-8 pr-8 py-1 text-[12px] w-64 focus:border-[#004741] focus:bg-[#F2EFE6] transition-all outline-none text-[#1A1A1A]"
              />
              {auditSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAuditSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9890] hover:text-slate-700 cursor-pointer outline-none border-none p-0 bg-transparent flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className={cn(activeTab === 'Rapida' ? "flex-1 flex flex-col overflow-hidden" : "p-8 max-w-6xl mx-auto w-full")}>
          {activeTab === 'Dashboard' && (
            <>
              <div className="flex w-fit p-[3px] bg-[#EEECE5] rounded-[8px] mb-8 gap-[2px] items-center select-none">
                <button
                  type="button"
                  onClick={() => { setDashboardMode('Expedientes'); setSelectedFiles([]); setResult(null); setActiveAuditId(null); setActivePdfViewer(null); }}
                  className={cn(
                    "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] border-none",
                    dashboardMode === 'Expedientes'
                      ? "bg-[#F2EFE6] border-[0.5px] border-[#E2E0D8] rounded-[6px] text-[#004741] font-medium shadow-none"
                      : "bg-transparent text-[#6B6A65] font-normal"
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
                      ? "bg-[#F2EFE6] border-[0.5px] border-[#E2E0D8] rounded-[6px] text-[#004741] font-medium shadow-none"
                      : "bg-transparent text-[#6B6A65] font-normal"
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
                  <div className="mb-8 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] p-5 shadow-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#004741]" />
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
                          className="px-3 py-2 text-xs font-medium rounded-[8px] border border-[#E8E6DE] bg-[#F2EFE6] text-slate-700 outline-none cursor-pointer hover:border-[#004741]/40 transition-colors"
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
                      "border-[2px] border-dashed rounded-[12px] h-64 flex flex-col items-center justify-center transition-all cursor-pointer bg-[#F2EFE6] group shadow-none",
                      isDragActive ? "border-[#004741] bg-[#E8EFEE]" : "border-[#E8E6DE] hover:border-[#004741]/40 hover:bg-[#E8E4D8]"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105",
                      isDragActive ? "bg-[#E8EFEE] text-[#004741]" : "bg-[#DED9CC] text-slate-400"
                    )}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-base font-medium text-slate-705 mb-0.5">Arrastra uno o más archivos PDF aquí</p>
                    <p className="text-xs text-slate-400">O haz clic para explorar tus archivos</p>
                    <div className="mt-4">
                      <div className="px-3 py-1 bg-[#DED9CC] text-[#9A9890] text-[10px] font-medium rounded uppercase tracking-[0.06em]">Múltiples archivos permitidos</div>
                    </div>
                  </div>

                  {/* List of files with clean, premium design */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-8 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] p-6 shadow-none">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-[0.5px] border-[#E8E6DE]">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-[#004741]" />
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
                              className="flex items-center justify-between p-3 bg-[#E5E1D5] border-[0.5px] border-[#E8E6DE] rounded-[8px] transition-all hover:bg-[#DED9CC]/50"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 bg-rose-50 rounded-[8px] flex items-center justify-center text-rose-500 shrink-0 border-[0.5px] border-rose-100 font-normal text-[11px] font-semibold">
                                  #{idx + 1}
                                </div>
                                <div className="truncate">
                                  <div className="flex flex-wrap items-center gap-1.5 truncate">
                                    <p className="text-xs font-medium text-slate-750 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 uppercase tracking-wider", cat.color)}>
                                      {cat.label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-405 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
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

                      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end items-center border-t-[0.5px] border-[#E8E6DE] pt-6">
                        <p className="text-xs text-[#9A9890] sm:mr-auto">
                          Se analizarán {selectedFiles.length} documento{selectedFiles.length > 1 ? 's' : ''} de forma consolidada por la IA.
                        </p>
                        <button
                          onClick={handleStartAudit}
                          className="w-full sm:w-auto px-4 py-2 bg-[#004741] text-white text-xs font-medium rounded-[7px] hover:bg-[#003330] transition-all shadow-none flex items-center justify-center gap-1.5 cursor-pointer outline-none border-none"
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
                  <div className="w-full bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] p-8 shadow-none flex flex-col relative overflow-hidden">
                    {/* Visual gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#004741]" />
                    
                    {/* Live Percentage Circle or Big Display */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">Procesamiento de IA</span>
                        <h3 className="text-sm font-medium text-slate-900 mt-0.5">Auditoría EPE Digital</h3>
                      </div>
                      <div className="flex items-baseline font-mono text-3xl font-medium text-[#004741] select-none">
                        <span>{auditProgress}</span>
                        <span className="text-xs text-[#9A9890] font-normal">%</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-1.5 bg-[#E8E4D8] rounded-full overflow-hidden mt-3 relative">
                      <div 
                        className="h-full bg-[#004741] rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${auditProgress}%` }}
                      />
                    </div>

                    {/* Live label description */}
                    <p className="text-xs font-normal text-slate-600 mt-5 min-h-[40px] leading-relaxed transition-all duration-300">
                      {auditProgressLabel || "Inicializando módulos..."}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-[#E8E6DE] my-6 w-full" />

                    {/* Interactive workflow checklist */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">Fases del análisis consolidado</h4>
                      
                      {/* Phase 1 */}
                      <div className="flex items-center gap-3.5">
                        {auditProgress >= 30 ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-[#004741] animate-spin" />
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
                            <Loader2 className="w-4 h-4 text-[#004741] animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-205 bg-[#F2EFE6] shrink-0" />
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
                            <Loader2 className="w-4 h-4 text-[#004741] animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-[#F2EFE6] shrink-0" />
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
                            <Loader2 className="w-4 h-4 text-[#004741] animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-[#F2EFE6] shrink-0" />
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
                    <div className="h-px bg-[#E8E6DE] my-5 w-full" />

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
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-[#D4E8E6] text-[#003330] rounded-[4px] text-[10px] font-medium uppercase tracking-[0.06em]">Auditoría Completada</span>
                      </div>
                      <h2 className="text-xl font-medium tracking-tight text-slate-900 mt-2">Resultados Generales</h2>
                    </div>
                    <button 
                      onClick={() => { setResult(null); setSelectedFiles([]); setActiveAuditId(null); setActivePdfViewer(null); }}
                      className="py-[7px] px-[13px] bg-[#004741] text-white text-[13px] font-medium rounded-[7px] hover:bg-[#003330] transition-all outline-none whitespace-nowrap cursor-pointer border-none shadow-none"
                    >
                      Nueva Auditoría
                    </button>
                  </div>

                  {/* Metadata Banner displaying Extracted Fields */}
                  {result && (result.expedienteNumero || result.expedienteFecha || result.fondoFijoNumero || result.agenciaSucursal) && (
                    <div className="bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[12px] p-6 shadow-none flex flex-col sm:flex-row gap-6 sm:items-center">
                      {result.expedienteFecha && (
                        <div className="flex-1 min-w-[130px]">
                          <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-[#9A9890] block mb-1">Fecha Expediente</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-750 font-mono">
                              {result.expedienteFecha}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(result.expedienteFecha || '');
                                setCopiedFecha(true);
                                setTimeout(() => setCopiedFecha(false), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-[#004741] hover:bg-[#DED9CC] rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0"
                              title="Copiar fecha de expediente"
                            >
                              {copiedFecha ? (
                                <Check className="w-3.5 h-3.5 text-[#004741]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {result.expedienteNumero && (
                        <div className="flex-1 min-w-[130px] sm:border-l sm:border-[#E8E6DE] sm:pl-6">
                          <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-[#9A9890] block mb-1">N° de Expediente</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-[#1A1A1A] font-mono">
                              {result.expedienteNumero}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(result.expedienteNumero || '');
                                setCopiedExpediente(true);
                                setTimeout(() => setCopiedExpediente(false), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-[#004741] hover:bg-[#DED9CC] rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0"
                              title="Copiar número de expediente"
                            >
                              {copiedExpediente ? (
                                <Check className="w-3.5 h-3.5 text-[#004741]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {result.fondoFijoNumero && (
                        <div className="flex-1 min-w-[130px] sm:border-l sm:border-[#E8E6DE] sm:pl-6">
                          <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-[#9A9890] block mb-1">Fondo Fijo</span>
                          <span className="text-sm font-medium text-[#004741]">
                            {result.fondoFijoNumero}
                          </span>
                        </div>
                      )}
                      {result.agenciaSucursal && (
                        <div className="flex-1 min-w-[180px] sm:border-l sm:border-[#E8E6DE] sm:pl-6">
                          <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-[#9A9890] block mb-1">Origen / Agencia / Sucursal</span>
                          <span className="text-sm font-medium text-slate-800">
                            {formatHistoryTitle(result.agenciaSucursal)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {(() => {
                    const payments = result?.payments || [];
                    const totalPagos = payments.length;
                    const computedTotal = payments.reduce((acc, p) => acc + (p && typeof p.amount === 'number' && !isNaN(p.amount) ? p.amount : 0), 0);
                    const finalTotalImporte = typeof result?.totalAmount === 'number' && !isNaN(result?.totalAmount) && result?.totalAmount > 0 ? result?.totalAmount : computedTotal;
                    
                    const hasErrors = payments.some(p => p?.validations?.some(v => v?.status === 'fail')) || result?.balance_inversion?.validacion_v14?.resultado === 'error';
                    const hasWarnings = payments.some(p => p?.validations?.some(v => v?.status === 'warning'));
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#F2EFE6] p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pagos Analizados</p>
                          <p className="text-2xl font-bold text-slate-900">{totalPagos}</p>
                        </div>
                        <div className="bg-[#F2EFE6] p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Importe Total</p>
                          <div className="flex items-center gap-1.5 justify-between">
                            <p className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(finalTotalImporte)}</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(formatCurrency(finalTotalImporte));
                                setCopiedImporte(true);
                                setTimeout(() => setCopiedImporte(false), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-[#004741] hover:bg-[#DED9CC] rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0 animate-fade-in"
                              title="Copiar importe total"
                            >
                              {copiedImporte ? (
                                <Check className="w-3.5 h-3.5 text-[#004741]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        {hasErrors ? (
                          <div className="bg-[#FFF8F8] p-6 rounded-r-[12px] rounded-l-none border-t-[0.5px] border-b-[0.5px] border-r-[0.5px] border-[#E8E6DE] border-l-[3px] border-l-[#E24B4A] shadow-none flex flex-col justify-between transition-all">
                            <div>
                              <p className="text-xs font-semibold text-[#A32D2D] uppercase tracking-widest mb-3">Estado General</p>
                              <div className="flex items-center gap-1.5 text-[#A32D2D]">
                                <AlertTriangle className="w-[16px] h-[16px] text-[#A32D2D] shrink-0" />
                                <span className="text-[15px] font-medium leading-none">Con errores</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-[#C95B5B] leading-none mt-2">
                              {(() => {
                                const erroredCount = payments.filter(p => p?.validations?.some(v => v?.status === 'fail')).length || 1;
                                return `${erroredCount} pago${erroredCount !== 1 ? 's' : ''} requiere${erroredCount !== 1 ? 'n' : ''} revisión`;
                              })()}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-[#F2EFE6] p-6 rounded-[12px] border-[0.5px] border-[#E8E6DE] shadow-none flex flex-col justify-between gap-4 transition-all hover:shadow-none">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Estado General</p>
                            <div className={cn(
                              "inline-flex items-center justify-center font-bold w-fit",
                              hasWarnings ? "text-amber-500" : "text-[#004741]"
                            )}>
                              {hasWarnings ? (
                                <div className="flex items-center gap-1.5 text-amber-700">
                                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="text-sm font-medium">Con observaciones</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[#004741]">
                                  <CheckCircle2 className="w-5 h-5 text-[#004741] shrink-0" />
                                  <span className="text-sm font-medium">Excelente</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const payments = result?.payments || [];
                    const hasErrors = payments.some(p => p?.validations?.some(v => v?.status === 'fail')) || result?.balance_inversion?.validacion_v14?.resultado === 'error';
                    if (payments.length === 0 || hasErrors) return null;
                    return (
                      <div className="bg-[#E8EFEE] border border-[#004741]/15 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 transition-all hover:bg-[#ebf8f3] shadow-sm">
                        <div className="flex gap-4 items-start">
                          <div className="w-12 h-12 bg-[#F2EFE6] rounded-xl border border-emerald-500/10 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(15,110,86,0.04)] text-[#004741]">
                            <FileCheck2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-semibold text-slate-900">Informe de Auditoría Revisiva Listo</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                              El expediente cumple con los requisitos normativos de la EPE. Podés completar los campos y descargar el informe oficial de revisión de cuentas en la pestaña Revisiva.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 md:self-center">
                          <button
                            onClick={() => setActiveTab('Revisiva')}
                            className="bg-[#004741] hover:bg-[#003330] text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none shadow-none"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ir a Planilla Revisiva</span>
                          </button>
                          <button
                            onClick={() => { setPlanillasOpen(true); setActiveTab('Planilla'); }}
                            className="bg-[#F2EFE6] border border-[#004741] text-[#004741] text-xs font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer outline-none shadow-none hover:bg-[#E8EFEE]"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Ir a Planilla Control</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 px-1">Detalle de Pagos ({(result?.payments || []).length})</h3>
                    {(result?.payments || []).map((payment, idx) => (
                      <PaymentRow 
                        key={idx} 
                        payment={payment} 
                        isExpanded={expandedPayment === idx}
                        onToggle={() => setExpandedPayment(expandedPayment === idx ? null : idx)}
                        mode={result?.mode || 'Expedientes'}
                        onViewPdf={handleViewPdf}
                      />
                    ))}
                  </div>

                  {result?.balance_inversion && result.mode !== 'Viáticos' && (
                    <div className="bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] overflow-hidden transition-all shadow-none">
                      <div className="p-6 border-b-[0.5px] border-[#E8E6DE] flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shrink-0">
                          <Landmark className="w-6 h-6 text-[#004741]" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-slate-900 leading-tight">Balance de Inversión</h3>
                          <p className="text-xs text-[#9A9890] mt-0.5">
                            {result.balance_inversion.presente 
                              ? "Análisis del saldo y rendiciones pendientes." 
                              : "La planilla de Balance de Inversión no fue adjuntada."}
                          </p>
                        </div>
                        {result.balance_inversion.validacion_v14 && (
                          <div className="ml-auto">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border-none select-none",
                              result.balance_inversion.validacion_v14.resultado === 'ok' ? 'bg-[#D4E8E6] text-[#003330]' :
                              result.balance_inversion.validacion_v14.resultado === 'error' ? 'bg-[#FCEBEB] text-[#A32D2D]' :
                              'bg-amber-50 text-amber-850'
                            )}>
                              <StatusIcon status={result.balance_inversion.validacion_v14.resultado === 'ok' ? 'pass' : result.balance_inversion.validacion_v14.resultado === 'error' ? 'fail' : 'warning'} />
                              <span>
                                {result.balance_inversion.validacion_v14.resultado === 'ok' ? 'BALANCE CUADRA' : 
                                 result.balance_inversion.validacion_v14.resultado === 'error' ? 'ERROR EN BALANCE' : 'SIN BALANCE'}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {result.balance_inversion.presente && (
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-[10px]">
                              <div className="bg-[#E8E4D8] p-[10px_14px] rounded-[8px] border-[0.5px] border-[#E8E6DE]">
                                <p className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-1">Monto Fijo Asignado</p>
                                <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.monto_asignado || 0)}</p>
                              </div>
                              <div className="bg-[#E8E4D8] p-[10px_14px] rounded-[8px] border-[0.5px] border-[#E8E6DE]">
                                <p className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-1">Total Pendiente</p>
                                <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.total_pendiente || 0)}</p>
                              </div>
                              <div className="bg-[#E8E4D8] p-[10px_14px] rounded-[8px] border-[0.5px] border-[#E8E6DE]">
                                <p className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-1">Saldo en Banco</p>
                                <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.saldo_banco_declarado || 0)}</p>
                              </div>
                              <div className="bg-[#E8E4D8] p-[10px_14px] rounded-[8px] border-[0.5px] border-[#E8E6DE]">
                                <p className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-1">Saldo Calculado</p>
                                <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.saldo_banco_calculado || 0)}</p>
                              </div>
                            </div>
                            {result.balance_inversion.validacion_v14?.detalle && (
                              <div className={cn(
                                "p-4 rounded-r-[8px] rounded-l-none border-l-2",
                                result.balance_inversion.validacion_v14.resultado === 'ok' ? "bg-[#E8EFEE] border-l-[#004741] text-[#003330]" :
                                result.balance_inversion.validacion_v14.resultado === 'error' ? "bg-[#FFF8F8] border-l-[#E24B4A] text-[#A32D2D]" :
                                "bg-[#E8E4D8] border-l-[#9A9890] text-slate-700"
                              )}>
                                <p className="text-xs font-medium leading-relaxed">
                                  {result.balance_inversion.validacion_v14.detalle}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-4">Rendiciones Pendientes de Reintegro</h4>
                            {result.balance_inversion.rendiciones_pendientes && result.balance_inversion.rendiciones_pendientes.length > 0 ? (
                              <div className="border-[0.5px] border-[#E8E6DE] rounded-[8px] overflow-hidden bg-[#F2EFE6] shadow-none">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead className="bg-[#E8E4D8] text-[10px] text-[#9A9890] uppercase font-medium border-b-[0.5px] border-[#E8E6DE]">
                                    <tr>
                                      <th className="px-4 py-2.5 font-medium tracking-[0.06em]">Rendición N°</th>
                                      <th className="px-4 py-2.5 text-right font-medium tracking-[0.06em]">Importe</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {result.balance_inversion.rendiciones_pendientes.map((rendicion, idx) => (
                                      <tr key={idx} className="hover:bg-[#E8E4D8]/50 transition-colors">
                                        <td className="px-4 py-2.5 font-normal text-slate-800">{rendicion.numero}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-normal text-slate-700">{formatCurrency(rendicion.importe)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">No hay rendiciones pendientes declaradas.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alerta Patrimonio para Código 202 */}
                  {(() => {
                    const paymentsWith202 = (result?.payments || []).filter(payment => {
                      const inLibroDiario = hasAccountingCode(payment?.libroDiarioText, '202');
                      const inAnyObs = payment?.validations?.some(val => hasAccountingCode(val?.observations, '202'));
                      return inLibroDiario || inAnyObs;
                    });

                    if (paymentsWith202.length === 0) return null;

                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-5 shadow-none flex flex-col gap-4 mt-6 mb-2">
                        <div className="flex gap-3.5 items-start">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 text-amber-700">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-amber-950 leading-tight">Enviar expediente a Patrimonio para alta bien de uso</h4>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                              Se ha detectado la imputación con el código contable <strong className="font-semibold text-amber-950">202 (Adquisición de útiles, herramientas y Equipos de trabajo)</strong>. Deberás remitir este expediente al área de Patrimonio para el correspondiente alta física del bien de uso.
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-amber-250/50 mt-1 pt-3.5">
                          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-2.5">Comprobantes identificados con Código 202:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {paymentsWith202.map((p, idx) => (
                              <div key={idx} className="bg-[#F2EFE6]/80 p-3 rounded-lg border border-amber-200/60 flex flex-col shadow-sm">
                                <span className="text-xs font-semibold text-slate-800">
                                  {p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}
                                </span>
                                <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                  Factura/PIMyS N°: <span className="font-medium text-slate-700">{p.orderNumber || 'S/N'}</span>
                                </span>
                                {p.amount !== undefined && p.amount > 0 && (
                                  <span className="text-[11px] text-slate-600 mt-1 font-medium">
                                    Monto: <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Alerta de Autorizaciones para Código 226 */}
                  {(() => {
                    const paymentsWith226 = (result?.payments || []).filter(payment => {
                      const inLibroDiario = hasAccountingCode(payment?.libroDiarioText, '226');
                      const inAnyObs = payment?.validations?.some(val => hasAccountingCode(val?.observations, '226'));
                      return inLibroDiario || inAnyObs;
                    });

                    if (paymentsWith226.length === 0) return null;

                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-5 shadow-none flex flex-col gap-4 mt-4 mb-2">
                        <div className="flex gap-3.5 items-start">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0 border border-yellow-200 text-yellow-700">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-950 leading-tight">Suma Atención: Control de Aprobación Código 226</h4>
                            <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
                              Se ha detectado imputación con el código <strong className="font-semibold text-yellow-910">226 (Mantenimiento de maquinarias menores)</strong>. Estas compras deben estar debidamente autorizadas por el Jefe Administrativo de la Sucursal correspondiente:
                            </p>
                            <ul className="text-xs text-yellow-900 mt-2 space-y-1 list-disc pl-4 font-medium">
                              <li><strong className="text-yellow-950">Rafaela</strong> (UT Adm Rafaela, Ag. Rafaela, Ag Norte o Maria Juana) requiere firma de <strong className="text-emerald-900 font-semibold">Juan Chianalino</strong></li>
                              <li><strong className="text-yellow-950">Noroeste</strong> (Suc Noroeste, Ag San Cristobal, Ag San Guillermo, Ag Sunchales o Ag Tostado) requiere firma de <strong className="text-emerald-900 font-semibold">Eduardo Argañaraz</strong></li>
                              <li><strong className="text-yellow-950">Oeste</strong> (Suc Oeste, Ag El trébol, Ag Las Rosas o Ag San Jorge) requiere firma de <strong className="text-emerald-900 font-semibold">Leonardo Rostagno</strong></li>
                            </ul>
                          </div>
                        </div>
                        <div className="border-t border-yellow-200/80 mt-1 pt-3.5">
                          <p className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider mb-2.5">Facturas/Proveedores con Código 226:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {paymentsWith226.map((p, idx) => {
                              // Identify expected signer
                              let expectedSigner = "Jefe Administracion";
                              let zone = "No identificada";
                              const generalBranchText = (result?.agenciaSucursal || "").toUpperCase();
                              const paymentBranchText = ((p?.libroDiarioText || "") + " " + (p?.providerName || "")).toUpperCase();
                              const fullTextToCheck = generalBranchText + " " + paymentBranchText;
                              
                              if (fullTextToCheck.includes("RAFAELA") || fullTextToCheck.includes("CHIANALINO") || fullTextToCheck.includes("MARIA JUANA") || fullTextToCheck.includes("NORTE")) {
                                expectedSigner = "Juan Chianalino";
                                zone = "Rafaela";
                              } else if (fullTextToCheck.includes("NOROESTE") || fullTextToCheck.includes("ARGAÑARAZ") || fullTextToCheck.includes("ARGANARAZ") || fullTextToCheck.includes("CERES") || fullTextToCheck.includes("SUNCHALES") || fullTextToCheck.includes("CRISTOBAL") || fullTextToCheck.includes("GUILLERMO") || fullTextToCheck.includes("TOSTADO")) {
                                expectedSigner = "Eduardo Argañaraz";
                                zone = "Noroeste";
                              } else if (fullTextToCheck.includes("OESTE") || fullTextToCheck.includes("ROSTAGNO") || fullTextToCheck.includes("TREBOL") || fullTextToCheck.includes("ROSAS") || fullTextToCheck.includes("JORGE")) {
                                expectedSigner = "Leonardo Rostagno";
                                zone = "Oeste";
                              } else {
                                if (generalBranchText.includes("RAFAELA")) {
                                  expectedSigner = "Juan Chianalino";
                                  zone = "Rafaela";
                                } else if (generalBranchText.includes("NOROESTE")) {
                                  expectedSigner = "Eduardo Argañaraz";
                                  zone = "Noroeste";
                                } else if (generalBranchText.includes("OESTE")) {
                                  expectedSigner = "Leonardo Rostagno";
                                  zone = "Oeste";
                                }
                              }

                              // Check if approved in observations
                              const v4Val = p?.validations?.find(val => val?.code?.toLowerCase() === 'v4' || val?.id?.toLowerCase() === 'v4' || val?.code?.toLowerCase() === 'validation_v4');
                              const v4Obs = (v4Val?.observations || "").toUpperCase();
                              const cleanSigner = expectedSigner.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                              const hasProperSignature = v4Obs.includes(expectedSigner.toUpperCase()) || 
                                                     v4Obs.includes(cleanSigner) ||
                                                     (v4Val?.status === 'pass' && !v4Obs.includes("FALTA"));

                              return (
                                <div key={idx} className="bg-[#F2EFE6]/90 p-3 rounded-lg border border-yellow-250 flex flex-col shadow-sm">
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="text-xs font-semibold text-slate-800">
                                      {p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}
                                    </span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${hasProperSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {hasProperSignature ? 'Verificado' : 'No Encontrado'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                    Factura/PIMyS N°: <span className="font-medium text-slate-700">{p.orderNumber || 'S/N'}</span>
                                  </span>
                                  <div className="text-[11px] text-slate-600 mt-1">
                                    Jurisdicción: <span className="font-semibold text-slate-700">{zone}</span> | Requiere: <strong className="text-amber-950 font-semibold">{expectedSigner}</strong>
                                  </div>
                                  {p.amount !== undefined && p.amount > 0 && (
                                    <span className="text-[11px] text-slate-600 mt-1 font-medium font-mono">
                                      Monto: <span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sección Informe Copiable */}
                  <div id="informe-copiable" className="bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] overflow-hidden transition-all shadow-none">
                    <div className="p-6 border-b-[0.5px] border-[#E8E6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F2EFE6]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-[#004741]" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-slate-900 leading-tight">Informe de Auditoría</h3>
                          <p className="text-xs text-[#9A9890] mt-0.5">
                            Resumen estructurado de desvíos para copiar y enviar al responsable.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={copyInformeToClipboard}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 py-[7px] px-[13px] rounded-[7px] text-[13px] font-medium transition-all border-none outline-none cursor-pointer shadow-none",
                          copiedInforme 
                            ? "bg-[#D4E8E6] text-[#003330] hover:bg-[#d0f0e5]"
                            : "bg-[#004741] text-white hover:bg-[#003330]"
                        )}
                      >
                        {copiedInforme ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Informe</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6 bg-[#2D2D2D] text-white font-mono text-xs rounded-b-[12px] shadow-none relative border-t-[0.5px] border-[#3A3A3A]">
                      <div className="absolute top-4 right-4 bg-[#3A3A3A] text-[#9A9890] text-[9px] uppercase font-medium tracking-[0.06em] px-2 py-0.5 rounded select-none">
                        Vista Previa
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-[#004741]/40 max-h-[400px] pr-2">
                        {generateReportText()}
                      </pre>
                    </div>
                  </div>

                </motion.div>
              )}
            </>
          )}

          {activeTab === 'Historial' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shadow-none">
                    <FileText className="w-6 h-6 text-[#9A9890]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium tracking-tight text-slate-900">Historial</h2>
                    <p className="text-xs text-[#9A9890] mt-0.5">Auditorías previas completadas.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportHistory}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#F2EFE6] border border-[#D3D1C7] text-slate-700 text-xs font-medium rounded-[7px] hover:bg-[#E5E1D5] hover:text-slate-900 transition-all cursor-pointer shadow-none outline-none select-none"
                    title="Exportar respaldo de historial en formato JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Copia</span>
                  </button>
                  <label
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#D4E8E6] border border-[#BFEDDB] text-[#003330] text-xs font-medium rounded-[7px] hover:bg-[#d0f0e5] transition-all cursor-pointer shadow-none outline-none select-none"
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
                <div className="p-16 text-center border-[0.5px] border-dashed border-[#E8E6DE] rounded-[12px] bg-[#F2EFE6]/50">
                  <FileText className="w-12 h-12 text-[#9A9890]/40 mx-auto mb-4" />
                  <p className="text-[#9A9890] font-medium text-sm">No hay auditorías registradas todavía.</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-16 text-center border-[0.5px] border-dashed border-[#E8E6DE] rounded-[12px] bg-[#F2EFE6]/50 animate-fade-in">
                  <Search className="w-12 h-12 text-[#9A9890]/30 mx-auto mb-4" />
                  <p className="text-slate-800 font-semibold text-sm mb-1">No se encontraron resultados para "{auditSearchQuery}"</p>
                  <p className="text-xs text-[#9A9890] max-w-sm mx-auto leading-relaxed">
                    Prueba con otro número de expediente (ej. <b className="text-slate-700">9708</b>), fecha, agencia, sucursal, responsable o palabra de resumen.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuditSearchQuery('')}
                    className="mt-4 px-4 py-1.5 bg-[#F2EFE6] border border-[#D3D1C7] hover:bg-[#E5E1D5] hover:text-slate-900 text-slate-700 text-xs font-medium rounded-[7px] transition-all cursor-pointer outline-none shadow-none"
                  >
                    Limpiar Búsqueda
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map(entry => (
                    <div 
                      key={entry.id} 
                      className="bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] p-6 rounded-[12px] shadow-none flex flex-col sm:flex-row gap-6 sm:items-center justify-between group animate-fade-in"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.result?.mode === 'Viáticos' ? (
                            <span className="px-[10px] py-[3px] bg-purple-100/60 text-purple-700 rounded-[20px] text-[11px] font-medium leading-none">
                              Viáticos
                            </span>
                          ) : (
                            <span className="px-[10px] py-[3px] bg-[#D4E8E6] text-[#003330] rounded-[20px] text-[11px] font-medium leading-none">
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
                          ) : (
                            <span className="text-xs font-medium bg-[#E8E4D8] text-slate-600 px-2.5 py-1 rounded-md">
                              FF-{entry.FF || 'Sin ID'}
                            </span>
                          )}

                          {entry.result?.expedienteNumero && (
                            <span className="text-xs font-medium bg-[#E8E4D8] text-slate-500 border border-[#E8E6DE] px-2 py-0.5 rounded-md font-mono">
                              Exp. {entry.result.expedienteNumero}
                              {entry.result.expedienteFecha ? ` (${entry.result.expedienteFecha})` : ''}
                            </span>
                          )}

                          <span className="text-xs text-[#9A9890] ml-auto sm:ml-2">
                            {new Date(entry.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{safeText(entry.summary)}</p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button 
                          onClick={() => {
                            setResult(entry.result);
                            setActiveAuditId(entry.id);
                            if (entry.result.mode) {
                              setDashboardMode(entry.result.mode);
                            } else {
                              setDashboardMode('Expedientes');
                            }
                            setActiveTab('Dashboard');
                          }}
                          className="py-[6px] px-[14px] bg-[#F2EFE6] border border-[#D3D1C7] text-[#004741] text-[13px] font-medium rounded-[7px] hover:bg-[#E8EFEE] transition-all shadow-none cursor-pointer select-none outline-none"
                        >
                          Ver Reporte
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(entry.id);
                          }}
                          title="Eliminar auditoría"
                          className="p-2 text-[#9A9890] hover:text-red-600 hover:bg-red-50 rounded-[7px] transition-all cursor-pointer outline-none border border-transparent hover:border-red-100"
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
                <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shadow-none">
                  <ShieldCheck className="w-6 h-6 text-[#004741]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Marco Normativo</h2>
                  <p className="text-xs text-[#9A9890] mt-0.5">Reglas, límites y responsables vigentes para Fondos Fijos.</p>
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
            <RapidaTab selectedModel={selectedModel} setSelectedModel={setSelectedModel} showNotification={showNotification} />
          )}

          {activeTab === 'Códigos' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shadow-none">
                  <FileCheck2 className="w-6 h-6 text-[#004741]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Códigos PIMyS</h2>
                  <p className="text-xs text-[#9A9890] mt-0.5">Diccionario completo de conceptos y códigos autorizados.</p>
                </div>
              </div>

              <div className="flex p-[3px] bg-[#EEECE5] rounded-[8px] mb-6 gap-[2px] w-fit select-none items-center">
                {(Object.keys(PIMYS_CODES) as Array<keyof typeof PIMYS_CODES>).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCodeCategory(cat)}
                    className={cn(
                      "transition-all duration-200 outline-none cursor-pointer text-[13px] py-[5px] px-[16px] whitespace-nowrap border-none leading-none",
                      activeCodeCategory === cat 
                        ? "bg-[#F2EFE6] border-[0.5px] border-[#E2E0D8] rounded-[6px] text-[#004741] font-medium shadow-none"
                        : "bg-transparent text-[#6B6A65] font-normal"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[#9A9890]" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    value={codeSearchQuery}
                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                    className="block w-full pl-[36px] pr-[12px] py-[8px] border border-[#D3D1C7] rounded-[8px] bg-[#F2EFE6] text-[13px] text-[#1A1A1A] placeholder-[#9A9890] focus:border-[#004741] focus:ring-0 outline-none"
                    placeholder="Buscar por código o palabra..."
                  />
                </div>
              </div>

              <div className="bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] shadow-none overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#E8E4D8]/50 text-[10px] text-[#9A9890] uppercase font-medium tracking-[0.06em]">
                      <tr className="bg-[#E8E4D8] border-b-[1.5px] border-[#D3D1C7]">
                        <th className="p-[12px_16px] border-r-[0.5px] border-[#E8E6DE]" style={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>Código</th>
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
                        <tr key={idx} className="border-b border-[#E8E6DE] hover:bg-[#E5E1D5]/50 transition-colors">
                          <td className="p-[12px_16px] font-mono font-medium text-[#004741] border-r-[0.5px] border-[#E8E6DE] align-top text-base whitespace-nowrap" style={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                            {item.code}
                          </td>
                          <td className="p-[12px_16px] text-[#1A1A1A] leading-[1.5] font-normal align-top text-[13px]">
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

          {activeTab === 'Revisiva' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-6"
              id="revisiva-tab-container"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center shadow-none text-[#004741]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">Planilla Revisiva</h2>
                  <p className="text-xs text-[#9A9890] mt-0.5">Asistente de autocompletado y emisión del informe revisivo oficial de la EPE.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Control Panel: Left (col-span-5) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between h-5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parámetros de Entrada</span>
                  </div>
                  <div className="bg-[#F2EFE6] rounded-[12px] border-[0.5px] border-[#E8E6DE] p-6 shadow-none space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#004741]" />
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
                        className="block w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm bg-[#F2EFE6] text-slate-900 focus:border-[#004741] outline-none font-medium"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="RAFAELA">RAFAELA</option>
                        <option value="NOROESTE">NOROESTE</option>
                        <option value="OESTE">OESTE</option>
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
                          "block w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm bg-[#F2EFE6] text-slate-900 focus:border-[#004741] outline-none font-medium",
                          !pdfGciaSuc && "opacity-60 cursor-not-allowed bg-[#E5E1D5]"
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
                    <div className="border-t border-slate-150 pt-4 mt-2 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#004741] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Responsable (Autocompletado)</span>
                          <span className="text-[10px] text-slate-400 font-normal">Editable</span>
                        </label>
                        <input
                          id="responsable-input"
                          type="text"
                          value={pdfResponsable}
                          onChange={(e) => setPdfResponsable(e.target.value)}
                          className="block w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm bg-[#F2EFE6] text-slate-900 focus:border-[#004741] outline-none font-medium"
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
                          className="block w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm bg-[#F2EFE6] text-slate-900 focus:border-[#004741] outline-none font-medium"
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
                            className="block w-full px-3 py-2 border border-[#D3D1C7] rounded-lg text-sm bg-[#F2EFE6] text-slate-900 focus:border-[#004741] outline-none font-medium font-mono"
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
                        className="w-full py-2.5 bg-[#004741] text-white hover:bg-[#003330] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
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
                        className="w-full py-2 border border-slate-200 bg-[#F2EFE6] hover:bg-[#E5E1D5] text-slate-600 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Limpiar Selección
                      </button>
                    </div>
                  </div>

                  {/* Summary Mapping Lists grouped elegantly */}
                  <div className="bg-[#FFFDF9] border border-[#E9E4D4] rounded-xl p-5 text-slate-600 text-xs shadow-none space-y-3">
                    <h4 className="font-semibold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                      <Info className="w-3.5 h-3.5 text-amber-700" />
                      <span>Grilla de Responsables Registrados</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Estructura oficial de dependencias y agentes asignados:
                    </p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 divide-y divide-slate-150">
                      {Object.entries(SECTOR_MAPPING).map(([gcia, sectors]) => (
                        <div key={gcia} className="pt-2 first:pt-0">
                          <span className="font-semibold text-[#004741] text-[9.5px] uppercase tracking-wide block mb-1">
                            {gcia}
                          </span>
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {sectors.map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                                <span className="text-slate-600 font-medium truncate max-w-[190px]" title={s.label}>
                                  {s.label}
                                </span>
                                <span className="text-[#004741] font-mono text-[10.5px] font-bold shrink-0">
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

                  <div className="bg-[#EEECE5] rounded-[12px] p-6 shadow-inner overflow-x-hidden">
                    {/* Simulated Paper Sheet */}
                    <div className="w-[580px] mx-auto bg-[#F2EFE6] text-black font-sans border-[0.5px] border-slate-300 p-8 space-y-4 shadow-md" style={{ minHeight: '750px' }} id="simulated-paper-page">
                      {/* Paper Header */}
                      <div className="border border-black grid grid-cols-12 items-center text-center divide-x divide-black text-[9px]">
                        <div className="col-span-4 p-2 flex flex-col items-center justify-center bg-[#F2EFE6]">
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
                        <div className="grid grid-cols-12 font-bold uppercase tracking-wider border-b border-black text-center divide-x divide-black py-0.5 bg-[#DED9CC]">
                          <div className="col-span-4">Responsable</div>
                          <div className="col-span-2">Fdo.Fijo Nro.</div>
                          <div className="col-span-3">Repartición</div>
                          <div className="col-span-3">Gcia./Suc.</div>
                        </div>
                        <div className="grid grid-cols-12 uppercase divide-x divide-black text-center min-h-[22px] items-center py-1 font-mono text-[8px]">
                          <div className="col-span-4 px-1 truncate font-bold text-[#004741]">
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
                            <span className="text-center font-bold text-[8px] text-red-655">NO</span>
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
              className="w-full lg:w-auto h-full border-l border-slate-200 bg-[#F2EFE6] shadow-2xl flex flex-col relative z-30 shrink-0"
              style={{ width: isLargeScreen ? `${pdfWidth}px` : '100%' }}
            >
              {/* Splitter Handle for resizing */}
              {isLargeScreen && (
                <div
                  onMouseDown={startResize}
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center bg-[#E5E1D5]/50 border-r border-slate-200 hover:bg-[#004741]/20 transition-all z-50 group",
                    isDragging && "bg-[#004741]/35 border-[#004741]/50 w-2.5"
                  )}
                  title="Arrastrar para redimensionar"
                >
                  <div className="w-[3px] h-14 bg-slate-300 group-hover:bg-[#004741]/50 rounded-full transition-colors" />
                </div>
              )}

              {/* Sidebar Content Container (indented on large screens to clear the splitter) */}
              <div className="flex-1 flex flex-col min-h-0 lg:pl-2 w-full h-full">
                {/* Header of the PDF Viewer */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#E5E1D5]">
                  <div className="flex items-center gap-2 overflow-hidden mr-4">
                    <div className="p-2 bg-[#004741]/10 rounded-lg text-[#004741] shrink-0">
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
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-[#004741] rounded-lg transition-colors cursor-pointer outline-none border-none bg-transparent"
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
                <div className="px-4 py-2 bg-[#004741]/5 border-b border-[#004741]/10 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-[#004741] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#004741]">Consejo:</span> El documento se visualiza directamente en tiempo real. Si necesitas verlo externo, puedes abrir o descargar desde arriba.
                  </div>
                </div>

                {/* If there are multiple files, we can also let them navigate between files in the same sidebar! */}
                {(() => {
                  const filesList = activeAuditId ? auditFilesMap[activeAuditId] : selectedFiles;
                  if (filesList && filesList.length > 1) {
                    return (
                      <div className="px-4 py-2 border-b border-slate-100 bg-[#E5E1D5]/50 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
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
                                  ? "bg-[#004741] text-white border-[#004741]" 
                                  : "bg-[#F2EFE6] text-slate-600 border-slate-200 hover:bg-[#DED9CC]"
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
                <div className="flex-1 relative overflow-hidden h-full min-h-0 bg-[#DED9CC]">
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
        ? "!border-l-[#004741] !rounded-tl-none !rounded-bl-none rounded-tr-[6px] rounded-br-[6px] bg-[#E8EFEE] !text-[#004741] !font-medium" 
        : "border-l-transparent text-slate-500 hover:bg-[#E5E1D5] hover:text-slate-900"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-[#004741]" : "text-slate-400")} />
      <span>{label}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, iconColor, iconBg, title, description }: { icon: any, iconColor: string, iconBg: string, title: string, description: string }) {
  return (
    <div className="bg-[#F2EFE6] p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

interface PaymentRowProps {
  payment: PaymentData;
  isExpanded: boolean;
  onToggle: () => void;
  mode: 'Expedientes' | 'Viáticos';
  onViewPdf?: (fileIdx: number, pageNum?: number) => void;
  key?: React.Key | number | string;
}

function toSentenceCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Convierte cualquier valor a string seguro para renderizar en JSX.
// Protege contra datos viejos o respuestas del modelo donde un campo de texto
// llegó como objeto (causa del error React #31 / pantalla en blanco).
function renderBold(text: string): React.ReactNode {
  if (!text.includes('**')) return text;
  const parts = text.split('**');
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-slate-900">{part}</strong>
      : part
  );
}

function safeText(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    try {
      return Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' · ');
    } catch {
      return '';
    }
  }
  return String(val);
}

function hasAccountingCode(text: string | null | undefined, code: string): boolean {
  if (!text) return false;
  const regex = new RegExp(`\\b${code}\\b`, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + code.length;
    
    let isPartOfPrice = false;
    if (start > 1) {
      const prevChar = text[start - 1];
      const prevPrevChar = text[start - 2];
      if ((prevChar === '.' || prevChar === ',') && /\d/.test(prevPrevChar)) {
        isPartOfPrice = true;
      }
    }
    if (end < text.length - 1) {
      const nextChar = text[end];
      const nextNextChar = text[end + 1];
      if ((nextChar === '.' || nextChar === ',') && /\d/.test(nextNextChar)) {
        isPartOfPrice = true;
      }
    }
    
    if (!isPartOfPrice) {
      return true;
    }
  }
  return false;
}

function formatHistoryTitle(val: string): string {
  if (!val) return '';
  let result = val.toLowerCase().split(' ').map((word, index) => {
    if (!word) return '';
    const lowercaseMatches = ['de', 'la', 'el', 'los', 'las', 'en', 'y', 'o', 'con', 'del'];
    if (lowercaseMatches.includes(word) && index !== 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  result = result.replace(/\s*-\s*/g, ' — ');
  result = result.replace(/\bFf\b/g, 'FF');
  result = result.replace(/\bId\b/g, 'ID');
  result = result.replace(/\bEpe\b/g, 'EPE');
  result = result.replace(/\bN°\b/gi, 'N°');
  return result;
}

function PaymentRow({ payment, isExpanded, onToggle, mode, onViewPdf }: PaymentRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  
  const currentValidations = mode === 'Viáticos' ? VALIDATIONS_VIATICOS : VALIDATIONS.filter(v => v.id !== 'v14');

  const validationsList = payment?.validations || [];
  const validCnt = validationsList.filter(v => v && v.status === 'pass').length;
  const totalCnt = currentValidations.length;
  const errorCnt = validationsList.filter(v => v && v.status === 'fail').length;
  const warnCnt = validationsList.filter(v => v && v.status === 'warning').length;

  let badgeEl = null;
  if (errorCnt > 0) {
    badgeEl = (
      <div className="bg-[#FCEBEB] text-[#A32D2D] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <AlertCircle className="w-3.5 h-3.5 text-[#A32D2D]" />
        <span>{errorCnt} Errores</span>
      </div>
    );
  } else if (warnCnt > 0) {
    badgeEl = (
      <div className="bg-amber-50 text-amber-850 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>{warnCnt} Obs.</span>
      </div>
    );
  } else {
    badgeEl = (
      <div className="bg-[#D4E8E6] text-[#003330] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#003330]" />
        <span>{validCnt}/{totalCnt} Validaciones</span>
      </div>
    );
  }

  return (
    <div 
      ref={rowRef} 
      className={cn(
        "bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] mb-4 last:mb-0 overflow-hidden transition-all shadow-none",
        errorCnt > 0 ? "border-l-3 border-l-[#E24B4A] rounded-r-[8px] rounded-l-none" : "rounded-[8px]"
      )}
    >
      <div 
        onClick={onToggle}
        className="grid grid-cols-[75px_1.5fr_1fr_220px_24px] gap-4 items-center p-[11px_14px] cursor-pointer selection:bg-transparent select-none"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">PIMyS N°</span>
          <span className="text-[13px] font-medium text-slate-900">{payment?.orderNumber}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">Proveedor</span>
          <span className="text-[13px] font-medium text-slate-900 truncate block" title={payment?.providerName}>
            {toSentenceCase(payment?.providerName || '')}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">Importe</span>
          <span className="font-mono text-[13px] font-medium text-slate-900">{formatCurrency(payment?.amount)}</span>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {badgeEl}
          {payment?.pageNumber && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPdf?.(payment?.sourceFileIdx || 0, payment?.pageNumber);
              }}
              className="p-1 px-2 text-[#9A9890] hover:text-[#004741] hover:bg-[#E8EFEE] rounded-[6px] border-[0.5px] border-[#E2E0D8] transition-all cursor-pointer outline-none flex items-center justify-center shrink-0"
              title="Ver original"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span className="text-[10px] font-medium">Pág {payment.pageNumber}</span>
            </button>
          )}
        </div>
        <div className="flex justify-end text-[#C8C6BE] shrink-0">
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-90")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t-[0.5px] border-[#E8E6DE] bg-[#E8E4D8]/40"
          >
            <div className="p-6 sm:p-8">
              <h4 className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-6">Detalle de Validaciones</h4>
              <div className="flex flex-col gap-6">
                {currentValidations.map((v) => {
                  const res = validationsList.find(rv => rv && rv.id && rv.id.toLowerCase() === v.id.toLowerCase());
                  const status = (res?.status as any) || 'warning';
                  
                  return (
                    <div key={v.id} className="flex gap-4 items-start pb-6 border-b-[0.5px] border-[#E8E6DE] last:border-0 last:pb-0">
                      <div className="mt-1 shrink-0 bg-[#F2EFE6] p-1 rounded-full shadow-none border-[0.5px] border-[#E8E6DE]">
                        <StatusIcon status={status} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[11px] font-medium font-mono px-2 py-0.5 rounded shadow-none border-[0.5px]",
                              status === 'pass' ? "bg-[#D4E8E6] text-[#003330] border-[#9FE1CB]" :
                              status === 'fail' ? "bg-[#FCEBEB] text-[#A32D2D] border-[#F8CCCC]" :
                              "bg-amber-50 text-amber-800 border-amber-250"
                            )}>
                              {v.label}
                            </span>
                            <span className="text-[14px] font-medium text-slate-850 tracking-tight">{v.title}</span>
                          </div>
                          
                          {payment.pageNumber && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewPdf?.(payment.sourceFileIdx || 0, payment.pageNumber);
                              }}
                              className="self-start sm:self-auto p-1.5 text-slate-500 hover:text-[#004741] hover:bg-[#E8EFEE] rounded-lg border-[0.5px] border-[#E2E0D8] transition-all cursor-pointer outline-none flex items-center justify-center shrink-0"
                              title="ver pdf"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className={cn(
                          "text-[13px] leading-relaxed mt-1.5 p-3.5 rounded-[8px] bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] shadow-none border-l-2",
                          status === 'pass' ? "border-l-emerald-500 text-slate-650" :
                          status === 'fail' ? "border-l-[#E24B4A] text-slate-800" :
                          "border-l-amber-400 text-slate-600 italic"
                        )}>
                          {(res?.observations || 'Dato no analizado por la IA.').split('\n').map((line, li, arr) => (
                            <React.Fragment key={li}>
                              {renderBold(line)}
                              {li < arr.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Render Vales segment for mobility vouchers (combustibles, motor, ruedas, etc.) */}
              {payment.vales && payment.vales.length > 0 && (
                <div className="mt-8 pt-6 border-t-[0.5px] border-[#E8E6DE]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 bg-[#004741] rounded-full" />
                    <h5 className="text-[10px] font-medium text-[#004741] uppercase tracking-[0.06em]">
                      Vales de Provisión de Combustible / Ruedas ({payment.vales.length})
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payment.vales.map((vale, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "bg-[#F2EFE6] border-[0.5px] rounded-[12px] p-4 transition-all flex flex-col justify-between gap-3 shadow-none",
                          vale.legible ? "border-[#E8E6DE]" : "border-amber-300 bg-amber-50/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] bg-[#E5E1D5] border-[0.5px] border-[#E8E6DE] px-2 py-0.5 rounded">
                            Vale N° {vale.numero}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1",
                            vale.legible 
                              ? "bg-[#D4E8E6] text-[#003330]" 
                              : "bg-amber-100 text-amber-805"
                          )}>
                            {vale.legible ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-[#004741]" />
                                Legible
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Ilegible
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] block">
                            Precio Total
                          </span>
                          {vale.legible && vale.precioTotal ? (
                            <span className="font-mono text-base font-medium text-slate-800">
                              {formatCurrency(parseFloat(vale.precioTotal))}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-700 italic block">
                              Letra no legible en vale N° {vale.numero}
                            </span>
                          )}
                        </div>

                        {vale.textoExtraido && (
                          <div className="mt-1 pt-2 border-t-[0.5px] border-dashed border-[#E8E6DE] text-xs text-[#6B6A65]">
                            <strong className="font-medium text-[#9A9890] uppercase text-[9px] tracking-wider block mb-1">Detalle extraído:</strong> 
                            <span className="font-normal">{vale.textoExtraido}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warning' }) {
  if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'fail') return <XCircle className="w-5 h-5 text-rose-500" />;
  return <AlertCircle className="w-5 h-5 text-amber-500" />;
}
