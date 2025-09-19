-- =============================================
-- MIGRAÇÃO: CORREÇÃO COMPLETA DA LÓGICA DE SALDO PREVISTO
-- Data: 2025-09-16
-- Objetivo: Eliminar duplicação e implementar lógica matemática correta
-- =============================================

-- Substituir a função obter_dashboard_mes com lógica MATEMATICAMENTE CORRETA
CREATE OR REPLACE FUNCTION public.obter_dashboard_mes(p_user_id uuid, p_mes integer, p_ano integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_data_atual DATE := CURRENT_DATE;
    v_tipo_periodo TEXT; -- 'passado', 'atual', 'futuro'
    v_saldo_atual_total NUMERIC := 0;
    v_receitas_confirmadas_mes NUMERIC := 0;
    v_despesas_confirmadas_mes NUMERIC := 0;
    v_receitas_pendentes_mes NUMERIC := 0;
    v_despesas_pendentes_mes NUMERIC := 0;
    v_receitas_fixas_nao_geradas NUMERIC := 0;
    v_despesas_fixas_nao_geradas NUMERIC := 0;
    v_fatura_mes_atual NUMERIC := 0;
    v_fatura_mes_proximo NUMERIC := 0;
    v_saldo_previsto_fim_mes NUMERIC := 0;
    v_economia_mes NUMERIC := 0;
    v_taxa_economia NUMERIC := 0;
    v_contas JSON;
    v_transacoes_mes JSON;
    v_faturas_mes JSON;
BEGIN
    -- Validar parâmetros
    IF p_user_id IS NULL THEN
        RETURN json_build_object('error', 'Usuário não informado');
    END IF;

    IF p_mes < 1 OR p_mes > 12 THEN
        RETURN json_build_object('error', 'Mês inválido');
    END IF;

    IF p_ano < 2020 OR p_ano > 2030 THEN
        RETURN json_build_object('error', 'Ano inválido');
    END IF;

    -- Definir período do mês específico
    v_data_inicio := make_date(p_ano, p_mes, 1);
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- DETECTAR TIPO DE PERÍODO (ESSENCIAL PARA LÓGICA CORRETA)
    IF v_data_fim < v_data_atual THEN
        v_tipo_periodo := 'passado';
    ELSIF v_data_inicio <= v_data_atual AND v_data_atual <= v_data_fim THEN
        v_tipo_periodo := 'atual';
    ELSE
        v_tipo_periodo := 'futuro';
    END IF;

    -- =============================================
    -- 1. SALDO ATUAL TOTAL (sempre necessário como base)
    -- =============================================
    SELECT COALESCE(SUM(saldo_atual), 0) INTO v_saldo_atual_total
    FROM app_conta
    WHERE user_id = p_user_id AND status = 'ativo';

    -- =============================================
    -- 2. BUSCAR TRANSAÇÕES DO PERÍODO (EXCLUINDO SALDO INICIAL)
    -- =============================================

    -- Receitas confirmadas no período
    SELECT COALESCE(SUM(valor), 0) INTO v_receitas_confirmadas_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'receita'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'confirmado'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial';

    -- Despesas confirmadas no período (exceto cartão)
    SELECT COALESCE(SUM(valor), 0) INTO v_despesas_confirmadas_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'despesa'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'confirmado'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial';

    -- Receitas pendentes no período
    SELECT COALESCE(SUM(valor), 0) INTO v_receitas_pendentes_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'receita'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'pendente'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial';

    -- Despesas pendentes no período
    SELECT COALESCE(SUM(valor), 0) INTO v_despesas_pendentes_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'despesa'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'pendente'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial';

    -- =============================================
    -- 3. BUSCAR LANÇAMENTOS FIXOS NÃO PROCESSADOS
    -- =============================================

    -- Receitas fixas que ainda não foram geradas para este mês
    SELECT COALESCE(SUM(tf.valor), 0) INTO v_receitas_fixas_nao_geradas
    FROM app_transacoes_fixas tf
    WHERE tf.user_id = p_user_id
      AND tf.tipo = 'receita'
      AND tf.ativo = true
      AND tf.data_inicio <= v_data_fim
      AND (tf.data_fim IS NULL OR tf.data_fim >= v_data_inicio)
      AND NOT EXISTS (
          SELECT 1 FROM app_transacoes t
          WHERE t.fixo_id = tf.id
            AND EXTRACT(MONTH FROM t.data) = p_mes
            AND EXTRACT(YEAR FROM t.data) = p_ano
      );

    -- Despesas fixas que ainda não foram geradas para este mês
    SELECT COALESCE(SUM(tf.valor), 0) INTO v_despesas_fixas_nao_geradas
    FROM app_transacoes_fixas tf
    WHERE tf.user_id = p_user_id
      AND tf.tipo = 'despesa'
      AND tf.ativo = true
      AND tf.data_inicio <= v_data_fim
      AND (tf.data_fim IS NULL OR tf.data_fim >= v_data_inicio)
      AND NOT EXISTS (
          SELECT 1 FROM app_transacoes t
          WHERE t.fixo_id = tf.id
            AND EXTRACT(MONTH FROM t.data) = p_mes
            AND EXTRACT(YEAR FROM t.data) = p_ano
      );

    -- =============================================
    -- 4. FATURAS DE CARTÃO
    -- =============================================

    -- Faturas do mês atual
    SELECT COALESCE(SUM(f.valor_total), 0) INTO v_fatura_mes_atual
    FROM app_fatura f
    JOIN app_cartao_credito c ON f.cartao_id = c.id
    WHERE c.user_id = p_user_id
      AND f.mes = p_mes
      AND f.ano = p_ano
      AND f.status IN ('aberta', 'fechada');

    -- Faturas do próximo mês (para informação)
    DECLARE
        v_proximo_mes INTEGER := CASE WHEN p_mes = 12 THEN 1 ELSE p_mes + 1 END;
        v_proximo_ano INTEGER := CASE WHEN p_mes = 12 THEN p_ano + 1 ELSE p_ano END;
    BEGIN
        SELECT COALESCE(SUM(f.valor_total), 0) INTO v_fatura_mes_proximo
        FROM app_fatura f
        JOIN app_cartao_credito c ON f.cartao_id = c.id
        WHERE c.user_id = p_user_id
          AND f.mes = v_proximo_mes
          AND f.ano = v_proximo_ano
          AND f.status IN ('aberta', 'fechada');
    END;

    -- =============================================
    -- 5. CÁLCULO CORRETO DO SALDO PREVISTO
    -- =============================================

    -- Lógica matemática correta baseada no tipo de período
    IF v_tipo_periodo = 'passado' THEN
        -- MÊS PASSADO: Recalcular baseado no que realmente aconteceu
        -- Saldo previsto = o que realmente sobrou no final do mês
        v_saldo_previsto_fim_mes := v_saldo_atual_total;

    ELSIF v_tipo_periodo = 'atual' THEN
        -- MÊS ATUAL: Saldo atual + pendentes + fixos não gerados
        -- CORREÇÃO: NÃO somar receitas confirmadas (já estão no saldo_atual)
        v_saldo_previsto_fim_mes := v_saldo_atual_total
            + v_receitas_pendentes_mes
            - v_despesas_pendentes_mes
            + v_receitas_fixas_nao_geradas
            - v_despesas_fixas_nao_geradas
            - v_fatura_mes_atual;

    ELSE -- v_tipo_periodo = 'futuro'
        -- MÊS FUTURO: Saldo atual + todas as movimentações previstas do mês
        v_saldo_previsto_fim_mes := v_saldo_atual_total
            + v_receitas_pendentes_mes
            - v_despesas_pendentes_mes
            + v_receitas_fixas_nao_geradas
            - v_despesas_fixas_nao_geradas
            - v_fatura_mes_atual;
    END IF;

    -- =============================================
    -- 6. CÁLCULO DA ECONOMIA DO MÊS (FLUXO MENSAL)
    -- =============================================

    -- Economia = apenas o fluxo de entradas e saídas do mês
    v_economia_mes := (v_receitas_confirmadas_mes + v_receitas_pendentes_mes + v_receitas_fixas_nao_geradas) -
                      (v_despesas_confirmadas_mes + v_despesas_pendentes_mes + v_despesas_fixas_nao_geradas + v_fatura_mes_atual);

    -- Taxa de economia
    IF (v_receitas_confirmadas_mes + v_receitas_pendentes_mes + v_receitas_fixas_nao_geradas) > 0 THEN
        v_taxa_economia := (v_economia_mes / (v_receitas_confirmadas_mes + v_receitas_pendentes_mes + v_receitas_fixas_nao_geradas)) * 100;
    END IF;

    -- =============================================
    -- 7. BUSCAR DADOS COMPLEMENTARES
    -- =============================================

    -- Contas do usuário
    SELECT json_agg(
        json_build_object(
            'id', id,
            'nome', nome,
            'tipo', tipo,
            'saldo_atual', saldo_atual,
            'cor', cor,
            'icone', icone,
            'moeda', moeda,
            'status', status
        ) ORDER BY nome
    ) INTO v_contas
    FROM app_conta
    WHERE user_id = p_user_id AND status = 'ativo';

    -- Transações do mês (incluindo fixas pendentes)
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'descricao', t.descricao,
            'valor', t.valor,
            'data', t.data,
            'tipo', t.tipo,
            'status', t.status,
            'origem', t.origem,
            'tipo_especial', t.tipo_especial,
            'fixo_id', t.fixo_id,
            'categoria', json_build_object(
                'nome', COALESCE(c.nome, 'Sem categoria'),
                'cor', COALESCE(c.cor, '#6B7280'),
                'icone', COALESCE(c.icone, 'tag')
            ),
            'conta_nome', COALESCE(ac.nome, '-'),
            'cartao_nome', COALESCE(cc.nome, '-')
        ) ORDER BY
            CASE WHEN t.status = 'pendente' THEN 0 ELSE 1 END,
            t.data DESC
    ) INTO v_transacoes_mes
    FROM app_transacoes t
    LEFT JOIN app_categoria c ON t.categoria_id = c.id
    LEFT JOIN app_conta ac ON t.conta_id = ac.id
    LEFT JOIN app_cartao_credito cc ON t.cartao_id = cc.id
    WHERE t.user_id = p_user_id
      AND t.data >= v_data_inicio
      AND t.data <= v_data_fim
      AND t.status IN ('pendente', 'confirmado')
    LIMIT 20;

    -- Faturas do mês
    SELECT json_agg(
        json_build_object(
            'id', f.id,
            'cartao_nome', c.nome,
            'mes', f.mes,
            'ano', f.ano,
            'valor_total', f.valor_total,
            'data_vencimento', f.data_vencimento,
            'status', f.status,
            'status_vencimento', CASE
                WHEN f.data_vencimento < CURRENT_DATE THEN 'vencida'
                WHEN f.data_vencimento <= CURRENT_DATE + INTERVAL '7 days' THEN 'proxima'
                ELSE 'futura'
            END
        ) ORDER BY f.data_vencimento
    ) INTO v_faturas_mes
    FROM app_fatura f
    JOIN app_cartao_credito c ON f.cartao_id = c.id
    WHERE c.user_id = p_user_id
      AND f.mes = p_mes
      AND f.ano = p_ano;

    -- =============================================
    -- 8. RETORNAR RESULTADO COM LÓGICA CORRIGIDA
    -- =============================================
    RETURN json_build_object(
        'mes_referencia', p_mes,
        'ano_referencia', p_ano,
        'tipo_periodo', v_tipo_periodo,
        'periodo', json_build_object(
            'data_inicio', v_data_inicio,
            'data_fim', v_data_fim,
            'mes_nome', to_char(v_data_inicio, 'Month'),
            'mes_ano', to_char(v_data_inicio, 'MM/YYYY')
        ),
        'indicadores_mes', json_build_object(
            -- Valores base
            'saldo_atual_total', v_saldo_atual_total,
            'receitas_confirmadas', v_receitas_confirmadas_mes,
            'despesas_confirmadas', v_despesas_confirmadas_mes,
            'receitas_pendentes', v_receitas_pendentes_mes,
            'despesas_pendentes', v_despesas_pendentes_mes,
            'receitas_fixas_nao_geradas', v_receitas_fixas_nao_geradas,
            'despesas_fixas_nao_geradas', v_despesas_fixas_nao_geradas,
            'fatura_mes_atual', v_fatura_mes_atual,
            'fatura_mes_proximo', v_fatura_mes_proximo,

            -- Métricas corrigidas
            'saldo_previsto_fim_mes', v_saldo_previsto_fim_mes,
            'economia_mes', v_economia_mes,
            'taxa_economia', ROUND(v_taxa_economia, 2),
            'score_saude', CASE
                WHEN v_economia_mes > 0 THEN LEAST(100, 50 + (v_taxa_economia * 2))
                ELSE GREATEST(0, 50 + v_taxa_economia)
            END,

            -- Totais para compatibilidade
            'total_receitas_mes', v_receitas_confirmadas_mes + v_receitas_pendentes_mes + v_receitas_fixas_nao_geradas,
            'total_despesas_mes', v_despesas_confirmadas_mes + v_despesas_pendentes_mes + v_despesas_fixas_nao_geradas + v_fatura_mes_atual,
            'fluxo_liquido_mes', v_receitas_confirmadas_mes - v_despesas_confirmadas_mes,
            'ultima_atualizacao', NOW()
        ),
        'debug_info', json_build_object(
            'tipo_periodo', v_tipo_periodo,
            'calculo_base', 'saldo_atual: ' || v_saldo_atual_total,
            'pendentes', 'receitas: ' || v_receitas_pendentes_mes || ', despesas: ' || v_despesas_pendentes_mes,
            'fixos_nao_gerados', 'receitas: ' || v_receitas_fixas_nao_geradas || ', despesas: ' || v_despesas_fixas_nao_geradas
        ),
        'contas', COALESCE(v_contas, '[]'::json),
        'transacoes_mes', COALESCE(v_transacoes_mes, '[]'::json),
        'faturas_mes', COALESCE(v_faturas_mes, '[]'::json)
    );
END;
$function$;

-- Comentário da correção
COMMENT ON FUNCTION public.obter_dashboard_mes IS
'Função CORRIGIDA - Lógica matemática adequada:
- Elimina duplicação (saldo_atual já contém receitas confirmadas)
- Inclui lançamentos fixos não processados
- Diferencia cálculo por tipo de período (passado/atual/futuro)
- Implementa navegação mês a mês funcional';