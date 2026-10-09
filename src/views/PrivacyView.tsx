import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

interface PrivacyViewProps {
  onBack: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
  const { settings } = useSalon();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-[#2A2628]/75 hover:text-[#2A2628] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      <div className="space-y-3 pb-6 border-b border-[#2A2628]/10">
        <p className="text-xs text-[#2A2628]/60">Proteção de Dados Pessoais · RGPD</p>
        <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2A2628]">
          Política de Privacidade — {settings.salonName}
        </h1>
      </div>

      <div className="space-y-6 text-sm sm:text-base text-[#2A2628]/85 leading-relaxed whitespace-pre-line">
        {settings.privacyPolicyText}
      </div>

      <div className="pt-6 border-t border-[#2A2628]/10 text-xs text-[#2A2628]/65 space-y-1">
        <p>Morada: {settings.address}</p>
        <p>
          Contacto para assuntos de privacidade: {settings.email} · {settings.phone}
        </p>
      </div>
    </div>
  );
};
