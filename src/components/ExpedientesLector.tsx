import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2, RefreshCw, Search, Table2, XCircle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import type { ExpedienteLector } from '../../api/expedientes';
import { ResultadosExpediente } from './ResultadosExpediente';

// Expedientes auditados por el lector de expedientes, leidos del Google Sheet
// a traves de /api/expedientes. La clave de acceso la escribe el usuario una
// vez y queda en este navegador; nunca esta en el codigo.
const CLAVE_STORAGE = 'lector-access-key';

function leerClave(): string {
  try { return localStorage.getItem(CLAVE_STORAGE) || ''; } catch { return ''; }
}

function guardarClave(clave: string) {
  try {
    if (clave) localStorage.setItem(CLAVE_STORAGE, clave);
    else localStorage.removeItem(CLAVE_STORAGE);
  } catch { /* sin almacenamiento: se pide en cada visita */ }
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
  const [claveEscrita, setClaveEscrita] = useState('');
  const [expedientes, setExpedientes] = useState<ExpedienteLector[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

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

  // Agrupados por region y fondo, en el orden del Sheet.
  const grupos = useMemo(() => {
    const salida: Array<{ titulo: string; items: ExpedienteLector[] }> = [];
    for (const e of filtrados) {
      const titulo = `${e.region} — ${e.hoja}`;
      const grupo = salida.find(g => g.titulo === titulo);
      if (grupo) grupo.items.push(e); else salida.push({ titulo, items: [e] });
    }
    return salida;
  }, [filtrados]);

  const actual = (expedientes || []).find(e => e.id === seleccionado) || null;

  if (!clave) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
        <div className="bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[12px] p-6 shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F2EFE6] rounded-[10px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#004741]" />
            </div>
            <div>
              <h2 className="text-base font-medium text-slate-900">Expedientes del lector</h2>
              <p className="text-xs text-[#9A9890] mt-0.5">Ingresá la clave de acceso. Queda guardada en este navegador.</p>
            </div>
          </div>
          <form
            onSubmit={e => { e.preventDefault(); const c = claveEscrita.trim(); if (c) { guardarClave(c); setClave(c); setClaveEscrita(''); } }}
            className="flex gap-2"
          >
            <input
              type="password"
              value={claveEscrita}
              onChange={e => setClaveEscrita(e.target.value)}
              placeholder="Clave de acceso"
              autoComplete="off"
              className="flex-1 bg-white/60 border-[0.5px] border-[#D3D1C7] rounded-[7px] px-3 py-2 text-sm outline-none focus:border-[#004741]"
            />
            <button type="submit" className="py-[7px] px-[13px] bg-[#004741] text-white text-[13px] font-medium rounded-[7px] hover:bg-[#003330] transition-all outline-none cursor-pointer border-none">
              Entrar
            </button>
          </form>
          {error && <p className="text-xs text-[#A32D2D] mt-3">{error}</p>}
        </div>
      </motion.div>
    );
  }

  if (actual) {
    return (
      <div>
        <button
          type="button"
          onClick={() => { setSeleccionado(null); setExpandedPayment(null); }}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#004741] transition-colors cursor-pointer bg-transparent border-none outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a los expedientes del lector
        </button>
        <ResultadosExpediente
          result={actual.result}
          expandedPayment={expandedPayment}
          setExpandedPayment={setExpandedPayment}
          etiqueta={`Lector de expedientes${actual.auditado ? ` · ${actual.auditado}` : ''}`}
        />
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
            {busqueda ? `No se encontraron expedientes para "${busqueda}".` : 'No hay expedientes en el Google Sheet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map(g => (
            <div key={g.titulo}>
              <h3 className="text-[10px] font-medium text-[#9A9890] uppercase tracking-[0.06em] mb-3 px-1">{g.titulo}</h3>
              <div className="space-y-3">
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
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
