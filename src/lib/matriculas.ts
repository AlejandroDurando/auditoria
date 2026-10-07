// Catálogo de matrículas de materiales de SAP para el Matriculador. Lo arma el
// lector de expedientes (matriculas.py) desde el Excel de la página interna de
// la EPE y lo sube a R2; la API lo devuelve con la clave de acceso. La regla de
// activo fijo (clase de AFIJO entre 2210 y 2320) se aplica allá: acá se lee
// 'activo_fijo' tal cual viene.

export interface Material {
  matricula: string;
  descripcion: string;
  grupo: string | null;
  unidad: string | null;
  categoria: string | null;
  clase: number | null;
  /** null: el material no trae clase de AFIJO legible. */
  activo_fijo: boolean | null;
}

export interface CatalogoMatriculas {
  generado: string;
  fuente?: string;
  regla?: string;
  grupos: Record<string, string>;
  materiales: Material[];
}

const palabras = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9ñ]+/).filter(Boolean);

/** El token es el comienzo de una palabra ('vent' en 'ventilador'), o una
 *  palabra de 4 letras o más es el comienzo del token: abreviaturas de SAP y
 *  plurales ('herr' por 'herramientas', 'ventilador' por 'ventiladores'). */
const coincide = (token: string, ps: string[]) =>
  ps.some(p => p.startsWith(token) || (p.length >= 4 && token.startsWith(p)));

/** Materiales con todas las palabras de la consulta (o cuya matrícula empieza
 *  con ella): primero la matrícula exacta, después los que empiezan con lo
 *  buscado y, dentro de cada grupo, por número de matrícula. Misma regla que
 *  matriculas.buscar() del lector. */
export function buscarMateriales(catalogo: CatalogoMatriculas, consulta: string, limite = 50): { materiales: Material[]; total: number } {
  const tokens = palabras(consulta);
  if (!tokens.length) return { materiales: [], total: 0 };
  const texto = tokens.join(' ');
  const encontrados: { orden: number; numero: number; m: Material }[] = [];
  for (const m of catalogo.materiales) {
    const ps = palabras(m.descripcion);
    if (!tokens.every(t => m.matricula.startsWith(t) || coincide(t, ps))) continue;
    const orden = m.matricula === texto ? 0
      : m.matricula.startsWith(tokens[0]) ? 1
      : ps.join(' ').startsWith(texto) ? 2
      : ps.length && coincide(tokens[0], ps.slice(0, 1)) ? 3
      : 4;
    encontrados.push({ orden, numero: Number(m.matricula) || 0, m });
  }
  encontrados.sort((a, b) => a.orden - b.orden || a.numero - b.numero);
  return { materiales: encontrados.slice(0, limite).map(x => x.m), total: encontrados.length };
}
