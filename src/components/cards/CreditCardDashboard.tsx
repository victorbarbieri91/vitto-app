import React, { useState, useEffect } from 'react';
import { ModernCard } from '../ui/modern';
import { ModernButton } from '../ui/modern';
import { ModernBadge } from '../ui/modern';
import { creditCardService, CreditCardWithUsage } from '../../services/api';
import CreditCardForm from '../forms/CreditCardForm';
import { CreditCard } from '../../services/api';

interface CreditCardDashboardProps {
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export const CreditCardDashboard: React.FC<CreditCardDashboardProps> = ({
  className = '',
}) => {
  const [cards, setCards] = useState<CreditCardWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await creditCardService.listWithUsage();
      setCards(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cartões');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleCreateSuccess = (_card: CreditCard) => {
    setViewMode('list');
    setSelectedCard(null);
    loadCards();
  };

  const handleEditSuccess = (_card: CreditCard) => {
    setViewMode('list');
    setSelectedCard(null);
    loadCards();
  };

  const handleEdit = (card: CreditCard) => {
    setSelectedCard(card);
    setViewMode('edit');
  };

  const handleDelete = async (cardId: number) => {
    if (!confirm('Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await creditCardService.delete(cardId);
      await loadCards();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cartão');
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateUsagePercentage = (usado: number, limite: number): number => {
    return limite > 0 ? (usado / limite) * 100 : 0;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (viewMode === 'create') {
    return (
      <div className={className}>
        <CreditCardForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  if (viewMode === 'edit' && selectedCard) {
    return (
      <div className={className}>
        <CreditCardForm
          creditCard={selectedCard}
          onSuccess={handleEditSuccess}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue">Cartões de Crédito</h1>
          <p className="text-slate-500 mt-1">
            Gerencie seus cartões e acompanhe os limites disponíveis
          </p>
        </div>
        <ModernButton
          variant="primary"
          onClick={() => setViewMode('create')}
          icon="add"
        >
          Novo Cartão
        </ModernButton>
      </div>

      {/* Loading */}
      {isLoading && (
        <ModernCard variant="default" className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
            <span className="ml-3 text-slate-600">Carregando cartões...</span>
          </div>
        </ModernCard>
      )}

      {/* Erro */}
      {error && (
        <ModernCard variant="error" className="p-4">
          <div className="flex items-center gap-3">
            <ion-icon name="alert-circle" size="small" className="text-red-500"></ion-icon>
            <span className="text-red-700">{error}</span>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={loadCards}
              className="ml-auto"
            >
              Tentar Novamente
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Lista vazia */}
      {!isLoading && !error && cards.length === 0 && (
        <ModernCard variant="default" className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ion-icon name="card" size="large" className="text-slate-400"></ion-icon>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-slate-500 mb-6">
              Adicione seu primeiro cartão de crédito para começar a controlar seus gastos
            </p>
            <ModernButton
              variant="primary"
              onClick={() => setViewMode('create')}
              icon="add"
            >
              Adicionar Cartão
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Lista de cartões */}
      {!isLoading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const usagePercentage = calculateUsagePercentage(card.limite_usado, card.limite);
            const disponivel = card.limite - card.limite_usado;

            return (
              <ModernCard key={card.id} variant="default" className="p-0 overflow-hidden">
                {/* Cartão visual */}
                <div
                  className="h-40 p-6 text-white relative overflow-hidden"
                  style={{ backgroundColor: card.cor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold truncate">{card.nome}</span>
                      <ion-icon name={card.icone} size="small"></ion-icon>
                    </div>
                    
                    <div>
                      <div className="text-sm opacity-90 mb-1">Limite disponível</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(disponivel)}
                      </div>
                      <div className="text-xs opacity-75">
                        de {formatCurrency(card.limite)}
                      </div>
                    </div>

                    {/* Barra de uso */}
                    <div className="mt-2">
                      <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {usagePercentage.toFixed(1)}% utilizado
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações e ações */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Fatura atual:</span>
                      <span className="font-semibold text-deep-blue">
                        {formatCurrency(card.fatura_atual)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Próxima fatura:</span>
                      <span className="font-semibold text-deep-blue">
                        {formatCurrency(card.fatura_proxima)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Fechamento:</span>
                      <ModernBadge variant="neutral" size="sm">
                        Dia {card.dia_fechamento}
                      </ModernBadge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Vencimento:</span>
                      <ModernBadge variant="warning" size="sm">
                        Dia {card.dia_vencimento}
                      </ModernBadge>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <ModernButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(card)}
                      icon="create"
                      className="flex-1"
                    >
                      Editar
                    </ModernButton>
                    <ModernButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                      icon="trash"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            );
          })}
        </div>
      )}

      {/* Resumo geral */}
      {!isLoading && !error && cards.length > 0 && (
        <ModernCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-deep-blue mb-4">
            Resumo dos Cartões
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-deep-blue">
                {cards.length}
              </div>
              <div className="text-sm text-slate-500">
                {cards.length === 1 ? 'Cartão' : 'Cartões'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-deep-blue">
                {formatCurrency(cards.reduce((sum, card) => sum + card.limite, 0))}
              </div>
              <div className="text-sm text-slate-500">Limite Total</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-coral-500">
                {formatCurrency(cards.reduce((sum, card) => sum + card.limite_usado, 0))}
              </div>
              <div className="text-sm text-slate-500">Usado</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(cards.reduce((sum, card) => sum + (card.limite - card.limite_usado), 0))}
              </div>
              <div className="text-sm text-slate-500">Disponível</div>
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
}; 
