import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useSalon } from '../context/SalonContext';
import { PublicPageView } from './Header';

interface FooterProps {
  onNavigate: (view: PublicPageView, sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSalon();

  return (
    <footer className="bg-[#FAF8F6] border-t border-[#2A2628]/10 pt-16 pb-12 text-[#2A2628]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#2A2628]/10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="lg" />
            <p className="text-sm text-[#2A2628]/75 max-w-sm leading-relaxed">
              Atelier de colorimetria, balayage, madeixas e saúde capilar no coração de Lisboa.
              Atendimento personalizado com hora marcada.
            </p>
            <div className="pt-2 flex items-center gap-4">
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

          {/* Morada & Contactos */}
          <div className="md:col-span-4 space-y-3 text-sm">
            <h3 className="font-serif-display text-xl font-medium text-[#2A2628]">
              Morada &amp; Contactos
            </h3>
            <p className="text-[#2A2628]/80 leading-relaxed">{settings.address}</p>
            <p className="text-[#2A2628]/80">
              Tel:{' '}
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="hover:text-[#C84B7E] transition-colors tabular-nums"
              >
                {settings.phone}
              </a>
            </p>
            <p className="text-[#2A2628]/80">
              Email:{' '}
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-[#C84B7E] transition-colors"
              >
                {settings.email}
              </a>
            </p>
          </div>

          {/* Horário & Ligações */}
          <div className="md:col-span-3 space-y-3 text-sm">
            <h3 className="font-serif-display text-xl font-medium text-[#2A2628]">Horário</h3>
            <p className="text-[#2A2628]/80 leading-relaxed">
              Terça a sábado: 10:00–19:00
              <br />
              Domingo e segunda: Encerrado
            </p>
            <div className="pt-2 flex flex-col items-start gap-2 text-sm text-[#2A2628]/75">
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="hover:text-[#2A2628] transition-colors cursor-pointer"
              >
                Menu de Serviços
              </button>
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="hover:text-[#2A2628] transition-colors cursor-pointer"
              >
                Marcar Online
              </button>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="hover:text-[#2A2628] transition-colors cursor-pointer"
              >
                Política de Privacidade (RGPD)
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2A2628]/60">
          <p>© {new Date().getFullYear()} {settings.salonName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="hover:text-[#2A2628] transition-colors cursor-pointer"
            >
              Privacidade &amp; Proteção de Dados
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="hover:text-[#2A2628] transition-colors cursor-pointer"
            >
              Área Reservada
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
