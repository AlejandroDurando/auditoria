// Autorizaciones requeridas en el PIMyS según código de gasto o sector solicitante.
// Fuente única de verdad: se usa tanto para el panel "Autorizaciones PIMyS"
// como para construir las reglas de V4 en el prompt de Gemini.

export interface AutorizacionPorZona {
  zona: string;
  alcance: string;
  firmante: string;
}

export interface AutorizacionCodigo {
  codigos: string[];
  concepto: string;
  tipo: 'fijo' | 'zona';
  /** Firmantes habilitados cuando tipo === 'fijo'. Si hay más de uno, basta con cualquiera. */
  firmantes?: string[];
  /** Firmantes por sucursal cuando tipo === 'zona' */
  zonas?: AutorizacionPorZona[];
  nota?: string;
}

export interface AutorizacionSector {
  sector: string;
  agentes: string[];
  jefes: string[];
}

/** Zonas / sucursales usadas para resolver el firmante según el origen del expediente. */
export const ZONAS_SUCURSAL: Record<string, string> = {
  Rafaela:
    'UT Adm Rafaela, Ag. Rafaela, Ag. Rafaela Norte, María Juana y toda la Sucursal Rafaela en general',
  Noroeste:
    'Suc. Noroeste, Ag. San Cristóbal, Ag. San Guillermo, Ag. Sunchales, Ag. Tostado y zona Noroeste en general',
  Oeste:
    'Suc. Oeste, Ag. El Trébol, Ag. Las Rosas, Ag. San Jorge y zona Oeste en general',
};

/** Autorizaciones disparadas por el código de gasto imputado en el PIMyS. */
export const AUTORIZACIONES_POR_CODIGO: AutorizacionCodigo[] = [
  {
    codigos: ['302', '310', '313', '314', '400', '401', '412', '415', '418'],
    concepto: 'Movilidades (alquileres, mano de obra y repuestos de vehículos y equipos)',
    tipo: 'fijo',
    firmantes: ['pimysmovrafaela@epe.santafe.gov.ar'],
    nota: 'La autorización llega por correo de Movilidades Rafaela y debe figurar adjunta al PIMyS.',
  },
  {
    codigos: ['202'],
    concepto: 'Adquisición de útiles, herramientas y equipos de trabajo',
    tipo: 'zona',
    zonas: [
      { zona: 'Rafaela', alcance: ZONAS_SUCURSAL.Rafaela, firmante: 'Cristian Berrino' },
      { zona: 'Noroeste', alcance: ZONAS_SUCURSAL.Noroeste, firmante: 'Franco Blonksi' },
      { zona: 'Oeste', alcance: ZONAS_SUCURSAL.Oeste, firmante: 'Juan Pascualetto' },
    ],
    nota: 'Además de la firma del Jefe de Sucursal, el expediente debe remitirse al área de Patrimonio para el alta del bien de uso.',
  },
  {
    codigos: ['226'],
    concepto:
      'Mantenimientos menores y esporádicos de motosierras, motoguadañas, tracto-segadoras y hormigoneras',
    tipo: 'zona',
    zonas: [
      { zona: 'Rafaela', alcance: ZONAS_SUCURSAL.Rafaela, firmante: 'Juan Chianalino' },
      { zona: 'Noroeste', alcance: ZONAS_SUCURSAL.Noroeste, firmante: 'Eduardo Argañaraz' },
      { zona: 'Oeste', alcance: ZONAS_SUCURSAL.Oeste, firmante: 'Leonardo Rostagno' },
    ],
    nota: 'Firma del Jefe Administrativo de la Sucursal de origen del expediente.',
  },
  {
    codigos: ['602'],
    concepto: 'Requiere autorización específica del responsable del área',
    tipo: 'fijo',
    firmantes: ['Sergio Cenci'],
  },
  {
    codigos: ['609'],
    concepto: 'Requiere autorización específica del responsable del área',
    tipo: 'fijo',
    firmantes: ['Sergio Cenci', 'Gustavo Fernández'],
    nota: 'Basta con la firma de cualquiera de los dos.',
  },
];

