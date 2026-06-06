export interface Responsable {
  nombre: string;
  legajo: string;
  dni: string;
  domicilio: string;
}

export interface FondoFijoReg {
  id: string; // Nro
  nombre: string;
  monto: number;
  anexo: string;
  reintegrables?: string;
  observaciones?: string;
  responsables: Responsable[];
}

export interface Articulo {
  numero: string;
  texto: string;
  destacado?: boolean;
  observaciones?: string;
}

export interface DisposicionDoc {
  id: string;
  titulo: string;
  subtitulo?: string;
  fecha: string;
  tipo: 'Administrativa' | 'Gerencia' | 'Finanzas';
  visto?: string;
  considerando?: string[];
  articulos: Articulo[];
}

export const DISPOSICIONES: DisposicionDoc[] = [
  {
    id: 'ga-004-2026',
    titulo: 'DISPOSICIÓN G.A. Nro. 004/2026',
    fecha: '09 de Febrero de 2026',
    tipo: 'Gerencia',
    visto: 'El Expte. Nro. 1-2026-1196482-EPE a través del cual se solicita el incremento del monto de contrataciones por modalidad de Fondos Fijos, y;',
    considerando: [
      'Que, a fs. 01, obra nota de la Sra. Jefa de la Unidad de Supervisión y Control de Normas y Procedimientos, con la conformidad del Área Finanzas, mediante la cual solicita la actualización, para el presente ejercicio, del monto máximo a erogar para las gestiones que se realicen bajo la modalidad de Fondos Fijos hasta la suma de $ 1.170.000,00 (Pesos un millón ciento setenta mil con 00/100), en concordancia con lo establecido por el Gobierno Provincial.',
      'Que, a fs. 2, consta la Circular particular N°01/2026 del Ministerio de Economía de la Provincia de Santa Fe.',
      'Que, a fs. 07, la Gerencia de Administración remite las presentes actuaciones a la Secretaría Administrativa, a fin de poner en conocimiento y consideración del Directorio la propuesta de marras. A fs. 7 vta. se encuentra la conformidad del Directorio para el dictado del Acto Administrativo.',
      'Que, en virtud de las facultades delegadas por la Resolución Nro. 139/2008 del Directorio de esta Empresa, esta Gerencia está autorizada a emitir Disposición.'
    ],
    articulos: [
      {
        numero: 'Art. 1',
        texto: 'Aumentar hasta la suma de $ 1.170.000,00 (Pesos un millón ciento setenta mil con 00/100) IVA incluido, el monto máximo a erogar para gestiones por Fondos Fijos.',
        destacado: true,
        observaciones: 'Modifica el límite general anterior de $ 900.000,00 fijado por la Disposición A.F. Nro. 70/2025.'
      },
      {
        numero: 'Art. 2',
        texto: 'La erogación que demande la atención de los Fondos Fijos durante el ejercicio 2026 deberá afectarse al Presupuesto 2026– Empresas del Estado – Jurisdicción 98 – Servicio 998 E.P.E. – Finalidad 4: Servicios Económicos – Fondos Permanentes y Cajas Chicas.',
        destacado: false
      },
      {
        numero: 'Art. 4',
        texto: 'Regístrese, comuníquese y archívese.',
        destacado: false
      }
    ]
  },
  {
    id: 'af-70-2025',
    titulo: 'DISPOSICIÓN A.F. Nro. 70/2025',
    subtitulo: 'DISPOSICIÓN A.A. Nro. 266/2025',
    fecha: '30 de Diciembre de 2025',
    tipo: 'Finanzas',
    visto: 'Marco normativo y organizativo para el funcionamiento y control de los Fondos Fijos para el periodo anual 2026.',
    considerando: [
      'Que es necesario establecer las pautas para la asignación de fondos fijos reintegrables y cajas de viáticos de las agencias, y oficinas de compras de las diferentes unidades territoriales.',
      'Que se debe regular el mecanismo de firmas conjuntas, límites individuales, arqueos, y control de situación en ARCA.'
    ],
    articulos: [
      {
        numero: 'Art. 1',
        texto: 'Disponer para el Ejercicio correspondiente la habilitación, apertura y reglamentación de funcionamiento de los Fondos Fijos, Cajas de Viáticos y Oficinas de Compras de la Empresa Provincial de la Energía, en un todo de acuerdo con las normativas provinciales y presupuestarias vigentes.',
        destacado: false,
        observaciones: 'Establece el marco de habilitación legal para la operatoria general.'
      },
      {
        numero: 'Art. 2',
        texto: 'Establecer la nómina oficial de agentes responsables, co-responsables y autorizados para operar, firmar cheques y ordenar transferencias contra las cuentas habilitadas de cada Fondo Fijo, cuyos montos de asignación y anexos autorizados se detallan en el cuerpo principal de la presente y anexos correspondientes.',
        destacado: true,
        observaciones: 'Solo los agentes nominados expresamente están facultados para firmar y operar.'
      },
      {
        numero: 'Art. 3',
        texto: 'Aprobar los Anexos I, II, III, IV, V, VI, VII, VIII, IX, que forman parte de la presente Disposición.',
        destacado: false
      },
      {
        numero: 'Art. 4',
        texto: 'El índice de rotación mensual fijado para el monto total asignado no deberá exceder de 1 (uno) calculándose en forma acumulada y se computará al momento de liquidar respectivamente.',
        destacado: false
      },
      {
        numero: 'Art. 5',
        texto: 'Quedan exceptuados a efectos del cómputo para el índice de rotación los siguientes conceptos:\n1) Viáticos, que deberán gestionarse y rendirse sólo a través del programa y por los fondos fijos habilitados a tal fin, cumpliendo con las normas y sistemas vigentes.\n2) Gastos de Combustible.\n3) Indemnizaciones a Terceros por daños.\n4) Pagos por reconocimiento a favor del usuario Prosumidor y/o Grupo Generadores.\n5) Devolución de sumas acreditadas en exceso por Bancos y otras bocas recaudadoras, Devoluciones a clientes por pago repetido errores de facturación, Devolución de depósitos en garantía y Sellados de Contratos de terceros a descontar de los pagos a efectuar.\n6) Códigos exclusivos para situaciones de emergencia: 940 y 950 según corresponda a materiales y/o servicios respectivamente.',
        destacado: false,
        observaciones: 'Lista detallada de conceptos exceptuados del control de rotación mensual.'
      },
      {
        numero: 'Art. 6',
        texto: 'Autorizar a las Áreas y dependencias citadas en el artículo 2º, como responsables de atender al reintegro de las rendiciones, a liquidar y reintegrar las sumas que correspondan, de acuerdo a las rendiciones de materiales adquiridos y servicios usufructuados y/o aplicados en el Ejercicio 2026, facturados en el mismo, sobre las que no se practiquen observaciones y que se presenten en tiempo y forma, durante el desarrollo del Ejercicio 2026.',
        destacado: false
      },
      {
        numero: 'Art. 7',
        texto: 'Montos autorizados, en todos los casos deberá considerarse por factura y con I.V.A. incluido:\n1. Todos los Fondos podrán efectuar pagos hasta un importe máximo de $ 900.000,00 (Actualizado a $ 1.170.000,00 por Disposición G.A. Nro. 004/2026).\n2. En el caso de Impuesto a los Débitos y Créditos Bancarios se autoriza la totalidad de los importes debitados por el Banco, debiendo los responsables del Fondo Fijo efectuar el control de la razonabilidad de los mismos.',
        destacado: true,
        observaciones: 'El monto límite individual por factura es de $ 1.170.000,00. Superar este importe anula el reintegro.'
      },
      {
        numero: 'Art. 8',
        texto: 'Los pagos de las erogaciones deberán realizarse mediante cheques emitidos con la cláusula "no a la orden" o transferencia bancaria y con la firma conjunta e indistinta de dos de los responsables designados en cada Fondo Fijo. En los casos en que los mismos superen los $ 1.000 deberán llevar cruzamiento general con el sello para acreditar en cuenta. Los agentes habilitados sólo podrán firmar cheques en forma conjunta con cualquiera de los restantes autorizados para operar con el Fondo Fijo pertinente y en toda otra operatoria y/o transacción con la Cuenta Corriente abierta para tal fin.',
        destacado: true,
        observaciones: 'Firma conjunta obligatoria (mínimo de 2 firmas habilitadas). Cheques superiores a $1.000 requieren cruzamiento.'
      },
      {
        numero: 'Art. 9',
        texto: 'En la rendición de los Fondos Fijos deberá constar por parte del Sector solicitante la debida recepción del material o servicio contratado, con aclaración de firma o sello y Nro. de Legajo del agente interviniente. Las oficinas revisoras no tramitarán los reintegros correspondientes ante la falta del requisito precedentemente citado, responsabilizándose éstos por la inobservancia de lo normado.',
        destacado: false,
        observaciones: 'Requisito formal ineludible de firma receptora/legajo.'
      },
      {
        numero: 'Art. 10',
        texto: 'Se prohíbe la utilización de la modalidad de adquisición de materiales o insumos por Fondo Fijo con destino a stock. En el formulario P.I.M. y S. y previo a la realización de la compra vía Fondo Fijo, el responsable del mismo deberá verificar si en Almacenes hay existencia del material solicitado, anexando reporte de stock (SAP).\nEn caso de existencia nula o insuficiente de los códigos indicados en anexo VIII y de evaluar que la forma más eficiente de compra es a través del Fondo Fijo, se eximirá exclusivamente para esos códigos la obligación de anexar el reporte de stock y a cambio se deberá dejar mención "SIN EXISTENCIA SUFICIENTE EN ALMACENES", refrendando el responsable del Fondo Fijo con su firma y sello. Ante emergencias, que implique la imposibilidad de cumplir con este requisito, deberá confeccionarse un informe donde se comunique la situación de dicha índole, suscripta por la Jefatura de Sucursal o Área respectiva.',
        destacado: true,
        observaciones: 'Prohibición estricta de stockeo. Obligación de adjuntar consulta SAP o leyenda "SIN EXISTENCIA SUFICIENTE...".'
      },
      {
        numero: 'Art. 11',
        texto: 'Los responsables que tengan a cargo el Fondo Fijo deberán efectuar la Rendición final de los mismos en el mes de Diciembre de cada año de acuerdo al Procedimiento a elaborar por Área Contaduría y que oportunamente se comunique, debiendo rendir todos los pagos realizados a dicha fecha, recibir la correspondiente reposición y luego efectuar la devolución final de la totalidad de los Fondos que le fueron asignados durante el ejercicio, con excepción de los Fondos Fijos 001 (Finanzas - Viáticos), 301 (Tesorería Rosario) y 141 (Tesorería Rafaela) quienes deberán efectuar la rendición final de los pagos realizados a través del mismo y la devolución del remanente.',
        destacado: false
      },
      {
        numero: 'Art. 12',
        texto: 'Se deberá cumplir indefectiblemente con el Procedimiento A.I. 145 y sus Anexos, Requerimientos para la contratación y locación de servicio con personal a cargo, con las Normas de Higiene y Seguridad para Contratación de Servicios y las Comunicaciones Impositivas vigentes, para estos casos el PIMyS deberá llevar un sello con la siguiente leyenda: CONFORME AL PROCEDIMIENTO A.I. 145. CUMPLE NORMAS DE H. Y SEGURIDAD.',
        destacado: false,
        observaciones: 'Obligación del sello e informe correspondiente a locaciones de servicio.'
      },
      {
        numero: 'Art. 13',
        texto: 'Todas las Cuentas Corrientes deberán ser abiertas en el Nuevo Banco de Santa Fe S.A.',
        destacado: false
      },
      {
        numero: 'Art. 14',
        texto: 'El presente Acto Administrativo deroga las Disposiciones A.F. Nro. 112 y A.A. 272 del 30 de Diciembre de 2024 y sus modificatorias, en lo que respecta a la nómina de responsables, por lo que quedan automáticamente desafectados todos los agentes que no estén nominados en el Artículo 2º de la Disposición de apertura de Fondos Fijos para 2026.',
        destacado: false
      },
      {
        numero: 'Art. 15',
        texto: 'A los fines de confeccionar la Disposición de Apertura de Fondos Fijos de cada año, en el cual se designa la nómina de responsables autorizados a operar en cada fondo, se requerirá a cada Fondo Fijo la presentación de un expediente donde se detalle nómina de los responsables solicitados con visto bueno de la Gerencia Respectiva. En tanto que para la solicitud de ampliaciones de montos o de nuevos códigos, será obligatoria la presentación de un expediente con visto bueno de la Gerencia.',
        destacado: false
      },
      {
        numero: 'Art. 16',
        texto: 'Queda PROHIBIDO efectuar erogaciones que no estén contempladas en los anexos que forman parte del presente acto administrativo. Es OBLIGATORIO consignar en el PIMyS en lugar bien visible el número de código que se utilizó para realizar la erogación.',
        destacado: true,
        observaciones: 'Prohibición de desvío de códigos. Obligatoriedad de rotulado del código en el PIMyS.'
      },
      {
        numero: 'Art. 17',
        texto: 'Los responsables del manejo de los Fondos Fijos deberán llevar el Libro de Banco conforme a las normativas exigidas por el Honorable Tribunal de Cuentas, esto es foliado, rubricado y actualizado.',
        destacado: false,
        observaciones: 'Mantener libro de banco en regla para el Tribunal de Cuentas.'
      },
      {
        numero: 'Art. 18',
        texto: 'A los responsables que tengan habilitados el código de gasto 400, deberán cumplimentar con la carga de datos en la Planilla que se adjunta como modelo en el ANEXO IX que forma parte integrante de la presente. En tanto que para la carga de los códigos de materiales o servicios del rubro Movilidades (excepto combustible), es obligatorio adjuntar la planilla generada a tal fin por sistema SAP.',
        destacado: false
      },
      {
        numero: 'Art. 19',
        texto: 'Los responsables de cada Fondo Fijo deberán guardar copia a disposición de Auditoría Interna, y remitir original a la Gerencia de Administración - Área Finanzas - Supervisión y Control de Normas y Procedimientos - Oficina revisora respectiva, del Arqueo de Fondos y Valores con la respectiva conciliación bancaria en forma TRIMESTRAL y al cierre de cada ejercicio anual o en ocasión de cambios de responsables según procedimiento vigente. La documentación mencionada deberá agregarse a la segunda rendición posterior a las fechas indicadas, caso contrario no se dará curso al reintegro.',
        destacado: true,
        observaciones: 'Presentación trimestral de Conciliación y Arqueo. El incumplimiento suspende los reintegros.'
      },
      {
        numero: 'Art. 20',
        texto: 'Se prorroga la vigencia de toda la documentación que fuera remitida oportunamente respecto de Fondos Fijos y las que a continuación se detallan:\n1. Disposición Nro. 097/99: Régimen para Gestión Interna de Compras.\n2. Disposición Nro. 118/01: Procedimiento Administrativo para carga de reparaciones, combustibles y servicios (ver inciso c).\n3. Disposición Nro. 076/03: Procedimiento de PIMyS.\n4. Disposición Nro. 083/03: Procedimiento Reintegro de Fondos Fijos. (**)\n5. Disposición Nro. 128/03: Procedimiento de PIMyS.\n6. Nota G.de A. Nro. 163/03 - Modalidad de pago para cumplir Ley Antievasión Nro. 25345 y Resolución AFIP Nro. 1547.\n7. Nota D.F.R. Nro. 002/06: Recomendaciones para gastos de publicidad.\n8. Nota D.F.R. Nro. 028/06: Requisitos para gastos agasajos y obsequios empresariales.\n9. Nota D.F.R. Nro. 036/07: Aclaración Art. 216 - Ley 12.510 - Cese y Cambio de responsables',
        destacado: false,
        observaciones: '(**) Aclaración Importante: para el Reintegro de Fondos Fijos, es necesaria la firma del Jefe de Área / Sucursal y/o Gerente respectivo en la Planilla de Rendición de Caja Chica y Balance de Inversión.'
      },
      {
        numero: 'Art. 21',
        texto: 'Se autoriza para todos los Fondos Fijos el uso del código 330 "Reintegro de gastos por pago de facturas de servicios públicos Uso exclusivo Proveedor Eventual con autorización de la Jefatura de Sucursal de la cual depende el inmueble al que corresponde el servicio, debiendo incorporarse copia del correspondiente contrato de locación como documento probatorio del gasto".',
        destacado: false
      },
      {
        numero: 'Art. 22',
        texto: 'La erogación que demande la atención de los Fondos Fijos durante el ejercicio 2026 deberá afectarse al Presupuesto 2026 – Empresas del Estado – Jurisdicción 98 – Servicio 998 E.P.E. – Finalidad 4: Servicios Económicos – Fondos Permanentes y Cajas Chicas.',
        destacado: false
      },
      {
        numero: 'Art. 23',
        texto: 'Regístrese, comuníquese y archívese.',
        destacado: false
      }
    ]
  }
];

