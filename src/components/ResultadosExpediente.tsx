import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Copy, Download, Eye, FileSpreadsheet } from 'lucide-react';
import { AUTORIZACIONES_POR_CODIGO } from '../lib/authorizations';
import { cn, formatCurrency } from '../lib/utils';
import type { AuditResult, PaymentData } from '../lib/gemini';
import { formatHistoryTitle, hasAccountingCode, renderBold, safeText, toSentenceCase } from '../lib/formato';
import { destacarDatos } from '../lib/destacar';
import {
  estadoGeneral, peorEstado, validacionesDeExpediente, validacionesDePago, type ValidacionVista,
} from '../lib/hallazgos';
import {
  BotonCopiar, Clave, EstadoBadge, Etiqueta, Panel, Punto, TiraValidaciones, TituloSeccion, boton,
  type Estado,
} from './ui';

// Pantalla de un expediente auditado. La usan la auditoria con IA (resultado
// de Gemini) y "Expedientes auditados" (resultado leido del Google Sheet).
// Orden: identidad y estado, resumen, avisos, pagos y controles del
// expediente. Las acciones propias de la auditoria con IA
// (nueva auditoria, planillas, informe) son opcionales.
export interface ResultadosExpedienteProps {
  result: AuditResult | null;
  expandedPayment: number | null;
  setExpandedPayment: (idx: number | null) => void;
  etiqueta?: string;
  /** Titulo de la pantalla; si falta, sale del fondo fijo del resultado. */
  titulo?: string;
  /** Estado del expediente segun el lector (OK, REVISAR, ERROR). */
  estadoExpediente?: string;
  /** Acciones del encabezado, a la izquierda de las propias (documentos, descargas). */
  acciones?: React.ReactNode;
  onNuevaAuditoria?: () => void;
  onViewPdf?: (fileIdx: number, pageNum?: number, validacion?: string) => void;
  onIrRevisiva?: () => void;
  /** Descarga la planilla revisiva ya completa con los datos de la auditoria. */
  onDescargarRevisiva?: () => void;
  onIrPlanilla?: () => void;
  informeTexto?: string;
}

/** Texto de una observacion: respeta los saltos de linea y las **negritas**.
 *  Con `clave` (V1, V6…), el dato a controlar de esa validacion va en negrita. */
function Observacion({ texto, clave, className }: { texto: string; clave?: string; className?: string }) {
  const lineas = (texto || '').split('\n');
  return (
    <p className={cn('text-sm text-tinta-2 min-w-0 break-words', className)}>
      {clave && !(texto || '').includes('**')
        ? destacarDatos(clave, texto || '')
        : lineas.map((linea, i) => (
          <React.Fragment key={i}>
            {renderBold(linea)}
            {i < lineas.length - 1 && <br />}
          </React.Fragment>
        ))}
    </p>
  );
}

function BotonVer({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={boton.icono}
    >
      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}

/** Renglon de una validacion: estado, clave, titulo, observacion y acceso al PDF. */
function ValidacionFila({ v, accion, pie, destacar }: {
  v: ValidacionVista; accion?: React.ReactNode; pie?: React.ReactNode; destacar?: boolean; key?: React.Key;
}) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-2 border-b border-linea-suave last:border-b-0">
      <div className="w-[4.5rem] shrink-0 pt-px"><EstadoBadge estado={v.estado} /></div>
      <div className="min-w-0 flex-1 @3xl:flex @3xl:items-start @3xl:gap-4">
        <div className="@3xl:w-[15.625rem] shrink-0 flex items-baseline gap-2 min-w-0">
          <Clave className="px-0 shrink-0">{v.id}</Clave>
          <span className="min-w-0">
            <span className="font-medium text-tinta">{v.titulo}</span>
            {pie}
          </span>
        </div>
        <Observacion texto={v.observaciones} clave={destacar ? v.id : undefined} className={cn('flex-1 mt-0.5 @3xl:mt-0', v.estado !== 'ok' && 'text-tinta')} />
      </div>
      {accion ?? <span className="w-[1.625rem] shrink-0" aria-hidden="true" />}
    </div>
  );
}

