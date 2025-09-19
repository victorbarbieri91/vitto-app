# 🔄 PLANO DE REESTRUTURAÇÃO - TABELAS DE LANÇAMENTOS

## 📊 SITUAÇÃO ATUAL

### Problemas Identificados
- **Duplicação de conceitos**: `app_lancamento` e `app_lancamento_recorrente` fazem trabalhos similares
- **Complexidade desnecessária**: Duas tabelas com lógicas sobrepostas
- **Lógica confusa**: Recorrentes não geram lançamentos automaticamente
- **Dependência de CRON**: Sistema atual precisa de processamento externo
- **Segurança de dados**: Necessidade de RLS (Row Level Security) e validações por usuário

### Tabelas Atuais
- `app_lancamento` (6 registros) - Lançamentos únicos/parcelados
- `app_lancamento_recorrente` (3 registros) - Templates recorrentes

## 🎯 NOVA ESTRUTURA PROPOSTA

### 1. `app_transacoes` - TABELA UNIFICADA
**Finalidade**: Armazenar TODOS os lançamentos reais (únicos, parcelados, gerados de fixos)

```sql
CREATE TABLE app_transacoes (
  -- IDs
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Dados básicos
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL CHECK (valor > 0),
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'despesa_cartao')),
  
  -- Referências
  categoria_id BIGINT NOT NULL REFERENCES app_categoria(id),
  conta_id BIGINT REFERENCES app_conta(id),
  cartao_id BIGINT REFERENCES app_cartao_credito(id),
  
  -- PARCELAMENTO (para compras 12x)
  parcela_atual INTEGER NULL CHECK (parcela_atual > 0),
  total_parcelas INTEGER NULL CHECK (total_parcelas > 0),
  grupo_parcelamento UUID NULL, -- Liga todas as parcelas da mesma compra
  
  -- ORIGEM (rastreabilidade)
  origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'fixo', 'importacao')),
  fixo_id BIGINT REFERENCES app_transacoes_fixas(id), -- Qual regra fixa gerou
  
  -- Status e controle
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  tipo_especial TEXT DEFAULT 'normal' CHECK (tipo_especial IN ('normal', 'saldo_inicial', 'ajuste_manual')),
  data_vencimento DATE NULL,
  observacoes TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT conta_ou_cartao CHECK (
    (conta_id IS NOT NULL AND cartao_id IS NULL) OR 
    (conta_id IS NULL AND cartao_id IS NOT NULL)
  ),
  CONSTRAINT parcelas_validas CHECK (
    (parcela_atual IS NULL AND total_parcelas IS NULL) OR
    (parcela_atual IS NOT NULL AND total_parcelas IS NOT NULL AND parcela_atual <= total_parcelas)
  ),
  CONSTRAINT origem_fixo CHECK (
    (origem = 'fixo' AND fixo_id IS NOT NULL) OR 
    (origem != 'fixo' AND fixo_id IS NULL)
  )
);

-- Índices importantes
CREATE INDEX idx_transacoes_user_data ON app_transacoes(user_id, data);
CREATE INDEX idx_transacoes_conta ON app_transacoes(conta_id) WHERE conta_id IS NOT NULL;
CREATE INDEX idx_transacoes_cartao ON app_transacoes(cartao_id) WHERE cartao_id IS NOT NULL;
CREATE INDEX idx_transacoes_grupo_parcelamento ON app_transacoes(grupo_parcelamento) WHERE grupo_parcelamento IS NOT NULL;

-- 🔒 SEGURANÇA: Row Level Security (RLS)
ALTER TABLE app_transacoes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem suas próprias transações
CREATE POLICY transacoes_isolamento_usuario ON app_transacoes
  USING (user_id = auth.uid());

-- Policy: Usuários só podem inserir com seu próprio user_id
CREATE POLICY transacoes_insercao_usuario ON app_transacoes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Usuários só podem atualizar suas próprias transações  
CREATE POLICY transacoes_atualizacao_usuario ON app_transacoes
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Usuários só podem deletar suas próprias transações
CREATE POLICY transacoes_delecao_usuario ON app_transacoes
  FOR DELETE USING (user_id = auth.uid());

-- 🔒 CONSTRAINT: Garantir que conta/cartão pertencem ao usuário
ALTER TABLE app_transacoes ADD CONSTRAINT check_conta_usuario 
  CHECK (conta_id IS NULL OR EXISTS (
    SELECT 1 FROM app_conta WHERE id = conta_id AND user_id = app_transacoes.user_id
  ));

ALTER TABLE app_transacoes ADD CONSTRAINT check_cartao_usuario 
  CHECK (cartao_id IS NULL OR EXISTS (
    SELECT 1 FROM app_cartao_credito WHERE id = cartao_id AND user_id = app_transacoes.user_id
  ));
```

