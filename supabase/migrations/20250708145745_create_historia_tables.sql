-- ================================
-- MIGRAÇÃO: Módulo "Sua História"
-- Data: Janeiro 2025
-- Descrição: Tabelas para gamificação da jornada financeira
-- ================================

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