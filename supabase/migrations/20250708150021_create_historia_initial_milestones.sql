-- ================================
-- SEED: Marcos Iniciais do Sistema
-- Data: Janeiro 2025
-- Descrição: Marcos automáticos criados para novos usuários
-- ================================

-- Função para criar marcos iniciais para um usuário
CREATE OR REPLACE FUNCTION create_initial_milestones(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Marco 1: Bem-vindo ao Vitto
    PERFORM create_system_milestone(
        p_user_id,
        'Bem-vindo ao Vitto! <‰',
        'Você deu o primeiro passo rumo ao controle financeiro',
        NULL,
        NULL,
        'welcome',
        '#F87060'
    );
    
    -- Marco 2: Primeira conta adicionada
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira conta cadastrada',
        'Sua jornada financeira começou! Primeira conta foi adicionada',
        NULL,
        NULL,
        'wallet',
        '#F87060'
    );
    
    -- Marco 3: Primeiro lançamento
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro lançamento registrado',
        'Você registrou sua primeira transação no sistema',
        NULL,
        NULL,
        'receipt',
        '#F87060'
    );
    
    -- Marco 4: Primeiro mês organizado
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro mês organizado',
        'Você registrou transações por um mês completo',
        NULL,
        NULL,
        'calendar',
        '#10b981'
    );
    
    -- Marco 5: Saldo positivo por 30 dias
    PERFORM create_system_milestone(
        p_user_id,
        'Saldo positivo por 30 dias',
        'Você manteve o saldo positivo por 30 dias seguidos',
        NULL,
        NULL,
        'trending-up',
        '#10b981'
    );
    
    -- Marco 6: Primeira categoria criada
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira categoria personalizada',
        'Você organizou suas transações com uma categoria própria',
        NULL,
        NULL,
        'tags',
        '#F87060'
    );
    
    -- Marco 7: Primeira meta financeira
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira meta financeira',
        'Você estabeleceu seu primeiro objetivo financeiro',
        NULL,
        NULL,
        'target',
        '#F87060'
    );
    
    -- Marco 8: Usar o chat com Vitto
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira conversa com Vitto',
        'Você descobriu como o Vitto pode ajudar na sua jornada',
        NULL,
        NULL,
        'message-circle',
        '#F87060'
    );
    
    -- Marco 9: Orçamento criado
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro orçamento criado',
        'Você planejou seus gastos com seu primeiro orçamento',
        NULL,
        NULL,
        'pie-chart',
        '#F87060'
    );
    
    -- Marco 10: Cartão de crédito cadastrado
    PERFORM create_system_milestone(
        p_user_id,
        'Cartão de crédito cadastrado',
        'Você adicionou seu primeiro cartão de crédito',
        NULL,
        NULL,
        'credit-card',
        '#F87060'
    );
    
    -- Marco 11: Reserva de emergência inicial
    PERFORM create_system_milestone(
        p_user_id,
        'Reserva de emergência de R$ 1.000',
        'Você construiu sua primeira reserva de emergência',
        1000.00,
        0,
        'shield',
        '#10b981'
    );
    
    -- Marco 12: 3 meses de salário recebido
    PERFORM create_system_milestone(
        p_user_id,
        '3 salários recebidos no prazo',
        'Você registrou 3 salários sem atraso',
        3,
        0,
        'dollar-sign',
        '#10b981'
    );
    
    -- Marco 13: 1 ano de uso do Vitto
    PERFORM create_system_milestone(
        p_user_id,
        '1 ano com o Vitto',
        'Você completou um ano de jornada financeira conosco',
        365,
        0,
        'calendar-check',
        '#9333ea'
    );
    
    -- Marco 14: Saldo total de R$ 10.000
    PERFORM create_system_milestone(
        p_user_id,
        'Patrimônio de R$ 10.000',
        'Você atingiu R$ 10.000 em saldo total',
        10000.00,
        0,
        'trophy',
        '#f59e0b'
    );
    
    -- Marco 15: Primeira meta atingida
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira meta conquistada',
        'Você completou sua primeira meta financeira',
        NULL,
        NULL,
        'check-circle',
        '#10b981'
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar badges iniciais (conquistas extras)
CREATE OR REPLACE FUNCTION create_initial_badges_examples(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Badge: Organizador
    PERFORM create_badge(
        p_user_id,
        'Organizador',
        'Você organizou mais de 10 categorias',
        'folder',
        '#10b981'
    );
    
    -- Badge: Economista
    PERFORM create_badge(
        p_user_id,
        'Economista',
        'Você economizou mais de R$ 1.000 em um mês',
        'piggy-bank',
        '#10b981'
    );
    
    -- Badge: Disciplinado
    PERFORM create_badge(
        p_user_id,
        'Disciplinado',
        'Você seguiu seu orçamento por 3 meses seguidos',
        'award',
        '#9333ea'
    );
    
    -- Badge: Investidor
    PERFORM create_badge(
        p_user_id,
        'Investidor Iniciante',
        'Você registrou seus primeiros investimentos',
        'trending-up',
        '#f59e0b'
    );
    
    -- Badge: Planejador
    PERFORM create_badge(
        p_user_id,
        'Planejador',
        'Você criou 5 metas financeiras',
        'calendar-days',
        '#3b82f6'
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar marcos iniciais quando um usuário fizer seu primeiro perfil
CREATE OR REPLACE FUNCTION trigger_create_initial_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar marcos iniciais para o novo usuário
    PERFORM create_initial_milestones(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela app_perfil
DROP TRIGGER IF EXISTS after_profile_created ON app_perfil;
CREATE TRIGGER after_profile_created
    AFTER INSERT ON app_perfil
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_initial_milestones();

-- Comentários para documentação
COMMENT ON FUNCTION create_initial_milestones(UUID) IS 'Cria marcos iniciais para novos usuários';
COMMENT ON FUNCTION create_initial_badges_examples(UUID) IS 'Exemplos de badges que podem ser criadas (não executado automaticamente)';
COMMENT ON FUNCTION trigger_create_initial_milestones() IS 'Trigger para criar marcos quando perfil é criado';