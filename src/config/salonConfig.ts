/**
 * Ficheiro centralizado de configuração do salão.
 * Facilita a reutilização desta base noutros salões de beleza alterando apenas este ficheiro.
 */

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface ProfessionalPublic {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  serviceIds: string[];
  workingDays: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  workStart: string; // HH:MM
  workEnd: string;   // HH:MM
  daysOff: string[]; // YYYY-MM-DD
  active: boolean;
}

export interface ProfessionalContract {
  professionalId: string;
  contractType: 'fixo' | 'comissao';
  commissionPercent: number;
}

export interface BookedSlotItem {
  id: string;
  professionalId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  status: 'confirmada' | 'concluida' | 'cancelada' | 'nao_compareceu';
}

export interface AppointmentItem {
  id: string;
  slotId: string;
  professionalId: string;
  professionalName: string;
  serviceIds: string[];
  serviceNames: string[];
  totalPrice: number;
  totalDurationMinutes: number;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  gdprConsent: boolean;
  status: 'confirmada' | 'concluida' | 'cancelada' | 'nao_compareceu';
  createdAtIso: string;
}

export interface SalonSettingsData {
  salonName: string;
  address: string;
  phone: string;
  email: string;
  instagramUrl: string;
  whatsappUrl: string;
  scheduleSummary: string;
  minAdvanceHours: number;
  cancellationPolicy: string;
  privacyPolicyText: string;
}

