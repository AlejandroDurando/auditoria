import { useSyncExternalStore } from 'react';
import { guardarClave, leerClave } from '../components/ClaveAcceso';

// Guia telefonica interna. La arma el lector (guia.py) desde el HTML de la
// guia y la sube a R2; la API la devuelve con la clave de acceso. Este repo es
// publico: los nombres y telefonos no estan en el codigo.

export interface Contacto {
  sector: string;
  zona: string;
  agentes: string[];
  interno: string;
  directo: string;
  nota: string;
}

export interface Guia {
  generado: string;
  fuente?: string;
  comandos: { detalle: string; codigo: string }[];
  contactos: Contacto[];
}

// ─── Datos (una lectura por visita, compartida por la seccion y el buscador) ──

interface Estado { guia: Guia | null; cargando: boolean; error: string | null }
let estado: Estado = { guia: null, cargando: false, error: null };
const oyentes = new Set<() => void>();
const cambiar = (parcial: Partial<Estado>) => { estado = { ...estado, ...parcial }; oyentes.forEach(f => f()); };

export function useGuia(): Estado {
  return useSyncExternalStore(
    aviso => { oyentes.add(aviso); return () => { oyentes.delete(aviso); }; },
    () => estado,
  );
}

export async function cargarGuia(forzar = false) {
  const clave = leerClave();
  if (!clave || estado.cargando || (estado.guia && !forzar)) return;
  cambiar({ cargando: true, error: null });
  try {
    const r = await fetch('/api/expedientes?catalogo=guia', { headers: { 'x-lector-key': clave } });
    if (r.status === 401) {
      guardarClave('');
      cambiar({ error: 'La clave de acceso no es correcta.' });
      return;
    }
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
    cambiar({ guia: datos as Guia });
  } catch (e) {
    cambiar({ error: e instanceof Error ? e.message : 'No se pudo leer la guía telefónica.' });
  } finally {
    cambiar({ cargando: false });
  }
}

// ─── Busqueda ─────────────────────────────────────────────────────────────────

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const palabrasDe = (s: string) => normalizar(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Palabras de la consulta: letras y numeros, sin tildes. */
export const tokensDe = (consulta: string) => palabrasDe(consulta);

/** Distancia de edicion con transposicion, cortada en `tope`. */
function distancia(a: string, b: string, tope: number): number {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimo = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      minimo = Math.min(minimo, d[i][j]);
    }
    if (minimo > tope) return tope + 1;
  }
  return d[a.length][b.length];
}

/** Puntaje de una palabra de la consulta contra un texto: empieza una
 *  palabra > esta dentro de una palabra > (aproximado) se parece. 0 = no. */
function puntajePalabra(t: string, palabras: string[], aproximado: boolean): number {
  if (palabras.some(p => p.startsWith(t))) return 3;
  if (t.length >= 3 && palabras.some(p => p.includes(t))) return 2;
  if (aproximado && t.length >= 4) {
    const tope = t.length >= 7 ? 2 : 1;
    // Contra la palabra entera o contra su comienzo ('pascualeto' ~ 'pascualetto').
    if (palabras.some(p => distancia(t, p, tope) <= tope || (p.length > t.length && distancia(t, p.slice(0, t.length), tope) <= tope))) return 1;
  }
  return 0;
}

export interface Coincidencia {
  contacto: Contacto;
  indice: number;
  puntaje: number;
  /** Agentes del contacto que coinciden con la busqueda (para resaltarlos). */
  agentes: Set<number>;
}

function coincidir(c: Contacto, indice: number, tokens: string[], aproximado: boolean): Coincidencia | null {
  const nombres = c.agentes.map(palabrasDe);
  const sector = palabrasDe(c.sector);
  const otros = palabrasDe(`${c.zona} ${c.nota}`);
  const numeros = [c.interno, c.directo, c.nota].map(n => n.replace(/\D/g, '')).filter(Boolean);
  const agentes = new Set<number>();
  let puntaje = 0;
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      // Numeros: interno o directo que empieza (o contiene) lo escrito.
      if (numeros.some(n => n.startsWith(t))) { puntaje += 6; continue; }
      if (t.length >= 3 && numeros.some(n => n.includes(t))) { puntaje += 3; continue; }
      return null;
    }
    let mejor = 0;
    nombres.forEach((ps, i) => {
      const p = puntajePalabra(t, ps, aproximado);
      if (p) { agentes.add(i); mejor = Math.max(mejor, p * 2); }
    });
    mejor = Math.max(mejor, puntajePalabra(t, sector, aproximado) * 1.5, puntajePalabra(t, otros, aproximado));
    if (!mejor) return null;
    puntaje += mejor;
  }
  return { contacto: c, indice, puntaje, agentes };
}

/** Contactos con todas las palabras de la consulta en el nombre, el sector,
 *  la zona o los numeros (sin tildes, en cualquier parte de la palabra),
 *  ordenados por relevancia. Si no hay ninguno exacto, busca parecidos
 *  (un error de tipeo) y lo avisa con `aproximada`. */
export function buscarEnGuia(guia: Guia, consulta: string, zona?: string): { resultados: Coincidencia[]; aproximada: boolean } {
  const tokens = tokensDe(consulta);
  const contactos = guia.contactos
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !zona || c.zona === zona);
  if (!tokens.length) return { resultados: [], aproximada: false };
  for (const aproximado of [false, true]) {
    const resultados = contactos
      .map(({ c, i }) => coincidir(c, i, tokens, aproximado))
      .filter((x): x is Coincidencia => x !== null)
      .sort((a, b) => b.puntaje - a.puntaje || a.indice - b.indice);
    if (resultados.length) return { resultados, aproximada: aproximado };
  }
  return { resultados: [], aproximada: false };
}

/** Partes de `texto` que coinciden con alguna palabra de la consulta (sin
 *  tildes), para resaltarlas: [desde, hasta) sobre el texto original. */
export function tramosResaltados(texto: string, tokens: string[]): Array<[number, number]> {
  const plano = Array.from(texto).map(ch => normalizar(ch).charAt(0) || ch).join('');
  const tramos: Array<[number, number]> = [];
  for (const t of tokens) {
    if (t.length < 2 && !/^\d$/.test(t)) continue;
    let desde = plano.indexOf(t);
    while (desde >= 0) {
      tramos.push([desde, desde + t.length]);
      desde = plano.indexOf(t, desde + t.length);
    }
  }
  tramos.sort((a, b) => a[0] - b[0]);
  const unidos: Array<[number, number]> = [];
  for (const tr of tramos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && tr[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], tr[1]);
    else unidos.push([...tr]);
  }
  return unidos;
}
