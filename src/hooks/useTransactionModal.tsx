import { useState, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { TransactionFormModal } from '../components/forms/transaction/TransactionFormModal';
import RevenueForm from '../components/forms/transaction/RevenueForm';
import ExpenseForm from '../components/forms/transaction/ExpenseForm';
import CreditCardExpenseForm from '../components/forms/transaction/CreditCardExpenseForm';
import {
  transactionService,
  recurrentTransactionService,
  CreateTransactionRequest,
  CreateInstallmentTransactionRequest,
  CreateRecurrentTransactionRequest
} from '../services/api';
import type { TransactionListRef } from '../components/transactions/TransactionList';

type ModalType = 'receita' | 'despesa' | 'despesa_cartao' | null;

export function useTransactionModal(onTransactionSaved?: () => void) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transactionListRef = useRef<TransactionListRef>(null);

  const openModal = useCallback((type: ModalType) => {
    console.log(`Abrindo modal de transação: ${type}`);
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleTransactionSaved = useCallback(async (data: Record<string, any>) => {
    if (!activeModal) return;

    setIsSubmitting(true);
    try {
      console.log('[useTransactionModal] Dados recebidos do formulário:', data);

      // Detectar tipo de transação baseado nos switches do formulário
      const isRecorrente = data.is_recorrente === true;
      const isParcelado = data.is_parcelado === true;

      console.log('[useTransactionModal] Tipo de transação detectado:', { isRecorrente, isParcelado });

      let result: any;
      let error: any = null;

      if (isRecorrente) {
        // TRANSAÇÃO RECORRENTE → app_transacoes_fixas
        console.log('[useTransactionModal] Criando transação recorrente...');
        
        const recurrentData: CreateRecurrentTransactionRequest = {
          descricao: data.descricao,
          valor: data.valor,
          tipo: activeModal,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          tipo_recorrencia: 'fixo',
          intervalo: data.recorrencia?.frequencia === 'mensal' ? 'mensal' : 
                    data.recorrencia?.frequencia === 'semanal' ? 'semanal' : 
                    data.recorrencia?.frequencia === 'anual' ? 'anual' : 'mensal',
          dia_mes: data.recorrencia?.dia_vencimento || data.recorrencia?.dia_cobranca || 1,
          data_inicio: data.recorrencia?.data_inicio || data.data,
        };

        console.log('[useTransactionModal] Dados para transação recorrente:', recurrentData);

        try {
          result = await recurrentTransactionService.createRecurrentTransaction(recurrentData);
          console.log('[useTransactionModal] Transação recorrente criada:', result);

          // Se o status for confirmado, criar também uma transação real no mês atual
          if (data.status === 'confirmado') {
            console.log('[useTransactionModal] Status confirmado - criando transação real...');
            const confirmResult = await transactionService.confirmVirtualFixedTransaction(
              result.id,
              data.data || new Date().toISOString().split('T')[0]
            );

            if (confirmResult.error) {
              console.error('[useTransactionModal] Erro ao criar transação real:', confirmResult.error);
              throw new Error('Erro ao confirmar transação para o mês atual');
            }

            console.log('[useTransactionModal] Transação real criada:', confirmResult.data);
          }
        } catch (err) {
          console.error('[useTransactionModal] Erro ao criar transação recorrente:', err);
          error = err;
        }

      } else if (isParcelado) {
        // TRANSAÇÃO PARCELADA → múltiplas entradas em app_transacoes
        console.log('[useTransactionModal] Criando transação parcelada...');
        
        const installmentData: CreateInstallmentTransactionRequest = {
          descricao: data.descricao,
          valor_total: data.valor,
          data_primeira_parcela: data.parcelamento?.data_primeira_parcela || data.data,
          total_parcelas: data.parcelamento?.total_parcelas,
          tipo: activeModal,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          observacoes: data.observacoes || undefined,
          status: data.status || 'pendente',
        };

        console.log('[useTransactionModal] Dados para transação parcelada:', installmentData);
        const response = await transactionService.createInstallments(installmentData);
        result = response.data;
        error = response.error;
        
      } else {
        // TRANSAÇÃO ÚNICA → app_transacoes
        console.log('[useTransactionModal] Criando transação única...');
        
        const transactionData: CreateTransactionRequest = {
          descricao: data.descricao,
          valor: data.valor,
          data: data.data,
          tipo: activeModal,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          data_vencimento: data.data_vencimento || undefined,
          observacoes: data.observacoes || undefined,
          status: data.status || 'pendente',
        };

        console.log('[useTransactionModal] Dados para transação única:', transactionData);
        const response = await transactionService.create(transactionData);
        result = response.data;
        error = response.error;
      }

      if (error) {
        throw new Error(error.message || 'Erro ao salvar transação');
      }

      console.log('[useTransactionModal] Transação salva com sucesso:', result);

      // Mensagens de sucesso específicas por tipo
      if (isRecorrente) {
        if (activeModal === 'receita') {
          toast.success('Receita recorrente criada com sucesso!');
        } else if (activeModal === 'despesa') {
          toast.success('Despesa recorrente criada com sucesso!');
        } else if (activeModal === 'despesa_cartao') {
          toast.success('Despesa recorrente de cartão criada com sucesso!');
        }
      } else if (isParcelado) {
        const totalParcelas = data.parcelamento?.total_parcelas || 0;
        if (activeModal === 'receita') {
          toast.success(`Receita parcelada criada! ${totalParcelas} parcelas geradas.`);
        } else if (activeModal === 'despesa') {
          toast.success(`Despesa parcelada criada! ${totalParcelas} parcelas geradas.`);
        } else if (activeModal === 'despesa_cartao') {
          toast.success(`Compra parcelada no cartão criada! ${totalParcelas} parcelas geradas.`);
        }
      } else {
        if (activeModal === 'receita') {
          toast.success('Receita salva com sucesso!');
        } else if (activeModal === 'despesa') {
          toast.success('Despesa salva com sucesso!');
        } else if (activeModal === 'despesa_cartao') {
          toast.success('Despesa de cartão salva com sucesso!');
        }
      }
      
      closeModal();

      // SEMPRE chamar o callback primeiro (para dashboard e outras páginas)
      if (onTransactionSaved) {
        console.log('[useTransactionModal] Executando callback onTransactionSaved...');
        onTransactionSaved();
      }

      // Atualizar a lista de transações se a ref estiver disponível (para páginas com TransactionList)
      if (transactionListRef.current) {
        console.log('[useTransactionModal] Atualizando TransactionList via ref...');
        transactionListRef.current.fetchTransactions();
      } else {
        console.log('[useTransactionModal] TransactionList ref não disponível (normal em páginas sem lista)');
      }

    } catch (error: any) {
      console.error("[useTransactionModal] Erro ao salvar a transação", error);
      toast.error(error.message || 'Falha ao salvar a transação.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeModal, closeModal]);

  const renderFormForType = useCallback((type: ModalType) => {
    switch (type) {
      case 'receita':
        return <RevenueForm onSave={handleTransactionSaved} onCancel={closeModal} isSubmitting={isSubmitting} />;
      case 'despesa':
        return <ExpenseForm onSave={handleTransactionSaved} onCancel={closeModal} isSubmitting={isSubmitting} />;
      case 'despesa_cartao':
        return <CreditCardExpenseForm onSave={handleTransactionSaved} onCancel={closeModal} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  }, [handleTransactionSaved, closeModal, isSubmitting]);

  const TransactionModalComponent = () => {
    if (!activeModal) return null;

    return (
      <TransactionFormModal
        isOpen={!!activeModal}
        onClose={closeModal}
        type={activeModal}
      >
        {renderFormForType(activeModal)}
      </TransactionFormModal>
    );
  };

  return {
    openModal,
    closeModal,
    activeModal,
    isSubmitting,
    TransactionModalComponent,
    transactionListRef,
  };
}