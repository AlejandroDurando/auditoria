import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Landmark,
  ScanText,
  XCircle,
} from 'lucide-react';
import { AUTORIZACIONES_POR_CODIGO } from '../lib/authorizations';
import { cn, formatCurrency } from '../lib/utils';
import { VALIDATIONS, VALIDATIONS_VIATICOS } from '../constants';
import type { AuditResult, PaymentData, ValidationResult } from '../lib/gemini';
import {
  formatHistoryTitle,
  hasAccountingCode,
  renderBold,
  safeText,
  toSentenceCase,
} from '../lib/formato';

// Pantalla de resultados de un expediente auditado ("Resultados Generales").
// La usan el auditor (resultado de Gemini) y la vista "Expedientes del lector"
// (resultado leido del Google Sheet). Las acciones propias del auditor (nueva
// auditoria, ver PDF, planillas, informe) son opcionales: si no se pasan, no
// se muestran.
export interface ResultadosExpedienteProps {
  result: AuditResult | null;
  expandedPayment: number | null;
  setExpandedPayment: (idx: number | null) => void;
  etiqueta?: string;
  onNuevaAuditoria?: () => void;
  onViewPdf?: (fileIdx: number, pageNum?: number) => void;
  onIrRevisiva?: () => void;
  /** Descarga la planilla revisiva ya completa con los datos de la auditoria. */
  onDescargarRevisiva?: () => void;
  onIrPlanilla?: () => void;
  informeTexto?: string;
}

