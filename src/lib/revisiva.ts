// Planilla "Informe Revisiva Practicada" en PDF. La usan la pestaña Planilla
// Revisiva del auditor y la vista Expedientes del lector.
import { jsPDF } from 'jspdf';
import { EPE_LOGO_BASE64 } from './epe-logo';

export const SECTOR_MAPPING: Record<string, { label: string; responsible: string }[]> = {
  RAFAELA: [
    { label: "Compras", responsible: "D. Cordero" },
    { label: "Movilidades", responsible: "C. Ternengo" },
    { label: "U.T. Adm Rafaela", responsible: "J. Chianalino" },
    { label: "Ag. Rafaela", responsible: "G. Cabrera" },
    { label: "Ag. Maria Juana", responsible: "C. Cernotti" },
    { label: "Ag. Norte", responsible: "M. Re" },
    { label: "Viáticos Rafaela", responsible: "A. Giorgetti" }
  ],
  NOROESTE: [
    { label: "Suc Noroeste (Ceres)", responsible: "E. Argañaraz" },
    { label: "Ag. San Guillermo", responsible: "M. Astudillo" },
    { label: "Ag. San Cristobal", responsible: "J. Arta" },
    { label: "Ag. Tostado", responsible: "E. Roldan" },
    { label: "Ag. Sunchales", responsible: "D. Cipolatti" }
  ],
  OESTE: [
    { label: "Suc Oeste (Cañada de Gómez)", responsible: "L. Biasutti" },
    { label: "Ag. El Trebol", responsible: "M. Pietrani" },
    { label: "Ag. Las Rosas", responsible: "D. Malier" },
    { label: "Ag. San Jorge", responsible: "M. Bravin" }
  ]
};

export interface DatosRevisiva {
  responsable: string;
  fondoFijo: string;
  reparticion: string;
  gciaSuc: string;
}

