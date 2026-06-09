import React, { useState } from 'react';
import { Zap, Printer, Pencil, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

// EPE logo Base64 — same asset used in Planilla Revisiva
const EPE_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUYAAACaCAMAAADighEiAAAAmVBMVEX///8AN24ANW0AGWD4+foAM2wAMWv09vg6WIMAMW0bQXNGZo6lscMAJ2bd5OwAJWUALGgAHmJWcZQAImQAHWIAKmjo7fLFzdrQ2OF7jqkAGGAgSHmdqr66xdNof57W3uauuspyh6SElq8AP3WNnbQ4VoEtUX9lfJxDYYqTpLq0v82rtse/ydbm6e6CkqsrU4FbdJYADl0AAFeGYhOSAAANgklEQVR4nO2da2OyPA+Ab6qgiFAQEZwHcDoPUzef9///uFd0B4s0bSF1m9v12bVLekqTNPz7p0ZrH2fjxfTgrJejuaEAMZh2FpHKH18zHy3bvenLZrydJIOWohBC2V5Hc6Ly34xUukm707URhG7kW5ZJlPoxDHPNtDX11f68CDEIMS0/ilwaBuRp1U3rqTDdvstmn2RTks50ZLtpTlY+dX1TUXmf+DOmvVezakMlENN2w/nCq6jC5mRq15NtKNdRMpyHdj1RozHTYs01XQKJQmdXQYnpsBP6lTV4oiAbh+clrdnPEfp82WTzoW57JRArHMWKSpy8IsjmPos7ypYhxgIMkstG0wChyRLMoKdy3kyWAb5sZSRPKEo8dsWItwtRGi3BN6VXdtJGko0O4I4GqwbSUUDmzcuGuy5OsyWY/a6UEluzBzTZ4BWQWTXNkk/MNtPyEK3hEsKFhBYnJtopV5CtOFyHoPbm+4G9YtruWWgtl9AQ6rG56uPJZvWAnpIO5ozxX5jG25hm4zVBBmsxHWEaXAWTmKHbR5XUZTasVgdvLpRBKHip2WLt+Gdcvtk4RLZIQsag2+vcGnNM6JY7RDYTKNc2cChuTyRipkeiyWz8xH3karGHbWzxpn5zjX5XMxnTKtNn77zjcm7YTQdbNuKWm43NJfqaIx2mh7puMgksjtflCb9ru1yLbfyd65Zm4xuNshtac61BttdSNWroyfCnTBeOVrPxTOl0RF/RxpVJ/MZBYd/KnadSUNYmAHzLUs3JeFVJye441SGbuynR4kLqjDZtP3JDGtnEmHckMFlXEt9NRmRamxM/jIQTOrq6y2ykzmhV2Uh2rcWsL+zGcgOrvRpusjjxBq3mdRtCPK69QyKBs+RMy4s3TihQJCnajs8NCdn69tNZtnRfSbYTqWguksh1ul7l9s/w3WRkLqXGE15P8M822LY8kX/2KNu66yHEx5ojwS2JjsbycnLZcrcoc6nSjmADcjNGtqVg9rqdDYJsOVP4ILNot+Y8PPPItQV41h6HGXhksJEm+LeGTccosh2J4Y2RKjnoAfhuMshZUsYSWj1MTDcJwSVNHSTZRP+U0ZcMI4p54vYjF2P7ZAuta+aMgSO6AZpsoq0mUJSQT5PvJqMTtaYGUNbBpXN/A8tWZvpVpAVaVYg97fl7vTjGVgD0/5KPI6MFntJSUQdZZtAlMFLctCBS/ng1VHco8J+2P+4xM+jsjEpvcxXxoJ5AN6gqE/4Co6ptgb4ie//2qz30KzJHlA1OTlJebBAbrlBqZmMOqMaPRQ3O2VA10wJiAN2UFM05AXw3WbmzBAJS0McRM4DCgNYa7kGNR2hYVQ9QGL7ZGPFd/xwgl9uHwQNOWSqRgCNNC8qLvLrk12PE7cqVS3i4oAOc1O/zDDCwrtJXa/IM2VXqkwSE35XyNuVFgIber0QTyJIrBNBrAvqjg5qprCzALhzuxX/OMIYuyjSTkQ3z8BxAt2lci+BfzHeTGaouljVkfb+N/gDKpSQdLIdEDpjhJZuTK0nGXdRkqShTApkXxJeRDfFacRxVaN6HqOc0cG4q21Xgcn0Po4FpV6jn9ABM7LZVdyyYA7ezQvxQCHh2vI8+7L3wq+bdl7GD3cjteizZmz/gJlNzEYBG2nGjPRvfgsTeurJdGjGC8LtZD8o6hwA3mdoKc8D/+n1Hf9Er2+XI8ycIBuwdaMDvK1QyPg5wxOPhbbmivsC54nLkW7CDvS4hY3am/IMzULB30hE8y96Pq6Y4qlqHy5HnW3IosEcUsFf1ZXU4yBzRI4J3+XTLdnFEgXeB2pAR44sdc9cimQ88mDTePXdfeiPbFeVM2O/52BrfPBiFRwigO642lnQ2GQlEhCF1fUu8BZH+/iaykUsHKXilqo11YNR4uEE22UWyrd7kNebCoPZ4WJWCf0ivVXDGHH3cKvleOQwu78ktvYIVckBUH2JXIfhwuMEmem0uHaSg064+rBMRDFYgQT/nv6c3r/fSJE6Qnx0UCJhra6LXAMnxL6IrQDAXg0tPrL7npCcemK1R/yME69LA0mw2Ni48e/w8OQwKwQ6+2YiExfh+9Y4aIxs/boyBhVurQ9jdnLkz6b1ZMDlrYGy1NgXfueZHl5bBOkf1ThHGQSpwJdUkYt1kaqVZFCG0XfBu6H3IxDhI9T72YZ2IrZoFVEBIcBUJ1rvSmLi6XjWy0dlUn1gkMq7D3HrVyERn+anYOaZl14J9mBhrs1Gt8KUkrrjQKhu9NInBEXMnzVY9GLF0+a2s0CnNSQCPGDfDlA3siv/muhJ6NhA/cDjxBzitAjO6CpvfuMlk/1boRwyxqDvjZseA5vd7dgoO4GVQPckLBNe1afpuYPYyoD/wMqj67gEGdE34qNlkkN/KtGSx/fxxZPAQLmfjBA6Dga/3cDNPQGcSWGRGGSAGaTk9WVbT4Wa7S2XS7YFw7lVNybpANwsywky5Akq8BXjPpC6B8khx08ngiDjFzHLhZ6OKCn1VBdyM4XI9qoBWCOo+zHeTwYW+qgM6DBSThgSAVgFq4jfmIwQ5wGzsQkGWmuzB+AhmeiN/iSHnon4gkA3VAAdLhqm/+eHDP8yAQl/1gLP3UKcjnFoAFKpShW/voL6VugS+fkaYi0AQ1AqwbjIef6OKUA/NCwRBrRBxFTThoDjBegUMuMkspDoPV4CPi470EU9rgeOFUMWsbA7AIwTcRyOXiGIk9IBmhHui8juRgVGtg+/Z1GU2/hOd1UZenBmtWocw8YrQzkvtB018N5mlyWzMkZFtiPNYSyJzgvghdRYTr3qxJMBsxPVZsUhkThxlC53Fcx3Zzsjly1kRDexlL/ewxHGcpILsWI+tsdQC3q5mNf9/CLnY+Jtsq9x7FCeqsr2xk6+TalrWqRgapa6I/9hHCHzXtzazMSfWI1tW1hf43o2LoEAgZbYcfom3Yj0xZJxKoQtBwcHykQdLdlSkUAAPqNVho3r+ioAlO6rSLx95ucqNShCL6QFwk5UXNkUDrmZUjQdOX0/o2eYFrwbfEC6k2eNTbcuC4F4Y9uhpSjarHb4Bp8tN9sHAwM5k479aFlTMU6fgXebf3HWajWcEFfPUAYpUPCOn+Lpbpnl+tYIQNzejDPjxdQXZgJHvNlDHjNUOUNACN7ZUzhbx2yaGIJ1kEmHuIX0m9RW4lJlazcY3di6mbAEYMU1MxGSliLkvAdFVVF8+l9RAlM2HR76F9wWLQiUTfgKx+aRVfR80EWUTpkF0+0iDVkhcWXHtHVu32fjBNkCSTSJxZTBD+IahcZVqBLjJUMPuIK1ZhKJIqbi6NwsQHhKy2mku+bU6Mj06K5dtGLoIssmFSwebEa17arPZrEBBHK1usmtaCLLJO0iTRTvIP5RbeegKbjKgyARuwSQp2dYBrSWbysgPtsNXM6I08q0K3x1mSy4BJd5CZCXJyZYNX4lP3Wqy8T4yxcdLto/T3tKI+kGYO4WjI75vi5NiTcYmGIe8H/q3MRvL8JIsl22uKptVdeTztw9ePMm23fF48zicrXqOCNbeGa95v1ujJg9XoIJsqNV+//jjjz/++OOPP/74A53mHfFlSmwt/IfGvfC/27qkPtkYCE6+7wJunWt5sg69HyXmuWZfsap3y7tRIjFNO6KhvoR/LnG7f4PKl/ohVuQGtLNeLZ4Fb+E1kDr0hyuRmJbvhkF/dFhsk4Ge58oCvN7DLUrZaoLk+qPzdu9lG988zPHJYCYsLP0tISf9BQ/z3uM43t98AbO0hlih9dtx1N/xADGWzqy7U7Jpdl1NLEy9JXNxMc38PceD4Qw3E6/C/FuHwpcL1fghSiRmPv+sTnu1mSTVrUES3aKC9DfkeABHbtgw27NFlu7rmtPpYuSi5jR+f0z7eID482VvkcWI9ku6aAdRhYj3D4MYJwOwYb+uXrqJp+M6tx+/uj/TOJHiNP8iq+O8dHe11y+M13WOmryvOUlOB0gQLXuzcSxVjAuDQdehrn0XmjwZgNS12rMxwvNeZVrZwQx1lvHVDTHtyA2ikTM9GjBfeQFpTVZh6P+4wzv3INCwHyxXmyz9Gg/CFbtpJ0TJW74Fnx6ELP7iC/AVrXhoBd97Tp49WP3GvPfYjfffY/6Vkbwsw295p8sPkJAaS2eo6EH4KpLFqPGNTPOzAdOYO8PNrooH4QvxNk8R6jOxyvqj5mg9HU/Sr4sS18Mbr/tfpMncgDnNv9lmkv6s+VfGoLu26S2viycDkNrzp8M4S77v+aHOYHtw9WuS5CG4owForKePWfKFIRCNtJ57Ps5DuDIF5gYMjcxRb7GNb3+Buy2tydRADrKcQ0h98nQYbuMfYcCg0NzNkObkaf5R13BevrUBrY94OKr5OtOkgXX2YN35+oVpJo9GDa85XU72g1+twE/SxVO1t6C2r71kzM/C27w+qJrmJHR+z0kizX689lUiOT7B/QjN/bDvOn3JSA7pH37+pU4frW3PpOL4QzTH/azUHTJ4Xvmw19wMZr/RPFSmuZsaXNOcuCOcisa/gWY8m5fGH8w+6oe57p9mMpxfGZT09QYF3e6O5HF5eV20fKQPK/w+0s0oPF8XSbi+T9fhjfA2a+qalr0V//QPkP3W6d25wf1/1c9KegDe7akAAAAASUVORK5CYII=';

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
          {/* Header planilla — mismo diseño que Planilla Revisiva */}
          <div className="border border-black grid items-stretch text-[9px] mb-5" style={{ gridTemplateColumns: '160px 1fr' }}>
            <div className="p-2 flex items-center justify-center border-r border-black">
              <img
                src={EPE_LOGO_BASE64}
                alt="EPE Logo"
                className="w-[96px] h-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 flex items-center justify-center text-center font-bold text-[10px]">
              Empresa Provincial de la Energía de Santa Fe
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