### 2. `app_transacoes_fixas` - REGRAS PERMANENTES  
**Finalidade**: Armazenar regras fixas (Salário, Aluguel, Netflix) que afetam automaticamente todos os cálculos

```sql
CREATE TABLE app_transacoes_fixas (
  -- IDs
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Dados da regra
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL CHECK (valor > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'despesa_cartao')),
  
  -- Referências
  categoria_id BIGINT NOT NULL REFERENCES app_categoria(id),
  conta_id BIGINT REFERENCES app_conta(id),
  cartao_id BIGINT REFERENCES app_cartao_credito(id),
  
  -- Configuração temporal
  dia_mes INTEGER NOT NULL CHECK (dia_mes >= 1 AND dia_mes <= 31),
  data_inicio DATE NOT NULL,
  data_fim DATE NULL, -- NULL = para sempre
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT conta_ou_cartao_fixo CHECK (
    (conta_id IS NOT NULL AND cartao_id IS NULL) OR 
    (conta_id IS NULL AND cartao_id IS NOT NULL)
  ),
  CONSTRAINT data_inicio_fim CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Índices
CREATE INDEX idx_transacoes_fixas_user_ativo ON app_transacoes_fixas(user_id, ativo);
CREATE INDEX idx_transacoes_fixas_periodo ON app_transacoes_fixas(data_inicio, data_fim);

-- 🔒 SEGURANÇA: Row Level Security (RLS)
ALTER TABLE app_transacoes_fixas ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem suas próprias regras fixas
CREATE POLICY transacoes_fixas_isolamento_usuario ON app_transacoes_fixas
  USING (user_id = auth.uid());

-- Policy: Usuários só podem inserir com seu próprio user_id
CREATE POLICY transacoes_fixas_insercao_usuario ON app_transacoes_fixas
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Usuários só podem atualizar suas próprias regras fixas
CREATE POLICY transacoes_fixas_atualizacao_usuario ON app_transacoes_fixas
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Usuários só podem deletar suas próprias regras fixas  
CREATE POLICY transacoes_fixas_delecao_usuario ON app_transacoes_fixas
  FOR DELETE USING (user_id = auth.uid());

-- 🔒 CONSTRAINT: Garantir que conta/cartão pertencem ao usuário
ALTER TABLE app_transacoes_fixas ADD CONSTRAINT check_conta_usuario_fixo 
  CHECK (conta_id IS NULL OR EXISTS (
    SELECT 1 FROM app_conta WHERE id = conta_id AND user_id = app_transacoes_fixas.user_id
  ));

ALTER TABLE app_transacoes_fixas ADD CONSTRAINT check_cartao_usuario_fixo 
  CHECK (cartao_id IS NULL OR EXISTS (
    SELECT 1 FROM app_cartao_credito WHERE id = cartao_id AND user_id = app_transacoes_fixas.user_id
  ));
```

## 📋 PLANO DE MIGRAÇÃO

### FASE 1: CRIAR ESTRUTURAS
- [ ] Criar `app_transacoes` 
- [ ] Criar `app_transacoes_fixas`
- [ ] Criar backups das tabelas atuais

### FASE 2: MIGRAR DADOS

#### 2.1 Migrar `app_lancamento` → `app_transacoes`
```sql
INSERT INTO app_transacoes (
  user_id, descricao, valor, data, tipo,
  categoria_id, conta_id, cartao_id,
  parcela_atual, total_parcelas,
  status, tipo_especial, data_vencimento, observacoes,
  origem, created_at
)
SELECT 
  user_id, descricao, valor, data, tipo,
  categoria_id, conta_id, cartao_id,
  parcela_atual, total_parcelas,
  COALESCE(status, 'confirmado'), 
  COALESCE(tipo_especial, 'normal'),
  data_vencimento, observacoes,
  'manual', created_at
FROM app_lancamento;
```

#### 2.2 Migrar Fixos: `app_lancamento_recorrente` → `app_transacoes_fixas`
```sql
INSERT INTO app_transacoes_fixas (
  user_id, descricao, valor, tipo,
  categoria_id, conta_id, cartao_id,
  dia_mes, data_inicio, data_fim, ativo, created_at
)
SELECT 
  user_id, descricao, valor, tipo,
  categoria_id, conta_id, cartao_id,
  dia_vencimento, data_inicio, data_fim, ativo, created_at
FROM app_lancamento_recorrente
WHERE tipo_recorrencia = 'fixo';
```

#### 2.3 Expandir Parcelados
```sql
-- Criar lógica para expandir parcelados em múltiplas transações
-- com grupo_parcelamento para agrupá-las
```

### FASE 3: ATUALIZAR FUNÇÕES SQL

