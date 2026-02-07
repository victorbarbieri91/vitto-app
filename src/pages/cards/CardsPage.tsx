// Página de Cartões - Central de Administração Simplificada

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard as CreditCardIcon,
  AlertCircle,
  Loader2,
  Plus,
  Calendar,
  Wallet
} from 'lucide-react';
import { ModernCard, ModernButton } from '../../components/ui/modern';
import CreditCardItem from '../../components/cards/CreditCardItem';
import InvoiceDrawer from '../../components/cards/InvoiceDrawer';
import CreditCardForm from '../../components/forms/CreditCardForm';
import {
  creditCardService,
  CreditCardWithUsage,
  CreateCreditCardRequest,
  UpdateCreditCardRequest
} from '../../services/api';
import { formatCurrency } from '../../utils/format';

export default function CardsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<CreditCardWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardWithUsage | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // InvoiceDrawer state
  const [selectedCardForInvoice, setSelectedCardForInvoice] = useState<CreditCardWithUsage | null>(null);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cartão';
      setError(errorMessage);
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
    setSelectedCardForInvoice(card);
    setIsInvoiceDrawerOpen(true);
  };

  // Deep-link: abrir drawer automaticamente via URL params (/cartoes?card_id=5)
  useEffect(() => {
    const cardId = searchParams.get('card_id');
    if (cardId && cards.length > 0) {
      const card = cards.find(c => c.id === parseInt(cardId));
      if (card) {
        setSelectedCardForInvoice(card);
        setIsInvoiceDrawerOpen(true);
        // Limpar params da URL para nao reabrir ao navegar
        setSearchParams({}, { replace: true });
      }
    }
  }, [cards, searchParams]);

  const getTotalFaturas = () => {
    return cards.reduce((total, card) => total + (card.fatura_atual || 0), 0);
  };

  const getProximoVencimento = () => {
    if (cards.length === 0) return null;
    const hoje = new Date().getDate();
    const cardsOrdenados = [...cards].sort((a, b) => {
      const diaA = a.dia_vencimento >= hoje ? a.dia_vencimento : a.dia_vencimento + 30;
      const diaB = b.dia_vencimento >= hoje ? b.dia_vencimento : b.dia_vencimento + 30;
      return diaA - diaB;
    });
    return cardsOrdenados[0];
  };

  const proximoVencimento = getProximoVencimento();

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
    <div className="space-y-6 pt-2">
      {/* Erro */}
      {error && (
        <ModernCard variant="default" className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </ModernCard>
      )}

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
        <div className="space-y-6">
          {/* Header com Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Card Principal - Total Faturas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total em Faturas</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(getTotalFaturas())}</p>
                  <p className="text-white/50 text-xs mt-2">
                    {cards.length} {cards.length === 1 ? 'cartão ativo' : 'cartões ativos'}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-white/80" />
                </div>
              </div>
            </motion.div>

            {/* Próximo Vencimento */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-white/80 text-sm">Próximo Vencimento</span>
              </div>
              {proximoVencimento && (
                <div>
                  <p className="text-xl font-bold">Dia {proximoVencimento.dia_vencimento}</p>
                  <p className="text-xs text-white/70 mt-1">{proximoVencimento.nome}</p>
                </div>
              )}
            </motion.div>

            {/* Botão Novo Cartão */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleCreateCard}
              className="bg-slate-50 hover:bg-slate-100 rounded-xl p-5 border-2 border-dashed border-slate-200 hover:border-coral-300 transition-all group flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 bg-coral-100 group-hover:bg-coral-200 rounded-lg flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-coral-600" />
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-coral-600 transition-colors">
                Novo Cartão
              </span>
            </motion.button>
          </div>

          {/* Grid de Cartões */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Meus Cartões</h2>
              <span className="text-sm text-slate-500">{cards.length} cartões</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
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
        </div>
      )}

      {/* Invoice Drawer */}
      <InvoiceDrawer
        card={selectedCardForInvoice}
        isOpen={isInvoiceDrawerOpen}
        onClose={() => {
          setIsInvoiceDrawerOpen(false);
          setSelectedCardForInvoice(null);
          fetchCards(); // Refresh card data after potential payment
        }}
      />

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
