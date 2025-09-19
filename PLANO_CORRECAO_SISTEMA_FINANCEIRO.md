# 📊 PLANO DE CORREÇÃO DO SISTEMA FINANCEIRO BARSI

## 📅 Data: 24/08/2025
## 👤 Responsável: Sistema de IA Claude + Victor

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Inconsistência de Dados**
- **Problema**: 20 lançamentos criados com `user_id` incorreto (`0f24ae87-ccd0-41b3-8350-5f5effcd0ffd`)
- **Impacto**: Dashboard mostra apenas 1 lançamento em vez de 21
- **Causa**: Lançamentos vinculados à conta de outro usuário

### 2. **Falta de Lançamento de Saldo Inicial**
- **Problema**: Conta tem `saldo_inicial = 6500` mas não existe lançamento correspondente
- **Impacto**: Cálculos de saldo acumulado incorretos
- **Causa**: Sistema não cria lançamento automático ao criar conta

### 3. **Lógica de Cálculo Incorreta**
- **Problema**: Função `refresh_indicadores_conta` pega saldo direto da conta
- **Impacto**: Não calcula saldo acumulado histórico corretamente
- **Esperado**: Saldo Atual = Saldo Inicial + TODAS receitas/despesas até fim do mês

### 4. **Dashboard Não Usa app_indicadores**
- **Problema**: Dashboard faz consultas diretas com lógica incorreta
- **Impacto**: Dados inconsistentes e performance ruim
- **Esperado**: Dashboard deve consumir dados pré-calculados de `app_indicadores`

### 5. **Falta de Navegação Mensal**
- **Problema**: Dashboard sempre mostra mês atual
- **Impacto**: Usuário não consegue ver histórico ou projeções
- **Esperado**: Navegação livre entre meses com dados isolados

---

## 📌 ESPECIFICAÇÃO DO SISTEMA (REVISADA)

### Conceitos Fundamentais

#### 1. **Saldo Atual (do mês selecionado)**
```
Saldo Atual = 
  Saldo Inicial da Conta (lançamento especial)
  + TODAS Receitas Confirmadas (do início até fim do mês)
  - TODAS Despesas Confirmadas (do início até fim do mês)
```

#### 2. **Receitas do Mês**
- Soma de receitas confirmadas APENAS no mês selecionado
- Não inclui saldo inicial
- Não inclui receitas pendentes

#### 3. **Despesas do Mês**
- Soma de despesas confirmadas APENAS no mês selecionado
- Inclui pagamento de faturas de cartão

#### 4. **Fluxo Líquido do Mês**
```
Fluxo Líquido = Receitas do Mês - Despesas do Mês
```

#### 5. **Saldo Previsto**
```
Saldo Previsto = 
  Saldo Atual
  + Receitas Pendentes do Mês
  + Receitas Recorrentes do Mês
  - Despesas Pendentes do Mês
  - Despesas Recorrentes do Mês
  - Fatura Cartão Aberta
```

---

## 🛠️ PLANO DE EXECUÇÃO

### FASE 1: LIMPEZA E PREPARAÇÃO DA BASE
**Objetivo**: Limpar dados inconsistentes e preparar ambiente

#### 1.1. Backup dos Dados
```sql
-- Criar backup das tabelas antes das mudanças
CREATE TABLE backup_app_lancamento AS SELECT * FROM app_lancamento;
CREATE TABLE backup_app_indicadores AS SELECT * FROM app_indicadores;
```

#### 1.2. Remover Dados Inconsistentes
```sql
-- Deletar lançamentos do usuário incorreto
DELETE FROM app_lancamento 
WHERE user_id = '0f24ae87-ccd0-41b3-8350-5f5effcd0ffd';

-- Deletar indicadores incorretos
DELETE FROM app_indicadores 
WHERE user_id IN ('0f24ae87-ccd0-41b3-8350-5f5effcd0ffd', 'c5fc868a-eadb-43b1-8d3c-cad7e103fb33');

-- Deletar perfil do usuário órfão
DELETE FROM app_perfil 
WHERE id = '0f24ae87-ccd0-41b3-8350-5f5effcd0ffd';
```