#### 3.1 Funções de Cálculo a Reescrever
- [ ] `calcular_saldo_atual()`
- [ ] `calcular_saldo_previsto()`  
- [ ] `calcular_indicadores_mes()`
- [ ] `atualizar_indicadores_mes()`

#### 3.2 Nova Lógica dos Cálculos
```sql
-- Saldo Atual = Transações Confirmadas
-- Saldo Previsto = Saldo Atual + Projeção Fixas + Transações Pendentes
```

#### 3.3 Triggers a Atualizar
- [ ] `trigger_atualizar_saldo_conta` 
- [ ] `trigger_atualizar_indicadores_lancamento`
- [ ] Novo: `trigger_transacoes_fixas_changed`

#### 3.4 View Unificada para Frontend
```sql
CREATE VIEW lancamentos_completos AS
  -- Transações reais (já com RLS aplicado automaticamente)
  SELECT 
    id, user_id, descricao, valor, data, tipo,
    categoria_id, conta_id, cartao_id,
    parcela_atual, total_parcelas, grupo_parcelamento,
    status, origem, fixo_id,
    'real' as natureza,
    created_at
  FROM app_transacoes
  -- RLS garante que user_id = auth.uid() automaticamente
  
  UNION ALL
  
  -- Projeções das regras fixas (já com RLS aplicado automaticamente)
  SELECT 
    NULL as id,
    user_id, descricao, valor,
    make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM CURRENT_DATE)::int, dia_mes) as data,
    tipo, categoria_id, conta_id, cartao_id,
    NULL as parcela_atual, NULL as total_parcelas, NULL as grupo_parcelamento,
    'pendente' as status, 'fixo' as origem, id as fixo_id,
    'projetado' as natureza,
    created_at
  FROM app_transacoes_fixas 
  WHERE ativo = true
    AND data_inicio <= CURRENT_DATE
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
    AND make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM CURRENT_DATE)::int, dia_mes) >= CURRENT_DATE;
    -- RLS garante que user_id = auth.uid() automaticamente

-- 🔒 SEGURANÇA: View também herda RLS das tabelas base
-- Não precisa de policies próprias, pois as tabelas já aplicam RLS
```

### FASE 4: ATUALIZAR CÓDIGO FRONTEND

#### 4.1 Services a Atualizar
- [ ] `TransactionService.ts` → Usar `app_transacoes` **com validação de user_id**
- [ ] `RecurrentTransactionService.ts` → Renomear para `FixedTransactionService.ts`, usar `app_transacoes_fixas` **com RLS**
- [ ] `SaldoService.ts` → Usar nova lógica de cálculo **sempre filtrada por usuário**
- [ ] Criar `UnifiedTransactionService.ts` → Usar view `lancamentos_completos` **que herda RLS**

#### 🔒 Padrão de Service Seguro
```typescript
// Exemplo de service seguro:
class SecureTransactionService {
  async create(data: TransactionData) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    // RLS garante que só criará com user_id correto
    return supabase.from('app_transacoes').insert({
      ...data,
      user_id: user.id // Sempre explícito
    });
  }
  
  async list(filters?: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    // RLS filtra automaticamente por user_id = auth.uid()
    return supabase.from('app_transacoes').select('*');
  }
}
```

#### 4.2 Tipos TypeScript Novos
```typescript
interface Transaction {
  id: number;
  origem: 'manual' | 'fixo' | 'importacao';
  fixo_id?: number;
  grupo_parcelamento?: string;
  natureza?: 'real' | 'projetado';
  // ... outros campos existentes
}

interface FixedTransaction {
  id: number;
  dia_mes: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  // ... outros campos básicos
}
```

#### 4.3 Componentes a Atualizar
- [ ] `TransactionForm` - Adicionar campo origem, grupo_parcelamento
- [ ] `TransactionList` - Mostrar origem, distinguir real vs projetado
- [ ] `RecurrentTransactionManager` → `FixedTransactionManager`
- [ ] Dashboard components - Usar novos services

#### 4.4 Contextos
- [ ] `MonthlyDashboardContext.tsx` - Usar view unificada
- [ ] Outros contextos que usam transações

### FASE 5: IMPLEMENTAR SEGURANÇA E VALIDAÇÃO
- [ ] **Aplicar RLS** em ambas as tabelas novas
- [ ] **Criar policies** de isolamento por usuário
- [ ] **Testar isolamento**: Usuário A não vê dados do Usuário B
- [ ] **Validar constraints**: Conta/cartão pertencem ao usuário correto
- [ ] **Validar migração** de dados
- [ ] **Testar cálculos** de saldo por usuário
- [ ] **Testar indicadores** mensais por usuário
- [ ] **Testar interface** com múltiplos usuários
- [ ] **Validar performance** das consultas com RLS

