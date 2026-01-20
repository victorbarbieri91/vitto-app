-- =============================================
-- MIGRAÇÃO - CENTRAL DO PATRIMÔNIO
-- Projeto: Vitto Finanças
-- Data: 2026-01-19
-- =============================================

-- =============================================
-- TABELA PRINCIPAL: app_patrimonio_ativo
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_patrimonio_ativo (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Campos Comuns
    nome text NOT NULL,
    categoria text NOT NULL CHECK (categoria IN (
        'liquidez', 'renda_fixa', 'renda_variavel',
        'cripto', 'imoveis', 'veiculos', 'previdencia', 'outros'
    )),
    subcategoria text,
    valor_atual numeric NOT NULL DEFAULT 0 CHECK (valor_atual >= 0),
    valor_aquisicao numeric DEFAULT 0 CHECK (valor_aquisicao >= 0),
    data_aquisicao date,
    instituicao text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,

    -- Campos específicos por categoria (JSONB para flexibilidade)
    dados_especificos jsonb DEFAULT '{}'::jsonb,

    -- Referência opcional para conta bancária (categoria=liquidez)
    conta_id bigint REFERENCES public.app_conta(id) ON DELETE SET NULL,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.app_patrimonio_ativo IS 'Ativos patrimoniais do usuário - suporta múltiplas categorias com campos específicos em JSONB';
COMMENT ON COLUMN public.app_patrimonio_ativo.categoria IS 'Categoria do ativo: liquidez, renda_fixa, renda_variavel, cripto, imoveis, veiculos, previdencia, outros';
COMMENT ON COLUMN public.app_patrimonio_ativo.dados_especificos IS 'Campos específicos por categoria: ticker, quantidade, taxa_rentabilidade, etc.';
COMMENT ON COLUMN public.app_patrimonio_ativo.conta_id IS 'Referência para app_conta quando categoria=liquidez (sincronização automática)';

-- =============================================
-- TABELA DE HISTÓRICO: app_patrimonio_historico
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_patrimonio_historico (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ativo_id bigint REFERENCES public.app_patrimonio_ativo(id) ON DELETE CASCADE,

    -- Referência temporal
    mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano integer NOT NULL CHECK (ano >= 2020),

    -- Valores do snapshot
    valor_inicio_mes numeric DEFAULT 0,
    valor_fim_mes numeric DEFAULT 0,
    variacao_absoluta numeric GENERATED ALWAYS AS (valor_fim_mes - valor_inicio_mes) STORED,
    variacao_percentual numeric GENERATED ALWAYS AS (
        CASE WHEN valor_inicio_mes > 0
        THEN ROUND(((valor_fim_mes - valor_inicio_mes) / valor_inicio_mes) * 100, 2)
        ELSE 0 END
    ) STORED,

    -- Categoria para consolidados (quando ativo_id = NULL)
    categoria text,

    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Constraint para único por usuário/ativo/mês/ano
    CONSTRAINT unique_patrimonio_historico UNIQUE (user_id, ativo_id, mes, ano)
);

COMMENT ON TABLE public.app_patrimonio_historico IS 'Histórico mensal de valores para gráficos de evolução patrimonial';
COMMENT ON COLUMN public.app_patrimonio_historico.ativo_id IS 'NULL para registros consolidados por categoria';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.app_patrimonio_ativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_patrimonio_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para app_patrimonio_ativo
DROP POLICY IF EXISTS "Users can manage their own assets" ON public.app_patrimonio_ativo;
CREATE POLICY "Users can manage their own assets" ON public.app_patrimonio_ativo
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para app_patrimonio_historico
DROP POLICY IF EXISTS "Users can manage their own asset history" ON public.app_patrimonio_historico;
CREATE POLICY "Users can manage their own asset history" ON public.app_patrimonio_historico
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================
DROP TRIGGER IF EXISTS update_app_patrimonio_ativo_updated_at ON public.app_patrimonio_ativo;
CREATE TRIGGER update_app_patrimonio_ativo_updated_at
    BEFORE UPDATE ON public.app_patrimonio_ativo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para app_patrimonio_ativo
CREATE INDEX IF NOT EXISTS idx_patrimonio_ativo_user_id
ON public.app_patrimonio_ativo(user_id);

CREATE INDEX IF NOT EXISTS idx_patrimonio_ativo_user_categoria
ON public.app_patrimonio_ativo(user_id, categoria);

CREATE INDEX IF NOT EXISTS idx_patrimonio_ativo_user_ativo
ON public.app_patrimonio_ativo(user_id) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_patrimonio_ativo_conta_id
ON public.app_patrimonio_ativo(conta_id) WHERE conta_id IS NOT NULL;

-- Índice para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_patrimonio_ativo_dados_gin
ON public.app_patrimonio_ativo USING gin(dados_especificos);

-- Índices para app_patrimonio_historico
CREATE INDEX IF NOT EXISTS idx_patrimonio_historico_user_periodo
ON public.app_patrimonio_historico(user_id, ano, mes);

CREATE INDEX IF NOT EXISTS idx_patrimonio_historico_consolidado
ON public.app_patrimonio_historico(user_id, categoria, mes, ano)
WHERE ativo_id IS NULL;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Calcular patrimônio total por categoria
CREATE OR REPLACE FUNCTION calcular_patrimonio_por_categoria(p_user_id uuid)
RETURNS TABLE (
    categoria text,
    valor_total numeric,
    quantidade_ativos bigint,
    percentual numeric
) AS $$
DECLARE
    v_patrimonio_total numeric;
BEGIN
    -- Calcular patrimônio total dos ativos cadastrados
    SELECT COALESCE(SUM(valor_atual), 0) INTO v_patrimonio_total
    FROM public.app_patrimonio_ativo
    WHERE user_id = p_user_id AND ativo = true AND conta_id IS NULL;

    -- Adicionar saldo das contas bancárias como categoria 'liquidez'
    SELECT v_patrimonio_total + COALESCE(SUM(saldo_atual), 0) INTO v_patrimonio_total
    FROM public.app_conta
    WHERE user_id = p_user_id AND status = 'ativa';

    -- Retornar dados por categoria
    RETURN QUERY
    WITH ativos_categorias AS (
        -- Ativos do patrimônio (exceto liquidez vinculada a contas)
        SELECT
            pa.categoria as cat,
            pa.valor_atual as valor
        FROM public.app_patrimonio_ativo pa
        WHERE pa.user_id = p_user_id
          AND pa.ativo = true
          AND pa.conta_id IS NULL

        UNION ALL

        -- Contas bancárias como liquidez
        SELECT
            'liquidez'::text as cat,
            c.saldo_atual as valor
        FROM public.app_conta c
        WHERE c.user_id = p_user_id AND c.status = 'ativa'
    )
    SELECT
        ac.cat as categoria,
        COALESCE(SUM(ac.valor), 0) as valor_total,
        COUNT(*)::bigint as quantidade_ativos,
        CASE WHEN v_patrimonio_total > 0
            THEN ROUND((COALESCE(SUM(ac.valor), 0) / v_patrimonio_total) * 100, 2)
            ELSE 0
        END as percentual
    FROM ativos_categorias ac
    GROUP BY ac.cat
    ORDER BY valor_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_patrimonio_por_categoria IS 'Retorna patrimônio agrupado por categoria, incluindo contas bancárias como liquidez';

-- Function: Obter evolução patrimonial (histórico de meses)
CREATE OR REPLACE FUNCTION obter_evolucao_patrimonial(
    p_user_id uuid,
    p_meses integer DEFAULT 12
)
RETURNS TABLE (
    mes integer,
    ano integer,
    patrimonio_total numeric,
    variacao_mensal numeric,
    variacao_percentual numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH meses_referencia AS (
        SELECT
            EXTRACT(MONTH FROM d)::integer as m,
            EXTRACT(YEAR FROM d)::integer as a
        FROM generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * (p_meses - 1)),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'
        ) d
    ),
    historico_consolidado AS (
        SELECT
            ph.mes as m,
            ph.ano as a,
            COALESCE(SUM(ph.valor_fim_mes), 0) as total
        FROM public.app_patrimonio_historico ph
        WHERE ph.user_id = p_user_id
        GROUP BY ph.mes, ph.ano
    )
    SELECT
        mr.m as mes,
        mr.a as ano,
        COALESCE(hc.total, 0) as patrimonio_total,
        COALESCE(hc.total - LAG(hc.total) OVER (ORDER BY mr.a, mr.m), 0) as variacao_mensal,
        CASE
            WHEN LAG(hc.total) OVER (ORDER BY mr.a, mr.m) > 0
            THEN ROUND(((hc.total - LAG(hc.total) OVER (ORDER BY mr.a, mr.m)) / LAG(hc.total) OVER (ORDER BY mr.a, mr.m)) * 100, 2)
            ELSE 0
        END as variacao_percentual
    FROM meses_referencia mr
    LEFT JOIN historico_consolidado hc ON mr.m = hc.m AND mr.a = hc.a
    ORDER BY mr.a, mr.m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obter_evolucao_patrimonial IS 'Retorna evolução do patrimônio total nos últimos N meses para gráficos';

