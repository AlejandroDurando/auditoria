import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound } from 'lucide-react';

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div className="bg-superficie border-[0.5px] border-linea rounded-[12px] p-6 caja">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-superficie rounded-[10px] border-[0.5px] border-linea flex items-center justify-center caja">
            <KeyRound className="w-5 h-5 text-acento" />
          </div>
          <div>
            <h2 className="text-base font-medium text-slate-900">{titulo}</h2>
            <p className="text-xs text-tenue mt-0.5">Ingresá la clave de acceso. Queda guardada en este navegador.</p>
          </div>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); const c = escrita.trim(); if (c) { guardarClave(c); setEscrita(''); onClave(c); } }}
          className="flex gap-2"
        >
          <input
            type="password"
            value={escrita}
            onChange={e => setEscrita(e.target.value)}
            placeholder="Clave de acceso"
            autoComplete="off"
            className="flex-1 min-w-0 bg-campo/60 border-[0.5px] border-linea-fuerte rounded-[7px] px-3 py-2 text-sm outline-none focus:border-acento"
          />
          <button type="submit" className="py-[7px] px-[13px] bg-marca text-white text-[13px] font-medium rounded-[7px] hover:bg-marca-hover transition-all outline-none cursor-pointer border-none">
            Entrar
          </button>
        </form>
        {error && <p className="text-xs text-error mt-3">{error}</p>}
      </div>
    </motion.div>
  );
}