export function ResultadosExpediente({
  result,
  expandedPayment,
  setExpandedPayment,
  etiqueta = 'Auditoría Completada',
  onNuevaAuditoria,
  onViewPdf,
  onIrRevisiva,
  onDescargarRevisiva,
  onIrPlanilla,
  informeTexto,
}: ResultadosExpedienteProps) {
  const [copiedInforme, setCopiedInforme] = useState(false);
  const [copiedExpediente, setCopiedExpediente] = useState(false);
  const [copiedFecha, setCopiedFecha] = useState(false);
  const [copiedImporte, setCopiedImporte] = useState(false);

  const copiarInforme = () => {
    navigator.clipboard.writeText(informeTexto || '').then(() => {
      setCopiedInforme(true);
      setTimeout(() => setCopiedInforme(false), 2000);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 @container"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-ok-fondo text-ok-tinta rounded-[4px] text-[10px] font-medium uppercase tracking-[0.06em]">{etiqueta}</span>
          </div>
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mt-2">Resultados Generales</h2>
        </div>
        {onNuevaAuditoria && (
        <button 
          onClick={onNuevaAuditoria}
          className="py-[7px] px-[13px] bg-marca text-white text-[13px] font-medium rounded-[7px] hover:bg-marca-hover transition-all outline-none whitespace-nowrap cursor-pointer border-none shadow-none"
        >
          Nueva Auditoría
        </button>
        )}
      </div>

      {/* Metadata Banner displaying Extracted Fields */}
      {result && (result.expedienteNumero || result.expedienteFecha || result.fondoFijoNumero || result.agenciaSucursal) && (
        <div className="bg-superficie border-[0.5px] border-linea rounded-[12px] p-6 flex flex-col @2xl:flex-row gap-6 @2xl:items-center caja">
          {result.expedienteFecha && (
            <div className="flex-1 min-w-[130px]">
              <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Fecha Expediente</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-700 font-mono">
                  {result.expedienteFecha}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.expedienteFecha || '');
                    setCopiedFecha(true);
                    setTimeout(() => setCopiedFecha(false), 2000);
                  }}
                  className="p-1 text-slate-400 hover:text-acento hover:bg-hundida-2 rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0"
                  title="Copiar fecha de expediente"
                >
                  {copiedFecha ? (
                    <Check className="w-3.5 h-3.5 text-acento" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
          {result.expedienteNumero && (
            <div className="flex-1 min-w-[130px] @2xl:border-l @2xl:border-linea @2xl:pl-6">
              <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">N° de Expediente</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-tinta font-mono">
                  {result.expedienteNumero}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.expedienteNumero || '');
                    setCopiedExpediente(true);
                    setTimeout(() => setCopiedExpediente(false), 2000);
                  }}
                  className="p-1 text-slate-400 hover:text-acento hover:bg-hundida-2 rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0"
                  title="Copiar número de expediente"
                >
                  {copiedExpediente ? (
                    <Check className="w-3.5 h-3.5 text-acento" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
          {result.fondoFijoNumero && (
            <div className="flex-1 min-w-[130px] @2xl:border-l @2xl:border-linea @2xl:pl-6">
              <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Fondo Fijo</span>
              <span className="text-sm font-medium text-acento">
                {result.fondoFijoNumero}
              </span>
            </div>
          )}
          {result.agenciaSucursal && (
            <div className="flex-1 min-w-[180px] @2xl:border-l @2xl:border-linea @2xl:pl-6">
              <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-tenue block mb-1">Origen / Agencia / Sucursal</span>
              <span className="text-sm font-medium text-slate-800">
                {formatHistoryTitle(result.agenciaSucursal)}
              </span>
            </div>
          )}
        </div>
      )}

      {(() => {
        const payments = result?.payments || [];
        const totalPagos = payments.length;
        const computedTotal = payments.reduce((acc, p) => acc + (p && typeof p.amount === 'number' && !isNaN(p.amount) ? p.amount : 0), 0);
        const finalTotalImporte = typeof result?.totalAmount === 'number' && !isNaN(result?.totalAmount) && result?.totalAmount > 0 ? result?.totalAmount : computedTotal;
        
        const hasErrors = payments.some(p => p?.validations?.some(v => v?.status === 'fail')) || result?.balance_inversion?.validacion_v14?.resultado === 'error' || result?.balance_inversion?.conciliacion_total?.coinciden === false || (result?.duplicados?.length || 0) > 0 || !!result?.validacionesExpediente?.some(v => v.status === 'fail');
        const hasWarnings = payments.some(p => p?.validations?.some(v => v?.status === 'warning')) || !!result?.validacionesExpediente?.some(v => v.status === 'warning');
        
        return (
          <div className="grid grid-cols-1 @3xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-superficie p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pagos Analizados</p>
              <p className="text-2xl font-bold text-slate-900">{totalPagos}</p>
            </div>
            <div className="bg-superficie p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Importe Total</p>
              <div className="flex items-center gap-1.5 justify-between">
                <p className="text-xl @5xl:text-2xl font-mono font-bold text-slate-900 min-w-0 break-words">{formatCurrency(finalTotalImporte)}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(formatCurrency(finalTotalImporte));
                    setCopiedImporte(true);
                    setTimeout(() => setCopiedImporte(false), 2000);
                  }}
                  className="p-1 text-slate-400 hover:text-acento hover:bg-hundida-2 rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center shrink-0 animate-fade-in"
                  title="Copiar importe total"
                >
                  {copiedImporte ? (
                    <Check className="w-3.5 h-3.5 text-acento" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            {hasErrors ? (
              <div className="bg-error-suave p-6 rounded-r-[12px] rounded-l-none border-t-[0.5px] border-b-[0.5px] border-r-[0.5px] border-linea border-l-[3px] border-l-error-acento shadow-none flex flex-col justify-between transition-all">
                <div>
                  <p className="text-xs font-semibold text-error uppercase tracking-widest mb-3">Estado General</p>
                  <div className="flex items-center gap-1.5 text-error">
                    <AlertTriangle className="w-[16px] h-[16px] text-error shrink-0" />
                    <span className="text-[15px] font-medium leading-none">Con errores</span>
                  </div>
                </div>
                <p className="text-[11px] text-error leading-none mt-2">
                  {(() => {
                    const erroredCount = payments.filter(p => p?.validations?.some(v => v?.status === 'fail')).length || 1;
                    return `${erroredCount} pago${erroredCount !== 1 ? 's' : ''} requiere${erroredCount !== 1 ? 'n' : ''} revisión`;
                  })()}
                </p>
              </div>
            ) : (
              <div className="bg-superficie p-6 rounded-[12px] border-[0.5px] border-linea flex flex-col justify-between gap-4 transition-all caja">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Estado General</p>
                <div className={cn(
                  "inline-flex items-center justify-center font-bold w-fit",
                  hasWarnings ? "text-amber-500" : "text-acento"
                )}>
                  {hasWarnings ? (
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-medium">Con observaciones</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-acento">
                      <CheckCircle2 className="w-5 h-5 text-acento shrink-0" />
                      <span className="text-sm font-medium">Excelente</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {result?.rotacion && <IndiceRotacion rotacion={result.rotacion} />}

      {(() => {
        const payments = result?.payments || [];
        if (payments.length === 0 && result?.totalAmount && result.totalAmount > 0) {
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">La IA detectó el expediente pero no pudo analizar los pagos individuales</h4>
                <p className="text-xs text-amber-800 leading-relaxed mb-3">
                  Se extrajo un importe total de <strong>{formatCurrency(result.totalAmount)}</strong>, pero el modelo no devolvió los pagos detallados.
                  Esto suele ocurrir cuando hay demasiados documentos para procesar en una sola llamada, o cuando la respuesta del modelo fue cortada por límite de tokens.
                </p>
                <p className="text-xs text-amber-800 font-medium mb-1">¿Qué podés hacer?</p>
                <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                  <li>Probá con el modelo <strong>Pro</strong> (más capacidad de contexto)</li>
                  <li>Dividí el expediente: auditá cada pago por separado con "Auditoría Rápida"</li>
                  <li>Reducí la cantidad de archivos adjuntos e intentá de nuevo</li>
                </ul>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {(() => {
        const payments = result?.payments || [];
        const hasErrors = payments.some(p => p?.validations?.some(v => v?.status === 'fail')) || result?.balance_inversion?.validacion_v14?.resultado === 'error' || result?.balance_inversion?.conciliacion_total?.coinciden === false || (result?.duplicados?.length || 0) > 0 || !!result?.validacionesExpediente?.some(v => v.status === 'fail');
        if (payments.length === 0 || hasErrors || (!onIrRevisiva && !onIrPlanilla)) return null;
        return (
          <div className="bg-marca-suave border border-acento/15 rounded-2xl p-6 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-6 mb-8 transition-all hover:bg-marca-suave shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-superficie rounded-xl border border-emerald-500/10 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(15,110,86,0.04)] text-acento">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-slate-900">Informe de Auditoría Revisiva Listo</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  El expediente cumple con los requisitos normativos de la EPE. {onDescargarRevisiva
                    ? 'La planilla revisiva se completa con los datos de la auditoría: descargala directo o revisala en la pestaña Revisiva.'
                    : 'Podés completar los campos y descargar el informe oficial de revisión de cuentas en la pestaña Revisiva.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col @2xl:flex-row gap-2 @3xl:self-center">
              {onDescargarRevisiva && (
              <button
                onClick={onDescargarRevisiva}
                className="bg-marca hover:bg-marca-hover text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none shadow-none"
              >
                <Download className="w-4 h-4" />
                <span>Descargar planilla revisiva</span>
              </button>
              )}
              {onIrRevisiva && (
              <button
                onClick={onIrRevisiva}
                className={cn(
                  "text-xs font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer outline-none shadow-none",
                  onDescargarRevisiva
                    ? "bg-superficie hover:bg-realce text-acento border border-acento/20"
                    : "bg-marca hover:bg-marca-hover text-white border-none"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ir a Planilla Revisiva</span>
              </button>
              )}
              {onIrPlanilla && (
              <button
                onClick={onIrPlanilla}
                className="bg-superficie border border-acento text-acento text-xs font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer outline-none shadow-none hover:bg-marca-suave"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ir a Planilla Control</span>
              </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 px-1">Detalle de Pagos ({(result?.payments || []).length})</h3>
        {(result?.payments || []).map((payment, idx) => (
          <PaymentRow 
            key={idx} 
            payment={payment} 
            isExpanded={expandedPayment === idx}
            onToggle={() => setExpandedPayment(expandedPayment === idx ? null : idx)}
            mode={result?.mode || 'Expedientes'}
            onViewPdf={onViewPdf}
          />
        ))}
      </div>

      {result?.balance_inversion && result.mode !== 'Viáticos' && (
        <div className="bg-superficie rounded-[12px] border-[0.5px] border-linea overflow-hidden transition-all caja">
          <div className="p-6 border-b-[0.5px] border-linea flex items-center gap-4">
            <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center shrink-0 caja">
              <Landmark className="w-6 h-6 text-acento" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 leading-tight">Balance de Inversión</h3>
              <p className="text-xs text-tenue mt-0.5">
                {result.balance_inversion.presente 
                  ? "Análisis del saldo y rendiciones pendientes." 
                  : "La planilla de Balance de Inversión no fue adjuntada."}
              </p>
            </div>
            {result.balance_inversion.validacion_v14 && (
              <div className="ml-auto">
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border-none select-none",
                  result.balance_inversion.validacion_v14.resultado === 'ok' ? 'bg-ok-fondo text-ok-tinta' :
                  result.balance_inversion.validacion_v14.resultado === 'error' ? 'bg-error-fondo text-error' :
                  'bg-amber-50 text-amber-800'
                )}>
                  <StatusIcon status={result.balance_inversion.validacion_v14.resultado === 'ok' ? 'pass' : result.balance_inversion.validacion_v14.resultado === 'error' ? 'fail' : 'warning'} />
                  <span>
                    {result.balance_inversion.validacion_v14.resultado === 'ok' ? 'BALANCE CUADRA' : 
                     result.balance_inversion.validacion_v14.resultado === 'error' ? 'ERROR EN BALANCE' : 'SIN BALANCE'}
                  </span>
                </span>
              </div>
            )}
          </div>
          
          {result.balance_inversion.presente && (
            <div className="p-6 grid grid-cols-1 @5xl:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="bg-hundida p-[10px_14px] rounded-[8px] border-[0.5px] border-linea">
                    <p className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-1">Monto Fijo Asignado</p>
                    <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.monto_asignado || 0)}</p>
                  </div>
                  <div className="bg-hundida p-[10px_14px] rounded-[8px] border-[0.5px] border-linea">
                    <p className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-1">Total Pendiente</p>
                    <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.total_pendiente || 0)}</p>
                  </div>
                  <div className="bg-hundida p-[10px_14px] rounded-[8px] border-[0.5px] border-linea">
                    <p className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-1">Saldo en Banco</p>
                    <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.saldo_banco_declarado || 0)}</p>
                  </div>
                  <div className="bg-hundida p-[10px_14px] rounded-[8px] border-[0.5px] border-linea">
                    <p className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-1">Saldo Calculado</p>
                    <p className="text-[13px] font-mono font-medium text-slate-800">{formatCurrency(result.balance_inversion.saldo_banco_calculado || 0)}</p>
                  </div>
                </div>
                {result.balance_inversion.validacion_v14?.detalle && (
                  <div className={cn(
                    "p-4 rounded-r-[8px] rounded-l-none border-l-2",
                    result.balance_inversion.validacion_v14.resultado === 'ok' ? "bg-marca-suave border-l-acento text-ok-tinta" :
                    result.balance_inversion.validacion_v14.resultado === 'error' ? "bg-error-suave border-l-error-acento text-error" :
                    "bg-hundida border-l-tenue text-slate-700"
                  )}>
                    <p className="text-xs font-medium leading-relaxed">
                      {result.balance_inversion.validacion_v14.detalle}
                    </p>
                  </div>
                )}

                {result.balance_inversion.conciliacion_total && (() => {
                  const c = result.balance_inversion.conciliacion_total!;
                  const fuentes = [
                    { label: 'Balance de Inversión', valor: c.importe_balance },
                    { label: 'Total Banco a Reponer (Libro Diario)', valor: c.importe_libro_diario },
                    { label: 'Suma de pagos bancarios', valor: c.suma_pagos_bancarios },
                  ];
                  return (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2.5">
                        <h4 className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em]">
                          Conciliación del importe a reponer
                        </h4>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none",
                          c.coinciden
                            ? "bg-ok-fondo text-ok-tinta"
                            : "bg-error-fondo text-error"
                        )}>
                          {c.coinciden ? 'Coinciden' : 'No coinciden'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-2">
                        {fuentes.map((f, i) => (
                          <div key={i} className={cn(
                            "p-3 rounded-[8px] border-[0.5px]",
                            c.coinciden
                              ? "bg-superficie border-linea"
                              : "bg-error-suave border-error-linea"
                          )}>
                            <p className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-1 leading-tight">{f.label}</p>
                            <p className={cn(
                              "text-[13px] font-mono font-medium",
                              c.coinciden ? "text-slate-800" : "text-error"
                            )}>
                              {f.valor ? formatCurrency(f.valor) : '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                      {c.detalle && (
                        <p className={cn(
                          "text-[11px] leading-relaxed mt-2",
                          c.coinciden ? "text-tinta-2" : "text-error font-medium"
                        )}>
                          {safeText(c.detalle)}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div>
                <h4 className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-4">Rendiciones Pendientes de Reintegro</h4>
                {result.balance_inversion.rendiciones_pendientes && result.balance_inversion.rendiciones_pendientes.length > 0 ? (
                  <div className="border-[0.5px] border-linea rounded-[8px] overflow-hidden bg-superficie shadow-none">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-hundida text-[10px] text-tenue uppercase font-medium border-b-[0.5px] border-linea">
                        <tr>
                          <th className="px-4 py-2.5 font-medium tracking-[0.06em]">Rendición N°</th>
                          <th className="px-4 py-2.5 text-right font-medium tracking-[0.06em]">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.balance_inversion.rendiciones_pendientes.map((rendicion, idx) => (
                          <tr key={idx} className="hover:bg-hundida/50 transition-colors">
                            <td className="px-4 py-2.5 font-normal text-slate-800">{rendicion.numero}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-normal text-slate-700">{formatCurrency(rendicion.importe)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No hay rendiciones pendientes declaradas.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerta de documentación duplicada en el expediente */}
      {result?.duplicados && result.duplicados.length > 0 && (
        <div className="bg-error-suave border border-error-linea rounded-[12px] p-5 shadow-none flex flex-col gap-4 mb-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-[10px] bg-error-fondo flex items-center justify-center shrink-0">
              <Copy className="w-4 h-4 text-error" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-error leading-tight">Documentación duplicada en el expediente</h4>
              <p className="text-xs text-error/90 mt-1 leading-relaxed">
                Se detectó documentación adjuntada más de una vez. Verificá que no se haya contabilizado dos veces la misma transacción, ni omitido un pago distinto del mismo proveedor.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-3">
            {result.duplicados.map((d, idx) => (
              <div key={idx} className="bg-superficie border-[0.5px] border-error-linea rounded-[8px] p-3">
                <p className="text-[13px] font-semibold text-slate-900 font-mono">{safeText(d.identificador) || '—'}</p>
                {d.motivo && <p className="text-[11px] text-tinta-2 mt-1 leading-relaxed">{safeText(d.motivo)}</p>}
                {d.paginas && <p className="text-[10px] text-tenue mt-1">Ubicación: {safeText(d.paginas)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Otras validaciones del expediente (lector de expedientes) */}
      {result?.validacionesExpediente && result.validacionesExpediente.length > 0 && (
        <ValidacionesExpediente validaciones={result.validacionesExpediente} />
      )}

      {/* Alerta Patrimonio para Código 202 */}
      {(() => {
        const paymentsWith202 = (result?.payments || []).filter(payment => {
          const v3 = payment?.validations?.find(val => val?.id === 'v3');
          return v3 ? hasAccountingCode(v3.observations, '202') : false;
        });

        if (paymentsWith202.length === 0) return null;

        return (
          <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-5 shadow-none flex flex-col gap-4 mt-6 mb-2">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-950 leading-tight">Enviar expediente a Patrimonio para alta bien de uso</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Se ha detectado la imputación con el código contable <strong className="font-semibold text-amber-950">202 (Adquisición de útiles, herramientas y Equipos de trabajo)</strong>. Deberás remitir este expediente al área de Patrimonio para el correspondiente alta física del bien de uso.
                </p>
              </div>
            </div>
            <div className="border-t border-amber-200/50 mt-1 pt-3.5">
              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-2.5">Comprobantes identificados con Código 202:</p>
              <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-2.5">
                {paymentsWith202.map((p, idx) => (
                  <div key={idx} className="bg-superficie/80 p-3 rounded-lg border border-amber-200/60 flex flex-col shadow-sm">
                    <span className="text-xs font-semibold text-slate-800">
                      {p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 font-mono">
                      Factura/PIMyS N°: <span className="font-medium text-slate-700">{p.orderNumber || 'S/N'}</span>
                    </span>
                    {p.amount !== undefined && p.amount > 0 && (
                      <span className="text-[11px] text-slate-600 mt-1 font-medium">
                        Monto: <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Alerta de Autorizaciones para Código 226 */}
      {(() => {
        const paymentsWith226 = (result?.payments || []).filter(payment => {
          const v3 = payment?.validations?.find(val => val?.id === 'v3');
          return v3 ? hasAccountingCode(v3.observations, '226') : false;
        });

        if (paymentsWith226.length === 0) return null;

        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-5 shadow-none flex flex-col gap-4 mt-4 mb-2">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0 border border-yellow-200 text-yellow-700">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-950 leading-tight">Suma Atención: Control de Aprobación Código 226</h4>
                <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
                  Se ha detectado imputación con el código <strong className="font-semibold text-yellow-900">226 (Mantenimiento de maquinarias menores)</strong>. Estas compras deben estar debidamente autorizadas por el Jefe Administrativo de la Sucursal correspondiente:
                </p>
                <ul className="text-xs text-yellow-900 mt-2 space-y-1 list-disc pl-4 font-medium">
                  {ZONAS_226.map(z => (
                    <li key={z.zona}><strong className="text-yellow-950">{z.zona}</strong> ({z.alcance}) requiere firma de <strong className="text-emerald-900 font-semibold">{z.firmante}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-yellow-200/80 mt-1 pt-3.5">
              <p className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider mb-2.5">Facturas/Proveedores con Código 226:</p>
              <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-2.5">
                {paymentsWith226.map((p, idx) => {
                  // Identify expected signer
                  // La zona sale primero de la agencia del expediente y, si no
                  // la nombra, del texto del pago.
                  const generalBranchText = result?.agenciaSucursal || "";
                  const paymentBranchText = (p?.libroDiarioText || "") + " " + (p?.providerName || "");
                  const zona226 = zonaDe(generalBranchText) || zonaDe(generalBranchText + " " + paymentBranchText);
                  const expectedSigner = zona226?.firmante || "Jefe Administracion";
                  const zone = zona226?.zona || "No identificada";

                  // Check if approved in observations
                  const v4Val = p?.validations?.find(val => (val as any)?.code?.toLowerCase() === 'v4' || val?.id?.toLowerCase() === 'v4' || (val as any)?.code?.toLowerCase() === 'validation_v4');
                  const v4Obs = (v4Val?.observations || "").toUpperCase();
                  const cleanSigner = expectedSigner.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const hasProperSignature = v4Obs.includes(expectedSigner.toUpperCase()) || 
                                         v4Obs.includes(cleanSigner) ||
                                         (v4Val?.status === 'pass' && !v4Obs.includes("FALTA"));

                  return (
                    <div key={idx} className="bg-superficie/90 p-3 rounded-lg border border-yellow-200 flex flex-col shadow-sm">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-semibold text-slate-800">
                          {p.providerName ? toSentenceCase(p.providerName) : 'Proveedor no identificado'}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${hasProperSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {hasProperSignature ? 'Verificado' : 'No Encontrado'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 font-mono">
                        Factura/PIMyS N°: <span className="font-medium text-slate-700">{p.orderNumber || 'S/N'}</span>
                      </span>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Jurisdicción: <span className="font-semibold text-slate-700">{zone}</span> | Requiere: <strong className="text-amber-950 font-semibold">{expectedSigner}</strong>
                      </div>
                      {p.amount !== undefined && p.amount > 0 && (
                        <span className="text-[11px] text-slate-600 mt-1 font-medium font-mono">
                          Monto: <span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sección Informe Copiable */}
      {informeTexto !== undefined && (
      <div id="informe-copiable" className="bg-superficie rounded-[12px] border-[0.5px] border-linea overflow-hidden transition-all caja">
        <div className="p-6 border-b-[0.5px] border-linea flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 bg-superficie">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center shrink-0 caja">
              <FileText className="w-6 h-6 text-acento" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 leading-tight">Informe de Auditoría</h3>
              <p className="text-xs text-tenue mt-0.5">
                Resumen estructurado de desvíos para copiar y enviar al responsable.
              </p>
            </div>
          </div>
          
          <button
            onClick={copiarInforme}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 py-[7px] px-[13px] rounded-[7px] text-[13px] font-medium transition-all border-none outline-none cursor-pointer shadow-none",
              copiedInforme 
                ? "bg-ok-fondo text-ok-tinta hover:bg-marca-suave"
                : "bg-marca text-white hover:bg-marca-hover"
            )}
          >
            {copiedInforme ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Informe</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 bg-[#2D2D2D] text-white font-mono text-xs rounded-b-[12px] shadow-none relative border-t-[0.5px] border-[#3A3A3A]">
          <div className="absolute top-4 right-4 bg-[#3A3A3A] text-tenue text-[9px] uppercase font-medium tracking-[0.06em] px-2 py-0.5 rounded select-none">
            Vista Previa
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-marca/40 max-h-[400px] pr-2">
            {informeTexto}
          </pre>
        </div>
      </div>
      )}

    </motion.div>
  );
}

function ValidacionesExpediente({ validaciones }: { validaciones: ValidationResult[] }) {
  return (
    <div className="bg-superficie rounded-[12px] border-[0.5px] border-linea overflow-hidden transition-all caja">
      <div className="p-6 border-b-[0.5px] border-linea flex items-center gap-4">
        <div className="w-12 h-12 bg-superficie rounded-[12px] border-[0.5px] border-linea flex items-center justify-center shrink-0 caja">
          <FileCheck2 className="w-6 h-6 text-acento" />
        </div>
        <div>
          <h3 className="text-base font-medium text-slate-900 leading-tight">Validaciones del Expediente</h3>
          <p className="text-xs text-tenue mt-0.5">Controles que no se muestran en el Balance de Inversión.</p>
        </div>
      </div>
      <div className="p-6 @2xl:p-8 flex flex-col gap-3 bg-hundida/40">
        {validaciones.map((v) => (
          <ValidacionItem key={v.id} id={v.id} title={v.title || v.id.toUpperCase()} status={v.status} observations={v.observations} />
        ))}
      </div>
    </div>
  );
}

function ValidacionItem({ id, title, status, observations, accion }: {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'warning';
  observations?: string;
  accion?: React.ReactNode;
  key?: React.Key;
}) {
  return (
    <div className={cn(
      "flex gap-3.5 items-start p-4 @2xl:p-5 rounded-[10px] bg-superficie border-[0.5px] border-linea border-l-[3px] caja elevable",
      status === 'pass' ? "border-l-emerald-500" : status === 'fail' ? "border-l-error-acento" : "border-l-amber-400"
    )}>
      <div className={cn(
        "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        status === 'pass' ? "bg-ok-fondo" : status === 'fail' ? "bg-error-fondo" : "bg-amber-50"
      )}>
        <StatusIcon status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-2 @2xl:gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn(
              "text-[11px] font-medium font-mono px-2 py-0.5 rounded border-[0.5px] shrink-0",
              status === 'pass' ? "bg-ok-fondo text-ok-tinta border-ok-linea" :
              status === 'fail' ? "bg-error-fondo text-error border-error-linea" :
              "bg-amber-50 text-amber-800 border-amber-200"
            )}>
              {id.toUpperCase()}
            </span>
            <span className="text-[14px] font-medium text-slate-900 tracking-tight">{title}</span>
          </div>
          {accion}
        </div>
        <p className={cn(
          "text-[13px] leading-relaxed mt-2.5 px-3.5 py-2.5 rounded-[8px] bg-hundida/60",
          status === 'pass' ? "text-slate-600" :
          status === 'fail' ? "text-slate-800" :
          "text-slate-700 italic"
        )}>
          {(observations || 'Dato no analizado por la IA.').split('\n').map((line, li, arr) => (
            <React.Fragment key={li}>
              {renderBold(line)}
              {li < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

interface PaymentRowProps {
  payment: PaymentData;
  isExpanded: boolean;
  onToggle: () => void;
  mode: 'Expedientes' | 'Viáticos' | 'Rapida';
  onViewPdf?: (fileIdx: number, pageNum?: number) => void;
  key?: React.Key | number | string;
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
  const t = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return ZONAS_226.find(z => CLAVES_ZONA[z.zona]?.test(t));
}

/** Importes para el registro del índice de rotación: los pagos que no lo
 *  afectan, separados por código, y el total de los que sí. Sumados dan el
 *  total del expediente. Cada uno con su botón de copiar. */
function IndiceRotacion({ rotacion }: { rotacion: NonNullable<AuditResult['rotacion']> }) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const copiar = (clave: string, importe: number) => {
    navigator.clipboard.writeText(formatCurrency(importe));
    setCopiado(clave);
    setTimeout(() => setCopiado(c => (c === clave ? null : c)), 2000);
  };
  const pagos = (n: number) => `${n} pago${n !== 1 ? 's' : ''}`;
  const filas = [
    ...rotacion.noAfecta.map(r => ({
      clave: r.codigo, titulo: `${r.codigo} · ${r.concepto}`, detalle: `No afecta · ${pagos(r.pagos)}`,
      importe: r.importe, destacada: true,
    })),
    { clave: 'afecta', titulo: 'Afectan el índice', detalle: pagos(rotacion.pagosAfecta),
      importe: rotacion.afecta, destacada: false },
  ];
  return (
    <div className="bg-aviso-fondo border border-aviso-linea/70 rounded-2xl p-5 mb-8">
      <div className="flex items-start gap-2.5 mb-4">
        <AlertCircle className="w-4 h-4 text-aviso-tinta mt-0.5 shrink-0" />
        <div>
          <h4 className="text-[14px] font-semibold text-aviso-tinta">Hay pagos que no afectan el índice de rotación</h4>
          <p className="text-[12px] text-aviso-tinta mt-0.5">Importes para el registro: sumados dan el total del expediente.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-2.5">
        {filas.map(f => (
          <div key={f.clave} className={cn(
            "flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5 border",
            f.destacada ? "bg-campo/70 border-aviso-linea/60" : "bg-superficie border-linea"
          )}>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{f.titulo}</p>
              <p className="text-[11px] text-tenue">{f.detalle}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[14px] font-semibold text-slate-900">{formatCurrency(f.importe)}</span>
              <button
                type="button"
                onClick={() => copiar(f.clave, f.importe)}
                className="p-1 text-slate-400 hover:text-acento hover:bg-hundida-2 rounded transition-all cursor-pointer outline-none border-none flex items-center justify-center"
                title="Copiar importe"
              >
                {copiado === f.clave ? <Check className="w-3.5 h-3.5 text-acento" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
      {rotacion.aviso && <p className="text-[11px] text-error mt-3">{rotacion.aviso}</p>}
    </div>
  );
}

function PaymentRow({ payment, isExpanded, onToggle, mode, onViewPdf }: PaymentRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  
  const validationsList = payment?.validations || [];
  // Resultado del lector de expedientes: cada validacion trae su titulo
  // (V1..V11, D1..D4) y se muestran las que vinieron, en su orden.
  const conTitulos = validationsList.length > 0 && validationsList.every(v => v && v.title);
  const currentValidations = conTitulos
    ? validationsList.map(v => ({ id: v.id, label: v.id.toUpperCase(), title: v.title as string }))
    : mode === 'Viáticos' ? VALIDATIONS_VIATICOS : VALIDATIONS.filter(v => v.id !== 'v14');

  const validCnt = validationsList.filter(v => v && v.status === 'pass').length;
  const totalCnt = currentValidations.length;
  const errorCnt = validationsList.filter(v => v && v.status === 'fail').length;
  const warnCnt = validationsList.filter(v => v && v.status === 'warning').length;

  let badgeEl = null;
  if (errorCnt > 0) {
    badgeEl = (
      <div className="bg-error-fondo text-error px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <AlertCircle className="w-3.5 h-3.5 text-error" />
        <span>{errorCnt} Errores</span>
      </div>
    );
  } else if (warnCnt > 0) {
    badgeEl = (
      <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>{warnCnt} Obs.</span>
      </div>
    );
  } else {
    badgeEl = (
      <div className="bg-ok-fondo text-ok-tinta px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 border-none select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-ok-tinta" />
        <span>{validCnt}/{totalCnt} Validaciones</span>
      </div>
    );
  }

  return (
    <div 
      ref={rowRef} 
      className={cn(
        "bg-superficie border-[0.5px] border-linea mb-4 last:mb-0 overflow-hidden caja elevable-cabecera",
        errorCnt > 0 ? "border-l-3 border-l-error-acento rounded-r-[8px] rounded-l-none" : "rounded-[8px]"
      )}
    >
      <div 
        onClick={onToggle}
        className="cabecera grid grid-cols-2 @3xl:grid-cols-[75px_1.5fr_1fr_220px_24px] gap-x-4 gap-y-2 items-center p-[11px_14px] cursor-pointer selection:bg-transparent select-none"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-tenue">PIMyS N°</span>
          <span className="text-[13px] font-medium text-slate-900">{payment?.orderNumber}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-tenue">Proveedor</span>
          <span className="text-[13px] font-medium text-slate-900 truncate block" title={payment?.providerName}>
            {toSentenceCase(payment?.providerName || '')}
          </span>
          {payment?.leidoPorOcr && (
            <span className="text-[10px] text-tenue flex items-center gap-1 mt-0.5 truncate" title={`Leído por OCR: ${payment.leidoPorOcr}`}>
              <ScanText className="w-3 h-3 shrink-0" />
              <span className="truncate">Leído por OCR: {payment.leidoPorOcr}</span>
            </span>
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-tenue">Importe</span>
          <span className="font-mono text-[13px] font-medium text-slate-900">{formatCurrency(payment?.amount)}</span>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {badgeEl}
          {payment?.pageNumber && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPdf?.(payment?.sourceFileIdx || 0, payment?.pageNumber);
              }}
              className="p-1 px-2 text-tenue hover:text-acento hover:bg-marca-suave rounded-[6px] border-[0.5px] border-linea transition-all cursor-pointer outline-none flex items-center justify-center shrink-0"
              title="Ver original"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span className="text-[10px] font-medium">Pág {payment.pageNumber}</span>
            </button>
          )}
        </div>
        <div className="hidden @3xl:flex justify-end text-tenue-2 shrink-0">
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-90")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t-[0.5px] border-linea bg-hundida/40"
          >
            <div className="p-6 @2xl:p-8">
              <h4 className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] mb-4">Detalle de Validaciones</h4>
              <div className="flex flex-col gap-3">
                {currentValidations.map((v) => {
                  const res = validationsList.find(rv => rv && rv.id && rv.id.toLowerCase() === v.id.toLowerCase());
                  const status = (res?.status as any) || 'warning';
                  
                  return (
                    <ValidacionItem
                      key={v.id}
                      id={v.label}
                      title={v.title}
                      status={status}
                      observations={res?.observations}
                      accion={payment.pageNumber ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPdf?.(payment.sourceFileIdx || 0, payment.pageNumber);
                          }}
                          className="self-start @2xl:self-auto p-1.5 text-slate-500 hover:text-acento hover:bg-marca-suave rounded-lg border-[0.5px] border-linea transition-all cursor-pointer outline-none flex items-center justify-center shrink-0"
                          title="ver pdf"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : undefined}
                    />
                  );
                })}
              </div>

              {/* Render Vales segment for mobility vouchers (combustibles, motor, ruedas, etc.) */}
              {payment.vales && payment.vales.length > 0 && (
                <div className="mt-8 pt-6 border-t-[0.5px] border-linea">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 bg-marca rounded-full" />
                    <h5 className="text-[10px] font-medium text-acento uppercase tracking-[0.06em]">
                      Vales de Provisión de Combustible / Ruedas ({payment.vales.length})
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-4">
                    {payment.vales.map((vale, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "bg-superficie border-[0.5px] rounded-[12px] p-4 transition-all flex flex-col justify-between gap-3 caja",
                          vale.legible ? "border-linea" : "border-amber-300 bg-amber-50/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] bg-realce border-[0.5px] border-linea px-2 py-0.5 rounded">
                            Vale N° {vale.numero}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1",
                            vale.legible 
                              ? "bg-ok-fondo text-ok-tinta" 
                              : "bg-amber-100 text-amber-800"
                          )}>
                            {vale.legible ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-acento" />
                                Legible
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Ilegible
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-tenue uppercase tracking-[0.06em] block">
                            Precio Total
                          </span>
                          {vale.legible && vale.precioTotal ? (
                            <span className="font-mono text-base font-medium text-slate-800">
                              {formatCurrency(parseFloat(vale.precioTotal))}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-700 italic block">
                              Letra no legible en vale N° {vale.numero}
                            </span>
                          )}
                        </div>

                        {vale.textoExtraido && (
                          <div className="mt-1 pt-2 border-t-[0.5px] border-dashed border-linea text-xs text-tinta-2">
                            <strong className="font-medium text-tenue uppercase text-[9px] tracking-wider block mb-1">Detalle extraído:</strong> 
                            <span className="font-normal">{vale.textoExtraido}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warning' }) {
  if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'fail') return <XCircle className="w-5 h-5 text-rose-500" />;
  return <AlertCircle className="w-5 h-5 text-amber-500" />;
}
