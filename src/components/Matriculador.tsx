import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Loader2, PackageSearch, RefreshCw, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { buscarMateriales, type CatalogoMatriculas, type Material } from '../lib/matriculas';
import { ClaveAcceso, guardarClave, leerClave } from './ClaveAcceso';

// Matriculador: busca materiales de SAP por matrícula o descripción y dice si
// son activo fijo, como la página interna de Búsqueda de Materiales de la EPE.
// El catálogo (unos 270 KB) se pide una vez a /api/expedientes?catalogo=1 y la
// búsqueda se hace en el navegador.

let catalogoEnMemoria: CatalogoMatriculas | null = null;

const etiqueta = (m: Material) => `${m.matricula} - ${m.descripcion}`;

function MarcaActivoFijo({ af }: { af: boolean | null }) {
  if (af) {
    return (
      <span className="shrink-0 text-[11px] font-semibold text-[#8A6A00] bg-[#FFF4CC] border border-[#F2C94C] rounded-full px-2.5 py-0.5 whitespace-nowrap">
        Activo Fijo
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[11px] font-medium text-[#6B6A65] bg-[#EEECE5] border border-[#D3D1C7] rounded-full px-2.5 py-0.5 whitespace-nowrap">
      {af === false ? 'No activo fijo' : 'Sin clase'}
    </span>
  );
}

function FichaMaterial({ m, grupos }: { m: Material; grupos: Record<string, string> }) {
  const datos: [string, string][] = [
    ['Grupo de artículos', m.grupo ? `${m.grupo}${grupos[m.grupo] ? ` · ${grupos[m.grupo]}` : ''}` : '—'],
    ['Clase de AFIJO', m.clase != null ? String(m.clase) : '—'],
    ['Unidad de medida', m.unidad || '—'],
    ['Categoría de valoración', m.categoria || '—'],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-[#F2EFE6] border-[0.5px] border-[#E8E6DE] rounded-[12px] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">Matrícula</span>
          <p className="text-lg font-semibold text-[#004741] tabular-nums">{m.matricula}</p>
          <p className="text-sm text-slate-800 break-words">{m.descripcion}</p>
        </div>
        <MarcaActivoFijo af={m.activo_fijo} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
        {datos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">{rotulo}</dt>
            <dd className="text-[13px] text-slate-800 break-words">{valor}</dd>
          </div>
        ))}
      </dl>
      <div className={cn(
        "mt-4 rounded-[8px] px-3.5 py-3 text-[13px] leading-relaxed border",
        m.activo_fijo ? "bg-[#FFF8E1] border-[#F2C94C]/70 text-[#5C4700]" : "bg-[#E8EFEE] border-[#004741]/15 text-[#22423F]"
      )}>
        {m.activo_fijo === true && (
          <>
            <strong className="font-semibold">Corresponde alta de bien de uso en Patrimonio</strong>, con el formulario 4500:
            código 200 si es un bien mueble (mobiliario, ventiladores, artefactos) o 202 si es una herramienta o equipo de
            trabajo. Va al 227 solo si Patrimonio verificó que no es inventariable (mail o constancia en el PIMyS).
          </>
        )}
        {m.activo_fijo === false && (
          <>No es activo fijo (clase {m.clase}): no corresponde alta de bien de uso.</>
        )}
        {m.activo_fijo === null && (
          <>El catálogo no trae la clase de AFIJO de esta matrícula: consultar con Patrimonio.</>
        )}
      </div>
    </motion.div>
  );
}

export function Matriculador() {
  const [clave, setClave] = useState<string>(leerClave);
  const [catalogo, setCatalogo] = useState<CatalogoMatriculas | null>(catalogoEnMemoria);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const [elegido, setElegido] = useState<Material | null>(null);
  const filas = useRef<(HTMLLIElement | null)[]>([]);
  const puntero = useRef<{ x: number; y: number } | null>(null);

  const cargar = useCallback(async (k: string) => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch('/api/expedientes?catalogo=1', { headers: { 'x-lector-key': k } });
      if (r.status === 401) {
        guardarClave('');
        setClave('');
        setErrorClave('La clave de acceso no es correcta.');
        return;
      }
      const datos = await r.json().catch(() => null);
      if (!r.ok || !datos?.materiales) {
        setError(datos?.error || 'No se pudo cargar el catálogo de matrículas.');
        return;
      }
      catalogoEnMemoria = datos;
      setCatalogo(datos);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { if (clave && !catalogoEnMemoria) cargar(clave); }, [clave, cargar]);

  const { materiales, total } = useMemo(
    () => (catalogo ? buscarMateriales(catalogo, consulta) : { materiales: [], total: 0 }),
    [catalogo, consulta],
  );

  useEffect(() => { filas.current[resaltado]?.scrollIntoView({ block: 'nearest' }); }, [resaltado]);

  const elegir = (m: Material | undefined) => {
    if (!m) return;
    setElegido(m);
    setConsulta(etiqueta(m));
    setAbierto(false);
  };

  const teclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setResaltado(i => Math.min(i + 1, Math.max(materiales.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado(i => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  if (!clave) {
    return <ClaveAcceso titulo="Matriculador" error={errorClave} onClave={k => { setErrorClave(null); setClave(k); }} />;
  }

  const mostrarLista = abierto && consulta.trim() !== '' && !!catalogo;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto pt-2 pb-10">
      <div className="text-center mb-7">
        <div className="w-11 h-11 mx-auto mb-3 bg-[#E8EFEE] rounded-[12px] border-[0.5px] border-[#004741]/15 flex items-center justify-center">
          <PackageSearch className="w-5 h-5 text-[#004741]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Búsqueda de Materiales</h2>
        <p className="text-sm text-[#6B6A65] mt-2 max-w-xl mx-auto leading-relaxed">
          Buscá por matrícula o por descripción para saber si un material es activo fijo y
          corresponde darlo de alta en Patrimonio.
        </p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); elegir(materiales[resaltado] || materiales[0]); if (!materiales.length) setAbierto(true); }}
        className="flex gap-2 items-start"
      >
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={consulta}
            onChange={e => { setConsulta(e.target.value); setAbierto(true); setResaltado(0); setElegido(null); }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onKeyDown={teclas}
            disabled={!catalogo}
            placeholder={catalogo ? 'Matrícula o descripción (ej. 100895, ventilador de pie)' : 'Cargando catálogo…'}
            role="combobox"
            aria-expanded={mostrarLista}
            aria-controls="matriculador-lista"
            aria-activedescendant={mostrarLista && materiales[resaltado] ? `material-${materiales[resaltado].matricula}` : undefined}
            autoComplete="off"
            className="w-full h-11 bg-white border border-[#D3D1C7] rounded-[8px] px-3.5 text-sm text-slate-900 outline-none focus:border-[#004741] focus:ring-2 focus:ring-[#004741]/10 transition-all disabled:opacity-60"
          />
          {mostrarLista && (
            <ul
              id="matriculador-lista"
              role="listbox"
              onMouseDown={e => e.preventDefault()}
              className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#E2E0D8] rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.10)] max-h-[296px] overflow-y-auto py-1"
            >
              {materiales.length === 0 && (
                <li className="px-3.5 py-3 text-[13px] text-[#9A9890]">Sin resultados para «{consulta.trim()}».</li>
              )}
              {materiales.map((m, i) => (
                <li
                  key={m.matricula}
                  id={`material-${m.matricula}`}
                  ref={el => { filas.current[i] = el; }}
                  role="option"
                  aria-selected={i === resaltado}
                  // Solo un movimiento real del puntero resalta: al moverse con las
                  // flechas la lista se desplaza bajo el puntero quieto y el
                  // navegador repite el ultimo mousemove en el mismo lugar.
                  onMouseMove={e => {
                    const p = puntero.current;
                    if (p && p.x === e.clientX && p.y === e.clientY) return;
                    puntero.current = { x: e.clientX, y: e.clientY };
                    if (i !== resaltado) setResaltado(i);
                  }}
                  onClick={() => elegir(m)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 cursor-pointer text-[14px]",
                    i === resaltado ? "bg-[#E8EFEE]" : "bg-white"
                  )}
                >
                  <span className="flex-1 min-w-0 truncate">
                    <span className="font-semibold text-[#004741] tabular-nums">{m.matricula}</span>
                    <span className="text-[#9A9890]"> — </span>
                    <span className="text-slate-800">{m.descripcion}</span>
                  </span>
                  <MarcaActivoFijo af={m.activo_fijo} />
                </li>
              ))}
              {total > materiales.length && (
                <li className="px-3.5 py-2 text-[11px] text-[#9A9890] border-t border-[#EEECE5]">
                  Se muestran {materiales.length} de {total}: escribí algo más para acotar.
                </li>
              )}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={!catalogo}
          title="Buscar"
          className="h-11 w-11 shrink-0 bg-[#004741] hover:bg-[#003330] text-white rounded-[8px] flex items-center justify-center transition-all cursor-pointer border-none outline-none disabled:opacity-60"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
      </form>

      {cargando && (
        <p className="flex items-center justify-center gap-2 text-[13px] text-[#9A9890] mt-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogo de matrículas…
        </p>
      )}
      {error && !cargando && (
        <div className="mt-6 flex items-start gap-3 bg-[#FCEBEB] border-[0.5px] border-[#E24B4A]/30 rounded-[10px] p-4 text-[13px] text-[#A32D2D]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => cargar(clave)} className="flex items-center gap-1 text-[12px] font-medium text-[#A32D2D] bg-transparent border-none cursor-pointer outline-none">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      )}

      {elegido && catalogo && <FichaMaterial m={elegido} grupos={catalogo.grupos} />}

      {catalogo && (
        <p className="text-center text-[11px] text-[#9A9890] mt-8">
          {catalogo.materiales.length.toLocaleString('es-AR')} matrículas ·{' '}
          {catalogo.materiales.filter(m => m.activo_fijo).length.toLocaleString('es-AR')} activo fijo ·
          catálogo del {catalogo.generado.split('-').reverse().join('/')}
          {catalogo.fuente ? ` (${catalogo.fuente})` : ''}
        </p>
      )}
    </motion.div>
  );
}
