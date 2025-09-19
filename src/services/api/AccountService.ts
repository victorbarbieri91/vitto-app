import { BaseApi } from './BaseApi';

import type { Database } from '../../types/supabase';

export type Account = Database['public']['Tables']['app_conta']['Row'] & {
  grupo_conta_id: number | null;
  instituicao: string | null;
};
export type AccountGroup = Database['public']['Tables']['app_conta_grupo']['Row'];

export type NewAccount = Database['public']['Tables']['app_conta']['Insert'];
export type UpdateAccount = Database['public']['Tables']['app_conta']['Update'];
export type NewAccountGroup = Database['public']['Tables']['app_conta_grupo']['Insert'];
export type UpdateAccountGroup = Partial<NewAccountGroup>;

export type Transaction = Database['public']['Tables']['app_transacoes']['Row'] & { 
  app_categoria: {
    nome: string;
    cor: string;
    icone: string;
  } | null;
  // Campos adicionais para transações unificadas
  id_unico?: string;
  origem_tabela?: 'normal' | 'recorrente';
  tipo_recorrencia?: 'unica' | 'fixa' | 'parcelada';
  intervalo?: string;
  proxima_execucao?: string;
  ativo?: boolean;
  status?: string;
};

export type TransferData = {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  date: string;
  description?: string | null;
};

// Tipo para os dados do formulário de criação/edição de conta
export type AccountFormData = {
  nome: string;
  tipo: string;
  saldo_inicial: number;
  cor: string | null;
  icone: string | null;
  descricao?: string | null;
  instituicao?: string | null;
  status: 'ativa' | 'inativa' | 'arquivada';
  moeda: string;
};

/**
 * Service to handle all account-related API calls
 */
