import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { cn } from '../lib/utils';
import { boton, campo } from './ui';

// Clave de acceso de las vistas que leen datos del lector (/api/expedientes).
// La escribe el usuario una vez y queda en este navegador; nunca esta en el
// codigo. La comparten Expedientes del lector y el Matriculador.
const CLAVE_STORAGE = 'lector-access-key';

export function leerClave(): string {
  try { return localStorage.getItem(CLAVE_STORAGE) || ''; } catch { return ''; }
}

export function guardarClave(clave: string) {
  try {
    if (clave) localStorage.setItem(CLAVE_STORAGE, clave);
    else localStorage.removeItem(CLAVE_STORAGE);
  } catch { /* sin almacenamiento: se pide en cada visita */ }
  window.dispatchEvent(new Event('auditor:clave'));
}

/** Formulario para ingresar la clave. Al enviarla la guarda y avisa. */
export function ClaveAcceso({ titulo, error, onClave }: {
  titulo: string; error?: string | null; onClave: (clave: string) => void;
}) {
  const [escrita, setEscrita] = useState('');
  return (
    <div className="max-w-[380px]">
      <h1 className="text-xl font-semibold tracking-[-0.01em] text-tinta">{titulo}</h1>
      <p className="mt-0.5 mb-4 text-sm text-tinta-2">Ingresá la clave de acceso. Queda guardada en este navegador.</p>
      <form
        onSubmit={e => { e.preventDefault(); const c = escrita.trim(); if (c) { guardarClave(c); setEscrita(''); onClave(c); } }}
        className="flex gap-2"
      >
        <div className="relative flex-1 min-w-0">
          <KeyRound className="w-3.5 h-3.5 text-tenue absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="password"
            value={escrita}
            onChange={e => setEscrita(e.target.value)}
            placeholder="Clave de acceso"
            aria-label="Clave de acceso"
            autoComplete="off"
            className={cn(campo, 'pl-8')}
          />
        </div>
        <button type="submit" className={boton.primario}>Entrar</button>
      </form>
      {error && <p role="alert" className="text-xs text-error mt-2">{error}</p>}
    </div>
  );
}
