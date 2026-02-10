import { useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import type { Transaction } from '../../hooks/useTransactions';
import { ModernInput, ModernButton } from '../ui/modern';
import CurrencyInput from '../ui/CurrencyInput';

// Tipo para os dados do formulário (sem id e user_id)
interface FormTransactionData {
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  categoria_id: number | null;
  conta_id: number;
  conta_destino_id?: number | null;
  status: 'pendente' | 'efetivado' | 'cancelado';
  observacao?: string | null;
}

// Estender o tipo Transaction para incluir observacao se não existir
interface ExtendedTransaction extends Transaction {
  observacao?: string | null;
}

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit?: (data: FormTransactionData) => Promise<void>;
  onSave?: (data: FormTransactionData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 *
 */
export default function TransactionForm({ 
  transaction, 
  onSubmit, 
  onSave,
  onCancel,
  isSubmitting = false
}: TransactionFormProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  
  // Valores iniciais para o formulário
  const initialValues: FormTransactionData = {
    descricao: transaction?.descricao || '',
    valor: transaction?.valor || 0,
    data: transaction?.data ? new Date(transaction.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tipo: transaction?.tipo || 'despesa',
    categoria_id: transaction?.categoria_id || null,
    conta_id: transaction?.conta_id || (accounts.length > 0 ? accounts[0].id : 0),
    conta_destino_id: transaction?.conta_destino_id || null,
    status: transaction?.status || 'pendente',
    observacao: (transaction as ExtendedTransaction)?.observacao || ''
  };

  // Regras de validação
  const validationRules = {
    descricao: (value: string) => value.trim().length > 0 ? '' : 'Descrição é obrigatória',
    valor: (value: number) => (typeof value === 'number' && value > 0) ? '' : 'Valor deve ser maior que zero',
    data: (value: string) => value ? '' : 'Data é obrigatória',
    conta_id: (value: number) => value > 0 ? '' : 'Conta é obrigatória',
    categoria_id: (value: number | null, formData?: FormTransactionData) => {
      // Categoria é obrigatória exceto para transferências
      if (formData && formData.tipo === 'transferencia') {
        return '';
      }
      return value && value > 0 ? '' : 'Categoria é obrigatória';
    },
    conta_destino_id: (value: number | null | undefined, formData?: FormTransactionData) => {
      if (formData && formData.tipo === 'transferencia') {
        return value && value > 0 ? '' : 'Conta de destino é obrigatória';
      }
      return '';
    }
  };

  // Inicializar o hook de formulário
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    handleSubmit, 
    setFieldValue,
  } = useForm<FormTransactionData>({
    initialValues,
    validationRules,
    onSubmit: async (data: FormTransactionData) => {
      console.log('Tentando submeter formulário:', { 
        data, 
        errors, 
        touched,
        valorType: typeof data.valor,
        valorValue: data.valor
      });
      
      // Enviar apenas os campos que existem na tabela app_lancamento
      const cleanData: any = {
        descricao: data.descricao,
        valor: data.valor,
        data: data.data,
        tipo: data.tipo,
        conta_id: data.conta_id,
        categoria_id: data.categoria_id || null
      };
      
      // Adicionar conta_destino_id apenas se for transferência
      if (data.tipo === 'transferencia' && data.conta_destino_id) {
        cleanData.conta_destino_id = data.conta_destino_id;
      }
      
      console.log('Dados limpos para envio:', cleanData);
      
      const submitHandler = onSubmit || onSave;
      if (submitHandler) {
        await submitHandler(cleanData);
      }
    }
  });

  // Filtrar categorias com base no tipo de transação
  const filteredCategories = categories.filter(cat => {
    if (values.tipo === 'receita') return cat.tipo === 'receita';
    if (values.tipo === 'despesa') return cat.tipo === 'despesa';
    return true; // Para transferências, mostrar todas
  });

  // Resetar categoria ao mudar o tipo de transação
  useEffect(() => {
    setFieldValue('categoria_id', null);
    
    // Se for transferência, resetar conta de destino
    if (values.tipo === 'transferencia') {
      setFieldValue('conta_destino_id', accounts.length > 1 ? accounts.find(a => a.id !== values.conta_id)?.id || null : null);
    } else {
      setFieldValue('conta_destino_id', null);
    }
  }, [values.tipo, values.conta_id, accounts]);

  // Atualizar conta_id quando as contas carregarem
  useEffect(() => {
    if (accounts.length > 0 && values.conta_id === 0 && !transaction) {
      setFieldValue('conta_id', accounts[0].id);
    }
  }, [accounts, values.conta_id, transaction]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <ModernInput
            label="Descrição"
            name="descricao"
            value={values.descricao}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.descricao ? errors.descricao : ''}
            placeholder="Ex: Salário, Aluguel, etc."
            autoFocus
          />
        </div>
        <div>
          <CurrencyInput
            label="Valor"
            value={values.valor}
            onChange={(value) => setFieldValue('valor', value || 0)}
            error={touched.valor ? errors.valor : ''}
            required
          />
        </div>
        <div>
          <ModernInput
            label="Data"
            name="data"
            type="date"
            value={values.data}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.data ? errors.data : ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
          <select
            name="tipo"
            value={values.tipo}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition"
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
          <select
            name="categoria_id"
            value={values.categoria_id || ''}
            onChange={e => setFieldValue('categoria_id', e.target.value ? parseInt(e.target.value) : null)}
            onBlur={handleBlur}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition"
            disabled={values.tipo === 'transferencia'}
          >
            <option value="">Selecione uma categoria</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.id}>{category.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Conta</label>
          <select
            name="conta_id"
            value={values.conta_id || ''}
            onChange={e => {
              const value = parseInt(e.target.value) || 0;
              setFieldValue('conta_id', value);
            }}
            onBlur={handleBlur}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition"
          >
            <option value="">Selecione uma conta</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.nome}</option>
            ))}
          </select>
        </div>
        {values.tipo === 'transferencia' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Conta Destino</label>
            <select
              name="conta_destino_id"
              value={values.conta_destino_id || ''}
              onChange={e => setFieldValue('conta_destino_id', e.target.value ? parseInt(e.target.value) : null)}
              onBlur={handleBlur}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition"
            >
              <option value="">Selecione a conta destino</option>
              {accounts.filter(acc => acc.id !== values.conta_id).map(account => (
                <option key={account.id} value={account.id}>{account.nome}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <ModernButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </ModernButton>
        <ModernButton
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {transaction ? 'Atualizar Lançamento' : 'Criar Lançamento'}
        </ModernButton>
      </div>
    </form>
  );
}