-- Function: Criar snapshot mensal do patrimônio
CREATE OR REPLACE FUNCTION snapshot_patrimonio_mensal(p_user_id uuid DEFAULT NULL)
RETURNS integer AS $$
DECLARE
    v_mes integer := EXTRACT(MONTH FROM CURRENT_DATE);
    v_ano integer := EXTRACT(YEAR FROM CURRENT_DATE);
    v_count integer := 0;
    v_user record;
BEGIN
    -- Se user_id especificado, processar apenas esse usuário
    -- Senão, processar todos os usuários com ativos
    FOR v_user IN
        SELECT DISTINCT user_id
        FROM public.app_patrimonio_ativo
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND ativo = true
    LOOP
        -- Inserir ou atualizar snapshot para cada ativo
        INSERT INTO public.app_patrimonio_historico (
            user_id, ativo_id, mes, ano, valor_fim_mes, categoria
        )
        SELECT
            pa.user_id,
            pa.id,
            v_mes,
            v_ano,
            pa.valor_atual,
            pa.categoria
        FROM public.app_patrimonio_ativo pa
        WHERE pa.user_id = v_user.user_id AND pa.ativo = true
        ON CONFLICT (user_id, ativo_id, mes, ano)
        DO UPDATE SET
            valor_fim_mes = EXCLUDED.valor_fim_mes,
            categoria = EXCLUDED.categoria;

        -- Também criar snapshot das contas bancárias como liquidez
        INSERT INTO public.app_patrimonio_historico (
            user_id, ativo_id, mes, ano, valor_fim_mes, categoria
        )
        SELECT
            c.user_id,
            NULL, -- ativo_id NULL para contas (consolidado)
            v_mes,
            v_ano,
            SUM(c.saldo_atual),
            'liquidez_contas'
        FROM public.app_conta c
        WHERE c.user_id = v_user.user_id AND c.status = 'ativa'
        GROUP BY c.user_id
        ON CONFLICT (user_id, ativo_id, mes, ano)
        DO UPDATE SET valor_fim_mes = EXCLUDED.valor_fim_mes;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION snapshot_patrimonio_mensal IS 'Cria snapshot mensal de todos os ativos para histórico de evolução';

