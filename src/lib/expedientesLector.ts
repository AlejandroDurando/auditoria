import { useSyncExternalStore } from 'react';
import type { ExpedienteLector } from '../../api/expedientes';
import { guardarClave, leerClave } from '../components/ClaveAcceso';

// Expedientes del lector leidos de /api/expedientes, compartidos entre la
// vista "Expedientes del lector" y el buscador del encabezado: se piden una
// vez por clave y los dos ven la misma lista.

interface Estado {
  clave: string;
  expedientes: ExpedienteLector[] | null;
  cargando: boolean;
  error: string | null;
}

let estado: Estado = { clave: leerClave(), expedientes: null, cargando: false, error: null };
const oyentes = new Set<() => void>();

function cambiar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  oyentes.forEach(aviso => aviso());
}

// La clave tambien se ingresa en el Matriculador: se sigue la guardada.
window.addEventListener('auditor:clave', () => {
  const clave = leerClave();
  if (clave !== estado.clave) cambiar({ clave, expedientes: null });
});

export function useExpedientesLector(): Estado {
  return useSyncExternalStore(
    aviso => { oyentes.add(aviso); return () => { oyentes.delete(aviso); }; },
    () => estado,
  );
}

/** Lee los expedientes con la clave guardada. Sin `forzar`, no repite la
 *  lectura si ya hay datos o una en curso. */
export async function cargarExpedientes(forzar = false) {
  const { clave } = estado;
  if (!clave || estado.cargando || (estado.expedientes && !forzar)) return;
  cambiar({ cargando: true, error: null });
  try {
    const r = await fetch('/api/expedientes', { headers: { 'x-lector-key': clave } });
    if (r.status === 401) {
      guardarClave('');
      cambiar({ clave: '', expedientes: null, error: 'La clave de acceso no es correcta.' });
      return;
    }
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
    cambiar({ expedientes: datos.expedientes || [] });
  } catch (e) {
    cambiar({ error: e instanceof Error ? e.message : 'No se pudieron leer los expedientes.' });
  } finally {
    cambiar({ cargando: false });
  }
}

/** Guarda la clave (o la olvida con '') y vuelve a leer. */
export function fijarClave(clave: string) {
  guardarClave(clave);
  cambiar({ clave, error: null });
  if (clave) cargarExpedientes(true);
}
