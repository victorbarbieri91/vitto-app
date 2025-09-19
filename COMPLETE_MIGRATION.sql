-- =====================================
-- MIGRAÇÃO COMPLETA - SISTEMA BARSI WEB
-- Data: Janeiro 2025
-- Projeto: omgrgbyexbxtqoyewwra
-- =====================================

-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/omgrgbyexbxtqoyewwra/sql

-- =====================================
-- 1. RENOMEAR TABELA DASHBOARD (se existir)
-- =====================================
-- Migration para renomear dashboard_summary para app_resumo_dashboard
-- Mantendo compatibilidade e seguindo padrão app_* em português

-- Renomear tabela para seguir padrão
ALTER TABLE IF EXISTS dashboard_summary 
RENAME TO app_resumo_dashboard;

-- Comentário da tabela
COMMENT ON TABLE app_resumo_dashboard IS 'Resumo do dashboard com métricas financeiras dos usuários';

-- =====================================
-- 2. FUNÇÃO DE TRANSFERÊNCIA (se necessário)
-- =====================================
-- Criar função para transferências entre contas se não existir
CREATE OR REPLACE FUNCTION transfer_between_accounts(
    p_from_account_id BIGINT,
    p_to_account_id BIGINT,
    p_amount DECIMAL(15,2),
    p_description TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Criar lançamento de débito na conta origem
    INSERT INTO app_lancamento (
        descricao, valor, tipo, conta_id, user_id, data
    ) VALUES (
        p_description || ' (Transferência enviada)', 
        p_amount, 
        'despesa', 
        p_from_account_id, 
        p_user_id, 
        NOW()
    );
    
    -- Criar lançamento de crédito na conta destino
    INSERT INTO app_lancamento (
        descricao, valor, tipo, conta_id, user_id, data
    ) VALUES (
        p_description || ' (Transferência recebida)', 
        p_amount, 
        'receita', 
        p_to_account_id, 
        p_user_id, 
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 3. TABELA DE INDICADORES (CHAVE)
-- =====================================
-- TABELA CHAVE: app_indicadores - Métricas Automáticas
-- Coração do sistema de análise preditiva e saldo previsto

CREATE TABLE IF NOT EXISTS app_indicadores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conta_id BIGINT REFERENCES app_conta(id),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER CHECK (ano >= 2020),
  
  -- Saldos fundamentais
  saldo_inicial NUMERIC(15,2) DEFAULT 0,
  saldo_atual NUMERIC(15,2) DEFAULT 0,
  saldo_previsto NUMERIC(15,2) DEFAULT 0, -- ⭐ FEATURE PRINCIPAL
  
  -- Movimentações confirmadas
  receitas_confirmadas NUMERIC(15,2) DEFAULT 0,
  despesas_confirmadas NUMERIC(15,2) DEFAULT 0,
  
  -- Movimentações futuras
  receitas_pendentes NUMERIC(15,2) DEFAULT 0,
  despesas_pendentes NUMERIC(15,2) DEFAULT 0,
  receitas_recorrentes NUMERIC(15,2) DEFAULT 0,
  despesas_recorrentes NUMERIC(15,2) DEFAULT 0,
  
  -- Cartões
  fatura_atual NUMERIC(15,2) DEFAULT 0,
  fatura_proxima NUMERIC(15,2) DEFAULT 0,
  
  -- Calculados automaticamente (Generated Columns)
  fluxo_liquido NUMERIC(15,2) GENERATED ALWAYS AS 
    (receitas_confirmadas - despesas_confirmadas) STORED,
  projecao_fim_mes NUMERIC(15,2) GENERATED ALWAYS AS 
    (saldo_atual + receitas_pendentes + receitas_recorrentes - despesas_pendentes - despesas_recorrentes - fatura_atual) STORED,
  score_saude_financeira INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN saldo_previsto > saldo_atual * 1.1 THEN 100
      WHEN saldo_previsto > saldo_atual THEN 85
      WHEN saldo_previsto > saldo_atual * 0.9 THEN 70
      ELSE 30
    END
  ) STORED,
  
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, conta_id, mes, ano)
);

-- Habilitar RLS
ALTER TABLE app_indicadores ENABLE ROW LEVEL SECURITY;

-- Policy RLS: Usuários só veem próprios indicadores
CREATE POLICY "Usuários veem apenas próprios indicadores" ON app_indicadores
  FOR ALL USING (user_id = auth.uid());