#### 1.3. Criar Lançamento de Saldo Inicial
```sql
-- Inserir lançamento de saldo inicial para conta existente
INSERT INTO app_lancamento (
  descricao, 
  valor, 
  tipo, 
  data, 
  status,
  categoria_id, 
  conta_id, 
  user_id, 
  tipo_especial
) VALUES (
  'Saldo Inicial - Nubank',
  6500.00,
  'receita',
  '2025-07-03', -- Data de criação da conta
  'confirmado',
  11, -- ID da categoria "Saldo Inicial"
  1, -- ID da conta Nubank
  'c5fc868a-eadb-43b1-8d3c-cad7e103fb33',
  'saldo_inicial'
);
```

---

### FASE 2: REESCREVER FUNÇÕES DE CÁLCULO

#### 2.1. Nova Função Principal de Cálculo
```sql
CREATE OR REPLACE FUNCTION calcular_indicadores_mes(
  p_user_id UUID,
  p_conta_id BIGINT,
  p_mes INTEGER,
  p_ano INTEGER
) RETURNS TABLE (
  saldo_base NUMERIC,
  saldo_atual NUMERIC,
  receitas_mes NUMERIC,
  despesas_mes NUMERIC,
  fluxo_liquido NUMERIC,
  receitas_pendentes NUMERIC,
  despesas_pendentes NUMERIC,
  saldo_previsto NUMERIC
) AS $$
DECLARE
  v_saldo_base NUMERIC;
  v_receitas_mes NUMERIC;
  v_despesas_mes NUMERIC;
  v_receitas_pendentes NUMERIC;
  v_despesas_pendentes NUMERIC;
  v_fim_mes DATE;
BEGIN
  -- Definir último dia do mês
  v_fim_mes := (p_ano || '-' || LPAD(p_mes::TEXT, 2, '0') || '-01')::DATE 
               + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- 1. SALDO BASE (acumulado até início do mês)
  -- Inclui saldo inicial + todos lançamentos até mês anterior
  SELECT COALESCE(SUM(
    CASE 
      WHEN tipo = 'receita' THEN valor
      WHEN tipo IN ('despesa', 'despesa_cartao') THEN -valor
      ELSE 0
    END
  ), 0) INTO v_saldo_base
  FROM app_lancamento
  WHERE conta_id = p_conta_id
    AND status = 'confirmado'
    AND data < (p_ano || '-' || LPAD(p_mes::TEXT, 2, '0') || '-01')::DATE;
  
  -- 2. RECEITAS DO MÊS (apenas confirmadas no mês)
  SELECT COALESCE(SUM(valor), 0) INTO v_receitas_mes
  FROM app_lancamento
  WHERE conta_id = p_conta_id
    AND tipo = 'receita'
    AND status = 'confirmado'
    AND tipo_especial != 'saldo_inicial'
    AND EXTRACT(MONTH FROM data) = p_mes
    AND EXTRACT(YEAR FROM data) = p_ano;
  
  -- 3. DESPESAS DO MÊS (apenas confirmadas no mês)
  SELECT COALESCE(SUM(valor), 0) INTO v_despesas_mes
  FROM app_lancamento
  WHERE conta_id = p_conta_id
    AND tipo IN ('despesa', 'despesa_cartao')
    AND status = 'confirmado'
    AND EXTRACT(MONTH FROM data) = p_mes
    AND EXTRACT(YEAR FROM data) = p_ano;
  
  -- 4. RECEITAS PENDENTES (se for mês atual ou futuro)
  IF (p_ano > EXTRACT(YEAR FROM CURRENT_DATE)) OR 
     (p_ano = EXTRACT(YEAR FROM CURRENT_DATE) AND p_mes >= EXTRACT(MONTH FROM CURRENT_DATE)) THEN
    SELECT COALESCE(SUM(valor), 0) INTO v_receitas_pendentes
    FROM app_lancamento
    WHERE conta_id = p_conta_id
      AND tipo = 'receita'
      AND status = 'pendente'
      AND EXTRACT(MONTH FROM data) = p_mes
      AND EXTRACT(YEAR FROM data) = p_ano;
  ELSE
    v_receitas_pendentes := 0;
  END IF;
  
  -- 5. DESPESAS PENDENTES (se for mês atual ou futuro)
  IF (p_ano > EXTRACT(YEAR FROM CURRENT_DATE)) OR 
     (p_ano = EXTRACT(YEAR FROM CURRENT_DATE) AND p_mes >= EXTRACT(MONTH FROM CURRENT_DATE)) THEN
    SELECT COALESCE(SUM(valor), 0) INTO v_despesas_pendentes
    FROM app_lancamento
    WHERE conta_id = p_conta_id
      AND tipo IN ('despesa', 'despesa_cartao')
      AND status = 'pendente'
      AND EXTRACT(MONTH FROM data) = p_mes
      AND EXTRACT(YEAR FROM data) = p_ano;
  ELSE
    v_despesas_pendentes := 0;
  END IF;
  
  RETURN QUERY SELECT
    v_saldo_base,
    v_saldo_base + v_receitas_mes - v_despesas_mes AS saldo_atual,
    v_receitas_mes,
    v_despesas_mes,
    v_receitas_mes - v_despesas_mes AS fluxo_liquido,
    v_receitas_pendentes,
    v_despesas_pendentes,
    v_saldo_base + v_receitas_mes - v_despesas_mes + 
    v_receitas_pendentes - v_despesas_pendentes AS saldo_previsto;
END;
$$ LANGUAGE plpgsql;
```

