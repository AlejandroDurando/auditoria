import { useMemo, useSyncExternalStore } from 'react';

// Navegacion con el historial del navegador: cada seccion, y cada expediente
// del lector abierto, es una entrada propia (#/lector/<id>). Asi el boton
// "atras" vuelve a la vista anterior en vez de salir de la pagina, y recargar
// deja al usuario donde estaba.

export interface Ruta { seccion: string; detalle: string | null }

const EVENTO = 'auditor:ruta';

export function hashDe(seccion: string, detalle: string | null = null): string {
  return `#/${encodeURIComponent(seccion)}${detalle ? `/${encodeURIComponent(detalle)}` : ''}`;
}

function parsear(hash: string): Ruta {
  const [seccion = '', ...resto] = hash.replace(/^#\/?/, '').split('/');
  const detalle = resto.length ? decodeURIComponent(resto.join('/')) : '';
  return { seccion: decodeURIComponent(seccion), detalle: detalle || null };
}

/** Lleva a una seccion (y opcionalmente a un detalle dentro de ella) dejando
 *  una entrada en el historial, salvo con `reemplazar`. */
export function irA(seccion: string, detalle: string | null = null, { reemplazar = false } = {}) {
  const destino = hashDe(seccion, detalle);
  if (destino === window.location.hash) return;
  if (reemplazar) window.history.replaceState(window.history.state, '', destino);
  else window.history.pushState({ anterior: window.location.hash }, '', destino);
  window.dispatchEvent(new Event(EVENTO));
}

/** Vuelve a la seccion sin detalle. Si se llego desde ahi, es el "atras" del
 *  navegador (no deja una entrada de mas); si se entro directo (recarga o
 *  link), reemplaza la entrada actual. */
export function volverA(seccion: string) {
  if (window.history.state?.anterior === hashDe(seccion)) window.history.back();
  else irA(seccion, null, { reemplazar: true });
}

function suscribir(aviso: () => void) {
  window.addEventListener('popstate', aviso);
  window.addEventListener('hashchange', aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener('popstate', aviso);
    window.removeEventListener('hashchange', aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

export function useRuta(): Ruta {
  const hash = useSyncExternalStore(suscribir, () => window.location.hash);
  return useMemo(() => parsear(hash), [hash]);
}