-- Índice estratégico para queries frequentes do dashboard
CREATE INDEX IF NOT EXISTS idx_indicadores_user_periodo ON app_indicadores(user_id, ano DESC, mes DESC);

-- Comentário da tabela
COMMENT ON TABLE app_indicadores IS 'Tabela chave - Métricas financeiras calculadas automaticamente. Base para saldo previsto e análises da IA.';

-- =====================================
-- 4. TABELA DE LANÇAMENTOS RECORRENTES
-- =====================================
-- Tabela para templates de lançamentos recorrentes
CREATE TABLE IF NOT EXISTS app_lancamento_recorrente (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Dados básicos do lançamento
    descricao TEXT NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria_id BIGINT REFERENCES app_categoria(id),
    conta_id BIGINT REFERENCES app_conta(id),
    cartao_id BIGINT REFERENCES app_cartao(id),
    
    -- Controle de recorrência
    tipo_recorrencia TEXT NOT NULL CHECK (tipo_recorrencia IN ('fixo', 'parcelado')),
    intervalo TEXT CHECK (intervalo IN ('diario', 'semanal', 'quinzenal', 'mensal', 'anual')),
    
    -- Para parcelados
    parcela_atual INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    
    -- Controle de execução
    proxima_execucao DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validações
    CHECK (
        (tipo_recorrencia = 'fixo' AND intervalo IS NOT NULL) OR
        (tipo_recorrencia = 'parcelado' AND total_parcelas > 0)
    )
);

-- Habilitar RLS
ALTER TABLE app_lancamento_recorrente ENABLE ROW LEVEL SECURITY;

