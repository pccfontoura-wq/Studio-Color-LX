import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reprodução vetorial fiel do logótipo caligráfico "Studio Color HAIR"
 * para nitidez absoluta em ecrãs Retina, cabeçalho e rodapé.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl md:text-5xl',
  }[size];

  const subSizeClasses = {
    sm: 'text-[8px] tracking-[0.26em] -mt-1.5',
    md: 'text-[9px] tracking-[0.28em] -mt-2',
    lg: 'text-[11px] tracking-[0.3em] -mt-2.5',
  }[size];

  return (
    <span className={`inline-flex flex-col items-end leading-none select-none ${className}`}>
      <span className={`font-script-logo text-[#2A2628] font-normal ${sizeClasses}`}>
        Studio Color
      </span>
      <span className={`font-sans text-[#2A2628]/80 font-medium uppercase pr-0.5 ${subSizeClasses}`}>
        HAIR
      </span>
    </span>
  );
};
