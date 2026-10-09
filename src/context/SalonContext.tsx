import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AppointmentItem,
  BookedSlotItem,
  ProfessionalContract,
  ProfessionalPublic,
  SALON_CONFIG,
  SalonSettingsData,
  ServiceItem,
} from '../config/salonConfig';
import { isProfessionalAvailableForWindow, timeToMinutes } from '../utils/lisbonTime';

interface SalonContextValue {
  user: User | null;
  isOwner: boolean;
  authLoading: boolean;
  services: ServiceItem[];
  professionals: ProfessionalPublic[];
  contracts: Record<string, ProfessionalContract>;
  bookedSlots: BookedSlotItem[];
  appointments: AppointmentItem[];
  settings: SalonSettingsData;
  loginOwner: () => Promise<void>;
  logoutOwner: () => Promise<void>;
  createPublicAppointment: (payload: Omit<AppointmentItem, 'id' | 'slotId' | 'createdAtIso' | 'status'> & { status?: AppointmentItem['status'] }) => Promise<AppointmentItem>;
  updateAppointmentStatus: (appointment: AppointmentItem, newStatus: AppointmentItem['status']) => Promise<void>;
  rescheduleAppointment: (
    appointment: AppointmentItem,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newProfId: string,
    newProfName: string
  ) => Promise<void>;
  deleteAppointmentRecord: (appointment: AppointmentItem) => Promise<void>;
  saveService: (service: ServiceItem) => Promise<void>;
  deleteServiceRecord: (serviceId: string) => Promise<void>;
  saveProfessional: (prof: ProfessionalPublic, contract: ProfessionalContract) => Promise<void>;
  deleteProfessionalRecord: (profId: string) => Promise<void>;
  saveSalonSettings: (newSettings: SalonSettingsData) => Promise<void>;
  seedInitialData: () => Promise<void>;
}