### FASE 6: LIMPEZA FINAL
- [ ] Remover `app_lancamento` (após validação completa)
- [ ] Remover `app_lancamento_recorrente` (após validação completa)
- [ ] Limpar imports e referências antigas no código
- [ ] Atualizar documentação
- [ ] Remover funções SQL obsoletas
- [ ] Limpar triggers antigos

## 🔒 ARQUITETURA DE SEGURANÇA

### Princípios de Segurança Implementados

#### 1. **Row Level Security (RLS)**
- **Todas as tabelas** principais têm RLS ativo
- **Isolamento automático** por `user_id`
- **Sem possibilidade** de vazamento entre usuários

#### 2. **Policies de Acesso**
```sql
-- Exemplo de policy aplicada em todas as tabelas:
CREATE POLICY isolamento_usuario ON tabela_name
  USING (user_id = auth.uid());
```

#### 3. **Constraints de Integridade**  
- **Conta/Cartão** devem pertencer ao usuário que cria a transação
- **Validação automática** no nível do banco de dados
- **Impossível** vincular recursos de outros usuários

#### 4. **Segurança em Camadas**
```
Frontend (Auth Context)
    ↓
Services (user_id validation)  
    ↓
Supabase RLS (database level)
    ↓  
Database Constraints (integrity)
```

### Validações de Segurança Obrigatórias

#### Fase de Testes de Segurança
- [ ] **Teste de Isolamento**: Criar 2 usuários, verificar que não se veem
- [ ] **Teste de INSERT**: Tentar inserir com user_id diferente → deve falhar
- [ ] **Teste de UPDATE**: Tentar alterar transação de outro usuário → deve falhar  
- [ ] **Teste de DELETE**: Tentar deletar transação de outro usuário → deve falhar
- [ ] **Teste de Constraints**: Tentar vincular conta de outro usuário → deve falhar

#### Frontend Security Checklist
- [ ] **Services sempre passam** `user_id` nas consultas
- [ ] **AuthContext valida** se usuário está logado
- [ ] **Forms não permitem** alterar `user_id`
- [ ] **Lists mostram apenas** dados do usuário atual
- [ ] **Contexts isolam** dados por usuário

### Funções SQL Seguras

#### Template para Funções
```sql
-- Todas as funções devem seguir este padrão:
CREATE OR REPLACE FUNCTION funcao_exemplo(p_user_id UUID)
RETURNS TABLE(...) AS $$
BEGIN
  -- SEMPRE validar usuário
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: usuário inválido';
  END IF;
  
  -- Query já filtrada por user_id (RLS aplica automaticamente)
  RETURN QUERY 
  SELECT ... FROM app_transacoes 
  WHERE user_id = p_user_id; -- Redundante mas explícito
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ BENEFÍCIOS ESPERADOS

### Simplicidade
- **1 lugar** para todos os lançamentos reais
- **1 lugar** para todas as regras fixas  
- **Lógica clara** e bem separada

### Performance
- Menos JOINs complexos entre tabelas
- Cálculos mais diretos e eficientes
- Índices otimizados para consultas específicas

### Flexibilidade
- Parcelamentos completos na criação
- Fixos considerados automaticamente em todos os cálculos
- Rastreabilidade completa (origem + fixo_id)

### Manutenção
- Código mais limpo e organizado
- Menos bugs de sincronização
- Mais fácil de testar e debugar
- **Eliminação total da necessidade de CRON**

### Segurança
- **Isolamento total** entre usuários via RLS
- **Validação em múltiplas camadas** (DB + App)
- **Impossibilidade de vazamento** de dados entre usuários
- **Constraints automáticas** impedem vínculos inválidos
- **Auditoria completa** com `user_id` em todos os registros

## 🚨 RISCOS E MITIGATION

### Riscos
- **Perda de dados** durante migração
- **Quebra temporária** do sistema
- **Inconsistências** nos cálculos

### Mitigação  
- Backups completos antes de cada etapa
- Migração por fases com validação
- Manter tabelas antigas até confirmação total
- Testes extensivos em ambiente separado

## 📝 CHECKLIST DE EXECUÇÃO

### Preparação
- [ ] Backup completo do banco
- [ ] Criar branch específica para reestruturação
- [ ] Documentar estado atual do sistema

### Execução
- [ ] Executar FASE 1
- [ ] Validar FASE 1
- [ ] Executar FASE 2  
- [ ] Validar migração de dados
- [ ] Executar FASE 3
- [ ] Testar funções SQL
- [ ] Executar FASE 4
- [ ] Testar interface
- [ ] Executar FASE 5
- [ ] Validação completa
- [ ] Executar FASE 6 (limpeza)

### Finalização
- [ ] Atualizar documentação do projeto
- [ ] Merge da branch
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy

---

**Data de Criação**: 01/09/2025  
**Última Atualização**: 01/09/2025  
**Status**: 📋 Planejamento