export class AccountService extends BaseApi {
  /**
   * Fetch all accounts for the current user
   */
  async fetchAccounts(): Promise<Account[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_conta')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar contas');
    }
  }

  /**
   * Get an account by ID
   */
  async getAccount(id: number): Promise<Account | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('app_conta')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar conta');
    }
  }

  /**
   * Create a new account with automatic initial balance transaction
   */
  async createAccount(accountData: AccountFormData): Promise<Account> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { /* grupo_conta_id, */ ...rest } = accountData;

      // Criar a conta
      const { data: conta, error: contaError } = await this.supabase
        .from('app_conta')
        .insert([
          {
            ...rest,
            user_id: user.id,
            saldo_atual: accountData.saldo_inicial,
          },
        ])
        .select()
        .single();

      if (contaError) throw contaError;

      // Se o saldo inicial não for zero ou nulo, criar lançamento de saldo inicial
      if (accountData.saldo_inicial && accountData.saldo_inicial !== 0) {
        await this.criarLancamentoSaldoInicial(conta.id, accountData.saldo_inicial, accountData.nome, user.id);
      }

      return conta;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar conta');
    }
  }

  /**
   * Create initial balance transaction for a new account
   */
  private async criarLancamentoSaldoInicial(
    contaId: number,
    saldoInicial: number,
    nomeConta: string,
    userId: string
  ): Promise<void> {
    try {
      // Obter categoria "Saldo Inicial" - aceitar tipo "ambos" ou "receita"
      let categoriaId: number;

      const { data: categoria, error: categoriaError } = await this.supabase
        .from('app_categoria')
        .select('id')
        .eq('nome', 'Saldo Inicial')
        .eq('is_default', true)
        .single();

      if (!categoriaError && categoria) {
        categoriaId = categoria.id;
      } else {
        // Se não encontrar, tentar buscar categoria "Outros" como fallback
        const { data: categoriaOutros } = await this.supabase
          .from('app_categoria')
          .select('id')
          .eq('nome', 'Outros')
          .eq('is_default', true)
          .single();

        if (!categoriaOutros) {
          throw new Error('Categoria para saldo inicial não encontrada');
        }
        categoriaId = categoriaOutros.id;
      }

      const dataAtual = new Date().toISOString().split('T')[0];
      const isReceita = saldoInicial >= 0;
      const valorAbsoluto = Math.abs(saldoInicial);

      // Criar lançamento de saldo inicial
      const { data: lancamento, error: lancamentoError } = await this.supabase
        .from('app_transacoes')
        .insert({
          descricao: `Saldo inicial - ${nomeConta}`,
          valor: valorAbsoluto,
          data: dataAtual,
          tipo: isReceita ? 'receita' : 'despesa',
          categoria_id: categoriaId,
          conta_id: contaId,
          user_id: userId,
          status: 'confirmado',
          tipo_especial: 'saldo_inicial'
        })
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // Registrar no histórico de saldo
      const { error: historicoError } = await this.supabase
        .from('app_saldo_historico')
        .insert({
          user_id: userId,
          conta_id: contaId,
          data_referencia: dataAtual,
          saldo_anterior: 0,
          saldo_novo: saldoInicial,
          tipo_operacao: 'inicial',
          lancamento_ajuste_id: lancamento.id,
          observacoes: `Saldo inicial da conta ${nomeConta}`
        });

      if (historicoError) throw historicoError;

    } catch (error) {
      // Se falhar ao criar lançamento, não deve impedir a criação da conta
      // mas deve logar o erro para acompanhamento
      console.error('Erro ao criar lançamento de saldo inicial:', error);
      throw new Error('Erro ao registrar saldo inicial');
    }
  }

  /**
   * Update an account
   */
    async updateAccount(id: number, updates: UpdateAccount): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Se estiver atualizando saldo_inicial, também atualizar saldo_atual
      const updateData = { ...updates };
      if ('saldo_inicial' in updates && updates.saldo_inicial !== undefined) {
        updateData.saldo_atual = updates.saldo_inicial;
      }

      // Implementar retry com backoff exponencial para conflitos de concorrência
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const { error } = await this.supabase
            .from('app_conta')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          return true;

        } catch (error: any) {
          attempts++;

          if (error.message?.includes('tuple to be updated was already modified') && attempts < maxAttempts) {
            console.warn(`Conflito de concorrência detectado, tentativa ${attempts}/${maxAttempts}`);

            // Aguardar um tempo antes de tentar novamente (backoff exponencial)
            const delay = Math.pow(2, attempts) * 100; // 200ms, 400ms, 800ms
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw error;
        }
      }

      throw new Error('Falha ao atualizar conta após múltiplas tentativas');

    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar conta');
    }
  }

  /**
   * Delete an account
   */
  async deleteAccount(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if account has transactions
      const { data: transactions, error: checkError } = await this.supabase
        .from('app_transacoes')
        .select('id')
        .eq('conta_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        throw new Error('Não é possível excluir conta com transações associadas');
      }

      const { error } = await this.supabase
        .from('app_conta')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir conta');
    }
  }

  /**
   * Get total account balance
   */
  /**
   * Fetch all account groups for the current user
   */
  async fetchAccountGroups(): Promise<AccountGroup[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_conta_grupo')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar grupos de contas');
    }
  }

  /**
   * Create a new account group
   */
  async createAccountGroup(newGroup: NewAccountGroup): Promise<AccountGroup> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_conta_grupo')
        .insert({ ...newGroup, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar grupo de contas');
    }
  }

  /**
   * Update an account group
   */
  async updateAccountGroup(id: number, updates: UpdateAccountGroup): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_conta_grupo')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar grupo de contas');
    }
  }

  /**
   * Delete an account group
   */
  async deleteAccountGroup(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_conta_grupo')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir grupo de contas');
    }
  }

  /**
   * Create a transfer between two accounts
   */
  async createTransfer(transferData: TransferData): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { from_account_id, to_account_id, amount, date, description } = transferData;

      // RPC call to a Postgres function to handle the transfer atomically
      const { error } = await this.supabase.rpc('create_transfer', {
        p_from_account_id: from_account_id,
        p_to_account_id: to_account_id,
        p_amount: amount,
        p_date: date,
        p_description: description,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Erro na chamada RPC create_transfer:', error);
        throw error;
      }

      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao realizar transferência');
    }
  }

  async fetchTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_transacoes')
        .select('*, app_categoria(nome, cor, icone)')
        .eq('conta_id', accountId)
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar transações da conta');
    }
  }

  async getTotalBalance(): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      console.log('🔍 [AccountService] Buscando saldo total para usuário:', user.id);
      
      const { data, error } = await this.supabase
        .from('app_conta')
        .select('saldo_atual')
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log('🔍 [AccountService] Dados das contas:', data);
      
      // Garantir conversão correta para número
      const total = data?.reduce((sum, account) => {
        const saldoAtual = typeof account.saldo_atual === 'string' 
          ? parseFloat(account.saldo_atual) 
          : (account.saldo_atual || 0);
        return sum + saldoAtual;
      }, 0) || 0;
      
      console.log('🔍 [AccountService] Saldo total calculado:', total, typeof total);
      
      return total;
    } catch (error) {
      console.error('❌ [AccountService] Erro ao buscar saldo total:', error);
      throw this.handleError(error, 'Falha ao buscar saldo total');
    }
  }
}

export const accountService = new AccountService();
export default accountService;
