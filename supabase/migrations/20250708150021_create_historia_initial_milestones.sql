-- ================================
-- SEED: Marcos Iniciais do Sistema
-- Data: Janeiro 2025
-- Descri��o: Marcos autom�ticos criados para novos usu�rios
-- ================================

-- Fun��o para criar marcos iniciais para um usu�rio
CREATE OR REPLACE FUNCTION create_initial_milestones(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Marco 1: Bem-vindo ao Vitto
    PERFORM create_system_milestone(
        p_user_id,
        'Bem-vindo ao Vitto! <�',
        'Voc� deu o primeiro passo rumo ao controle financeiro',
        NULL,
        NULL,
        'welcome',
        '#F87060'
    );
    
    -- Marco 2: Primeira conta adicionada
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira conta cadastrada',
        'Sua jornada financeira come�ou! Primeira conta foi adicionada',
        NULL,
        NULL,
        'wallet',
        '#F87060'
    );
    
    -- Marco 3: Primeiro lan�amento
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro lan�amento registrado',
        'Voc� registrou sua primeira transa��o no sistema',
        NULL,
        NULL,
        'receipt',
        '#F87060'
    );
    
    -- Marco 4: Primeiro m�s organizado
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro m�s organizado',
        'Voc� registrou transa��es por um m�s completo',
        NULL,
        NULL,
        'calendar',
        '#10b981'
    );
    
    -- Marco 5: Saldo positivo por 30 dias
    PERFORM create_system_milestone(
        p_user_id,
        'Saldo positivo por 30 dias',
        'Voc� manteve o saldo positivo por 30 dias seguidos',
        NULL,
        NULL,
        'trending-up',
        '#10b981'
    );
    
    -- Marco 6: Primeira categoria criada
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira categoria personalizada',
        'Voc� organizou suas transa��es com uma categoria pr�pria',
        NULL,
        NULL,
        'tags',
        '#F87060'
    );
    
    -- Marco 7: Primeira meta financeira
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira meta financeira',
        'Voc� estabeleceu seu primeiro objetivo financeiro',
        NULL,
        NULL,
        'target',
        '#F87060'
    );
    
    -- Marco 8: Usar o chat com Vitto
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira conversa com Vitto',
        'Voc� descobriu como o Vitto pode ajudar na sua jornada',
        NULL,
        NULL,
        'message-circle',
        '#F87060'
    );
    
    -- Marco 9: Or�amento criado
    PERFORM create_system_milestone(
        p_user_id,
        'Primeiro or�amento criado',
        'Voc� planejou seus gastos com seu primeiro or�amento',
        NULL,
        NULL,
        'pie-chart',
        '#F87060'
    );
    
    -- Marco 10: Cart�o de cr�dito cadastrado
    PERFORM create_system_milestone(
        p_user_id,
        'Cart�o de cr�dito cadastrado',
        'Voc� adicionou seu primeiro cart�o de cr�dito',
        NULL,
        NULL,
        'credit-card',
        '#F87060'
    );
    
    -- Marco 11: Reserva de emerg�ncia inicial
    PERFORM create_system_milestone(
        p_user_id,
        'Reserva de emerg�ncia de R$ 1.000',
        'Voc� construiu sua primeira reserva de emerg�ncia',
        1000.00,
        0,
        'shield',
        '#10b981'
    );
    
    -- Marco 12: 3 meses de sal�rio recebido
    PERFORM create_system_milestone(
        p_user_id,
        '3 sal�rios recebidos no prazo',
        'Voc� registrou 3 sal�rios sem atraso',
        3,
        0,
        'dollar-sign',
        '#10b981'
    );
    
    -- Marco 13: 1 ano de uso do Vitto
    PERFORM create_system_milestone(
        p_user_id,
        '1 ano com o Vitto',
        'Voc� completou um ano de jornada financeira conosco',
        365,
        0,
        'calendar-check',
        '#9333ea'
    );
    
    -- Marco 14: Saldo total de R$ 10.000
    PERFORM create_system_milestone(
        p_user_id,
        'Patrim�nio de R$ 10.000',
        'Voc� atingiu R$ 10.000 em saldo total',
        10000.00,
        0,
        'trophy',
        '#f59e0b'
    );
    
    -- Marco 15: Primeira meta atingida
    PERFORM create_system_milestone(
        p_user_id,
        'Primeira meta conquistada',
        'Voc� completou sua primeira meta financeira',
        NULL,
        NULL,
        'check-circle',
        '#10b981'
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fun��o para criar badges iniciais (conquistas extras)
CREATE OR REPLACE FUNCTION create_initial_badges_examples(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Badge: Organizador
    PERFORM create_badge(
        p_user_id,
        'Organizador',
        'Voc� organizou mais de 10 categorias',
        'folder',
        '#10b981'
    );
    
    -- Badge: Economista
    PERFORM create_badge(
        p_user_id,
        'Economista',
        'Voc� economizou mais de R$ 1.000 em um m�s',
        'piggy-bank',
        '#10b981'
    );
    
    -- Badge: Disciplinado
    PERFORM create_badge(
        p_user_id,
        'Disciplinado',
        'Voc� seguiu seu or�amento por 3 meses seguidos',
        'award',
        '#9333ea'
    );
    
    -- Badge: Investidor
    PERFORM create_badge(
        p_user_id,
        'Investidor Iniciante',
        'Voc� registrou seus primeiros investimentos',
        'trending-up',
        '#f59e0b'
    );
    
    -- Badge: Planejador
    PERFORM create_badge(
        p_user_id,
        'Planejador',
        'Voc� criou 5 metas financeiras',
        'calendar-days',
        '#3b82f6'
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar marcos iniciais quando um usu�rio fizer seu primeiro perfil
CREATE OR REPLACE FUNCTION trigger_create_initial_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar marcos iniciais para o novo usu�rio
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

-- Coment�rios para documenta��o
COMMENT ON FUNCTION create_initial_milestones(UUID) IS 'Cria marcos iniciais para novos usu�rios';
COMMENT ON FUNCTION create_initial_badges_examples(UUID) IS 'Exemplos de badges que podem ser criadas (n�o executado automaticamente)';
COMMENT ON FUNCTION trigger_create_initial_milestones() IS 'Trigger para criar marcos quando perfil � criado';