#### 2.2. Função para Atualizar app_indicadores
```sql
CREATE OR REPLACE FUNCTION atualizar_indicadores_mes(
  p_user_id UUID,
  p_conta_id BIGINT,
  p_mes INTEGER,
  p_ano INTEGER
) RETURNS VOID AS $$
DECLARE
  v_calc RECORD;
BEGIN
  -- Calcular indicadores
  SELECT * INTO v_calc 
  FROM calcular_indicadores_mes(p_user_id, p_conta_id, p_mes, p_ano);
  
  -- Inserir ou atualizar app_indicadores
  INSERT INTO app_indicadores (
    user_id, conta_id, mes, ano,
    saldo_inicial, saldo_atual, saldo_previsto,
    receitas_confirmadas, despesas_confirmadas,
    receitas_pendentes, despesas_pendentes,
    fluxo_liquido
  ) VALUES (
    p_user_id, p_conta_id, p_mes, p_ano,
    v_calc.saldo_base,
    v_calc.saldo_atual,
    v_calc.saldo_previsto,
    v_calc.receitas_mes,
    v_calc.despesas_mes,
    v_calc.receitas_pendentes,
    v_calc.despesas_pendentes,
    v_calc.fluxo_liquido
  )
  ON CONFLICT (user_id, conta_id, mes, ano) DO UPDATE SET
    saldo_inicial = EXCLUDED.saldo_inicial,
    saldo_atual = EXCLUDED.saldo_atual,
    saldo_previsto = EXCLUDED.saldo_previsto,
    receitas_confirmadas = EXCLUDED.receitas_confirmadas,
    despesas_confirmadas = EXCLUDED.despesas_confirmadas,
    receitas_pendentes = EXCLUDED.receitas_pendentes,
    despesas_pendentes = EXCLUDED.despesas_pendentes,
    ultima_atualizacao = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

### FASE 3: SISTEMA DE TRIGGERS

#### 3.1. Trigger para Lançamentos
```sql
CREATE OR REPLACE FUNCTION trigger_atualizar_indicadores_lancamento()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Atualizar indicadores do mês do lançamento deletado
    PERFORM atualizar_indicadores_mes(
      OLD.user_id,
      OLD.conta_id,
      EXTRACT(MONTH FROM OLD.data)::INTEGER,
      EXTRACT(YEAR FROM OLD.data)::INTEGER
    );
    RETURN OLD;
  ELSE
    -- Atualizar indicadores do mês do novo/atualizado lançamento
    PERFORM atualizar_indicadores_mes(
      NEW.user_id,
      NEW.conta_id,
      EXTRACT(MONTH FROM NEW.data)::INTEGER,
      EXTRACT(YEAR FROM NEW.data)::INTEGER
    );
    
    -- Se mudou de mês, atualizar o mês antigo também
    IF TG_OP = 'UPDATE' AND OLD.data != NEW.data THEN
      PERFORM atualizar_indicadores_mes(
        OLD.user_id,
        OLD.conta_id,
        EXTRACT(MONTH FROM OLD.data)::INTEGER,
        EXTRACT(YEAR FROM OLD.data)::INTEGER
      );
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_indicadores_lancamento ON app_lancamento;
CREATE TRIGGER trigger_indicadores_lancamento
AFTER INSERT OR UPDATE OR DELETE ON app_lancamento
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_indicadores_lancamento();
```

#### 3.2. Trigger para Contas (mudança de saldo inicial)
```sql
CREATE OR REPLACE FUNCTION trigger_atualizar_indicadores_conta()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mudou saldo_inicial, recalcular todos os meses
  IF NEW.saldo_inicial != OLD.saldo_inicial THEN
    -- Atualizar lançamento de saldo inicial
    UPDATE app_lancamento
    SET valor = NEW.saldo_inicial
    WHERE conta_id = NEW.id
      AND tipo_especial = 'saldo_inicial';
    
    -- Recalcular todos os indicadores desta conta
    PERFORM atualizar_todos_indicadores_conta(NEW.id, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_indicadores_conta ON app_conta;
CREATE TRIGGER trigger_indicadores_conta
AFTER UPDATE ON app_conta
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_indicadores_conta();
```

---

### FASE 4: ATUALIZAR SERVIÇOS FRONTEND

#### 4.1. Criar SaldoService.ts (Simplificado)
```typescript
// src/services/api/SaldoService.ts
import { BaseApi } from './BaseApi';

export interface IndicadoresMes {
  id: number;
  user_id: string;
  conta_id: number;
  mes: number;
  ano: number;
  saldo_inicial: number;
  saldo_atual: number;
  saldo_previsto: number;
  receitas_confirmadas: number;
  despesas_confirmadas: number;
  receitas_pendentes: number;
  despesas_pendentes: number;
  fluxo_liquido: number;
  projecao_fim_mes: number;
  taxa_economia: number;
  ultima_atualizacao: string;
}

export class SaldoService extends BaseApi {
  /**
   * Busca indicadores de um mês específico
   */
  async getIndicadoresMes(mes: number, ano: number, contaId?: number): Promise<IndicadoresMes | null> {
    const user = await this.getUser();
    if (!user) return null;

    const query = this.supabase
      .from('app_indicadores')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes', mes)
      .eq('ano', ano);

    if (contaId) {
      query.eq('conta_id', contaId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Erro ao buscar indicadores:', error);
      return null;
    }

    return data;
  }

  /**
   * Força recálculo de indicadores de um mês
   */
  async recalcularMes(mes: number, ano: number, contaId: number): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;

    const { error } = await this.supabase.rpc('atualizar_indicadores_mes', {
      p_user_id: user.id,
      p_conta_id: contaId,
      p_mes: mes,
      p_ano: ano
    });

    if (error) {
      console.error('Erro ao recalcular indicadores:', error);
      return false;
    }

    return true;
  }
}

export const saldoService = new SaldoService();
```

#### 4.2. Atualizar DashboardPage.tsx
```typescript
// src/pages/dashboard/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { saldoService } from '../../services/api/SaldoService';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndicadores();
  }, [selectedMonth, selectedYear]);

  const fetchIndicadores = async () => {
    setLoading(true);
    const data = await saldoService.getIndicadoresMes(selectedMonth, selectedYear);
    setIndicadores(data);
    setLoading(false);
  };

  // Navegação mensal
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Resto do componente usando indicadores...
}
```

#### 4.3. Atualizar AccountService.ts
```typescript
// Adicionar ao criar conta
async createAccount(data: AccountFormData): Promise<Account | null> {
  // ... criar conta ...
  
  // Criar lançamento de saldo inicial se houver
  if (data.saldo_inicial > 0) {
    await this.supabase.from('app_lancamento').insert({
      descricao: `Saldo Inicial - ${data.nome}`,
      valor: data.saldo_inicial,
      tipo: 'receita',
      data: new Date().toISOString().split('T')[0],
      status: 'confirmado',
      categoria_id: 11, // ID da categoria "Saldo Inicial"
      conta_id: account.id,
      user_id: user.id,
      tipo_especial: 'saldo_inicial'
    });
  }
  
  return account;
}
```

---

### FASE 5: TESTES E VALIDAÇÃO

#### 5.1. Script de Teste
```sql
-- Testar cálculos para agosto/2025
SELECT * FROM calcular_indicadores_mes(
  'c5fc868a-eadb-43b1-8d3c-cad7e103fb33',
  1,
  8,
  2025
);

