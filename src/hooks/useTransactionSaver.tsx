import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  transactionService,
  recurrentTransactionService,
  CreateTransactionRequest,
  CreateInstallmentTransactionRequest,
  CreateRecurrentTransactionRequest
} from '../services/api';

type TransactionType = 'receita' | 'despesa' | 'despesa_cartao';

export function useTransactionSaver(type: TransactionType, onTransactionSaved?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransactionSaved = useCallback(async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      console.log('[useTransactionSaver] Dados recebidos do formulário:', data);

      // Detectar tipo de transação baseado nos switches do formulário
      const isRecorrente = data.is_recorrente === true;
      const isParcelado = data.is_parcelado === true;

      console.log('[useTransactionSaver] Tipo de transação detectado:', { isRecorrente, isParcelado });

      let result: any;
      let error: any = null;

      if (isRecorrente) {
        // TRANSAÇÃO RECORRENTE → app_transacoes_fixas
        console.log('[useTransactionSaver] Criando transação recorrente...');

        const recurrentData: CreateRecurrentTransactionRequest = {
          descricao: data.descricao,
          valor: data.valor,
          tipo: type,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          dia_mes: data.recorrencia?.dia_vencimento || data.recorrencia?.dia_cobranca || 1,
          data_inicio: data.recorrencia?.data_inicio || data.data,
        };

        console.log('[useTransactionSaver] Dados para transação recorrente:', recurrentData);

        try {
          result = await recurrentTransactionService.createRecurrentTransaction(recurrentData);
          console.log('[useTransactionSaver] Transação recorrente criada:', result);

          // Se o status for confirmado, criar também uma transação real no mês atual
          if (data.status === 'confirmado') {
            console.log('[useTransactionSaver] Status confirmado - criando transação real...');
            const confirmResult = await transactionService.confirmVirtualFixedTransaction(
              result.id,
              data.data || new Date().toISOString().split('T')[0]
            );

            if (confirmResult.error) {
              console.error('[useTransactionSaver] Erro ao criar transação real:', confirmResult.error);
              throw new Error('Erro ao confirmar transação para o mês atual');
            }

            console.log('[useTransactionSaver] Transação real criada:', confirmResult.data);
          }
        } catch (err) {
          console.error('[useTransactionSaver] Erro ao criar transação recorrente:', err);
          error = err;
        }

      } else if (isParcelado) {
        // TRANSAÇÃO PARCELADA → múltiplas entradas em app_transacoes
        console.log('[useTransactionSaver] Criando transação parcelada...');

        const parcelaAtual = data.parcelamento?.parcela_atual;
        const installmentData: CreateInstallmentTransactionRequest = {
          descricao: data.descricao,
          valor_total: data.valor,
          data_primeira_parcela: data.parcelamento?.data_primeira_parcela || data.data,
          total_parcelas: data.parcelamento?.total_parcelas,
          parcela_inicial: parcelaAtual && parcelaAtual > 1 ? parcelaAtual : undefined,
          tipo: type,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          observacoes: data.observacoes || undefined,
          status: data.status || 'pendente',
        };

        console.log('[useTransactionSaver] Dados para transação parcelada:', installmentData);
        const response = await transactionService.createInstallments(installmentData);
        result = response.data;
        error = response.error;

      } else {
        // TRANSAÇÃO ÚNICA → app_transacoes
        console.log('[useTransactionSaver] Criando transação única...');

        const transactionData: CreateTransactionRequest = {
          descricao: data.descricao,
          valor: data.valor,
          data: data.data,
          tipo: type,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: data.cartao_id || undefined,
          data_vencimento: data.data_vencimento || undefined,
          observacoes: data.observacoes || undefined,
          status: data.status || 'pendente',
        };

        console.log('[useTransactionSaver] Dados para transação única:', transactionData);
        const response = await transactionService.create(transactionData);
        result = response.data;
        error = response.error;
      }

      if (error) {
        throw new Error(error.message || 'Erro ao salvar transação');
      }

      console.log('[useTransactionSaver] Transação salva com sucesso:', result);

      // Mensagens de sucesso específicas por tipo
      if (isRecorrente) {
        if (type === 'receita') {
          toast.success('Receita recorrente criada com sucesso!');
        } else if (type === 'despesa') {
          toast.success('Despesa recorrente criada com sucesso!');
        } else if (type === 'despesa_cartao') {
          toast.success('Despesa recorrente de cartão criada com sucesso!');
        }
      } else if (isParcelado) {
        const totalParcelas = data.parcelamento?.total_parcelas || 0;
        if (type === 'receita') {
          toast.success(`Receita parcelada criada! ${totalParcelas} parcelas geradas.`);
        } else if (type === 'despesa') {
          toast.success(`Despesa parcelada criada! ${totalParcelas} parcelas geradas.`);
        } else if (type === 'despesa_cartao') {
          toast.success(`Compra parcelada no cartão criada! ${totalParcelas} parcelas geradas.`);
        }
      } else {
        if (type === 'receita') {
          toast.success('Receita salva com sucesso!');
        } else if (type === 'despesa') {
          toast.success('Despesa salva com sucesso!');
        } else if (type === 'despesa_cartao') {
          toast.success('Despesa de cartão salva com sucesso!');
        }
      }

      // Chamar callback se fornecido
      if (onTransactionSaved) {
        console.log('[useTransactionSaver] Executando callback onTransactionSaved...');
        onTransactionSaved();
      }

    } catch (error: any) {
      console.error("[useTransactionSaver] Erro ao salvar a transação", error);
      toast.error(error.message || 'Falha ao salvar a transação.');
    } finally {
      setIsSubmitting(false);
    }
  }, [type, onTransactionSaved]);

  return {
    handleTransactionSaved,
    isSubmitting,
  };
}