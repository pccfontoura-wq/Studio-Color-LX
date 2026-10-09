import { SALON_CONFIG, ProfessionalPublic, BookedSlotItem } from '../config/salonConfig';

/**
 * Utilitários de data e hora para o fuso horário Europe/Lisbon,
 * respeitando automaticamente o horário de verão (WET/WEST).
 */

export function getLisbonNowParts(): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateStr: string;
  timeStr: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALON_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour === '24' ? '0' : map.hour, 10);
  const minute = parseInt(map.minute, 10);

  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return { year, month, day, hour, minute, dateStr, timeStr };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getDayOfWeekFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.getUTCDay(); // 0 = Domingo ... 6 = Sábado
}

export function formatDatePt(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

export function formatShortDatePt(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(dt);
}

export function getUpcomingDates(daysCount = 21): {
  dateStr: string;
  dayNameShort: string;
  dayNumber: string;
  monthShort: string;
  dayOfWeek: number;
}[] {
  const { year, month, day } = getLisbonNowParts();
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const result = [];

  for (let i = 0; i < daysCount; i++) {
    const dt = new Date(baseDate.getTime() + i * 86400000);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = dt.getUTCDay();

    const dayNameShort = new Intl.DateTimeFormat('pt-PT', {
      weekday: 'short',
      timeZone: 'UTC',
    })
      .format(dt)
      .replace('.', '');

    const monthShort = new Intl.DateTimeFormat('pt-PT', {
      month: 'short',
      timeZone: 'UTC',
    })
      .format(dt)
      .replace('.', '');

    result.push({
      dateStr,
      dayNameShort,
      dayNumber: d,
      monthShort,
      dayOfWeek,
    });
  }

  return result;
}

/**
 * Verifica se um intervalo [startMin, endMin] respeita a antecedência mínima em relação à hora atual em Lisboa.
 */
export function respectsMinAdvance(
  dateStr: string,
  startMin: number,
  minAdvanceHours: number
): boolean {
  const nowLisbon = getLisbonNowParts();
  if (dateStr < nowLisbon.dateStr) {
    return false;
  }
  if (dateStr === nowLisbon.dateStr) {
    const nowMinutes = nowLisbon.hour * 60 + nowLisbon.minute;
    if (startMin < nowMinutes + minAdvanceHours * 60) {
      return false;
    }
  }
  return true;
}

/**
 * Verifica se uma profissional específica está livre no dia `dateStr` durante `[startMin, endMin]`.
 */
export function isProfessionalAvailableForWindow(
  prof: ProfessionalPublic,
  dateStr: string,
  startMin: number,
  endMin: number,
  bookedSlots: BookedSlotItem[],
  excludeSlotId?: string
): boolean {
  if (!prof.active) return false;
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  if (!prof.workingDays.includes(dayOfWeek)) return false;
  if (prof.daysOff.includes(dateStr)) return false;

  const workStartMin = timeToMinutes(prof.workStart);
  const workEndMin = timeToMinutes(prof.workEnd);
  if (startMin < workStartMin || endMin > workEndMin) return false;

  // Verificar sobreposição com marcações ativas ('confirmada' ou 'concluida')
  for (const slot of bookedSlots) {
    if (excludeSlotId && slot.id === excludeSlotId) continue;
    if (slot.professionalId !== prof.id) continue;
    if (slot.date !== dateStr) continue;
    if (slot.status === 'cancelada' || slot.status === 'nao_compareceu') continue;

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Duas marcações sobrepõem-se se startA < endB && endA > startB
    if (startMin < slotEnd && endMin > slotStart) {
      return false;
    }
  }

  return true;
}

/**
 * Gera os horários disponíveis para um determinado dia, duração total e profissional (ou "any" = sem preferência).
 */
export function getAvailableSlotsForDate(params: {
  dateStr: string;
  totalDurationMinutes: number;
  selectedProfessionalId: string; // ID ou 'any'
  eligibleProfessionals: ProfessionalPublic[];
  bookedSlots: BookedSlotItem[];
  minAdvanceHours: number;
}): { startTime: string; endTime: string; assignedProfessional: ProfessionalPublic }[] {
  const {
    dateStr,
    totalDurationMinutes,
    selectedProfessionalId,
    eligibleProfessionals,
    bookedSlots,
    minAdvanceHours,
  } = params;

  const candidates =
    selectedProfessionalId === 'any'
      ? eligibleProfessionals
      : eligibleProfessionals.filter((p) => p.id === selectedProfessionalId);

  if (candidates.length === 0) return [];

  const openMin = timeToMinutes(SALON_CONFIG.schedule.openTime);
  const closeMin = timeToMinutes(SALON_CONFIG.schedule.closeTime);
  const step = SALON_CONFIG.schedule.slotIntervalMinutes;

  const available: {
    startTime: string;
    endTime: string;
    assignedProfessional: ProfessionalPublic;
  }[] = [];

  for (let startMin = openMin; startMin + totalDurationMinutes <= closeMin; startMin += step) {
    const endMin = startMin + totalDurationMinutes;

    if (!respectsMinAdvance(dateStr, startMin, minAdvanceHours)) {
      continue;
    }

    // Encontrar uma profissional candidata disponível para este bloco
    const freeProfs = candidates.filter((prof) =>
      isProfessionalAvailableForWindow(prof, dateStr, startMin, endMin, bookedSlots)
    );

    if (freeProfs.length > 0) {
      // Se for "sem preferência", escolhe a profissional com menos ocupação nesse dia para equilibrar a agenda
      const sortedFree = [...freeProfs].sort((a, b) => {
        const countA = bookedSlots.filter(
          (s) => s.professionalId === a.id && s.date === dateStr && s.status !== 'cancelada'
        ).length;
        const countB = bookedSlots.filter(
          (s) => s.professionalId === b.id && s.date === dateStr && s.status !== 'cancelada'
        ).length;
        return countA - countB;
      });

      available.push({
        startTime: minutesToTime(startMin),
        endTime: minutesToTime(endMin),
        assignedProfessional: sortedFree[0],
      });
    }
  }

  return available;
}