-- Resultado esperado:
-- saldo_base: 6500 (saldo inicial)
-- saldo_atual: 7500 (6500 + 1000)
-- receitas_mes: 1000
-- despesas_mes: 0
-- fluxo_liquido: 1000
-- saldo_previsto: 7500
```

#### 5.2. Validações a Fazer
- [ ] Dashboard mostra dados corretos para cada mês
- [ ] Navegação mensal funciona
- [ ] Criar nova conta gera lançamento de saldo inicial
- [ ] Ajustar saldo gera lançamento de ajuste
- [ ] Triggers atualizam app_indicadores automaticamente
- [ ] Performance adequada com muitos lançamentos

---

### FASE 6: MELHORIAS FUTURAS

#### 6.1. Edge Functions (Opcional)
```typescript
// supabase/functions/recalculate-all-indicators
export async function recalculateAllIndicators(userId: string) {
  // Recalcular todos os indicadores de todos os meses
  // Útil para correções em massa ou importações
}
```

#### 6.2. Sistema de Cartão de Crédito
```sql
-- View para faturas abertas
CREATE VIEW v_faturas_abertas AS
SELECT 
  cartao_id,
  EXTRACT(MONTH FROM data) as mes,
  EXTRACT(YEAR FROM data) as ano,
  SUM(valor) as valor_total
