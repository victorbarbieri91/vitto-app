-- TABELA CRÍTICA: app_lancamento_recorrente - Templates para Lançamentos Automáticos
-- Automatiza lançamentos que se repetem (salário, aluguel, parcelas)

CREATE TABLE app_lancamento_recorrente (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Dados do template
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  tipo TEXT CHECK (tipo IN ('receita', 'despesa')),
  categoria_id BIGINT NOT NULL REFERENCES app_categoria(id),
  conta_id BIGINT REFERENCES app_conta(id),
  cartao_id BIGINT REFERENCES app_cartao_credito(id),
  
  -- Configuração de recorrência
  tipo_recorrencia TEXT CHECK (tipo_recorrencia IN ('fixo', 'parcelado')),
  
  -- Para FIXO (salário, aluguel, etc)
  intervalo TEXT CHECK (intervalo IN ('mensal', 'quinzenal', 'semanal', 'anual')),
  dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  
  -- Para PARCELADO (compras em X vezes)
  total_parcelas INTEGER CHECK (total_parcelas > 0),
  parcela_atual INTEGER DEFAULT 1 CHECK (parcela_atual > 0),
  
  -- Controle de execução
  data_inicio DATE NOT NULL,
  data_fim DATE,
  proxima_execucao DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints de validação
  CONSTRAINT check_recorrencia_fixo CHECK (
    tipo_recorrencia != 'fixo' OR (intervalo IS NOT NULL AND dia_vencimento IS NOT NULL)
  ),
  CONSTRAINT check_recorrencia_parcelado CHECK (
    tipo_recorrencia != 'parcelado' OR (total_parcelas IS NOT NULL)
  ),
  CONSTRAINT check_parcela_atual CHECK (
    parcela_atual <= total_parcelas OR total_parcelas IS NULL
  ),
  CONSTRAINT check_conta_ou_cartao CHECK (
    (conta_id IS NOT NULL AND cartao_id IS NULL) OR 
    (conta_id IS NULL AND cartao_id IS NOT NULL)
  )
);

-- Habilitar RLS
ALTER TABLE app_lancamento_recorrente ENABLE ROW LEVEL SECURITY;

-- Policy RLS: Usuários só veem próprios lançamentos recorrentes
CREATE POLICY "Usuários veem apenas próprios lançamentos recorrentes" ON app_lancamento_recorrente
  FOR ALL USING (user_id = auth.uid());

-- Índices estratégicos
CREATE INDEX idx_recorrente_execucao ON app_lancamento_recorrente(proxima_execucao) WHERE ativo = true;
CREATE INDEX idx_recorrente_user_ativo ON app_lancamento_recorrente(user_id, ativo);

-- Comentário da tabela
COMMENT ON TABLE app_lancamento_recorrente IS 'Templates para automação de lançamentos recorrentes. Base para projeções futuras e saldo previsto.'; 