-- FUNÇÕES E TRIGGERS - Core do Sistema Automático
-- Funções que calculam indicadores e saldo previsto automaticamente

-- =======================
-- 1. FUNÇÃO PRINCIPAL: Atualizar Indicadores
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
-- 2. TRIGGER AUTOMÁTICO
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

-- Aplicar trigger em app_lancamento
DROP TRIGGER IF EXISTS trigger_indicadores_lancamento ON app_lancamento;
CREATE TRIGGER trigger_indicadores_lancamento
  AFTER INSERT OR UPDATE OR DELETE ON app_lancamento
  FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_indicadores();

-- =======================
-- 3. FUNÇÃO PARA LANÇAMENTOS RECORRENTES
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
-- 4. TRIGGER PARA ATUALIZAR SALDO DAS CONTAS
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