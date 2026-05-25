import { useState } from 'react';
import { Language, esTranslations, enTranslations, Configuracion, EventTrack, VolunteerArea } from '../types';
import { Settings, Check, RefreshCw, AlertTriangle, Plus, Trash2, Heart, ArrowLeft } from 'lucide-react';

interface ConfigScreenProps {
  language: Language;
  config: Configuracion;
  onSaveConfig: (updated: Configuracion) => void;
  onResetDatabase: () => void;
  onLanguageChange: (lang: Language) => void;
  customTracks: EventTrack[];
  onRegisterCustomTrack: (track: EventTrack) => void;
  onDeleteCustomTrack: (id: string) => void;
  volunteerAreas: VolunteerArea[];
  onAddVolunteerArea: (area: VolunteerArea) => void;
  onDeleteVolunteerArea: (id: string) => void;
  onBack: () => void;
}

export default function ConfigScreen({
  language,
  config,
  onSaveConfig,
  onResetDatabase,
  onLanguageChange,
  customTracks,
  onRegisterCustomTrack,
  onDeleteCustomTrack,
  volunteerAreas,
  onAddVolunteerArea,
  onDeleteVolunteerArea,
  onBack,
}: ConfigScreenProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  // Local state for configuration settings
  const [alertaIglesia, setAlertaIglesia] = useState(config.alerta_ausencias_iglesia);
  const [alertaConexion, setAlertaConexion] = useState(config.alerta_ausencias_grupo_conexion);
  const [alertaHombres, setAlertaHombres] = useState(config.alerta_ausencias_grupo_hombres);
  const [alertaMujeres, setAlertaMujeres] = useState(config.alerta_ausencias_grupo_mujeres);
  const [diasCumpleanos, setDiasCumpleanos] = useState(config.dias_recordatorio_cumpleanos);
  const [prefLang, setPrefLang] = useState<Language>(config.idioma_por_defecto);
  
  // Track subgroups active
  const [grupoConexionActive, setGrupoConexionActive] = useState(config.grupos_activos.grupo_conexion);
  const [grupoHombresActive, setGrupoHombresActive] = useState(config.grupos_activos.grupo_hombres);
  const [grupoMujeresActive, setGrupoMujeresActive] = useState(config.grupos_activos.grupo_mujeres);

  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Custom Track Registration local states
  const [newTrackNameEs, setNewTrackNameEs] = useState('');
  const [newTrackNameEn, setNewTrackNameEn] = useState('');
  const [newTrackType, setNewTrackType] = useState<'servicio' | 'grupo' | 'evento'>('servicio');
  const [customTrackSuccess, setCustomTrackSuccess] = useState(false);

  // Volunteer Areas local states
  const [newAreaNameEs, setNewAreaNameEs] = useState('');
  const [newAreaNameEn, setNewAreaNameEn] = useState('');
  const [newAreaPermiteNota, setNewAreaPermiteNota] = useState(false);
  const [volunteerAreaSuccess, setVolunteerAreaSuccess] = useState(false);

  const handleCreateVolunteerArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaNameEs.trim()) return;
    const newArea: VolunteerArea = {
      id: 'area_custom_' + Date.now(),
      nombre_es: newAreaNameEs.trim(),
      nombre_en: newAreaNameEn.trim() || newAreaNameEs.trim(),
      permite_nota: newAreaPermiteNota,
      orden: volunteerAreas.length + 1,
    };
    onAddVolunteerArea(newArea);
    setNewAreaNameEs('');
    setNewAreaNameEn('');
    setNewAreaPermiteNota(false);
    setVolunteerAreaSuccess(true);
    setTimeout(() => setVolunteerAreaSuccess(false), 3000);
  };

  const handleCreateCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackNameEs.trim()) return;

    // Build the dynamic color palette based on type
    const colorOptions = {
      servicio: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-indigo-600 hover:bg-slate-50',
      grupo: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-emerald-500 hover:bg-slate-50',
      evento: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-amber-505 border-t-amber-500 hover:bg-slate-50'
    };

    const newTrack: EventTrack = {
      id: 'custom_' + Date.now(),
      titleEs: newTrackNameEs.trim(),
      titleEn: newTrackNameEn.trim() || newTrackNameEs.trim(),
      labelEs: newTrackType === 'servicio' 
        ? 'Servicio de Iglesia' 
        : newTrackType === 'grupo' 
        ? 'Grupo o Célula' 
        : 'Evento Especial',
      labelEn: newTrackType === 'servicio' 
        ? 'Church Service' 
        : newTrackType === 'grupo' 
        ? 'Discipleship Group' 
        : 'Special Event',
      type: newTrackType,
      active: true,
      color: colorOptions[newTrackType]
    };

    onRegisterCustomTrack(newTrack);
    setNewTrackNameEs('');
    setNewTrackNameEn('');
    setNewTrackType('servicio');
    setCustomTrackSuccess(true);
    setTimeout(() => {
      setCustomTrackSuccess(false);
    }, 4000);
  };

  const handleApplyChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessAlert(false);

    const updatedConfig: Configuracion = {
      alerta_ausencias_iglesia: Number(alertaIglesia),
      alerta_ausencias_grupo_conexion: Number(alertaConexion),
      alerta_ausencias_grupo_hombres: Number(alertaHombres),
      alerta_ausencias_grupo_mujeres: Number(alertaMujeres),
      dias_recordatorio_cumpleanos: Number(diasCumpleanos),
      idioma_por_defecto: prefLang,
      grupos_activos: {
        grupo_conexion: grupoConexionActive,
        grupo_hombres: grupoHombresActive,
        grupo_mujeres: grupoMujeresActive
      }
    };

    onSaveConfig(updatedConfig);
    onLanguageChange(prefLang); // Update current language too
    setSavedSuccessAlert(true);
    
    setTimeout(() => {
      setSavedSuccessAlert(false);
    }, 4000);
  };

  const handleResetClick = () => {
    onResetDatabase();
    setShowResetConfirm(false);
    
    // Auto reset local form states to match defaults
    setAlertaIglesia(3);
    setAlertaConexion(3);
    setAlertaHombres(3);
    setAlertaMujeres(3);
    setDiasCumpleanos(1);
    setPrefLang('es');
    setGrupoConexionActive(true);
    setGrupoHombresActive(true);
    setGrupoMujeresActive(true);

    setSavedSuccessAlert(true);
    setTimeout(() => {
      setSavedSuccessAlert(false);
    }, 4000);
  };

  return (
    <div className="font-sans space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-indigo-600" />
              <span>{t.configTitle}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {language === 'es' ? 'Personaliza los parámetros de alertas y activa funcionalidades opcionales' : 'Configure dynamic absence offsets, birthday grace gaps, or activate categories'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'es' ? 'Volver' : 'Back'}</span>
          </button>
        </div>
      </div>

      {savedSuccessAlert && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
          <Check className="w-4 h-4 text-green-700" />
          <span>{t.configSaved}</span>
        </div>
      )}

      {/* Forms Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Settings Form */}
        <form onSubmit={handleApplyChanges} className="lg:col-span-2 space-y-5 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-705">
          
          {/* Rules Section 1 */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{t.alertRules}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Church absences */}
              <div>
                <label className="block text-xs font-bold text-slate-705 text-slate-700 mb-1 leading-snug">
                  {t.churchAlertConfig}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={alertaIglesia}
                  onChange={(e) => setAlertaIglesia(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Connection absences */}
              <div>
                <label className="block text-xs font-bold text-slate-705 text-slate-700 mb-1 leading-snug">
                  {t.connectionAlertConfig}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={alertaConexion}
                  onChange={(e) => setAlertaConexion(Number(e.target.value))}
                  disabled={!grupoConexionActive}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Men absences */}
              <div>
                <label className="block text-xs font-bold text-slate-750 text-slate-700 mb-1 leading-snug">
                  {t.menAlertConfig}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={alertaHombres}
                  onChange={(e) => setAlertaHombres(Number(e.target.value))}
                  disabled={!grupoHombresActive}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Women absences */}
              <div>
                <label className="block text-xs font-bold text-slate-750 text-slate-700 mb-1 leading-snug">
                  {t.womenAlertConfig}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={alertaMujeres}
                  onChange={(e) => setAlertaMujeres(Number(e.target.value))}
                  disabled={!grupoMujeresActive}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Birth Grace alerts count */}
            <div className="sm:max-w-xs pt-1.5">
              <label className="block text-xs font-bold text-slate-700 mb-1 leading-snug">
                {t.birthGraceAlert}
              </label>
              <select
                value={diasCumpleanos}
                onChange={(e) => setDiasCumpleanos(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1"
              >
                <option value="0">{language === 'es' ? 'Mismo día del cumpleaños' : 'On exact day'}</option>
                <option value="1">1 {language === 'es' ? 'día de anticipación' : 'day notice'}</option>
                <option value="3">3 {language === 'es' ? 'días de anticipación' : 'days notice'}</option>
                <option value="7">7 {language === 'es' ? 'días de anticipación' : 'days notice'}</option>
              </select>
            </div>
          </div>

          {/* Subgroups toggles Section 2 */}
          <div className="space-y-4 pt-3.5 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📁</span>
                <span>{t.activeSubgroups}</span>
              </h3>
              <p className="text-[11px] font-semibold text-slate-450 text-slate-500 mt-1">{t.activeSubgroupsDesc}</p>
                <div className="space-y-3 font-semibold text-slate-750">
              
              {/* Group Connection */}
              <label className="flex items-center gap-3 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={grupoConexionActive}
                  onChange={(e) => setGrupoConexionActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">{language === 'es' ? 'Grupo de Conexión' : 'Connection cell group'}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {language === 'es' ? 'Habilita registrar asistencia e informes para grupos celulares generales.' : 'Unlocks general connection cell trackers.'}
                  </span>
                </div>
              </label>

              {/* Group Hombres */}
              <label className="flex items-center gap-3 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={grupoHombresActive}
                  onChange={(e) => setGrupoHombresActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">{language === 'es' ? 'Grupo de Hombres (Varones)' : 'Men\'s group study'}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {language === 'es' ? 'Control de asistencia exclusivo para varones' : 'Exclusively filters male attendance checks'}
                  </span>
                </div>
              </label>

              {/* Group Mujeres */}
              <label className="flex items-center gap-3 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={grupoMujeresActive}
                  onChange={(e) => setGrupoMujeresActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">{language === 'es' ? 'Grupo de Mujeres (Damas)' : 'Women\'s group study'}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {language === 'es' ? 'Control de asistencia exclusivo para damas' : 'Exclusively filters female attendance checks'}
                  </span>
                </div>
              </label>
            </div>           </div>
          </div>

          {/* Lang Selection Section 3 */}
          <div className="space-y-3 pt-3.5 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              🌐 {t.languagePreference}
            </h3>
            <div className="flex gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrefLang('es')}
                className={`flex-1 py-1.5 text-center border rounded-xl cursor-pointer ${
                  prefLang === 'es' ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-black shadow-sm' : 'bg-white hover:bg-slate-50'
                }`}
              >
                Español 🇪🇸
              </button>
              <button
                type="button"
                onClick={() => setPrefLang('en')}
                className={`flex-1 py-1.5 text-center border rounded-xl cursor-pointer ${
                  prefLang === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-black shadow-sm' : 'bg-white hover:bg-slate-50'
                }`}
              >
                English 🇺🇸
              </button>
            </div>
          </div>

          {/* Form Actions Submit Button */}
          <div className="pt-4 border-t border-slate-100 text-right">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
            >
              {t.saveConfig}
            </button>
          </div>

        </form>

        {/* Right Sidebar Column: Database Control */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Register Custom Category Form */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'es' ? 'Crear Grupo, Servicio o Evento' : 'Create Group, Service or Event'}</span>
            </h3>

            {customTrackSuccess && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-1.5 font-semibold">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>{language === 'es' ? '¡Creado con éxito!' : 'Successfully created!'}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomTrack} className="space-y-3 font-semibold text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'es' ? 'Nombre (Español) *' : 'Name (Spanish) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej. Generación Joven' : 'e.g. Youth Generation'}
                  value={newTrackNameEs}
                  onChange={(e) => setNewTrackNameEs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'es' ? 'Nombre (Inglés - Opcional)' : 'Name (English - Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'es' ? 'Ej. Youth Generation' : 'e.g. Youth Generation'}
                  value={newTrackNameEn}
                  onChange={(e) => setNewTrackNameEn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'es' ? 'Tipo de Actividad' : 'Activity Type'}
                </label>
                <select
                  value={newTrackType}
                  onChange={(e) => setNewTrackType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 cursor-pointer"
                >
                  <option value="servicio">{language === 'es' ? '⛪ Servicio de la Iglesia' : '⛪ Church Service'}</option>
                  <option value="grupo">{language === 'es' ? '👥 Grupo o Célula Semanal' : '👥 Discipleship Group'}</option>
                  <option value="evento">{language === 'es' ? '📅 Evento Especial' : '📅 Special Event'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow shadow-indigo-600/10 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'es' ? 'Registrar Actividad' : 'Register Activity'}</span>
              </button>
            </form>

            {/* List custom registered tracks if any exist */}
            {customTracks.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {language === 'es' ? 'Grupos/Servicios Creados' : 'Registered Custom Units'}
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customTracks.map((trk) => (
                    <div
                      key={trk.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100/40"
                    >
                      <div className="truncate pr-1">
                        <span className="font-bold text-slate-800">
                          {language === 'es' ? trk.titleEs : trk.titleEn}
                        </span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5 font-mono">
                          {trk.type === 'servicio' ? '⛪ Servicio' : trk.type === 'grupo' ? '👥 Grupo' : '📅 Evento'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomTrack(trk.id)}
                        className="p-1 text-slate-400 hover:text-red-650 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title={language === 'es' ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Volunteer Areas Panel */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>{language === 'es' ? 'Áreas de Voluntariado' : 'Volunteer Areas'}</span>
            </h3>

            {volunteerAreaSuccess && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>{language === 'es' ? '¡Área agregada!' : 'Area added!'}</span>
              </div>
            )}

            <form onSubmit={handleCreateVolunteerArea} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'es' ? 'Nombre (Español) *' : 'Name (Spanish) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej. Media' : 'e.g. Media'}
                  value={newAreaNameEs}
                  onChange={(e) => setNewAreaNameEs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'es' ? 'Nombre (Inglés - Opcional)' : 'Name (English - Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'es' ? 'Ej. Media' : 'e.g. Media'}
                  value={newAreaNameEn}
                  onChange={(e) => setNewAreaNameEn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAreaPermiteNota}
                  onChange={(e) => setNewAreaPermiteNota(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-600">
                  {language === 'es' ? 'Permite nota adicional' : 'Allow extra note'}
                </span>
              </label>
              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'es' ? 'Agregar Área' : 'Add Area'}</span>
              </button>
            </form>

            {volunteerAreas.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {language === 'es' ? 'Áreas Registradas' : 'Registered Areas'}
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {volunteerAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100/40">
                      <div className="truncate pr-1">
                        <span className="font-bold text-slate-800">
                          {language === 'es' ? area.nombre_es : area.nombre_en}
                        </span>
                        {area.permite_nota && (
                          <span className="block text-[9px] text-indigo-500 font-bold uppercase mt-0.5">
                            {language === 'es' ? '+ nota' : '+ note'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteVolunteerArea(area.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title={language === 'es' ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rebuild Data Card Container */}
          <div className="bg-white p-5 border border-slate-205 rounded-2xl shadow-sm space-y-4 font-semibold text-slate-705">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <span>🗄️</span>
              <span>{language === 'es' ? 'Mantenimiento de Datos' : 'Database Maintenance'}</span>
            </h3>

            <p className="text-xs font-semibold text-slate-505 text-slate-500 leading-relaxed leading-5">
              {language === 'es'
                ? 'Usa este botón para limpiar el historial de asistencia. Se borrarán todos los eventos y sus registros, pero el directorio de personas permanecerá intacto.'
                : 'Use this button to clear the attendance history. All events and check-in records will be deleted, but your people directory will remain untouched.'}
            </p>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 bg-red-50 hover:bg-red-105 hover:bg-red-100 text-red-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.resetMockData}</span>
            </button>
          </div>

        </div>

      </div>

      {/* CONFIRM RESET DATABASE DIALOG */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl space-y-2">
            
            <div className="flex items-center gap-2 text-red-650 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-extrabold text-base">{language === 'es' ? 'Restablecer Base de Datos' : 'Reset Seed Database'}</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {t.resetMockConfirm}
            </p>

            <div className="flex gap-2.5 justify-end pt-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 ring-1 ring-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-755 text-slate-600 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleResetClick}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                {language === 'es' ? 'Sí, restablecer' : 'Yes, reset now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
