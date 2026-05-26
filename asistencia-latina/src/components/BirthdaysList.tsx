import { useMemo } from 'react';
import { Language, esTranslations, enTranslations, Persona, Configuracion } from '../types';
import { calculateBirthdays } from '../utils/attendance';
import { Cake, Gift, PhoneCall, Calendar, PlusCircle } from 'lucide-react';

interface BirthdaysListProps {
  language: Language;
  people: Persona[];
  config: Configuracion;
  onNavigateToPeople?: () => void;
}

export default function BirthdaysList({
  language,
  people,
  config,
  onNavigateToPeople
}: BirthdaysListProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  // May 21, 2026 is our standard relative anchor date to match seeded birth records
  const anchorDateStr = "2026-05-21";

  const { hoy, estaSemana } = useMemo(() => {
    return calculateBirthdays(people, anchorDateStr, config.dias_recordatorio_cumpleanos);
  }, [people, config.dias_recordatorio_cumpleanos]);

  // Under user feedback Requirement 4, replace Upcoming Birthdays with Month-based birthdays
  const cumpleanosEsteMes = useMemo(() => {
    const refDate = new Date(anchorDateStr + 'T00:00:00');
    const targetMonth = refDate.getMonth(); // 4 for May (May 2026)
    const refYear = refDate.getFullYear();

    return people
      .filter((p) => {
        if (!p.fecha_nacimiento || p.estado === 'inactivo') return false;
        const bParts = p.fecha_nacimiento.split('-');
        if (bParts.length !== 3) return false;
        const bMonth = parseInt(bParts[1]) - 1; // 0-indexed
        return bMonth === targetMonth;
      })
      .map((p) => {
        const bParts = p.fecha_nacimiento!.split('-');
        const bDay = parseInt(bParts[2]);
        const bMonth = parseInt(bParts[1]) - 1;
        const bYear = parseInt(bParts[0]);
        const ageThisYear = refYear - bYear;
        return {
          id: p.id,
          nombreCompleto: p.nombre_completo,
          dia: bDay,
          nacimientoFormateado: `${bDay}/${bMonth + 1}`,
          edadProxima: ageThisYear,
          telefono: p.telefono
        };
      })
      .sort((a, b) => a.dia - b.dia);
  }, [people]);

  return (
    <div className="font-sans space-y-6">
      
      {/* Upper header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Cake className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
          <span>{t.birthdaysTitle}</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          📍 {t.birthdaysIntro}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Today Birthdays */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500" />
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>{t.todayBirthdays}</span>
          </h3>

          {hoy.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
              🎈 {t.noBirthdaysToday}
            </div>
          ) : (
            <div className="space-y-3">
              {hoy.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950">{item.nombreCompleto}</h4>
                    <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                      🍰 {item.edadProxima} {t.age} ({item.nacimientoFormateado})
                    </p>
                  </div>
                  {item.telefono && (
                    <a
                      href={`tel:${item.telefono}`}
                      className="p-2 bg-white text-emerald-700 hover:bg-emerald-100 rounded-full border border-emerald-200 shadow-sm transition-all cursor-pointer"
                      title={t.sendCongratulation}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: This Week Birthdays */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{t.thisWeekBirthdays}</span>
          </h3>

          {estaSemana.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
              📅 {t.noBirthdaysThisWeek}
            </div>
          ) : (
            <div className="space-y-3">
              {estaSemana.map((item) => {
                const days = item.diasParaCumpleanos;
                const noticeText = days === 1 ? t.daysLeft.replace('{n}', days.toString()) : t.daysLeftPlural.replace('{n}', days.toString());
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.nombreCompleto}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        🎈 {item.edadProxima} {t.age} • ({item.nacimientoFormateado})
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-indigo-805 text-indigo-800 bg-white border border-indigo-100 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                      {noticeText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Cumpleaños de este mes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Cake className="w-4 h-4 text-indigo-500" />
            <span>{language === 'es' ? 'Cumpleaños de este mes (Mayo)' : 'Birthdays of this month (May)'}</span>
          </h3>

          {cumpleanosEsteMes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
              🎂 {language === 'es' ? 'No hay cumpleaños este mes.' : 'No birthdays registered this month.'}
            </div>
          ) : (
            <div className="space-y-2.5 font-semibold">
              {cumpleanosEsteMes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100"
                >
                  <div className="truncate pr-2">
                    <span className="text-slate-700">{item.nombreCompleto}</span>
                    <span className="block text-[10px] font-medium text-slate-400 italic">
                      🎂 {item.edadProxima} {t.age} ({item.nacimientoFormateado})
                    </span>
                  </div>
                  {item.telefono ? (
                    <a
                      href={`tel:${item.telefono}`}
                      className="text-[10px] text-indigo-605 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded transition-all font-bold uppercase shrink-0"
                      title={t.sendCongratulation}
                    >
                      {language === 'es' ? 'Llamar' : 'Call'}
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-350 shrink-0 font-mono text-[9px] uppercase">
                      {language === 'es' ? 'Sin tlf' : 'No tel'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Action panel to add birthday info to more people */}
      {onNavigateToPeople && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm font-bold">
          <div className="space-y-1">
            <h4 className="text-sm tracking-tight text-slate-900">{language === 'es' ? '¿Falta información de cumpleaños?' : 'Missing birthday dates?'}</h4>
            <p className="text-[11px] text-slate-400 font-semibold">{language === 'es' ? 'Ve al directorio de personas y edita el perfil de los miembros.' : 'Navigate to index profiles and update birth records.'}</p>
          </div>
          <button
            onClick={onNavigateToPeople}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs text-white transition-all cursor-pointer shadow-sm shadow-indigo-100"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'es' ? 'Ir al Directorio' : 'Open Directory'}</span>
          </button>
        </div>
      )}

    </div>
  );
}
