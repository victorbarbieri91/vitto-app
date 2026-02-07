# 🚀 Guia Completo do Supabase - Projeto Vitto

## 📋 **Configuração do Ambiente (.env)**

### O que é o arquivo .env?
O arquivo `.env` armazena variáveis de ambiente que são carregadas durante a execução da aplicação. É essencial para:
- Manter informações sensíveis fora do código
- Diferentes configurações para desenvolvimento/produção
- Facilitar deploy e configuração

### ⚙️ **Configuração Obrigatória**

Crie um arquivo `.env` na **raiz do projeto** com:

```bash
# Configurações do Supabase - Projeto Vitto
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sua-chave-aqui
```

### 🔍 **Como Obter as Variáveis:**

1. **Acesse**: https://supabase.com/dashboard
2. **Selecione**: Projeto "barsi app" (ou nome do seu projeto)
3. **Navegue**: Settings → API
4. **Copie**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### ⚠️ **Segurança Importante:**
- ✅ O arquivo `.env` está no `.gitignore`
- ❌ **NUNCA** commite o `.env` no git
- ✅ Use `.env.example` para documentar variáveis
- ❌ **NUNCA** use a `service_role key` no frontend

---

## 🏗️ **Estrutura do Banco de Dados**

### 📊 **Tabelas Principais (Padrão app_*)**

```sql
-- ✅ TABELAS QUE USAMOS (Padrão app_*)
app_perfil          # Perfis dos usuários
app_conta           # Contas bancárias
app_conta_grupo     # Grupos de contas
app_categoria       # Categorias de transações
app_lancamento      # Transações/lançamentos
app_lancamento_recorrente  # Transações recorrentes
app_cartao_credito  # Cartões de crédito
app_fatura          # Faturas dos cartões
app_orcamento       # Orçamentos mensais

-- ❌ TABELA FORA DO PADRÃO (PRECISA AJUSTAR)
dashboard_summary   # → DEVE SER: app_resumo_dashboard
```

### 🔄 **Convenções de Nomenclatura:**
- **Prefixo**: Sempre `app_` para nossas tabelas
- **Idioma**: Português brasileiro
- **Formato**: snake_case (ex: `app_conta_grupo`)
- **Evitar**: Misturar com tabelas antigas

---

## 🛠️ **Uso do Supabase CLI vs MCP**

### 📝 **Política de Uso Estabelecida:**

#### ✅ **Supabase CLI - Para Deploy:**
```bash
# Instalar CLI
npm install supabase --save-dev

# Inicializar projeto local
npx supabase init

# Conectar com projeto remoto
npx supabase link --project-ref [PROJECT_ID]

# Deploy de funções, migrations, etc
npx supabase db push
npx supabase functions deploy
```

#### ✅ **MCP Supabase - Para Consultas (CONFIGURADO ✅):**
- Buscar informações das tabelas
- Executar queries de consulta
- Análise de dados
- Debugging e investigação
- **Arquivo**: `.cursor/mcp.json` (criado)
- **Modo**: Read-only (seguro)
- **Instruções**: Ver `docs/MCP_SETUP_INSTRUCTIONS.md`

#### ❌ **O que NÃO fazer:**
- **NÃO** usar MCP para deploy (remove funções)
- **NÃO** misturar os dois para deploy

---

## 🔧 **Implementação no Código**

### 📁 **Estrutura de Arquivos:**
```
src/
├── services/supabase/
│   └── client.ts           # Cliente configurado
├── types/
│   ├── supabase.ts         # Tipos gerados automaticamente
│   └── supabase.d.ts       # Definições extras
├── services/api/
│   ├── BaseApi.ts          # Classe base para APIs
│   ├── AccountService.ts   # Serviço de contas
│   ├── TransactionService.ts # Serviço de transações
│   └── CategoryService.ts  # Serviço de categorias
└── store/
    └── AuthContext.tsx     # Contexto de autenticação
```

### 🔐 **Autenticação (AuthContext.tsx):**
```typescript
// Features implementadas:
✅ Login/logout automático
✅ Timer de inatividade (30 min)
✅ Criação automática de perfil
✅ Gerenciamento de sessão
✅ Estados de loading/error
```

### 📊 **Serviços de API:**
```typescript
// Padrão de implementação:
export class AccountService extends BaseApi {
  async fetchAccounts(): Promise<Account[]> {
    const user = await this.getCurrentUser();
    const { data, error } = await this.supabase
      .from('app_conta')  // ✅ Usa padrão app_*
      .select('*')
      .eq('user_id', user.id);
    return data || [];
  }
}
```

---

## 🚨 **Problemas Identificados e Soluções**

### ❌ **Problema 1: Tabela fora do padrão**
```sql
-- ATUAL (incorreto):
dashboard_summary

-- DEVE SER:
app_resumo_dashboard
```
**Solução**: Migration para renomear tabela

