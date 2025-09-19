-- =============================================
-- MIGRAÇÃO: CORREÇÃO DA LÓGICA FINANCEIRA DO DASHBOARD
-- Data: 2025-09-15
-- Objetivo: Corrigir lógica de saldo previsto e economia
-- =============================================

-- Substituir a função obter_dashboard_mes com lógica correta
CREATE OR REPLACE FUNCTION public.obter_dashboard_mes(p_user_id uuid, p_mes integer, p_ano integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_saldo_atual_total NUMERIC := 0;
    v_receitas_confirmadas_mes NUMERIC := 0;
    v_despesas_confirmadas_mes NUMERIC := 0;
    v_receitas_pendentes_mes NUMERIC := 0;
    v_despesas_pendentes_mes NUMERIC := 0;
    v_fatura_mes_atual NUMERIC := 0;
    v_fatura_mes_proximo NUMERIC := 0;
    v_economia_mes NUMERIC := 0;
    v_saldo_previsto_fim_mes NUMERIC := 0;
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

    -- 1. SALDO ATUAL TOTAL (todas as contas ativas do usuário)
    SELECT COALESCE(SUM(saldo_atual), 0) INTO v_saldo_atual_total
    FROM app_conta
    WHERE user_id = p_user_id AND status = 'ativo';

    -- 2. RECEITAS DO MÊS (confirmadas - EXCLUINDO saldo inicial)
    SELECT COALESCE(SUM(valor), 0) INTO v_receitas_confirmadas_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'receita'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'confirmado'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial'; -- CORREÇÃO: Excluir saldo inicial

    -- 3. DESPESAS DO MÊS (confirmadas - conta corrente, EXCLUINDO saldo inicial)
    SELECT COALESCE(SUM(valor), 0) INTO v_despesas_confirmadas_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'despesa'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'confirmado'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial'; -- CORREÇÃO: Excluir saldo inicial

    -- 4. RECEITAS PENDENTES DO MÊS (EXCLUINDO saldo inicial)
    SELECT COALESCE(SUM(valor), 0) INTO v_receitas_pendentes_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'receita'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'pendente'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial'; -- CORREÇÃO: Excluir saldo inicial

    -- 5. DESPESAS PENDENTES DO MÊS (EXCLUINDO saldo inicial)
    SELECT COALESCE(SUM(valor), 0) INTO v_despesas_pendentes_mes
    FROM app_transacoes
    WHERE user_id = p_user_id
      AND tipo = 'despesa'
      AND data >= v_data_inicio
      AND data <= v_data_fim
      AND status = 'pendente'
      AND COALESCE(tipo_especial, 'normal') != 'saldo_inicial'; -- CORREÇÃO: Excluir saldo inicial

    -- 6. FATURAS DO MÊS ATUAL (despesas de cartão que afetam o mês)
    SELECT COALESCE(SUM(f.valor_total), 0) INTO v_fatura_mes_atual
    FROM app_fatura f
    JOIN app_cartao_credito c ON f.cartao_id = c.id
    WHERE c.user_id = p_user_id
      AND f.mes = p_mes
      AND f.ano = p_ano
      AND f.status IN ('aberta', 'fechada');

    -- 7. FATURAS DO PRÓXIMO MÊS (para projeção)
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

    -- 8. CALCULAR MÉTRICAS CORRIGIDAS

    -- ECONOMIA DO MÊS = apenas fluxo mensal (receitas - despesas) SEM saldo anterior
    v_economia_mes := (v_receitas_confirmadas_mes + v_receitas_pendentes_mes) -
                      (v_despesas_confirmadas_mes + v_despesas_pendentes_mes);

    -- SALDO PREVISTO FIM DO MÊS = saldo atual + receitas futuras - despesas futuras
    -- CORREÇÃO: Não subtrair faturas já incluídas nas despesas pendentes
    v_saldo_previsto_fim_mes := v_saldo_atual_total + v_receitas_pendentes_mes - v_despesas_pendentes_mes;

    -- Taxa de economia (baseada no fluxo mensal)
    IF (v_receitas_confirmadas_mes + v_receitas_pendentes_mes) > 0 THEN
        v_taxa_economia := (v_economia_mes / (v_receitas_confirmadas_mes + v_receitas_pendentes_mes)) * 100;
    END IF;

    -- 9. BUSCAR DADOS COMPLEMENTARES

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

    -- Transações do mês (últimas 15) - INCLUINDO fixas pendentes
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
            CASE WHEN t.status = 'pendente' THEN 0 ELSE 1 END, -- pendentes primeiro
            CASE WHEN t.origem = 'fixo' AND t.status = 'pendente' THEN 0 ELSE 1 END, -- fixas pendentes no topo
            CASE WHEN t.status = 'pendente' THEN t.data ELSE t.data END DESC -- pendentes por data crescente, confirmadas decrescente
    ) INTO v_transacoes_mes
    FROM app_transacoes t
    LEFT JOIN app_categoria c ON t.categoria_id = c.id
    LEFT JOIN app_conta ac ON t.conta_id = ac.id
    LEFT JOIN app_cartao_credito cc ON t.cartao_id = cc.id
    WHERE t.user_id = p_user_id
      AND t.data >= v_data_inicio
      AND t.data <= v_data_fim
      AND t.status IN ('pendente', 'confirmado')
    LIMIT 15;

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

    -- 10. RETORNAR RESULTADO ESTRUTURADO COM LÓGICA CORRETA
    RETURN json_build_object(
        'mes_referencia', p_mes,
        'ano_referencia', p_ano,
        'periodo', json_build_object(
            'data_inicio', v_data_inicio,
            'data_fim', v_data_fim,
            'mes_nome', to_char(v_data_inicio, 'Month'),
            'mes_ano', to_char(v_data_inicio, 'MM/YYYY')
        ),
        'indicadores_mes', json_build_object(
            -- Valores base corrigidos
            'saldo_atual_total', v_saldo_atual_total,
            'receitas_confirmadas', v_receitas_confirmadas_mes,
            'despesas_confirmadas', v_despesas_confirmadas_mes,
            'receitas_pendentes', v_receitas_pendentes_mes,
            'despesas_pendentes', v_despesas_pendentes_mes,
            'fatura_mes_atual', v_fatura_mes_atual,
            'fatura_mes_proximo', v_fatura_mes_proximo,

            -- Métricas derivadas com lógica correta
            'economia_mes', v_economia_mes, -- CORREÇÃO: Apenas fluxo mensal
            'saldo_previsto_fim_mes', v_saldo_previsto_fim_mes, -- CORREÇÃO: Fórmula correta
            'taxa_economia', ROUND(v_taxa_economia, 2),
            'score_saude', CASE
                WHEN v_economia_mes > 0 THEN LEAST(100, 50 + (v_taxa_economia * 2))
                ELSE GREATEST(0, 50 + v_taxa_economia)
            END,

            -- Campos para compatibilidade com frontend atual
            'total_receitas_mes', v_receitas_confirmadas_mes + v_receitas_pendentes_mes,
            'total_despesas_mes', v_despesas_confirmadas_mes + v_despesas_pendentes_mes,
            'fluxo_liquido_mes', v_receitas_confirmadas_mes - v_despesas_confirmadas_mes,
            'resultado_mes', v_economia_mes,
            'ultima_atualizacao', NOW()
        ),
        'contas', COALESCE(v_contas, '[]'::json),
        'transacoes_mes', COALESCE(v_transacoes_mes, '[]'::json),
        'faturas_mes', COALESCE(v_faturas_mes, '[]'::json)
    );
END;
$function$;

-- Comentários sobre as correções aplicadas
COMMENT ON FUNCTION public.obter_dashboard_mes IS 'Função corrigida - Lógica financeira adequada: economia = fluxo mensal sem saldo anterior, saldo previsto = saldo atual + movimentos futuros, exclui saldo inicial dos cálculos mensais';