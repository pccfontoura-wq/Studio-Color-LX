import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type PublicPageView = 'home' | 'services' | 'booking' | 'privacy' | 'admin';

interface HeaderProps {
  currentView: PublicPageView;
  onNavigate: (view: PublicPageView, sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (view: PublicPageView, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F6]/95 backdrop-blur-md border-b border-[#2A2628]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C84B7E] rounded-sm"
          aria-label="Studio Color Lx - Página Inicial"
        >
          <BrandLogo size="md" />
        </button>

        {/* Zone 2: Clean Typography Navigation Links */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-8 text-sm font-medium text-[#2A2628]/80">
          <button
            type="button"
            onClick={() => handleLinkClick('home')}
            className={`py-1 border-b transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'home'
                ? 'border-[#C84B7E] text-[#2A2628]'
                : 'border-transparent hover:text-[#2A2628] hover:border-[#2A2628]/30'
            }`}
          >
            O Salão
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('services')}
            className={`py-1 border-b transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'services'
                ? 'border-[#C84B7E] text-[#2A2628]'
                : 'border-transparent hover:text-[#2A2628] hover:border-[#2A2628]/30'
            }`}
          >
            Serviços &amp; Preços
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'equipa')}
            className="py-1 border-b border-transparent hover:text-[#2A2628] hover:border-[#2A2628]/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Equipa
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'galeria')}
            className="py-1 border-b border-transparent hover:text-[#2A2628] hover:border-[#2A2628]/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Galeria
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'contactos')}
            className="py-1 border-b border-transparent hover:text-[#2A2628] hover:border-[#2A2628]/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Localização &amp; Contactos
          </button>
        </nav>

        {/* Zone 3: Always-Visible "Marcar" Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleLinkClick('booking')}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C84B7E]"
          >
            Marcar
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-[#2A2628] hover:bg-[#2A2628]/5 rounded-lg transition-colors"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F6] border-b border-[#2A2628]/10 px-4 pt-3 pb-6 space-y-3">
          <button
            type="button"
            onClick={() => handleLinkClick('home')}
            className="block w-full text-left py-2.5 text-base font-medium text-[#2A2628] border-b border-[#2A2628]/5"
          >
            O Salão
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('services')}
            className="block w-full text-left py-2.5 text-base font-medium text-[#2A2628] border-b border-[#2A2628]/5"
          >
            Serviços &amp; Preços
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'equipa')}
            className="block w-full text-left py-2.5 text-base font-medium text-[#2A2628] border-b border-[#2A2628]/5"
          >
            Equipa
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'galeria')}
            className="block w-full text-left py-2.5 text-base font-medium text-[#2A2628] border-b border-[#2A2628]/5"
          >
            Galeria
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'contactos')}
            className="block w-full text-left py-2.5 text-base font-medium text-[#2A2628]"
          >
            Localização &amp; Contactos
          </button>
        </div>
      )}
    </header>
  );
};
