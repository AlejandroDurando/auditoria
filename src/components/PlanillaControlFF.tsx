import React, { useState } from 'react';
import { Zap, Download, Pencil, Plus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { EPE_LOGO_BASE64 } from '../lib/epe-logo';
import { cn } from '../lib/utils';

interface Fila {
  id: number;
  orden: string;
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
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, orden: '', observacion: '' }));
}

/** Renglones con que arranca la planilla: los que llegan con los datos del
 *  expediente (lo que no dio OK) y, debajo, renglones en blanco hasta seis. */
function filasIniciales(datos?: Array<{ orden: string; observacion: string }>): Fila[] {
  const dadas = (datos || []).map((f, i) => ({ id: i + 1, orden: f.orden, observacion: f.observacion }));
  const blancos = Math.max(6 - dadas.length, dadas.length ? 1 : 6);
  return [...dadas, ...Array.from({ length: blancos }, (_, i) => ({ id: dadas.length + i + 1, orden: '', observacion: '' }))];
}

function descargarPDF(meta: Metadata, filas: Fila[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  // Header: recuadro con logo + nombre empresa
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(15, 12, 180, 21);
  doc.line(55, 12, 55, 33);
  doc.addImage(EPE_LOGO_BASE64, 'PNG', 16, 13.5, 38, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Empresa Provincial de la Energía de Santa Fe', 59, 22.5);

  // Título
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANILLA CONTROL FONDO FIJO', 105, 42, { align: 'center' });
  doc.setLineWidth(0.35);
  doc.line(15, 44, 195, 44);

  // Metadata
  const metaRows = [
    ['Sector', meta.sector || '—'],
    ['N.º de Expediente', meta.expediente || '—'],
    ['N.º Fondo Fijo', meta.fondoFijo || '—'],
    ['Fecha', formatFecha(meta.fecha)],
  ];
  let y = 50;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const [label, value] of metaRows) {
    doc.setFillColor(247, 246, 243);
    doc.rect(15, y, 60, 7, 'F');
    doc.setDrawColor(200, 198, 190);
    doc.setLineWidth(0.2);
    doc.rect(15, y, 60, 7);
    doc.rect(75, y, 120, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 118, 112);
    doc.text(label.toUpperCase(), 17, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    doc.text(value, 77, y + 4.5);
    y += 7;
  }

  // Tabla observaciones
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Observaciones', 15, y);
  y += 5;

  // Header tabla
  doc.setFillColor(247, 246, 243);
  doc.rect(15, y, 40, 7, 'F');
  doc.rect(55, y, 140, 7, 'F');
  doc.setDrawColor(200, 198, 190);
  doc.setLineWidth(0.2);
  doc.rect(15, y, 40, 7);
  doc.rect(55, y, 140, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 118, 112);
  doc.text('N.º DE ORDEN', 17, y + 4.5);
  doc.text('OBSERVACIONES', 57, y + 4.5);
  y += 7;

  // Filas: el alto sigue al texto de la observacion; si no entra, hoja nueva.
  for (const fila of filas) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lineas: string[] = doc.splitTextToSize(fila.observacion || '—', 136);
    const alto = Math.max(7, lineas.length * 4 + 3);
    if (y + alto > 280) { doc.addPage(); y = 15; }
    doc.setDrawColor(200, 198, 190);
    doc.setLineWidth(0.2);
    doc.rect(15, y, 40, alto);
    doc.rect(55, y, 140, alto);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 110, 86);
    doc.text(fila.orden || '—', 17, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 26, 26);
    doc.text(lineas, 57, y + 4.5);
    y += alto;
  }

  // Footer
  y += 8;
  doc.setDrawColor(200, 198, 190);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 118, 112);
  doc.text('COORDINACIÓN RENDICIÓN DE CUENTAS', 15, y);
  doc.text(`Fecha: ${formatFecha(meta.fecha)}`, 195, y, { align: 'right' });

  const nombre = meta.expediente
    ? `planilla control.pdf`
    : 'planilla control.pdf';
  doc.save(nombre);
}

