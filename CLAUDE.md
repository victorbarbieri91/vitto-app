# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🤖 Memória do Claude - Regras Críticas

### ⚠️ NUNCA FAÇA ISSO
- ❌ NUNCA criar novas páginas/dashboards sem o usuário pedir explicitamente
- ❌ NUNCA duplicar componentes existentes - sempre reutilizar
- ❌ NUNCA sobrescrever trabalho já desenvolvido
- ❌ NUNCA criar novos componentes quando "dados reais" for solicitado - conectar dados aos existentes

### ✅ SEMPRE FAÇA ISSO
- ✅ Preservar o trabalho já desenvolvido
- ✅ Quando pedir "dados reais" = conectar dados aos componentes existentes
- ✅ Se tiver dúvidas, AVISAR o usuário antes de aplicar mudanças
- ✅ O dashboard DashboardPageModern com chat, saldo previsto, calendário e sistema de cores é a versão correta

## Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:5173)

# Build & Deploy
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint checks

# MCP Servers
claude mcp list          # List configured MCP servers
```

## MCP Servers Configured

The following MCP servers are available and connected for enhanced development capabilities:

### ✅ Playwright
- **Purpose**: Browser automation, UI testing, web scraping
- **Usage**: Automated testing of React components, E2E testing, screenshot capture
- **Benefits**: Test dashboard interactions, form validations, responsive design

### ✅ Supabase (PREFERIDO)
- **Purpose**: Direct database operations, schema management, real-time data
- **Usage**: Database queries, migrations, table management, real-time subscriptions  
- **Benefits**: Direct database access without API layer, schema introspection
- **⚠️ IMPORTANTE**: Use MCP Supabase para operações de banco de dados em vez da instância local

### ✅ Context7
- **Purpose**: Context analysis, AI-powered development assistance
- **Usage**: Code analysis, intelligent suggestions, codebase understanding
- **Benefits**: Enhanced code comprehension and development insights

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + Custom "Vitto" Design System
- **State**: React Context (AuthContext, ChatContext)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js, Recharts
- **AI**: OpenAI integration for chat and analysis

### Key Directories
- `src/services/api/` - Supabase API services (accounts, transactions, users)
- `src/services/ai/` - AI services (chat, analysis, predictions)
- `src/components/dashboard/` - Dashboard widgets and components
- `src/components/ui/` - Design system components
- `src/pages/` - Page components (Dashboard, Auth, etc.)
- `supabase/migrations/` - Database schema migrations

### Supabase Project Information
- **Organization**: Vitto-App (ID: tdqrbogvyzarsoiguift)
- **Project Name**: victor.barbieri91@gmail.com's Project
- **Remote Project ID**: omgrgbyexbxtqoyewwra
- **Region**: sa-east-1 (São Paulo, Brazil)
- **Production URL**: https://omgrgbyexbxtqoyewwra.supabase.co
- **Database Host**: db.omgrgbyexbxtqoyewwra.supabase.co
- **PostgreSQL Version**: 17.6.1.003

### Environment Setup Required
Create `.env` file with:
```
VITE_SUPABASE_URL=https://omgrgbyexbxtqoyewwra.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_AI_MODEL=gpt-4o-mini
VITE_AI_ENABLED=true
```

### Supabase Development Strategy
**PREFERIDO**: Use MCP Supabase server para operações de banco de dados
- Acesso direto ao projeto remoto (omgrgbyexbxtqoyewwra)
- Não requer instância local Docker
- Operações em tempo real no banco de produção

**Alternativo** (apenas se necessário):
```bash
supabase start           # Start local Supabase instance (requires Docker)
supabase stop            # Stop local instance
supabase status          # Check service status
supabase db reset        # Reset local database with migrations
```

## Current Implementation Status

### ✅ Production Ready (85-90%)
- **Accounts Management**: Full CRUD, balance tracking, multi-currency
- **Transactions**: Complete with categories, filters, recurring transactions
- **Authentication**: Supabase Auth with protected routes
- **Design System**: Custom "Vitto" theme with glassmorphism

### ⚠️ Needs Integration
- **Dashboard**: Currently using mock data - needs real data connection
- **AI Features**: Chat interface ready, needs OpenAI key configuration
- **Gamification**: História system implemented but needs activation

### Service Consolidation Needed
Multiple versions exist - use these primary services:
- `src/services/api/accounts.ts` - Account operations
- `src/services/api/transactions.ts` - Transaction operations
- `src/services/ai/chatService.ts` - AI chat functionality

## Design System Guidelines

### Color Palette
- Primary: Coral (#F87060)
- Secondary: Deep Blue (#102542)
- Background gradients with glassmorphism effects
- Dark mode with subtle animations

### Component Patterns
- All forms use React Hook Form + Zod
- Modals use Radix UI Dialog
- Tables use custom DataTable component
- Charts use consistent color schemes from design system

## Database Schema

Key tables in Supabase (todas com prefixo `app_`):
- `app_perfil` - Perfis de usuários
- `app_conta` - Contas bancárias com saldos e grupos
- `app_conta_grupo` - Grupos de contas
- `app_transacoes` - Transações financeiras unificadas
- `app_transacoes_fixas` - Transações recorrentes (salário, aluguel)
- `app_categoria` - Categorias de transações (13 categorias padrão)
- `app_cartao_credito` - Gestão de cartões de crédito
- `app_fatura` - Faturas de cartão
- `app_orcamento` - Controle de orçamento por categoria
- `app_meta_financeira` - Metas financeiras
- `app_saldo_historico` - Histórico de saldos (auditoria)
- `app_indicadores` - Métricas financeiras calculadas automaticamente

## Important Notes

1. **Service Layer**: Always use services in `src/services/api/` for data operations
2. **Type Safety**: All API responses have TypeScript types in `src/types/`
3. **Error Handling**: Use toast notifications for user feedback
4. **Real-time**: Supabase subscriptions available for live updates
5. **Mobile First**: All components responsive by default