### ❌ **Problema 2: Dashboard com dados mocados**
```typescript
// ATUAL (incorreto):
const [summary] = useState({
  totalAccounts: 12500.75,  // ❌ Dados fixos
  totalExpenses: 1850.40,   // ❌ Dados fixos
});

// DEVE SER:
const { data: summary } = useDashboardSummary();  // ✅ Dados reais
```

### ❌ **Problema 3: Falta configuração .env**
**Solução**: Criar arquivo `.env` com variáveis do Supabase

---

## 📚 **Comandos Úteis do CLI**

### 🏠 **Setup Local:**
```bash
# Instalar e configurar
npm install supabase --save-dev
npx supabase login
npx supabase init
npx supabase link --project-ref [PROJECT_ID]

# Sincronizar com remoto
npx supabase db pull
```

### 🔄 **Desenvolvimento:**
```bash
# Ambiente local
npx supabase start       # Inicia containers locais
npx supabase status      # Verifica status
npx supabase stop        # Para containers

# Migrations
npx supabase migration new create_new_table
npx supabase db push     # Aplica migrations no remoto
npx supabase db reset    # Reset local
```

### 🚀 **Deploy:**
```bash
# Aplicar mudanças
npx supabase db push              # Deploy de schema/migrations
npx supabase functions deploy     # Deploy de edge functions
npx supabase secrets set KEY=value # Configurar secrets
```

---

## 🔍 **Debugging e Monitoramento**

### 📊 **Logs e Análise:**
```bash
# Logs de produção
npx supabase logs        # Logs gerais
npx supabase logs -f api # Logs da API

# Análise de performance
npx supabase inspect db  # Análise do banco
```

### 🐛 **Problemas Comuns:**

1. **Erro de conexão**: Verificar `.env`
2. **RLS (Row Level Security)**: Verificar políticas
3. **Tipos desatualizados**: Executar `npx supabase gen types`
4. **Migrations**: Resolver conflitos com `db pull`

---

## 📋 **Checklist de Setup**

### ✅ **Configuração Inicial:**
- [ ] Criar arquivo `.env` com variáveis
- [ ] Instalar Supabase CLI
- [ ] Conectar com projeto remoto
- [ ] Sincronizar tipos TypeScript
- [ ] Testar autenticação

### ✅ **Desenvolvimento:**
- [ ] Usar apenas tabelas `app_*`
- [ ] Seguir padrão dos serviços API
- [ ] Implementar error handling
- [ ] Testar em ambiente local
- [ ] Documentar novas features

### ✅ **Deploy:**
- [ ] Usar CLI para migrations
- [ ] Evitar MCP para mudanças de schema
- [ ] Testar em staging antes produção
- [ ] Backup antes grandes mudanças

---

## 🔒 **Segurança - Configurações Recomendadas**

### ⚠️ **Ação Manual Necessária: Proteção contra Senhas Vazadas**

O Supabase pode verificar se senhas usadas pelos usuários já foram vazadas em breaches de dados conhecidos (usando HaveIBeenPwned). Esta proteção está **desabilitada por padrão**.

**Para habilitar:**

1. Acesse o **Dashboard do Supabase**: https://supabase.com/dashboard
2. Selecione o projeto **Vitto** (omgrgbyexbxtqoyewwra)
3. Navegue para: **Authentication** → **Providers** → **Email**
4. Na seção **Password Security**, habilite:
   - ✅ **Leaked Password Protection** (Proteção contra senhas vazadas)
5. Clique em **Save**

**Por que isso é importante?**
- Previne que usuários usem senhas que já foram comprometidas
- Aumenta significativamente a segurança das contas
- É uma verificação silenciosa (não expõe a senha)

### ✅ **Configurações de Segurança Aplicadas (Migrations)**

As seguintes correções de segurança foram aplicadas via migrations:

| Correção | Status | Migration |
|----------|--------|-----------|
| RLS em `app_admin_users` | ✅ Aplicado | `enable_rls_app_admin_users` |
| `search_path` em funções SECURITY DEFINER | ✅ Aplicado | `add_search_path_via_alter` |
| Lógica de período de faturas | ✅ Corrigido | `fix_credit_card_invoice_period_v3` |

### 🔐 **Boas Práticas de Segurança**

1. **Row Level Security (RLS)**: Todas as tabelas devem ter RLS habilitado
2. **Funções SECURITY DEFINER**: Sempre usar `SET search_path TO 'public'`
3. **Chaves de API**: Nunca expor `service_role` key no frontend
4. **Policies**: Revisar policies regularmente

---

**📅 Última atualização**: Fevereiro 2026
**👨‍💻 Projeto**: Vitto - Assistente Financeiro Inteligente

---

## 📞 **Suporte e Referências**

- **Documentação oficial**: https://supabase.com/docs
- **CLI Referência**: https://supabase.com/docs/guides/cli
- **Comunidade**: https://github.com/supabase/supabase/discussions 