import { GoogleGenAI, Type } from "@google/genai";
import { PIMYS_CODES } from "./codes";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ValidationResult {
  id: string;
  status: 'pass' | 'fail' | 'warning';
  observations: string;
}

export interface BalanceDecision {
  presente: boolean;
  monto_asignado?: number;
  rendiciones_pendientes?: Array<{ numero: string; importe: number }>;
  total_pendiente?: number;
  saldo_banco_declarado?: number;
  saldo_banco_calculado?: number;
  validacion_v14?: {
    resultado: 'ok' | 'error' | 'info';
    detalle: string;
  };
}

export interface PaymentData {
  orderNumber: string;
  providerName: string;
  amount: number;
  validations: ValidationResult[];
  pageNumber?: number;
  sourceFileIdx?: number;
  libroDiarioText?: string;
  vales?: Array<{
    numero: string;
    precioTotal?: string;
    legible: boolean;
    textoExtraido?: string;
  }>;
}

export interface AuditResult {
  fondoFijoId?: string;
  payments: PaymentData[];
  overallSummary: string;
  totalAmount?: number;
  balance_inversion?: BalanceDecision;
  mode?: 'Expedientes' | 'Viáticos';
  expedienteNumero?: string;
  expedienteFecha?: string;
  fondoFijoNumero?: string;
  agenciaSucursal?: string;
  responsable?: string;
}
function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('quota') || msg.includes('high demand') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
}

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);
  if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3);
  return keys;
}

// Convierte cualquier valor a un string seguro para renderizar.
// Si el modelo devuelve un objeto donde se esperaba texto (ej. overallSummary),
// lo aplanamos a una frase legible en vez de romper el render de React.
function toSafeString(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    try {
      return Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' · ');
    } catch {
      return '';
    }
  }
  return String(val);
}

// Garantiza que el resultado tenga siempre los tipos correctos, sin importar
// cómo se comporte el modelo. Evita pantallas en blanco por datos malformados.
function normalizeResult(raw: any, mode: 'Expedientes' | 'Viáticos' | 'Rapida'): AuditResult {
  const parsed: any = raw && typeof raw === 'object' ? raw : {};
  parsed.mode = mode;
  parsed.overallSummary = toSafeString(parsed.overallSummary);

  if (!Array.isArray(parsed.payments)) parsed.payments = [];
  parsed.payments = parsed.payments.map((p: any) => {
    const pay = p && typeof p === 'object' ? p : {};
    pay.orderNumber = toSafeString(pay.orderNumber);
    pay.providerName = toSafeString(pay.providerName);
    pay.amount = typeof pay.amount === 'number' && !isNaN(pay.amount) ? pay.amount : (Number(pay.amount) || 0);
    pay.libroDiarioText = toSafeString(pay.libroDiarioText);
    if (!Array.isArray(pay.validations)) pay.validations = [];
    pay.validations = pay.validations.map((v: any) => ({
      id: toSafeString(v?.id),
      status: (v?.status === 'pass' || v?.status === 'fail' || v?.status === 'warning') ? v.status : 'warning',
      observations: toSafeString(v?.observations ?? v?.observation),
    }));
    // Ensure all expected validation ids are present
    const expectedIds = mode === 'Viáticos' ? ['v1','v2','v3','v4'] : ['v1','v2','v3','v4','v5','v6','v7','v8','v9','v10'];
    for (const vid of expectedIds) {
      if (!pay.validations.find((v: any) => v.id === vid)) {
        pay.validations.push({ id: vid, status: 'warning', observations: 'No analizado por la IA para este comprobante.' });
      }
    }
    return pay;
  });

  // Red de seguridad anti-duplicación: si Gemini extrajo el mismo pago dos veces
  // (típicamente uno desde el comprobante físico y otro desde la fila del Libro Diario),
  // conservamos el que tiene comprobante físico (más validaciones reales / sin la marca
  // "sin comprobante físico") y descartamos el duplicado del Libro Diario.
  if (parsed.payments.length > 1) {
    const isLibroDiarioOnly = (p: any): boolean =>
      Array.isArray(p.validations) &&
      p.validations.some((v: any) =>
        typeof v?.observations === 'string' &&
        v.observations.toLowerCase().includes('sin comprobante físico'));
    const seen = new Map<string, number>();
    const deduped: any[] = [];
    for (const pay of parsed.payments) {
      const key = `${(pay.providerName || '').trim().toLowerCase()}|${Math.round(pay.amount || 0)}`;
      if (!pay.providerName || !pay.amount) { deduped.push(pay); continue; }
      if (seen.has(key)) {
        const idx = seen.get(key)!;
        const existing = deduped[idx];
        // Preferimos el que SÍ tiene comprobante físico
        if (isLibroDiarioOnly(existing) && !isLibroDiarioOnly(pay)) {
          deduped[idx] = pay;
        }
        // si el nuevo es el del Libro Diario, lo descartamos (no hacemos push)
      } else {
        seen.set(key, deduped.length);
        deduped.push(pay);
      }
    }
    parsed.payments = deduped;
  }

  parsed.expedienteNumero = toSafeString(parsed.expedienteNumero);
  parsed.expedienteFecha = toSafeString(parsed.expedienteFecha);
  parsed.fondoFijoNumero = toSafeString(parsed.fondoFijoNumero);
  parsed.agenciaSucursal = toSafeString(parsed.agenciaSucursal);
  parsed.responsable = toSafeString(parsed.responsable);

  if (parsed.balance_inversion?.validacion_v14) {
    parsed.balance_inversion.validacion_v14.detalle = toSafeString(parsed.balance_inversion.validacion_v14.detalle);
  }
  if (parsed.fondoFijoNumero) parsed.fondoFijoId = parsed.fondoFijoNumero;

  return parsed as AuditResult;
}

