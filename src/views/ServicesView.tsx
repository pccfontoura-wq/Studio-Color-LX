import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

interface ServicesViewProps {
  onStartBookingWithService: (serviceId: string) => void;
  onGoToBooking: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onStartBookingWithService,
  onGoToBooking,
}) => {
  const { services } = useSalon();
  const activeServices = services.filter((s) => s.active);

  const categories = Array.from(new Set(activeServices.map((s) => s.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const visibleCategories =
    selectedCategory === 'all'
      ? categories
      : categories.filter((c) => c === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-12">
      {/* Cabeçalho da Página de Serviços */}
      <div className="space-y-4 pb-8 border-b border-[#2A2628]/10">
        <p className="text-xs text-[#2A2628]/60">Menu de Serviços &amp; Preçário</p>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-normal text-[#2A2628] text-balance">
          Cuidado capilar e colorimetria à medida.
        </h1>
        <p className="text-base text-[#2A2628]/75 max-w-2xl leading-relaxed">
          Todos os serviços incluem diagnóstico personalizado. Os preços são apresentados em euros (€)
          com duração estimada para garantir tranquilidade em cada sessão.
        </p>

        {/* Controlo interativo de filtro por categoria */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#2A2628] text-white'
                : 'bg-[#2A2628]/5 text-[#2A2628]/80 hover:bg-[#2A2628]/10'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2A2628] text-white'
                  : 'bg-[#2A2628]/5 text-[#2A2628]/80 hover:bg-[#2A2628]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista organizada por categoria */}
      <div className="space-y-16">
        {visibleCategories.map((category) => {
          const categoryServices = activeServices.filter((s) => s.category === category);
          return (
            <section key={category} className="space-y-6">
              <h2 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#2A2628] pb-3 border-b border-[#2A2628]/15">
                {category}
              </h2>

              <div className="divide-y divide-[#2A2628]/10">
                {categoryServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif-display text-xl sm:text-2xl font-medium text-[#2A2628]">
                          {srv.name}
                        </h3>
                      </div>
                      <p className="text-sm text-[#2A2628]/75 leading-relaxed">
                        {srv.description}
                      </p>
                      <p className="text-xs text-[#2A2628]/60 tabular-nums">
                        Duração estimada: {srv.durationMinutes} min
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0">
                      <span className="font-serif-display text-2xl font-medium text-[#2A2628] tabular-nums">
                        {srv.price} €
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartBookingWithService(srv.id)}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#2A2628] hover:bg-[#C84B7E] rounded-lg transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>Marcar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Nota final */}
      <div className="pt-8 border-t border-[#2A2628]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p className="text-sm text-[#2A2628]/75 max-w-xl">
          Pretende combinar mais do que um serviço na mesma sessão? No nosso assistente de marcação
          pode selecionar múltiplos serviços e consultar os horários livres imediatamente.
        </p>
        <button
          type="button"
          onClick={onGoToBooking}
          className="px-6 py-3 text-sm font-medium text-white bg-[#C84B7E] hover:bg-[#b03e6d] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          Iniciar Marcação Personalizada
        </button>
      </div>
    </div>
  );
};
