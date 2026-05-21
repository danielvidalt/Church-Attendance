import React, { useState, useMemo } from 'react';
import { Language, esTranslations, enTranslations, Persona, Asistencia, Evento, Seguimiento, Configuracion } from '../types';
import { calculateAlerts, AbsenceAlert } from '../utils/attendance';
import { Phone, CheckCircle2, AlertTriangle, MessageSquare, UserCheck, ShieldClose } from 'lucide-react';

interface AlertsManagerProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  config: Configuracion;
  seguimientos: Seguimiento[];
  onAddNewSeguimiento: (seg: Seguimiento) => void;
  onUpdateSeguimientoStatus: (id: string, status: 'pendiente' | 'contactado' | 'cerrado') => void;
  username: string;
}

export default function AlertsManager({
  language,
  people,
  events,
  attendance,
  config,
  seguimientos,
  onAddNewSeguimiento,
  onUpdateSeguimientoStatus,
  username
}: AlertsManagerProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  const [activeAlertTab, setActiveAlertTab] = useState<'pending' | 'logged'>('pending');
  const [selectedAlertForNotes, setSelectedAlertForNotes] = useState<AbsenceAlert | null>(null);
  
  // Follow up dynamic state
  const [followUpNote, setFollowUpNote] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState(username || 'Daniel Vidal');
  const [followUpStatus, setFollowUpStatus] = useState<'pendiente' | 'contactado' | 'cerrado'>('contactado');

  // Compute live active failure alerts based on current configuration rules
  const liveAlerts = useMemo(() => {
    return calculateAlerts(people, events, attendance, config);
  }, [people, events, attendance, config]);

  // Combine live alerts with their active follow-up log status
  // If an alert has an open/pending Seguimiento log or got marked as Contactado, we can display detailed states!
  const alertsWithLogs = useMemo(() => {
    return liveAlerts.map((alert) => {
      // Find latest follow up log for this person matching this alert's type
      const matchingLogs = seguimientos
        .filter((s) => s.persona_id === alert.personaId)
        .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
      
      return {
        ...alert,
        latestLog: matchingLogs[0] || null
      };
    });
  }, [liveAlerts, seguimientos]);

  // Handle saving new follow-up
  const handleSaveFollowUpLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForNotes || !followUpNote.trim()) return;

    const newLog: Seguimiento = {
      id: 'seg_new_' + Date.now(),
      persona_id: selectedAlertForNotes.personaId,
      motivo: `${selectedAlertForNotes.tipo === 'church' ? 'Ausencia Iglesia' : 'Ausencia Grupo'} - ${selectedAlertForNotes.semanasFaltadas} faltas consecutivas`,
      estado: followUpStatus,
      nota: followUpNote.trim(),
      fecha_creacion: new Date().toISOString().substring(0, 10),
      fecha_contacto: followUpStatus === 'contactado' ? new Date().toISOString().substring(0, 10) : undefined,
      usuario_responsable: responsiblePerson
    };

    onAddNewSeguimiento(newLog);

    // Reset notes state
    setFollowUpNote('');
    setSelectedAlertForNotes(null);
  };

  return (
    <div className="font-sans space-y-6">
      
      {/* Header Info Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-xl font-extrabold text-blue-950 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-500" />
          <span>{t.alertsCenter}</span>
        </h2>
        <div className="flex items-start gap-2 text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-250/40">
          <span>⚙️</span>
          <p>
            {t.alertConfigInfo.replace('{n}', config.alerta_ausencias_iglesia.toString())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column 2: Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Subtabs for Alert navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-205/50 max-w-xs">
            <button
              onClick={() => {
                setActiveAlertTab('pending');
                setSelectedAlertForNotes(null);
              }}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeAlertTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-705'
              }`}
            >
              {language === 'es' ? 'Alertas de Ausencias' : 'Absence Warnings'} ({liveAlerts.length})
            </button>
            <button
              onClick={() => {
                setActiveAlertTab('logged');
                setSelectedAlertForNotes(null);
              }}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeAlertTab === 'logged' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-705'
              }`}
            >
              {language === 'es' ? 'Bitácora de Contacto' : 'Pastoral Care Log'} ({seguimientos.length})
            </button>
          </div>

          {/* Tab 1: Pending Failure Alerts */}
          {activeAlertTab === 'pending' && (
            <div className="space-y-3.5">
              {alertsWithLogs.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 text-slate-400 font-medium rounded-2xl shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2.5" />
                  <span>{t.noAlerts}</span>
                </div>
              ) : (
                alertsWithLogs.map((item, idx) => {
                  const consecutive = item.semanasFaltadas;
                  const isRed = consecutive >= 4;
                  
                  // Color status row
                  const rowBorder = isRed ? 'border-red-300' : 'border-amber-250';
                  const rowBg = isRed ? 'bg-red-50/10' : 'bg-amber-50/10';
                  const badgeBg = isRed ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900';

                  return (
                    <div
                      key={`${item.personaId}_${item.tipo}_${idx}`}
                      className={`p-4 border ${rowBorder} ${rowBg} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-[10px] font-black tracking-widest uppercase border px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                            {consecutive} {language === 'es' ? 'FALTAS CONSECUTIVAS' : 'CONSECUTIVE MISSES'}
                          </span>
                          {item.latestLog && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/50">
                              💬 {language === 'es' ? 'Último contacto: ' : 'Care Log: '}{item.latestLog.estado === 'contactado' ? (language === 'es' ? 'Contactado' : 'Contacted') : (language === 'es' ? 'Por llamar' : 'Pending')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {language === 'es' ? item.mensajeEs : item.mensajeEn}
                        </p>
                        {item.latestLog && item.latestLog.nota && (
                          <p className="text-xs text-slate-500 italic font-semibold leading-relaxed bg-white/40 border border-slate-100 p-2.5 rounded-xl">
                            "{item.latestLog.nota}" — <span className="font-bold text-slate-400 font-mono text-[10px]">{item.latestLog.usuario_responsable}</span>
                          </p>
                        )}
                      </div>

                      {/* Action trigger group */}
                      <div className="flex gap-2 shrink-0">
                        {item.telefono && (
                          <a
                            href={`tel:${item.telefono}`}
                            className="p-2 bg-white ring-1 ring-slate-200 hover:ring-slate-350 text-slate-700 rounded-xl transition-all cursor-pointer shadow-sm hover:bg-slate-50 flex items-center justify-center"
                            title={language === 'es' ? 'Llamar por teléfono' : 'Make phone call'}
                          >
                            <Phone className="w-4.5 h-4.5 text-indigo-600" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedAlertForNotes(item)}
                          className="px-3.5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{t.addFollowUpNote}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Care logs list */}
          {activeAlertTab === 'logged' && (
            <div className="space-y-3.5">
              {seguimientos.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 text-slate-400 font-medium rounded-2xl shadow-sm">
                  {language === 'es' ? 'No se han registrado seguimientos pastorales todavía.' : 'No pastoral contact logs filed yet.'}
                </div>
              ) : (
                <div className="bg-white border border-slate-250/60 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {seguimientos.map((log) => {
                    const person = people.find((p) => p.id === log.persona_id);
                    return (
                      <div key={log.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-sm font-bold text-slate-950">
                              {person ? person.nombre_completo : `ID: ${log.persona_id}`}
                            </span>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              {log.motivo}
                            </span>
                          </div>
                          
                          {/* Log Status pill */}
                          <select
                            value={log.estado}
                            onChange={(e) => onUpdateSeguimientoStatus(log.id, e.target.value as 'pendiente' | 'contactado' | 'cerrado')}
                            className={`text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full border cursor-pointer ${
                              log.estado === 'cerrado'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : log.estado === 'contactado'
                                ? 'bg-indigo-50 text-indigo-805 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <option value="pendiente">{t.statusProgress}</option>
                            <option value="contactado">{language === 'es' ? 'Contactado' : 'Contacted'}</option>
                            <option value="cerrado">{t.statusClosed}</option>
                          </select>
                        </div>
                        
                        {log.nota && (
                          <p className="text-xs text-slate-650 italic font-semibold leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 text-slate-700">
                            "{log.nota}"
                          </p>
                        )}

                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono mt-1">
                          <span>👤 {t.responsible}: {log.usuario_responsable}</span>
                          <span>📅 {log.fecha_creacion}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column 1: Care log filing form */}
        <div className="lg:col-span-1">
          {selectedAlertForNotes ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in relative">
              <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                {t.followUpAddTitle}
              </span>
              
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {selectedAlertForNotes.nombreCompleto}
                </h4>
                <p className="text-[11px] font-semibold text-amber-600 mt-1">
                  ⚠️ {selectedAlertForNotes.semanasFaltadas} {language === 'es' ? 'asistencias omitidas' : 'missed logs in session'}
                </p>
              </div>

              <form onSubmit={handleSaveFollowUpLog} className="space-y-4">
                {/* Note Area */}
                <div>
                  <label className="block text-[10px] font-black text-slate-705 uppercase tracking-wide mb-1.5">
                    {language === 'es' ? 'Resumen de contacto' : 'Contact outline remarks'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={language === 'es' ? "Ingresa notas de la llamada, situación de salud o espiritual..." : "Call remarks, health updates or prayer notes..."}
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Responsible Picker */}
                <div>
                  <label className="block text-[10px] font-black text-slate-705 uppercase tracking-wide mb-1.5">
                    {t.responsible}
                  </label>
                  <input
                    type="text"
                    required
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  />
                </div>

                {/* Follow up status toggle */}
                <div>
                  <label className="block text-[10px] font-black text-slate-705 uppercase tracking-wide mb-1.5">
                    {t.contactedStatus}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setFollowUpStatus('contactado')}
                      className={`py-2 text-center rounded-xl border cursor-pointer ${
                        followUpStatus === 'contactado' ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold' : 'bg-white border-slate-200'
                      }`}
                    >
                      📞 {language === 'es' ? 'Cerrar / Contactado' : 'Contacted'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpStatus('pendiente')}
                      className={`py-2 text-center rounded-xl border cursor-pointer ${
                        followUpStatus === 'pendiente' ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-white border-slate-200'
                      }`}
                    >
                      ⏳ {language === 'es' ? 'Pendiente' : 'Pending callback'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedAlertForNotes(null)}
                    className="flex-1 py-1.5 ring-1 ring-slate-200 text-slate-655 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    {t.saveFollowUp}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic font-medium flex flex-col items-center justify-center min-h-[350px]">
              <UserCheck className="w-12 h-12 text-slate-300 mb-2.5" />
              <span>
                {language === 'es' 
                  ? 'Ficha de seguimiento inactiva. Toca "Agregar nota de seguimiento" en cualquier alerta.' 
                  : 'Filing tray inactive. Choose any alert and touch "Add follow-up note" to generate caregiver log entry.'}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
