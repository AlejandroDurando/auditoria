import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Declare pdfjsLib globally
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PdfCanvasViewerProps {
  base64: string;
  initialPage?: number;
  fileName: string;
}

export function PdfCanvasViewer({ base64, initialPage = 1, fileName }: PdfCanvasViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [libLoaded, setLibLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Sync initialPage when it changes
  useEffect(() => {
    if (initialPage > 0) {
      setCurrentPage(initialPage);
    }
  }, [initialPage, base64]);

  // Load PDF.js CDN libraries
  useEffect(() => {
    if (window.pdfjsLib) {
      setLibLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      setLibLoaded(true);
    };
    script.onerror = () => {
      setError('No se pudo cargar la librería de lectura de PDF (PDF.js). Comprueba tu conexión de red.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep it in window so we don't reload multiple times
    };
  }, []);

  // Base64 to Uint8Array converter
  const base64ToUint8Array = (base64Str: string): Uint8Array => {
    try {
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error("Base64 decoding failed:", e);
      throw new Error("El archivo PDF tiene un formato inválido o está corrupto.");
    }
  };

  // Load Document
  useEffect(() => {
    if (!libLoaded || !base64) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);
    setPdf(null);

    try {
      const pdfData = base64ToUint8Array(base64);
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });

      loadingTask.promise.then(
        (loadedPdf: any) => {
          if (!isSubscribed) return;
          setPdf(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setLoading(false);
          // If suggested initialPage is larger than document pages, clamp it
          if (initialPage > loadedPdf.numPages) {
            setCurrentPage(1);
          } else {
            setCurrentPage(initialPage);
          }
        },
        (err: any) => {
          console.error("Error loading PDF document:", err);
          if (!isSubscribed) return;
          setError('Error al procesar el archivo PDF. Es posible que el archivo esté protegido o dañado.');
          setLoading(false);
        }
      );
    } catch (e: any) {
      setError(e.message || 'Error al procesar el archivo PDF.');
      setLoading(false);
    }

    return () => {
      isSubscribed = false;
    };
  }, [libLoaded, base64]);

  // Render Page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let isSubscribed = true;

    // Cancel previous render task if active
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdf.getPage(currentPage).then(
      (page: any) => {
        if (!isSubscribed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Get viewport with desired scale
        // Using high-device-pixel-ratio to make the copy look extremely sharp on modern displays
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });
        
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Scale context
        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        renderTask.promise.then(
          () => {
            if (isSubscribed) {
              renderTaskRef.current = null;
            }
          },
          (err: any) => {
            // Check if it's a cancellation error, which is normal when page changes quickly
            if (err.name !== 'RenderingCancelledException') {
              console.error("Rendering error:", err);
            }
          }
        );
      },
      (err: any) => {
        console.error("Error getting page:", err);
      }
    );

    return () => {
      isSubscribed = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdf, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  const handleZoomReset = () => {
    setScale(1.2);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-[#FAF8F4]">
        {/* Navigation Contols */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed outline-none"
            title="Página Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
            <span className="font-semibold text-slate-950 font-mono">{currentPage}</span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-500">{totalPages || '?'}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed outline-none"
            title="Página Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={loading || !pdf}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed outline-none"
            title="Reducir Zoom"
          >
            <ZoomIn className="w-4 h-4 rotate-180 scale-x-[-1]" />
          </button>
          
          <span className="text-xs font-semibold text-slate-500 font-mono w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={loading || !pdf}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed outline-none"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomReset}
            disabled={loading || !pdf}
            className="ml-1 p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed outline-none"
            title="Restablecer vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-100/80 z-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#1f4e79] animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Cargando documento...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto my-12 bg-[#FAF8F4] p-6 rounded-2xl border border-rose-200 shadow-sm flex flex-col items-center text-center gap-3">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <h4 className="text-base font-bold text-slate-900">No se pudo visualizar el PDF</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
          </div>
        )}

        {!error && (
          <div className="bg-[#FAF8F4] rounded-xl shadow-md border border-slate-200 overflow-hidden shrink-0">
            <canvas ref={canvasRef} className="block bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