const SalonContext = createContext<SalonContextValue | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [previewOwnerAccess, setPreviewOwnerAccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [services, setServices] = useState<ServiceItem[]>(SALON_CONFIG.initialServices);
  const [professionals, setProfessionals] = useState<ProfessionalPublic[]>(
    SALON_CONFIG.initialProfessionals
  );
  const [contracts, setContracts] = useState<Record<string, ProfessionalContract>>(() => {
    const map: Record<string, ProfessionalContract> = {};
    for (const c of SALON_CONFIG.initialContracts) {
      map[c.professionalId] = c;
    }
    return map;
  });
  const [bookedSlots, setBookedSlots] = useState<BookedSlotItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [settings, setSettings] = useState<SalonSettingsData>(SALON_CONFIG.defaultSettings);

  const isFirebaseOwner = Boolean(
    user &&
      user.emailVerified &&
      (!SALON_CONFIG.ownerEmail ||
        user.email?.toLowerCase() === SALON_CONFIG.ownerEmail.toLowerCase())
  );

  const isOwner = isFirebaseOwner || previewOwnerAccess;

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Public listeners (or owner listeners when authenticated as owner)
  useEffect(() => {
    const servicesRef = collection(db, 'services');
    const servicesQuery = isOwner
      ? servicesRef
      : query(servicesRef, where('active', '==', true));

    const unsubServices = onSnapshot(
      servicesQuery,
      (snap) => {
        if (!snap.empty) {
          const items: ServiceItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceItem, 'id'>),
          }));
          setServices(items);
        } else if (!isOwner) {
          setServices(SALON_CONFIG.initialServices.filter((s) => s.active));
        }
      },
      (err) => {
        console.warn('Services fallback used:', err);
      }
    );

    const profsRef = collection(db, 'professionals');
    const profsQuery = isOwner ? profsRef : query(profsRef, where('active', '==', true));

    const unsubProfs = onSnapshot(
      profsQuery,
      (snap) => {
        if (!snap.empty) {
          const items: ProfessionalPublic[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProfessionalPublic, 'id'>),
          }));
          setProfessionals(items);
        } else if (!isOwner) {
          setProfessionals(SALON_CONFIG.initialProfessionals.filter((p) => p.active));
        }
      },
      (err) => {
        console.warn('Professionals fallback used:', err);
      }
    );

    const slotsRef = collection(db, 'booked_slots');
    const slotsQuery = isOwner
      ? slotsRef
      : query(
          slotsRef,
          where('status', 'in', ['confirmada', 'concluida', 'cancelada', 'nao_compareceu'])
        );

    const unsubSlots = onSnapshot(
      slotsQuery,
      (snap) => {
        const items: BookedSlotItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookedSlotItem, 'id'>),
        }));
        setBookedSlots(items);
      },
      (err) => {
        console.warn('Booked slots listener warning:', err);
      }
    );

    const settingsDocRef = doc(db, 'settings', 'general');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as SalonSettingsData);
        }
      },
      (err) => {
        console.warn('Settings fallback used:', err);
      }
    );

    return () => {
      unsubServices();
      unsubProfs();
      unsubSlots();
      unsubSettings();
    };
  }, [isOwner]);

  // Owner-only listeners (Appointments with PII + Contracts) and auto-seeding if DB is empty
  useEffect(() => {
    if (!isFirebaseOwner) {
      return;
    }

    // Check if initial seed is needed when owner logs in for the first time
    const checkAndSeed = async () => {
      try {
        const srvSnap = await getDocs(collection(db, 'services'));
        if (srvSnap.empty) {
          await seedInitialData();
        }
      } catch (e) {
        console.warn('Seed check warning:', e);
      }
    };
    checkAndSeed();

    const unsubContracts = onSnapshot(
      collection(db, 'professionals_private'),
      (snap) => {
        if (!snap.empty) {
          const map: Record<string, ProfessionalContract> = {};
          snap.docs.forEach((d) => {
            const data = d.data() as ProfessionalContract;
            map[data.professionalId] = data;
          });
          setContracts(map);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professionals_private')
    );

    const unsubAppointments = onSnapshot(
      collection(db, 'appointments'),
      (snap) => {
        const items: AppointmentItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppointmentItem, 'id'>),
        }));
        items.sort((a, b) => {
          const cmpDate = b.date.localeCompare(a.date);
          if (cmpDate !== 0) return cmpDate;
          return b.startTime.localeCompare(a.startTime);
        });
        setAppointments(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'appointments')
    );

    return () => {
      unsubContracts();
      unsubAppointments();
    };
  }, [isFirebaseOwner]);

  const seedInitialData = async () => {
    try {
      const batch = writeBatch(db);

      for (const srv of SALON_CONFIG.initialServices) {
        const { id, ...data } = srv;
        batch.set(doc(db, 'services', id), data);
      }

      for (const prof of SALON_CONFIG.initialProfessionals) {
        const { id, ...data } = prof;
        batch.set(doc(db, 'professionals', id), data);
      }

      for (const contract of SALON_CONFIG.initialContracts) {
        batch.set(doc(db, 'professionals_private', contract.professionalId), contract);
      }

      batch.set(doc(db, 'settings', 'general'), SALON_CONFIG.defaultSettings);

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seedInitialData');
    }
  };

  const loginOwner = async () => {
    if (!SALON_CONFIG.ownerEmail) {
      setPreviewOwnerAccess(true);
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const logoutOwner = async () => {
    setPreviewOwnerAccess(false);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  /**
   * Cria uma marcação verificando novamente no servidor se o horário continua livre
   * para evitar marcações simultâneas sobrepostas.
   */
  const createPublicAppointment = async (
    payload: Omit<AppointmentItem, 'id' | 'slotId' | 'createdAtIso' | 'status'> & {
      status?: AppointmentItem['status'];
    }
  ): Promise<AppointmentItem> => {
    // 1. Verificar em tempo real os booked_slots no servidor antes de gravar
    const slotsRef = collection(db, 'booked_slots');
    const qSlots = query(
      slotsRef,
      where('status', 'in', ['confirmada', 'concluida', 'cancelada', 'nao_compareceu'])
    );
    let latestSlots: BookedSlotItem[] = bookedSlots;
    try {
      const latestSnap = await getDocs(qSlots);
      latestSlots = latestSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BookedSlotItem, 'id'>),
      }));
    } catch (e) {
      console.warn('Could not fetch fresh slots, validating against local state:', e);
    }

    const prof = professionals.find((p) => p.id === payload.professionalId);
    if (!prof) {
      throw new Error('Profissional selecionada não encontrada.');
    }

    const startMin = timeToMinutes(payload.startTime);
    const endMin = timeToMinutes(payload.endTime);

    const stillFree = isProfessionalAvailableForWindow(
      prof,
      payload.date,
      startMin,
      endMin,
      latestSlots
    );

    if (!stillFree) {
      throw new Error(
        'Este horário acabou de ser preenchido por outro cliente. Por favor, escolha outro horário disponível.'
      );
    }

    // 2. Gravar atomicamente o BookedSlot (anónimo) e o Appointment (com PII protegida)
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAtIso = new Date().toISOString();
    const status = payload.status || 'confirmada';

    const slotData: Omit<BookedSlotItem, 'id'> = {
      professionalId: payload.professionalId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      status,
    };

    const appointmentData: Omit<AppointmentItem, 'id'> = {
      slotId,
      professionalId: payload.professionalId,
      professionalName: payload.professionalName.slice(0, 100),
      serviceIds: payload.serviceIds.slice(0, 20),
      serviceNames: payload.serviceNames.slice(0, 20),
      totalPrice: Number(payload.totalPrice),
      totalDurationMinutes: Number(payload.totalDurationMinutes),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      clientName: payload.clientName.trim().slice(0, 100),
      clientPhone: payload.clientPhone.trim().slice(0, 30),
      clientEmail: payload.clientEmail.trim().slice(0, 120),
      notes: (payload.notes || '').trim().slice(0, 500),
      gdprConsent: Boolean(payload.gdprConsent),
      status,
      createdAtIso,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'booked_slots', slotId), slotData);
      batch.set(doc(db, 'appointments', appointmentId), appointmentData);
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }

    return {
      id: appointmentId,
      ...appointmentData,
    };
  };

  const updateAppointmentStatus = async (
    appointment: AppointmentItem,
    newStatus: AppointmentItem['status']
  ) => {
    try {
      const batch = writeBatch(db);
      const { id, ...rest } = appointment;
      batch.set(doc(db, 'appointments', id), { ...rest, status: newStatus });
      if (appointment.slotId) {
        batch.set(doc(db, 'booked_slots', appointment.slotId), {
          professionalId: appointment.professionalId,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: newStatus,
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointment.id}`);
    }
  };

  const rescheduleAppointment = async (
    appointment: AppointmentItem,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newProfId: string,
    newProfName: string
  ) => {
    const prof = professionals.find((p) => p.id === newProfId);
    if (!prof) {
      throw new Error('Profissional não encontrada.');
    }

    const startMin = timeToMinutes(newStartTime);
    const endMin = timeToMinutes(newEndTime);

    const isFree = isProfessionalAvailableForWindow(
      prof,
      newDate,
      startMin,
      endMin,
      bookedSlots,
      appointment.slotId
    );

    if (!isFree) {
      throw new Error(
        'A profissional já tem outra marcação sobreposta ou está de folga neste horário.'
      );
    }

    try {
      const batch = writeBatch(db);
      const { id, ...rest } = appointment;
      batch.set(doc(db, 'appointments', id), {
        ...rest,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        professionalId: newProfId,
        professionalName: newProfName,
        status: 'confirmada',
      });
      if (appointment.slotId) {
        batch.set(doc(db, 'booked_slots', appointment.slotId), {
          professionalId: newProfId,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'confirmada',
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointment.id}`);
    }
  };

  const deleteAppointmentRecord = async (appointment: AppointmentItem) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'appointments', appointment.id));
      if (appointment.slotId) {
        batch.delete(doc(db, 'booked_slots', appointment.slotId));
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `appointments/${appointment.id}`);
    }
  };

  const saveService = async (service: ServiceItem) => {
    try {
      const { id, ...data } = service;
      await setDoc(doc(db, 'services', id), {
        name: data.name.trim().slice(0, 100),
        category: data.category.trim().slice(0, 60),
        description: data.description.trim().slice(0, 500),
        price: Number(data.price),
        durationMinutes: Number(data.durationMinutes),
        active: Boolean(data.active),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `services/${service.id}`);
    }
  };

  const deleteServiceRecord = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
    }
  };

  const saveProfessional = async (
    prof: ProfessionalPublic,
    contract: ProfessionalContract
  ) => {
    try {
      const batch = writeBatch(db);
      const { id, ...data } = prof;
      batch.set(doc(db, 'professionals', id), {
        name: data.name.trim().slice(0, 100),
        role: data.role.trim().slice(0, 100),
        bio: data.bio.trim().slice(0, 400),
        photoUrl: data.photoUrl.trim().slice(0, 500),
        serviceIds: data.serviceIds.slice(0, 50),
        workingDays: data.workingDays.slice(0, 7),
        workStart: data.workStart,
        workEnd: data.workEnd,
        daysOff: data.daysOff.slice(0, 365),
        active: Boolean(data.active),
      });

      batch.set(doc(db, 'professionals_private', id), {
        professionalId: id,
        contractType: contract.contractType,
        commissionPercent:
          contract.contractType === 'comissao' ? Number(contract.commissionPercent) : 0,
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `professionals/${prof.id}`);
    }
  };

  const deleteProfessionalRecord = async (profId: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'professionals', profId));
      batch.delete(doc(db, 'professionals_private', profId));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `professionals/${profId}`);
    }
  };

  const saveSalonSettings = async (newSettings: SalonSettingsData) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        salonName: newSettings.salonName.trim().slice(0, 100),
        address: newSettings.address.trim().slice(0, 200),
        phone: newSettings.phone.trim().slice(0, 30),
        email: newSettings.email.trim().slice(0, 120),
        instagramUrl: newSettings.instagramUrl.trim().slice(0, 200),
        whatsappUrl: newSettings.whatsappUrl.trim().slice(0, 200),
        scheduleSummary: newSettings.scheduleSummary.trim().slice(0, 200),
        minAdvanceHours: Number(newSettings.minAdvanceHours),
        cancellationPolicy: newSettings.cancellationPolicy.trim().slice(0, 1000),
        privacyPolicyText: newSettings.privacyPolicyText.trim().slice(0, 4000),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/general');
    }
  };

  return (
    <SalonContext.Provider
      value={{
        user,
        isOwner,
        authLoading,
        services,
        professionals,
        contracts,
        bookedSlots,
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
        seedInitialData,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) {
    throw new Error('useSalon must be used inside SalonProvider');
  }
  return ctx;
}
