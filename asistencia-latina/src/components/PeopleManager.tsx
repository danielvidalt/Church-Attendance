import React, { useState, useMemo, useEffect } from 'react';
import { Language, esTranslations, enTranslations, Persona, Asistencia, Evento, MemberStatus } from '../types';
import { Search, User, Phone, Cake, Calendar, FileText, CheckCircle, AlertOctagon, UserMinus, Plus, X, Camera, Users } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

interface PeopleManagerProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  onUpdatePersonStatus: (id: string, newStatus: MemberStatus) => void;
  onAddPersonNote: (id: string, noteText: string) => void;
  onUpdatePersonPhoto: (id: string, photoBase64: string | undefined) => void;
  onOpenNewPersonSheet: () => void;
  onAddExistingMember: (person: Persona) => void;
}

export default function PeopleManager({
  language,
  people,
  events,
  attendance,
  onUpdatePersonStatus,
  onAddPersonNote,
  onUpdatePersonPhoto,
  onOpenNewPersonSheet,
  onAddExistingMember
}: PeopleManagerProps) {
  const t = language === 'es' ? esTranslations : enTranslations;
  const es = language === 'es';

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Unsaved changes tracking for the floating profile modal
  const [tempStatus, setTempStatus] = useState<MemberStatus | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [tempPhoto, setTempPhoto] = useState<string | undefined>(undefined);

  // Selected persona details
  const selectedPerson = useMemo(() => {
    return people.find((p) => p.id === selectedPersonId) || null;
  }, [people, selectedPersonId]);

  // Sync temp state when selecting a new person or when data changes externally
  useEffect(() => {
    if (selectedPerson) {
      setTempStatus(selectedPerson.estado);
      setTempNotes(selectedPerson.notas || '');
      setTempPhoto(selectedPerson.foto_perfil);
    } else {
      setTempStatus(null);
      setTempNotes('');
      setTempPhoto(undefined);
    }
  }, [selectedPersonId, selectedPerson]);

  const hasChanges = useMemo(() => {
    if (!selectedPerson) return false;
    const currentNotes = selectedPerson.notas || '';
    return tempStatus !== selectedPerson.estado || tempNotes !== currentNotes || tempPhoto !== selectedPerson.foto_perfil;
  }, [selectedPerson, tempStatus, tempNotes, tempPhoto]);

  const handleSaveChanges = () => {
    if (!selectedPersonId || !tempStatus) return;
    
    // Call parent hooks/callbacks if value differs
    if (tempStatus !== selectedPerson?.estado) {
      onUpdatePersonStatus(selectedPersonId, tempStatus);
    }
    
    const trimmedNotes = tempNotes.trim();
    if (trimmedNotes !== (selectedPerson?.notas || '')) {
      onAddPersonNote(selectedPersonId, trimmedNotes);
    }

    if (tempPhoto !== selectedPerson?.foto_perfil) {
      onUpdatePersonPhoto(selectedPersonId, tempPhoto);
    }
    
    // Close modal on successful save
    setSelectedPersonId(null);
  };

  // Compute filtered people list
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        p.nombre_completo.toLowerCase().includes(q) ||
        (p.telefono && p.telefono.includes(q));

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter !== 'all' && p.estado !== statusFilter) return false;

      return true;
    });
  }, [people, searchQuery, statusFilter]);

  // Compute selected person's attendance logs
  const personHistory = useMemo(() => {
    if (!selectedPersonId) return [];
    
    // Find all attendance records for this user
    const userAtts = attendance.filter((a) => a.persona_id === selectedPersonId);

    // Map to event details
    return userAtts
      .map((att) => {
        const evt = events.find((e) => e.id === att.evento_id);
        return {
          id: att.id,
          date: att.fecha_registro,
          eventName: evt ? evt.nombre_evento : (language === 'es' ? 'Evento no especificado' : 'Unknown log'),
          present: att.presente
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, events, selectedPersonId, language]);

  // Compute calculated age
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  return (
    <div className="font-sans space-y-6 animate-fade-in">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-indigo-600" />
            <span>{t.directoryTitle}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {language === 'es' 
              ? 'Administra los perfiles de la comunidad y consulta su historial de fidelidad' 
              : 'Edit profiles, toggle membership status, and review attendance logs'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 cursor-pointer transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>{es ? 'Agregar al Directorio' : 'Add to Directory'}</span>
          </button>
          <button
            onClick={onOpenNewPersonSheet}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addPerson}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        
        {/* Directory List with Toolbar */}
        <div className="space-y-4">
          
          {/* List Search & Filters Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Status Select filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-widest leading-none">
                {t.statusLabel}:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | MemberStatus)}
                className="w-full sm:w-auto text-xs font-bold text-slate-700 bg-slate-50 ring-1 ring-slate-200 py-1.5 px-3.5 rounded-xl border-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">{t.statusAll}</option>
                <option value="activo">{t.statusActive}</option>
                <option value="nuevo">{t.statusNew}</option>
                <option value="inactivo">{t.statusInactive}</option>
              </select>
            </div>
          </div>

          {/* Core Directory Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {filteredPeople.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                <UserMinus className="w-12 h-12 mx-auto text-slate-300 mb-2.5" />
                <span>{t.noPeopleFound}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                {filteredPeople.map((person) => {
                  const isSelected = selectedPersonId === person.id;
                  
                  // Color status pill
                  let pillStyle = 'bg-indigo-50 text-indigo-750 text-indigo-700 border-indigo-205 border-indigo-200';
                  if (person.estado === 'nuevo') {
                    pillStyle = 'bg-green-50 text-green-800 border-green-200';
                  } else if (person.estado === 'inactivo') {
                    pillStyle = 'bg-slate-100 text-slate-500 border-slate-200';
                  }

                  return (
                    <div
                      key={person.id}
                      onClick={() => {
                        setSelectedPersonId(person.id);
                      }}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50/40 rounded-xl font-bold border-l-4 border-l-indigo-650' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl text-sm font-black overflow-hidden shrink-0 shadow-sm border border-slate-100">
                          {person.foto_perfil ? (
                            <img
                              src={person.foto_perfil}
                              alt={person.nombre_completo}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            person.nombre_completo.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-extrabold text-slate-900">
                              {person.nombre_completo}
                            </span>
                            {person.sexo === 'F' ? (
                              <span className="text-[11px]">👩</span>
                            ) : (
                              <span className="text-[11px]">👨</span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {person.telefono || (language === 'es' ? 'Sin teléfono' : 'No phone')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border ${pillStyle}`}>
                          {person.estado === 'activo' && t.statusActive}
                          {person.estado === 'nuevo' && t.statusNew}
                          {person.estado === 'inactivo' && t.statusInactive}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Selected Person Profile Floating Modal overlay */}
      {showAddMemberModal && (
        <AddMemberModal
          language={language}
          onClose={() => setShowAddMemberModal(false)}
          onSave={(person) => {
            onAddExistingMember(person);
            setShowAddMemberModal(false);
          }}
        />
      )}

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click helper to close modal */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedPersonId(null)} 
          />
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up relative w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            
            {/* Elegant Header Close Button */}
            <button
              onClick={() => setSelectedPersonId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title={language === 'es' ? 'Cerrar' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Avatar / Title Section */}
            <div className="text-center pb-4 border-b border-slate-100 flex flex-col items-center">
              <div className="relative group w-16 h-16 mb-2">
                <input
                  type="file"
                  id="modal-edit-avatar-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 150;
                        const MAX_HEIGHT = 150;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                          if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                          }
                        } else {
                          if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                          }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, width, height);
                          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                          setTempPhoto(dataUrl);
                        }
                      };
                      img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="modal-edit-avatar-input"
                  className="w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-2xl text-xl font-black shadow-md shadow-indigo-100 cursor-pointer overflow-hidden relative group"
                  title={language === 'es' ? 'Cambiar foto de perfil' : 'Change profile photo'}
                >
                  {tempPhoto ? (
                    <img
                      src={tempPhoto}
                      alt={selectedPerson.nombre_completo}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    selectedPerson.nombre_completo.charAt(0)
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white animate-pulse" />
                  </div>
                </label>

                {tempPhoto && (
                  <button
                    type="button"
                    onClick={() => setTempPhoto(undefined)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors shadow-sm cursor-pointer"
                    title={language === 'es' ? 'Eliminar foto' : 'Remove photo'}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <h3 className="text-xs font-black text-slate-900 mt-1">{selectedPerson.nombre_completo}</h3>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px] mt-1.5 uppercase tracking-widest">
                ID: {selectedPerson.id}
              </span>

              {/* Status Switcher buttons internally to profile sheet */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50 mt-4">
                {(['activo', 'nuevo', 'inactivo'] as MemberStatus[]).map((st) => {
                  const active = tempStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setTempStatus(st)}
                      className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'activo' && t.statusActive}
                      {st === 'nuevo' && t.statusNew}
                      {st === 'inactivo' && t.statusInactive}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Details list */}
            <div className="space-y-3 pb-4 border-b border-slate-100 text-xs font-semibold">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.contactInfo}
              </span>
              
              {/* Phone */}
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {selectedPerson.telefono || (language === 'es' ? 'No registrado' : 'No recorded')}
                </span>
              </div>

              {/* Birthday */}
              <div className="flex items-center gap-2.5 text-slate-700">
                <Cake className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {selectedPerson.fecha_nacimiento
                    ? `${selectedPerson.fecha_nacimiento} (${calculateAge(selectedPerson.fecha_nacimiento)} ${t.age})`
                    : (language === 'es' ? 'No provisto' : 'Not stated')}
                </span>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {t.joinedOn} {selectedPerson.fecha_primera_visita || selectedPerson.fecha_creacion}
                </span>
              </div>
            </div>

            {/* Pastoral notes editing */}
            <div className="space-y-2 pb-4 border-b border-slate-100 text-xs font-semibold">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.notesTitle}
              </span>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder={language === 'es' ? 'Escribe o edita observaciones pastorales...' : 'Write or edit pastoral comments...'}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold placeholder-slate-400 resize-none leading-relaxed font-sans"
              />
            </div>

            {/* Attendance Tracker history */}
            <div className="space-y-2.5 pb-4">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.historyTitle}
              </span>
              {personHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic font-medium">
                  {t.noHistory}
                </div>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {personHistory.map((hist) => (
                    <div
                      key={hist.id}
                      className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-50 font-semibold"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-slate-400 text-[10px] mr-2">{hist.date}</span>
                        <span className="text-slate-700">{hist.eventName}</span>
                      </div>
                      <span
                        className={`font-black uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded ${
                          hist.present
                            ? 'bg-green-100 text-green-900'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {hist.present ? (language === 'es' ? 'Presente' : 'Checked') : (language === 'es' ? 'Falta' : 'Absent')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Changes Button footer */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPersonId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                className={`flex-[2] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  hasChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md shadow-indigo-650/10'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{language === 'es' ? 'Guardar Cambios' : 'Save Changes'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
