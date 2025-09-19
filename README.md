# Barsi Web - Sistema Financeiro Pessoal

Sistema completo de gestão financeira pessoal desenvolvido com React, TypeScript e Supabase.

## 🚀 Funcionalidades

- ✅ **Gestão de Contas**: Contas correntes, poupança, investimentos e carteira
- ✅ **Transações**: Receitas, despesas e transferências entre contas
- ✅ **Categorização**: 13 categorias padrão para organização
- ✅ **Cartões de Crédito**: Gestão completa de faturas e limites
- ✅ **Orçamento**: Controle mensal por categoria
- ✅ **Metas Financeiras**: Definição e acompanhamento de objetivos
- ✅ **Dashboard**: Visão geral com gráficos e indicadores
- ⚠️ **Chat IA**: Análise financeira inteligente (requer OpenAI)
- ⚠️ **Gamificação**: Sistema de história e conquistas

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + Design System customizado
- **State Management**: React Context
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js + Recharts
- **AI**: OpenAI GPT-4o-mini (opcional)

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta OpenAI (opcional, para funcionalidades de IA)

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd barsi_web
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas credenciais:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `VITE_OPENAI_API_KEY`: Chave da API OpenAI (opcional)

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

## 🎯 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (localhost:5173)
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

## 🗃 Estrutura do Banco de Dados

O projeto utiliza um schema completo no Supabase com as seguintes tabelas principais:

- `app_perfil` - Perfis de usuários
- `app_conta` - Contas bancárias
- `app_transacoes` - Transações financeiras
- `app_categoria` - Categorias de transações
- `app_cartao_credito` - Cartões de crédito
- `app_orcamento` - Orçamentos mensais
- `app_meta_financeira` - Metas financeiras

## 🎨 Design System

O projeto utiliza um design system customizado "Vitto" com:
- Paleta de cores coral e azul profundo
- Efeitos glassmorphism
- Componentes modernos e responsivos
- Modo escuro nativo

## 🚀 Deploy

O projeto está configurado para deploy em:
- **Vercel** (recomendado)
- **Netlify**
- **GitHub Pages**

### Deploy na Vercel

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push

## 📱 Responsividade

O sistema é completamente responsivo e otimizado para:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) habilitado
- Variáveis de ambiente para credenciais
- Validação de dados com Zod

## 📊 Status do Projeto

**Produção Ready**: 85-90%

- ✅ Sistema de contas e transações
- ✅ Interface completa e responsiva
- ✅ Autenticação e segurança
- ⚠️ Integração de dados reais no dashboard
- ⚠️ Configuração de IA (opcional)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💬 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email do projeto.