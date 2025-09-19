# Instruções de Migração - Novo Projeto Supabase

## Informações do Novo Projeto
- **Project ID**: omgrgbyexbxtqoyewwra
- **URL**: https://omgrgbyexbxtqoyewwra.supabase.co
- **ANON_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZ3JnYnlleGJ4dHFveWV3d3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjE1MTcsImV4cCI6MjA2NzYzNzUxN30.psv6vYM8IYcvb2lFUfALO_kbT6ItBCb728vU8C9dVM8

## Status Atual
✅ Arquivo .env atualizado com as novas credenciais
✅ Backup do .env anterior salvo em .env.backup
✅ Script de migração completo disponível em `migration_complete_supabase.sql`

## Como Executar a Migração

### Opção 1: Via Dashboard Supabase (RECOMENDADO)

1. **Acesse o SQL Editor do novo projeto:**
   https://supabase.com/dashboard/project/omgrgbyexbxtqoyewwra/sql/new

2. **Execute o script de migração:**
   - Copie TODO o conteúdo do arquivo `migration_complete_supabase.sql`
   - Cole no SQL Editor
   - Clique em "Run" (ou pressione Ctrl+Enter)

3. **Verifique a criação das tabelas:**
   - Acesse: https://supabase.com/dashboard/project/omgrgbyexbxtqoyewwra/editor
   - Verifique se todas as 12 tabelas foram criadas:
     - app_perfil
     - app_conta_grupo
     - app_conta
     - app_categoria
     - app_cartao_credito
     - app_fatura
     - app_transacoes_fixas
     - app_transacoes
     - app_orcamento
     - app_meta_financeira
     - app_saldo_historico
     - app_indicadores

4. **Teste a aplicação:**
   ```bash
   npm run dev
   ```
   - Acesse http://localhost:5173
   - Faça login/registro
   - Verifique se tudo está funcionando

### Opção 2: Via Supabase CLI (Alternativa)

Se você tiver o Supabase CLI configurado com acesso ao novo projeto:

```bash
# Conectar ao novo projeto
supabase link --project-ref omgrgbyexbxtqoyewwra

# Executar migração
supabase db push migration_complete_supabase.sql
```

## Estrutura Criada

A migração criará:
- ✅ 12 tabelas principais com RLS
- ✅ Sistema de usuários integrado com Supabase Auth
- ✅ Métricas financeiras automatizadas
- ✅ Histórico de saldos para auditoria
- ✅ Transações recorrentes
- ✅ Categorias padrão do sistema
- ✅ Triggers para automação
- ✅ Funções para cálculos financeiros
- ✅ Índices para performance

## Verificação Pós-Migração

1. **Verificar Extensões:**
   - uuid-ossp
   - pgcrypto

2. **Verificar RLS:**
   - Todas as tabelas devem ter RLS habilitado
   - Políticas devem estar criadas

3. **Verificar Categorias Padrão:**
   - Deve haver 13 categorias padrão criadas

4. **Testar Registro de Usuário:**
   - Criar um novo usuário deve automaticamente criar um perfil em app_perfil

## Troubleshooting

### Erro de Permissão
Se receber erro de permissão, verifique se:
- Está logado no Dashboard Supabase
- Tem acesso ao projeto omgrgbyexbxtqoyewwra

### Erro de Sintaxe SQL
- Certifique-se de copiar TODO o arquivo SQL
- Execute o script completo de uma vez

### Aplicação não conecta
- Verifique se o .env foi atualizado
- Reinicie o servidor de desenvolvimento (npm run dev)
- Limpe o cache do navegador

## Dados de Migração

**NOTA**: O projeto anterior (jjsjzfpksblhztsfqkzk) tem todas as tabelas vazias (0 registros), então não há dados para migrar, apenas a estrutura.

## Próximos Passos

Após a migração bem-sucedida:
1. Testar autenticação (registro/login)
2. Criar primeira conta bancária
3. Adicionar transações de teste
4. Verificar dashboard e indicadores