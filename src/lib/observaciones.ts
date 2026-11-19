// Observaciones de la planilla control en palabras simples (pedido del
// usuario, 11/2026): lo que hay que corregir y por que, corto, sin la jerga
// del lector (V7, OCR, IA, 'lectura de una sola pasada', 'No verificable').
// Una frase por control, con los datos clave que se sacan de su texto; si el
// texto no trae el dato, una frase generica para que el auditor la complete.

const $ = String.raw`\$\s?[\d.]+,\d{2}`;

/** Lo que el lector agrega para el auditor y no va en la planilla. */
export function limpiar(texto: string): string {
  return texto
    .replace(/\*\*/g, '')
    .replace(/\s*\((?:IA|OCR)[^)]*\)\.?/g, '')
    .replace(/,?\s*pero [^.]*?(?:lectura|pasada)[^.]*\.?/gi, '.')
    .replace(/:?\s*lectura de una sola pasada de OCR,?\s*verificar\.?/gi, '.')
    .replace(/\s*No verificable:\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .trim();
}

const primero = (texto: string, patron: RegExp) => texto.match(patron)?.[1]?.trim();
const corto = (t: string, n = 120) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
const nombre = (t?: string) => (t || '').replace(/^\d+\s*-\s*/, '').trim();

export function observacionSimple(id: string, texto: string): string {
  const t = limpiar(texto);
  const T = t.toUpperCase();
  switch (id.toUpperCase()) {
    case 'V1': {
      const pimys = primero(t, /PIMyS:?\s*(\d{2}\/\d{2}\/\d{4})/i);
      const fact = primero(t, /factura:?\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (/posterior/i.test(t) && pimys && fact) return `La fecha del PIMyS (${pimys}) es posterior a la de la factura (${fact}).`;
      if (/vale/i.test(t)) return 'Verificar la fecha del vale.';
      return 'Verificar la fecha de la factura y la del PIMyS.';
    }
    case 'V2': {
      const a = primero(t, /adjudic[oó] a (.+?) \(/i);
      if (a && /menor cotizaci[oó]n era/i.test(t)) return `Se adjudicó a ${a} y no a la menor cotización.`;
      if (/otra firma invitada|no es la menor/i.test(t)) return 'Se pagó a una firma que no es la de menor cotización.';
      return 'Verificar la adjudicación a la menor cotización.';
    }
    case 'V3': {
      if (/227/.test(t) && /constancia|bien de uso/i.test(t) && !/activo fijo/i.test(t)) return 'Código 227: falta la constancia de que no es un bien de uso.';
      if (/activo fijo|act\.? fijo/i.test(t)) return 'El bien es un activo fijo: corresponde el código 200/202.';
      const cod = primero(t, /c[oó]digo (\d{3})/i);
      return cod ? `Revisar el código de gasto ${cod}.` : 'Revisar el código de gasto.';
    }
    case 'V4': {
      const falta = primero(t, /requiere ([^.;|]+?) -? ?FALTA/i);
      if (falta) return `Falta la autorización de ${falta.replace(/\s*\([^)]*\)/g, '').split(' o ')[0]}.`;
      const sin = primero(t, /sin (?:la firma de )?([A-ZÁÉÍÓÚ][\wáéíóúñ ]+?)(?:[.,;]|$)/);
      if (sin && /FALTA|sin /i.test(t)) return `Falta la firma de ${sin}.`;
      return 'Verificar las firmas del PIMyS.';
    }
    case 'V6': {
      const m = t.match(new RegExp(`(${$})[^$]*?(?:SAP|registra)[^$]*?(${$})`, 'i'));
      if (m && !/falta/i.test(t)) return `El importe de la factura (${m[1]}) no coincide con el del SAP (${m[2]}).`;
      if (/nota/i.test(t) && /PIMyS/.test(t)) return 'El importe del PIMyS no coincide con la nota del banco.';
      return 'Verificar el importe total de la factura.';
    }
    case 'V7': {
      if (/no coincide|distint|difiere/i.test(t)) {
        const f = primero(t, /factura:?\s*([0-9A-Z-]{6,})/i);
        const s = primero(t, /SAP:?\s*([0-9A-Z-]{6,})/i);
        return f && s ? `El N° de factura (${f}) no coincide con el cargado en el SAP (${s}).` : 'El N° de factura no coincide con el cargado en el SAP.';
      }
      return 'Verificar el N° de factura.';
    }
    case 'V8': {
      if (/CONTROL DE TERCEROS/i.test(T)) {
        const titular = primero(t, /cuenta de [\d-]+ \(([^)]+)\)/i);
        return `Transferencia a una cuenta de otro titular${titular ? ` (${titular})` : ''}: adjuntar la constancia de cotitularidad.`;
      }
      if (/falta ARCA|falta la constancia/i.test(t)) return 'Falta la constancia ARCA del proveedor.';
      return 'El CUIT del proveedor no coincide en todos los comprobantes.';
    }
    case 'V9': {
      if (/falta la constancia|no se encontr/i.test(t)) return 'Falta la constancia ARCA.';
      if (/fuera de la vigencia/i.test(t)) return 'La constancia ARCA no está vigente a la fecha de pago.';
      return 'Verificar la vigencia de la constancia ARCA.';
    }
    case 'V10': {
      if (/letras/i.test(t)) return 'El importe en letras del recibo no coincide con el importe en números.';
      const m = t.match(new RegExp(`transferido \\(?(${$})\\)? no coincide[^$]*?(${$})`, 'i'));
      if (m) return `El importe transferido (${m[1]}) no coincide con el total del SAP menos retenciones.`;
      if (/mismo comprobante|dos veces|repetid/i.test(t)) return 'El comprobante de pago está adjuntado dos veces.';
      if (/recibo/i.test(t)) return 'Revisar el recibo: no se lee el importe pagado.';
      if (/vale/i.test(t)) return 'Revisar los vales: falta el total o no suman la factura.';
      return 'Verificar el comprobante de pago.';
    }
    case 'V11': {
      const quien = primero(t, /FIRMA NO HABILITADA:\s*([^—-]+?\s*-\s*[^—]+?)\s*—/i) || primero(t, /Sello del vale:\s*([^—]+?)\s*—/i);
      if (/sello/i.test(t)) return `El sello del vale${quien ? ` (${quien})` : ''} no es de un responsable habilitado.`;
      return `${quien ? nombre(quien) : 'El Responsable de FF'} firma sin estar habilitado para este fondo.`;
    }
    case 'V12': {
      const planilla = primero(t, /planilla de SAP (\d+)/i);
      const pimys = primero(t, /PIMyS:\s*([\d, ]+)/i);
      if (planilla) return `El móvil de la planilla de Movilidades (${planilla}) no coincide con el del PIMyS${pimys ? ` (${pimys.trim()})` : ''}.`;
      if (/No se encontr/i.test(t)) return 'Falta la planilla de Movilidades del SAP.';
      return 'Verificar el N° de móvil en la planilla de Movilidades.';
    }
    case 'V13': {
      if (/sin el detalle/i.test(t)) return 'Falta el detalle de lo pedido en la hoja 2 del PIMyS.';
      const faltan = primero(t, /no se encontraron en la factura:?\s*(.+)$/i);
      if (faltan) return corto(`En la factura no figura lo pedido en el PIMyS: ${faltan.replace(/\.$/, '')}.`);
      const difs = primero(t, /PIMyS:\s*(.+)$/i) || primero(t, /factura[^:]*:\s*(.+)$/i);
      return corto(`Lo facturado no coincide con lo pedido en el PIMyS${difs ? `: ${difs.replace(/\.$/, '')}` : ''}.`);
    }
    case 'V14': return 'El Balance de Inversión no cuadra.';
    case 'V15': return /falta/i.test(t) ? 'Verificar el total del Libro Diario.' : 'La rendición no coincide con el Libro Diario.';
    case 'V16': {
      const dif = primero(t, new RegExp(`diferencia de (${$})`, 'i'));
      return `No coinciden el Balance, el Libro Diario y la suma de los pagos${dif ? ` (diferencia de ${dif})` : ''}.`;
    }
    case 'V17': case 'REPETIDO': {
      const m = t.match(/(PIMyS|factura)\s+([0-9A-Z-]+)[^.]*?en (\d+) pagos/i);
      if (m) return `${m[1] === 'PIMyS' ? 'El PIMyS' : 'La factura'} ${m[2]} está adjuntado en ${m[3]} pagos.`;
      return corto(`Documentación repetida: ${t.replace(/^(Documentaci[oó]n repetida|Se adjunto documentacion mas de una vez):?\s*/i, '')}`);
    }
    case 'D1': {
      const falta = primero(t, /(?:falta|esta)\s+(.+?)(?:\.\s*Presentes|$)/i);
      return corto(`Falta documentación de la devolución${falta ? `: ${falta.replace(/\.$/, '')}` : ''}.`);
    }
    case 'D2': return 'Verificar el importe de la devolución.';
    case 'D3': return 'Verificar el beneficiario de la devolución (DNI o CUIT).';
    case 'D4': return 'Verificar el CBU de la devolución.';
  }
  return corto(t);
}