export const FONDOS_FIJOS_DATA: FondoFijoReg[] = [
  {
    id: '3140',
    nombre: 'Oficina de Compras Rafaela',
    monto: 2700000,
    anexo: 'ANEXO II - 2 & ANEXO III - 3',
    reintegrables: '7028/03 - 33005209 15200007028038',
    observaciones: 'Para gestiones exclusivas de Área Control de Pérdidas- UT Coor y Asist Técnica, se podrá utilizar como máximo un monto de $ 600.000 (ANEXO III - 3).',
    responsables: [
      { nombre: 'Cordero, Diego', legajo: '71734', dni: 'DNI 26.609.648', domicilio: 'J.P.López 1460 – Rafaela' },
      { nombre: 'Dalmazzo, Rodrigo', legajo: '65942', dni: 'DNI 31.364.983', domicilio: 'Maipú 635 – Rafaela' },
      { nombre: 'Pereyra Monica S.', legajo: '74619', dni: 'DNI 28.322.580', domicilio: 'Dr. Zavalla 10355 – Santa Fe' },
      { nombre: 'Pastore, Emiliano', legajo: '83384', dni: 'DNI 33.212.816', domicilio: '26 de enero 489 – Rafaela' },
      { nombre: 'Rastelli, Mauro', legajo: '83774', dni: 'DNI 35.953.623', domicilio: 'Hna. Fortunatta 33- Rafaela' }
    ]
  },
  {
    id: '141',
    nombre: 'Tesorería Rafaela (Viáticos)',
    monto: 10000000,
    anexo: 'ANEXO II - 1',
    reintegrables: 'Viáticos - 6379/01 - 33005209 15200006379014',
    responsables: [
      { nombre: 'Lopez, Mauro Nicolas', legajo: '69656', dni: 'DNI 31.473.924', domicilio: 'Av. Límite Municipio S/N- Barrio Club Logarítmico Lote 34 Unidades 6- Ibarlucea' },
      { nombre: 'Andreucci Michelot, Mariana', legajo: '62134', dni: 'DNI 22.715.739', domicilio: 'Las Colonias 451 – Rafaela' },
      { nombre: 'Ropolo Federico Osvaldo', legajo: '66628', dni: 'DNI 29.348.316', domicilio: 'Laprida 2058- Santo Tomé' },
      { nombre: 'Giorgetti, María Alejandra', legajo: '64171', dni: 'DNI 25.398.153', domicilio: 'Sigmaringendorf 1288 - Rafaela' },
      { nombre: 'Juarez, Micaela A.', legajo: '83776', dni: 'DNI 39.123.608', domicilio: 'Cacciolo 1060 - Rafaela' },
      { nombre: 'Durando Alejandro', legajo: '71564', dni: 'DNI 34.935.138', domicilio: "O'Higgins 687- Rafaela" },
      { nombre: 'Tomasini Daiana', legajo: '76718', dni: 'DNI 36.216.600', domicilio: 'E. Chiarella 929- Rafaela' },
      { nombre: 'Zulato, Melisa', legajo: '70550', dni: 'DNI 28.771.977', domicilio: 'Rodríguez 161 – Rosario' }
    ]
  },
  {
    id: '3143',
    nombre: 'Unidad Movilidades Rafaela',
    monto: 25000000,
    anexo: 'ANEXO II - 4',
    reintegrables: '7026/07 – 33005209 15200007026070',
    responsables: [
      { nombre: 'Ternengo, Carlos M.', legajo: '62024', dni: 'DNI 21.691.810', domicilio: 'Sargento Cabral 1757 – Rafaela' },
      { nombre: 'Cherubini, Enrique A.', legajo: '62677', dni: 'DNI 25.098.876', domicilio: 'Joaquin Dopazzo 598 – Rafaela' },
      { nombre: 'Alessio, Enrique Alberto', legajo: '62701', dni: 'DNI 23.801.112', domicilio: 'Las Calandrias – Bella Italia' },
      { nombre: 'Mansilla, Alejandro', legajo: '66021', dni: 'DNI 23.538.042', domicilio: 'Av. Italia 740 Dpto. 2 – Rafaela' },
      { nombre: 'Cipollatti, Mariano Jesús', legajo: '66666', dni: 'DNI 27.447.575', domicilio: 'R. Saenz Peña 1391 –Sunchales' }
    ]
  },
  {
    id: '3142',
    nombre: 'Sucursal Rafaela',
    monto: 10000000,
    anexo: 'ANEXO III - 2',
    reintegrables: '7097/06 - 33005209 15200007097063',
    responsables: [
      { nombre: 'Berrino Cristian Hugo', legajo: '62969', dni: '23.086.046', domicilio: 'Los Tilos 3169- Rafaela' },
      { nombre: 'Besarez, Abigail', legajo: '82772', dni: '31.851.844', domicilio: 'P. Soldano 1683 – Rafaela' },
      { nombre: 'Hartmann, Mauricio Luis', legajo: '62921', dni: '25.196.422', domicilio: 'Sargento Cabral 1920 – Rafaela' },
      { nombre: 'Latino Gustavo', legajo: '62158', dni: '24.411.791', domicilio: 'Mahatma Gandhi 440- Rafaela' },
      { nombre: 'Díaz, Lucila', legajo: '83383', dni: '39.755.331', domicilio: 'Las Colonias 465- Rafaela' },
      { nombre: 'Chianalino, Juan J.', legajo: '81797', dni: '34.673.955', domicilio: 'J.P. López 1658 – Rafaela' }
    ]
  },
  {
    id: '3145',
    nombre: 'Agencia Maria Juana',
    monto: 3500000,
    anexo: 'ANEXO III - 1',
    reintegrables: '903/10 – 33005308 1530000903102',
    responsables: [
      { nombre: 'Godoy, Mauricio Andrés', legajo: '62103', dni: 'DNI 22.886.744', domicilio: 'Córdoba 231 – María Juana' },
      { nombre: 'Finello, Mario Hugo', legajo: '57968', dni: 'DNI 20.144.970', domicilio: 'Padre Calleri 178 – María Juana' },
      { nombre: 'Aimino, Maximiliano', legajo: '62771', dni: 'DNI 24.349.323', domicilio: 'General López 724' },
      { nombre: 'Rosso, Facundo Miguel', legajo: '83269', dni: 'DNI 39.658.733', domicilio: 'Padre Calleri 178' },
      { nombre: 'Priotti, Maria Emilia', legajo: '83276', dni: 'DNI 35.063.543', domicilio: 'San Luis 462' },
      { nombre: 'Cernotti, Claudio Pablo', legajo: '58003', dni: 'DNI 22.642.972', domicilio: 'Laprida 307 – María Juana' }
    ]
  },
  {
    id: '3150',
    nombre: 'Agencia Rafaela',
    monto: 6000000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'Cuenta Corriente Pesos - 113887/04 – 3300520915200113887042',
    responsables: [
      { nombre: 'Cabrera, Gastón L.', legajo: '66075', dni: 'DNI 33.722.618', domicilio: 'Larrea 2513 – Rafaela' },
      { nombre: 'Dho, Nicolás', legajo: '78223', dni: 'DNI 36.887.128', domicilio: 'Oyoli 874 dpto 3 – Rafaela' },
      { nombre: 'Durán, Franco', legajo: '82965', dni: 'DNI 37.797.951', domicilio: 'Cachero 810 – Rafaela' },
      { nombre: 'Juaréz, Santiago', legajo: '83375', dni: 'DNI 41.905.020', domicilio: 'J. Newbery 640 - Rafaela' },
      { nombre: 'Salzqueber, Sebastián', legajo: '82972', dni: 'DNI 30.167.149', domicilio: '12 de Octubre 1049 – Rafaela' },
      { nombre: 'Sabellotti, Antonio', legajo: '79986', dni: 'DNI 35.953.780', domicilio: 'Santos Vega 417 - Rafaela' },
      { nombre: 'Fassanelli, Luisina', legajo: '84330', dni: 'DNI 37.452.073', domicilio: 'Las Heras 306- Rafaela' }
    ]
  },
  {
    id: '3144',
    nombre: 'Sucursal Noroeste (Ceres)',
    monto: 6000000,
    anexo: 'ANEXO III - 1 & 2',
    reintegrables: '2920/10 – 33005148 15140002920103',
    responsables: [
      { nombre: 'Alisiardi, Gerardo', legajo: '72780', dni: 'DNI 31.831.760', domicilio: 'Alem 534 – Ceres' },
      { nombre: 'Guirado, Facundo', legajo: '79392', dni: 'DNI 37.017.329', domicilio: 'G. Aldao 435 – Ceres' },
      { nombre: 'Guirado, Franco', legajo: '73118', dni: 'DNI 34.433.447', domicilio: 'Teodoro Hertz 47- Ceres' },
      { nombre: 'Argañaraz, Eduardo Antonio', legajo: '57845', dni: 'DNI 22.817.375', domicilio: 'Alvar 679 – Sunchales' },
      { nombre: 'Blonski, Franco Benjamín', legajo: '63133', dni: 'DNI 25.077.083', domicilio: 'Rondeau 360-Ceres' }
    ]
  },
  {
    id: '3146',
    nombre: 'Agencia San Guillermo',
    monto: 5850000,
    anexo: 'ANEXO III - 1',
    reintegrables: '1430/03 – 33005407 15400001430035',
    responsables: [
      { nombre: 'Astudillo, Manuel A.', legajo: '68781', dni: 'DNI 26.712.655', domicilio: 'Rivadavia 136 – San Guillermo' },
      { nombre: 'Luna Emanuel Roman', legajo: '82769', dni: 'DNI 37.266.034', domicilio: 'Catamarca 388- San Guillermo' },
      { nombre: 'Diaz, Estefanía', legajo: '82866', dni: 'DNI 35.883.211', domicilio: 'Jujuy 435 – San Guillermo' },
      { nombre: 'Luna, Ezequiel Federico', legajo: '81218', dni: 'DNI 37.300.411', domicilio: 'Antártida Arg 255 - San Guillermo' }
    ]
  },
  {
    id: '3147',
    nombre: 'Agencia San Cristóbal',
    monto: 3000000,
    anexo: 'ANEXO III - 1',
    reintegrables: '2433/03 – 33005391 15390002433031',
    responsables: [
      { nombre: 'Godoy, Claudio Sebastián', legajo: '71001', dni: 'DNI 32.430.269', domicilio: 'Ituzaingo 516 – San Cristobal' },
      { nombre: 'Langhi, Waldemar L.', legajo: '65911', dni: 'DNI 24.410.384', domicilio: 'Belgrano 624 – San Cristóbal' },
      { nombre: 'Arta, Jorge Luis', legajo: '82656', dni: 'DNI 30.351.044', domicilio: 'Pueyrredon 988 – San Cristóbal' },
      { nombre: 'Mascotto, Ana Laura', legajo: '74415', dni: 'DNI 27.237.273', domicilio: 'Ituzaingo 336 - San Cristóbal' },
      { nombre: 'Marquez, Ezequiel Omar', legajo: '68406', dni: 'DNI 33.128.570', domicilio: 'Gral Alvear 1380, San Cristobal' }
    ]
  },
  {
    id: '3148',
    nombre: 'Agencia Tostado',
    monto: 5200000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'E. P. E. Gastos de Explotación - 2396/02 - 33005544 15540002396023',
    responsables: [
      { nombre: 'Acosta, Elvia', legajo: '58647', dni: 'DNI 23.803.437', domicilio: 'Santo Domingo 630 – Tostado' },
      { nombre: 'Melo, Diego M.', legajo: '65519', dni: 'DNI 25.403.872', domicilio: 'Mitre 1200 – Tostado' },
      { nombre: 'Roldán, Emanuel', legajo: '74423', dni: 'DNI 30.468.610', domicilio: 'Eva Perón 575 – Tostado' },
      { nombre: 'Moreno, Juan Manuel', legajo: '70437', dni: 'DNI 28.855.334', domicilio: 'Ruta Nº2 -980 -Tostado' }
    ]
  },
  {
    id: '3149',
    nombre: 'Agencia Sunchales',
    monto: 1620000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'Cuenta Corriente Pesos – 24122/02 – 33005537 155300024122025',
    responsables: [
      { nombre: 'Cipolatti, Darío Marcelo', legajo: '70746', dni: 'DNI 29.294.820', domicilio: 'Suipacha 385- Sunchales' },
      { nombre: 'Durando, Facundo', legajo: '82191', dni: 'DNI 36.602.022', domicilio: 'Alfredo Palacios 735 – Sunchales' },
      { nombre: 'Cabral, David', legajo: '70754', dni: 'DNI 30.167.150', domicilio: 'Rep. Argentina 243 - Sunchales' },
      { nombre: 'Vezzoni, Cristian A.', legajo: '73126', dni: 'DNI 27.447.550', domicilio: 'J.J. Paso 174 – Sunchales' },
      { nombre: 'Avalos, Alejandrina I.', legajo: '71831', dni: 'DNI 27.237.196', domicilio: 'A. Miretti 1332 – Sunchales' },
      { nombre: 'Arzuffi, Matías R.', legajo: '82206', dni: 'DNI 29.579.844', domicilio: 'J.J.Paso 170 – Sunchales' },
      { nombre: 'Pino, Claudio', legajo: '65492', dni: 'DNI 30.640.706', domicilio: 'Hernandez 1851- Sunchales' }
    ]
  },
  {
    id: '3030',
    nombre: 'Sucursal Oeste',
    monto: 12000000,
    anexo: 'ANEXO III - 2',
    reintegrables: 'Empresa Provincial de la Energía - 5452/02 - 33000235 10230005452028',
    responsables: [
      { nombre: 'Pascualetto, Juan Manuel', legajo: '59407', dni: 'DNI 22.438.423', domicilio: 'Ballesteros 1557 –Cda. De Gomez.' },
      { nombre: 'Olmedo, Valeria Yanina', legajo: '76352', dni: 'DNI 26.349.314', domicilio: 'Bolivar 521- Cda. De Gomez.' },
      { nombre: 'Biasutti, Leonel S.', legajo: '65461', dni: 'DNI 27.854.977', domicilio: 'Mitre 240 5º Piso- Cda. de Gómez' },
      { nombre: 'Mazzer, Verónica', legajo: '59423', dni: 'DNI 23.799.813', domicilio: 'Ecuador 1792– Cda.de Gómez' },
      { nombre: 'Rostagno, Leonardo', legajo: '72277', dni: 'DNI 28.759.690', domicilio: 'Castellanos 853- Armstrong' }
    ]
  },
  {
    id: '3032',
    nombre: 'Agencia El Trebol',
    monto: 6000000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'Empresa Provincial de la Energía - 1379/07 - 33005179 15170001379071',
    responsables: [
      { nombre: 'Solari, Hernan', legajo: '78728', dni: 'DNI 28.255.616', domicilio: 'Italia 406 – El Trébol' },
      { nombre: 'Pietrani, Melina', legajo: '78582', dni: 'DNI 30.270.525', domicilio: 'Las Heras 957 – El Trébol' },
      { nombre: 'Lisey, Vanesa', legajo: '82248', dni: 'DNI 31.384.517', domicilio: 'Entre Ríos 232– El Trébol' },
      { nombre: 'Diaz, Emanuel', legajo: '74203', dni: 'DNI 31.384.577', domicilio: 'Malv. Argentinas 357 – El Trébol' },
      { nombre: 'Fernandez, José N.', legajo: '70893', dni: 'DNI 30.802.842', domicilio: 'Av. Libertad 1107 – El Trébol' }
    ]
  },
  {
    id: '3033',
    nombre: 'Agencia Las Rosas',
    monto: 4500000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'EPE Gastos de Explotación Fondo Fijo - 3985/04 - 33000273 10270003985047',
    responsables: [
      { nombre: 'Rocha, Oscar S.', legajo: '45458', dni: 'DNI 16.645.778', domicilio: 'P. de los Andes 1557 – Las Rosas' },
      { nombre: 'Pablo, Mariana Dalila', legajo: '84202', dni: 'DNI 41.638.486', domicilio: 'Av. Las Rosas 1044 – Las Rosas' },
      { nombre: 'Bertino, Jorge Daniel', legajo: '58621', dni: 'DNI 22.727.916', domicilio: 'Tucumán 626 – Las Rosas' },
      { nombre: 'Malier, Diego A.', legajo: '72146', dni: 'DNI 27.889.493', domicilio: 'Ituzaingó 567 – Las Rosas' }
    ]
  },
  {
    id: '3034',
    nombre: 'Agencia San Jorge',
    monto: 4000000,
    anexo: 'ANEXO III - 1',
    reintegrables: 'Cuenta Corriente Oficiales Pesos - 2233/05 - 33005445 15440002233059',
    responsables: [
      { nombre: 'Montenegro, Virginia', legajo: '83483', dni: 'DNI 38.818.507', domicilio: 'Tucumán 1459 – San Jorge' },
      { nombre: 'Bravin, Mariano A.', legajo: '65409', dni: 'DNI 28.135.529', domicilio: 'H. Irigoyen 463 – San Jorge' },
      { nombre: 'Battistelli, Jessica Noelia', legajo: '83482', dni: 'DNI 31.038.989', domicilio: 'Nottebohonn 1976 -San Jorge' },
      { nombre: 'Gómez, Eliana R.', legajo: '77772', dni: 'DNI 36.796.432', domicilio: 'S Cabral 557 –San Jorge' }
    ]
  },
  {
    id: '3151',
    nombre: 'Agencia Rafaela Norte',
    monto: 3000000,
    anexo: 'ANEXO III - Apartado 1 (Mensual)',
    reintegrables: 'Fondo Fijo Nº 3151 – 77125/10 – 33000990 10990077125102',
    responsables: [
      { nombre: 'Berrino, Cristian Hugo', legajo: '62969', dni: 'DNI 23.086.046', domicilio: 'Los Tilos 3169 - Rafaela' },
      { nombre: 'Re, Mauro Sebastián', legajo: '82692', dni: 'DNI 35.150.361', domicilio: 'Italia 340- Humberto Primo' },
      { nombre: 'Berga, Lorena Paola', legajo: '83040', dni: 'DNI 31.364.737', domicilio: 'Av. Belgrano 169-Humberto Primo' },
      { nombre: 'Bonino, Guillermo Gustavo', legajo: '77188', dni: 'DNI 36.152.582', domicilio: 'Samyn 304- Humberto Primo' }
    ]
  }
];