interface Props {
  initialData?: {
    sector: string; expediente: string; fondoFijo: string; fecha: string;
    /** Observaciones ya cargadas (expediente auditado por el lector). */
    filas?: Array<{ orden: string; observacion: string }>;
  } | null;
}

export function PlanillaControlFF({ initialData }: Props) {
  const [vista, setVista] = useState<'formulario' | 'preview'>('formulario');
  const [meta, setMeta] = useState<Metadata>(() => ({
    sector: initialData?.sector || '',
    expediente: initialData?.expediente || '',
    fondoFijo: initialData?.fondoFijo || '',
    // La planilla de control siempre se emite con la fecha del día en que se
    // completa, no con la fecha del expediente auditado.
    fecha: hoy(),
  }));
  const [filas, setFilas] = useState<Fila[]>(() => filasIniciales(initialData?.filas));
  const prevInitialData = React.useRef(initialData);

  // Sincronizar cuando llegan nuevos datos de auditoría
  React.useEffect(() => {
    if (initialData && initialData !== prevInitialData.current) {
      prevInitialData.current = initialData;
      setMeta({
        sector: initialData.sector,
        expediente: initialData.expediente,
        fondoFijo: initialData.fondoFijo,
        fecha: hoy(),
      });
      setFilas(filasIniciales(initialData.filas));
      setVista('formulario');
    }
  }, [initialData]);

  function reset() {
    setMeta({ sector: '', expediente: '', fondoFijo: '', fecha: hoy() });
    setFilas(buildFilas(6));
    setVista('formulario');
  }

  function agregarFila() {
    setFilas(prev => [...prev, { id: prev.length + 1, orden: '', observacion: '' }]);
  }

  function actualizarFila(id: number, campo: 'orden' | 'observacion', valor: string) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  }

  function actualizarMeta(campo: keyof Metadata, valor: string) {
    setMeta(prev => ({ ...prev, [campo]: valor }));
  }

  if (vista === 'preview') {
    return (
      <div className="max-w-2xl">
        {/* Header sección */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-tinta">Planilla control</h2>
            <p className="text-xs text-tenue mt-0.5">Vista previa generada.</p>
          </div>
        </div>

        {/* Card planilla */}
        <div className="papel bg-superficie border-[0.5px] border-linea rounded-[0.75rem] p-[1.75rem_2rem] max-w-[35rem] caja">
          {/* Header — logo EPE igual que Planilla Revisiva */}
          <div className="border border-black grid items-stretch text-[0.5625rem] mb-5" style={{ gridTemplateColumns: '10rem 1fr' }}>
            <div className="p-2 flex items-center justify-center border-r border-black">
              <img
                src={EPE_LOGO_BASE64}
                alt="EPE"
                className="w-[6rem] h-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 flex items-center justify-center text-center font-bold text-[0.625rem]">
              Empresa Provincial de la Energía de Santa Fe
            </div>
          </div>

          {/* Título */}
          <p className="text-center text-[0.75rem] font-bold uppercase tracking-wide text-tinta mb-4">
            Planilla Control Fondo Fijo
          </p>

          {/* Grilla metadata */}
          <div className="border-[0.5px] border-linea rounded-[0.5rem] overflow-hidden mb-5">
            {[
              { label: 'Sector', value: meta.sector },
              { label: 'N.º de expediente', value: meta.expediente },
              { label: 'N.º Fondo Fijo', value: meta.fondoFijo },
              { label: 'Fecha', value: formatFecha(meta.fecha) },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={cn('grid items-stretch', i < arr.length - 1 && 'border-b-[0.5px] border-linea')}
                style={{ gridTemplateColumns: '10rem 1fr' }}
              >
                <div className="bg-hundida px-3 py-2.5 flex items-center">
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.06em] text-tenue">{row.label}</span>
                </div>
                <div className="bg-superficie px-3 py-2.5 flex items-center border-l-[0.5px] border-linea">
                  <span className="text-[0.8125rem] font-medium text-tinta">{row.value || '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla observaciones */}
          <p className="text-[0.8125rem] font-medium text-tinta mb-2">Observaciones</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-hundida border-[0.5px] border-linea">
                <th className="text-left text-[0.625rem] font-medium uppercase tracking-[0.06em] text-tenue px-3 py-2 w-[8.75rem]">
                  N.º de orden
                </th>
                <th className="text-left text-[0.625rem] font-medium uppercase tracking-[0.06em] text-tenue px-3 py-2">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody className="border-[0.5px] border-linea border-t-0">
              {filas.map((fila, i) => (
                <tr key={fila.id} className={cn(i < filas.length - 1 && 'border-b-[0.5px] border-linea')}>
                  <td className="px-3 py-2.5 text-[0.8125rem] font-medium text-acento w-[8.75rem]">
                    {fila.orden || <span className="text-tenue-2">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[0.8125rem] text-tinta">
                    {fila.observacion || <span className="text-tenue-2">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3.5 mt-5 border-t-[0.5px] border-linea">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.06em] text-tenue">
              Coordinación Rendición de Cuentas
            </span>
            <span className="text-[0.6875rem] text-tenue">
              Fecha: {formatFecha(meta.fecha)}
            </span>
          </div>
        </div>

        {/* Botones acción */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setVista('formulario')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-acento bg-superficie border border-linea-fuerte rounded-[0.5rem] cursor-pointer hover:bg-hundida transition-colors outline-none"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => descargarPDF(meta, filas)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-marca border border-acento rounded-[0.5rem] cursor-pointer hover:bg-marca-hover transition-colors outline-none"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar
          </button>
        </div>
      </div>
    );
  }

  // Estado formulario
  return (
    <div className="max-w-2xl">
      {/* Header sección */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-tinta">Planilla control</h2>
            <p className="text-xs text-tenue mt-0.5">Generá y completá la planilla de control del fondo fijo.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center h-[1.875rem] px-3 text-sm font-medium text-white bg-marca rounded-[0.375rem] cursor-pointer hover:bg-marca-hover transition-colors outline-none border-none"
        >
          Nueva planilla
        </button>
      </div>

      {/* Card formulario */}
      <div className="bg-superficie border border-linea rounded-[0.5rem] p-[1.25rem_1.5rem] caja">
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
              <label className="text-[0.6875rem] font-medium text-tenue">
                {label}
              </label>
              <input
                type={type}
                value={meta[campo]}
                onChange={e => actualizarMeta(campo, e.target.value)}
                className="border border-linea rounded-[0.375rem] px-3 py-2 text-sm text-tinta outline-none focus:border-acento transition-colors bg-hundida focus:bg-superficie"
              />
            </div>
          ))}
        </div>

        {/* Tabla observaciones */}
        <p className="text-sm font-medium text-tinta mb-2">Observaciones</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-hundida" style={{ border: '0.5px solid #E8E6DE' }}>
              <th className="text-left text-[0.6875rem] font-medium text-tenue px-3 py-2 w-[8.75rem]">
                N.º de orden
              </th>
              <th className="text-left text-[0.6875rem] font-medium text-tenue px-3 py-2">
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody style={{ border: '0.5px solid #E8E6DE', borderTop: 'none' }}>
            {filas.map((fila, i) => (
              <tr key={fila.id} className={cn(i < filas.length - 1 && 'border-b border-linea')}>
                <td className="px-3 py-1.5 w-[8.75rem]">
                  <input
                    type="text"
                    value={fila.orden}
                    onChange={e => actualizarFila(fila.id, 'orden', e.target.value)}
                    placeholder="—"
                    className="w-full text-sm font-medium text-acento outline-none bg-transparent placeholder:text-tenue-2"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={fila.observacion}
                    onChange={e => actualizarFila(fila.id, 'observacion', e.target.value)}
                    placeholder="Escribí una observación..."
                    className="w-full text-sm text-tinta outline-none bg-transparent placeholder:text-tenue-2"
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
          className="flex items-center gap-1 mt-3 text-sm font-medium text-acento bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity outline-none p-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar fila
        </button>

        {/* Generar */}
        <button
          type="button"
          onClick={() => setVista('preview')}
          className="w-full mt-6 py-[0.625rem] text-sm font-medium text-white bg-marca rounded-[0.5rem] cursor-pointer hover:bg-marca-hover transition-colors outline-none border-none"
        >
          Generar planilla
        </button>
      </div>
    </div>
  );
}
