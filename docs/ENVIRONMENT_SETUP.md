# 🌍 Configuração de Variáveis de Ambiente

## 📁 **Arquivo .env Obrigatório**

Crie um arquivo `.env` na **raiz do projeto** com as seguintes variáveis:

```bash
# Configurações do Supabase - Projeto Vitto
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sua-chave-aqui

# Configurações da IA - OpenAI API
VITE_OPENAI_API_KEY=sk-proj-...sua-chave-openai-aqui
VITE_AI_MODEL=gpt-4o-mini
VITE_AI_ENABLED=true
```

## 🔍 **Como Obter as Variáveis**

### **Supabase (Banco de Dados)**

#### **1. VITE_SUPABASE_URL**
1. Acesse: https://supabase.com/dashboard
2. Selecione projeto "barsi app"
3. Navegue: **Settings → API**
4. Copie: **Project URL**

#### **2. VITE_SUPABASE_ANON_KEY**
1. Na mesma página (Settings → API)
2. Copie: **anon public** key
3. ⚠️ **NÃO** use a `service_role` key (perigosa no frontend)

### **OpenAI (Inteligência Artificial)**

#### **3. VITE_OPENAI_API_KEY**
1. Acesse: https://platform.openai.com/api-keys
2. Clique: **"Create new secret key"**
3. Nome: **"Vitto Financial Assistant"**
4. Copie a chave gerada (inicia com `sk-proj-...`)
5. ⚠️ **Importante**: Você só verá a chave uma vez!

#### **4. VITE_AI_MODEL**
- **Desenvolvimento**: `gpt-4o-mini` (mais barato, boa qualidade)
- **Produção**: `gpt-4o` (melhor qualidade, mais caro)

#### **5. VITE_AI_ENABLED**
- **true**: IA habilitada
- **false**: Desabilitar IA (modo simulado)

## 🔒 **Segurança**

### ✅ **Boas Práticas:**
- ✅ Arquivo `.env` está no `.gitignore`
- ✅ Use apenas `anon public` key do Supabase
- ✅ Nunca commite o `.env`
- ✅ Use `gpt-4o-mini` em desenvolvimento
- ✅ Monitore uso da API OpenAI

### ❌ **NUNCA faça:**
- ❌ Commit do arquivo `.env`
- ❌ Usar `service_role` key no frontend
- ❌ Compartilhar tokens em código ou chat
- ❌ Hardcoded tokens no código
- ❌ Expor chave OpenAI publicamente

## 💰 **Custos da OpenAI**

### **Estimativas de Uso:**
- **gpt-4o-mini**: ~$0.15 por 1M tokens (~1,500 interações)
- **gpt-4o**: ~$2.50 por 1M tokens (~1,500 interações)

### **Controle de Custos:**
1. Configure limites na OpenAI Dashboard
2. Monitore uso em: https://platform.openai.com/usage
3. Use `gpt-4o-mini` para desenvolvimento
4. Implemente cache de respostas (futuro)

## 📋 **Checklist de Setup**

- [ ] Criar arquivo `.env` na raiz
- [ ] **Supabase:**
  - [ ] Copiar `Project URL` para `VITE_SUPABASE_URL`
  - [ ] Copiar `anon public` key para `VITE_SUPABASE_ANON_KEY`
- [ ] **OpenAI:**
  - [ ] Criar conta OpenAI (se não tiver)
  - [ ] Gerar API key em https://platform.openai.com/api-keys
  - [ ] Copiar para `VITE_OPENAI_API_KEY`
  - [ ] Definir `VITE_AI_MODEL=gpt-4o-mini`
  - [ ] Definir `VITE_AI_ENABLED=true`
- [ ] Testar conexão (npm run dev)
- [ ] Verificar se `.env` está no `.gitignore`

## 🧪 **Testando a Configuração**

Depois de criar o `.env`, teste:

```bash
npm run dev
```

### **Possíveis Erros:**

1. **Erro Supabase**: Verifique URL e chave
2. **Erro OpenAI**: Verifique chave API válida
3. **Erro de CORS**: Normal para OpenAI (será via Supabase Edge Functions)
4. **Quota excedida**: Verifique créditos OpenAI

## ⚡ **Próxima Etapa**

Com as variáveis configuradas, a IA estará pronta para:
- ✅ Interpretar comandos em linguagem natural
- ✅ Executar operações financeiras reais
- ✅ Gerar insights personalizados
- ✅ Responder perguntas sobre finanças

---

**📅 Atualizado**: Janeiro 2025 - FASE 3  
**🎯 Projeto**: Vitto - IA Integrada 