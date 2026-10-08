import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookUser, Check, Loader2, Phone, PhoneOff, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ClaveAcceso } from './ClaveAcceso';
import { fijarClave, useExpedientesLector } from '../lib/expedientesLector';
import { buscarEnGuia, cargarGuia, tokensDe, tramosResaltados, useGuia, type Contacto } from '../lib/guia';
import { irA, useRuta } from '../lib/navegacion';

// Guia telefonica: un listado (Sector / Agente / Interno / Directo), como la
// guia original, con la cabecera fija y el buscador arriba.

const ZONAS = ['Rafaela', 'Agencias y sucursales', 'Santa Fe'] as const;

// Columnas del listado: las mismas proporciones que la guia original.
const COLUMNAS = 'md:grid-cols-[minmax(0,35fr)_minmax(0,35fr)_minmax(0,15fr)_minmax(0,15fr)]';

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
function Numero({ valor, interno, tokens }: { valor: string; interno?: boolean; tokens: string[] }) {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return null;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(valor).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1400); }).catch(() => {});
      }}
      title="Copiar"
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 -mx-1.5 bg-transparent border-none cursor-pointer outline-none transition-colors hover:bg-marca-suave hover:text-acento whitespace-nowrap",
        interno ? "text-[14.5px] font-semibold text-tinta" : "text-[13.5px] text-tinta-2"
      )}
    >
      <Resaltado texto={valor} tokens={tokens} />
      {copiado && <Check className="w-3.5 h-3.5 text-acento" />}
    </button>
  );
}

