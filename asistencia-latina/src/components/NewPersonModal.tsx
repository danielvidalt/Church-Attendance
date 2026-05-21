import React, { useState } from 'react';
import { Language, esTranslations, enTranslations, EventType, Persona } from '../types';
import { X, UserPlus, Info, Camera } from 'lucide-react';
import { formatDate } from '../utils/attendance';

interface NewPersonModalProps {
  language: Language;
  onClose: () => void;
  onSave: (newPerson: Persona, markPresent: boolean) => void;
  defaultEventType: EventType;
}

export default function NewPersonModal({ language, onClose, onSave, defaultEventType }: NewPersonModalProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F'>('F');
  const [llegoA, setLlegoA] = useState<EventType>(defaultEventType);
  const [isFirstCheck, setIsFirstCheck] = useState<'yes' | 'no'>('yes');
  const [nota, setNota] = useState('');
  const [errorName, setErrorName] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | undefined>(undefined);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setFotoPerfil(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorName(false);

    if (!nombreCompleto.trim()) {
      setErrorName(true);
      return;
    }

    const uniqueId = 'p_new_' + Date.now();
    const todayStr = formatDate(new Date());

    const createdPerson: Persona = {
      id: uniqueId,
      nombre_completo: nombreCompleto.trim(),
      telefono: telefono.trim() || undefined,
      fecha_nacimiento: fechaNacimiento || undefined,
      fecha_creacion: todayStr,
      fecha_primera_visita: todayStr,
      estado: isFirstCheck === 'yes' ? 'nuevo' : 'activo',
      sexo,
      notas: nota.trim() || undefined,
      foto_perfil: fotoPerfil
    };

    onSave(createdPerson, true); // Save person and pre-mark them as present/attended
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-850 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base tracking-tight">{t.newPersonTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700">
          
          {/* Photo & Name Grid */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            {/* Foto de perfil circle upload */}
            <div className="flex flex-col items-center shrink-0">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">
                {language === 'es' ? 'Foto de Perfil' : 'Profile Photo'}
              </span>
              
              <div className="relative group w-16 h-16">
                <input
                  type="file"
                  id="modal-avatar-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="modal-avatar-input"
                  className="w-16 h-16 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative shadow-sm"
                >
                  {fotoPerfil ? (
                    <img
                      src={fotoPerfil}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[9px] font-black tracking-wider">
                      <Camera className="w-5 h-5 text-indigo-500 mb-0.5" />
                      <span>{language === 'es' ? 'AÑADIR' : 'ADD'}</span>
                    </div>
                  )}
                  {/* Subtle hover overlay to edit */}
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center py-0.5 text-white text-[8px] font-extrabold uppercase">
                    {language === 'es' ? 'Editar' : 'Edit'}
                  </div>
                </label>

                {fotoPerfil && (
                  <button
                    type="button"
                    onClick={() => setFotoPerfil(undefined)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors shadow-sm"
                    title={language === 'es' ? 'Eliminar' : 'Remove'}
                  >
                    <X className="w-2.5 h-2.5 font-bold" />
                  </button>
                )}
              </div>
            </div>

            {/* Nombre completo input */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {t.fullName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={language === 'es' ? "Ej. Pedro Martínez" : "e.g. Peter Smith"}
                value={nombreCompleto}
                onChange={(e) => {
                  setNombreCompleto(e.target.value);
                  if (e.target.value.trim()) setErrorName(false);
                }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 transition-all font-bold text-slate-800 placeholder-slate-400 ${
                  errorName ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {errorName && (
                <span className="text-red-600 text-[11px] font-medium block mt-1">
                  {t.fieldRequired}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {t.phone} ({language === 'es' ? 'opcional' : 'optional'})
              </label>
              <input
                type="tel"
                placeholder="+1 555-0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 transition-all font-medium"
              />
            </div>

            {/* Fecha nacimiento */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {t.birthDate} ({language === 'es' ? 'opcional' : 'optional'})
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Genéro */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t.gender}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSexo('F')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                    sexo === 'F'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.female} 👩
                </button>
                <button
                  type="button"
                  onClick={() => setSexo('M')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                    sexo === 'M'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.male} 👨
                </button>
              </div>
            </div>

            {/* ¿Es primera vez? */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t.isFirstTime}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFirstCheck('yes')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                    isFirstCheck === 'yes'
                      ? 'bg-green-50 border-green-200 text-green-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-705 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.yes}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFirstCheck('no')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                    isFirstCheck === 'no'
                      ? 'bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.no}
                </button>
              </div>
            </div>
          </div>

          {/* Evento donde llego */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              {t.eventWhereArrived}
            </label>
            <select
              value={llegoA}
              onChange={(e) => setLlegoA(e.target.value as EventType)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 cursor-pointer text-slate-800 font-semibold"
            >
              <option value="servicio_11">{language === 'es' ? 'Servicio Domingo 11:00 am' : 'Sunday Service 11:00 am'}</option>
              <option value="servicio_6">{language === 'es' ? 'Servicio Domingo 6:00 pm' : 'Sunday Service 6:00 pm'}</option>
              <option value="grupo_conexion">{language === 'es' ? 'Grupo de conexión' : 'Connection Group'}</option>
              <option value="grupo_hombres">{language === 'es' ? 'Grupo de hombres' : 'Men\'s Group'}</option>
              <option value="grupo_mujeres">{language === 'es' ? 'Grupo de mujeres' : 'Women\'s Group'}</option>
            </select>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              {t.optionalNote}
            </label>
            <textarea
              placeholder={language === 'es' ? "Ingresa cualquier nota relevante..." : "Any relevant notes..."}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 transition-all font-medium resize-none"
            />
          </div>

          <div className="flex gap-2.5 p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-950 font-medium text-xs leading-5">
            <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <span>
              {language === 'es' 
                ? "La nueva persona quedará guardada en el directorio y marcada automáticamente como asistente de hoy para este evento."
                : "The newly created person will be added to high-level registers and marked immediately as present for today's chosen tracker."}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 text-xs font-bold bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {t.saveAndMark}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
