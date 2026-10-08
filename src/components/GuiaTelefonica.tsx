import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookUser, Check, Copy, Loader2, Phone, PhoneOff, RefreshCw, Search, SearchX, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ClaveAcceso } from './ClaveAcceso';
import { fijarClave, useExpedientesLector } from '../lib/expedientesLector';
import { buscarEnGuia, cargarGuia, tokensDe, tramosResaltados, useGuia, type Coincidencia, type Contacto } from '../lib/guia';
import { irA, useRuta } from '../lib/navegacion';

const ZONAS = ['Rafaela', 'Agencias y sucursales', 'Santa Fe'] as const;

function Resaltado({ texto, tokens }: { texto: string; tokens: string[] }) {
  const tramos = tramosResaltados(texto, tokens);
  if (!tramos.length) return <>{texto}</>;
  const partes: React.ReactNode[] = [];
  let desde = 0;
  tramos.forEach(([a, b], i) => {
    if (a > desde) partes.push(texto.slice(desde, a));
    partes.push(<mark key={i} className="bg-aviso-fondo text-tinta rounded-[3px] px-[1px]">{texto.slice(a, b)}</mark>);
    desde = b;
  });
  if (desde < texto.length) partes.push(texto.slice(desde));
  return <>{partes}</>;
}

/** Numero que se copia con un clic. */
function Numero({ valor, tipo }: { valor: string; tipo: 'interno' | 'directo' }) {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return <span className="text-tenue-2 text-[12px]">—</span>;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(valor).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1400); }).catch(() => {});
      }}
      title={`Copiar ${tipo}`}
      className={cn(
        "group/num inline-flex items-center gap-1.5 rounded-[7px] border-[0.5px] px-2 py-1 font-mono cursor-pointer outline-none transition-colors",
        tipo === 'interno'
          ? "text-[13.5px] font-semibold text-acento bg-marca-suave border-acento/20 hover:border-acento/50"
          : "text-[12.5px] text-tinta-2 bg-hundida border-linea hover:border-linea-fuerte"
      )}
    >
      {valor}
      {copiado
        ? <Check className="w-3 h-3 text-acento" />
        : <Copy className="w-3 h-3 opacity-0 group-hover/num:opacity-60 transition-opacity" />}
    </button>
  );
}

