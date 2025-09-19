# Execução das Migrations do Módulo "Sua História"

## Instruções para executar as migrations manualmente

### Passo 1: Acesse o Dashboard do Supabase
1. Vá para: https://supabase.com/dashboard/project/jjsjzfpksblhztsfqkzk
2. Faça login na sua conta
3. Navegue até SQL Editor

### Passo 2: Execute a primeira migration (Tabelas principais)
Copie e cole o conteúdo do arquivo `supabase/migrations/20250708145745_create_historia_tables.sql` no SQL Editor e execute.

### Passo 3: Execute a segunda migration (Marcos iniciais)
Copie e cole o conteúdo do arquivo `supabase/migrations/20250708150021_create_historia_initial_milestones.sql` no SQL Editor e execute.

### Passo 4: Verificar se as tabelas foram criadas
Execute esta query para verificar:

```sql
-- Verificar se as tabelas existem
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename IN ('app_marco', 'app_badge') 
ORDER BY tablename;

-- Verificar se a view existe
SELECT 
  schemaname,
  viewname 
FROM pg_views 
WHERE viewname = 'app_evento_timeline';

-- Contar registros nas tabelas
SELECT 
  'app_marco' as tabela,
  count(*) as total
FROM app_marco
UNION ALL
SELECT 
  'app_badge' as tabela,
  count(*) as total
FROM app_badge;
```

### Passo 5: Testar a funcionalidade
Execute o teste de conexão:

```bash
npm run test:historia
```

Ou execute manualmente:

```bash
node test-historia-connection.js
```

## Estrutura das tabelas criadas

### app_marco
- Tabela principal para marcos da jornada
- Campos: id, user_id, categoria, titulo, descricao, valor_alvo, valor_atual, status, icon_slug, cor, created_at, updated_at, achieved_at

### app_badge
- Tabela para badges/conquistas extras
- Campos: id, user_id, nome, descricao, icon_slug, cor, created_at, unlocked_at

### app_evento_timeline (VIEW)
- View unificada que combina marcos e badges em ordem cronológica
- Usado para exibir a timeline na interface

## Funções auxiliares criadas

1. `create_system_milestone()` - Cria marcos automáticos do sistema
2. `complete_milestone()` - Completa um marco
3. `create_badge()` - Cria badges/conquistas
4. `create_initial_milestones()` - Cria marcos iniciais para novos usuários
5. `trigger_create_initial_milestones()` - Trigger para criar marcos automaticamente

## Políticas de segurança (RLS)

- Usuários só podem ver/editar seus próprios marcos e badges
- Badges não podem ser editados/deletados pelos usuários (apenas pelo sistema)
- Todas as operações são isoladas por user_id