-- Policy RLS: Usuários só veem próprios lançamentos recorrentes
CREATE POLICY "Usuários veem apenas próprios lançamentos recorrentes" ON app_lancamento_recorrente
  FOR ALL USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lancamento_recorrente_user_id ON app_lancamento_recorrente(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_recorrente_proxima_execucao ON app_lancamento_recorrente(proxima_execucao);
CREATE INDEX IF NOT EXISTS idx_lancamento_recorrente_ativo ON app_lancamento_recorrente(ativo);

COMMENT ON TABLE app_lancamento_recorrente IS 'Templates para lançamentos recorrentes - base para automação financeira';

-- =====================================
-- 5. FUNÇÕES E TRIGGERS PRINCIPAIS
-- =====================================
-- FUNÇÕES E TRIGGERS - Core do Sistema Automático
-- Funções que calculam indicadores e saldo previsto automaticamente

-- =======================
-- 5.1. FUNÇÃO PRINCIPAL: Atualizar Indicadores
-- =======================
CREATE OR REPLACE FUNCTION refresh_indicadores_conta(
  p_conta_id BIGINT,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_saldo_atual NUMERIC;
  v_receitas_conf NUMERIC;
  v_despesas_conf NUMERIC;
  v_receitas_pend NUMERIC;
  v_despesas_pend NUMERIC;
  v_receitas_recorr NUMERIC;
  v_despesas_recorr NUMERIC;
  v_saldo_previsto NUMERIC;
  v_mes INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- 1. Buscar saldo atual da conta
  SELECT saldo_atual INTO v_saldo_atual
  FROM app_conta WHERE id = p_conta_id;
  
  -- 2. Receitas confirmadas este mês
  SELECT COALESCE(SUM(valor), 0) INTO v_receitas_conf
  FROM app_lancamento 
  WHERE conta_id = p_conta_id 
    AND tipo = 'receita'
    AND EXTRACT(MONTH FROM data) = v_mes
    AND EXTRACT(YEAR FROM data) = v_ano;
  
  -- 3. Despesas confirmadas este mês
  SELECT COALESCE(SUM(valor), 0) INTO v_despesas_conf
  FROM app_lancamento 
  WHERE conta_id = p_conta_id 
    AND tipo = 'despesa'
    AND EXTRACT(MONTH FROM data) = v_mes
    AND EXTRACT(YEAR FROM data) = v_ano;
  
  -- 4. Receitas pendentes (futuras este mês)
  SELECT COALESCE(SUM(valor), 0) INTO v_receitas_pend
  FROM app_lancamento 
  WHERE conta_id = p_conta_id 
    AND tipo = 'receita'
    AND data > CURRENT_DATE
    AND EXTRACT(MONTH FROM data) = v_mes
    AND EXTRACT(YEAR FROM data) = v_ano;
  
  -- 5. Despesas pendentes (futuras este mês)
  SELECT COALESCE(SUM(valor), 0) INTO v_despesas_pend
  FROM app_lancamento 
  WHERE conta_id = p_conta_id 
    AND tipo = 'despesa'
    AND data > CURRENT_DATE
    AND EXTRACT(MONTH FROM data) = v_mes
    AND EXTRACT(YEAR FROM data) = v_ano;
  
  -- 6. Receitas recorrentes (projeção baseada em templates)
  SELECT COALESCE(SUM(valor), 0) INTO v_receitas_recorr
  FROM app_lancamento_recorrente 
  WHERE conta_id = p_conta_id 
    AND tipo = 'receita'
    AND ativo = true
    AND proxima_execucao <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day');
  
  -- 7. Despesas recorrentes (projeção baseada em templates)
  SELECT COALESCE(SUM(valor), 0) INTO v_despesas_recorr
  FROM app_lancamento_recorrente 
  WHERE conta_id = p_conta_id 
    AND tipo = 'despesa'
    AND ativo = true
    AND proxima_execucao <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day');
  
  -- 8. Calcular saldo previsto
  v_saldo_previsto := v_saldo_atual + v_receitas_pend + v_receitas_recorr - v_despesas_pend - v_despesas_recorr;
  
  -- 9. Inserir/atualizar indicadores
  INSERT INTO app_indicadores (
    user_id, conta_id, 
    mes, ano,
    saldo_atual, saldo_previsto,
    receitas_confirmadas, despesas_confirmadas,
    receitas_pendentes, despesas_pendentes,
    receitas_recorrentes, despesas_recorrentes
  ) VALUES (
    p_user_id, p_conta_id,
    v_mes, v_ano,
    v_saldo_atual, v_saldo_previsto,
    v_receitas_conf, v_despesas_conf,
    v_receitas_pend, v_despesas_pend,
    v_receitas_recorr, v_despesas_recorr
  ) ON CONFLICT (user_id, conta_id, mes, ano) 
  DO UPDATE SET
    saldo_atual = v_saldo_atual,
    saldo_previsto = v_saldo_previsto,
    receitas_confirmadas = v_receitas_conf,
    despesas_confirmadas = v_despesas_conf,
    receitas_pendentes = v_receitas_pend,
    despesas_pendentes = v_despesas_pend,
    receitas_recorrentes = v_receitas_recorr,
    despesas_recorrentes = v_despesas_recorr,
    ultima_atualizacao = NOW();
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 5.2. TRIGGER AUTOMÁTICO
-- =======================
CREATE OR REPLACE FUNCTION trigger_atualizar_indicadores()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar indicadores da conta afetada
  IF TG_OP = 'DELETE' THEN
    IF OLD.conta_id IS NOT NULL THEN
      PERFORM refresh_indicadores_conta(OLD.conta_id, OLD.user_id);
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.conta_id IS NOT NULL THEN
      PERFORM refresh_indicadores_conta(NEW.conta_id, NEW.user_id);
    END IF;
    
    -- Se conta mudou, atualizar a antiga também
    IF TG_OP = 'UPDATE' AND OLD.conta_id IS NOT NULL AND OLD.conta_id != NEW.conta_id THEN
      PERFORM refresh_indicadores_conta(OLD.conta_id, OLD.user_id);
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em app_lancamento (se a tabela existir)
DROP TRIGGER IF EXISTS trigger_indicadores_lancamento ON app_lancamento;
CREATE TRIGGER trigger_indicadores_lancamento
  AFTER INSERT OR UPDATE OR DELETE ON app_lancamento
  FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_indicadores();

-- =======================
-- 5.3. FUNÇÃO PARA LANÇAMENTOS RECORRENTES
-- =======================
CREATE OR REPLACE FUNCTION processar_lancamentos_recorrentes()
RETURNS INTEGER AS $$
DECLARE
  recorrente RECORD;
  lancamentos_criados INTEGER := 0;
  nova_data DATE;
BEGIN
  -- Buscar lançamentos que devem ser executados hoje
  FOR recorrente IN 
    SELECT * FROM app_lancamento_recorrente 
    WHERE ativo = true 
      AND proxima_execucao <= CURRENT_DATE
  LOOP
    -- Criar novo lançamento
    INSERT INTO app_lancamento (
      descricao, valor, tipo, categoria_id, conta_id, cartao_id,
      parcela_atual, total_parcelas, user_id, data
    ) VALUES (
      recorrente.descricao, recorrente.valor, recorrente.tipo,
      recorrente.categoria_id, recorrente.conta_id, recorrente.cartao_id,
      CASE WHEN recorrente.tipo_recorrencia = 'parcelado' THEN recorrente.parcela_atual END,
      CASE WHEN recorrente.tipo_recorrencia = 'parcelado' THEN recorrente.total_parcelas END,
      recorrente.user_id, recorrente.proxima_execucao
    );
    
    -- Atualizar controle do template
    IF recorrente.tipo_recorrencia = 'parcelado' THEN
      -- Incrementar parcela ou finalizar
      IF recorrente.parcela_atual >= recorrente.total_parcelas THEN
        -- Finalizar parcelamento
        UPDATE app_lancamento_recorrente 
        SET ativo = false
        WHERE id = recorrente.id;
      ELSE
        -- Próxima parcela
        UPDATE app_lancamento_recorrente 
        SET parcela_atual = parcela_atual + 1,
            proxima_execucao = CURRENT_DATE + INTERVAL '1 month'
        WHERE id = recorrente.id;
      END IF;
    ELSE
      -- Calcular próxima execução para fixos
      CASE recorrente.intervalo
        WHEN 'mensal' THEN nova_data := CURRENT_DATE + INTERVAL '1 month';
        WHEN 'quinzenal' THEN nova_data := CURRENT_DATE + INTERVAL '15 days';
        WHEN 'semanal' THEN nova_data := CURRENT_DATE + INTERVAL '1 week';
        WHEN 'anual' THEN nova_data := CURRENT_DATE + INTERVAL '1 year';
        ELSE nova_data := CURRENT_DATE + INTERVAL '1 month';
      END CASE;
      
      UPDATE app_lancamento_recorrente 
      SET proxima_execucao = nova_data
      WHERE id = recorrente.id;
    END IF;
    
    lancamentos_criados := lancamentos_criados + 1;
  END LOOP;
  
  RETURN lancamentos_criados;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 5.4. TRIGGER PARA ATUALIZAR SALDO DAS CONTAS
-- =======================
CREATE OR REPLACE FUNCTION trigger_atualizar_saldo_conta()
RETURNS TRIGGER AS $$
DECLARE
  novo_saldo NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Recalcular saldo da conta do lançamento deletado
    IF OLD.conta_id IS NOT NULL THEN
      SELECT 
        COALESCE(ac.saldo_inicial, 0) + 
        COALESCE(SUM(CASE WHEN al.tipo = 'receita' THEN al.valor ELSE -al.valor END), 0)
      INTO novo_saldo
      FROM app_conta ac
      LEFT JOIN app_lancamento al ON al.conta_id = ac.id
      WHERE ac.id = OLD.conta_id
      GROUP BY ac.id, ac.saldo_inicial;
      
      UPDATE app_conta 
      SET saldo_atual = novo_saldo, updated_at = NOW()
      WHERE id = OLD.conta_id;
    END IF;
    RETURN OLD;
  ELSE
    -- Recalcular saldo da conta do novo/atualizado lançamento
    IF NEW.conta_id IS NOT NULL THEN
      SELECT 
        COALESCE(ac.saldo_inicial, 0) + 
        COALESCE(SUM(CASE WHEN al.tipo = 'receita' THEN al.valor ELSE -al.valor END), 0)
      INTO novo_saldo
      FROM app_conta ac
      LEFT JOIN app_lancamento al ON al.conta_id = ac.id
      WHERE ac.id = NEW.conta_id
      GROUP BY ac.id, ac.saldo_inicial;
      
      UPDATE app_conta 
      SET saldo_atual = novo_saldo, updated_at = NOW()
      WHERE id = NEW.conta_id;
    END IF;
    
    -- Se conta mudou, atualizar saldo da conta antiga também
    IF TG_OP = 'UPDATE' AND OLD.conta_id IS NOT NULL AND OLD.conta_id != NEW.conta_id THEN
      SELECT 
        COALESCE(ac.saldo_inicial, 0) + 
        COALESCE(SUM(CASE WHEN al.tipo = 'receita' THEN al.valor ELSE -al.valor END), 0)
      INTO novo_saldo
      FROM app_conta ac
      LEFT JOIN app_lancamento al ON al.conta_id = ac.id
      WHERE ac.id = OLD.conta_id
      GROUP BY ac.id, ac.saldo_inicial;
      
      UPDATE app_conta 
      SET saldo_atual = novo_saldo, updated_at = NOW()
      WHERE id = OLD.conta_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualizar saldo das contas
DROP TRIGGER IF EXISTS trigger_saldo_conta ON app_lancamento;
CREATE TRIGGER trigger_saldo_conta
  AFTER INSERT OR UPDATE OR DELETE ON app_lancamento
  FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_saldo_conta();

-- =====================================
-- 6. SISTEMA DE GAMIFICAÇÃO
-- =====================================
-- Tabela principal para marcos da jornada
CREATE TABLE IF NOT EXISTS app_marco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados do marco
    categoria TEXT NOT NULL CHECK (categoria IN ('sistema', 'objetivo')),
    titulo TEXT NOT NULL,
    descricao TEXT,
    
    -- Valores para objetivos quantitativos
    valor_alvo DECIMAL(15,2) DEFAULT NULL,
    valor_atual DECIMAL(15,2) DEFAULT 0,
    
    -- Status e metadados
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
    icon_slug TEXT DEFAULT NULL, -- Para escolher ícone no frontend
    cor TEXT DEFAULT '#F87060', -- Cor coral padrão
    
    -- Datas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Índices para performance
    CONSTRAINT unique_user_marco UNIQUE(user_id, titulo)
);

-- Tabela para badges/conquistas extras
CREATE TABLE IF NOT EXISTS app_badge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados da badge
    nome TEXT NOT NULL,
    descricao TEXT,
    icon_slug TEXT DEFAULT NULL,
    cor TEXT DEFAULT '#10b981', -- Verde success padrão
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT unique_user_badge UNIQUE(user_id, nome)
);