function Fila({ c, tokens, coincidencia, mostrarSector }: {
  c: Contacto; tokens: string[]; coincidencia?: Coincidencia; mostrarSector?: boolean; key?: React.Key;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-b-[0.5px] border-linea last:border-0 hover:bg-realce transition-colors">
      <div className="flex-1 min-w-0">
        {c.agentes.length ? (
          <p className="text-[13.5px] text-tinta leading-snug">
            {c.agentes.map((a, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-tenue-2"> · </span>}
                <span className={cn(coincidencia?.agentes.has(i) ? "font-semibold" : "font-medium")}>
                  <Resaltado texto={a} tokens={tokens} />
                </span>
              </React.Fragment>
            ))}
          </p>
        ) : (
          <p className="text-[13px] text-tenue italic">{c.nota ? <Resaltado texto={c.nota} tokens={tokens} /> : 'Línea del sector'}</p>
        )}
        {mostrarSector && (
          <p className="text-[11.5px] text-tenue mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span><Resaltado texto={c.sector} tokens={tokens} /></span>
            <span className="px-1.5 py-[1px] rounded-[5px] bg-hundida text-[10px] text-tinta-2">{c.zona}</span>
          </p>
        )}
        {c.agentes.length > 0 && c.nota && <p className="text-[11.5px] text-tenue mt-0.5">{c.nota}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-start sm:items-end gap-0.5">
          <span className="text-[9.5px] uppercase tracking-[0.06em] text-tenue">Interno</span>
          <Numero valor={c.interno} tipo="interno" />
        </div>
        <div className="flex flex-col items-start sm:items-end gap-0.5 min-w-[118px]">
          <span className="text-[9.5px] uppercase tracking-[0.06em] text-tenue">Directo</span>
          <Numero valor={c.directo} tipo="directo" />
        </div>
      </div>
    </div>
  );
}

export function GuiaTelefonica() {
  const { clave } = useExpedientesLector();
  const { guia, cargando, error } = useGuia();
  const ruta = useRuta();
  // El buscador del encabezado llega con la consulta en la direccion (#/guia/<texto>).
  const [consulta, setConsultaCruda] = useState(ruta.seccion === 'guia' ? ruta.detalle || '' : '');
  useEffect(() => {
    const detalle = ruta.seccion === 'guia' ? ruta.detalle : null;
    // Solo si cambio desde afuera (buscador del encabezado): no pisa lo que se
    // esta escribiendo ('rend ' con el espacio del final).
    if (detalle) setConsultaCruda(actual => (actual.trim() === detalle ? actual : detalle));
  }, [ruta.seccion, ruta.detalle]);
  // La direccion sigue a lo escrito (sin dejar entradas en el historial).
  const setConsulta = (texto: string) => {
    setConsultaCruda(texto);
    irA('guia', texto.trim() || null, { reemplazar: true });
  };
  const [zona, setZona] = useState<string>('');
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => { if (clave) cargarGuia(); }, [clave]);

  // '/' enfoca el buscador de la guia.
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (ev.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) {
        ev.preventDefault();
        entrada.current?.focus();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const tokens = useMemo(() => tokensDe(consulta), [consulta]);
  const busqueda = useMemo(
    () => (guia && tokens.length ? buscarEnGuia(guia, consulta, zona || undefined) : null),
    [guia, consulta, tokens.length, zona],
  );

  const porSector = useMemo(() => {
    const grupos: Array<{ sector: string; zona: string; contactos: Contacto[] }> = [];
    for (const c of guia?.contactos || []) {
      if (zona && c.zona !== zona) continue;
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.sector === c.sector && ultimo.zona === c.zona) ultimo.contactos.push(c);
      else grupos.push({ sector: c.sector, zona: c.zona, contactos: [c] });
    }
    return grupos;
  }, [guia, zona]);

  if (!clave) {
    return <ClaveAcceso titulo="Guía telefónica" error={error} onClave={fijarClave} />;
  }

  const cuenta = (z: string) => (guia?.contactos || []).filter(c => !z || c.zona === z).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center caja">
            <BookUser className="w-6 h-6 text-acento" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900">Guía telefónica</h2>
            <p className="text-xs text-tenue mt-0.5">
              Internos y teléfonos directos de la EPE{guia ? ` — ${guia.contactos.length} contactos` : ''}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(guia?.comandos || []).map(cmd => (
            <span key={cmd.codigo} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-superficie border-[0.5px] border-linea text-[12px] text-tinta-2 caja">
              {/desactiv/i.test(cmd.detalle) ? <PhoneOff className="w-3.5 h-3.5 text-tenue" /> : <Phone className="w-3.5 h-3.5 text-acento" />}
              {cmd.detalle}
              <kbd className="font-mono font-semibold text-acento">{cmd.codigo}</kbd>
            </span>
          ))}
          <button
            type="button"
            onClick={() => cargarGuia(true)}
            disabled={cargando}
            title="Volver a leer la guía"
            className="p-2 bg-superficie border border-linea-fuerte hover:bg-realce text-tinta-2 rounded-[8px] cursor-pointer outline-none disabled:opacity-60"
          >
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="sticky top-[56px] z-20 -mx-1 px-1 pt-3 pb-3 bg-lienzo/85 backdrop-blur-sm">
        <div className="relative">
          <Search className="w-[18px] h-[18px] text-tenue absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={entrada}
            type="search"
            value={consulta}
            onChange={e => setConsulta(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setConsulta(''); }}
            placeholder="Buscar por nombre, apellido, sector, agencia o número…"
            aria-label="Buscar en la guía telefónica"
            className="w-full h-12 bg-campo border border-linea-fuerte rounded-[12px] pl-11 pr-24 text-[14.5px] text-tinta placeholder:text-tenue outline-none caja transition-all focus:border-acento focus:ring-[3px] focus:ring-acento/15 [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {consulta ? (
              <button type="button" onClick={() => { setConsulta(''); entrada.current?.focus(); }} title="Borrar"
                className="p-1 text-tenue hover:text-tinta bg-transparent border-none cursor-pointer outline-none flex">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 rounded-[5px] border border-linea-fuerte bg-superficie text-[11px] text-tenue">/</kbd>
            )}
          </div>
        </div>
        <div className="flex w-fit max-w-full overflow-x-auto p-[3px] bg-hundida rounded-[8px] mt-3 gap-[2px] items-center select-none">
          {['', ...ZONAS].map(z => (
            <button
              key={z || 'todas'}
              type="button"
              onClick={() => setZona(z)}
              className={cn(
                "whitespace-nowrap transition-all duration-200 outline-none cursor-pointer text-[12.5px] py-[5px] px-[14px] border-none rounded-[6px]",
                zona === z ? "bg-superficie text-acento font-medium caja" : "bg-transparent text-tinta-2"
              )}
            >
              {z || 'Todas'}{guia ? <span className="text-tenue ml-1">{cuenta(z)}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-error-suave border border-error-linea rounded-[12px] p-4 mb-4 text-xs text-error">{error}</div>
      )}

      {!guia ? (
        cargando && (
          <div className="p-16 text-center text-tenue text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Leyendo la guía…
          </div>
        )
      ) : busqueda ? (
        busqueda.resultados.length ? (
          <div>
            <p className="text-[11.5px] text-tenue mb-2 px-1">
              {busqueda.aproximada
                ? <>No hay coincidencias exactas: {busqueda.resultados.length} {busqueda.resultados.length === 1 ? 'parecido' : 'parecidos'} a "<b className="text-tinta-2">{consulta}</b>".</>
                : <>{busqueda.resultados.length} {busqueda.resultados.length === 1 ? 'resultado' : 'resultados'}{zona ? ` en ${zona}` : ''}.</>}
            </p>
            <div className="bg-superficie border-[0.5px] border-linea rounded-[12px] overflow-hidden caja">
              {busqueda.resultados.map(r => (
                <Fila key={r.indice} c={r.contacto} tokens={busqueda.aproximada ? [] : tokens} coincidencia={r} mostrarSector />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-14 text-center border-[0.5px] border-dashed border-linea-fuerte rounded-[12px] bg-superficie/50">
            <SearchX className="w-10 h-10 text-tenue-2 mx-auto mb-3" />
            <p className="text-sm font-medium text-tinta">Nada para "{consulta}"{zona ? ` en ${zona}` : ''}.</p>
            <p className="text-xs text-tenue mt-1">Probá con parte del apellido, el sector o el número de interno.</p>
          </div>
        )
      ) : (
        <div className="columns-1 lg:columns-2 gap-4 [column-fill:_balance]">
          {porSector.map((g, i) => (
            <section key={`${g.sector}-${i}`} className="break-inside-avoid mb-4 bg-superficie border-[0.5px] border-linea rounded-[12px] overflow-hidden caja elevable">
              <header className="flex items-center justify-between gap-2 px-4 py-2.5 bg-hundida/60 border-b-[0.5px] border-linea">
                <h3 className="text-[12.5px] font-semibold text-tinta">{g.sector}</h3>
                {!zona && <span className="text-[10px] text-tinta-2 px-1.5 py-[1px] rounded-[5px] bg-superficie border-[0.5px] border-linea">{g.zona}</span>}
              </header>
              {g.contactos.map((c, j) => <Fila key={j} c={c} tokens={[]} />)}
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
