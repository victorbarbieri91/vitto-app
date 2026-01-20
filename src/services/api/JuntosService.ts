import { BaseApi } from './BaseApi';
import type {
  GrupoResumo,
  DadosGrupoJuntos,
  CriarGrupoForm,
  CriarGrupoResponse,
  ConvidarMembroForm,
  EnviarConviteResponse,
  AceitarConviteResponse,
  JuntosSuccessResponse,
  ListarGruposResponse,
  AtualizarPermissoesForm,
  CriarMetaForm,
  CriarMetaResponse,
  ContribuirMetaForm,
  ConviteInfo,
  ConviteGrupo,
  UsuarioBusca,
  SolicitacaoVinculo,
  EnviarSolicitacaoResponse,
  ResponderSolicitacaoResponse,
} from '../../types/juntos';

/**
 * Service para gerenciar o módulo Juntos - Finanças Compartilhadas
 */
export class JuntosService extends BaseApi {
  /**
   * Lista todos os grupos que o usuário participa
   */
  async listarGrupos(): Promise<GrupoResumo[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await this.supabase.rpc('obter_grupos_usuario');

    if (error) {
      throw this.handleError(error, 'Erro ao buscar grupos');
    }

    const response = data as ListarGruposResponse;
    if (!response.success) {
      throw new Error(response.error || 'Erro ao buscar grupos');
    }

    return response.grupos || [];
  }

  /**
   * Obtém dados consolidados de um grupo específico
   */
  async obterDadosGrupo(grupoId: number, mes?: number, ano?: number): Promise<DadosGrupoJuntos> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('obter_dados_grupo_juntos', {
      p_grupo_id: grupoId,
      p_mes: mes || null,
      p_ano: ano || null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao buscar dados do grupo');
    }

    return data as DadosGrupoJuntos;
  }

  /**
   * Cria um novo grupo Juntos
   */
  async criarGrupo(form: CriarGrupoForm): Promise<CriarGrupoResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('criar_grupo_juntos', {
      p_nome: form.nome,
      p_tipo: form.tipo,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao criar grupo');
    }

    return data as CriarGrupoResponse;
  }

  /**
   * Envia um convite para alguém entrar no grupo
   */
  async enviarConvite(grupoId: number, form: ConvidarMembroForm): Promise<EnviarConviteResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('enviar_convite_grupo', {
      p_grupo_id: grupoId,
      p_email: form.email.toLowerCase().trim(),
      p_mensagem: form.mensagem || null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao enviar convite');
    }

    return data as EnviarConviteResponse;
  }

  /**
   * Busca informações de um convite pelo token (para exibir antes de aceitar)
   */
  async buscarConvitePorToken(token: string): Promise<ConviteInfo> {
    const { data, error } = await this.supabase.rpc('buscar_convite_por_token', {
      p_token: token,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao buscar convite');
    }

    return data as ConviteInfo;
  }

  /**
   * Aceita um convite usando o token
   */
  async aceitarConvite(token: string): Promise<AceitarConviteResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para aceitar o convite' };
    }

    const { data, error } = await this.supabase.rpc('aceitar_convite_grupo', {
      p_token: token,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao aceitar convite');
    }

    return data as AceitarConviteResponse;
  }

  /**
   * Sai de um grupo
   */
  async sairGrupo(grupoId: number): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('sair_grupo_juntos', {
      p_grupo_id: grupoId,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao sair do grupo');
    }

    return data as JuntosSuccessResponse;
  }

  /**
   * Atualiza as permissões de visualização de um membro
   */
  async atualizarPermissoes(
    grupoId: number,
    membroUserId: string,
    permissoes: AtualizarPermissoesForm
  ): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('atualizar_permissoes_membro', {
      p_grupo_id: grupoId,
      p_membro_user_id: membroUserId,
      p_pode_ver_patrimonio: permissoes.pode_ver_patrimonio ?? null,
      p_pode_ver_receitas: permissoes.pode_ver_receitas ?? null,
      p_pode_ver_despesas: permissoes.pode_ver_despesas ?? null,
      p_pode_ver_transacoes: permissoes.pode_ver_transacoes ?? null,
      p_pode_ver_metas: permissoes.pode_ver_metas ?? null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao atualizar permissões');
    }

    return data as JuntosSuccessResponse;
  }

  /**
   * Cria uma nova meta compartilhada
   */
  async criarMeta(grupoId: number, form: CriarMetaForm): Promise<CriarMetaResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('criar_meta_compartilhada', {
      p_grupo_id: grupoId,
      p_titulo: form.titulo,
      p_valor_meta: form.valor_meta,
      p_data_fim: form.data_fim,
      p_descricao: form.descricao || null,
      p_cor: form.cor || null,
      p_icone: form.icone || null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao criar meta');
    }

    return data as CriarMetaResponse;
  }

