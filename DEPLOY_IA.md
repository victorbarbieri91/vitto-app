# 🚀 DEPLOY DA IA FINANCEIRA - GUIA COMPLETO

## 🔧 PRÉ-REQUISITOS

### 1. Verificar se a chave DeepSeek está configurada no Supabase
```bash
# Verificar se a secret está configurada
supabase secrets list

# Se não estiver, configurar:
supabase secrets set DEEPSEEK_API_KEY=sua_chave_aqui
```

### 2. Verificar variáveis de ambiente no .env
```env
VITE_SUPABASE_URL=https://omgrgbyexbxtqoyewwra.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## 📦 DEPLOY DAS EDGE FUNCTIONS

### 1. Fazer deploy da função ai-chat
```bash
# Deploy da edge function
supabase functions deploy ai-chat

# Verificar se foi deployada corretamente
supabase functions list
```

### 2. Testar a Edge Function
```bash
# Testar localmente (se necessário)
supabase start
supabase functions serve

# Ou testar diretamente no projeto remoto
curl -X POST https://omgrgbyexbxtqoyewwra.supabase.co/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua_anon_key" \
  -d '{"messages": [{"role": "user", "content": "Olá"}], "userId": "test"}'
```

## 🎮 TESTANDO A IA NO SISTEMA

### 1. Comandos para testar no chat:

#### Consultas Básicas:
- "Qual meu saldo atual?"
- "Listar minhas últimas 5 transações"
- "Quais são minhas contas?"

#### Criação de Transações:
- "Gastei 50 reais no supermercado"
- "Recebi 100 reais de freelance"
- "Paguei 80 reais de luz"

#### Análises (quando RAG estiver implementado):
- "Como estão meus gastos este mês?"
- "Estou gastando mais que o normal?"

### 2. Logs para Debug:
```bash
# Ver logs da edge function
supabase functions logs ai-chat

# Ver logs em tempo real
supabase functions logs ai-chat --follow
```

## 🐛 TROUBLESHOOTING

### Problema: "VITE_SUPABASE_URL não configurada"
**Solução:** Verificar se as variáveis estão no .env

### Problema: "DEEPSEEK_API_KEY not configured"
**Solução:** Configurar a secret no Supabase
```bash
supabase secrets set DEEPSEEK_API_KEY=sk-sua-chave-aqui
```

### Problema: "Function not found"
**Solução:** Verificar se a função foi deployada
```bash
supabase functions deploy ai-chat
```

### Problema: Erros de CORS
**Solução:** A função já está configurada para CORS, mas verificar se o domínio está correto

### Problema: Streaming não funciona
**Solução:** Verificar se o DeepSeek está retornando streaming response

## 📊 PRÓXIMOS PASSOS

### 1. Implementar RAG (Sistema de Busca Inteligente)
- Criar tabela de embeddings
- Implementar sincronização automática
- Adicionar tools de análise complexa

### 2. Adicionar Processamento de PDFs
- Integrar Vision Parse
- Criar interface de upload
- Implementar extração automática

### 3. Melhorias na Interface
- Indicadores visuais melhores
- Histórico de conversas
- Sugestões contextuais

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### 1. Frontend
- Chat aparece no dashboard
- Consegue digitar mensagens
- Mostra "Digitando..." quando processando

### 2. Backend
- Edge function responde sem erro
- Logs mostram classificação de queries
- Tools são executadas corretamente

### 3. Integração
- Transações criadas aparecem no dashboard
- Consultas retornam dados reais
- Confirmações funcionam

## ⚠️ LIMITAÇÕES ATUAIS

### 1. Sem RAG ainda
- Análises complexas limitadas
- Não lembra contexto histórico completo

### 2. Sem processamento de PDF
- Upload de documentos ainda não implementado

### 3. Tools básicas
- Apenas consultas e criação simples de transações
- Falta edição e exclusão

## 🎯 TESTE DE ACEITAÇÃO

Para considerar a IA funcional, deve conseguir:

1. ✅ Responder "Qual meu saldo atual?"
2. ✅ Listar transações recentes
3. ✅ Criar transação via comando natural
4. ✅ Classificar queries automaticamente
5. ✅ Streaming de respostas
6. ✅ Integração com banco de dados real

## 📝 NOTAS IMPORTANTES

- A IA usa dados REAIS do usuário logado
- Todas as ações são confirmadas antes de executar
- Transações criadas têm status 'pendente' por segurança
- System prompt adaptado para comportamento financeiro brasileiro
- Suporte completo a CORS para frontend React