type Renglon =
  | { tipo: 'zona'; zona: string }
  | { tipo: 'contacto'; c: Contacto; sector: boolean; clave: string; destacados?: Set<number> };

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
  const lista = useRef<HTMLDivElement>(null);

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
  useEffect(() => { lista.current?.scrollTo({ top: 0 }); }, [consulta, zona]);

  // Sin busqueda: la guia en su orden, el sector solo en su primer renglon y
  // un rotulo cuando cambia la zona. Con busqueda: por relevancia y con el
  // sector en cada renglon.
  const renglones = useMemo<Renglon[]>(() => {
    if (!guia) return [];
    if (busqueda) {
      return busqueda.resultados.map(r => ({
        tipo: 'contacto' as const, c: r.contacto, sector: true, clave: `r${r.indice}`, destacados: r.agentes,
      }));
    }
    const salida: Renglon[] = [];
    let zonaPrevia = '';
    let sectorPrevio = '';
    guia.contactos.forEach((c, i) => {
      if (zona && c.zona !== zona) return;
      if (c.zona !== zonaPrevia) {
        if (!zona) salida.push({ tipo: 'zona', zona: c.zona });
        zonaPrevia = c.zona;
        sectorPrevio = '';
      }
      salida.push({ tipo: 'contacto', c, sector: c.sector !== sectorPrevio, clave: `c${i}` });
      sectorPrevio = c.sector;
    });
    return salida;
  }, [guia, busqueda, zona]);

  if (!clave) {
    return <ClaveAcceso titulo="Guía telefónica" error={error} onClave={fijarClave} />;
  }

  const cuenta = (z: string) => (guia?.contactos || []).filter(c => !z || c.zona === z).length;
  const marcas = busqueda && !busqueda.aproximada ? tokens : [];
  let par = false;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl">
      <div className="relative bg-superficie border-[0.5px] border-linea rounded-[12px] caja overflow-hidden flex flex-col md:h-[calc(100vh-56px-64px)] md:min-h-[520px]">
        {/* Franja de color arriba, como la guia original. */}
        <div className="h-[5px] shrink-0 bg-linear-to-r from-marca to-marca-claro" />

        <div className="shrink-0 px-5 md:px-7 pt-5 pb-4 border-b-[0.5px] border-linea">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 text-[22px] font-semibold tracking-tight text-tinta">
              <BookUser className="w-6 h-6 text-acento shrink-0" />
              Guía telefónica
            </h2>
            <div className="relative w-full md:max-w-[400px]">
              <Search className="w-4 h-4 text-tenue absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={entrada}
                type="search"
                value={consulta}
                onChange={e => setConsulta(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setConsulta(''); }}
                placeholder="Buscar por sector, agente o interno…"
                aria-label="Buscar en la guía telefónica"
                className="w-full h-11 bg-campo border border-linea-fuerte rounded-[8px] pl-10 pr-10 text-[14.5px] text-tinta placeholder:text-tenue outline-none transition-all focus:border-acento focus:ring-[3px] focus:ring-acento/15 [&::-webkit-search-cancel-button]:hidden"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {consulta ? (
                  <button type="button" onClick={() => { setConsulta(''); entrada.current?.focus(); }} title="Borrar"
                    className="p-1 text-tenue hover:text-tinta bg-transparent border-none cursor-pointer outline-none flex">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden md:inline-flex items-center px-1.5 h-5 rounded-[5px] border border-linea-fuerte bg-superficie text-[11px] text-tenue">/</kbd>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <div className="flex max-w-full overflow-x-auto p-[3px] bg-hundida rounded-[8px] gap-[2px] items-center select-none">
              {['', ...ZONAS].map(z => (
                <button
                  key={z || 'todas'}
                  type="button"
                  onClick={() => setZona(z)}
                  className={cn(
                    "whitespace-nowrap transition-all duration-200 outline-none cursor-pointer text-[12.5px] py-[4px] px-[12px] border-none rounded-[6px]",
                    zona === z ? "bg-superficie text-acento font-medium caja" : "bg-transparent text-tinta-2"
                  )}
                >
                  {z || 'Todas'}{guia ? <span className="text-tenue ml-1">{cuenta(z)}</span> : null}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-tenue">
              {busqueda
                ? busqueda.aproximada
                  ? `Sin coincidencias exactas: ${busqueda.resultados.length} ${busqueda.resultados.length === 1 ? 'parecido' : 'parecidos'}`
                  : `${busqueda.resultados.length} ${busqueda.resultados.length === 1 ? 'resultado' : 'resultados'}`
                : guia ? `${cuenta(zona)} contactos` : ''}
            </span>
          </div>
        </div>

        {error && <div className="shrink-0 px-7 py-3 text-xs text-error bg-error-suave border-b-[0.5px] border-error-linea">{error}</div>}

        <div ref={lista} className="flex-1 min-h-0 overflow-y-auto">
          {/* Cabecera fija */}
          <div className={cn("hidden md:grid sticky top-0 z-10 bg-hundida border-b-2 border-linea-fuerte text-[12px] font-bold uppercase tracking-[0.05em] text-tinta-2", COLUMNAS)}>
            <div className="px-7 py-3">Sector</div>
            <div className="px-7 py-3">Agente</div>
            <div className="px-4 py-3 text-center">Interno</div>
            <div className="px-4 py-3 text-center">Directo</div>
          </div>

          {!guia ? (
            cargando && (
              <div className="p-16 text-center text-tenue text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Leyendo la guía…
              </div>
            )
          ) : busqueda && !busqueda.resultados.length ? (
            <div className="p-14 text-center">
              <p className="text-sm font-medium text-tinta">Nada para "{consulta}"{zona ? ` en ${zona}` : ''}.</p>
              <p className="text-xs text-tenue mt-1">Probá con parte del apellido, el sector o el número de interno.</p>
            </div>
          ) : (
            renglones.map(r => {
              if (r.tipo === 'zona') {
                par = false;
                return (
                  <div key={`z-${r.zona}`} className="px-5 md:px-7 py-2 bg-marca-suave border-b-[0.5px] border-linea text-[11.5px] font-bold uppercase tracking-[0.08em] text-acento">
                    {r.zona}
                  </div>
                );
              }
              const { c } = r;
              par = !par;
              return (
                <div
                  key={r.clave}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center border-b-[0.5px] border-linea transition-colors hover:bg-marca-suave/70",
                    COLUMNAS,
                    !par && "bg-hundida/45"
                  )}
                >
                  {/* Sector (en el celular va arriba del nombre) */}
                  <div className={cn("col-span-2 md:col-span-1 px-5 md:px-7 pt-2.5 md:py-3.5 text-[12px] md:text-[14.5px] md:font-semibold text-tenue md:text-tinta truncate", !r.sector && "hidden md:block")}
                    title={c.sector}>
                    {r.sector ? (
                      <>
                        <Resaltado texto={c.sector} tokens={marcas} />
                        {busqueda && <span className="ml-2 align-middle text-[10.5px] font-normal text-tinta-2 px-1.5 py-[1px] rounded-[5px] bg-hundida">{c.zona}</span>}
                      </>
                    ) : null}
                  </div>
                  <div className={cn("px-5 md:px-7 py-2.5 md:py-3.5 text-[14.5px] text-tinta min-w-0", r.sector ? "pt-0.5 md:pt-3.5" : "")}>
                    {c.agentes.length ? (
                      c.agentes.map((a, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-tenue-2"> / </span>}
                          <span className={cn(r.destacados?.has(i) && "font-medium")}><Resaltado texto={a} tokens={marcas} /></span>
                        </React.Fragment>
                      ))
                    ) : null}
                    {c.nota && <span className={cn("text-tinta-2", c.agentes.length && "block text-[12.5px]")}><Resaltado texto={c.nota} tokens={marcas} /></span>}
                  </div>
                  {/* Numeros: columnas propias en pantalla ancha, a la derecha en el celular */}
                  <div className="md:contents flex flex-col items-end gap-0.5 pr-5 md:pr-0 py-2.5 md:py-0">
                    <div className="md:px-4 md:py-3.5 md:text-center">
                      <Numero valor={c.interno} interno tokens={marcas} />
                    </div>
                    <div className="md:px-4 md:py-3.5 md:text-center">
                      <Numero valor={c.directo} tokens={marcas} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 px-5 md:px-7 py-4 border-t-[0.5px] border-linea flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-tenue">
          <div className="flex items-center gap-2">
            EPE · Guía de contactos internos
            <button
              type="button"
              onClick={() => cargarGuia(true)}
              disabled={cargando}
              title="Volver a leer la guía"
              className="p-1 text-tenue hover:text-acento bg-transparent border-none cursor-pointer outline-none disabled:opacity-60 flex"
            >
              {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(guia?.comandos || []).map(cmd => (
              <span key={cmd.codigo} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-marca-suave border border-acento/25 text-acento text-[12.5px] font-semibold">
                {/desactiv/i.test(cmd.detalle) ? <PhoneOff className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {cmd.detalle}: {cmd.codigo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