export const SALON_CONFIG = {
  // Identidade & Marca
  name: 'Studio Color Lx',
  subtitle: 'HAIR',
  tagline: 'A arte da colorimetria e do cuidado capilar no coração de Lisboa.',
  aboutTitle: 'Onde a técnica encontra a naturalidade.',
  aboutDescription:
    'No Studio Color Lx, cada diagnóstico é único. Especialistas em colorimetria avançada, balayage luminosa, madeixas personalizadas e saúde capilar, criámos um refúgio tranquilo em Lisboa — um espaço acolhedor e pet-friendly pensado para realçar a sua essência.',
  ownerEmail: '', // Preencher com o e-mail do cliente após aprovação do layout
  timezone: 'Europe/Lisbon',

  // Paleta de 3 cores extraídas do logótipo (base neutra, antracite suave, rosa destaque)
  colors: {
    canvas: '#FAF8F6',      // Neutra luminosa
    ink: '#2A2628',         // Base (antracite quente do traço caligráfico)
    accent: '#C84B7E',      // Destaque (rosa-magenta extraído da identidade Instagram)
    accentSoft: '#F6E8EE',  // Rosa pó subtil do fundo do logótipo
  },

  // Contactos & Localização
  contact: {
    address: 'R. de São Francisco de Sales 18, 1250-025 Lisboa, Portugal',
    neighborhood: 'Amoreiras / Príncipe Real, Lisboa',
    phone: '+351 911 735 996',
    phoneRaw: '+351911735996',
    email: 'contacto@studiocolorlx.pt',
    instagramUrl: 'https://www.instagram.com/studio_color_lx/',
    instagramHandle: '@studio_color_lx',
    whatsappUrl: 'https://wa.me/message/OZS4KTOZR5LLE1',
    googleMapsEmbedUrl:
      'https://maps.google.com/maps?q=Rua%20de%20S%C3%A3o%20Francisco%20de%20Sales%2018,%201250-025%20Lisboa&t=&z=16&ie=UTF8&iwloc=&output=embed',
    googleMapsDirectUrl:
      'https://www.google.com/maps/search/?api=1&query=R.+de+S%C3%A3o+Francisco+de+Sales+18,+1250-025+Lisboa,+Portugal',
  },

  // Horário padrão do salão
  schedule: {
    summary: 'Terça a sábado, 10:00–19:00 · Encerrado domingo e segunda-feira',
    openDays: [2, 3, 4, 5, 6], // Terça (2) a Sábado (6)
    openTime: '10:00',
    closeTime: '19:00',
    slotIntervalMinutes: 30,
    minAdvanceHours: 2,
  },

  // Imagens geradas à medida para o Studio Color Lx
  images: {
    hero: '/src/assets/images/salon_hero_lisbon_1791489669289.jpg',
    galleryBalayage: '/src/assets/images/gallery_balayage_hair_1791489679117.jpg',
    galleryDetail: '/src/assets/images/gallery_colorimetry_art_1791489688253.jpg',
    stylist1: '/src/assets/images/stylist_portrait_1_1791489698296.jpg',
    stylist2: '/src/assets/images/stylist_portrait_2_1791489707860.jpg',
  },

  // Galeria editorial
  gallery: [
    {
      id: 'gal-1',
      url: '/src/assets/images/gallery_balayage_hair_1791489679117.jpg',
      title: 'Balayage & Iluminação',
      caption: 'Transições suaves e brilho tridimensional desenhados à medida.',
    },
    {
      id: 'gal-2',
      url: '/src/assets/images/salon_hero_lisbon_1791489669289.jpg',
      title: 'O Nosso Atelier',
      caption: 'Luz natural de Lisboa, materiais orgânicos e conforto absoluto.',
    },
    {
      id: 'gal-3',
      url: '/src/assets/images/gallery_colorimetry_art_1791489688253.jpg',
      title: 'Ritual de Colorimetria',
      caption: 'Fórmulas botânicas de alta precisão que respeitam a fibra capilar.',
    },
  ],

  // Dados iniciais de exemplo (editáveis no painel do dono)
  initialServices: [
    {
      id: 'srv-balayage',
      name: 'Balayage Assinatura Studio Color',
      category: 'Colorimetria & Madeixas',
      description: 'Técnica personalizada de iluminação com diagnóstico de tom, gloss matizador, tratamento reconstrutor e brushing.',
      price: 135,
      durationMinutes: 180,
      active: true,
    },
    {
      id: 'srv-madeixas',
      name: 'Madeixas Babylights & Contorno',
      category: 'Colorimetria & Madeixas',
      description: 'Madeixas ultrafinas para um efeito natural beijado pelo sol, incluindo proteção de pontes capilares e finalização.',
      price: 115,
      durationMinutes: 150,
      active: true,
    },
    {
      id: 'srv-coloracao',
      name: 'Coloração Global & Brilho',
      category: 'Colorimetria & Madeixas',
      description: 'Cobertura perfeita ou mudança de tom com coloração suave sem amoníaco, lavagem relaxante e secagem.',
      price: 68,
      durationMinutes: 90,
      active: true,
    },
    {
      id: 'srv-gloss',
      name: 'Banho de Brilho / Toner Refresh',
      category: 'Colorimetria & Madeixas',
      description: 'Neutralização de reflexos indesejados e revitalização luminosa da cor entre sessões de madeixas.',
      price: 45,
      durationMinutes: 60,
      active: true,
    },
    {
      id: 'srv-corte-fem',
      name: 'Corte Feminino & Styling',
      category: 'Corte & Brushing',
      description: 'Corte de precisão adaptado à textura natural e formato do rosto, acompanhado de lavagem e brushing.',
      price: 42,
      durationMinutes: 60,
      active: true,
    },
    {
      id: 'srv-brushing',
      name: 'Brushing & Ondas Texturizadas',
      category: 'Corte & Brushing',
      description: 'Lavagem nutritiva seguida de secagem modelada com escova ou ondas suaves de longa duração.',
      price: 28,
      durationMinutes: 45,
      active: true,
    },
    {
      id: 'srv-ritual-reconstrucao',
      name: 'Ritual de Reconstrução Profunda',
      category: 'Tratamentos Capilares',
      description: 'Terapia intensiva de reposição de aminoácidos e lípidos para cabelos sensibilizados por processos químicos.',
      price: 55,
      durationMinutes: 60,
      active: true,
    },
    {
      id: 'srv-detox-botanico',
      name: 'Hidratação Botânica & Brilho Seda',
      category: 'Tratamentos Capilares',
      description: 'Nutrição profunda com óleos botânicos puros e massagem craniana relaxante.',
      price: 40,
      durationMinutes: 45,
      active: true,
    },
  ] as ServiceItem[],

  initialProfessionals: [
    {
      id: 'prof-carolina',
      name: 'Carolina Fontoura',
      role: 'Fundadora & Master Colorist',
      bio: 'Especialista em colorimetria corretiva, loiros iluminados e técnicas de balayage sem marcas.',
      photoUrl: '/src/assets/images/stylist_portrait_1_1791489698296.jpg',
      serviceIds: [
        'srv-balayage',
        'srv-madeixas',
        'srv-coloracao',
        'srv-gloss',
        'srv-corte-fem',
        'srv-brushing',
        'srv-ritual-reconstrucao',
      ],
      workingDays: [2, 3, 4, 5, 6],
      workStart: '10:00',
      workEnd: '19:00',
      daysOff: [],
      active: true,
    },
    {
      id: 'prof-ines',
      name: 'Inês Vasconcelos',
      role: 'Senior Colorist & Hair Stylist',
      bio: 'Dedicada a cortes personalizados de baixa manutenção, morenas iluminadas e tratamentos de saúde capilar.',
      photoUrl: '/src/assets/images/stylist_portrait_2_1791489707860.jpg',
      serviceIds: [
        'srv-balayage',
        'srv-madeixas',
        'srv-coloracao',
        'srv-gloss',
        'srv-corte-fem',
        'srv-brushing',
        'srv-ritual-reconstrucao',
        'srv-detox-botanico',
      ],
      workingDays: [2, 3, 4, 5, 6],
      workStart: '10:00',
      workEnd: '19:00',
      daysOff: [],
      active: true,
    },
    {
      id: 'prof-matilde',
      name: 'Matilde Mendonça',
      role: 'Hair Stylist & Terapeuta Capilar',
      bio: 'Focada em rituais de reconstrução profunda, glossing, corte feminino e brushing de assinatura.',
      photoUrl: '/src/assets/images/gallery_balayage_hair_1791489679117.jpg',
      serviceIds: [
        'srv-coloracao',
        'srv-gloss',
        'srv-corte-fem',
        'srv-brushing',
        'srv-ritual-reconstrucao',
        'srv-detox-botanico',
      ],
      workingDays: [3, 4, 5, 6], // Quarta a Sábado
      workStart: '10:00',
      workEnd: '19:00',
      daysOff: [],
      active: true,
    },
  ] as ProfessionalPublic[],

  initialContracts: [
    {
      professionalId: 'prof-carolina',
      contractType: 'fixo',
      commissionPercent: 0,
    },
    {
      professionalId: 'prof-ines',
      contractType: 'comissao',
      commissionPercent: 40,
    },
    {
      professionalId: 'prof-matilde',
      contractType: 'comissao',
      commissionPercent: 35,
    },
  ] as ProfessionalContract[],

  defaultSettings: {
    salonName: 'Studio Color Lx',
    address: 'R. de São Francisco de Sales 18, 1250-025 Lisboa, Portugal',
    phone: '+351 911 735 996',
    email: 'contacto@studiocolorlx.pt',
    instagramUrl: 'https://www.instagram.com/studio_color_lx/',
    whatsappUrl: 'https://wa.me/message/OZS4KTOZR5LLE1',
    scheduleSummary: 'Terça a sábado, 10:00–19:00; encerrado domingo e segunda-feira',
    minAdvanceHours: 2,
    cancellationPolicy:
      'Pedimos a gentileza de comunicar qualquer alteração ou cancelamento com pelo menos 24 horas de antecedência através do nosso telefone ou WhatsApp.',
    privacyPolicyText: `1. Responsável pelo Tratamento de Dados
O Studio Color Lx, localizado na R. de São Francisco de Sales 18, 1250-025 Lisboa, Portugal, é a entidade responsável pelo tratamento dos dados pessoais recolhidos através deste website, em estrito cumprimento do Regulamento Geral sobre a Proteção de Dados (RGPD - Regulamento UE 2016/679).

2. Finalidade da Recolha de Dados
Os dados pessoais solicitados no formulário de marcação (nome, número de telemóvel, endereço de email e eventuais observações sobre o serviço pretendido) destinam-se exclusivamente à gestão, registo e confirmação das suas marcações no salão, bem como ao contacto direto caso ocorra alguma alteração de horário.

3. Conservação e Segurança
Os seus dados são armazenados de forma encriptada em servidores localizados na União Europeia, com acesso estritamente reservado à administração do Studio Color Lx. Nenhum dado pessoal de clientes é exposto publicamente ou partilhado com terceiros para fins comerciais.

4. Direitos do Titular dos Dados
Nos termos da legislação aplicável, o titular dos dados pode, a qualquer momento, solicitar o acesso, retificação, limitação ou eliminação definitiva dos seus dados pessoais, bastando para tal contactar-nos através do email contacto@studiocolorlx.pt ou pelo telefone +351 911 735 996.`,
  } as SalonSettingsData,
};
