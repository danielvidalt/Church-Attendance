import { useMemo, useState } from 'react';
import { CheckCircle2, HeartHandshake, MessageSquareHeart, Plus, Trash2 } from 'lucide-react';
import { Language, Persona, PrayerRequest } from '../types';

interface PrayerRequestsModuleProps {
  language: Language;
  people: Persona[];
  requests: PrayerRequest[];
  username: string;
  onAddRequest: (request: PrayerRequest) => Promise<void>;
  onUpdateRequest: (id: string, updates: Partial<PrayerRequest>) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
}

const privacyStyles: Record<PrayerRequest['privacidad'], string> = {
  publica: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  privada: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  confidencial: 'bg-rose-50 text-rose-800 border-rose-200',
};

const stateStyles: Record<PrayerRequest['estado'], string> = {
  abierta: 'bg-amber-50 text-amber-900 border-amber-200',
  seguimiento: 'bg-blue-50 text-blue-800 border-blue-200',
  contestada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cerrada: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function PrayerRequestsModule({
  language,
  people,
  requests,
  username,
  onAddRequest,
  onUpdateRequest,
  onDeleteRequest,
}: PrayerRequestsModuleProps) {
  const es = language === 'es';
  const [personaId, setPersonaId] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [categoria, setCategoria] = useState(es ? 'Familia' : 'Family');
  const [privacidad, setPrivacidad] = useState<PrayerRequest['privacidad']>('privada');
  const [descripcion, setDescripcion] = useState('');
  const [fechaSeguimiento, setFechaSeguimiento] = useState('');
  const [resultadoDrafts, setResultadoDrafts] = useState<Record<string, string>>({});

  const openRequests = useMemo(() => requests.filter((r) => r.estado !== 'cerrada'), [requests]);
  const answeredCount = useMemo(() => requests.filter((r) => r.estado === 'contestada').length, [requests]);
  const confidentialCount = useMemo(() => requests.filter((r) => r.privacidad === 'confidencial' && r.estado !== 'cerrada').length, [requests]);

  const personById = (id?: string) => people.find((p) => p.id === id);

  const handlePersonChange = (id: string) => {
    setPersonaId(id);
    const person = personById(id);
    if (person) setSolicitante(person.nombre_completo);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!solicitante.trim() || !descripcion.trim()) return;
    await onAddRequest({
      id: 'pr_' + Date.now(),
      persona_id: personaId || undefined,
      solicitante_nombre: solicitante.trim(),
      fecha: new Date().toISOString().substring(0, 10),
      categoria: categoria.trim() || (es ? 'General' : 'General'),
      privacidad,
      descripcion: descripcion.trim(),
      estado: 'abierta',
      responsable: username,
      fecha_seguimiento: fechaSeguimiento || undefined,
      orando_count: 0,
    });
    setDescripcion('');
    setSolicitante('');
    setPersonaId('');
    setFechaSeguimiento('');
  };

  return (
    <div className="font-sans space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareHeart className="w-5 h-5 text-rose-500" />
          <span>{es ? 'Peticiones de Oración' : 'Prayer Requests'}</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {es ? 'Registra necesidades, asigna seguimiento y convierte respuestas en testimonio.' : 'Capture needs, assign follow-up and turn answers into testimonies.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Abiertas' : 'Open'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{openRequests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Contestadas' : 'Answered'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{answeredCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Confidenciales' : 'Confidential'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{confidentialCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>{es ? 'Nueva petición' : 'New request'}</span>
          </h3>
          <select value={personaId} onChange={(e) => handlePersonChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white">
            <option value="">{es ? 'Persona del directorio o manual' : 'Directory person or manual'}</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.nombre_completo}</option>)}
          </select>
          <input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder={es ? 'Solicitante' : 'Requester'} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
          <div className="grid grid-cols-2 gap-3">
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder={es ? 'Categoría' : 'Category'} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
            <select value={privacidad} onChange={(e) => setPrivacidad(e.target.value as PrayerRequest['privacidad'])} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white">
              <option value="publica">{es ? 'Pública' : 'Public'}</option>
              <option value="privada">{es ? 'Privada' : 'Private'}</option>
              <option value="confidencial">{es ? 'Confidencial' : 'Confidential'}</option>
            </select>
          </div>
          <input type="date" value={fechaSeguimiento} onChange={(e) => setFechaSeguimiento(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={es ? 'Descripción de la petición' : 'Request description'} className="w-full min-h-28 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold resize-none" />
          <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">
            {es ? 'Guardar petición' : 'Save request'}
          </button>
        </form>

        <div className="xl:col-span-2 space-y-3">
          {requests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-sm font-semibold text-slate-400">
              {es ? 'No hay peticiones registradas todavía.' : 'No prayer requests have been recorded yet.'}
            </div>
          ) : (
            requests.map((request) => {
              const person = personById(request.persona_id);
              const resultDraft = resultadoDrafts[request.id] ?? request.resultado ?? '';
              return (
                <div key={request.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">{request.solicitante_nombre}</span>
                        {person && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID {person.id}</span>}
                        <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${privacyStyles[request.privacidad]}`}>{request.privacidad}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${stateStyles[request.estado]}`}>{request.estado}</span>
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{request.categoria} · {request.fecha}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateRequest(request.id, { orando_count: request.orando_count + 1 })} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4" />
                        <span>{es ? 'Estoy orando' : 'Praying'} ({request.orando_count})</span>
                      </button>
                      <button onClick={() => onDeleteRequest(request.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title={es ? 'Eliminar' : 'Delete'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">{request.descripcion}</p>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                    <input value={resultDraft} onChange={(e) => setResultadoDrafts((prev) => ({ ...prev, [request.id]: e.target.value }))} placeholder={es ? 'Resultado, seguimiento o testimonio' : 'Outcome, follow-up or testimony'} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
                    <button onClick={() => onUpdateRequest(request.id, { resultado: resultDraft, estado: resultDraft.trim() ? 'contestada' : 'seguimiento' })} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{es ? 'Actualizar' : 'Update'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