FROM app_lancamento
WHERE tipo = 'despesa_cartao'
  AND status = 'pendente'
GROUP BY cartao_id, EXTRACT(MONTH FROM data), EXTRACT(YEAR FROM data);
```

#### 6.3. Constraints de Integridade
```sql
-- Garantir que lançamento.user_id = conta.user_id
ALTER TABLE app_lancamento
ADD CONSTRAINT check_user_conta
CHECK (user_id = (SELECT user_id FROM app_conta WHERE id = conta_id));
```

---

## 📊 RESULTADO FINAL ESPERADO

### Para o usuário `victor.barbieri91@gmail.com`:

#### Agosto/2025:
- **Saldo Inicial**: R$ 6.500,00
- **Receitas do Mês**: R$ 1.000,00 (Água)
- **Despesas do Mês**: R$ 0,00
- **Fluxo Líquido**: R$ 1.000,00
- **Saldo Atual**: R$ 7.500,00
- **Saldo Previsto**: R$ 7.500,00

### Benefícios:
1. ✅ Dados sempre consistentes
2. ✅ Cálculos automáticos via triggers
3. ✅ Dashboard performático (apenas lê dados)
4. ✅ Navegação mensal funcional
5. ✅ Histórico completo preservado
6. ✅ Base para futuras features (IA, relatórios, etc.)

---

## 🚀 ORDEM DE EXECUÇÃO

1. **Backup dos dados** (SEMPRE PRIMEIRO!)
2. **Limpeza da base**
3. **Criar lançamento de saldo inicial**
4. **Reescrever funções SQL**
5. **Criar triggers**
6. **Atualizar frontend**
7. **Testar tudo**
8. **Deploy**

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Fazer backup antes de qualquer mudança**
2. **Testar em ambiente de desenvolvimento primeiro**
3. **Validar cada fase antes de prosseguir**
4. **Documentar qualquer desvio do plano**
5. **Manter usuário informado do progresso**

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

- Data de início: 24/08/2025
- Tempo estimado: 4-6 horas
- Risco: Médio (devido a mudanças em produção)
- Rollback: Possível via backup

---

## ✅ CHECKLIST FINAL

- [ ] Backup realizado
- [ ] Base limpa
- [ ] Lançamentos iniciais criados
- [ ] Funções SQL reescritas
- [ ] Triggers funcionando
- [ ] Frontend atualizado
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Deploy realizado
- [ ] Monitoramento ativo

---

**FIM DO PLANO**