/**
 * Autorizaciones disparadas por el agente que figura como "Solicitante" del PIMyS.
 * Si el Solicitante es uno de los agentes listados, el PIMyS debe llevar la firma
 * del jefe autorizante correspondiente a ese sector.
 */
export const AUTORIZACIONES_POR_SECTOR: AutorizacionSector[] = [
  {
    sector: 'Capacitación',
    agentes: ['Julio Tascón'],
    jefes: ['Francisco Catinot'],
  },
  {
    sector: 'Ingeniería',
    agentes: ['Mario Alberto'],
    jefes: ['Carlos Curet'],
  },
  {
    sector: 'Higiene y Seguridad',
    agentes: ['Carlos Alvarez'],
    jefes: ['Andrés Blancato'],
  },
  {
    sector: 'Cómputos',
    agentes: ['Adrián Lapasin'],
    jefes: ['Hernán Cossu', 'Matías Fantin', 'Gustavo Fernández'],
  },
  {
    sector: 'Fraude (Fiscalización de Suministros)',
    agentes: ['Federico Perotti'],
    jefes: ['Germán Elias'],
  },
  {
    sector: 'Estación Transformadora (ET Rafaela Oeste y ET Rafaela Sur)',
    agentes: ['Sergio Juárez', 'Fabio Díaz'],
    jefes: ['Roberto Bosio'],
  },
  {
    sector: 'Compras Rafaela',
    agentes: ['Diego Cordero', 'Mauro Restelli'],
    jefes: ['Gustavo Alberdi'],
  },
];

/** Texto compacto de las reglas, embebido en el prompt de Gemini (validación V4). */
export function buildAuthorizationRulesForPrompt(): string {
  const porCodigo = AUTORIZACIONES_POR_CODIGO.map(a => {
    const cods = a.codigos.join(', ');
    if (a.tipo === 'fijo') {
      const firmantes = (a.firmantes || []).map(f => `"${f}"`).join(' o ');
      return `- Código(s) ${cods} (${a.concepto}): requiere SIEMPRE la autorización de ${firmantes}, sin importar la sucursal.${a.nota ? ` ${a.nota}` : ''}`;
    }
    const zonas = (a.zonas || [])
      .map(z => `${z.zona} (${z.alcance}) → "${z.firmante}"`)
      .join('; ');
    return `- Código(s) ${cods} (${a.concepto}): requiere la firma del jefe según la sucursal de origen del expediente: ${zonas}.${a.nota ? ` ${a.nota}` : ''}`;
  }).join('\n');

  const porSector = AUTORIZACIONES_POR_SECTOR.map(s => {
    const agentes = s.agentes.map(x => `"${x}"`).join(' o ');
    const jefes = s.jefes.map(x => `"${x}"`).join(' o ');
    return `- Sector ${s.sector}: si el Solicitante del PIMyS es ${agentes}, el PIMyS DEBE llevar la firma/autorización de ${jefes}.`;
  }).join('\n');

  return `AUTORIZACIONES OBLIGATORIAS SEGÚN CÓDIGO DE GASTO:
${porCodigo}

AUTORIZACIONES OBLIGATORIAS SEGÚN EL AGENTE SOLICITANTE DEL PIMyS:
El campo "Solicitante" figura en el encabezado del PIMyS (ej. "76352 - Olmedo Valeria Yanina"). Si ese Solicitante coincide con alguno de los agentes listados, verificá la firma del jefe autorizante de su sector:
${porSector}

Para CADA autorización que corresponda, indicá en las observaciones de V4 una línea con el formato exacto: "Control [Código NNN | Sector X]: Autorización de **[Nombre esperado]** - [Verificada/Falta]". Si falta alguna autorización requerida, V4 debe calificarse como 'fail' (o 'warning' si el documento no permite verificarlo) y explicitar cuál firma falta.`;
}