export function descargarRevisiva(datos: DatosRevisiva, nombreArchivo = 'revisiva.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const drawPdfCheckmark = (x: number, y: number) => {
    doc.setDrawColor(0, 110, 86);
    doc.setLineWidth(0.45);
    doc.line(x - 1.5, y + 0.2, x - 0.3, y + 1.4);
    doc.line(x - 0.3, y + 1.4, x + 1.8, y - 1.2);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
  };

  // Standard Helvetica
  doc.setFont('helvetica', 'normal');

  // Outer border for the header box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(15, 12, 180, 21); // x=15 to 195, height 21 (from y=12 to 33)
  doc.line(55, 12, 55, 33); // divider vertical at x=55

  // Draw EPE Logo in left cell (x=15 to x=55, y=12 to y=33) using Base64 uploaded by the user
  doc.addImage(EPE_LOGO_BASE64, 'PNG', 16, 13.5, 38, 18);

  // Right cell text: "Empresa Provincial de la Energía de Santa Fe"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Empresa Provincial de la Energía de Santa Fe', 59, 22.5);

  // Title: INFORME REVISIVA PRACTICADA
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME  REVISIVA  PRACTICADA:', 15, 41);
  // single line underline
  doc.setLineWidth(0.35);
  doc.line(15, 42.5, 115, 42.5);

  // Metadata table: RESPONSABLE | FDO.FIJO NRO. | REPARTICION | GCIA./SUC.
  doc.rect(15, 47, 180, 14); // height 14 (from y=47 to 61)
  doc.line(15, 53, 195, 53); // horizontal row divider at y=53

  // Column vertical lines
  doc.line(65, 47, 65, 61);
  doc.line(90, 47, 90, 61);
  doc.line(145, 47, 145, 61);

  // Headers
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('RESPONSABLE', (15 + 65)/2, 51.5, { align: 'center' });
  doc.text('FDO.FIJO NRO.', (65 + 90)/2, 51.5, { align: 'center' });
  doc.text('REPARTICION', (90 + 145)/2, 51.5, { align: 'center' });
  doc.text('GCIA./SUC.', (145 + 195)/2, 51.5, { align: 'center' });

  // Values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(datos.responsable || '', (15 + 65)/2, 58, { align: 'center', maxWidth: 47 });
  doc.text(datos.fondoFijo || '', (65 + 90)/2, 58, { align: 'center', maxWidth: 22 });
  doc.text(datos.reparticion || '', (90 + 145)/2, 58, { align: 'center', maxWidth: 52 });
  doc.text(datos.gciaSuc || '', (145 + 195)/2, 58, { align: 'center', maxWidth: 47 });

  // REVISION DE CUENTAS heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('REVISION DE CUENTAS:', 15, 68);
  doc.line(15, 69.5, 57, 69.5);

  // Subheading 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1-Requisitos legales y formales que deben cumplirse en las Rendiciones de Cuentas', 15, 74);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Capítulo II – Resol.008/06 – T.C.P.', 15, 78);

  // Table 1 (4 rows, starts at y = 81)
  doc.setLineWidth(0.3);
  doc.rect(15, 81, 180, 28);
  doc.line(15, 88, 195, 88);
  doc.line(15, 95, 195, 95);
  doc.line(15, 102, 195, 102);

  doc.line(105, 81, 105, 109); // center split
  doc.line(91, 81, 91, 109); // left checkbox layout
  doc.line(181, 81, 181, 109); // right checkbox layout

  doc.setFontSize(8);

  // Table 1 Rows - Left Column
  doc.text('Documentación Legítima', 17, 85.5);
  drawPdfCheckmark(98, 85);

  doc.setFont('helvetica', 'normal');
  doc.text('Completados de manera indeleble', 17, 92.5);
  drawPdfCheckmark(98, 92);

  doc.setFont('helvetica', 'normal');
  doc.text('Totalidad de los antecedentes', 17, 99.5);
  drawPdfCheckmark(98, 99);

  doc.setFont('helvetica', 'normal');
  doc.text('Tachaduras o enmiendas no salvadas', 17, 106.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NO', 98, 106.5, { align: 'center' });

  // Table 1 Rows - Right Column
  doc.setFont('helvetica', 'normal');
  doc.text('Lugar y Fecha de Emisión', 107, 85.5);
  drawPdfCheckmark(188, 85);

  doc.setFont('helvetica', 'normal');
  doc.text('Organismo Adquirente', 107, 92.5);
  drawPdfCheckmark(188, 92);

  doc.setFont('helvetica', 'normal');
  doc.text('Concepto', 107, 99.5);
  drawPdfCheckmark(188, 99);

  doc.setFont('helvetica', 'normal');
  doc.text('Importe Total en letras y N°', 107, 106.5);
  drawPdfCheckmark(188, 106);

  // Table 2 (2 Rows, starts at y = 113)
  doc.rect(15, 113, 180, 20);
  doc.line(15, 123, 195, 123);
  doc.line(105, 113, 105, 133);

  doc.setFont('helvetica', 'normal');
  doc.text('Expresan el carácter provisorio de la', 17, 117.5);
  doc.text('documentación', 17, 121.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NO', 150, 119.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text('Cumplen con las normas impositivas y', 17, 127.5);
  doc.text('previsionales', 17, 131.5);
  drawPdfCheckmark(150, 129);

  // Table 3 (1 Row, starts at y = 137)
  doc.rect(15, 137, 180, 11);
  doc.line(105, 137, 105, 148);

  doc.setFont('helvetica', 'normal');
  doc.text('Justificación del pago (Firma aclaración y Nro.', 17, 141.5);
  doc.text('de Doc. en Fact./Recibo definitivo)', 17, 145.5);
  drawPdfCheckmark(150, 143.5);

  // Section 2: y starts at 152
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2 – Capítulo I – Resolución 008/06 T.C.P.', 15, 155);

  // Table 4 (2 rows, starts at y = 157)
  doc.setLineWidth(0.3);
  doc.rect(15, 157, 180, 14);
  doc.line(15, 164, 195, 164);
  doc.line(105, 157, 105, 171);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Presentados en término', 17, 161.5);
  drawPdfCheckmark(150, 161);

  doc.setFont('helvetica', 'normal');
  doc.text('Corresponden las fechas', 17, 168.5);
  drawPdfCheckmark(150, 168);

  // Section 3: y starts at 175
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('3 – Capítulo IV – Resolución 008/06 T.C.P.', 15, 178);

  // Table 5 (3 rows, starts at y = 180)
  doc.rect(15, 180, 180, 21);
  doc.line(15, 187, 195, 187);
  doc.line(15, 194, 195, 194);
  doc.line(105, 180, 105, 201);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Balance de Inversión, relación de gastos', 17, 184.5);
  drawPdfCheckmark(150, 184);

  doc.setFont('helvetica', 'normal');
  doc.text('Suscripto por los responsables', 17, 191.5);
  drawPdfCheckmark(150, 191);

  doc.setFont('helvetica', 'normal');
  doc.text('Suscripto por el Jefe de Sucursal', 17, 198.5);
  drawPdfCheckmark(150, 198);

  // Section 4: y starts at 205
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('4 – Disp. Legales sobre conceptos y Procedimientos en vigencia.', 15, 208);

  // Table 6 (4 rows, starts at y = 210)
  doc.rect(15, 210, 180, 28);
  doc.line(15, 217, 195, 217);
  doc.line(15, 224, 195, 224);
  doc.line(15, 231, 195, 231);
  doc.line(105, 210, 105, 238);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Pedido debidamente cumplido (Pimys)', 17, 214.5);
  drawPdfCheckmark(150, 214);

  doc.setFont('helvetica', 'normal');
  doc.text('Conceptos autorizados', 17, 221.5);
  drawPdfCheckmark(150, 221);

  doc.setFont('helvetica', 'normal');
  doc.text('Pedidos de presupuestos', 17, 228.5);
  drawPdfCheckmark(150, 228);

  doc.setFont('helvetica', 'normal');
  doc.text('Recepción conforme a normativa', 17, 235.5);
  drawPdfCheckmark(150, 235);

  // Signatures (at y = 250)
  doc.setLineWidth(0.35);
  doc.setDrawColor(0, 0, 0);
  doc.line(15, 252, 75, 252);
  doc.line(135, 252, 195, 252);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REVISOR', 45, 256, { align: 'center' });
  doc.text('JEFE COORD.REND.CTAS', 165, 256, { align: 'center' });

  const currentDate = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`FECHA DE REVISIÓN:  ${currentDate}`, 15, 266);

  // Footer Address (left aligned)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Gerencia de Administración - Área Finanzas - Primera Junta 2558', 15, 276);
  doc.text('3000 - Santa Fe - Teléfono / Fax: (042) 4505768 - 4505776 / 4505775', 15, 281);

  doc.save(nombreArchivo);
}

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const GCIA_DE_REGION: Record<string, string> = {
  'Rafaela': 'RAFAELA',
  'Sucursal Noroeste': 'NOROESTE',
  'Sucursal Oeste': 'OESTE',
};

/** Datos de la planilla para un expediente del lector: la gerencia sale de la
 *  region del Sheet y la reparticion y su responsable, del sector cuyo nombre
 *  coincide con la agencia ('Las Rosas' -> 'Ag. Las Rosas', D. Malier). */
export function datosRevisivaLector(e: { region: string; hoja: string; rendicion: string; responsable?: string }): DatosRevisiva {
  const gciaSuc = GCIA_DE_REGION[e.region] || '';
  const agencia = sinAcentos(e.hoja);
  const sector = (SECTOR_MAPPING[gciaSuc] || []).find(s => {
    const nombre = sinAcentos(s.label).replace(/^ag\.\s*/, '').replace(/\s*\(.*\)$/, '');
    return nombre === agencia;
  });
  return {
    responsable: sector?.responsible || (e.responsable || '').replace(/^\d+\s*-\s*/, ''),
    fondoFijo: e.rendicion,
    reparticion: (sector?.label || e.hoja).toUpperCase(),
    gciaSuc,
  };
}
