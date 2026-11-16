import React from 'react';

// Negrita en el dato que hay que mirar para controlar cada validacion: las
// fechas en V1, el adjudicado en V2, el importe en V6 y V10, el numero de
// factura en V7 y el CUIT en V8. Solo esos datos: el resto del texto queda
// igual. Es presentacion: no cambia lo que dice la observacion.

const FECHA = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
const IMPORTE = /\$\s?\d[\d.]*(?:,\d{1,2})?/;
const FACTURA = /\b\d{4,5}\s?-\s?\d{6,8}\b|\b\d{4,5}[A-Z]\d{6,8}\b/;
const CUIT = /\b\d{2}-\d{8}-\d\b/g;
// 'Adjudicado a la menor cotizacion: BBM DISTRIBUIDORA S. A. S. $912.638,86'
const ADJUDICADO = /adjudicad[oa][^:]{0,40}:\s*(.{2,80}?\$\s?\d[\d.]*(?:,\d{1,2})?)/i;

type Tramo = [number, number];

const todas = (texto: string, patron: RegExp): Tramo[] =>
  [...texto.matchAll(patron)].map(m => [m.index!, m.index! + m[0].length]);

const primera = (texto: string, patron: RegExp): Tramo[] => {
  const m = patron.exec(texto);
  return m ? [[m.index, m.index + m[0].length]] : [];
};

function tramosDe(id: string, texto: string): Tramo[] {
  switch (id.toUpperCase()) {
    case 'V1': return todas(texto, FECHA);
    case 'V2': {
      const m = ADJUDICADO.exec(texto);
      if (!m) return [];
      const desde = m.index + m[0].length - m[1].length;
      return [[desde, desde + m[1].length]];
    }
    case 'V6': return primera(texto, IMPORTE);
    case 'V7': return primera(texto, FACTURA);
    case 'V8': return todas(texto, CUIT);
    case 'V9': return todas(texto, FECHA);
    case 'V10': return primera(texto, IMPORTE);
    default: return [];
  }
}

/** El texto de una observacion con sus datos clave en negrita y los saltos
 *  de linea respetados. */
export function destacarDatos(id: string, texto: string): React.ReactNode {
  const tramos = tramosDe(id, texto);
  const partes: React.ReactNode[] = [];
  const empujar = (trozo: string, fuerte: boolean, clave: string) => {
    trozo.split('\n').forEach((linea, i) => {
      if (i > 0) partes.push(<br key={`${clave}-br${i}`} />);
      if (!linea) return;
      partes.push(fuerte
        ? <strong key={`${clave}-${i}`} className="font-semibold text-tinta">{linea}</strong>
        : <React.Fragment key={`${clave}-${i}`}>{linea}</React.Fragment>);
    });
  };
  let desde = 0;
  tramos.forEach(([a, b], n) => {
    if (a < desde) return;
    if (a > desde) empujar(texto.slice(desde, a), false, `t${n}`);
    empujar(texto.slice(a, b), true, `f${n}`);
    desde = b;
  });
  if (desde < texto.length) empujar(texto.slice(desde), false, 'fin');
  return partes;
}
