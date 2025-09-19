-- TABELA CHAVE: app_indicadores - Métricas Automáticas
-- Coração do sistema de análise preditiva e saldo previsto

CREATE TABLE app_indicadores (
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
CREATE INDEX idx_indicadores_user_periodo ON app_indicadores(user_id, ano DESC, mes DESC);

-- Comentário da tabela
COMMENT ON TABLE app_indicadores IS 'Tabela chave - Métricas financeiras calculadas automaticamente. Base para saldo previsto e análises da IA.'; 