import React, { useState } from 'react';
import { Zap, Printer, Pencil, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface Fila {
  id: number;
  observacion: string;
}

interface Metadata {
  sector: string;
  expediente: string;
  fondoFijo: string;
  fecha: string;
}

function hoy(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFecha(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildFilas(n: number): Fila[] {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, observacion: '' }));
}

export function PlanillaControlFF() {
  const [vista, setVista] = useState<'formulario' | 'preview'>('formulario');
  const [meta, setMeta] = useState<Metadata>({ sector: '', expediente: '', fondoFijo: '', fecha: hoy() });
  const [filas, setFilas] = useState<Fila[]>(buildFilas(6));

  function reset() {
    setMeta({ sector: '', expediente: '', fondoFijo: '', fecha: hoy() });
    setFilas(buildFilas(6));
    setVista('formulario');
  }

  function agregarFila() {
    setFilas(prev => [...prev, { id: prev.length + 1, observacion: '' }]);
  }

  function actualizarFila(id: number, valor: string) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, observacion: valor } : f));
  }

  function actualizarMeta(campo: keyof Metadata, valor: string) {
    setMeta(prev => ({ ...prev, [campo]: valor }));
  }

  if (vista === 'preview') {
    return (
      <div className="max-w-2xl">
        {/* Header sección */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0F6E56]" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900">Planilla Control FF</h2>
            <p className="text-xs text-[#9A9890] mt-0.5">Vista previa generada.</p>
          </div>
        </div>

        {/* Card planilla */}
        <div
          id="planilla-print"
          className="bg-white border-[0.5px] border-[#E8E6DE] rounded-[12px] p-[28px_32px] max-w-[560px]"
        >
          {/* Header planilla */}
          <div className="flex items-start justify-between pb-4 mb-5 border-b-[1.5px] border-[#D3D1C7]">
            <div className="flex items-start gap-2.5">
              <div className="w-[28px] h-[28px] bg-[#0F6E56] rounded-[6px] flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#1A1A1A] leading-none">EPE</p>
                <p className="text-[11px] text-[#9A9890] mt-1 leading-none">Energía de Santa Fe</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-medium text-[#9A9890] uppercase tracking-wide leading-none">Planilla Control FF</p>
              <p className="text-[11px] text-[#B4B2A9] mt-1 leading-none">Coordinación Rendición de Cuentas</p>
            </div>
          </div>

          {/* Grilla metadata */}
          <div className="border-[0.5px] border-[#E8E6DE] rounded-[8px] overflow-hidden mb-5">
            {[
              { label: 'Sector', value: meta.sector },
              { label: 'N.º de expediente', value: meta.expediente },
              { label: 'N.º Fondo Fijo', value: meta.fondoFijo },
              { label: 'Fecha', value: formatFecha(meta.fecha) },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={cn(
                  'grid items-stretch',
                  i < arr.length - 1 && 'border-b-[0.5px] border-[#E8E6DE]'
                )}
                style={{ gridTemplateColumns: '160px 1fr' }}
              >
                <div className="bg-[#F7F6F3] px-3 py-2.5 flex items-center">
                  <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">{row.label}</span>
                </div>
                <div className="bg-white px-3 py-2.5 flex items-center border-l-[0.5px] border-[#E8E6DE]">
                  <span className="text-[13px] font-medium text-[#1A1A1A]">{row.value || '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla observaciones */}
          <p className="text-[13px] font-medium text-[#1A1A1A] mb-2">Observaciones</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F6F3] border-[0.5px] border-[#E8E6DE]">
                <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890] px-3 py-2 w-[140px]">
                  N.º de orden
                </th>
                <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890] px-3 py-2">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody className="border-[0.5px] border-[#E8E6DE] border-t-0">
              {filas.map((fila, i) => (
                <tr
                  key={fila.id}
                  className={cn(i < filas.length - 1 && 'border-b-[0.5px] border-[#EEECE5]')}
                >
                  <td className="px-3 py-2.5 text-[13px] font-medium text-[#0F6E56] w-[140px]">
                    {String(fila.id).padStart(2, '0')}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-[#1A1A1A]">
                    {fila.observacion || <span className="text-[#C8C6BE]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3.5 mt-5 border-t-[0.5px] border-[#EEECE5]">
            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">
              Coordinación Rendición de Cuentas
            </span>
            <span className="text-[11px] text-[#9A9890]">
              Fecha: {formatFecha(meta.fecha)}
            </span>
          </div>
        </div>

        {/* Botones acción */}
        <div className="flex items-center gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={() => setVista('formulario')}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#0F6E56] bg-white border-[0.5px] border-[#D3D1C7] rounded-[8px] cursor-pointer hover:bg-[#F7F6F3] transition-colors outline-none"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#0F6E56] border-[0.5px] border-[#0F6E56] rounded-[8px] cursor-pointer hover:bg-[#0a5c47] transition-colors outline-none"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>

        <style>{`
          @media print {
            body > * { display: none !important; }
            #planilla-print { display: block !important; }
          }
        `}</style>
      </div>
    );
  }

  // Estado formulario
  return (
    <div className="max-w-2xl">
      {/* Header sección */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-[12px] border-[0.5px] border-[#E8E6DE] flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0F6E56]" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900">Planilla Control FF</h2>
            <p className="text-xs text-[#9A9890] mt-0.5">Generá y completá la planilla de control de Fondo Fijo.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 text-[13px] font-medium text-white bg-[#0F6E56] rounded-[8px] cursor-pointer hover:bg-[#0a5c47] transition-colors outline-none border-none"
        >
          Nueva planilla
        </button>
      </div>

      {/* Card formulario */}
      <div className="bg-white border-[0.5px] border-[#E8E6DE] rounded-[12px] p-[20px_24px]">
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(
            [
              { campo: 'sector', label: 'Sector', type: 'text' },
              { campo: 'expediente', label: 'N.º de expediente', type: 'text' },
              { campo: 'fondoFijo', label: 'N.º Fondo Fijo', type: 'text' },
              { campo: 'fecha', label: 'Fecha', type: 'date' },
            ] as { campo: keyof Metadata; label: string; type: string }[]
          ).map(({ campo, label, type }) => (
            <div key={campo} className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890]">
                {label}
              </label>
              <input
                type={type}
                value={meta[campo]}
                onChange={e => actualizarMeta(campo, e.target.value)}
                className="border-[0.5px] border-[#E8E6DE] rounded-[6px] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none focus:border-[#0F6E56] transition-colors bg-[#F7F6F3] focus:bg-white"
              />
            </div>
          ))}
        </div>

        {/* Tabla observaciones */}
        <p className="text-[13px] font-medium text-[#1A1A1A] mb-2">Observaciones</p>
        <table className="w-full border-collapse">
          <thead>
            <tr
              className="bg-[#F7F6F3]"
              style={{ border: '0.5px solid #E8E6DE', borderRadius: '8px 8px 0 0' }}
            >
              <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890] px-3 py-2 w-[140px]">
                N.º de orden
              </th>
              <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A9890] px-3 py-2">
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody
            style={{
              border: '0.5px solid #E8E6DE',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              display: 'table-row-group',
            }}
          >
            {filas.map((fila, i) => (
              <tr
                key={fila.id}
                className={cn(i < filas.length - 1 && 'border-b-[0.5px] border-[#EEECE5]')}
              >
                <td className="px-3 py-1.5 text-[13px] font-medium text-[#0F6E56] w-[140px]">
                  {String(fila.id).padStart(2, '0')}
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={fila.observacion}
                    onChange={e => actualizarFila(fila.id, e.target.value)}
                    placeholder="Escribí una observación..."
                    className="w-full text-[13px] text-[#1A1A1A] outline-none bg-transparent placeholder:text-[#C8C6BE]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Agregar fila */}
        <button
          type="button"
          onClick={agregarFila}
          className="flex items-center gap-1 mt-3 text-[13px] font-medium text-[#0F6E56] bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity outline-none p-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar fila
        </button>

        {/* Generar */}
        <button
          type="button"
          onClick={() => setVista('preview')}
          className="w-full mt-6 py-[10px] text-[13px] font-medium text-white bg-[#0F6E56] rounded-[8px] cursor-pointer hover:bg-[#0a5c47] transition-colors outline-none border-none"
        >
          Generar planilla
        </button>
      </div>
    </div>
  );
}