/** Aviso que pide una accion o un control: borde, punto de estado y texto. */
function Aviso({ estado, titulo, children }: { estado: Estado; titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-linea rounded-[0.5rem] bg-superficie caja">
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <Punto estado={estado} className="mt-[0.4375rem]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-tinta">{titulo}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

// Código 226: firma del Jefe Administrativo de la sucursal de origen
// (lib/authorizations). La zona se reconoce por palabras enteras: 'VERA' no
// es parte de 'PRIMAVERA'.
const ZONAS_226 = AUTORIZACIONES_POR_CODIGO.find(a => a.codigos.includes('226'))?.zonas || [];
const CLAVES_ZONA: Record<string, RegExp> = {
  Rafaela: /\b(RAFAELA|CHIANALINO|MARIA JUANA|NORTE)\b/,
  Noroeste: /\b(NOROESTE|ARGANARAZ|CERES|SUNCHALES|CRISTOBAL|GUILLERMO|TOSTADO)\b/,
  Oeste: /\b(OESTE|ROSTAGNO|TREBOL|ROSAS|JORGE|CANADA DE GOMEZ)\b/,
  Reconquista: /\b(RECONQUISTA|CORGNIALI|VILLA OCAMPO|VERA|CALCHAQUI)\b/,
};
function zonaDe(texto: string) {
  const t = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return ZONAS_226.find(z => CLAVES_ZONA[z.zona]?.test(t));
}

export function ResultadosExpediente({
  result,
  expandedPayment,
  setExpandedPayment,
  etiqueta = 'Auditoría completada',
  titulo,
  estadoExpediente,
  acciones,
  onNuevaAuditoria,
  onViewPdf,
  onIrRevisiva,
  onDescargarRevisiva,
  onIrPlanilla,
  informeTexto,
}: ResultadosExpedienteProps) {
  const [copiedInforme, setCopiedInforme] = useState(false);
  const copiarInforme = () => {
    navigator.clipboard.writeText(informeTexto || '').then(() => {
      setCopiedInforme(true);
      setTimeout(() => setCopiedInforme(false), 2000);
    });
  };

  const payments = result?.payments || [];
  const modo = result?.mode || 'Expedientes';
  const delExpediente = useMemo(() => validacionesDeExpediente(result, estadoExpediente), [result, estadoExpediente]);
  const estado = estadoGeneral(result, estadoExpediente);

  // Cuenta de validaciones por estado: pagos y expediente.
  const cuenta = useMemo(() => {
    const todas = [...payments.flatMap(p => validacionesDePago(p, modo)), ...delExpediente];
    return {
      ok: todas.filter(v => v.estado === 'ok').length,
      revisar: todas.filter(v => v.estado === 'revisar').length,
      error: todas.filter(v => v.estado === 'error').length + (result?.duplicados?.length || 0),
    };
  }, [payments, modo, delExpediente, result?.duplicados]);

  const computedTotal = payments.reduce((acc, p) => acc + (p && typeof p.amount === 'number' && !isNaN(p.amount) ? p.amount : 0), 0);
  const totalImporte = typeof result?.totalAmount === 'number' && !isNaN(result.totalAmount) && result.totalAmount > 0
    ? result.totalAmount : computedTotal;

  // El expediente tiene errores (igual que antes del rediseño): con errores
  // no se ofrece la planilla revisiva.
  const hasErrors = payments.some(p => p?.validations?.some(v => v?.status === 'fail'))
    || result?.balance_inversion?.validacion_v14?.resultado === 'error'
    || result?.balance_inversion?.conciliacion_total?.coinciden === false
    || (result?.duplicados?.length || 0) > 0
    || !!result?.validacionesExpediente?.some(v => v.status === 'fail');

  const tituloPantalla = titulo
    || (result?.fondoFijoNumero
      ? (/^ff\b/i.test(result.fondoFijoNumero) ? result.fondoFijoNumero : `Fondo fijo ${result.fondoFijoNumero}`)
      : modo === 'Viáticos' ? 'Control de viáticos' : 'Resultado de la auditoría');

  const codigoPatrimonio = (payment: PaymentData) => {
    const v3 = payment?.validations?.find(val => val?.id === 'v3');
    return ['200', '202'].find(c => v3 && hasAccountingCode(v3.observations, c)) || null;
  };
  const pagosPatrimonio = payments.filter(p => codigoPatrimonio(p));
  const codigosPatrimonio = [...new Set(pagosPatrimonio.map(codigoPatrimonio))].sort().join(' y ');
  const pagos226 = payments.filter(p => {
    const v3 = p?.validations?.find(val => val?.id === 'v3');
    return v3 ? hasAccountingCode(v3.observations, '226') : false;
  });
  const conCodigos = payments.some(p => p?.codigos?.length);
  const balance = result?.balance_inversion && modo !== 'Viáticos' ? result.balance_inversion : null;
  const v14 = delExpediente.find(v => v.id === 'V14');
  const v16 = delExpediente.find(v => v.id === 'V16');
  const otras = delExpediente.filter(v => v.id !== 'V14' && v.id !== 'V16');

  return (
    <div className="@container">
      {/* Identidad y estado */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-tinta">{tituloPantalla}</h1>
            <EstadoBadge estado={estado} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-5 text-tinta-2">
            {[
              result?.agenciaSucursal && <span>{formatHistoryTitle(result.agenciaSucursal)}</span>,
              result?.expedienteNumero && (
                <span className="inline-flex items-center gap-0.5">
                  Exp. <span className="font-mono text-tinta ml-1">{result.expedienteNumero}</span>
                  <BotonCopiar texto={result.expedienteNumero} rotulo="Copiar número de expediente" />
                </span>
              ),
              result?.expedienteFecha && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="cifras">{result.expedienteFecha}</span>
                  <BotonCopiar texto={result.expedienteFecha} rotulo="Copiar fecha de expediente" />
                </span>
              ),
              result?.responsable && <span>Responsable: {formatHistoryTitle(result.responsable)}</span>,
              etiqueta && <span className="text-tenue">{etiqueta}</span>,
            ].filter(Boolean).map((parte, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true" className="text-tenue-2">·</span>}
                {parte}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acciones}
          {onNuevaAuditoria && (
            <button type="button" onClick={onNuevaAuditoria} className={boton.secundario}>Nueva auditoría</button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-5 grid grid-cols-6 @2xl:grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-px border border-linea rounded-[0.5rem] bg-linea overflow-hidden caja">
        <Cifra rotulo={modo === 'Viáticos' ? 'Viáticos' : 'Pagos'} valor={String(payments.length)} className="col-span-2" />
        <Cifra
          rotulo="Importe total"
          valor={formatCurrency(totalImporte)}
          className="col-span-4"
          accion={<BotonCopiar texto={formatCurrency(totalImporte)} rotulo="Copiar importe total" className="w-6 h-6" />}
        />
        <Cifra rotulo="Error" valor={String(cuenta.error)} tono={cuenta.error ? 'error' : undefined} className="col-span-2" />
        <Cifra rotulo="Revisar" valor={String(cuenta.revisar)} tono={cuenta.revisar ? 'revisar' : undefined} className="col-span-2" />
        <Cifra rotulo="OK" valor={String(cuenta.ok)} className="col-span-2" />
      </div>

      {/* Avisos que piden una accion */}
      {(pagosPatrimonio.length > 0 || pagos226.length > 0
        || (payments.length === 0 && !!result?.totalAmount && result.totalAmount > 0)) && (
        <div className="mt-4 flex flex-col gap-3">
          {payments.length === 0 && !!result?.totalAmount && result.totalAmount > 0 && (
            <Aviso estado="revisar" titulo="La IA detectó el expediente pero no pudo analizar los pagos">
              <p className="text-sm text-tinta-2 mt-0.5">
                Se extrajo un importe total de <strong className="font-semibold text-tinta">{formatCurrency(result.totalAmount)}</strong>, pero
                el modelo no devolvió los pagos. Suele pasar con demasiados documentos en una sola llamada o cuando la respuesta se corta.
              </p>
              <ul className="text-sm text-tinta-2 list-disc pl-4 mt-1.5 space-y-0.5">
                <li>Probá con el modelo <strong className="font-semibold text-tinta">Pro</strong>, que admite más contexto.</li>
                <li>Auditá cada pago por separado con «Auditoría rápida».</li>
                <li>Reducí la cantidad de archivos e intentá de nuevo.</li>
              </ul>
            </Aviso>
          )}

          {pagosPatrimonio.length > 0 && (
            <Aviso estado="revisar" titulo="Enviar el expediente a Patrimonio para el alta del bien de uso">
              <p className="text-sm text-tinta-2 mt-0.5">
                Hay imputaciones con el código <strong className="font-semibold text-tinta">{codigosPatrimonio}</strong> (alta de bien de uso).
              </p>
              <div className="mt-2 border-t border-linea-suave">
                {pagosPatrimonio.map((p, idx) => (
                  <div key={idx} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 border-b border-linea-suave last:border-b-0 text-sm">
                    <span className="font-medium text-tinta">{p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}</span>
                    <span className="text-tenue">PIMyS <span className="font-mono text-xs">{p.orderNumber || 'S/N'}</span> · código {codigoPatrimonio(p)}</span>
                    {p.amount !== undefined && p.amount > 0 && <span className="ml-auto cifras">{formatCurrency(p.amount)}</span>}
                  </div>
                ))}
              </div>
            </Aviso>
          )}

          {pagos226.length > 0 && (
            <Aviso estado="revisar" titulo="Código 226: controlar la firma del Jefe Administrativo">
              <p className="text-sm text-tinta-2 mt-0.5">
                Las compras del código <strong className="font-semibold text-tinta">226</strong> (mantenimiento de maquinarias menores) las autoriza
                el Jefe Administrativo de la sucursal:{' '}
                {ZONAS_226.map((z, i) => (
                  <React.Fragment key={z.zona}>
                    {i > 0 && '; '}
                    {z.zona} ({z.alcance}), <strong className="font-medium text-tinta">{z.firmante}</strong>
                  </React.Fragment>
                ))}.
              </p>
              <div className="mt-2 border-t border-linea-suave">
                {pagos226.map((p, idx) => {
                  // La zona sale primero de la agencia del expediente y, si no
                  // la nombra, del texto del pago.
                  const generalBranchText = result?.agenciaSucursal || '';
                  const paymentBranchText = (p?.libroDiarioText || '') + ' ' + (p?.providerName || '');
                  const zona226 = zonaDe(generalBranchText) || zonaDe(generalBranchText + ' ' + paymentBranchText);
                  const expectedSigner = zona226?.firmante || 'Jefe Administracion';
                  const zone = zona226?.zona || 'No identificada';

                  const v4Val = p?.validations?.find(val => (val as any)?.code?.toLowerCase() === 'v4' || val?.id?.toLowerCase() === 'v4' || (val as any)?.code?.toLowerCase() === 'validation_v4');
                  const v4Obs = (v4Val?.observations || '').toUpperCase();
                  const cleanSigner = expectedSigner.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
                  // Firma del Jefe Administrativo, segun V4: si V4 dice que falta
                  // o dio Error, es Error (nunca "verificada" porque la
                  // observacion nombre al que falta); sin V4 concluyente, Revisar.
                  const falta = v4Obs.includes('FALTA');
                  const nombrado = v4Obs.includes(expectedSigner.toUpperCase()) || v4Obs.includes(cleanSigner);
                  const firma: Estado = !falta && (nombrado || v4Val?.status === 'pass') ? 'ok'
                    : falta || v4Val?.status === 'fail' ? 'error'
                    : 'revisar';
                  const rotuloFirma = firma === 'ok' ? 'Firma verificada'
                    : firma === 'error' ? `Falta la firma de ${expectedSigner}`
                    : 'Revisar la firma';

                  return (
                    <div key={idx} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 border-b border-linea-suave last:border-b-0 text-sm">
                      <span className="font-medium text-tinta">{p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}</span>
                      <span className="text-tenue">
                        PIMyS <span className="font-mono text-xs">{p.orderNumber || 'S/N'}</span> · zona {zone} · requiere {expectedSigner}
                      </span>
                      <span className="ml-auto flex items-center gap-3">
                        {p.amount !== undefined && p.amount > 0 && <span className="cifras">{formatCurrency(p.amount)}</span>}
                        <EstadoBadge estado={firma}>{rotuloFirma}</EstadoBadge>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Aviso>
          )}
        </div>
      )}

      {/* Indice de rotacion: con los avisos, antes de los pagos */}
      {result?.rotacion && <IndiceRotacion rotacion={result.rotacion} />}

      {/* Planilla revisiva lista (auditoria con IA sin errores) */}
      {payments.length > 0 && !hasErrors && (onIrRevisiva || onIrPlanilla) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-linea rounded-[0.5rem] bg-superficie caja px-3.5 py-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Punto estado="ok" className="mt-[0.4375rem]" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-tinta">La planilla revisiva está lista</h3>
              <p className="text-sm text-tinta-2 max-w-xl">
                El expediente no tiene errores. {onDescargarRevisiva
                  ? 'La planilla se completa con los datos de la auditoría: descargala o revisala antes en Planillas.'
                  : 'Completá los campos y descargá el informe en Planillas.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onDescargarRevisiva && (
              <button type="button" onClick={onDescargarRevisiva} className={boton.primario}>
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Descargar planilla revisiva
              </button>
            )}
            {onIrRevisiva && (
              <button type="button" onClick={onIrRevisiva} className={onDescargarRevisiva ? boton.secundario : boton.primario}>
                Ver planilla revisiva
              </button>
            )}
            {onIrPlanilla && (
              <button type="button" onClick={onIrPlanilla} className={boton.secundario}>
                <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                Planilla control
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagos */}
      <TituloSeccion cantidad={payments.length}>{modo === 'Viáticos' ? 'Viáticos' : 'Pagos'}</TituloSeccion>
      {payments.length === 0 ? (
        <Panel><p className="px-3.5 py-6 text-sm text-tenue">El resultado no trae pagos.</p></Panel>
      ) : (
        <Panel>
          <div className={cn(COLUMNAS_PAGO, conCodigos && COLUMNAS_PAGO_CODIGO, 'h-8 px-3.5 border-b border-linea text-xs text-tenue')}>
            <span className="hidden @lg:block">{modo === 'Expedientes' ? 'PIMyS' : 'N°'}</span>
            {conCodigos && <span className="hidden @2xl:block">Cód.</span>}
            <span>{modo === 'Viáticos' ? 'Agente' : 'Proveedor'}</span>
            <span className="text-right">Importe</span>
            <span className="hidden @3xl:block">Validaciones</span>
            <span>Estado</span>
            <span />
          </div>
          {payments.map((payment, idx) => (
            <PaymentRow
              key={idx}
              idx={idx}
              payment={payment}
              isExpanded={expandedPayment === idx}
              onToggle={() => setExpandedPayment(expandedPayment === idx ? null : idx)}
              mode={modo}
              conCodigos={conCodigos}
              onViewPdf={onViewPdf}
            />
          ))}
        </Panel>
      )}

      {/* Controles del expediente */}
      {(balance || otras.length > 0 || (result?.duplicados?.length || 0) > 0) && (
        <TituloSeccion>Expediente</TituloSeccion>
      )}

      {balance && (
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-4 items-start">
          <Panel>
            <div className="flex items-center gap-2 h-[2.375rem] px-3.5 border-b border-linea">
              <h3 className="flex-1 text-sm font-semibold text-tinta">Balance de inversión</h3>
              {v14 && <><Clave className="px-0">V14</Clave><EstadoBadge estado={v14.estado}>{balance.validacion_v14?.resultado === 'info' ? 'Sin balance' : undefined}</EstadoBadge></>}
            </div>
            {!balance.presente ? (
              <p className="px-3.5 py-3 text-sm text-tenue">La planilla de Balance de Inversión no fue adjuntada.</p>
            ) : (
              <>
                <Dato rotulo="Monto fijo asignado" valor={formatCurrency(balance.monto_asignado || 0)} />
                {(balance.rendiciones_pendientes || []).map((r, i) => (
                  <Dato key={i} rotulo={`Rendición pendiente N° ${r.numero}`} valor={formatCurrency(r.importe)} />
                ))}
                {(balance.rendiciones_pendientes || []).length === 0 && (
                  <Dato rotulo="Rendiciones pendientes" valor="Ninguna" />
                )}
                <Dato rotulo="Total pendiente" valor={formatCurrency(balance.total_pendiente || 0)} />
                <Dato rotulo="Saldo en banco declarado" valor={formatCurrency(balance.saldo_banco_declarado || 0)} />
                <Dato rotulo="Saldo en banco calculado" valor={formatCurrency(balance.saldo_banco_calculado || 0)} fuerte />
              </>
            )}
            {balance.validacion_v14?.detalle && (
              <Observacion
                texto={balance.validacion_v14.detalle}
                className={cn('px-3.5 py-2 text-xs border-t border-linea-suave', v14 && v14.estado !== 'ok' ? 'text-tinta' : 'text-tenue')}
              />
            )}
          </Panel>

          {balance.conciliacion_total && (
            <Panel>
              <div className="flex items-center gap-2 h-[2.375rem] px-3.5 border-b border-linea">
                <h3 className="flex-1 text-sm font-semibold text-tinta">Conciliación del importe a reponer</h3>
                {v16 && <><Clave className="px-0">V16</Clave><EstadoBadge estado={v16.estado}>{v16.estado === 'ok' ? 'Coinciden' : 'No coinciden'}</EstadoBadge></>}
              </div>
              <Dato rotulo="Balance de inversión" valor={balance.conciliacion_total.importe_balance ? formatCurrency(balance.conciliacion_total.importe_balance) : '—'} />
              <Dato rotulo="Libro Diario · total banco a reponer" valor={balance.conciliacion_total.importe_libro_diario ? formatCurrency(balance.conciliacion_total.importe_libro_diario) : '—'} />
              <Dato rotulo="Suma de los pagos bancarios" valor={balance.conciliacion_total.suma_pagos_bancarios ? formatCurrency(balance.conciliacion_total.suma_pagos_bancarios) : '—'} />
              {balance.conciliacion_total.detalle && (
                <Observacion
                  texto={safeText(balance.conciliacion_total.detalle)}
                  className={cn('px-3.5 py-2 text-xs border-t border-linea-suave', v16 && v16.estado !== 'ok' ? 'text-tinta' : 'text-tenue')}
                />
              )}
            </Panel>
          )}
        </div>
      )}

      {result?.duplicados && result.duplicados.length > 0 && (
        <Panel className="mt-4">
          <div className="flex items-center gap-2 h-[2.375rem] px-3.5 border-b border-linea">
            <h3 className="flex-1 text-sm font-semibold text-tinta">Documentación repetida</h3>
            <EstadoBadge estado="error" />
          </div>
          <p className="px-3.5 py-2 text-xs text-tenue border-b border-linea-suave">
            Hay documentación adjuntada más de una vez. Verificá que no se haya contabilizado dos veces la misma operación ni omitido un pago distinto del mismo proveedor.
          </p>
          {result.duplicados.map((d, idx) => (
            <div key={idx} className="px-3.5 py-2 border-b border-linea-suave last:border-b-0">
              <p className="font-mono text-xs font-medium text-tinta">{safeText(d.identificador) || '—'}</p>
              {d.motivo && <p className="text-sm text-tinta-2">{safeText(d.motivo)}</p>}
              {d.paginas && <p className="text-xs text-tenue">Ubicación: {safeText(d.paginas)}</p>}
            </div>
          ))}
        </Panel>
      )}

      {otras.length > 0 && (
        <Panel className="mt-4">
          {otras.map(v => <ValidacionFila key={v.id} v={v} />)}
        </Panel>
      )}

      {/* Informe para copiar (auditoria con IA) */}
      {informeTexto !== undefined && (
        <div id="informe-copiable">
          <TituloSeccion detalle="Resumen de los desvíos para copiar y enviar al responsable.">Informe de auditoría</TituloSeccion>
          <Panel>
            <div className="flex items-center justify-end h-[2.375rem] px-2 border-b border-linea">
              <button type="button" onClick={copiarInforme} className={cn(boton.fantasma, 'h-[1.625rem] text-xs font-medium')}>
                {copiedInforme
                  ? <><Check className="w-3.5 h-3.5 text-acento" aria-hidden="true" /> Copiado</>
                  : <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copiar informe</>}
              </button>
            </div>
            <pre className="px-3.5 py-3 font-mono text-xs leading-[1.125rem] text-tinta-2 bg-hundida whitespace-pre-wrap overflow-x-auto max-h-[25rem]">
              {informeTexto}
            </pre>
          </Panel>
        </div>
      )}
    </div>
  );
}

// Columnas de la tabla de pagos. Angosta (con el PDF abierto al lado): N°,
// proveedor, importe y estado. Mas ancha: suma el codigo y la tira.
const COLUMNAS_PAGO = 'grid items-center gap-x-3 @lg:gap-x-3.5 grid-cols-[minmax(0,1fr)_auto_4.625rem_1rem] @lg:grid-cols-[4rem_minmax(0,1fr)_auto_4.875rem_2.75rem] @3xl:grid-cols-[4.5rem_minmax(0,1fr)_7.75rem_9.375rem_4.875rem_2.75rem]';
const COLUMNAS_PAGO_CODIGO = '@2xl:grid-cols-[4rem_2.75rem_minmax(0,1fr)_auto_4.875rem_2.75rem] @3xl:grid-cols-[4.5rem_2.75rem_minmax(0,1fr)_7.75rem_9.375rem_4.875rem_2.75rem]';

function Cifra({ rotulo, valor, tono, accion, className }: {
  rotulo: string; valor: string; tono?: 'error' | 'revisar'; accion?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('px-4 py-3 min-w-0 bg-superficie @2xl:col-span-1', className)}>
      <div className="text-xs text-tenue">{rotulo}</div>
      <div className={cn(
        'flex items-center gap-1 text-[1.125rem] leading-[1.625rem] font-semibold cifras',
        tono === 'error' ? 'text-error' : tono === 'revisar' ? 'text-aviso-tinta' : 'text-tinta',
      )}>
        <span className="truncate">{valor}</span>
        {accion}
      </div>
    </div>
  );
}

function Dato({ rotulo, valor, fuerte }: { rotulo: string; valor: string; fuerte?: boolean; key?: React.Key }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3.5 py-2 border-b border-linea-suave last:border-b-0 text-sm">
      <span className="text-tinta-2">{rotulo}</span>
      <span className={cn('cifras text-tinta', fuerte && 'font-medium')}>{valor}</span>
    </div>
  );
}

/** Importes para el registro del índice de rotación: los pagos que no lo
 *  afectan, separados por código, y el total de los que sí. Sumados dan el
 *  total del expediente. Cada uno con su botón de copiar. */
function IndiceRotacion({ rotacion }: { rotacion: NonNullable<AuditResult['rotacion']> }) {
  const pagos = (n: number) => `${n} pago${n !== 1 ? 's' : ''}`;
  return (
    <>
      <TituloSeccion detalle="Importes para el registro. Sumados dan el total del expediente.">Índice de rotación</TituloSeccion>
      <Panel>
        {rotacion.noAfecta.map(r => (
          <div key={r.codigo} className="grid grid-cols-[minmax(0,1fr)_auto_1.625rem] @2xl:grid-cols-[minmax(0,1fr)_5.625rem_9.375rem_1.625rem] items-center gap-x-3 min-h-[2.375rem] pl-3.5 pr-2 border-b border-linea-suave">
            <span className="min-w-0 truncate">
              <span className="font-mono text-xs text-tinta-2 mr-2">{r.codigo}</span>
              {r.concepto}
              <span className="text-xs text-tenue ml-2">no afecta el índice</span>
            </span>
            <span className="hidden @2xl:block text-tinta-2">{pagos(r.pagos)}</span>
            <span className="text-right cifras">{formatCurrency(r.importe)}</span>
            <BotonCopiar texto={formatCurrency(r.importe)} rotulo={`Copiar importe del código ${r.codigo}`} className="w-[1.625rem] h-[1.625rem]" />
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_1.625rem] @2xl:grid-cols-[minmax(0,1fr)_5.625rem_9.375rem_1.625rem] items-center gap-x-3 min-h-[2.375rem] pl-3.5 pr-2">
          <span className="font-medium">Afectan el índice</span>
          <span className="hidden @2xl:block text-tinta-2">{pagos(rotacion.pagosAfecta)}</span>
          <span className="text-right cifras font-medium">{formatCurrency(rotacion.afecta)}</span>
          <BotonCopiar texto={formatCurrency(rotacion.afecta)} rotulo="Copiar importe de los pagos que afectan el índice" className="w-[1.625rem] h-[1.625rem]" />
        </div>
        {rotacion.aviso && <p className="px-3.5 py-2 text-xs text-error border-t border-linea-suave">{rotacion.aviso}</p>}
      </Panel>
    </>
  );
}

interface PaymentRowProps {
  idx: number;
  payment: PaymentData;
  isExpanded: boolean;
  onToggle: () => void;
  mode: 'Expedientes' | 'Viáticos' | 'Rapida';
  conCodigos: boolean;
  onViewPdf?: (fileIdx: number, pageNum?: number, validacion?: string) => void;
  key?: React.Key | number | string;
}

function PaymentRow({ idx, payment, isExpanded, onToggle, mode, conCodigos, onViewPdf }: PaymentRowProps) {
  const validaciones = validacionesDePago(payment, mode);
  const estado = peorEstado(validaciones.map(v => v.estado));

  const ver = (validacion?: string) => onViewPdf?.(payment.sourceFileIdx || 0, payment.pageNumber, validacion);

  return (
    <div id={`pago-${idx}`} className="border-b border-linea-suave last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className={cn(COLUMNAS_PAGO, conCodigos && COLUMNAS_PAGO_CODIGO, 'min-h-9 px-3.5 cursor-pointer select-none hover:bg-realce transition-colors', isExpanded && 'bg-realce')}
      >
        <span className="hidden @lg:block font-mono text-xs font-medium text-tinta truncate" title={payment?.orderNumber}>{payment?.orderNumber}</span>
        {conCodigos && <span className="hidden @2xl:block font-mono text-xs text-tinta-2 truncate">{payment?.codigos?.join(' · ')}</span>}
        <span className="min-w-0 py-1.5 @lg:py-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate" title={payment?.providerName}>{toSentenceCase(payment?.providerName || '')}</span>
            {payment?.leidoPorOcr && <Etiqueta title={`Leído por OCR: ${payment.leidoPorOcr}`}>OCR</Etiqueta>}
          </span>
          <span className="@lg:hidden block font-mono text-xs text-tenue truncate">{payment?.orderNumber}</span>
        </span>
        <span className="text-right cifras">{formatCurrency(payment?.amount)}</span>
        <span className="hidden @3xl:flex items-center"><TiraValidaciones validaciones={validaciones} /></span>
        <span><EstadoBadge estado={estado} /></span>
        <span className="flex items-center justify-end gap-0.5 text-tenue">
          {payment?.pageNumber && onViewPdf
            ? <span className="hidden @lg:inline-flex"><BotonVer rotulo="Ver el PDF del pago" onClick={() => ver()} /></span>
            : null}
          <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 transition-transform duration-150', isExpanded && 'rotate-90')} aria-hidden="true" />
        </span>
      </div>

      {isExpanded && (
        <div className="bg-hundida border-t border-linea-suave @3xl:pl-[4.5rem]">
          {payment?.leidoPorOcr && (
            <p className="px-3.5 pt-2 text-xs text-tenue">Leído por OCR: {payment.leidoPorOcr}</p>
          )}
          {/* Todas las validaciones, en su orden (V1, V2…). */}
          {validaciones.map(v => (
            <ValidacionFila
              key={v.id}
              v={v}
              destacar={mode !== 'Viáticos'}
              accion={payment.pageNumber && onViewPdf ? <BotonVer rotulo={`Ver el PDF (${v.id})`} onClick={() => ver(v.id.toLowerCase())} /> : undefined}
            />
          ))}

          {/* Vales de provision (combustible, ruedas, lavado) */}
          {payment.vales && payment.vales.length > 0 && (
            <div className="px-3.5 py-2.5 border-t border-linea-suave">
              <h4 className="text-xs font-medium text-tinta-2 mb-1.5">Vales de provisión <span className="font-normal text-tenue">{payment.vales.length}</span></h4>
              <div className="border border-linea rounded-[0.375rem] bg-superficie overflow-hidden">
                {payment.vales.map((vale, i) => (
                  <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-1.5 border-b border-linea-suave last:border-b-0 text-sm">
                    <span className="font-mono text-xs font-medium text-tinta w-[5.75rem] shrink-0">Vale {vale.numero}</span>
                    <EstadoBadge estado={vale.legible ? 'ok' : 'revisar'}>{vale.legible ? 'Legible' : 'Ilegible'}</EstadoBadge>
                    {vale.textoExtraido && <span className="flex-1 min-w-[10rem] text-xs text-tenue">{vale.textoExtraido}</span>}
                    <span className={cn('ml-auto cifras', !(vale.legible && vale.precioTotal) && 'text-aviso-tinta text-xs')}>
                      {vale.legible && vale.precioTotal
                        ? formatCurrency(parseFloat(vale.precioTotal))
                        : `Letra no legible en vale N° ${vale.numero}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
