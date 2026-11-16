import React, { useState } from 'react';
import { AlertCircle, Check, Copy, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

// Piezas del sistema de diseño que comparten todas las pantallas: estados,
// tira de validaciones, botones, encabezado de pantalla y los estados de
// carga, vacio y error. Los tokens estan en index.css.

/** Los tres estados del lector, con su vocabulario: OK, Revisar y Error. */
export type Estado = 'ok' | 'revisar' | 'error';

/** Estado a partir de lo que traen los datos: 'pass' | 'fail' | 'warning' de
 *  una validacion, u 'OK' | 'ERROR' | 'REVISAR' de un expediente. */
export function estadoDe(valor: string | undefined | null): Estado {
  const v = (valor || '').toLowerCase();
  if (v === 'pass' || v === 'ok') return 'ok';
  if (v === 'fail' || v === 'error') return 'error';
  return 'revisar';
}

export const ROTULO_ESTADO: Record<Estado, string> = { ok: 'OK', revisar: 'Revisar', error: 'Error' };

const PUNTO: Record<Estado, string> = { ok: 'bg-ok', revisar: 'bg-aviso', error: 'bg-error-acento' };

export function Punto({ estado, className }: { estado: Estado; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', PUNTO[estado], className)} />;
}

/** Badge de estado. OK es silencioso (punto y texto gris); Revisar y Error
 *  llevan fondo: lo que resalta es la excepcion. */
export function EstadoBadge({ estado, children, className }: {
  estado: Estado; children?: React.ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 h-5 px-[7px] rounded-[4px] text-xs whitespace-nowrap select-none',
      estado === 'ok' && 'text-tinta-2',
      estado === 'revisar' && 'bg-aviso-fondo text-aviso-tinta font-medium',
      estado === 'error' && 'bg-error-fondo text-error font-medium',
      className,
    )}>
      <Punto estado={estado} />
      {children ?? ROTULO_ESTADO[estado]}
    </span>
  );
}

/** Contador con punto para las filas de grupo: "2 error", "1 revisar". */
export function Contador({ estado, children }: { estado: Estado; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
      estado === 'ok' ? 'text-tinta-2' : estado === 'error' ? 'text-error font-medium' : 'text-aviso-tinta font-medium',
    )}>
      <Punto estado={estado} />
      {children}
    </span>
  );
}

/** Identificador de una validacion (V7, D2) o un codigo, en mono. */
export function Clave({ children, estado, className }: {
  children: React.ReactNode; estado?: Estado; className?: string; key?: React.Key;
}) {
  return (
    <span className={cn(
      'font-mono text-[11px] leading-[18px] px-[5px] rounded-[4px] whitespace-nowrap',
      !estado && 'text-tinta-2',
      estado === 'ok' && 'text-tinta-2',
      estado === 'revisar' && 'bg-aviso-fondo text-aviso-tinta',
      estado === 'error' && 'bg-error-fondo text-error',
      className,
    )}>
      {children}
    </span>
  );
}

/** Etiqueta neutra con borde: procedencia de un dato (OCR, IA) u otro rotulo. */
export function Etiqueta({ children, title, className }: {
  children: React.ReactNode; title?: string; className?: string;
}) {
  return (
    <span title={title} className={cn(
      'inline-flex items-center text-[11px] leading-4 px-1 rounded-[4px] border border-linea-fuerte text-tinta-2 whitespace-nowrap',
      className,
    )}>
      {children}
    </span>
  );
}

const CELDA: Record<Estado, string> = { ok: 'bg-tira-ok', revisar: 'bg-tira-aviso', error: 'bg-tira-error' };

/** Tira de validaciones: una celda por validacion, coloreada por estado. Es
 *  la fila del Sheet compactada; el titulo aparece al pasar el mouse. */
export function TiraValidaciones({ validaciones, className }: {
  validaciones: Array<{ id: string; estado: Estado; titulo?: string }>;
  className?: string;
}) {
  const resumen = validaciones
    .filter(v => v.estado !== 'ok')
    .map(v => `${v.id} ${ROTULO_ESTADO[v.estado]}`)
    .join(', ');
  return (
    <span
      role="img"
      aria-label={resumen ? `Validaciones: ${resumen}` : `Validaciones: ${validaciones.length} OK`}
      className={cn('inline-flex items-center gap-[2px]', className)}
    >
      {validaciones.map(v => (
        <span
          key={v.id}
          title={`${v.id} · ${ROTULO_ESTADO[v.estado]}${v.titulo ? ` · ${v.titulo}` : ''}`}
          className={cn('w-[10px] h-[14px] rounded-[2px]', CELDA[v.estado])}
        />
      ))}
    </span>
  );
}

// ── Botones y campos ────────────────────────────────────────────────────────

const BASE_BOTON = 'inline-flex items-center justify-center gap-1.5 h-[30px] px-2.5 rounded-[6px] text-sm font-medium whitespace-nowrap cursor-pointer select-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed';

/** Clases de boton: secundario (borde), primario (marca), fantasma (sin borde)
 *  y peligro. Para usar tambien en <a> y <label>. */