export async function processDocument(
  pdfFiles: string[] | Array<{ name: string; base64: string }>,
  mode: 'Expedientes' | 'Viáticos' | 'Rapida' = 'Expedientes',
  modelName: string = 'gemini-3.5-flash',
  signal?: AbortSignal
): Promise<AuditResult> {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('No hay API keys de Gemini configuradas.');
  }

  let lastError: unknown;
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      return await processDocumentWithKey(apiKeys[i], pdfFiles, mode, modelName, signal);
    } catch (err) {
      lastError = err;
      // Solo rotamos a la siguiente key si fue un error de cuota/saturación.
      if (isQuotaError(err) && i < apiKeys.length - 1) {
        console.warn(`API key ${i + 1} agotada, intentando con key ${i + 2}...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function processDocumentWithKey(
  apiKey: string,
  pdfFiles: string[] | Array<{ name: string; base64: string }>,
  mode: 'Expedientes' | 'Viáticos' | 'Rapida',
  modelName: string,
  signal?: AbortSignal
): Promise<AuditResult> {
  const localAi = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
      signal: signal
    } as any
  });
  
  // Convert inputs to array of { name, base64 } objects:
  const filesList = Array.isArray(pdfFiles) && pdfFiles.length > 0 && typeof pdfFiles[0] === 'string'
    ? (pdfFiles as string[]).map((base64, idx) => ({ name: `Documento_${idx + 1}.pdf`, base64 }))
    : pdfFiles as Array<{ name: string; base64: string }>;

  let systemInstruction = "";
   if (mode === 'Expedientes') {
    systemInstruction = `
    Eres un auditor experto de la Empresa Provincial de la Energía (EPE) de Santa Fe, Argentina.
    Tu tarea es auditar expedientes de Fondos Fijos (FF) digitales.
    
    Parte 1: Balance de Inversión
    Verifica si existe el documento "Balance de Inversión". Si está presente: extrae el monto asignado vigente, la lista de rendiciones pendientes con número e importe, y el saldo en banco declarado.
    V14: Balance de Inversión cuadra. Verificá que se cumplan las siguientes dos condiciones:
    1) Monto asignado vigente menos la suma de todas las rendiciones pendientes de reintegro es igual al saldo en banco declarado. Si no cuadra, marca 'error'.
    2) CONTROL EXHAUSTIVO DE RENDICIÓN (CRÍTICO): Identifica cuál de las rendiciones pendientes detalladas en el Balance de Inversión corresponde a este lote de pagos (por ejemplo, si el expediente contiene la rendición "0346", busca la fila de la rendición "0346" y su importe correspondiente en la tabla del Balance de Inversión, ej: $441.125,15). Compara este importe declarado de la rendición ÚNICAMENTE contra el "TOTAL BANCO A REPONER" que figura al final del Libro Diario (el importe resaltado que representa la suma de los pagos reales realizados en banco — transferencias y cheques — sin contar el IVA Crédito Fiscal ni las retenciones impositivas). NO compares contra la suma total de las facturas individuales ni contra los comprobantes de gastos, ya que esos importes incluyen retenciones y créditos fiscales que no son pagos bancarios. Si hay una diferencia entre el importe declarado en el Balance y el "TOTAL BANCO A REPONER" del Libro Diario, debes cambiar el 'resultado' de validacion_v14 a 'error' y explicar de forma explícita y pormenorizada de cuánto es la diferencia, indicando ambos valores y el faltante exacto para alertar al auditor. Si los valores coinciden, la condición 2 se cumple.
    Si no está presente el Balance de Inversión, marca 'info' indicando que no fue adjuntado.
    
    Parte 2: Pagos y Comprobantes de Gastos / Facturas de Servicios Públicos y Cooperativas
    Cada expediente de Fondo Fijo tiene una serie de pagos individuales o reintegros.
    Debes generar un elemento en el array 'payments' por CADA pago o comprobante de gasto individual que encuentres en todo el lote de archivos PDFs. No omitas ninguno.
    Identifica de manera flexible los pagos de la siguiente manera:
    1. Si encuentras comprobantes individuales de compras y gastos (formularios PIMyS, facturas físicas o electrónicas, tickets de compra, tiques, tickets banco, o liquidaciones de servicios): extrae cada grupo como un pago individual.

    FORMATO ESTÁNDAR DE FACTURA AFIP TIPO A/B/C (proveedores comerciales, repuestos, insumos, etc.):
    Estas facturas tienen una estructura fija emitida bajo normas AFIP. Seguí estrictamente estas reglas de extracción:
    - NOMBRE DEL PROVEEDOR (providerName): El nombre fiscal del emisor aparece debajo del logo o nombre comercial de la empresa, generalmente en la sección del encabezado izquierdo, precedido por el nombre en negrita/mayúsculas y seguido del CUIT, domicilio e ingresos brutos. Por ejemplo: encabezado dice "COSTAMAGNA REPUESTOS" (nombre comercial/logo) y debajo aparece "COSTAMAGNA EDUARDO MIGUEL" (nombre fiscal AFIP) junto con "CUIT: 24112069999". Debés usar el NOMBRE FISCAL (ej: "COSTAMAGNA EDUARDO MIGUEL"), NO el nombre comercial del logo. Si solo hay un nombre visible, usalo.
    - NÚMERO DE COMPROBANTE (orderNumber): En facturas AFIP tipo A/B/C, el número de comprobante se compone de dos partes: "Punto de venta: XXXX" y "Comp. Nro: XXXXXXXX" (o "Comprobante Nro:", "N° Comprobante:", etc.). Combiná ambos para formar el número: "XXXX-XXXXXXXX". Ejemplo: "Punto de venta: 0010  Comp.Nro: 00006075" → orderNumber: "0010-00006075". NUNCA uses el número del PIMyS como orderNumber de la factura; son documentos distintos.
    - FECHA DE LA FACTURA: Buscala en el campo "Fecha:" de la factura (ej. "Fecha: 03/06/2026").
    - IMPORTE TOTAL (amount): Es el campo "TOTAL" o "Total" en el cuadro de totales de la factura (ej. "TOTAL 195000.00"). Incluye IVA. NO uses subtotales parciales (Importe Neto Gravado, IVA 21%, etc.), sino el TOTAL final.
    
    CRÍTICO - FORMATO DE FACTURAS DE SERVICIOS PÚBLICOS / COOPERATIVAS (ej. Cooperativa Agua Potable de Sunchales, Litoral Gas, Telecom, Coop. Serv. Públicos Sastre, Servicio de Cloacas municipal, etc.):
    Estas facturas tienen un diseño particular y no siguen la estructura de factura de AFIP tipo A/B/C típica. Sigue estrictamente estas reglas de extracción para este formato:
    - NÚMERO DE COMPROBANTE / FACTURA: Búscalo en la sección superior/cabecera de la liquidación, típicamente etiquetado como "Cod.017 Liq.Serv.Pub. A [número]" o "Liquidación de Servicios Públicos A [número]" o simplemente "Liquidación de Servicios Públicos [número]". Ejemplos: "Cod.017 Liq.Serv.Pub. A 0008-00055016" -> orderNumber: "0008-00055016"; "Liquidación de Servicios Públicos A0002-00010317" (Cooperativa de Electricidad y Anexos Colonia Belgrano) -> orderNumber: "A0002-00010317". El número puede tener formato AXXX-XXXXXXXX o similar. PARA FACTURAS DE SERVICIO DE CLOACAS / MUNICIPALES: el número de comprobante es el campo "Boleta" (ej. "Boleta 2180052026" -> extrae como orderNumber: "2180052026"). PARA FACTURAS MUNICIPALES DE SERVICIO DE AGUA (ej. Municipalidad de San Jorge - Servicio de Agua): el número de comprobante es un número prominente de varios dígitos que aparece en el talón de pago SIN etiqueta, ubicado encima del período (mes y año, ej. "ABRIL 2026"). Ejemplo: "0040261152" aparece solo, arriba de "ABRIL 2026" -> extrae como orderNumber: "0040261152" o "40261152". Si no hay campo "Boleta" ni número sin etiqueta visible, usar el N° de cuenta o identificador más prominente.
    - FECHA DE EMISIÓN / PERÍODO: Búscala en el renglón de la cabecera bajo "Fecha Emisión:" o "Período" (ej. "Período 05/2026"). Úsala como la fecha de la factura para todo contraste.
    - IMPORTE TOTAL (A REVISAR): Regla universal: SIEMPRE extraer el importe del PRIMER vencimiento, que es el valor base sin recargo. NUNCA uses el importe del 2do vencimiento (que incluye recargo). Ejemplos concretos:
      * Aguas Santafesinas (cuotas): tomar el TOTAL del cuadro principal (ej. "TOTAL $***36.084,45"), no los subtotales de cada cuota.
      * Servicio de Cloacas / facturas municipales con dos vencimientos: tomar el importe del "1er Vencimiento" o "Primer Vto." (ej. "1er Vencimiento 12/06/2026 Importe 11.899,99" -> extrae amount: 11899.99). Ignorar el "2do Vencimiento" que incluye recargo (ej. $12.043,98).
      * Litoral Gas, Telecom, etc.: tomar el "TOTAL A PAGAR" o "IMPORTE A PAGAR" del primer vencimiento.
    Regla general: ante cualquier duda entre dos importes, elegir SIEMPRE el menor (que corresponde al primer vencimiento sin recargo).
    
    2. PROGRAMA PROSUMIDORES (reintegros a usuarios con paneles solares):
    Si encuentras una nota EPE cuyo asunto menciona "Programa Prosumidores" o "PROSUMIDORES":
    - Extrae de la nota: el nombre del usuario (ej. "GARRONE JUAN CARLOS"), el N° de nota (ej. "2-2026-6436") y el monto de reintegro indicado (ej. "$4.932,17").
    - Busca la factura EPE correspondiente en el lote. En ella aparece el mismo usuario (campo nombre del cliente) y una línea "Reintegro Monetario" con el importe (ej. "$ ****4.932,17"). El TOTAL de la factura suele ser $0,00 porque el reintegro cancela el saldo.
    - Extrae este caso como un payment individual con:
      * orderNumber: N° de la nota (ej. "2-2026-6436")
      * providerName: "Prosumidores – [nombre usuario]" (ej. "Prosumidores – GARRONE JUAN CARLOS")
      * amount: el importe del "Reintegro Monetario" de la factura (ej. 4932.17)
    - Validaciones específicas para PROSUMIDORES (en el campo validations, usando ids "v1", "v2", etc.):
      * Verificar que el nombre del usuario en la nota coincide con el nombre en la factura EPE. Si coincide: pass. Si no coincide: fail.
      * Verificar que el monto indicado en la nota ($4.932,17) coincide con el "Reintegro Monetario" de la factura. Si coincide: pass. Si no: fail con detalle de la diferencia.
      * Las demás validaciones (v1 a v10) aplican normalmente.

    3. Si el lote de documentos contiene una planilla de "Libro Diario" o listado de movimientos de caja: el Libro Diario se usa PRINCIPALMENTE para CONTRASTAR y corroborar los pagos que ya extrajiste de los comprobantes físicos (PIMyS, facturas, tickets), NO para duplicarlos. REGLA ANTI-DUPLICACIÓN (CRÍTICA Y OBLIGATORIA): Cada transacción económica debe generar UN ÚNICO elemento en el array 'payments'. Antes de crear un pago a partir de una fila del Libro Diario, verificá si ya existe un pago extraído de un comprobante físico (PIMyS/factura) que corresponda a la misma transacción (mismo proveedor y/o mismo importe y/o misma fecha). Si ya existe, NO crees un segundo pago: simplemente usá esa fila del Libro Diario para completar el campo 'libroDiarioText' y corroborar las validaciones de ESE pago ya existente. SOLO debés crear un pago nuevo a partir del Libro Diario cuando esa fila NO tenga ningún comprobante físico asociado en el lote de PDFs; en ese caso (y solo en ese caso) lo incluís con sus validaciones v1 a v10 como 'warning' detallando que se verificó según el Libro Diario pero sin comprobante físico adjunto ("Sin comprobante físico en PDF, verificado según registro en Libro Diario"). Nunca devuelvas el mismo proveedor e importe dos veces (una desde el PIMyS y otra desde el Libro Diario): eso es un error grave de duplicación.
    3. Para Notas de Débito de Banco Santa Fe o "Débitos y Créditos Bancarios": extráelas siempre como un pago individual en la lista 'payments'. Utiliza como 'orderNumber' su número de documento (ej: '0321') o similar, 'Banco de Santa Fe' como 'providerName' y el total de la planilla como 'amount'. Realiza las correspondientes validaciones v1 a v10 para este documento.
    
    ¡REGLA DE ORO DE EXTRACCIÓN (CRÍTICA)!:
    Incluso si NO se adjunta el Balance de Inversión o la Carátula del expediente, de todas formas DEBES analizar y extraer todos los "payments" (pagos/comprobantes) de los archivos PDF proporcionados. El análisis de los pagos es independiente de la presencia de la Carátula o de la planilla del Balance. No dejes el array 'payments' vacío bajo ninguna circunstancia si hay comprobantes, facturas, recibos, vales o tickets en los PDFs.
    NUNCA devuelvas una lista 'payments' vacía si el expediente tiene movimientos registrados, importes consumidos o comprobantes adjuntos en los PDFs.

    REGLA OBLIGATORIA DE VALIDACIONES: Para cada pago del array 'payments', el campo 'validations' DEBE contener SIEMPRE los 10 puntos de control (v1 a v10) sin excepción. Si un punto no aplica para ese tipo de comprobante (por ejemplo, v1 y v2 no aplican para una Nota de Débito Bancaria o una factura de servicio sin PIMyS), de todas formas inclúyelo con status 'warning' y una observación explicando por qué no aplica (ej: "No aplica: este comprobante no tiene PIMyS asociado."). Nunca omitas ningún punto del v1 al v10.

    Por cada pago, debes validar lo siguiente:
    - IMPORTANTE (OBLIGATORIO): Identifica y guarda en la propiedad 'pageNumber' la página física inicial del PDF (empezando en 1) en donde se halla la documentación de este pago en particular (su factura, PIMyS, comprobantes, o la página del Libro Diario si se extrae de allí). Además, guarda en la propiedad 'sourceFileIdx' el índice (0, 1, 2...) del archivo PDF subido que contiene este pago (si se subieron múltiples archivos). El índice debe coincidir exactamente con el índice indicado en la cabecera "=== ARCHIVO CON ÍNDICE DE ORIGEN X ===".
    - COPIAR LIBRO DIARIO (OBLIGATORIO): Para cada pago, localiza la fila o filas correspondientes a esta compra, PIMyS o Nota de Débito en la planilla del Libro Diario. Extrae de forma textual y exacta lo que figura en dicha fila del Libro Diario, específicamente el contenido completo de la columna "Texto" (que suele detallar códigos y descripciones de las transferencias, ej: "Transferencia FF3142 207-MATERIALES... / 227-ÚTILES... / 305-COMPRA GAS..."), junto con los importes, fecha u otros datos de esa fila que permitan corroborar de forma inequívoca el análisis. Guarda todo este fragmento extraído exactamente en el campo 'libroDiarioText' del JSON (en la raíz de cada objeto de pago). Si es la Nota de Débito Bancaria, copia la fila correspondiente a dichos débitos bancarios en la planilla.
    
    Puntos de control individuales del pago (v1 a v10):
    V1: Fecha PIMyS vs Factura. Comprueba de manera irrefutable y matemánticamente exacta que la Fecha de PIMyS sea menor o igual (<=) a la Fecha de la Factura.
    REGLA CRÍTICA PARA COMPARAR FECHAS DD/MM/YYYY CRONOLÓGICAMENTE:
    Para comparar la Fecha del PIMyS y la Fecha de la Factura (ambas en formato DD/MM/YYYY):
    1. Identifica el Año (los 4 dígitos finales), luego el Mes (los 2 dígitos del medio) e identifica finalmente el Día (los 2 dígitos del inicio).
    2. Conviértelas mentalmente al formato cronológico ISO YYYY-MM-DD.
    3. Compara cronológicamente de forma estricta: Si la fecha del PIMyS is posterior (estrictamente posterior/mayor, ej: PIMyS el 26/05/2026 and Factura el 21/05/2026, o PIMyS el 03/06/2026 y Factura el 28/05/2026), es una infracción reguladora muy grave y la validación V1 DEBE calificar inexcusablemente como 'fail' indicando ambas fechas (en formato DD/MM/YYYY) y señalando explícitamente: "La fecha del PIMyS ([fecha_pimys]) es posterior a la de la Factura ([fecha_factura])".
    
    V2: Proveedor adjudicado sea el de menor importe entre 3 cotizaciones.
    CONTROL EXHAUSTIVO (CRÍTICO): Las facturas de servicios públicos o cooperativas también poseen su respectivo formulario PIMyS y deben auditarse exactamente igual. Verifica de manera rigurosa que el proveedor de la factura (providerName) coincida con el adjudicado en la planilla PIMyS. Compara sus nombres. Si el proveedor de la factura (ej: "AB ELECTRONICA SA") NO figura listado entre los proveedores invitados a cotizar ni cotiza en el PIMyS (ej. allí figuran "NUTO SA", "YACOB MARIO REMO", "DAVICINO SA"), la validación V2 DEBE ser calificada obligatoriamente como 'fail' y advertir claramente en la observación que el proveedor facturado no participó del proceso de cotización del PIMyS, indicando los nombres encontrados.
    V3: Códigos de gasto habilitados (según normativa de FF) y que coincidan en PIMyS y Libro Diario. IMPORTANTE: Una sola compra o PIMyS puede contener MÁS DE UN CÓDIGO de imputación (por ejemplo, códigos 207, 227 y 305 juntos). Debes escanear el PIMyS completo buscando todos los códigos de gasto, y también buscar en la columna 'Texto' de la fila correspondiente a ese pago en la planilla Libro Diario. Compara y valida que TODOS los códigos listados en el PIMyS coincidan con los de la columna "Texto" del Libro Diario. Usa el siguiente diccionario de códigos para verificar cada código provisto en el archivo e incluir la descripción completa de cada uno de ellos: ${JSON.stringify(
      Array.from(
        new Map(
          Object.values(PIMYS_CODES)
            .flat()
            .map(c => [c.code, c])
        ).values()
      ).map(c => ({code: c.code, desc: c.descripcion}))
    )}
    V4: Aprobadores firmantes presentes en PIMyS con nombre y legajo. Si el código de gasto es de movilidad (302, 310, 313, 314, 400, 401, 412, 415 o 418), se DEBE verificar también que figure la autorización de "pimysmovrafaela@epe.santafe.gov.ar" dentro de esta misma validación.
    REGLA DE CONTROL CRÍTICA PARA CÓDIGO 226 (Mantenimientos menores y esporádicos para motosierras, motoguadañas, Tracto-segadoras y hormigoneras...):
    Si se detecta el uso del código 226 en el pago, se debe asegurar obligatoriamente la firma/autorización del jefe Administrativo de la Sucursal de origen de la siguiente forma según la localidad/agencia/sucursal del expediente:
    - Compras de Rafaela (ej: UT Adm Rafaela, Ag. Rafaela, Ag Norte, Maria Juana, o la sucursal de Rafaela en general): la validación V4 DEBE verificar y requerir explícitamente la firma o autorización de "Juan Chianalino". Si no se encuentra su nombre firmado o mencionado en el PIMyS o confirmación, califica V4 como 'fail' o 'warning' con la advertencia: "Falta autorización requerida de 'Juan Chianalino' para código 226 en zona Rafaela".
    - Compras de Noroeste (ej: Suc Noroeste, Ag San Cristobal, Ag San Guillermo, Ag Sunchales, Ag Tostado, o zona Noroeste en general): la validación V4 DEBE verificar y requerir explícitamente la firma o autorización de "Eduardo Argañaraz" (o Eduardo Arganaraz). Si no se encuentra, califica V4 como 'fail' o 'warning' especificando: "Falta autorización requerida de 'Eduardo Argañaraz' para código 226 en zona Noroeste".
    - Compras de Oeste (ej: Suc Oeste, Ag El trebol, El Trébol, Ag Las Rosas, Las Rosas, Ag San Jorge, o zona Oeste en general): la validación V4 DEBE verificar y requerir explícitamente la firma o autorización de "Leonardo Rostagno". Si no se encuentra, califica V4 como 'fail' o 'warning' indicando: "Falta autorización requerida de 'Leonardo Rostagno' para código 226 en zona Oeste".
    Deberás detallar el resultado de este control de forma explícita en las observaciones de V4.
    V5: Nombre proveedor coincidente en todos los documentos. Verifica que el nombre del proveedor en la Factura sea exactamente el mismo que figura en el PIMyS, Constancia ARCA, Confirmación SAP, Libro Diario, y el "Recibo" de pago con cheque si correspondiese. Si el emisor de la factura/pago NO coincide o no figura en el PIMyS (ej: la factura es de "AB ELECTRONICA SA" pero el PIMyS adjudica a "NUTO SA" o no incluye a AB ELECTRONICA SA entre los cotizantes), califica V5 obligatoriamente como 'fail' indicando la discrepancia detallada.
    V6: Importe de la factura coincida con el importe en el Libro Diario y sea <= $1.170.000 (Límite Art. 7). Si es una planilla de Débitos y Créditos Bancarios (Nota de Débito Bancaria), corroborar que el importe TOTAL al pie de esta planilla (p.ej. 'TOTAL: 43507,91') coincida con el Libro Diario. Si se encuentra un "Recibo" de pago por cheque, el importe total consignado en concepto (letras y números, ej: $ 280.700,00) de dicho Recibo debe coincidir también con el de la Factura y el Libro Diario.
    V7: Número de factura coincida en Confirmación SAP, Libro Diario y también en la descripción del "Concepto" del Recibo del proveedor. Para Notas de Débito Bancaria, el número de documento es el N° que figura arriba (ej: "0321" o "N°: 0321"), y debe coincidir.
    
    V8: CUIT del proveedor coincida en PIMyS, Factura, ARCA, Confirmación SAP, Libro Diario, Destinatario de la transferencia o pago. 
    ¡CONTROL DE TERCEROS / CUIT (ALTAMENTE CRÍTICO)!: Debes verificar minuciosamente que el CUIT o nombre del destinatario del comprobante de transferencia coincida con el proveedor de la factura. Si la transferencia se realizó a un CUIT o nombre diferente al proveedor (ej: la factura pertenece a 'Astudillo' o 'Servicios Astudillo' pero los fondos fueron transferidos a 'OLLERO RAUL OSCAR' / CUIT '20146539913'), esta validación V8 DEBE ser calificada inexcusablemente como 'fail' alertando de forma muy visible que el destinatario no coincide: "Punto de Control V8 FALLIDO: Destinatario de transferencia [CUIL 20146539913 OLLERO RAUL OSCAR] difiere del proveedor de la factura [Astudillo]".
    Para Notas de Débito de Banco Santa Fe, verificar que el CUIT del emisor (Banco de Santa Fe, ej: 30-69243266-1 o el correspondiente) coincida entre la nota de débito, ARCA y el Libro Diario.
    
    V9: Constancia ARCA vigente a la FECHA DE PAGO real. IMPORTANTE: Lo que debes verificar de manera rigurosa es que la FECHA DE PAGO (ej: fecha de la transferencia bancaria, fecha de emisión/cobro del cheque, o fecha de registración en el Libro Diario para dicho pago/reintegro) se encuentre dentro del rango de vigencia de la constancia ARCA (debe ser mayor o igual a la fecha "Desde" y menor o igual a la fecha "Hasta" de validez de la constancia de opción o inscripción). NO consideres un error si la fecha de la factura es anterior a la fecha de inicio vigencia ("Desde") de la constancia; la factura puede ser anterior, lo relevante y lo que se debe auditar es que el pago real se haya realizado dentro de la vigencia de la constancia de ARCA.
    
    V10: Pago/transferencia, Cheque o Vale verificado críticamente.
    - Si es una planilla de Débitos y Créditos Bancarios (Nota de Débito de Banco Santa Fe), debes corroborar el importe TOTAL de esta planilla (ej: $43.507,91) contra el importe detallado y el Libro Diario y que se registre la debida afectación.
    - Si es transferencia bancaria: Importe transferido = Importe SAP - Retenciones. 
      ¡CONTROL DE DESTINATARIO DE TRANSFERENCIA (GRAVE)!: Verifica minuciosamente el 'DESTINATARIO' o 'TITULAR CUENTA DESTINO' en el ticket o comprobante de la transferencia y crúzalo con el proveedor de la factura. Si se transfirió a una cuenta correspondiente a un tercero (ej: se transfirió a 'OLLERO RAUL OSCAR' pero el proveedor de la factura/pago is 'Astudillo'), califica V10 obligatoriamente como 'fail' agregando de forma destacada la frase exacta: "ALERTA: Transferencia realizada a un beneficiario incorrecto [OLLERO RAUL OSCAR en lugar de Astudillo]".
    - Si es pago con cheque: verifica el Recibo del proveedor adjunto (factura menos retenciones es igual al cheque neto).
    - Si son Vales de provisión de combustibles o de ruedas: En pagos de movilidades/combustible, si hay un "Vale Provisión Combustible" o de ruedas (Form. M. 528 o similar), extrae el número de vale (arriba a la derecha, ej: "18146") y el "PRECIO TOTAL" de la quinta columna (columna "PRECIO TOTAL"). Es sumamente crítico discernir si la caligrafía manuscrita es legible o ilegible. Si está ilegible, la devolución de la auditoría en la observación DEBE ser exactamente: "Letra no legible en vale N° [número]" (ej: "Letra no legible en vale N° 18146") y el status de esta validación V10 debe ser obligatoriamente 'warning'. Si es legible, extrae el monto (ej. 51801.60) y detalla "Vale N° [número] - PRECIO TOTAL: $[importe]" en las observaciones.
    
    Instrucciones adicionales para un reporte detallado:
    - OBLIGATORIO: Debes devolver EXACTAMENTE un objeto de validación en el array 'validations' por CADA UNA de las reglas definidas (v1 a v10) para cada pago. ¡NO OMITAS NINGUNA REGLA! Si un pago no posee ciertos datos que permitan validar una regla (por ejemplo, porque es un pago que extraes del Libro Diario pero que carece de comprobante de factura física o PIMyS en el lote de PDFs), califica el status de esa regla como 'warning' y detalla en la observación lo que pudiste corroborar según el Libro Diario u otros documentos (ej: "Sin comprobante físico en PDF, verificado según registro en Libro Diario").
    - El "orderNumber" debe ser el N° de PIMyS (por ejemplo, "4173") si está presente. Si no tiene PIMyS o es una Nota de Débito, usa el número de factura, N° de ticket, N° de transacción de banco, o un identificador secuencial como "PAGO-1", "PAGO-2", etc. para que sea siempre legible y único. NUNCA devuelvas un valor vacío o nulo para 'orderNumber'.
    - En las "observations" de cada validación, sé explícito sobre los datos encontrados y formatea como se solicita:
    FORMATO DE NEGRITA EN OBSERVACIONES: En las observaciones de cada validación, envuelve entre dobles asteriscos (**valor**) los valores clave que se indican a continuación para cada punto de control. El sistema los mostrará en negrita en la pantalla.

    - Ej V1: Menciona las dos fechas encontradas de forma explícita. Si es correcto (pimys <= factura), sólo indica de manera simple las fechas (ej: "Fecha de PIMyS: **DD/MM/YYYY** - Fecha de Factura: **DD/MM/YYYY**"). Si la fecha del PIMyS es posterior/mayor, califica como 'fail' e indica claramente: "La fecha del PIMyS (**fecha_pimys**) es posterior a la de la Factura (**fecha_factura**)" indicando ambas fechas.
    - Ej V2: Menciona de forma rigurosa y explícita el nombre del proveedor adjudicado según el PIMyS y si éste coincide con el proveedor de la factura (ej: "El proveedor adjudicado es **'XXX'** que tiene el menor precio ($YYY)"). MUY IMPORTANTE: En otro renglón, nombra e indica el importe de TODAS las otras cotizaciones de los demás proveedores del cuadro de PIMyS. Si el proveedor de la factura NO figura en el PIMyS ni entre las firmas invitadas, califica el status de V2 como 'fail' e indica de forma explícita y visible: "ALERTA: El proveedor de la factura **[AB ELECTRONICA SA]** NO se encuentra listado ni cotiza en el PIMyS".
    - Ej V3: Menciona TODOS los códigos de gasto que participan en el pago (PIMyS o Libro Diario). Detállalos uno por uno en renglones separados indicando para cada uno el código junto con su DESCRIPCIÓN_COMPLETA del diccionario de códigos (ej: "**Código 207** - Materiales Mtto Línea y Redes: [Descripción completa]\n**Código 227** - Útiles Herramientas Equipos: [Descripción completa]"). Debajo, en un renglón nuevo, indica claramente si coinciden o difieren con la columna "Texto" del Libro Diario.
    - Ej V4: Detalla los aprobadores renglón por renglón exactamente así: "Aprobador 1: [Nombre]\nAprobador 2: **[Nombre / Si es correo pimysmovrafaela pon 'Movilidades Rafaela']**\nResponsable de FF: [Nombre]". Si corresponde al código 226, añade una línea indicando expresamente para el control: "Control Código 226: Autorización de [Nombre del firmante esperado] requerida - [Verificada/Falta]".
    - Ej V5: Menciona el nombre exacto del proveedor de la factura y enumera con qué documentos es coincidente (Libro Diario, Factura, ARCA, Recibo, etc.). Si el nombre del proveedor en el PIMyS difiere o el proveedor de la factura no figura en el PIMyS, califica V5 como 'fail' e indica la discrepancia de forma pormenorizada (ej: "Inconsistencia de proveedor: PIMyS indica NUTO SA mientras que la factura es de AB ELECTRONICA SA").
    - Ej V6: Describe el importe exactamente de esta forma: "Importe: **$[valor]** (Límite <= $1.170.000)". Y en el renglón de abajo indica si coincide con el libro diario (y si aplica, que coincide con el importe total del Recibo).
    - Ej V7: Indica el número de factura de esta forma: "N° de factura: **[número]**". Luego indica con qué documentos coincide (SAP, Libro Diario, Recibo, etc.).
    - Ej V8: Deja la descripción del CUIT así: "CUIT: **[número de CUIT]**" y en el renglón de abajo enumera los documentos con que coincide, incluyendo el receptor del pago/transferencia. Si la transferencia se realizó a un beneficiario/CUIT diferente (como CUIT 20146539913 OLLERO RAUL OSCAR en lugar de Astudillo), detalla explícitamente: "El CUIT del destinatario de la transferencia [CUIT] pertenece a un tercero (OLLERO RAUL OSCAR) y difiere del proveedor de la factura [Proveedor]" y califica como 'fail'.
    - Ej V9: Si la constancia ARCA está vigente, indica de esta forma: "**Se encuentra dentro del rango de vigencia**. Vigencia: desde [fecha] hasta [fecha]. Fecha de pago: [fecha]". Si no está vigente, indica claramente el error con las fechas relevantes en negrita.
    - Ej V10:
      - Si es transferencia, detalla el importe transferido en negrita: "Importe transferido: **$[valor]**", el de SAP y las retenciones calculadas. Si se transfirió a una cuenta que pertenece a una persona distinta del proveedor (tercero incorrecto), detalla enérgicamente de esta forma exacta: "ALERTA: Transferencia realizada a un beneficiario incorrecto [Nombre Destinatario en la transferencia] en lugar de [Nombre Proveedor de la factura]" y califica obligatoriamente como 'fail'.
      - Si es pago por cheque, detalla de forma explícita y pormenorizada: "Cheque N° [número]: **$[importe_cheque]**\nFactura: $[importe_factura]\nRetenciones del Recibo: [Desglosar. Ej: Ganancias: $[ganancias], IVA: $[iva], etc.]\nVerificación matemática: [Describir si la resta de Factura menos Retenciones coincide con el cheque recibido]".
      - Si hay Vales de provisión de combustibles o de ruedas: Detalla por cada vale de esta forma exacta: "Vale N° [número] - PRECIO TOTAL: **$[importe]**". Si la caligrafía manuscrita del valor o precio no se puede leer, la observación de esta validación V10 DEBE contener exactamente la frase: "Letra no legible en vale N° [número]" (ej: "Letra no legible en vale N° 18146") y el status de esta validación debe ser obligatoriamente 'warning'.
    
    Parte 3: Extracción de Datos de Identificación (CRÍTICO)
    Busca transversalmente en todos los documentos los siguientes campos para la raíz del JSON:
    1. "expedienteNumero": Extrae el número de expediente de la sección "Referencia: Carátula del expediente EE-YYYY-0000XXXX-APPSF-OD". Debe formarse estrictamente con el año y las cifras significativas sin ceros a la izquierda, es decir, con el formato "YYYY-XXXX" (ej. de "EE-2026-00008401-APPSF-OD" debes extraer "2026-8401", de "EE-2026-00008456-APPSF-OD" debes extraer "2026-8456").
    2. "expedienteFecha": Extrae la fecha real de la carátula del expediente. NOTA DE PRECISIÓN: En las carátulas de expediente, ignora la "Fecha Solicitud" si difiere del día de firma o emisión de la carátula. Extrae prioritariamente la fecha que figura arriba a la derecha debajo de "SANTA FE" (ej. "Martes 26 de Mayo de 2026" -> extraer "26/05/26", "Viernes 22 de Mayo de 2026" -> extraer "22/05/26"). Conviértela y formatéala estrictamente como "DD/MM/YY".
    3. "fondoFijoNumero": Extrae el número del Fondo Fijo / Rendición / Reintegro real que se está auditando. CRÍTICO: NO confundas el "Número de Caja" (como "FF N° 3142", que identifica la caja física y NO debe usarse como fondoFijoNumero) con la Rendición. El N° de Fondo Fijo / Rendición real DEBE buscarse en el documento "Balance de Inversión" bajo el nombre de "Rendición N°" (ej. "0141" o "141" que figura en la tabla de rendiciones pendientes de reintegro) o "Reposición N°" (ej. "241"). Formatea el valor extraído SIEMPRE con el formato "FF N° [número de rendición]" (ej. "FF N° 0141" o "FF N° 241" en lugar del número de caja "FF N° 3142").
    4. "agenciaSucursal": Extrae el nombre de la localidad, fondo, agencia, sucursal, delegación o unidad correspondiente de la carátula, firmas, sellos o preferentemente del encabezado del Balance de Inversión ("FONDO FIJO DE: [unidad / delegación]") de forma exacta y completa. Por ejemplo, de "FONDO FIJO DE : UNIDAD MOVILIDADES CENTRO NORTE – DELEGACIÓN RAFAELA" extrae exactamente "UNIDAD MOVILIDADES CENTRO NORTE - DELEGACIÓN RAFAELA" o "DELEGACIÓN RAFAELA". Evita recortar apresuradamente nombres complejos ni asumir que siempre es una "Agencia". Si no se consigna de forma explícita en el Balance de Inversión, búscalo en las firmas o leyendas digitales (ej: si la firma digital de la foja 2 dice "Agencia El Trébol", deduce "El Trebol").
    5. "responsable": Extrae el nombre de la persona que figura o firma como Responsable u Solicitante en la parte inferior derecha de los formularios PIMyS de compras (por ejemplo, "Cesana Carelli Fernando Alberto"). Si no está o hay múltiples, busca el nombre que aparezca de forma prominente como Responsable del Fondo Fijo en el Balance de Inversión, o de forma general en los documentos en la parte de firmas.
    
    IMPORTANTE PARA totalAmount (PREVENCIÓN DE DUPLICACIÓN/ERRORES):
    El "totalAmount" debe corresponder al valor REAL del expediente o reembolso.
    - Si se adjunta Carátula del Expediente: El total real coincide con el importe consignado en el campo "Motivo", ej: "Motivo: EPE-GA-REINTEGRO FDO. FIJO 228 POR $ 791.933,13" -> el totalAmount is exactamente 791933.13. No sumes de más, ni dupliques columnas, ni sumes las retenciones.
    - Si se adjunta Libro Diario: Busque el total general, el renglón final de TOTAL RENDIDO, o la suma real sin duplicar. NUNCA sumes arbitrariamente columnas que contengan subtotales, números parciales o filas repetidas.
    
    Analiza los documentos PDF proporcionados y genera un resultado estructurado en JSON.
    Si un dato no se encuentra, márcalo como 'warning' con la observación correspondiente.
  `;
  } else if (mode === 'Rapida') {
    systemInstruction = `
    Eres un auditor experto de la Empresa Provincial de la Energía (EPE) de Santa Fe, Argentina.
    Tu tarea es analizar UN ÚNICO comprobante de pago (factura, ticket, liquidación de servicio, nota de débito, etc.) de forma rápida y precisa, SIN carátula de expediente, SIN Balance de Inversión y SIN Libro Diario.

    Extrae del documento los siguientes datos del pago:
    - orderNumber: N° de factura, N° de ticket, N° de boleta, N° de liquidación o identificador más relevante del comprobante.
    - providerName: Nombre del emisor/proveedor (empresa, cooperativa, municipalidad, etc.).
    - amount: Importe total del comprobante. Si hay 1er y 2do vencimiento, usar SIEMPRE el 1er vencimiento (el menor). Si hay cuotas, usar el TOTAL general.
    - pageNumber: 1 (es un único documento).
    - sourceFileIdx: 0.
    - libroDiarioText: dejar vacío "".

    Luego realiza las validaciones que correspondan según la documentación disponible:
    - V1 (Fecha PIMyS vs Factura): Si no hay PIMyS, marcar 'warning' indicando "Sin PIMyS adjunto en auditoría rápida".
    - V2 (Recibo de pago): Si no hay recibo, marcar 'warning' indicando "Sin recibo adjunto en auditoría rápida".
    - V3 (CUIT del emisor): Verificar si el CUIT figura en el comprobante. Si no hay con qué contrastar, marcar 'warning'.
    - V4 (Importe factura vs recibo): Si no hay recibo, marcar 'warning'.
    - V5 (Código PIMyS): Si no hay PIMyS, marcar 'warning' indicando "Sin PIMyS en auditoría rápida".
    - V6 (Importe dentro del límite $1.170.000): Verificar que el importe no supere el límite.
    - V7 (Período correcto): Si la factura tiene período, verificar que corresponda al bimestre auditable.
    - V8 (CUIT coincide entre documentos): Si solo hay un documento, marcar 'warning' indicando "Único documento disponible".
    - V9 (Firma/sello habilitante): Si no hay PIMyS, marcar 'warning'.
    - V10 (Importe transferido coincide): Si no hay recibo de transferencia, marcar 'warning'.

    Completa el JSON con:
    - overallSummary: Resumen breve del comprobante analizado (proveedor, importe, observaciones relevantes).
    - balance_inversion: { presente: false }
    - totalAmount: el mismo importe del pago extraído.
    - expedienteNumero, expedienteFecha, fondoFijoNumero, agenciaSucursal, responsable: dejarlos vacíos "" ya que no aplican en auditoría rápida.
  `;
  } else if (mode === 'Viáticos') {
    systemInstruction = `
    Eres un auditor experto de la Empresa Provincial de la Energía (EPE) de Santa Fe, Argentina.
    Tu tarea es auditar documentos de liquidación de "Viáticos" (Liquidación de Compensación de Gastos y Hoja de Ruta de choferes).
    
    Se espera que los PDFs contengan la "ORDEN DE COMISION DE SERVICIOS" (planilla 1) y la "HOJA DE RUTA" (planilla 2).

    SOPORTE COMPLETO PARA MÚLTIPLES VIÁTICOS / AGENTES (ALTAMENTE CRÍTICO):
    Si el usuario sube múltiples archivos PDF (por ejemplo, subió 9 archivos que contienen 9 liquidaciones de viáticos) o si hay múltiples agentes con sus respectivas órdenes y hojas de ruta en un mismo lote, debes procesar y auditar CADA uno de ellos independientemente.
    Para cada viático o agente individual, genera EXACTAMENTE una entrada correspondiente en la lista 'payments'. Si hay 9 viáticos o comisiones en total, tu JSON de respuesta debe incluir exactamente 9 elementos en el array 'payments' (cada uno con su legajo en 'orderNumber', el nombre del agente en 'providerName' y su propio importe "Total a Reconocer" en 'amount').
    Bajo ningún concepto combines todos los viáticos en uno solo, ni limites el resultado a una sola entrada en el array 'payments' si es que hay múltiples comisiones de servicio de viáticos en los PDFs subidos.

    Por cada viático individual de agente encontrado, debe registrarse:
    - orderNumber: El número de Legajo del agente (ej. "83813").
    - providerName: El NOMBRE COMPLETO DEL AGENTE del viático (ej. "RICCA FEDERICO").
    - amount: El "Importe Total a Reconocer" de ese viático (número decimal sin signo de pesos ni separadores de miles, usando punto para decimales).
    - pageNumber: La página física del archivo PDF (empezando en 1) en donde se inicia la documentación para este agente.
    - sourceFileIdx: El índice (0, 1, 2...) del archivo PDF en la lista cargada de donde proviene este viático.

    Para cada uno deberás validar los siguientes puntos (v1 a v4):
    V1: Coincidencia del Nombre del Agente: Verifica que el nombre del empleado a quien se encomienda la comisión en la Planilla 1 (ej "RICCA FEDERICO") y su correspondiente legajo, coincidan con el Agente listado en la Planilla 2 (Hoja de Ruta/Liquidación). Menciona explícitamente los nombres visualizados en ambas planillas.
    V2: Coincidencia de Fechas de Salida y Regreso: Compara exhaustivamente la FECHA DE SALIDA y FECHA DE REGRESO de la Liquidación (Planilla 1) contra las fechas y desarrollo de trayecto que figuran en la Hoja de Ruta (Planilla 2). Menciona en la observación las fechas extraídas de ambas y si coinciden o difieren.
    V3: Coincidencia de Kilómetros y Vehículo: Compara el "Movil Salida"/"Movil Regreso" y "Km. Salida"/"Km. Regreso" firmados al pie de la Planilla 1 contra el Kilometraje de Salida y de Regreso detallados al inicio y desarrollados en la Planilla 2 (Hoja de Ruta). Menciona explícitamente los Km de salida y de regreso extraídos en ambas planillas.
    V4: Importes y Cálculos: Extrae y verifica el "Importe Total a Reconocer" y el anticipo previo, comprobando que el "Saldo a favor empleado" o "Saldo a favor E.P.E." sea matemáticamente correcto según la diferencia. Mencionalos explícitamente en la validación.
    
    Instrucciones para el JSON de respuesta:
    - OBLIGATORIO: Debes devolver EXACTAMENTE un objeto de validación en el array 'validations' de cada pago por CADA UNA de las reglas definidas (v1 a v4). Si un dato no se encuentra o la hoja de ruta falta, califícalo con status 'warning' y describe la situación en "observations".
    - El "totalAmount" general en la raíz del JSON debe ser la SUMA acumulada de todos los montos de "Importe Total a Reconocer" de todos los viáticos auditados en este lote de archivos.
    - La propiedad "balance_inversion" devuélvela con "presente: false".
    - En "overallSummary" redacta un breve párrafo con el resumen consolidado de la auditoría de todos los viáticos procesados en el lote, indicando cuántos agentes/viáticos se analizaron de forma existosa y si hubo inconsistencias recurrentes.
    - "responsable": El nombre del primer agente o la lista completa de agentes.
    - "agenciaSucursal": Nombre de la sucursal or oficina a la que pertenecen los agentes.
    
    Analiza meticulosamente todos los documentos PDF cargados y genera un resultado consolidado de forma íntegra estructurando la respuesta en el JSON solicitado.
  `;
  }

  const promptParts: any[] = [
    { text: `Audita los siguientes archivos correspondientes a la misma auditoría de tipo ${mode}:` },
    { text: `A continuación se listan los documentos PDF cargados para auditar. Cada documento tiene asignado un índice de archivo (basado en cero). DEBES usar este índice en el campo 'sourceFileIdx' de cada pago que extraigas para indicar de cuál de estos archivos proviene:` }
  ];

  filesList.forEach((file, idx) => {
    promptParts.push({ text: `=== ARCHIVO CON ÍNDICE DE ORIGEN ${idx} ===\nNombre de archivo original: "${file.name}"` });
    promptParts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: file.base64
      }
    });
    promptParts.push({ text: `=== FIN ARCHIVO ÍNDICE ${idx} ===` });
  });

  promptParts.push({ text: `Analiza minuciosamente los documentos proporcionados arriba y genera el informe requerido estructurando el JSON exacto.` });

  const response = await localAi.models.generateContent({
    model: modelName,
    contents: [
      {
        parts: promptParts
      }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          balance_inversion: {
            type: Type.OBJECT,
            properties: {
              presente: { type: Type.BOOLEAN },
              monto_asignado: { type: Type.NUMBER, description: "Número sin separadores de miles, punto para decimal. Ej: 1210000.00" },
              rendiciones_pendientes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    numero: { type: Type.STRING },
                    importe: { type: Type.NUMBER, description: "Número sin separadores de miles, punto para decimal." }
                  }
                }
              },
              total_pendiente: { type: Type.NUMBER, description: "Número sin separadores de miles." },
              saldo_banco_declarado: { type: Type.NUMBER, description: "Número sin separadores de miles." },
              saldo_banco_calculado: { type: Type.NUMBER, description: "Número sin separadores de miles." },
              validacion_v14: {
                type: Type.OBJECT,
                properties: {
                  resultado: { type: Type.STRING, enum: ["ok", "error", "info"] },
                  detalle: { type: Type.STRING }
                }
              }
            }
          },
          payments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                orderNumber: { type: Type.STRING, description: "N° de PIMyS, número de factura, N° de ticket, documento de débito bancario, o identificador del pago (ej. 'PAGO-1') de la transacción para mantenerla legible y única." },
                providerName: { type: Type.STRING },
                amount: { type: Type.NUMBER, description: "Importe transferido al proveedor por este pago (formato numérico con punto decimal. ¡NO uses caracteres que invalidan JSON!). Si no lo encuentras extrae 0 pero NUNCA devuelvas nulo." },
                pageNumber: { type: Type.INTEGER, description: "Número de página inicial (empezando en 1) en donde se encuentra este pago en el PDF" },
                sourceFileIdx: { type: Type.INTEGER, description: "Índice (0, 1, 2...) del archivo PDF en la lista de documentos analizados de donde proviene este pago" },
                libroDiarioText: { type: Type.STRING, description: "Transcripción exacta o copia del texto de la o las filas del Libro Diario asociadas a este pago o PIMyS, especialmente de la columna 'Texto' (ej. 'Transferencia FF3142 207-MATERIALES[...]'), para que el usuario verifique la lectura de letra pequeña." },
                vales: {
                  type: Type.ARRAY,
                  description: "Lista de vales de provisión de combustibles, de ruedas, u otros repuestos si existen para este pago de movilidad.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      numero: { type: Type.STRING, description: "Número de vale obtenido de la esquina superior derecha (ej. '18146')" },
                      precioTotal: { type: Type.STRING, description: "Monto del precio total si es legible, ej. '51801.60'. Dejar vacío o null si no es legible." },
                      legible: { type: Type.BOOLEAN, description: "Indica si la caligrafía es legible (true) o si es ilegible (false)." },
                      textoExtraido: { type: Type.STRING, description: "Detalle textual de los renglones de combustible o ruedas y sus cálculos." }
                    }
                  }
                },
                validations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Identificador exacto de la regla: v1, v2, v3, v4, v5, v6, v7, v8, v9 o v10" },
                      status: { type: Type.STRING, enum: ["pass", "fail", "warning"] },
                      observations: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          overallSummary: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER, description: "El importe final EXACTO que figura en la planilla 'Libro Diario' (ej. 1276544.00) o en el TOTAL de reembolso consignado en el Motivo de la carátula si no hay Libro de Diario (ej. 791933.13). IMPORTANTE: Formato numérico con punto para decimales, NUNCA sumes columnas redundantes ni uses separador de miles o $." },
          expedienteNumero: { type: Type.STRING, description: "Número de expediente de la sección 'Referencia', formato 'YYYY-XXXX', ej. '2026-8401'." },
          expedienteFecha: { type: Type.STRING, description: "Fecha de la carátula del expediente obtenida de 'Fecha Solicitud' o de inicio del expediente, formateada como DD/MM/YY, ej. '22/05/26'." },
          fondoFijoNumero: { type: Type.STRING, description: "Número de Fondo Fijo / Rendición, obtenido prioritariamente de la Rendición N° que figura en el Balance de Inversión (ej. 'FF N° 0141'). NUNCA uses el N° de caja como 'FF N° 3142' para este campo." },
          agenciaSucursal: { type: Type.STRING, description: "Nombre de la agencia o de la localidad/sucursal a la que pertenece el fondo, ej. 'El Trebol', 'Las Rosas'." },
          responsable: { type: Type.STRING, description: "Nombre de la persona responsable obtenido de la parte inferior de los PIMyS o del Balance de Inversión." }
        }
      }
    }
  });

  return normalizeResult(JSON.parse(response.text), mode);
}
