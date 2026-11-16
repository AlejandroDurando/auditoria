import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  Scale, 
  Coins, 
  Info,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { DISPOSICIONES, FONDOS_FIJOS_DATA, type FondoFijoReg, type DisposicionDoc, type Articulo } from '../data/normativaData';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export function InteractiveNormativa() {
  const [subTab, setSubTab] = useState<'disposiciones' | 'fondos'>('disposiciones');
  
  // Disposiciones States
  const [selectedDispId, setSelectedDispId] = useState<string>('ga-004-2026');
  const [showOriginalDocumentMock, setShowOriginalDocumentMock] = useState<boolean>(false);
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({
    'ga-004-2026-Art. 1': true,
    'af-70-2025-Art. 1': true,
    'af-70-2025-Art. 2': true,
    'af-70-2025-Art. 7': true,
    'af-70-2025-Art. 8': true
  });
  
  // Fondos Fijos States
  const [fondoSearchQuery, setFondoSearchQuery] = useState<string>('');
  const [selectedFondoId, setSelectedFondoId] = useState<string | null>(null);

  const selectedDisp = DISPOSICIONES.find(d => d.id === selectedDispId) || DISPOSICIONES[0];

  const toggleArticle = (dispId: string, artNum: string) => {
    const key = `${dispId}-${artNum}`;
    setExpandedArticles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedFondo = FONDOS_FIJOS_DATA.find(f => f.id === selectedFondoId);

  // Search filter for Fondos/Responsables
  const filteredFondos = FONDOS_FIJOS_DATA.filter(f => {
    if (!fondoSearchQuery.trim()) return true;
    const query = fondoSearchQuery.toLowerCase();
    
    const matchesFondoName = f.nombre.toLowerCase().includes(query);
    const matchesFondoId = f.id.includes(query);
    const matchesResponsable = f.responsables.some(
      r => r.nombre.toLowerCase().includes(query) || 
           r.legajo.includes(query) || 
           r.dni.toLowerCase().includes(query) ||
           r.domicilio.toLowerCase().includes(query)
    );
    
    return matchesFondoName || matchesFondoId || matchesResponsable;
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Interactive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-x-6 gap-y-3 border-b border-linea">
        <div className="flex gap-x-[22px] select-none self-start">
          <button
            type="button"
            onClick={() => setSubTab('disposiciones')}
            className={`-mb-px pb-[9px] px-0 bg-transparent border-0 border-b-2 border-solid outline-none cursor-pointer text-sm whitespace-nowrap transition-colors ${
              subTab === 'disposiciones' 
                ? "border-tinta text-tinta font-medium"
                : "border-transparent text-tinta-2 hover:text-tinta"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Disposiciones
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('fondos')}
            className={`-mb-px pb-[9px] px-0 bg-transparent border-0 border-b-2 border-solid outline-none cursor-pointer text-sm whitespace-nowrap transition-colors ${
              subTab === 'fondos' 
                ? "border-tinta text-tinta font-medium"
                : "border-transparent text-tinta-2 hover:text-tinta"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Responsables y cajas
            </span>
          </button>
        </div>

        {subTab === 'disposiciones' && (
          <div className="flex items-center gap-3">
            <div className="flex bg-hundida/60 rounded-[6px] p-0.5 border border-linea">
              {DISPOSICIONES.map(disp => (
                <button
                  key={disp.id}
                  onClick={() => setSelectedDispId(disp.id)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-[6px] transition-all cursor-pointer ${
                    selectedDispId === disp.id 
                      ? 'bg-superficie text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {disp.id === 'ga-004-2026' ? 'Disp. GA 004/2026 (Límite Actual)' : 'Disp. AF 70/2025'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowOriginalDocumentMock(!showOriginalDocumentMock)}
              className={`inline-flex items-center gap-1.5 py-1 px-3 border rounded-[6px] text-xs font-semibold select-none transition-all cursor-pointer outline-none ${
                showOriginalDocumentMock
                  ? 'bg-ok-fondo border-ok-linea text-ok-tinta'
                  : 'bg-superficie border-linea-fuerte text-slate-700 hover:bg-realce'
              }`}
              title="Alternar entre la vista analítica limpia y el facsímil oficial del documento"
            >
              {showOriginalDocumentMock ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showOriginalDocumentMock ? 'Vista Listado' : 'Ver Documento'}</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'disposiciones' ? (
          <motion.div
            key="disposiciones-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            {/* Main Content area: List / Mock Document */}
            <div className="w-full">
              {!showOriginalDocumentMock ? (
                /* List View (Analytical, Interactive Accordion) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">Artículos de la Disposición</h3>
                    <span className="text-xs text-slate-400">{selectedDisp.articulos.length} Cláusulas</span>
                  </div>

                  <div className="space-y-3">
                    {selectedDisp.articulos.map((art) => {
                      const isExpanded = !!expandedArticles[`${selectedDisp.id}-${art.numero}`];
                      return (
                        <div 
                          key={art.numero}
                          className={`bg-superficie border rounded-[8px] overflow-hidden caja elevable-cabecera ${
                            art.destacado ? 'border-acento/40' : 'border-linea'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleArticle(selectedDisp.id, art.numero)}
                            className={`cabecera w-full flex items-center justify-between p-4 text-left outline-none cursor-pointer ${
                              art.destacado ? 'bg-marca/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-[6px] ${
                                art.destacado 
                                  ? 'bg-marca text-white' 
                                  : 'bg-hundida-2 text-slate-700'
                              }`}>
                                {art.numero}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {art.numero === 'Art. 1' && selectedDisp.id === 'ga-004-2026' ? 'Actualización del Monto de Compra' : 
                                 art.numero === 'Art. 7' ? 'Límite Máximo de Facturación' :
                                 art.numero === 'Art. 8' ? 'Firma Conjunta y Cruzado de Cheques' :
                                 art.numero === 'Art. 10' ? 'Prohibición de Stock y Formulario PIMyS' :
                                 art.numero === 'Art. 16' ? 'Erogaciones Prohibidas y Visibilidad de Códigos' :
                                 art.numero === 'Art. 19' ? 'Arqueo Trimestral Obligatorio' : 
                                 'Orden General'}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <div className="p-4 border-t border-slate-100 bg-superficie space-y-3">
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                                    {art.texto}
                                  </p>
                                  {art.observaciones && (
                                    <div className="flex items-start gap-1.5 p-2.5 bg-yellow-50 text-amber-800 rounded-[6px] border border-amber-100/60 text-[11px] leading-relaxed">
                                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                                      <div>
                                        <b className="font-semibold text-amber-900">Nota del Auditor:</b> {art.observaciones}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Original Document Mock View (Vibe of real paper Disposición) */
                <div className="bg-superficie border border-linea-fuerte rounded-[8px] p-8 md:p-12 max-w-2xl mx-auto space-y-8 text-slate-800 font-sans relative overflow-hidden">
                  {/* Document Header */}
                  <div className="flex flex-col items-center border-b border-slate-200 pb-6 text-center space-y-2">
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {selectedDisp.titulo}
                      </h2>
                      {selectedDisp.subtitulo && (
                        <h3 className="text-xs text-slate-600 font-semibold italic">
                          {selectedDisp.subtitulo}
                        </h3>
                      )}
                      <p className="text-[11px] font-medium text-slate-500 pt-1 font-mono">
                        SANTA FE, {selectedDisp.fecha}
                      </p>
                    </div>
                  </div>

                  {/* VISTO */}
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-950 font-mono">Visto:</p>
                    <p className="pl-4 leading-relaxed text-slate-700 italic">
                      {selectedDisp.visto}
                    </p>
                  </div>

                  {/* CONSIDERANDO */}
                  {selectedDisp.considerando && (
                    <div className="space-y-2 text-xs">
                      <p className="font-semibold text-slate-950 font-mono">Considerando:</p>
                      <div className="space-y-2 pl-4">
                        {selectedDisp.considerando.map((cons, i) => (
                          <p key={i} className="leading-relaxed text-slate-700 text-justify">
                            {cons}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTOR RESOLUCIÓN */}
                  <div className="pt-4 text-center">
                    <p className="text-xs font-semibold text-slate-950 font-mono">
                      {selectedDisp.id === 'ga-004-2026' 
                        ? 'El Gerente de Administración' 
                        : 'El Área Finanzas y Administración'}
                    </p>
                    <p className="text-xs font-semibold text-acento mt-1">
                      Dispone:
                    </p>
                  </div>

                  {/* ARTICULADO */}
                  <div className="space-y-4 pt-2">
                    {selectedDisp.articulos.map((art) => (
                      <div key={art.numero} className="text-xs space-y-1 pl-2">
                        <span className="font-semibold text-slate-950 font-mono mr-2 pt-0.5 inline-block border-b border-dashed border-slate-300">
                          {art.numero}º:
                        </span>
                        <p className="inline text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                          {art.texto}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* FIRMA DIGITAL / STAMPS */}
                  <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 p-2.5 bg-superficie border border-linea rounded-[6px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[11px] text-slate-500 font-medium">Documento transcripto íntegramente con fidelidad absoluta</span>
                    </div>

                    <div className="w-60 p-4 border border-yellow-200 bg-yellow-50/60 rounded-[8px] relative overflow-hidden self-end">
                      <div className="space-y-1 relative z-10">
                        <span className="text-[11px] font-semibold text-yellow-600 block">Firma Digital Registrada</span>
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                          {selectedDisp.id === 'ga-004-2026' ? 'LÓPEZ Mauro Nicolás' : 'C.P.N. Federico Ropolo'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {selectedDisp.id === 'ga-004-2026' ? 'Gerente de Administración' : 'Jefe Área Finanzas / Gcia. Adm.'}
                        </p>
                        <hr className="border-t border-yellow-200 my-1" />
                        <span className="text-[8px] font-mono text-slate-400 block leading-none">
                          Fecha: {selectedDisp.id === 'ga-004-2026' ? '09.02.2026 07:52:35' : '30.12.2025 08:50:57'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* FONDOS Y RESPONSABLES TAB */
          <motion.div
            key="fondos-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search Input bar */}
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-tenue" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre de agente, legajo, DNI, o nombre de agencia..."
                value={fondoSearchQuery}
                onChange={(e) => setFondoSearchQuery(e.target.value)}
                className="bg-superficie border border-linea rounded-[8px] pl-10 pr-10 py-2.5 text-xs w-full focus:outline-none focus:border-acento font-medium text-slate-900 placeholder:text-slate-400 transition-all shadow-none"
              />
              {fondoSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFondoSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none cursor-pointer p-1"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Fondos List column */}
              <div className="md:col-span-5 space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <div className="text-xs font-semibold text-slate-500 mb-2 sticky top-0 bg-hundida py-1">
                  Encontrados ({filteredFondos.length})
                </div>
                {filteredFondos.length === 0 ? (
                  <div className="p-8 text-center bg-superficie border border-linea rounded-[8px] text-slate-400 text-xs caja">
                    Ningún fondo coincide con el filtro.
                  </div>
                ) : (
                  filteredFondos.map((fondo) => (
                    <button
                      key={fondo.id}
                      onClick={() => setSelectedFondoId(fondo.id)}
                      className={`w-full text-left p-3.5 border rounded-[8px] transition-all cursor-pointer block outline-none ${
                        selectedFondoId === fondo.id 
                          ? 'bg-ok-fondo border-ok-linea' 
                          : 'bg-superficie border-linea hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          Nº {fondo.id}
                        </span>
                        <span className="text-xs font-semibold text-acento">
                          {(fondo.monto != null ? formatCurrency(fondo.monto) : 'A definir')}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 mt-2 line-clamp-1">{fondo.nombre}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{fondo.responsables.length} responsables habilitados</p>
                    </button>
                  ))
                )}
              </div>

              {/* Detail view of the selected Fondo */}
              <div className="md:col-span-7 bg-superficie border border-linea rounded-[8px] p-6 caja">
                {selectedFondo ? (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 bg-superficie border border-linea text-slate-600 text-[11px] font-semibold rounded">
                          FONDO FIJO Nº {selectedFondo.id}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-2">{selectedFondo.nombre}</h3>
                        {selectedFondo.reintegrables && (
                          <p className="text-[11px] text-slate-500 mt-1 font-mono">{selectedFondo.reintegrables}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium font-mono">Presupuesto Inicial</span>
                        <span className="text-xl font-semibold text-acento">{(selectedFondo.monto != null ? formatCurrency(selectedFondo.monto) : 'A definir')}</span>
                        <span className="text-[11px] bg-ok-fondo text-ok-tinta font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {selectedFondo.anexo}
                        </span>
                      </div>
                    </div>

                    {selectedFondo.observaciones && (
                      <div className="p-3 bg-blue-50 border border-blue-100/60 text-xs text-[#1F4E79] rounded-[8px] flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                        <div>
                          <b className="font-semibold text-blue-900">Directiva Especial:</b> {selectedFondo.observaciones}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pb-1 border-b border-slate-100">
                        <span>Nómina Oficial de Responsables</span>
                        <span>{selectedFondo.responsables.length} Agentes</span>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {selectedFondo.responsables.map((resp, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 bg-realce rounded-[8px] border border-slate-100 hover:bg-hundida-2/50 transition-colors space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {resp.nombre}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="bg-superficie border border-linea text-slate-600 px-1.5 py-0.5 rounded">
                                  Legajo: {resp.legajo}
                                </span>
                                <span className="bg-superficie border border-linea text-slate-500 px-1.5 py-0.5 rounded">
                                  {resp.dni}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight pl-5">
                              <b>Domicilio constituido:</b> {resp.domicilio}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-realce">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">Selecciona un Fondo Fijo de la lista</p>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                      Podrás ver toda la plantilla de responsables oficiales habilitados para firmar PIMyS o cheques, sus legajos y domicilios.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
