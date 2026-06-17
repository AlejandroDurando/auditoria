import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface Props {
  base64: string;
  fileName: string;
}

function PageCanvas({ pdf, pageNum, scale }: { key?: number; pdf: any; pageNum: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let active = true;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdf.getPage(pageNum).then((page: any) => {
      if (!active || !canvasRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);
      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      task.promise.then(
        () => { renderTaskRef.current = null; },
        (err: any) => { if (err.name !== 'RenderingCancelledException') console.error(err); }
      );
    });

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdf, pageNum, scale]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden shrink-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

export function PdfScrollViewer({ base64, fileName }: Props) {
  const [pdf, setPdf] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [libLoaded, setLibLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.pdfjsLib) { setLibLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      setLibLoaded(true);
    };
    script.onerror = () => setError('No se pudo cargar PDF.js. Comprobá tu conexión.');
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!libLoaded || !base64) return;
    let active = true;
    setLoading(true);
    setError(null);
    setPdf(null);
    setTotalPages(0);
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      window.pdfjsLib.getDocument({ data: bytes }).promise.then(
        (doc: any) => {
          if (!active) return;
          setPdf(doc);
          setTotalPages(doc.numPages);
          setLoading(false);
        },
        (err: any) => {
          if (!active) return;
          setError('Error al procesar el PDF.');
          setLoading(false);
        }
      );
    } catch {
      setError('Archivo PDF inválido.');
      setLoading(false);
    }
    return () => { active = false; };
  }, [libLoaded, base64]);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-white shrink-0">
        <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{fileName}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.6))} disabled={!pdf}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 outline-none" title="Reducir">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-500 font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3.0))} disabled={!pdf}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 outline-none" title="Ampliar">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setScale(1.2)} disabled={!pdf}
            className="ml-1 p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 outline-none" title="Restablecer">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        {totalPages > 0 && (
          <span className="text-xs text-slate-400 font-mono shrink-0">{totalPages} págs.</span>
        )}
      </div>

      {/* Scrollable pages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 mt-20">
            <Loader2 className="w-8 h-8 text-[#0F6E56] animate-spin" />
            <p className="text-sm text-slate-500">Cargando documento...</p>
          </div>
        )}
        {error && (
          <div className="max-w-sm mx-auto mt-16 bg-white p-6 rounded-2xl border border-rose-200 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        )}
        {pdf && Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <PageCanvas key={pageNum} pdf={pdf} pageNum={pageNum} scale={scale} />
        ))}
      </div>
    </div>
  );
}
