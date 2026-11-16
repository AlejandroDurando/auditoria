import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Phone, PhoneOff, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ClaveAcceso } from './ClaveAcceso';
import { fijarClave, useExpedientesLector } from '../lib/expedientesLector';
import { buscarEnGuia, cargarGuia, tokensDe, tramosResaltados, useGuia, type Contacto } from '../lib/guia';
import { irA, useRuta } from '../lib/navegacion';
import { BandaError, Encabezado, Panel, Pestanas, Vacio, boton, campo } from './ui';

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
        "inline-flex items-center gap-1 rounded-[0.25rem] px-1.5 py-0.5 -mx-1.5 bg-transparent border-none cursor-pointer outline-none transition-colors hover:bg-hundida-2 whitespace-nowrap font-mono text-xs",
        interno ? "font-medium text-tinta" : "text-tinta-2"
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

  return (
    <div>
      <Encabezado
        titulo="Guía telefónica"
        detalle={busqueda
          ? busqueda.aproximada
            ? `Sin coincidencias exactas: ${busqueda.resultados.length} ${busqueda.resultados.length === 1 ? 'parecido' : 'parecidos'}`
            : `${busqueda.resultados.length} ${busqueda.resultados.length === 1 ? 'resultado' : 'resultados'}`
          : guia ? `${cuenta(zona)} contactos · un clic en un número lo copia` : 'Contactos internos'}
        acciones={
          <button type="button" onClick={() => cargarGuia(true)} disabled={cargando} className={boton.secundario} title="Volver a leer la guía">
            {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
            Actualizar
          </button>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-3">
        <Pestanas
          rotulo="Zona"
          className="flex-1 min-w-[17.5rem]"
          valor={zona}
          onCambio={setZona}
          opciones={['', ...ZONAS].map(z => ({ valor: z, rotulo: z || 'Todas', cantidad: guia ? cuenta(z) : undefined }))}
        />
        <div className="relative flex-[0_1_20rem] min-w-[13.75rem]">
          <Search className="w-3.5 h-3.5 text-tenue absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            ref={entrada}
            type="search"
            value={consulta}
            onChange={e => setConsulta(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setConsulta(''); }}
            placeholder="Buscar por sector, agente o interno"
            aria-label="Buscar en la guía telefónica"
            className={cn(campo, 'pl-8 pr-9 [&::-webkit-search-cancel-button]:hidden')}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {consulta ? (
              <button type="button" onClick={() => { setConsulta(''); entrada.current?.focus(); }} title="Borrar" aria-label="Borrar la búsqueda"
                className="p-0.5 text-tenue hover:text-tinta bg-transparent border-none cursor-pointer flex">
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center px-1 h-[1.125rem] rounded-[0.25rem] border border-linea-fuerte font-mono text-[0.6875rem] text-tenue">/</kbd>
            )}
          </div>
        </div>
      </div>

      {error && <BandaError className="mb-3" onReintentar={() => cargarGuia(true)}>{error}</BandaError>}

      <Panel className="flex flex-col md:max-h-[calc(100vh-2.75rem-14.5rem)] md:min-h-[20rem]">
        <div ref={lista} className="flex-1 min-h-0 overflow-y-auto">
          {/* Cabecera fija */}
          <div className={cn("hidden md:grid sticky top-0 z-10 bg-superficie border-b border-linea text-xs text-tenue", COLUMNAS)}>
            <div className="px-3.5 h-8 flex items-center">Sector</div>
            <div className="px-3.5 h-8 flex items-center">Agente</div>
            <div className="px-3.5 h-8 flex items-center">Interno</div>
            <div className="px-3.5 h-8 flex items-center">Directo</div>
          </div>

          {!guia ? (
            cargando
              ? <p className="px-3.5 py-6 text-sm text-tenue flex items-center gap-2" role="status"><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Leyendo la guía…</p>
              : <Vacio>No se pudo leer la guía.</Vacio>
          ) : busqueda && !busqueda.resultados.length ? (
            <Vacio>
              Nada para «{consulta}»{zona ? ` en ${zona}` : ''}. Probá con parte del apellido, el sector o el número de interno.
            </Vacio>
          ) : (
            renglones.map(r => {
              if (r.tipo === 'zona') {
                return (
                  <div key={`z-${r.zona}`} className="px-3.5 h-[1.875rem] flex items-center bg-barra border-b border-linea text-sm font-semibold text-tinta">
                    {r.zona}
                  </div>
                );
              }
              const { c } = r;
              return (
                <div
                  key={r.clave}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center border-b border-linea-suave last:border-b-0 transition-colors hover:bg-realce",
                    COLUMNAS,
                  )}
                >
                  {/* Sector (en el celular va arriba del nombre) */}
                  <div className={cn("col-span-2 md:col-span-1 px-3.5 pt-2 md:py-2 text-xs md:text-sm md:font-medium text-tenue md:text-tinta truncate", !r.sector && "hidden md:block")}
                    title={c.sector}>
                    {r.sector ? (
                      <>
                        <Resaltado texto={c.sector} tokens={marcas} />
                        {busqueda && <span className="ml-2 align-middle text-[0.6875rem] font-normal text-tinta-2 px-1 py-[1px] rounded-[0.25rem] border border-linea-fuerte">{c.zona}</span>}
                      </>
                    ) : null}
                  </div>
                  <div className={cn("px-3.5 py-2 text-sm text-tinta min-w-0", r.sector ? "pt-0.5 md:pt-2" : "")}>
                    {c.agentes.length ? (
                      c.agentes.map((a, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-tenue-2"> / </span>}
                          <span className={cn(r.destacados?.has(i) && "font-medium")}><Resaltado texto={a} tokens={marcas} /></span>
                        </React.Fragment>
                      ))
                    ) : null}
                    {c.nota && <span className={cn("text-tenue", c.agentes.length && "block text-xs")}><Resaltado texto={c.nota} tokens={marcas} /></span>}
                  </div>
                  {/* Numeros: columnas propias en pantalla ancha, a la derecha en el celular */}
                  <div className="md:contents flex flex-col items-end gap-0.5 pr-3.5 md:pr-0 py-2 md:py-0">
                    <div className="md:px-3.5 md:py-2">
                      <Numero valor={c.interno} interno tokens={marcas} />
                    </div>
                    <div className="md:px-3.5 md:py-2">
                      <Numero valor={c.directo} tokens={marcas} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {(guia?.comandos || []).length > 0 && (
          <div className="shrink-0 px-3.5 py-2 border-t border-linea flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinta-2">
            {(guia?.comandos || []).map(cmd => (
              <span key={cmd.codigo} className="inline-flex items-center gap-1.5">
                {/desactiv/i.test(cmd.detalle)
                  ? <PhoneOff className="w-3.5 h-3.5 text-tenue" aria-hidden="true" />
                  : <Phone className="w-3.5 h-3.5 text-tenue" aria-hidden="true" />}
                {cmd.detalle}: <span className="font-mono font-medium text-tinta">{cmd.codigo}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
