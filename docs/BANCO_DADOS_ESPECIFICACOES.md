# 🗄️ **ESPECIFICAÇÕES DO BANCO DE DADOS - VITTO FINANCIAL**

## **🚨 FOCO: BÁSICO FUNCIONAL PRIMEIRO**

### **Priorização:**
- **Etapa 1**: CRUD básico funcionando (usar tabelas existentes)
- **Etapa 2**: Cálculos automáticos
- **Etapa 3**: Features avançadas

---

## **📋 TABELAS EXISTENTES**

### **app_perfil** - ✅ FUNCIONANDO
```sql
CREATE TABLE app_perfil (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **app_categoria** - ✅ FUNCIONANDO  
```sql
CREATE TABLE app_categoria (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT,
  icone TEXT,
  user_id UUID REFERENCES auth.users(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**TODO:** Página de gestão de categorias (CRUD completo)

### **app_conta** - ❌ NÃO FUNCIONAL
```sql
CREATE TABLE app_conta (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'carteira')),
  saldo_inicial NUMERIC(15,2) DEFAULT 0,
  saldo_atual NUMERIC(15,2) DEFAULT 0,
  cor TEXT,
  icone TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**TODO IMEDIATO:** Página funcional de CRUD completo

### **app_lancamento** - ❌ NÃO FUNCIONAL (PRIORIDADE MÁXIMA)
```sql
CREATE TABLE app_lancamento (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data DATE DEFAULT CURRENT_DATE,
  tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  categoria_id BIGINT NOT NULL REFERENCES app_categoria(id),
  conta_id BIGINT REFERENCES app_conta(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**TODO IMEDIATO:** Página funcional de CRUD lançamentos

### **app_orcamento** - ❌ NÃO EXISTE (IMPLEMENTAR)
```sql
CREATE TABLE app_orcamento (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  categoria_id BIGINT NOT NULL REFERENCES app_categoria(id),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020),
  valor_planejado NUMERIC(15,2) NOT NULL,
  valor_gasto NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, categoria_id, mes, ano)
);
```
**TODO:** Criar tabela e página básica de orçamentos

---

## **🎯 PLANO DE IMPLEMENTAÇÃO**

### **📅 SEMANA 1-2: CRUD BÁSICO**
```
✅ 1. app_conta - Página funcional (CRUD completo)
⏳ 2. app_lancamento - Página funcional (CRUD completo)  
⏳ 3. app_categoria - Página funcional (CRUD completo)
⏳ 4. app_orcamento - Criar tabela + página básica
```

### **📅 SEMANA 3-4: DASHBOARD COM DADOS REAIS**
```
⏳ 1. Queries para buscar dados reais
⏳ 2. Substituir dados mockados
⏳ 3. Estados de loading/vazio
⏳ 4. Cálculos manuais básicos
```

---

## **🔧 FUNÇÕES SQL BÁSICAS**

### **Calcular Saldo Conta**
```sql
CREATE OR REPLACE FUNCTION calcular_saldo_conta(p_conta_id BIGINT)
RETURNS NUMERIC AS $$
DECLARE
  v_saldo_inicial NUMERIC;
  v_receitas NUMERIC;
  v_despesas NUMERIC;
BEGIN
  SELECT saldo_inicial INTO v_saldo_inicial
  FROM app_conta WHERE id = p_conta_id;
  
  SELECT COALESCE(SUM(valor), 0) INTO v_receitas
  FROM app_lancamento 
  WHERE conta_id = p_conta_id AND tipo = 'receita';
  
  SELECT COALESCE(SUM(valor), 0) INTO v_despesas
  FROM app_lancamento 
  WHERE conta_id = p_conta_id AND tipo = 'despesa';
  
  RETURN v_saldo_inicial + v_receitas - v_despesas;
END;
$$ LANGUAGE plpgsql;
```

### **Buscar Resumo Mensal**
```sql
CREATE OR REPLACE FUNCTION get_resumo_mensal(p_user_id UUID)
RETURNS TABLE(
  total_receitas NUMERIC,
  total_despesas NUMERIC,
  saldo_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) as total_receitas,
    COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) as total_despesas,
    (SELECT SUM(calcular_saldo_conta(c.id)) FROM app_conta c WHERE c.user_id = p_user_id) as saldo_total
  FROM app_lancamento l
  WHERE l.user_id = p_user_id
    AND EXTRACT(MONTH FROM l.data) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM l.data) = EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;
```

---

## **📋 CHECKLIST DE IMPLEMENTAÇÃO**

### **✅ Semana 1-2: CRUD Funcionais**
- [ ] **Contas**: Redesign + CRUD completo
- [ ] **Lançamentos**: Implementar página completa  
- [ ] **Categorias**: Implementar página completa
- [ ] **Orçamentos**: Criar tabela + página básica
- [ ] **Dashboard**: Conectar com dados reais

### **✅ Semana 3-4: Sistema Básico Completo**
- [ ] **Dados reais**: Dashboard sem mockups
- [ ] **Validações**: Regras de negócio
- [ ] **Performance**: Queries otimizadas
- [ ] **Estados**: Loading/error/vazio

---

**🎯 PRINCÍPIO:**
```
PRIMEIRO: Fazer CRUD básico funcionar 100%
DEPOIS: Adicionar automação e inteligência
```

**📍 Status:** FOCO NO BÁSICO FUNCIONAL  
**Próximo:** Implementar CRUD das páginas principais  
**Meta:** Sistema básico operacional em 2 semanas ⭐