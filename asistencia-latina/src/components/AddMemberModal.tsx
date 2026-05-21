import React, { useState } from 'react';
import { Language, Persona, MemberStatus } from '../types';
import { X, Users, Camera } from 'lucide-react';
import { formatDate } from '../utils/attendance';

interface AddMemberModalProps {
  language: Language;
  onClose: () => void;
  onSave: (newPerson: Persona) => void;
}

export default function AddMemberModal({ language, onClose, onSave }: AddMemberModalProps) {
  const es = language === 'es';

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F'>('F');
  const [estado, setEstado] = useState<MemberStatus>('activo');
  const [fechaPrimeraVisita, setFechaPrimeraVisita] = useState('');
  const [nota, setNota] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | undefined>(undefined);
  const [errorName, setErrorName] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 150;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setFotoPerfil(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) { setErrorName(true); return; }

    const todayStr = formatDate(new Date());
    const newPerson: Persona = {
      id: 'p_dir_' + Date.now(),
      nombre_completo: nombreCompleto.trim(),
      telefono: telefono.trim() || undefined,
      fecha_nacimiento: fechaNacimiento || undefined,
      fecha_creacion: todayStr,
      fecha_primera_visita: fechaPrimeraVisita || undefined,
      estado,
      sexo,
      notas: nota.trim() || undefined,
      foto_perfil: fotoPerfil,
    };

    onSave(newPerson);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight leading-none">
                {es ? 'Agregar Miembro al Directorio' : 'Add Member to Directory'}
              </h3>
              <p className="text-[11px] text-emerald-200 font-semibold mt-0.5">
                {es ? 'Para personas que ya son parte de la iglesia' : 'For people already part of the church'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700 overflow-y-auto flex-1">

          {/* Photo & Name */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center shrink-0">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">
                {es ? 'Foto de Perfil' : 'Profile Photo'}
              </span>
              <div className="relative group w-16 h-16">
                <input type="file" id="dir-avatar-input" accept="image/*" onChange={handleImageChange} className="hidden" />
                <label
                  htmlFor="dir-avatar-input"
                  className="w-16 h-16 bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative shadow-sm"
                >
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-[9px] font-black tracking-wider">
                      <Camera className="w-5 h-5 text-emerald-600 mb-0.5" />
                      <span>{es ? 'AÑADIR' : 'ADD'}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center py-0.5 text-white text-[8px] font-extrabold uppercase">
                    {es ? 'Editar' : 'Edit'}
                  </div>
                </label>
                {fotoPerfil && (
                  <button
                    type="button"
                    onClick={() => setFotoPerfil(undefined)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {es ? 'Nombre completo' : 'Full name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={es ? 'Ej. María González' : 'e.g. Maria Gonzalez'}
                value={nombreCompleto}
                onChange={(e) => { setNombreCompleto(e.target.value); if (e.target.value.trim()) setErrorName(false); }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-700 transition-all font-bold text-slate-800 placeholder-slate-400 ${
                  errorName ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {errorName && (
                <span className="text-red-600 text-[11px] font-medium block mt-1">
                  {es ? 'Este campo es obligatorio' : 'This field is required'}
                </span>
              )}
            </div>
          </div>

          {/* Phone & Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {es ? 'Teléfono' : 'Phone'} ({es ? 'opcional' : 'optional'})
              </label>
              <input
                type="tel"
                placeholder="+1 555-0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-700 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {es ? 'Fecha de nacimiento' : 'Date of birth'} ({es ? 'opcional' : 'optional'})
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-700 transition-all font-medium"
              />
            </div>
          </div>

          {/* Gender & Status */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {es ? 'Género' : 'Gender'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['F', 'M'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSexo(g)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center cursor-pointer transition-all ${
                      sexo === g
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g === 'F' ? (es ? 'Femenino 👩' : 'Female 👩') : (es ? 'Masculino 👨' : 'Male 👨')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {es ? 'Estado / Rol' : 'Membership Status'}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(['activo', 'nuevo', 'inactivo'] as MemberStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEstado(st)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded-xl border cursor-pointer transition-all ${
                      estado === st
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'activo' ? (es ? 'Activo' : 'Active') : st === 'nuevo' ? (es ? 'Nuevo' : 'New') : (es ? 'Inactivo' : 'Inactive')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* First visit date */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              {es ? 'Fecha de primera visita' : 'First visit date'} ({es ? 'opcional' : 'optional'})
            </label>
            <input
              type="date"
              value={fechaPrimeraVisita}
              onChange={(e) => setFechaPrimeraVisita(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-700 transition-all font-medium"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              {es ? 'Nota pastoral' : 'Pastoral note'} ({es ? 'opcional' : 'optional'})
            </label>
            <textarea
              placeholder={es ? 'Cualquier observación relevante...' : 'Any relevant notes...'}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-700 transition-all font-medium resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
            >
              {es ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {es ? 'Guardar en Directorio' : 'Save to Directory'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
