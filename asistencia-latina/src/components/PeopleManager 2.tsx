import { useState, useMemo, useEffect } from 'react';
import { Language, esTranslations, enTranslations, Persona, Asistencia, Evento, MemberStatus, VolunteerArea } from '../types';
import { Search, User, Phone, Cake, Calendar, CheckCircle, UserMinus, Plus, X, Camera, Users, Globe, Trash2, Heart, ChevronDown } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import { COUNTRIES, getCountryLabel } from '../data/countries';

interface PeopleManagerProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  onUpdatePersonStatus: (id: string, newStatus: MemberStatus) => void;
  onAddPersonNote: (id: string, noteText: string) => void;
  onUpdatePersonPhoto: (id: string, photoBase64: string | undefined) => void;
  onUpdatePersona: (id: string, updates: Partial<Persona>) => void;
  onDeletePersona: (id: string) => Promise<void>;
  onOpenNewPersonSheet: () => void;
  onAddExistingMember: (person: Persona) => void;
  volunteerAreas: VolunteerArea[];
}

export default function PeopleManager({
  language,
  people,
  events,
  attendance,
  onUpdatePersona,
  onDeletePersona,
  onOpenNewPersonSheet,
  onAddExistingMember,
  volunteerAreas,
}: PeopleManagerProps) {
  const t = language === 'es' ? esTranslations : enTranslations;
  const es = language === 'es';

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Filters
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterVoluntario, setFilterVoluntario] = useState<'all' | 'yes' | 'no'>('all');
  const [filterGenero, setFilterGenero] = useState<('M' | 'F')[]>([]);
  const [filterPaises, setFilterPaises] = useState<string[]>([]);
  const [filterEstados, setFilterEstados] = useState<MemberStatus[]>([]);

  // Editable fields in the profile modal
  const [tempNombre, setTempNombre] = useState('');
  const [tempTelefono, setTempTelefono] = useState('');
  const [tempFechaNacimiento, setTempFechaNacimiento] = useState('');
  const [tempFechaPrimeraVisita, setTempFechaPrimeraVisita] = useState('');
  const [tempSexo, setTempSexo] = useState<'M' | 'F'>('F');
  const [tempStatus, setTempStatus] = useState<MemberStatus>('activo');
  const [tempNotes, setTempNotes] = useState('');
  const [tempPhoto, setTempPhoto] = useState<string | undefined>(undefined);
  const [tempNacionalidad, setTempNacionalidad] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tempEsVoluntario, setTempEsVoluntario] = useState(false);
  const [tempAreasVoluntario, setTempAreasVoluntario] = useState<{ areaId: string; nota?: string }[]>([]);

  // Selected persona details
  const selectedPerson = useMemo(() => {
    return people.find((p) => p.id === selectedPersonId) || null;
  }, [people, selectedPersonId]);

  // Sync temp state when opening the modal for a person
  useEffect(() => {
    if (selectedPerson) {
      setTempNombre(selectedPerson.nombre_completo);
      setTempTelefono(selectedPerson.telefono || '');
      setTempFechaNacimiento(selectedPerson.fecha_nacimiento || '');
      setTempFechaPrimeraVisita(selectedPerson.fecha_primera_visita || '');
      setTempSexo(selectedPerson.sexo);
      setTempStatus(selectedPerson.estado);
      setTempNotes(selectedPerson.notas || '');
      setTempPhoto(selectedPerson.foto_perfil);
      setTempNacionalidad(selectedPerson.nacionalidad || '');
    }
    setTempEsVoluntario(selectedPerson?.es_voluntario ?? false);
    setTempAreasVoluntario(selectedPerson?.areas_voluntario ?? []);
    setConfirmDelete(false);
  }, [selectedPersonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAreaSelected = (areaId: string) => tempAreasVoluntario.some((a) => a.areaId === areaId);
  const getAreaNota = (areaId: string) => tempAreasVoluntario.find((a) => a.areaId === areaId)?.nota ?? '';
  const toggleArea = (areaId: string) => {
    setTempAreasVoluntario((prev) =>
      prev.some((a) => a.areaId === areaId)
        ? prev.filter((a) => a.areaId !== areaId)
        : [...prev, { areaId }]
    );
  };
  const setAreaNota = (areaId: string, nota: string) => {
    setTempAreasVoluntario((prev) =>
      prev.map((a) => (a.areaId === areaId ? { ...a, nota } : a))
    );
  };

  const hasChanges = useMemo(() => {
    if (!selectedPerson) return false;
    return (
      tempNombre !== selectedPerson.nombre_completo ||
      tempTelefono !== (selectedPerson.telefono || '') ||
      tempFechaNacimiento !== (selectedPerson.fecha_nacimiento || '') ||
      tempFechaPrimeraVisita !== (selectedPerson.fecha_primera_visita || '') ||
      tempSexo !== selectedPerson.sexo ||
      tempStatus !== selectedPerson.estado ||
      tempNotes !== (selectedPerson.notas || '') ||
      tempPhoto !== selectedPerson.foto_perfil ||
      tempNacionalidad !== (selectedPerson.nacionalidad || '') ||
      tempEsVoluntario !== (selectedPerson.es_voluntario ?? false) ||
      JSON.stringify(tempAreasVoluntario) !== JSON.stringify(selectedPerson.areas_voluntario ?? [])
    );
  }, [selectedPerson, tempNombre, tempTelefono, tempFechaNacimiento, tempFechaPrimeraVisita, tempSexo, tempStatus, tempNotes, tempPhoto, tempNacionalidad, tempEsVoluntario, tempAreasVoluntario]);

  const handleDeleteConfirmed = async () => {
    if (!selectedPersonId) return;
    setDeleting(true);
    try {
      await onDeletePersona(selectedPersonId);
      setSelectedPersonId(null);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedPersonId || !tempNombre.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onUpdatePersona(selectedPersonId, {
        nombre_completo: tempNombre.trim(),
        telefono: tempTelefono.trim() || undefined,
        fecha_nacimiento: tempFechaNacimiento || undefined,
        fecha_primera_visita: tempFechaPrimeraVisita || undefined,
        sexo: tempSexo,
        estado: tempStatus,
        notas: tempNotes.trim() || undefined,
        foto_perfil: tempPhoto,
        nacionalidad: tempNacionalidad || undefined,
        es_voluntario: tempEsVoluntario,
        areas_voluntario: tempEsVoluntario ? tempAreasVoluntario : [],
      });
      setSelectedPersonId(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as Record<string, unknown>)?.message
            ? String((err as Record<string, unknown>).message)
            : JSON.stringify(err);
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const availableCountries = useMemo(() =>
    [...new Set(people.map(p => p.nacionalidad).filter(Boolean))] as string[]
  , [people]);

  const activeFiltersCount = [
    filterVoluntario !== 'all',
    filterGenero.length > 0,
    filterPaises.length > 0,
    filterEstados.length > 0,
  ].filter(Boolean).length;

  // Compute filtered people list
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (q && !p.nombre_completo.toLowerCase().includes(q) && !(p.telefono && p.telefono.includes(q))) return false;
      if (filterVoluntario === 'yes' && !p.es_voluntario) return false;
      if (filterVoluntario === 'no' && p.es_voluntario) return false;
      if (filterGenero.length > 0 && !filterGenero.includes(p.sexo)) return false;
      if (filterPaises.length > 0 && !filterPaises.includes(p.nacionalidad || '')) return false;
      if (filterEstados.length > 0 && !filterEstados.includes(p.estado)) return false;
      return true;
    });
  }, [people, searchQuery, filterVoluntario, filterGenero, filterPaises, filterEstados]);

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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">

            {/* Search + clear filters row */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
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
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setFilterVoluntario('all'); setFilterGenero([]); setFilterPaises([]); setFilterEstados([]); }}
                  className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                  {activeFiltersCount}
                </button>
              )}
            </div>

            {/* Filter chips */}
            {openFilter && <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />}
            <div className="flex flex-wrap gap-1.5">

              {/* Voluntarios */}
              <div className="relative">
                <button onClick={() => setOpenFilter(openFilter === 'voluntario' ? null : 'voluntario')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition-colors cursor-pointer ${filterVoluntario !== 'all' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  <Heart className="w-3 h-3" />
                  {es ? 'Voluntarios' : 'Volunteers'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openFilter === 'voluntario' && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 min-w-[160px]">
                    {(['all', 'yes', 'no'] as const).map(v => (
                      <button key={v} onClick={() => { setFilterVoluntario(v); setOpenFilter(null); }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-bold hover:bg-slate-50 transition-colors ${filterVoluntario === v ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {filterVoluntario === v ? '✓ ' : ''}{v === 'all' ? (es ? 'Todos' : 'All') : v === 'yes' ? (es ? 'Solo voluntarios' : 'Volunteers only') : (es ? 'No voluntarios' : 'Non-volunteers')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Género */}
              <div className="relative">
                <button onClick={() => setOpenFilter(openFilter === 'genero' ? null : 'genero')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition-colors cursor-pointer ${filterGenero.length > 0 ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {es ? 'Género' : 'Gender'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openFilter === 'genero' && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 min-w-[140px]">
                    {(['F', 'M'] as const).map(g => (
                      <label key={g} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={filterGenero.includes(g)}
                          onChange={() => setFilterGenero(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                          className="text-indigo-600 rounded cursor-pointer" />
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${g === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                          {g === 'F' ? (es ? 'Femenino' : 'Female') : (es ? 'Masculino' : 'Male')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* País */}
              {availableCountries.length > 0 && (
                <div className="relative">
                  <button onClick={() => setOpenFilter(openFilter === 'pais' ? null : 'pais')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition-colors cursor-pointer ${filterPaises.length > 0 ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    <Globe className="w-3 h-3" />
                    {es ? 'País' : 'Country'}{filterPaises.length > 0 && ` (${filterPaises.length})`}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {openFilter === 'pais' && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 min-w-[170px] max-h-48 overflow-y-auto">
                      {availableCountries.map(code => {
                        const country = COUNTRIES.find(c => c.code === code);
                        return (
                          <label key={code} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={filterPaises.includes(code)}
                              onChange={() => setFilterPaises(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code])}
                              className="text-indigo-600 rounded cursor-pointer" />
                            <span className="text-[11px] font-bold text-slate-700">
                              {country?.flag} {es ? country?.nameEs : country?.nameEn}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Estado */}
              <div className="relative">
                <button onClick={() => setOpenFilter(openFilter === 'estado' ? null : 'estado')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border transition-colors cursor-pointer ${filterEstados.length > 0 ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {es ? 'Estado' : 'Status'}{filterEstados.length > 0 && ` (${filterEstados.length})`}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openFilter === 'estado' && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 min-w-[140px]">
                    {(['activo', 'nuevo', 'inactivo'] as MemberStatus[]).map(s => (
                      <label key={s} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={filterEstados.includes(s)}
                          onChange={() => setFilterEstados(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                          className="text-indigo-600 rounded cursor-pointer" />
                        <span className="text-[11px] font-bold text-slate-700">
                          {s === 'activo' ? t.statusActive : s === 'nuevo' ? t.statusNew : t.statusInactive}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

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
                            <span className={`w-2 h-2 rounded-full shrink-0 ${person.sexo === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                            {person.nacionalidad && (
                              <span className="text-[13px]" title={getCountryLabel(person.nacionalidad, language)}>
                                {COUNTRIES.find(c => c.code === person.nacionalidad)?.flag}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold mt-0.5">
                            {person.es_voluntario ? (
                              <span className="text-indigo-600">
                                {es ? '★ Voluntario' : '★ Volunteer'}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                {es ? 'Miembro' : 'Member'}
                              </span>
                            )}
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
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPersonId(null)} />

          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl animate-scale-up relative w-full max-w-md z-10 max-h-[90vh] flex flex-col">

            {/* Header fijo */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              {/* Avatar editable */}
              <div className="relative group shrink-0">
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
                        const MAX = 150;
                        let w = img.width, h = img.height;
                        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        if (ctx) { ctx.drawImage(img, 0, 0, w, h); setTempPhoto(canvas.toDataURL('image/jpeg', 0.85)); }
                      };
                      img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="modal-edit-avatar-input"
                  className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-2xl text-lg font-black cursor-pointer overflow-hidden relative shadow-md"
                >
                  {tempPhoto
                    ? <img src={tempPhoto} alt="" className="w-full h-full object-cover" />
                    : <span>{tempNombre.charAt(0) || '?'}</span>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </label>
                {tempPhoto && (
                  <button type="button" onClick={() => setTempPhoto(undefined)}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Nombre editable */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={tempNombre}
                  onChange={(e) => setTempNombre(e.target.value)}
                  placeholder={es ? 'Nombre completo' : 'Full name'}
                  className="w-full text-sm font-extrabold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none pb-0.5 placeholder-slate-300"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {es ? 'Haz clic para editar' : 'Click to edit'}
                </span>
              </div>

              <button onClick={() => setSelectedPersonId(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

              {/* Estado */}
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {es ? 'Estado' : 'Status'}
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                  {(['activo', 'nuevo', 'inactivo'] as MemberStatus[]).map((st) => (
                    <button key={st} onClick={() => setTempStatus(st)}
                      className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                        tempStatus === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}>
                      {st === 'activo' ? t.statusActive : st === 'nuevo' ? t.statusNew : t.statusInactive}
                    </button>
                  ))}
                </div>
              </div>

              {/* Género */}
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {es ? 'Género' : 'Gender'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['F', 'M'] as const).map((g) => (
                    <button key={g} onClick={() => setTempSexo(g)}
                      className={`py-1.5 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        tempSexo === g ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${g === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                      {g === 'F' ? (es ? 'Femenino' : 'Female') : (es ? 'Masculino' : 'Male')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-3">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.contactInfo}
                </span>

                {/* Teléfono */}
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    value={tempTelefono}
                    onChange={(e) => setTempTelefono(e.target.value)}
                    placeholder={es ? 'Teléfono (opcional)' : 'Phone (optional)'}
                    className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Fecha de nacimiento */}
                <div className="flex items-center gap-2.5">
                  <Cake className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={tempFechaNacimiento}
                    onChange={(e) => setTempFechaNacimiento(e.target.value)}
                    className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {tempFechaNacimiento && (
                    <span className="text-xs text-slate-400 font-bold shrink-0">
                      {calculateAge(tempFechaNacimiento)} {t.age}
                    </span>
                  )}
                </div>

                {/* Nacionalidad */}
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={tempNacionalidad}
                    onChange={(e) => setTempNacionalidad(e.target.value)}
                    className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{es ? '— País —' : '— Country —'}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {es ? c.nameEs : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Primera visita */}
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={tempFechaPrimeraVisita}
                    onChange={(e) => setTempFechaPrimeraVisita(e.target.value)}
                    className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">
                    {es ? '1ª visita' : '1st visit'}
                  </span>
                </div>
              </div>

              {/* Notas pastorales */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.notesTitle}
                </span>
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder={es ? 'Observaciones pastorales...' : 'Pastoral notes...'}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold placeholder-slate-400 resize-none leading-relaxed"
                />
              </div>

              {/* Voluntariado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Heart className="w-3 h-3" />
                    {es ? 'Voluntario/a' : 'Volunteer'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setTempEsVoluntario(!tempEsVoluntario); if (tempEsVoluntario) setTempAreasVoluntario([]); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${tempEsVoluntario ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${tempEsVoluntario ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>

                {tempEsVoluntario && volunteerAreas.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {volunteerAreas.map((area) => {
                      const selected = isAreaSelected(area.id);
                      return (
                        <div key={area.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleArea(area.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                              selected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {selected ? '✓ ' : ''}{es ? area.nombre_es : area.nombre_en}
                          </button>
                          {selected && area.permite_nota && (
                            <input
                              type="text"
                              value={getAreaNota(area.id)}
                              onChange={(e) => setAreaNota(area.id, e.target.value)}
                              placeholder={es ? 'Descripción...' : 'Description...'}
                              className="w-full col-span-2 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historial de asistencia */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.historyTitle}
                </span>
                {personHistory.length === 0 ? (
                  <div className="text-xs text-slate-400 italic font-medium">{t.noHistory}</div>
                ) : (
                  <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
                    {personHistory.map((hist) => (
                      <div key={hist.id} className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-50 font-semibold">
                        <div className="truncate pr-2">
                          <span className="font-mono text-slate-400 text-[10px] mr-2">{hist.date}</span>
                          <span className="text-slate-700">{hist.eventName}</span>
                        </div>
                        <span className={`font-black uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                          hist.present ? 'bg-green-100 text-green-900' : 'bg-red-50 text-red-700'
                        }`}>
                          {hist.present ? (es ? 'Presente' : 'Present') : (es ? 'Falta' : 'Absent')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer fijo con botones */}
            <div className="px-6 pb-5 pt-3 border-t border-slate-100 shrink-0 space-y-2">
              {saveError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {es ? 'Error al guardar: ' : 'Save error: '}{saveError}
                </p>
              )}
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
                    {es
                      ? `¿Eliminar a ${tempNombre}? Esta acción no se puede deshacer.`
                      : `Delete ${tempNombre}? This cannot be undone.`}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer">
                      {es ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button type="button" onClick={handleDeleteConfirmed} disabled={deleting}
                      className="flex-[2] py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm">
                      <Trash2 className="w-4 h-4" />
                      <span>{deleting ? (es ? 'Eliminando...' : 'Deleting...') : (es ? 'Confirmar Eliminación' : 'Confirm Delete')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-2xl transition-all cursor-pointer border border-red-100" title={es ? 'Eliminar persona' : 'Delete person'}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => { setSelectedPersonId(null); setSaveError(null); }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer">
                    {es ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button type="button" onClick={handleSaveChanges} disabled={!hasChanges || !tempNombre.trim() || saving}
                    className={`flex-[2] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      hasChanges && tempNombre.trim() && !saving
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span>{saving ? (es ? 'Guardando...' : 'Saving...') : (es ? 'Guardar Cambios' : 'Save Changes')}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
