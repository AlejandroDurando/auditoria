import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { buscarMateriales, type CatalogoMatriculas, type Material } from '../lib/matriculas';
import { ClaveAcceso, guardarClave, leerClave } from './ClaveAcceso';
import { BandaError, Encabezado, EstadoBadge, Etiqueta, Panel, Punto, boton, campo } from './ui';

// Matriculador: busca materiales de SAP por matrícula o descripción y dice si
// son activo fijo, como la página interna de Búsqueda de Materiales.
// El catálogo (unos 270 KB) se pide una vez a /api/expedientes?catalogo=1 y la
// búsqueda se hace en el navegador.

let catalogoEnMemoria: CatalogoMatriculas | null = null;

const etiqueta = (m: Material) => `${m.matricula} - ${m.descripcion}`;

function MarcaActivoFijo({ af }: { af: boolean | null }) {
  if (af) return <EstadoBadge estado="revisar" className="shrink-0">Activo fijo</EstadoBadge>;
  return <Etiqueta className="shrink-0">{af === false ? 'No es activo fijo' : 'Sin clase'}</Etiqueta>;
}

function FichaMaterial({ m, grupos }: { m: Material; grupos: Record<string, string> }) {
  const datos: [string, string][] = [
    ['Grupo de artículos', m.grupo ? `${m.grupo}${grupos[m.grupo] ? ` · ${grupos[m.grupo]}` : ''}` : '—'],
    ['Clase de AFIJO', m.clase != null ? String(m.clase) : '—'],
    ['Unidad de medida', m.unidad || '—'],
    ['Categoría de valoración', m.categoria || '—'],
  ];
  return (
    <Panel className="mt-5">
      <div className="flex items-start justify-between gap-3 px-3.5 py-3 border-b border-linea">
        <div className="min-w-0">
          <p className="font-mono text-xs text-tinta-2">{m.matricula}</p>
          <p className="text-base font-semibold text-tinta break-words">{m.descripcion}</p>
        </div>
        <MarcaActivoFijo af={m.activo_fijo} />
      </div>
      <dl className="m-0">
        {datos.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-baseline justify-between gap-3 px-3.5 py-2 border-b border-linea-suave text-sm">
            <dt className="text-tinta-2">{rotulo}</dt>
            <dd className="m-0 text-tinta text-right break-words">{valor}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-start gap-2.5 px-3.5 py-3 text-sm text-tinta-2">
        <Punto estado={m.activo_fijo === true ? 'revisar' : m.activo_fijo === false ? 'ok' : 'revisar'} className="mt-[0.4375rem]" />
        <p>
          {m.activo_fijo === true && (
            <>
              <strong className="font-semibold text-tinta">Corresponde alta de bien de uso en Patrimonio</strong>, con el formulario 4500:
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
        </p>
      </div>
    </Panel>
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
    <div className="max-w-[45rem]">
      <Encabezado
        titulo="Matriculador"
        detalle={catalogo
          ? `${catalogo.materiales.length.toLocaleString('es-AR')} matrículas · ${catalogo.materiales.filter(m => m.activo_fijo).length.toLocaleString('es-AR')} de activo fijo · catálogo del ${catalogo.generado.split('-').reverse().join('/')}${catalogo.fuente ? ` (${catalogo.fuente})` : ''}`
          : 'Buscá un material para saber si es activo fijo y corresponde darlo de alta en Patrimonio.'}
      />

      <form
        onSubmit={e => { e.preventDefault(); elegir(materiales[resaltado] || materiales[0]); if (!materiales.length) setAbierto(true); }}
        className="flex gap-2 items-start"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-tenue absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={consulta}
            onChange={e => { setConsulta(e.target.value); setAbierto(true); setResaltado(0); setElegido(null); }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onKeyDown={teclas}
            disabled={!catalogo}
            placeholder={catalogo ? 'Matrícula o descripción (ej. 100895, ventilador de pie)' : 'Cargando el catálogo…'}
            aria-label="Matrícula o descripción del material"
            role="combobox"
            aria-expanded={mostrarLista}
            aria-controls="matriculador-lista"
            aria-activedescendant={mostrarLista && materiales[resaltado] ? `material-${materiales[resaltado].matricula}` : undefined}
            autoComplete="off"
            className={cn(campo, 'h-9 pl-9 disabled:opacity-60')}
          />
          {mostrarLista && (
            <ul
              id="matriculador-lista"
              role="listbox"
              onMouseDown={e => e.preventDefault()}
              className="absolute z-20 left-0 right-0 top-full mt-1.5 m-0 p-1 list-none bg-superficie border border-linea rounded-[0.5rem] flotante max-h-[18.75rem] overflow-y-auto"
            >
              {materiales.length === 0 && (
                <li className="px-2.5 py-2 text-sm text-tenue">Sin resultados para «{consulta.trim()}».</li>
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
                    "flex items-center gap-3 px-2.5 h-8 rounded-[0.375rem] cursor-pointer text-sm",
                    i === resaltado && "bg-realce"
                  )}
                >
                  <span className="font-mono text-xs text-tinta-2 w-[3.75rem] shrink-0">{m.matricula}</span>
                  <span className="flex-1 min-w-0 truncate text-tinta">{m.descripcion}</span>
                  <MarcaActivoFijo af={m.activo_fijo} />
                </li>
              ))}
              {total > materiales.length && (
                <li className="px-2.5 py-1.5 text-xs text-tenue border-t border-linea-suave mt-1">
                  Se muestran {materiales.length} de {total}: escribí algo más para acotar.
                </li>
              )}
            </ul>
          )}
        </div>
        <button type="submit" disabled={!catalogo} className={cn(boton.primario, 'h-9')}>Buscar</button>
      </form>

      {cargando && (
        <p className="flex items-center gap-2 text-sm text-tenue mt-4" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Cargando el catálogo de matrículas…
        </p>
      )}
      {error && !cargando && (
        <BandaError className="mt-4" onReintentar={() => cargar(clave)}>{error}</BandaError>
      )}

      {elegido && catalogo && <FichaMaterial m={elegido} grupos={catalogo.grupos} />}
    </div>
  );
}
