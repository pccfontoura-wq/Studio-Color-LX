import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SALON_CONFIG } from '../config/salonConfig';
import { useSalon } from '../context/SalonContext';
import { PublicPageView } from '../components/Header';

interface HomeViewProps {
  onNavigate: (view: PublicPageView, sectionId?: string) => void;
  onStartBookingWithService: (serviceId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onStartBookingWithService,
}) => {
  const { services, professionals, settings } = useSalon();

  const activeServices = services.filter((s) => s.active).slice(0, 4);
  const activeProfessionals = professionals.filter((p) => p.active);

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* 1. Secção de Abertura (Hero) com Foto Grande e Frase Curta */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10">
        <div className="relative rounded-2xl overflow-hidden bg-[#2A2628] aspect-[4/5] sm:aspect-[16/9] max-h-[760px]">
          <img
            src={SALON_CONFIG.images.hero}
            alt="Interior luminoso e elegante do Studio Color Lx em Lisboa"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 text-white">
            <div className="max-w-2xl space-y-5">
              <p className="text-xs sm:text-sm tracking-[0.18em] uppercase text-white/85">
                Lisboa · Atelier de Colorimetria &amp; Cuidado Capilar
              </p>
              <h1 className="font-serif-display text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.1] text-balance">
                {SALON_CONFIG.tagline}
              </h1>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('booking')}
                  className="px-6 py-3.5 text-sm font-medium text-white bg-[#C84B7E] hover:bg-[#b03e6d] rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Marcar Sessão</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="px-6 py-3.5 text-sm font-medium text-white border border-white/40 hover:bg-white/10 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  Ver Menu de Serviços
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Apresentação do Salão */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5 space-y-3">
            <p className="text-xs text-[#2A2628]/60">O Nosso Espaço · Pet Friendly</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628] leading-tight text-balance">
              {SALON_CONFIG.aboutTitle}
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-base text-[#2A2628]/80 leading-relaxed">
            <p>{SALON_CONFIG.aboutDescription}</p>
            <div className="pt-4 border-t border-[#2A2628]/10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-serif-display text-2xl text-[#2A2628]">Colorimetria</p>
                <p className="text-xs text-[#2A2628]/65 mt-0.5">Diagnóstico personalizado</p>
              </div>
              <div>
                <p className="font-serif-display text-2xl text-[#2A2628]">Balayage</p>
                <p className="text-xs text-[#2A2628]/65 mt-0.5">Iluminação natural sem marcas</p>
              </div>
              <div>
                <p className="font-serif-display text-2xl text-[#2A2628]">Saúde Capilar</p>
                <p className="text-xs text-[#2A2628]/65 mt-0.5">Fórmulas de alta precisão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Serviços em Destaque */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10 border-b border-[#2A2628]/10">
          <div className="space-y-2">
            <p className="text-xs text-[#2A2628]/60">Especialidades</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
              Serviços em Destaque
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="text-sm font-medium text-[#2A2628] hover:text-[#C84B7E] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Ver todos os serviços e preços</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-[#2A2628]/10">
          {activeServices.map((srv, idx) => (
            <div
              key={srv.id}
              className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-[#2A2628]/60">
                  <span className="tabular-nums">0{idx + 1}.</span>
                  <span>{srv.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{srv.durationMinutes} min</span>
                </div>
                <h3 className="font-serif-display text-2xl font-medium text-[#2A2628] group-hover:text-[#C84B7E] transition-colors">
                  {srv.name}
                </h3>
                <p className="text-sm text-[#2A2628]/75 leading-relaxed">{srv.description}</p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 shrink-0">
                <span className="font-serif-display text-2xl font-medium text-[#2A2628] tabular-nums">
                  {srv.price} €
                </span>
                <button
                  type="button"
                  onClick={() => onStartBookingWithService(srv.id)}
                  className="px-4 py-2 text-xs font-medium text-[#2A2628] border border-[#2A2628]/25 hover:border-[#C84B7E] hover:text-[#C84B7E] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Selecionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Equipa */}
      <section id="equipa" className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24">
        <div className="space-y-2 pb-10 border-b border-[#2A2628]/10">
          <p className="text-xs text-[#2A2628]/60">Talento &amp; Dedicação</p>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
            A Nossa Equipa
          </h2>
        </div>

        <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeProfessionals.map((prof) => (
            <article key={prof.id} className="space-y-4">
              <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#F2ECE9]">
                <img
                  src={prof.photoUrl}
                  alt={`Retrato de ${prof.name} — ${prof.role}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-[#2A2628]/60">{prof.role}</p>
                <h3 className="font-serif-display text-2xl font-medium text-[#2A2628]">
                  {prof.name}
                </h3>
                <p className="text-sm text-[#2A2628]/75 leading-relaxed">{prof.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Galeria & Ligação ao Instagram */}
      <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10 border-b border-[#2A2628]/10">
          <div className="space-y-2">
            <p className="text-xs text-[#2A2628]/60">Portefólio &amp; Ambiente</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
              Galeria Studio Color Lx
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Studio Color Lx"
              title="Instagram @studio_color_lx"
              className="w-10 h-10 rounded-full border border-[#2A2628]/20 flex items-center justify-center text-[#2A2628] hover:text-[#C84B7E] hover:border-[#C84B7E] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Direto Studio Color Lx"
              title="WhatsApp Direto"
              className="w-10 h-10 rounded-full border border-[#2A2628]/20 flex items-center justify-center text-[#2A2628] hover:text-[#C84B7E] hover:border-[#C84B7E] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
              </svg>
            </a>
          </div>
        </div>

        <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {SALON_CONFIG.gallery.map((item) => (
            <figure key={item.id} className="space-y-3">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F2ECE9]">
                <img
                  src={item.url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <figcaption className="space-y-1">
                <p className="font-serif-display text-xl font-medium text-[#2A2628]">
                  {item.title}
                </p>
                <p className="text-xs text-[#2A2628]/70">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 6. Localização com Mapa, Contactos e Horário */}
      <section id="contactos" className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24">
        <div className="pt-12 border-t border-[#2A2628]/10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-2">
              <p className="text-xs text-[#2A2628]/60">Visite-nos em Lisboa</p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
                Localização &amp; Horário
              </h2>
            </div>

            <div className="space-y-6 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-[#2A2628]">Morada</p>
                <p className="text-[#2A2628]/80">{settings.address}</p>
                <a
                  href={SALON_CONFIG.contact.googleMapsDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#C84B7E] hover:underline pt-1"
                >
                  <span>Abrir direções no Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-[#2A2628]">Horário de Funcionamento</p>
                <p className="text-[#2A2628]/80">{settings.scheduleSummary}</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-[#2A2628]">Contactos Diretos</p>
                <p className="text-[#2A2628]/80 tabular-nums">
                  Telefone:{' '}
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="underline underline-offset-4 hover:text-[#C84B7E]"
                  >
                    {settings.phone}
                  </a>
                </p>
                <p className="text-[#2A2628]/80">
                  Email:{' '}
                  <a
                    href={`mailto:${settings.email}`}
                    className="underline underline-offset-4 hover:text-[#C84B7E]"
                  >
                    {settings.email}
                  </a>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('booking')}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors cursor-pointer"
                >
                  Agendar a sua visita
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-[#2A2628]/10 bg-[#F2ECE9]">
              <iframe
                title="Mapa de localização Studio Color Lx - R. de São Francisco de Sales 18, Lisboa"
                src={SALON_CONFIG.contact.googleMapsEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