-- Function: Obter patrimônio consolidado (resumo completo)
CREATE OR REPLACE FUNCTION obter_patrimonio_consolidado(p_user_id uuid)
RETURNS TABLE (
    patrimonio_total numeric,
    patrimonio_liquido numeric,
    total_dividas numeric,
    variacao_mes_valor numeric,
    variacao_mes_percentual numeric,
    quantidade_ativos bigint
) AS $$
DECLARE
    v_patrimonio_total numeric;
    v_total_dividas numeric;
    v_patrimonio_liquido numeric;
    v_mes_atual integer := EXTRACT(MONTH FROM CURRENT_DATE);
    v_ano_atual integer := EXTRACT(YEAR FROM CURRENT_DATE);
    v_patrimonio_mes_anterior numeric;
    v_variacao_valor numeric;
    v_variacao_percentual numeric;
    v_quantidade bigint;
BEGIN
    -- Calcular patrimônio total (ativos + contas)
    SELECT
        COALESCE(SUM(valor_atual), 0)
    INTO v_patrimonio_total
    FROM public.app_patrimonio_ativo
    WHERE user_id = p_user_id AND ativo = true AND conta_id IS NULL;

    -- Adicionar saldo das contas
    SELECT
        v_patrimonio_total + COALESCE(SUM(saldo_atual), 0)
    INTO v_patrimonio_total
    FROM public.app_conta
    WHERE user_id = p_user_id AND status = 'ativa';

    -- Calcular total de dívidas (saldo_devedor dos ativos financiados)
    SELECT
        COALESCE(SUM((dados_especificos->>'saldo_devedor')::numeric), 0)
    INTO v_total_dividas
    FROM public.app_patrimonio_ativo
    WHERE user_id = p_user_id
      AND ativo = true
      AND dados_especificos->>'saldo_devedor' IS NOT NULL;

    -- Patrimônio líquido
    v_patrimonio_liquido := v_patrimonio_total - v_total_dividas;

    -- Buscar patrimônio do mês anterior para calcular variação
    SELECT
        COALESCE(SUM(valor_fim_mes), 0)
    INTO v_patrimonio_mes_anterior
    FROM public.app_patrimonio_historico
    WHERE user_id = p_user_id
      AND ((ano = v_ano_atual AND mes = v_mes_atual - 1) OR
           (v_mes_atual = 1 AND ano = v_ano_atual - 1 AND mes = 12));

    -- Calcular variação
    v_variacao_valor := v_patrimonio_total - v_patrimonio_mes_anterior;
    v_variacao_percentual := CASE
        WHEN v_patrimonio_mes_anterior > 0
        THEN ROUND((v_variacao_valor / v_patrimonio_mes_anterior) * 100, 2)
        ELSE 0
    END;

    -- Contar quantidade de ativos
    SELECT
        COUNT(*) + (SELECT COUNT(*) FROM public.app_conta WHERE user_id = p_user_id AND status = 'ativa')
    INTO v_quantidade
    FROM public.app_patrimonio_ativo
    WHERE user_id = p_user_id AND ativo = true AND conta_id IS NULL;

    RETURN QUERY SELECT
        v_patrimonio_total,
        v_patrimonio_liquido,
        v_total_dividas,
        v_variacao_valor,
        v_variacao_percentual,
        v_quantidade;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obter_patrimonio_consolidado IS 'Retorna resumo consolidado do patrimônio com totais, dívidas e variações';

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
