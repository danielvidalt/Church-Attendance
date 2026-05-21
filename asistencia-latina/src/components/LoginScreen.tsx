import React, { useState } from 'react';
import { Language, esTranslations, enTranslations, Usuario } from '../types';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Award, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: Usuario) => void;
}

export default function LoginScreen({ language, onLanguageChange, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = language === 'es' ? esTranslations : enTranslations;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const lowerEmail = email.toLowerCase().trim();

    if (lowerEmail === 'admin@comunidad.org' && password === 'admin123') {
      onLoginSuccess({
        id: 'u1',
        nombre: 'Daniel Vidal (Admin)',
        email_login: 'admin@comunidad.org',
        rol: 'administrador',
        idioma_preferido: language
      });
    } else if (lowerEmail === 'lider@comunidad.org' && password === 'lider123') {
      onLoginSuccess({
        id: 'u2',
        nombre: 'Líder Gabriel (Asistencia)',
        email_login: 'lider@comunidad.org',
        rol: 'lider',
        idioma_preferido: language
      });
    } else {
      setErrorMsg(t.wrongCredentials);
    }
  };

  const loginAs = (type: 'admin' | 'lider') => {
    if (type === 'admin') {
      setEmail('admin@comunidad.org');
      setPassword('admin123');
      onLoginSuccess({
        id: 'u1',
        nombre: 'Daniel Vidal (Admin)',
        email_login: 'admin@comunidad.org',
        rol: 'administrador',
        idioma_preferido: language
      });
    } else {
      setEmail('lider@comunidad.org');
      setPassword('lider123');
      onLoginSuccess({
        id: 'u2',
        nombre: 'Líder Gabriel (Asistencia)',
        email_login: 'lider@comunidad.org',
        rol: 'lider',
        idioma_preferido: language
      });
    }
  };  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative p-4 font-sans selection:bg-indigo-100 animate-fade-in">
      {/* Decorative pastoral backdrops */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-500" />
      
      {/* Absolute Header Lang Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="es">Español 🇪🇸</option>
          <option value="en">English 🇺🇸</option>
        </select>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mt-6">
        {/* Brand Banner */}
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white mb-3 shadow-inner">
            <span className="text-xl font-bold font-mono">CL</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t.appName}</h1>
          <p className="text-xs text-indigo-100 font-bold tracking-widest mt-1.5 uppercase">{t.tagline}</p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-extrabold text-slate-900">{t.loginTitle}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.loginSubtitle}</p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 font-semibold text-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@comunidad.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-black bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-xl transition-all hover:-translate-y-0.5 duration-150 cursor-pointer"
            >
              {t.enterBtn}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest mb-3">
              {t.demoAccess}
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => loginAs('admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800 text-indigo-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Admin Principal</span>
              </button>
              <button
                type="button"
                onClick={() => loginAs('lider')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Líder / Voluntario</span>
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 font-bold mt-4">
              Admin: <span className="font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">admin@comunidad.org / admin123</span><br />
              <div className="mt-1">Líder: <span className="font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">lider@comunidad.org / lider123</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-[10px] text-slate-400 font-bold mt-6">
        &copy; {new Date().getFullYear()} Comunidad Latina • {t.tagline}
      </div>
    </div>
  );
}
