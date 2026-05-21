import { Language } from '../types';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageToggle({ currentLanguage, onLanguageChange }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onLanguageChange(currentLanguage === 'es' ? 'en' : 'es')}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer border border-slate-200/50"
    >
      <Globe className="w-3.5 h-3.5 text-blue-800" />
      <span>{currentLanguage === 'es' ? 'English' : 'Español'}</span>
    </button>
  );
}
