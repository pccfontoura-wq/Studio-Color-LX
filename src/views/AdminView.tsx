import React, { useMemo, useState } from 'react';
import {
  LogOut,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import {
  AppointmentItem,
  ProfessionalContract,
  ProfessionalPublic,
  SALON_CONFIG,
  SalonSettingsData,
  ServiceItem,
} from '../config/salonConfig';
import {
  formatDatePt,
  formatShortDatePt,
  getLisbonNowParts,
  minutesToTime,
  timeToMinutes,
} from '../utils/lisbonTime';

type AdminTab =
  | 'agenda'
  | 'professionals'
  | 'services'
  | 'clients'
  | 'commissions'
  | 'settings';

export const AdminView: React.FC = () => {
  const {
    user,
    isOwner,
    authLoading,
    services,
    professionals,
    contracts,
    appointments,
    settings,
    loginOwner,
    logoutOwner,
    createPublicAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    deleteAppointmentRecord,
    saveService,
    deleteServiceRecord,
    saveProfessional,
    deleteProfessionalRecord,
    saveSalonSettings,
  } = useSalon();

  const [activeTab, setActiveTab] = useState<AdminTab>('agenda');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setErrorMsg(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  // --- AGENDA STATE ---
  const lisbonNow = useMemo(() => getLisbonNowParts(), []);
  const [agendaMode, setAgendaMode] = useState<'day' | 'week'>('day');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>(lisbonNow.dateStr);
  const [filterProfId, setFilterProfId] = useState<string>('all');

  // Modal: Nova Marcação Manual
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [newAptProfId, setNewAptProfId] = useState<string>(
    professionals[0]?.id || 'prof-carolina'
  );
  const [newAptServiceIds, setNewAptServiceIds] = useState<string[]>(
    services[0] ? [services[0].id] : []
  );
  const [newAptDate, setNewAptDate] = useState<string>(lisbonNow.dateStr);
  const [newAptStartTime, setNewAptStartTime] = useState<string>('10:00');
  const [newAptClientName, setNewAptClientName] = useState('');
  const [newAptClientPhone, setNewAptClientPhone] = useState('');
  const [newAptClientEmail, setNewAptClientEmail] = useState('');
  const [newAptNotes, setNewAptNotes] = useState('');

  // Modal: Remarcar / Editar Marcação
  const [editingApt, setEditingApt] = useState<AppointmentItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editProfId, setEditProfId] = useState('');

  // --- PROFESSIONALS STATE ---
  const [editingProf, setEditingProf] = useState<ProfessionalPublic | null>(null);
  const [editingContract, setEditingContract] = useState<ProfessionalContract>({
    professionalId: '',
    contractType: 'comissao',
    commissionPercent: 40,
  });
  const [newDayOffInput, setNewDayOffInput] = useState('');

  // --- SERVICES STATE ---
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // --- COMMISSIONS REPORT STATE ---
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const { year, month } = getLisbonNowParts();
    return `${year}-${String(month).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    const { year, month } = getLisbonNowParts();
    return `${year}-${String(month).padStart(2, '0')}-31`;
  });

  // --- SETTINGS STATE ---
  const [settingsForm, setSettingsForm] = useState<SalonSettingsData>(settings);
  React.useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // --- AUTH GATE ---
  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-[#2A2628]/70">
        A verificar sessão...
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs text-[#2A2628]/60">Painel Privado · Administração</p>
          <h1 className="font-serif-display text-3xl font-normal text-[#2A2628]">
            Acesso Exclusivo do Proprietário
          </h1>
          <p className="text-sm text-[#2A2628]/75 leading-relaxed">
            Aceda ao painel de administração para gerir a agenda, profissionais, serviços,
            clientes e relatórios de comissões.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loginOwner().catch((e) =>
              setErrorMsg(e instanceof Error ? e.message : 'Erro ao aceder ao painel.')
            )
          }
          className="w-full py-3.5 px-6 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors cursor-pointer"
        >
          Aceder ao Painel
        </button>

        {errorMsg && <p className="text-xs text-[#C84B7E]">{errorMsg}</p>}
      </div>
    );
  }

  // --- HELPER COMPUTATIONS FOR OWNER ---

  // Week dates around selectedAgendaDate
  const weekDates = (() => {
    const [y, m, d] = selectedAgendaDate.split('-').map((n) => parseInt(n, 10));
    const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(base.getTime() + i * 86400000);
      const yy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dt.getUTCDate()).padStart(2, '0');
      list.push(`${yy}-${mm}-${dd}`);
    }
    return list;
  })();

  const filteredAppointments = appointments.filter((apt) => {
    if (filterProfId !== 'all' && apt.professionalId !== filterProfId) return false;
    if (agendaMode === 'day') {
      return apt.date === selectedAgendaDate;
    } else {
      return weekDates.includes(apt.date);
    }
  });

  // Clients aggregation from appointments
  const clientsList = (() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        email: string;
        history: AppointmentItem[];
      }
    >();

    for (const apt of appointments) {
      const key = apt.clientEmail.toLowerCase() || apt.clientPhone;
      const existing = map.get(key);
      if (existing) {
        existing.history.push(apt);
      } else {
        map.set(key, {
          name: apt.clientName,
          phone: apt.clientPhone,
          email: apt.clientEmail,
          history: [apt],
        });
      }
    }
    return Array.from(map.values());
  })();

  // Commissions calculation (only contractType === 'comissao' and status === 'concluida')
  const commissionRows = (() => {
    const rows: {
      prof: ProfessionalPublic;
      percent: number;
      completedCount: number;
      totalBilled: number;
      amountToPay: number;
    }[] = [];

    for (const prof of professionals) {
      const contract = contracts[prof.id] || {
        professionalId: prof.id,
        contractType: 'fixo',
        commissionPercent: 0,
      };
      // Profissionais com contrato "fixo" não aparecem neste relatório
      if (contract.contractType !== 'comissao') continue;

      const completedApts = appointments.filter(
        (apt) =>
          apt.professionalId === prof.id &&
          apt.status === 'concluida' &&
          apt.date >= reportStartDate &&
          apt.date <= reportEndDate
      );

      const totalBilled = completedApts.reduce((sum, a) => sum + Number(a.totalPrice || 0), 0);
      const amountToPay = Number(((totalBilled * contract.commissionPercent) / 100).toFixed(2));

      rows.push({
        prof,
        percent: contract.commissionPercent,
        completedCount: completedApts.length,
        totalBilled,
        amountToPay,
      });
    }
    return rows;
  })();

  const totalPeriodBilled = commissionRows.reduce((s, r) => s + r.totalBilled, 0);
  const totalPeriodCommissions = commissionRows.reduce((s, r) => s + r.amountToPay, 0);

  // Handlers
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chosenServices = services.filter((s) => newAptServiceIds.includes(s.id));
    if (chosenServices.length === 0) {
      setErrorMsg('Selecione pelo menos um serviço.');
      return;
    }
    const prof = professionals.find((p) => p.id === newAptProfId);
    if (!prof) return;

    const totalDur = chosenServices.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalVal = chosenServices.reduce((acc, s) => acc + s.price, 0);
    const endTime = minutesToTime(timeToMinutes(newAptStartTime) + totalDur);

    try {
      await createPublicAppointment({
        professionalId: prof.id,
        professionalName: prof.name,
        serviceIds: chosenServices.map((s) => s.id),
        serviceNames: chosenServices.map((s) => s.name),
        totalPrice: totalVal,
        totalDurationMinutes: totalDur,
        date: newAptDate,
        startTime: newAptStartTime,
        endTime,
        clientName: newAptClientName,
        clientPhone: newAptClientPhone,
        clientEmail: newAptClientEmail,
        notes: newAptNotes,
        gdprConsent: true,
      });
      setShowNewAptModal(false);
      setNewAptClientName('');
      setNewAptClientPhone('');
      setNewAptClientEmail('');
      setNewAptNotes('');
      showToast('Marcação criada com sucesso.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar marcação.');
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setErrorMsg(null);

    const prof = professionals.find((p) => p.id === editProfId);
    if (!prof) return;

    const newEndTime = minutesToTime(
      timeToMinutes(editStartTime) + editingApt.totalDurationMinutes
    );

    try {
      await rescheduleAppointment(
        editingApt,
        editDate,
        editStartTime,
        newEndTime,
        prof.id,
        prof.name
      );
      setEditingApt(null);
      showToast('Marcação remarcada com sucesso.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao remarcar.');
    }
  };

  const statusLabels: Record<AppointmentItem['status'], string> = {
    confirmada: 'Confirmada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    nao_compareceu: 'Não compareceu',
  };

  const dayNamesPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2A2628]/10">
        <div>
          <p className="text-xs text-[#2A2628]/60">
            Painel de Gestão{user?.email ? ` · Sessão iniciada como ${user.email}` : ' · Modo de Demonstração'}
          </p>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
            Administração {settings.salonName}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => logoutOwner()}
          className="px-4 py-2 text-xs font-medium text-[#2A2628] border border-[#2A2628]/20 hover:border-[#2A2628] rounded-lg inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Terminar Sessão</span>
        </button>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-1 p-1 bg-[#2A2628]/5 rounded-xl overflow-x-auto">
        {[
          { id: 'agenda', label: '1. Agenda' },
          { id: 'professionals', label: '2. Profissionais' },
          { id: 'services', label: '3. Serviços' },
          { id: 'clients', label: '4. Clientes' },
          { id: 'commissions', label: '5. Comissões' },
          { id: 'settings', label: '6. Definições' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as AdminTab);
              setErrorMsg(null);
            }}
            className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#2A2628] shadow-xs'
                : 'text-[#2A2628]/70 hover:text-[#2A2628]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-[#2A2628] text-white text-xs font-medium">
          {feedback}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-[#C84B7E] bg-[#F6E8EE] text-[#2A2628] text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* 1. ABA AGENDA */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A2628]/10">
            <div className="flex flex-wrap items-center gap-3">
              {/* Vista Dia / Semana */}
              <div className="inline-flex p-1 bg-[#2A2628]/5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAgendaMode('day')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    agendaMode === 'day' ? 'bg-white text-[#2A2628]' : 'text-[#2A2628]/70'
                  }`}
                >
                  Vista por Dia
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaMode('week')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    agendaMode === 'week' ? 'bg-white text-[#2A2628]' : 'text-[#2A2628]/70'
                  }`}
                >
                  Vista por Semana
                </button>
              </div>

              {/* Data */}
              <input
                type="date"
                value={selectedAgendaDate}
                onChange={(e) => setSelectedAgendaDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#2A2628]/20 bg-white"
              />

              {/* Filtro por Profissional */}
              <select
                value={filterProfId}
                onChange={(e) => setFilterProfId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#2A2628]/20 bg-white"
              >
                <option value="all">Todas as Profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowNewAptModal(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg inline-flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Marcação</span>
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-10 text-center border border-[#2A2628]/10 rounded-xl bg-white/50 text-sm text-[#2A2628]/65">
              Sem marcações registadas para o período e filtro selecionados.
            </div>
          ) : (
            <div className="divide-y divide-[#2A2628]/10 border-t border-b border-[#2A2628]/10">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#2A2628]/65 tabular-nums">
                      <span className="font-semibold text-[#2A2628]">
                        {formatShortDatePt(apt.date)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#2A2628]">
                        {apt.startTime} – {apt.endTime}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Profissional: {apt.professionalName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#C84B7E]">
                        Estado: {statusLabels[apt.status]}
                      </span>
                    </div>

                    <p className="font-serif-display text-xl font-medium text-[#2A2628]">
                      {apt.clientName}{' '}
                      <span className="font-sans text-xs font-normal text-[#2A2628]/70 tabular-nums">
                        ({apt.clientPhone} · {apt.clientEmail})
                      </span>
                    </p>

                    <p className="text-xs text-[#2A2628]/80">
                      {apt.serviceNames.join(' + ')} —{' '}
                      <strong className="tabular-nums">{apt.totalPrice} €</strong> (
                      {apt.totalDurationMinutes} min)
                    </p>

                    {apt.notes && (
                      <p className="text-xs text-[#2A2628]/60 italic">Nota: {apt.notes}</p>
                    )}
                  </div>

                  {/* Ações de Estado & Remarcação */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateAppointmentStatus(apt, 'concluida').then(() =>
                          showToast('Marcação marcada como concluída.')
                        )
                      }
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        apt.status === 'concluida'
                          ? 'bg-[#2A2628] text-white border-[#2A2628]'
                          : 'border-[#2A2628]/20 hover:border-[#2A2628] text-[#2A2628]'
                      }`}
                    >
                      Concluída
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAppointmentStatus(apt, 'nao_compareceu').then(() =>
                          showToast('Marcada como não compareceu.')
                        )
                      }
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        apt.status === 'nao_compareceu'
                          ? 'bg-[#2A2628] text-white border-[#2A2628]'
                          : 'border-[#2A2628]/20 hover:border-[#2A2628] text-[#2A2628]'
                      }`}
                    >
                      Não compareceu
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingApt(apt);
                        setEditDate(apt.date);
                        setEditStartTime(apt.startTime);
                        setEditProfId(apt.professionalId);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[#2A2628]/20 hover:border-[#C84B7E] text-[#2A2628] cursor-pointer"
                    >
                      Remarcar / Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAppointmentStatus(apt, 'cancelada').then(() =>
                          showToast('Marcação cancelada.')
                        )
                      }
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        apt.status === 'cancelada'
                          ? 'bg-[#C84B7E] text-white border-[#C84B7E]'
                          : 'border-[#2A2628]/20 hover:border-[#C84B7E] text-[#C84B7E]'
                      }`}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAppointmentRecord(apt).then(() =>
                          showToast('Registo de marcação eliminado.')
                        )
                      }
                      className="p-1.5 text-[#2A2628]/50 hover:text-[#C84B7E] cursor-pointer"
                      aria-label="Eliminar marcação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Nova Marcação Manual */}
          {showNewAptModal && (
            <div className="p-6 rounded-xl border border-[#2A2628]/20 bg-white space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                  Criar Marcação na Agenda
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(false)}
                  className="p-1 text-[#2A2628]/60 hover:text-[#2A2628]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualAppointment} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Profissional</label>
                  <select
                    value={newAptProfId}
                    onChange={(e) => setNewAptProfId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={newAptDate}
                      onChange={(e) => setNewAptDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Hora Início</label>
                    <input
                      type="time"
                      required
                      value={newAptStartTime}
                      onChange={(e) => setNewAptStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Serviços</label>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => {
                      const sel = newAptServiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setNewAptServiceIds((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((i) => i !== s.id)
                                : [...prev, s.id]
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                            sel
                              ? 'border-[#C84B7E] bg-[#F6E8EE] font-medium'
                              : 'border-[#2A2628]/15'
                          }`}
                        >
                          {s.name} ({s.price} €)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newAptClientName}
                    onChange={(e) => setNewAptClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Telemóvel *</label>
                  <input
                    type="tel"
                    required
                    value={newAptClientPhone}
                    onChange={(e) => setNewAptClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newAptClientEmail}
                    onChange={(e) => setNewAptClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <input
                    type="text"
                    value={newAptNotes}
                    onChange={(e) => setNewAptNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAptModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#2A2628]/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#2A2628] text-white font-medium cursor-pointer"
                  >
                    Gravar Marcação
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Remarcar */}
          {editingApt && (
            <div className="p-6 rounded-xl border border-[#C84B7E] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                  Remarcar Marcação — {editingApt.clientName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="p-1 text-[#2A2628]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveReschedule} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Profissional</label>
                  <select
                    value={editProfId}
                    onChange={(e) => setEditProfId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Nova Data</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Nova Hora Início</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingApt(null)}
                    className="px-4 py-2 rounded-lg border border-[#2A2628]/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#C84B7E] text-white font-medium cursor-pointer"
                  >
                    Confirmar Remarcação
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. ABA PROFISSIONAIS */}
      {activeTab === 'professionals' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2628]/10">
            <div>
              <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                Equipa, Horários, Folgas &amp; Contratos
              </h2>
              <p className="text-xs text-[#2A2628]/65">
                Configure serviços realizados, horário semanal, férias/folgas e regime contratual
                (fixo ou comissão).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const newId = `prof_${Date.now()}`;
                setEditingProf({
                  id: newId,
                  name: '',
                  role: 'Hair Stylist & Colorist',
                  bio: '',
                  photoUrl: SALON_CONFIG.images.stylist1,
                  serviceIds: services.map((s) => s.id),
                  workingDays: [2, 3, 4, 5, 6],
                  workStart: '10:00',
                  workEnd: '19:00',
                  daysOff: [],
                  active: true,
                });
                setEditingContract({
                  professionalId: newId,
                  contractType: 'comissao',
                  commissionPercent: 40,
                });
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Profissional</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {professionals.map((prof) => {
              const contract = contracts[prof.id] || {
                professionalId: prof.id,
                contractType: 'fixo',
                commissionPercent: 0,
              };
              return (
                <div
                  key={prof.id}
                  className="p-5 rounded-xl border border-[#2A2628]/15 bg-white/70 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={prof.photoUrl}
                        alt={prof.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover bg-[#F2ECE9]"
                      />
                      <div>
                        <h3 className="font-serif-display text-xl font-medium text-[#2A2628]">
                          {prof.name}
                        </h3>
                        <p className="text-xs text-[#2A2628]/65">{prof.role}</p>
                      </div>
                    </div>

                    <div className="text-xs text-[#2A2628]/80 space-y-1 pt-2 border-t border-[#2A2628]/10">
                      <p className="tabular-nums">
                        <strong>Horário:</strong> {prof.workStart} – {prof.workEnd} (
                        {prof.workingDays.map((d) => dayNamesPt[d]).join(', ')})
                      </p>
                      <p>
                        <strong>Contrato:</strong>{' '}
                        {contract.contractType === 'comissao'
                          ? `Comissão (${contract.commissionPercent}%)`
                          : 'Fixo (sem comissão)'}
                      </p>
                      <p className="tabular-nums">
                        <strong>Serviços habilitados:</strong> {prof.serviceIds.length} ·{' '}
                        <strong>Folgas:</strong> {prof.daysOff.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2A2628]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProf(prof);
                        setEditingContract(contract);
                      }}
                      className="text-xs font-medium text-[#2A2628] hover:text-[#C84B7E] underline underline-offset-4 cursor-pointer"
                    >
                      Editar Ficha &amp; Contrato
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteProfessionalRecord(prof.id).then(() =>
                          showToast('Profissional removida.')
                        )
                      }
                      className="text-xs text-[#2A2628]/50 hover:text-[#C84B7E] cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {editingProf && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveProfessional(editingProf, editingContract);
                setEditingProf(null);
                showToast('Dados da profissional atualizados.');
              }}
              className="p-6 rounded-xl border border-[#2A2628]/20 bg-white space-y-6 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                  Configurar Profissional
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProf(null)}
                  className="p-1 text-[#2A2628]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={editingProf.name}
                    onChange={(e) => setEditingProf({ ...editingProf, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Especialidade / Cargo *</label>
                  <input
                    type="text"
                    required
                    value={editingProf.role}
                    onChange={(e) => setEditingProf({ ...editingProf, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">URL da Fotografia *</label>
                  <input
                    type="text"
                    required
                    value={editingProf.photoUrl}
                    onChange={(e) => setEditingProf({ ...editingProf, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-medium mb-1">Apresentação Curta</label>
                  <input
                    type="text"
                    value={editingProf.bio}
                    onChange={(e) => setEditingProf({ ...editingProf, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                {/* Horário Semanal */}
                <div>
                  <label className="block font-medium mb-1">Hora de Entrada</label>
                  <input
                    type="time"
                    value={editingProf.workStart}
                    onChange={(e) => setEditingProf({ ...editingProf, workStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Hora de Saída</label>
                  <input
                    type="time"
                    value={editingProf.workEnd}
                    onChange={(e) => setEditingProf({ ...editingProf, workEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Dias de Trabalho Semanal</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dayNamesPt.map((label, dayIdx) => {
                      const active = editingProf.workingDays.includes(dayIdx);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? editingProf.workingDays.filter((d) => d !== dayIdx)
                              : [...editingProf.workingDays, dayIdx].sort();
                            setEditingProf({ ...editingProf, workingDays: next });
                          }}
                          className={`px-2.5 py-1 rounded border cursor-pointer ${
                            active
                              ? 'bg-[#2A2628] text-white border-[#2A2628]'
                              : 'border-[#2A2628]/20 text-[#2A2628]/60'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tipo de Contrato e Comissão */}
                <div>
                  <label className="block font-medium mb-1">Tipo de Contrato</label>
                  <select
                    value={editingContract.contractType}
                    onChange={(e) =>
                      setEditingContract({
                        ...editingContract,
                        contractType: e.target.value as 'fixo' | 'comissao',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  >
                    <option value="fixo">Fixo (sem comissão)</option>
                    <option value="comissao">Comissão (%)</option>
                  </select>
                </div>

                {editingContract.contractType === 'comissao' && (
                  <div>
                    <label className="block font-medium mb-1">Percentagem de Comissão (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingContract.commissionPercent}
                      onChange={(e) =>
                        setEditingContract({
                          ...editingContract,
                          commissionPercent: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                    />
                  </div>
                )}

                {/* Folgas / Férias específicas */}
                <div className="sm:col-span-3 space-y-2">
                  <label className="block font-medium">Datas de Folga / Ausência</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={newDayOffInput}
                      onChange={(e) => setNewDayOffInput(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[#2A2628]/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newDayOffInput &&
                          !editingProf.daysOff.includes(newDayOffInput)
                        ) {
                          setEditingProf({
                            ...editingProf,
                            daysOff: [...editingProf.daysOff, newDayOffInput].sort(),
                          });
                          setNewDayOffInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#2A2628]/10 hover:bg-[#2A2628]/20 font-medium cursor-pointer"
                    >
                      Adicionar Data de Folga
                    </button>
                  </div>
                  {editingProf.daysOff.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editingProf.daysOff.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F6E8EE] text-[#2A2628] tabular-nums"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProf({
                                ...editingProf,
                                daysOff: editingProf.daysOff.filter((x) => x !== d),
                              })
                            }
                            className="text-[#C84B7E] hover:text-[#2A2628]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Serviços que realiza */}
                <div className="sm:col-span-3 space-y-2">
                  <label className="block font-medium">Serviços que realiza</label>
                  <div className="flex flex-wrap gap-2">
                    {services.map((srv) => {
                      const has = editingProf.serviceIds.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            const next = has
                              ? editingProf.serviceIds.filter((i) => i !== srv.id)
                              : [...editingProf.serviceIds, srv.id];
                            setEditingProf({ ...editingProf, serviceIds: next });
                          }}
                          className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                            has
                              ? 'border-[#C84B7E] bg-[#F6E8EE] font-medium'
                              : 'border-[#2A2628]/15 text-[#2A2628]/60'
                          }`}
                        >
                          {srv.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProf(null)}
                  className="px-4 py-2 rounded-lg border border-[#2A2628]/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#2A2628] text-white font-medium cursor-pointer"
                >
                  Guardar Profissional
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. ABA SERVIÇOS */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2628]/10">
            <div>
              <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                Catálogo de Serviços
              </h2>
              <p className="text-xs text-[#2A2628]/65">
                Gerir preços, durações em minutos e ativar/desativar serviços.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingService({
                  id: `srv_${Date.now()}`,
                  name: '',
                  category: 'Colorimetria & Madeixas',
                  description: '',
                  price: 50,
                  durationMinutes: 60,
                  active: true,
                })
              }
              className="px-4 py-2 text-xs font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Serviço</span>
            </button>
          </div>

          {editingService && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveService(editingService);
                setEditingService(null);
                showToast('Serviço guardado com sucesso.');
              }}
              className="p-6 rounded-xl border border-[#2A2628]/20 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs"
            >
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Categoria *</label>
                <input
                  type="text"
                  required
                  value={editingService.category}
                  onChange={(e) =>
                    setEditingService({ ...editingService, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Preço (€) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Duração (min) *</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={editingService.durationMinutes}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label className="block font-medium mb-1">Descrição Curta</label>
                <input
                  type="text"
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20"
                />
              </div>
              <div className="flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-lg border border-[#2A2628]/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#2A2628] text-white font-medium cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#2A2628]/10 border-t border-b border-[#2A2628]/10">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs text-[#2A2628]/60">
                    <span>{srv.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{srv.durationMinutes} min</span>
                    <span aria-hidden="true">·</span>
                    <span className={srv.active ? 'text-[#2A2628]' : 'text-[#C84B7E]'}>
                      {srv.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="font-serif-display text-xl font-medium text-[#2A2628]">
                    {srv.name} — <span className="tabular-nums">{srv.price} €</span>
                  </p>
                  <p className="text-xs text-[#2A2628]/70">{srv.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      saveService({ ...srv, active: !srv.active }).then(() =>
                        showToast(srv.active ? 'Serviço desativado.' : 'Serviço ativado.')
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-[#2A2628]/20 hover:border-[#2A2628] cursor-pointer"
                  >
                    {srv.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingService(srv)}
                    className="px-3 py-1.5 rounded-lg border border-[#2A2628]/20 hover:border-[#C84B7E] cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      deleteServiceRecord(srv.id).then(() => showToast('Serviço eliminado.'))
                    }
                    className="p-1.5 text-[#2A2628]/50 hover:text-[#C84B7E] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ABA CLIENTES */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#2A2628]/10">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              Ficha de Clientes &amp; Histórico
            </h2>
            <p className="text-xs text-[#2A2628]/65">
              Dados protegidos por regras de segurança rigorosas (acessíveis exclusivamente ao
              proprietário).
            </p>
          </div>

          {clientsList.length === 0 ? (
            <p className="text-sm text-[#2A2628]/65 py-8">
              Ainda não existem clientes com marcações registadas.
            </p>
          ) : (
            <div className="divide-y divide-[#2A2628]/10 border-t border-b border-[#2A2628]/10">
              {clientsList.map((client) => (
                <div key={client.email + client.phone} className="py-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-serif-display text-xl font-medium text-[#2A2628]">
                      {client.name}
                    </h3>
                    <p className="text-xs text-[#2A2628]/75 tabular-nums">
                      {client.phone} · {client.email}
                    </p>
                  </div>
                  <div className="space-y-1 pl-3 border-l border-[#2A2628]/15 text-xs text-[#2A2628]/75">
                    {client.history.map((h) => (
                      <p key={h.id} className="tabular-nums">
                        {h.date} ({h.startTime}) — {h.serviceNames.join(', ')} com{' '}
                        {h.professionalName} · <strong>{h.totalPrice} €</strong> [{statusLabels[h.status]}]
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. ABA RELATÓRIO DE COMISSÕES */}
      {activeTab === 'commissions' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#2A2628]/10">
            <div>
              <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                Relatório de Comissões por Período
              </h2>
              <p className="text-xs text-[#2A2628]/65">
                Calculado sobre marcações com estado &ldquo;Concluída&rdquo; para profissionais com
                contrato de comissão. Profissionais com contrato fixo não constam neste relatório.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-[#2A2628]/60 mb-0.5">De</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#2A2628]/20 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#2A2628]/60 mb-0.5">Até</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#2A2628]/20 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2A2628]/15 text-xs text-[#2A2628]/60">
                  <th className="py-3 pr-4 font-medium">Profissional (Contrato Comissão)</th>
                  <th className="py-3 px-4 font-medium text-right">Serviços Concluídos</th>
                  <th className="py-3 px-4 font-medium text-right">Total Faturado (€)</th>
                  <th className="py-3 px-4 font-medium text-right">Comissão (%)</th>
                  <th className="py-3 pl-4 font-medium text-right">Valor a Pagar (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2628]/10 tabular-nums">
                {commissionRows.map((row) => (
                  <tr key={row.prof.id}>
                    <td className="py-4 pr-4 font-medium text-[#2A2628]">{row.prof.name}</td>
                    <td className="py-4 px-4 text-right text-[#2A2628]/80">
                      {row.completedCount}
                    </td>
                    <td className="py-4 px-4 text-right text-[#2A2628]">
                      {row.totalBilled.toFixed(2)} €
                    </td>
                    <td className="py-4 px-4 text-right text-[#2A2628]/80">{row.percent}%</td>
                    <td className="py-4 pl-4 text-right font-semibold text-[#C84B7E]">
                      {row.amountToPay.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#2A2628]/20 font-semibold text-[#2A2628] tabular-nums">
                  <td className="py-4 pr-4">Total do Período</td>
                  <td className="py-4 px-4 text-right">
                    {commissionRows.reduce((s, r) => s + r.completedCount, 0)}
                  </td>
                  <td className="py-4 px-4 text-right">{totalPeriodBilled.toFixed(2)} €</td>
                  <td className="py-4 px-4 text-right">—</td>
                  <td className="py-4 pl-4 text-right text-[#C84B7E]">
                    {totalPeriodCommissions.toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 6. ABA DEFINIÇÕES DO SALÃO */}
      {activeTab === 'settings' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveSalonSettings(settingsForm);
            showToast('Definições do salão guardadas.');
          }}
          className="max-w-3xl space-y-6 text-xs"
        >
          <div className="pb-4 border-b border-[#2A2628]/10">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              Definições Gerais do Salão
            </h2>
            <p className="text-xs text-[#2A2628]/65">
              Dados de contacto, horário, antecedência mínima e políticas públicas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Nome do Salão</label>
              <input
                type="text"
                required
                value={settingsForm.salonName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, salonName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Telefone</label>
              <input
                type="text"
                required
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Email de Contacto</label>
              <input
                type="email"
                required
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Antecedência Mínima para Marcações (horas)
              </label>
              <input
                type="number"
                min={0}
                max={72}
                required
                value={settingsForm.minAdvanceHours}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    minAdvanceHours: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Morada Completa</label>
              <input
                type="text"
                required
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Resumo do Horário</label>
              <input
                type="text"
                required
                value={settingsForm.scheduleSummary}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, scheduleSummary: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Política de Cancelamento</label>
              <textarea
                rows={3}
                required
                value={settingsForm.cancellationPolicy}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, cancellationPolicy: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">
                Texto da Política de Privacidade (RGPD)
              </label>
              <textarea
                rows={6}
                required
                value={settingsForm.privacyPolicyText}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, privacyPolicyText: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#2A2628]/20 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Definições</span>
          </button>
        </form>
      )}
    </div>
  );
};
