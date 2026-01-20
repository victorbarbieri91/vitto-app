import { BaseApi } from './BaseApi';
import type {
  PatrimonioAtivo,
  NewPatrimonioAtivo,
  UpdatePatrimonioAtivo,
  PatrimonioPorCategoria,
  EvolucaoPatrimonial,
  PatrimonioConsolidado,
  CategoriaAtivo
} from '../../types/patrimonio';

/**
 * Service para gerenciamento de patrimônio
 * Inclui CRUD de ativos e métricas consolidadas
 */
export class PatrimonioService extends BaseApi {

  // ==========================================
  // CRUD DE ATIVOS
  // ==========================================

  /**
   * Busca todos os ativos do usuário
   * @param categoria - Filtro opcional por categoria
   * @param incluirInativos - Se true, inclui ativos marcados como inativos
   */
  async fetchAtivos(categoria?: CategoriaAtivo, incluirInativos: boolean = false): Promise<PatrimonioAtivo[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      let query = this.supabase
        .from('app_patrimonio_ativo')
        .select('*')
        .eq('user_id', user.id)
        .order('valor_atual', { ascending: false });

      if (!incluirInativos) {
        query = query.eq('ativo', true);
      }

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar ativos');
    }
  }

  /**
   * Busca um ativo específico por ID
   */
  async getAtivo(id: number): Promise<PatrimonioAtivo | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('app_patrimonio_ativo')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar ativo');
    }
  }

  /**
   * Cria um novo ativo
   */
  async createAtivo(ativo: NewPatrimonioAtivo): Promise<PatrimonioAtivo> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_patrimonio_ativo')
        .insert({
          ...ativo,
          user_id: user.id,
          dados_especificos: ativo.dados_especificos || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar ativo');
    }
  }

  /**
   * Atualiza um ativo existente
   */
  async updateAtivo(id: number, updates: UpdatePatrimonioAtivo): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_patrimonio_ativo')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar ativo');
    }
  }

  /**
   * Atualiza apenas o valor atual de um ativo
   * Útil para atualizações rápidas de cotação
   */
  async updateValorAtivo(id: number, valorAtual: number): Promise<boolean> {
    return this.updateAtivo(id, { valor_atual: valorAtual });
  }

  /**
   * Exclui um ativo (soft delete - marca como inativo)
   */
  async deleteAtivo(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_patrimonio_ativo')
        .update({ ativo: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir ativo');
    }
  }

  /**
   * Exclui permanentemente um ativo (hard delete)
   * Use com cuidado - remove também o histórico
   */
  async deleteAtivoPermanente(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_patrimonio_ativo')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir ativo permanentemente');
    }
  }

  /**
   * Reativa um ativo que foi marcado como inativo
   */
  async reativarAtivo(id: number): Promise<boolean> {
    return this.updateAtivo(id, { ativo: true });
  }

  // ==========================================
  // MÉTRICAS E CONSOLIDAÇÃO
  // ==========================================

  /**
   * Obtém patrimônio agrupado por categoria
   * Inclui contas bancárias como "liquidez"
   */
  async getPatrimonioPorCategoria(): Promise<PatrimonioPorCategoria[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .rpc('calcular_patrimonio_por_categoria', { p_user_id: user.id });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        categoria: item.categoria as CategoriaAtivo,
        valor_total: Number(item.valor_total) || 0,
        quantidade_ativos: Number(item.quantidade_ativos) || 0,
        percentual: Number(item.percentual) || 0
      }));
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular patrimônio por categoria');
    }
  }

  /**
   * Obtém evolução patrimonial dos últimos N meses
   * @param meses - Quantidade de meses (padrão: 12)
   */
  async getEvolucaoPatrimonial(meses: number = 12): Promise<EvolucaoPatrimonial[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .rpc('obter_evolucao_patrimonial', {
          p_user_id: user.id,
          p_meses: meses
        });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        mes: Number(item.mes),
        ano: Number(item.ano),
        patrimonio_total: Number(item.patrimonio_total) || 0,
        variacao_mensal: Number(item.variacao_mensal) || 0,
        variacao_percentual: Number(item.variacao_percentual) || 0
      }));
    } catch (error) {
      throw this.handleError(error, 'Falha ao obter evolução patrimonial');
    }
  }

  /**
   * Obtém visão consolidada completa do patrimônio
   */
  async getPatrimonioConsolidado(): Promise<PatrimonioConsolidado> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados em paralelo para melhor performance
      const [consolidadoResult, porCategoriaResult, evolucaoResult] = await Promise.all([
        this.supabase.rpc('obter_patrimonio_consolidado', { p_user_id: user.id }),
        this.getPatrimonioPorCategoria(),
        this.getEvolucaoPatrimonial(12)
      ]);

      if (consolidadoResult.error) throw consolidadoResult.error;

      const consolidado = consolidadoResult.data?.[0] || {
        patrimonio_total: 0,
        patrimonio_liquido: 0,
        total_dividas: 0,
        variacao_mes_valor: 0,
        variacao_mes_percentual: 0,
        quantidade_ativos: 0
      };

      return {
        patrimonio_total: Number(consolidado.patrimonio_total) || 0,
        patrimonio_liquido: Number(consolidado.patrimonio_liquido) || 0,
        total_dividas: Number(consolidado.total_dividas) || 0,
        variacao_mes_valor: Number(consolidado.variacao_mes_valor) || 0,
        variacao_mes_percentual: Number(consolidado.variacao_mes_percentual) || 0,
        quantidade_ativos: Number(consolidado.quantidade_ativos) || 0,
        por_categoria: porCategoriaResult,
        evolucao_12_meses: evolucaoResult
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao obter patrimônio consolidado');
    }
  }

  /**
   * Calcula o patrimônio total (ativos + contas bancárias)
   */
  async getPatrimonioTotal(): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return 0;

      // Soma dos ativos
      const { data: ativosData, error: ativosError } = await this.supabase
        .from('app_patrimonio_ativo')
        .select('valor_atual')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .is('conta_id', null);

      if (ativosError) throw ativosError;

      const totalAtivos = (ativosData || []).reduce(
        (sum, item) => sum + (Number(item.valor_atual) || 0),
        0
      );

      // Soma das contas bancárias
      const { data: contasData, error: contasError } = await this.supabase
        .from('app_conta')
        .select('saldo_atual')
        .eq('user_id', user.id)
        .eq('status', 'ativa');

      if (contasError) throw contasError;

      const totalContas = (contasData || []).reduce(
        (sum, item) => sum + (Number(item.saldo_atual) || 0),
        0
      );

      return totalAtivos + totalContas;
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular patrimônio total');
    }
  }

  // ==========================================
  // INTEGRAÇÃO COM CONTAS BANCÁRIAS
  // ==========================================

  /**
   * Sincroniza contas bancárias como ativos de liquidez
   * Cria ou atualiza ativos vinculados às contas
   */
  async sincronizarLiquidezComContas(): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar contas ativas
      const { data: contas, error: contasError } = await this.supabase
        .from('app_conta')
        .select('id, nome, saldo_atual, instituicao, tipo')
        .eq('user_id', user.id)
        .eq('status', 'ativa');

      if (contasError) throw contasError;

      let sincronizadas = 0;

      for (const conta of contas || []) {
        // Verificar se já existe ativo vinculado
        const { data: existente } = await this.supabase
          .from('app_patrimonio_ativo')
          .select('id')
          .eq('user_id', user.id)
          .eq('conta_id', conta.id)
          .single();

        if (existente) {
          // Atualizar valor
          await this.updateAtivo(existente.id, {
            valor_atual: Number(conta.saldo_atual) || 0,
            nome: conta.nome
          });
        } else {
          // Criar novo ativo vinculado
          await this.createAtivo({
            nome: conta.nome,
            categoria: 'liquidez',
            subcategoria: conta.tipo || 'Conta Bancária',
            valor_atual: Number(conta.saldo_atual) || 0,
            instituicao: conta.instituicao || undefined,
            ativo: true,
            dados_especificos: {},
            conta_id: conta.id
          });
        }
        sincronizadas++;
      }

      return sincronizadas;
    } catch (error) {
      throw this.handleError(error, 'Falha ao sincronizar liquidez com contas');
    }
  }

  // ==========================================
  // SNAPSHOT E HISTÓRICO
  // ==========================================

  /**
   * Cria snapshot mensal do patrimônio
   * Deve ser chamado no início de cada mês
   */
  async criarSnapshotMensal(): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .rpc('snapshot_patrimonio_mensal', { p_user_id: user.id });

      if (error) throw error;
      return Number(data) || 0;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar snapshot mensal');
    }
  }

  /**
   * Obtém histórico de um ativo específico
   */
  async getHistoricoAtivo(ativoId: number): Promise<EvolucaoPatrimonial[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_patrimonio_historico')
        .select('mes, ano, valor_fim_mes, variacao_absoluta, variacao_percentual')
        .eq('user_id', user.id)
        .eq('ativo_id', ativoId)
        .order('ano', { ascending: true })
        .order('mes', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        mes: item.mes,
        ano: item.ano,
        patrimonio_total: Number(item.valor_fim_mes) || 0,
        variacao_mensal: Number(item.variacao_absoluta) || 0,
        variacao_percentual: Number(item.variacao_percentual) || 0
      }));
    } catch (error) {
      throw this.handleError(error, 'Falha ao obter histórico do ativo');
    }
  }

  // ==========================================
  // ESTATÍSTICAS E ANÁLISES
  // ==========================================

  /**
   * Calcula estatísticas de rentabilidade
   */
  async getEstatisticasRentabilidade(): Promise<{
    rentabilidade_total: number;
    rentabilidade_percentual: number;
    maior_valorizacao: PatrimonioAtivo | null;
    maior_desvalorizacao: PatrimonioAtivo | null;
  }> {
    try {
      const ativos = await this.fetchAtivos();

      let rentabilidadeTotal = 0;
      let valorAquisicaoTotal = 0;
      let maiorValorizacao: PatrimonioAtivo | null = null;
      let maiorDesvalorizacao: PatrimonioAtivo | null = null;
      let maiorValorizacaoPerc = -Infinity;
      let maiorDesvalorizacaoPerc = Infinity;

      for (const ativo of ativos) {
        const valorAquisicao = ativo.valor_aquisicao || 0;
        const valorAtual = ativo.valor_atual;

        if (valorAquisicao > 0) {
          const rentabilidade = valorAtual - valorAquisicao;
          const rentabilidadePerc = (rentabilidade / valorAquisicao) * 100;

          rentabilidadeTotal += rentabilidade;
          valorAquisicaoTotal += valorAquisicao;

          if (rentabilidadePerc > maiorValorizacaoPerc) {
            maiorValorizacaoPerc = rentabilidadePerc;
            maiorValorizacao = ativo;
          }

          if (rentabilidadePerc < maiorDesvalorizacaoPerc) {
            maiorDesvalorizacaoPerc = rentabilidadePerc;
            maiorDesvalorizacao = ativo;
          }
        }
      }

      return {
        rentabilidade_total: rentabilidadeTotal,
        rentabilidade_percentual: valorAquisicaoTotal > 0
          ? (rentabilidadeTotal / valorAquisicaoTotal) * 100
          : 0,
        maior_valorizacao: maiorValorizacao,
        maior_desvalorizacao: maiorDesvalorizacao
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular estatísticas de rentabilidade');
    }
  }

  /**
   * Calcula total de dívidas (financiamentos)
   */
  async getTotalDividas(): Promise<number> {
    try {
      const ativos = await this.fetchAtivos();

      return ativos.reduce((total, ativo) => {
        const dados = ativo.dados_especificos as any;
        return total + (Number(dados?.saldo_devedor) || 0);
      }, 0);
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular total de dívidas');
    }
  }

  /**
   * Calcula renda passiva mensal (aluguéis, dividendos estimados)
   */
  async getRendaPassivaMensal(): Promise<number> {
    try {
      const ativos = await this.fetchAtivos();

      return ativos.reduce((total, ativo) => {
        const dados = ativo.dados_especificos as any;
        // Renda de aluguel
        if (dados?.alugado && dados?.renda_aluguel) {
          return total + Number(dados.renda_aluguel);
        }
        return total;
      }, 0);
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular renda passiva');
    }
  }
}

// Exportar instância singleton
const patrimonioService = new PatrimonioService();
export default patrimonioService;
