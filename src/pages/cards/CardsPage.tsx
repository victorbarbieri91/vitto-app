// Página de Cartões - Central de Administração Simplificada

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard as CreditCardIcon, AlertCircle, Loader2 } from 'lucide-react';
import { ModernCard, ModernButton, MetricCard } from '../../components/ui/modern';
import CreditCardItem from '../../components/cards/CreditCardItem';
import CreditCardForm from '../../components/forms/CreditCardForm';
import {
  creditCardService,
  CreditCardWithUsage,
  CreateCreditCardRequest,
  UpdateCreditCardRequest
} from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';

export default function CardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<CreditCardWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardWithUsage | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCards = await creditCardService.listWithUsage();
      setCards(fetchedCards);
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
      setError('Erro ao carregar cartões de crédito');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreateCard = () => {
    setSelectedCard(undefined);
    setIsFormOpen(true);
  };

  const handleEditCard = (card: CreditCardWithUsage) => {
    setSelectedCard(card);
    setIsFormOpen(true);
  };

  const handleDeleteCard = async (card: CreditCardWithUsage) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cartão "${card.nome}"?`)) {
      return;
    }

    try {
      await creditCardService.delete(card.id);
      await fetchCards();
    } catch (err) {
      console.error('Erro ao excluir cartão:', err);
      setError('Erro ao excluir cartão');
    }
  };

  const handleSubmitForm = async (data: CreateCreditCardRequest | UpdateCreditCardRequest) => {
    try {
      setIsSubmitting(true);
      
      if (selectedCard) {
        await creditCardService.update(selectedCard.id, data as UpdateCreditCardRequest);
      } else {
        await creditCardService.create(data as CreateCreditCardRequest);
      }

      setIsFormOpen(false);
      setSelectedCard(undefined);
      await fetchCards();
    } catch (err) {
      console.error('Erro ao salvar cartão:', err);
      setError('Erro ao salvar cartão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewInvoices = (card: CreditCardWithUsage) => {
    // Redirecionar para a página de lançamentos com filtros
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    navigate(`/transactions?type=cartao&card_id=${card.id}&month=${currentMonth}-${currentYear}`);
  };

  const getTotalLimit = () => {
    return cards.reduce((total, card) => total + card.limite, 0);
  };

  const getTotalUsed = () => {
    return cards.reduce((total, card) => total + card.limite_usado, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-coral-500 mx-auto mb-4" />
          <p className="text-slate-600">Carregando cartões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header moderno customizado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8"></div>
          <div className="h-5"></div>
        </div>
        <ModernButton
          variant="primary"
          onClick={handleCreateCard}
          className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-3"
        >
          Novo Cartão
        </ModernButton>
      </div>

      {/* Erro */}
      {error && (
        <ModernCard variant="default" className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </ModernCard>
      )}

      {/* Resumo compacto REMOVIDO */}

      {/* Lista de cartões */}
      {cards.length === 0 ? (
        <ModernCard variant="default" className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-deep-blue mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-slate-500 mb-6">
              Adicione seus cartões de crédito para começar a gerenciar suas finanças.
            </p>
            <ModernButton
              variant="primary"
              onClick={handleCreateCard}
              className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-3"
            >
              Adicionar Primeiro Cartão
            </ModernButton>
          </div>
        </ModernCard>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreditCardItem
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onViewInvoices={handleViewInvoices}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de cartão */}
      <CreditCardForm
        card={selectedCard}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCard(undefined);
        }}
        onSubmit={handleSubmitForm}
        isLoading={isSubmitting}
      />
    </div>
  );
}