export const boton = {
  secundario: cn(BASE_BOTON, 'border border-linea-fuerte bg-superficie text-tinta hover:bg-realce'),
  primario: cn(BASE_BOTON, 'border border-transparent bg-marca text-white hover:bg-marca-hover px-3'),
  fantasma: cn(BASE_BOTON, 'border border-transparent bg-transparent text-tinta-2 hover:bg-realce hover:text-tinta font-normal'),
  peligro: cn(BASE_BOTON, 'border border-transparent bg-peligro text-white hover:bg-peligro-hover px-3'),
  /** Boton de un solo icono (26 px). Siempre con aria-label. */
  icono: 'inline-flex items-center justify-center w-[26px] h-[26px] rounded-[6px] border-none bg-transparent text-tenue hover:text-tinta hover:bg-realce cursor-pointer transition-colors shrink-0',
};

/** Campo de texto de una linea. */
export const campo = 'h-[30px] w-full px-2.5 rounded-[6px] border border-linea-fuerte bg-campo text-sm text-tinta placeholder:text-tenue outline-none focus:border-acento transition-colors';

/** Boton de copiar con confirmacion: el icono pasa a un tilde dos segundos. */
export function BotonCopiar({ texto, rotulo, className }: { texto: string; rotulo: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      title={copiado ? 'Copiado' : rotulo}
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
      className={cn(boton.icono, 'w-[22px] h-[22px]', className)}
    >
      {copiado ? <Check className="w-3.5 h-3.5 text-acento" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Estructura de pantalla ──────────────────────────────────────────────────

/** Encabezado de pantalla: un solo titulo de 20 px, linea secundaria y
 *  acciones a la derecha. */
export function Encabezado({ titulo, detalle, acciones, insignia, className }: {
  titulo: React.ReactNode; detalle?: React.ReactNode; acciones?: React.ReactNode;
  insignia?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-5', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-tinta">{titulo}</h1>
          {insignia}
        </div>
        {detalle && <p className="mt-0.5 text-xs text-tenue">{detalle}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

/** Titulo de seccion dentro de una pantalla (15 px), con contador opcional. */
export function TituloSeccion({ children, cantidad, detalle, className }: {
  children: React.ReactNode; cantidad?: number; detalle?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('mt-7 mb-2', className)}>
      <h2 className="text-base font-semibold text-tinta">
        {children}
        {cantidad !== undefined && <span className="ml-1.5 font-normal text-tenue cifras">{cantidad}</span>}
      </h2>
      {detalle && <p className="text-xs text-tenue">{detalle}</p>}
    </div>
  );
}

/** Panel con borde: contenedor de tablas y listas. Sin sombra. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border border-linea rounded-[8px] bg-superficie overflow-hidden', className)}>{children}</div>;
}

/** Pestañas subrayadas (regiones, modos). */
export function Pestanas<T extends string>({ opciones, valor, onCambio, rotulo, className }: {
  opciones: Array<{ valor: T; rotulo: string; cantidad?: number }>;
  valor: T; onCambio: (v: T) => void; rotulo: string; className?: string;
}) {
  return (
    <div role="tablist" aria-label={rotulo} className={cn('flex flex-wrap gap-x-[22px] border-b border-linea', className)}>
      {opciones.map(o => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          aria-selected={o.valor === valor}
          onClick={() => onCambio(o.valor)}
          className={cn(
            'inline-flex items-center gap-1.5 pb-[9px] -mb-px border-b-2 bg-transparent text-sm whitespace-nowrap cursor-pointer transition-colors',
            o.valor === valor
              ? 'border-tinta text-tinta font-medium'
              : 'border-transparent text-tinta-2 hover:text-tinta',
          )}
        >
          {o.rotulo}
          {o.cantidad !== undefined && <span className="text-xs font-normal text-tenue cifras">{o.cantidad}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Carga, vacio y error ────────────────────────────────────────────────────

/** Filas esqueleto con la forma de la tabla que se esta cargando. */
export function FilasEsqueleto({ filas = 8, columnas }: { filas?: number; columnas: string }) {
  const anchos = ['w-14', 'w-16', 'w-28', 'w-20', 'w-8', 'w-24', 'w-24'];
  const n = columnas.trim().split(/\s+(?![^(]*\))/).length;
  return (
    <div aria-hidden="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="grid items-center gap-x-3 h-9 px-3.5 border-b border-linea-suave last:border-b-0" style={{ gridTemplateColumns: columnas }}>
          {Array.from({ length: n }, (_, j) => (
            <span key={j} className={cn('esqueleto h-2.5', anchos[j % anchos.length], j === n - 1 && 'justify-self-end')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Estado vacio: una linea dentro del panel, con una accion si hay algo que
 *  el usuario pueda hacer. */
export function Vacio({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-6 text-sm text-tenue">
      <span>{children}</span>
      {accion}
    </div>
  );
}

/** Banda de error con reintento. No reemplaza lo que ya estaba en pantalla. */
export function BandaError({ children, onReintentar, className }: {
  children: React.ReactNode; onReintentar?: () => void; className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 rounded-[6px] border border-error-linea bg-error-suave text-sm text-error', className)}>
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">{children}</span>
      {onReintentar && (
        <button type="button" onClick={onReintentar} className={cn(boton.secundario, 'h-[26px] text-xs')}>
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
