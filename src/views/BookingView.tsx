import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { AppointmentItem, ProfessionalPublic } from '../config/salonConfig';
import {
  formatDatePt,
  getAvailableSlotsForDate,
  getUpcomingDates,
} from '../utils/lisbonTime';

interface BookingViewProps {
  initialServiceId?: string | null;
  onOpenPrivacy: () => void;
  onFinishToHome: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  initialServiceId,
  onOpenPrivacy,
  onFinishToHome,
}) => {
  const {
    services,
    professionals,
    bookedSlots,
    settings,
    createPublicAppointment,
  } = useSalon();

  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals]
  );

  // Step 1..5, or 6 for Confirmation Screen
  const [step, setStep] = useState<number>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    initialServiceId ? [initialServiceId] : []
  );
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('any');

  const upcomingDates = useMemo(() => getUpcomingDates(28), []);
  // Pick first open day (Terça a Sábado) as default
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const firstOpen = upcomingDates.find((d) => [2, 3, 4, 5, 6].includes(d.dayOfWeek));
    return firstOpen ? firstOpen.dateStr : upcomingDates[0]?.dateStr || '';
  });

  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
    assignedProfessional: ProfessionalPublic;
  } | null>(null);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<AppointmentItem | null>(
    null
  );

  useEffect(() => {
    if (initialServiceId && !selectedServiceIds.includes(initialServiceId)) {
      setSelectedServiceIds([initialServiceId]);
    }
  }, [initialServiceId]);

  const selectedServices = useMemo(
    () => activeServices.filter((s) => selectedServiceIds.includes(s.id)),
    [activeServices, selectedServiceIds]
  );

  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.price, 0),
    [selectedServices]
  );

  // Profissionais que realizam TODOS os serviços escolhidos
  const eligibleProfessionals = useMemo(() => {
    if (selectedServiceIds.length === 0) return activeProfessionals;
    return activeProfessionals.filter((prof) =>
      selectedServiceIds.every((srvId) => prof.serviceIds.includes(srvId))
    );
  }, [activeProfessionals, selectedServiceIds]);

  // Reset professional choice if no longer eligible
  useEffect(() => {
    if (
      selectedProfessionalId !== 'any' &&
      !eligibleProfessionals.some((p) => p.id === selectedProfessionalId)
    ) {
      setSelectedProfessionalId('any');
    }
  }, [eligibleProfessionals, selectedProfessionalId]);

  // Available slots for current date & selection
  const availableSlots = useMemo(() => {
    if (!selectedDate || totalDurationMinutes === 0) return [];
    return getAvailableSlotsForDate({
      dateStr: selectedDate,
      totalDurationMinutes,
      selectedProfessionalId,
      eligibleProfessionals,
      bookedSlots,
      minAdvanceHours: settings.minAdvanceHours ?? 2,
    });
  }, [
    selectedDate,
    totalDurationMinutes,
    selectedProfessionalId,
    eligibleProfessionals,
    bookedSlots,
    settings.minAdvanceHours,
  ]);

  // Clear selectedSlot if date or professional changes and invalidates it
  useEffect(() => {
    if (selectedSlot) {
      const match = availableSlots.find((s) => s.startTime === selectedSlot.startTime);
      if (!match) {
        setSelectedSlot(null);
      } else {
        setSelectedSlot(match);
      }
    }
  }, [availableSlots]);

  const toggleService = (id: string) => {
    setErrorMessage(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSlot) {
      setErrorMessage('Por favor selecione um horário disponível.');
      return;
    }
    if (!gdprConsent) {
      setErrorMessage(
        'É necessário aceitar o tratamento de dados pessoais (RGPD) para confirmar a marcação.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createPublicAppointment({
        professionalId: selectedSlot.assignedProfessional.id,
        professionalName: selectedSlot.assignedProfessional.name,
        serviceIds: selectedServices.map((s) => s.id),
        serviceNames: selectedServices.map((s) => s.name),
        totalPrice,
        totalDurationMinutes,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        clientName,
        clientPhone,
        clientEmail,
        notes,
        gdprConsent,
      });
      setConfirmedAppointment(created);
      setStep(6);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir a marcação. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Ecrã de Confirmação (Passo 6)
  if (step === 6 && confirmedAppointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 space-y-10">
        <div className="space-y-4 border-b border-[#2A2628]/10 pb-8">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#C84B7E]">
            <CheckCircle2 className="w-5 h-5" />
            <span>Marcação Confirmada</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
            Obrigado, {confirmedAppointment.clientName}.
          </h1>
          <p className="text-sm text-[#2A2628]/75 leading-relaxed">
            A sua marcação no <strong>{settings.salonName}</strong> ficou registada com sucesso.
            Esperamos por si na nossa morada em Lisboa.
          </p>
        </div>

        <div className="space-y-4 text-sm border-b border-[#2A2628]/10 pb-8">
          <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
            Resumo da Marcação
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-[#2A2628]/60">Data</p>
              <p className="font-medium text-[#2A2628] capitalize">
                {formatDatePt(confirmedAppointment.date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#2A2628]/60">Horário (Hora de Lisboa)</p>
              <p className="font-medium text-[#2A2628] tabular-nums">
                {confirmedAppointment.startTime} – {confirmedAppointment.endTime} (
                {confirmedAppointment.totalDurationMinutes} min)
              </p>
            </div>
            <div>
              <p className="text-xs text-[#2A2628]/60">Profissional</p>
              <p className="font-medium text-[#2A2628]">
                {confirmedAppointment.professionalName}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#2A2628]/60">Valor Total Estimado</p>
              <p className="font-medium text-[#2A2628] tabular-nums">
                {confirmedAppointment.totalPrice} €
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-[#2A2628]/60">Serviços Selecionados</p>
            <p className="font-medium text-[#2A2628]">
              {confirmedAppointment.serviceNames.join(' · ')}
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-[#2A2628]/60">Localização</p>
            <p className="text-[#2A2628]/80">{settings.address}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[#2A2628]/65 leading-relaxed">
            {settings.cancellationPolicy}
          </p>
          <button
            type="button"
            onClick={onFinishToHome}
            className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors cursor-pointer"
          >
            Voltar à Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10">
      {/* Cabeçalho do Fluxo e Indicador de Passos */}
      <div className="space-y-6 pb-6 border-b border-[#2A2628]/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[#2A2628]/60">Marcação Online · Sem registo obrigatório</p>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
              Agendar Sessão
            </h1>
          </div>
          {selectedServices.length > 0 && (
            <div className="text-xs sm:text-right text-[#2A2628]/80 tabular-nums">
              <span>{selectedServices.length} serviço(s)</span>
              <span aria-hidden="true"> · </span>
              <span>{totalDurationMinutes} min</span>
              <span aria-hidden="true"> · </span>
              <span className="font-semibold text-[#2A2628]">{totalPrice} €</span>
            </div>
          )}
        </div>

        {/* Navegação de passos curtos (a -> e) */}
        <ol className="grid grid-cols-5 gap-2 text-xs">
          {[
            { num: 1, label: '1. Serviços' },
            { num: 2, label: '2. Profissional' },
            { num: 3, label: '3. Dia & Hora' },
            { num: 4, label: '4. Os Seus Dados' },
            { num: 5, label: '5. Confirmar' },
          ].map((item) => {
            const isActive = step === item.num;
            const isDone = step > item.num;
            return (
              <li
                key={item.num}
                className={`py-2 border-b-2 transition-colors truncate ${
                  isActive
                    ? 'border-[#C84B7E] font-semibold text-[#2A2628]'
                    : isDone
                    ? 'border-[#2A2628]/40 text-[#2A2628]/80'
                    : 'border-[#2A2628]/10 text-[#2A2628]/40'
                }`}
              >
                {item.label}
              </li>
            );
          })}
        </ol>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-[#C84B7E] bg-[#F6E8EE] text-sm text-[#2A2628]"
        >
          {errorMessage}
        </div>
      )}

      {/* PASSO 1: Escolher um ou mais serviços */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              a) Escolha um ou mais serviços
            </h2>
            <p className="text-sm text-[#2A2628]/70">
              Pode combinar diferentes serviços na mesma visita. A duração total será calculada
              automaticamente.
            </p>
          </div>

          <div className="divide-y divide-[#2A2628]/10 border-t border-b border-[#2A2628]/10">
            {activeServices.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => toggleService(srv.id)}
                  className={`w-full text-left py-5 px-3 sm:px-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F6E8EE]/60' : 'hover:bg-[#2A2628]/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#C84B7E] border-[#C84B7E] text-white'
                          : 'border-[#2A2628]/30 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-base text-[#2A2628]">{srv.name}</p>
                      <p className="text-xs text-[#2A2628]/70 leading-relaxed max-w-xl">
                        {srv.description}
                      </p>
                      <p className="text-xs text-[#2A2628]/55 tabular-nums">
                        {srv.category} · {srv.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <span className="font-serif-display text-xl font-medium text-[#2A2628] tabular-nums shrink-0">
                    {srv.price} €
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              disabled={selectedServiceIds.length === 0}
              onClick={() => {
                if (eligibleProfessionals.length === 0) {
                  setErrorMessage(
                    'Nenhuma única profissional realiza esta combinação específica de serviços em simultâneo. Por favor ajuste a seleção.'
                  );
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar para Profissional</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASSO 2: Escolher o profissional ou "sem preferência" */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              b) Escolha a profissional ou sem preferência
            </h2>
            <p className="text-sm text-[#2A2628]/70">
              Se escolher &ldquo;Sem preferência&rdquo;, apresentaremos todos os horários livres da
              equipa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedProfessionalId('any')}
              className={`p-5 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedProfessionalId === 'any'
                  ? 'border-[#C84B7E] bg-[#F6E8EE]/50'
                  : 'border-[#2A2628]/15 hover:border-[#2A2628]/35 bg-white/60'
              }`}
            >
              <p className="font-serif-display text-2xl font-medium text-[#2A2628]">
                Sem preferência
              </p>
              <p className="text-xs text-[#2A2628]/70 mt-1 leading-relaxed">
                Máxima disponibilidade de agenda entre as especialistas habilitadas para os seus
                serviços.
              </p>
            </button>

            {eligibleProfessionals.map((prof) => {
              const isSelected = selectedProfessionalId === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setSelectedProfessionalId(prof.id)}
                  className={`p-4 rounded-xl border text-left flex items-center gap-4 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#C84B7E] bg-[#F6E8EE]/50'
                      : 'border-[#2A2628]/15 hover:border-[#2A2628]/35 bg-white/60'
                  }`}
                >
                  <img
                    src={prof.photoUrl}
                    alt={prof.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[#F2ECE9]"
                  />
                  <div className="space-y-0.5">
                    <p className="font-serif-display text-xl font-medium text-[#2A2628]">
                      {prof.name}
                    </p>
                    <p className="text-xs text-[#2A2628]/65">{prof.role}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 text-sm text-[#2A2628]/80 hover:text-[#2A2628] inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Escolher Dia e Hora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASSO 3: Escolher o dia e a hora entre os horários livres */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              c) Escolha o dia e a hora
            </h2>
            <p className="text-sm text-[#2A2628]/70">
              Horários no fuso de Lisboa ({settings.scheduleSummary}). Antecedência mínima de{' '}
              {settings.minAdvanceHours} horas.
            </p>
          </div>

          {/* Seletor de Dias */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[#2A2628]/70">
              Selecione o dia
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {upcomingDates.map((d) => {
                const isSalonClosed = d.dayOfWeek === 0 || d.dayOfWeek === 1;
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    disabled={isSalonClosed}
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-3.5 py-2.5 rounded-lg border text-center shrink-0 transition-colors min-w-[72px] cursor-pointer ${
                      isSalonClosed
                        ? 'opacity-35 border-[#2A2628]/10 cursor-not-allowed bg-transparent'
                        : isSelected
                        ? 'border-[#C84B7E] bg-[#2A2628] text-white'
                        : 'border-[#2A2628]/15 bg-white/70 hover:border-[#2A2628]/40 text-[#2A2628]'
                    }`}
                  >
                    <p className="text-[11px] capitalize opacity-75">{d.dayNameShort}</p>
                    <p className="text-base font-semibold tabular-nums">{d.dayNumber}</p>
                    <p className="text-[11px] capitalize opacity-75">{d.monthShort}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grelha de Horários Livres */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#2A2628]/70 capitalize">
                Horários livres — {formatDatePt(selectedDate)}
              </label>
              <span className="text-xs text-[#2A2628]/60 tabular-nums">
                Duração: {totalDurationMinutes} min
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-8 rounded-xl border border-[#2A2628]/10 bg-white/50 text-center space-y-2">
                <p className="text-sm font-medium text-[#2A2628]">
                  Sem horários livres para esta data com a duração de {totalDurationMinutes} min.
                </p>
                <p className="text-xs text-[#2A2628]/65">
                  Por favor selecione outro dia no calendário acima ou escolha outra opção de
                  profissional.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((slot) => {
                  const isPicked = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-3 rounded-lg border text-center transition-colors cursor-pointer ${
                        isPicked
                          ? 'border-[#C84B7E] bg-[#C84B7E] text-white font-medium'
                          : 'border-[#2A2628]/15 bg-white/80 hover:border-[#2A2628]/40 text-[#2A2628]'
                      }`}
                    >
                      <span className="text-sm tabular-nums block">{slot.startTime}</span>
                      <span
                        className={`text-[10px] block truncate mt-0.5 ${
                          isPicked ? 'text-white/90' : 'text-[#2A2628]/55'
                        }`}
                      >
                        {slot.assignedProfessional.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 text-sm text-[#2A2628]/80 hover:text-[#2A2628] inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar para Contacto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASSO 4: Indicar nome, telemóvel e email (e observações opcionais) */}
      {step === 4 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(5);
          }}
          className="space-y-8"
        >
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              d) Os seus dados de contacto
            </h2>
            <p className="text-sm text-[#2A2628]/70">
              Não precisa de criar conta. Usamos estes dados apenas para gerir a sua marcação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="clientName" className="block text-xs font-medium text-[#2A2628]">
                Nome Completo *
              </label>
              <input
                id="clientName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex.: Sofia Almeida"
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#2A2628]/20 bg-white focus:outline-none focus:border-[#C84B7E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clientPhone" className="block text-xs font-medium text-[#2A2628]">
                Telemóvel *
              </label>
              <input
                id="clientPhone"
                type="tel"
                required
                minLength={6}
                maxLength={30}
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ex.: +351 912 345 678"
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#2A2628]/20 bg-white focus:outline-none focus:border-[#C84B7E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clientEmail" className="block text-xs font-medium text-[#2A2628]">
                Email *
              </label>
              <input
                id="clientEmail"
                type="email"
                required
                minLength={5}
                maxLength={120}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Ex.: sofia@exemplo.pt"
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#2A2628]/20 bg-white focus:outline-none focus:border-[#C84B7E]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="clientNotes" className="block text-xs font-medium text-[#2A2628]">
                Observações (opcional)
              </label>
              <textarea
                id="clientNotes"
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Histórico de coloração recente, alergias ou preferências específicas."
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#2A2628]/20 bg-white focus:outline-none focus:border-[#C84B7E]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2.5 text-sm text-[#2A2628]/80 hover:text-[#2A2628] inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Rever Marcação</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASSO 5: Rever e confirmar + Consentimento RGPD */}
      {step === 5 && selectedSlot && (
        <form onSubmit={handleConfirmBooking} className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-medium text-[#2A2628]">
              e) Rever e confirmar a sua marcação
            </h2>
            <p className="text-sm text-[#2A2628]/70">
              Verifique todos os detalhes antes de confirmar.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#2A2628]/15 bg-white/70 space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#2A2628]/10">
              <div>
                <p className="text-xs text-[#2A2628]/60">Data &amp; Hora (Europe/Lisbon)</p>
                <p className="font-medium text-[#2A2628] capitalize mt-0.5">
                  {formatDatePt(selectedDate)}
                </p>
                <p className="text-[#2A2628]/80 tabular-nums">
                  {selectedSlot.startTime} – {selectedSlot.endTime} ({totalDurationMinutes} min)
                </p>
              </div>

              <div>
                <p className="text-xs text-[#2A2628]/60">Profissional Atribuída</p>
                <p className="font-medium text-[#2A2628] mt-0.5">
                  {selectedSlot.assignedProfessional.name}
                </p>
                <p className="text-xs text-[#2A2628]/65">
                  {selectedSlot.assignedProfessional.role}
                </p>
              </div>
            </div>

            <div className="space-y-2 pb-6 border-b border-[#2A2628]/10">
              <p className="text-xs text-[#2A2628]/60">Serviços Selecionados</p>
              {selectedServices.map((srv) => (
                <div key={srv.id} className="flex items-center justify-between">
                  <span className="text-[#2A2628]">
                    {srv.name}{' '}
                    <span className="text-xs text-[#2A2628]/60 tabular-nums">
                      ({srv.durationMinutes} min)
                    </span>
                  </span>
                  <span className="font-medium text-[#2A2628] tabular-nums">{srv.price} €</span>
                </div>
              ))}
              <div className="pt-3 flex items-center justify-between font-semibold text-base text-[#2A2628]">
                <span>Total Estimado</span>
                <span className="tabular-nums">{totalPrice} €</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#2A2628]/60">Cliente</p>
                <p className="font-medium text-[#2A2628]">{clientName}</p>
              </div>
              <div>
                <p className="text-xs text-[#2A2628]/60">Contactos</p>
                <p className="text-[#2A2628] tabular-nums">{clientPhone}</p>
                <p className="text-[#2A2628]/80">{clientEmail}</p>
              </div>
              {notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#2A2628]/60">Observações</p>
                  <p className="text-[#2A2628]/80">{notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Consentimento RGPD Obrigatório */}
          <div className="p-4 rounded-lg border border-[#2A2628]/15 bg-white/50 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer text-sm text-[#2A2628]/85">
              <input
                type="checkbox"
                required
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#C84B7E] rounded shrink-0"
              />
              <span>
                Autorizo o tratamento dos meus dados pessoais pelo <strong>{settings.salonName}</strong>{' '}
                para efeitos exclusivos de gestão e contacto sobre esta marcação, de acordo com o RGPD
                e a{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[#C84B7E] underline underline-offset-2 hover:text-[#2A2628] cursor-pointer"
                >
                  Política de Privacidade
                </button>
                . *
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2.5 text-sm text-[#2A2628]/80 hover:text-[#2A2628] inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Editar Dados</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !gdprConsent}
              className="px-8 py-3.5 text-sm font-medium text-white bg-[#C84B7E] hover:bg-[#b03e6d] disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'A confirmar marcação...' : 'Confirmar Marcação'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