  /**
   * Contribui para uma meta compartilhada
   */
  async contribuirMeta(metaId: number, form: ContribuirMetaForm): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('contribuir_meta_compartilhada', {
      p_meta_id: metaId,
      p_valor: form.valor,
      p_observacao: form.observacao || null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao contribuir para meta');
    }

    return data as JuntosSuccessResponse;
  }

  /**
   * Lista convites pendentes de um grupo (apenas para admins)
   */
  async listarConvitesPendentes(grupoId: number): Promise<ConviteGrupo[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('app_convite_grupo')
      .select('*')
      .eq('grupo_id', grupoId)
      .eq('status', 'pendente')
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw this.handleError(error, 'Erro ao buscar convites');
    }

    return data as ConviteGrupo[];
  }

  /**
   * Cancela um convite pendente
   */
  async cancelarConvite(conviteId: number): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await this.supabase
      .from('app_convite_grupo')
      .update({ status: 'expirado' })
      .eq('id', conviteId);

    if (error) {
      throw this.handleError(error, 'Erro ao cancelar convite');
    }

    return { success: true };
  }

  /**
   * Atualiza nome ou tipo do grupo
   */
  async atualizarGrupo(
    grupoId: number,
    updates: { nome?: string; tipo?: string }
  ): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await this.supabase
      .from('app_grupo_compartilhado')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', grupoId)
      .eq('criado_por', user.id); // Apenas criador pode atualizar

    if (error) {
      throw this.handleError(error, 'Erro ao atualizar grupo');
    }

    return { success: true };
  }

  /**
   * Exclui uma meta compartilhada
   */
  async excluirMeta(metaId: number): Promise<JuntosSuccessResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await this.supabase
      .from('app_meta_compartilhada')
      .delete()
      .eq('id', metaId);

    if (error) {
      throw this.handleError(error, 'Erro ao excluir meta');
    }

    return { success: true };
  }

  /**
   * Gera o link de convite para compartilhar
   */
  gerarLinkConvite(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/juntos/convite/${token}`;
  }

  // =====================================================
  // SISTEMA DE SOLICITAÇÕES DE VÍNCULO
  // =====================================================

  /**
   * Busca usuários para convidar (por nome ou email)
   */
  async buscarUsuariosParaConvite(termo: string, grupoId: number): Promise<UsuarioBusca[]> {
    const user = await this.getCurrentUser();
    if (!user || termo.length < 2) return [];

    const { data, error } = await this.supabase.rpc('buscar_usuarios_para_convite', {
      p_termo: termo,
      p_grupo_id: grupoId,
    });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }

    return (data as UsuarioBusca[]) || [];
  }

  /**
   * Envia uma solicitação de vínculo para um usuário existente
   */
  async enviarSolicitacao(
    grupoId: number,
    destinatarioId: string,
    mensagem?: string
  ): Promise<EnviarSolicitacaoResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('enviar_solicitacao_vinculo', {
      p_grupo_id: grupoId,
      p_destinatario_id: destinatarioId,
      p_mensagem: mensagem || null,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao enviar solicitação');
    }

    return data as EnviarSolicitacaoResponse;
  }

  /**
   * Obtém solicitações pendentes do usuário logado
   */
  async obterSolicitacoesPendentes(): Promise<SolicitacaoVinculo[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await this.supabase.rpc('obter_solicitacoes_pendentes');

    if (error) {
      console.error('Erro ao buscar solicitações:', error);
      return [];
    }

    return (data as SolicitacaoVinculo[]) || [];
  }

  /**
   * Conta solicitações pendentes (para badge)
   */
  async contarSolicitacoesPendentes(): Promise<number> {
    const user = await this.getCurrentUser();
    if (!user) return 0;

    const { data, error } = await this.supabase.rpc('contar_solicitacoes_pendentes');

    if (error) {
      console.error('Erro ao contar solicitações:', error);
      return 0;
    }

    return (data as number) || 0;
  }

  /**
   * Responde a uma solicitação de vínculo (aceitar ou recusar)
   */
  async responderSolicitacao(
    solicitacaoId: number,
    aceitar: boolean
  ): Promise<ResponderSolicitacaoResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await this.supabase.rpc('responder_solicitacao_vinculo', {
      p_solicitacao_id: solicitacaoId,
      p_aceitar: aceitar,
    });

    if (error) {
      throw this.handleError(error, 'Erro ao responder solicitação');
    }

    return data as ResponderSolicitacaoResponse;
  }
}

// Instância singleton
export const juntosService = new JuntosService();
export default juntosService;