-- View unificada para timeline (marcos + badges em ordem cronológica)
CREATE OR REPLACE VIEW app_evento_timeline AS
SELECT 
    'marco' as tipo,
    id,
    user_id,
    titulo as nome,
    descricao,
    status,
    icon_slug,
    cor,
    valor_alvo,
    valor_atual,
    created_at,
    COALESCE(achieved_at, created_at) as data_evento,
    (CASE 
        WHEN status = 'concluido' THEN true 
        ELSE false 
    END) as concluido
FROM app_marco

UNION ALL

SELECT 
    'badge' as tipo,
    id,
    user_id,
    nome,
    descricao,
    'concluido' as status,
    icon_slug,
    cor,
    NULL as valor_alvo,
    NULL as valor_atual,
    created_at,
    unlocked_at as data_evento,
    true as concluido
FROM app_badge

ORDER BY data_evento DESC;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_app_marco_user_id ON app_marco(user_id);
CREATE INDEX IF NOT EXISTS idx_app_marco_status ON app_marco(status);
CREATE INDEX IF NOT EXISTS idx_app_marco_categoria ON app_marco(categoria);
CREATE INDEX IF NOT EXISTS idx_app_marco_achieved_at ON app_marco(achieved_at);

CREATE INDEX IF NOT EXISTS idx_app_badge_user_id ON app_badge(user_id);
CREATE INDEX IF NOT EXISTS idx_app_badge_unlocked_at ON app_badge(unlocked_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_app_marco_updated_at ON app_marco;
CREATE TRIGGER update_app_marco_updated_at 
    BEFORE UPDATE ON app_marco 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE app_marco ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_badge ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: usuários só podem ver/editar seus próprios marcos e badges
DROP POLICY IF EXISTS "Users can view their own marcos" ON app_marco;
CREATE POLICY "Users can view their own marcos" ON app_marco
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own marcos" ON app_marco;
CREATE POLICY "Users can insert their own marcos" ON app_marco
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own marcos" ON app_marco;
CREATE POLICY "Users can update their own marcos" ON app_marco
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own marcos" ON app_marco;
CREATE POLICY "Users can delete their own marcos" ON app_marco
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own badges" ON app_badge;
CREATE POLICY "Users can view their own badges" ON app_badge
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON app_badge;
CREATE POLICY "Users can insert their own badges" ON app_badge
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges não devem ser editáveis pelo usuário (só o sistema cria)
DROP POLICY IF EXISTS "Users cannot update badges" ON app_badge;
CREATE POLICY "Users cannot update badges" ON app_badge
    FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Users cannot delete badges" ON app_badge;
CREATE POLICY "Users cannot delete badges" ON app_badge
    FOR DELETE USING (false);

-- =====================================
-- 7. FUNÇÕES DE GAMIFICAÇÃO
-- =====================================

-- Função para criar marcos automáticos do sistema
CREATE OR REPLACE FUNCTION create_system_milestone(
    p_user_id UUID,
    p_titulo TEXT,
    p_descricao TEXT DEFAULT NULL,
    p_valor_alvo DECIMAL DEFAULT NULL,
    p_valor_atual DECIMAL DEFAULT 0,
    p_icon_slug TEXT DEFAULT NULL,
    p_cor TEXT DEFAULT '#F87060'
)
RETURNS UUID AS $$
DECLARE
    milestone_id UUID;
BEGIN
    INSERT INTO app_marco (
        user_id, categoria, titulo, descricao, 
        valor_alvo, valor_atual, icon_slug, cor
    ) VALUES (
        p_user_id, 'sistema', p_titulo, p_descricao, 
        p_valor_alvo, p_valor_atual, p_icon_slug, p_cor
    )
    ON CONFLICT (user_id, titulo) DO NOTHING
    RETURNING id INTO milestone_id;
    
    RETURN milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para completar marco
CREATE OR REPLACE FUNCTION complete_milestone(
    p_milestone_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE app_marco 
    SET 
        status = 'concluido',
        achieved_at = NOW()
    WHERE 
        id = p_milestone_id 
        AND user_id = p_user_id
        AND status = 'pendente';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar badge
CREATE OR REPLACE FUNCTION create_badge(
    p_user_id UUID,
    p_nome TEXT,
    p_descricao TEXT DEFAULT NULL,
    p_icon_slug TEXT DEFAULT NULL,
    p_cor TEXT DEFAULT '#10b981'
)
RETURNS UUID AS $$
DECLARE
    badge_id UUID;
BEGIN
    INSERT INTO app_badge (
        user_id, nome, descricao, icon_slug, cor
    ) VALUES (
        p_user_id, p_nome, p_descricao, p_icon_slug, p_cor
    )
    ON CONFLICT (user_id, nome) DO NOTHING
    RETURNING id INTO badge_id;
    
    RETURN badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 8. MARCOS INICIAIS PARA NOVOS USUÁRIOS
-- =====================================

-- Função para criar marcos iniciais para um usuário
CREATE OR REPLACE FUNCTION create_initial_milestones(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Marco 1: Bem-vindo ao Vitto
    PERFORM create_system_milestone(
        p_user_id,
        'Bem-vindo ao Vitto! 🎉',
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

-- Trigger para criar marcos iniciais quando um usuário fizer seu primeiro perfil
CREATE OR REPLACE FUNCTION trigger_create_initial_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar marcos iniciais para o novo usuário
    PERFORM create_initial_milestones(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela app_perfil (se existir)
DROP TRIGGER IF EXISTS after_profile_created ON app_perfil;
CREATE TRIGGER after_profile_created
    AFTER INSERT ON app_perfil
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_initial_milestones();

-- =====================================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================

-- Comentários para documentação
COMMENT ON TABLE app_marco IS 'Marcos da jornada financeira do usuário (sistema + objetivos)';
COMMENT ON TABLE app_badge IS 'Badges e conquistas extras do usuário';
COMMENT ON VIEW app_evento_timeline IS 'View unificada de marcos e badges em ordem cronológica';

COMMENT ON COLUMN app_marco.categoria IS 'Tipo: sistema (automático) ou objetivo (criado pelo usuário)';
COMMENT ON COLUMN app_marco.valor_alvo IS 'Meta quantitativa (opcional, para objetivos com valor)';
COMMENT ON COLUMN app_marco.valor_atual IS 'Progresso atual do objetivo';
COMMENT ON COLUMN app_marco.icon_slug IS 'Identificador do ícone para o frontend';

COMMENT ON COLUMN app_badge.nome IS 'Nome único da badge por usuário';
COMMENT ON COLUMN app_badge.icon_slug IS 'Identificador do ícone para o frontend';

COMMENT ON FUNCTION create_initial_milestones(UUID) IS 'Cria marcos iniciais para novos usuários';
COMMENT ON FUNCTION trigger_create_initial_milestones() IS 'Trigger para criar marcos quando perfil é criado';

-- =====================================
-- 10. FINALIZAÇÃO
-- =====================================

-- Mensagem de sucesso
SELECT 'Migração completa! Sistema Barsi Web configurado com sucesso.' AS status;

-- Verificar tabelas criadas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'app_%'
ORDER BY tablename;