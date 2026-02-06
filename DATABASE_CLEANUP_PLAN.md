# Plano de Limpeza e Otimização do Banco de Dados

**Data:** 01/02/2026
**Projeto:** Vitto Finanças
**Banco:** Supabase (omgrgbyexbxtqoyewwra)

---

## Resumo Executivo

| Métrica | Quantidade |
|---------|------------|
| Total de tabelas | 38 |
| Tabelas com dados | 21 |
| Tabelas vazias | 17 |
| **Candidatas para remoção** | **13-17** |

---

## 1. TABELAS ESSENCIAIS (MANTER)

### Core Financeiro (11 tabelas) ✅

| Tabela | Registros | Função | Status |
|--------|-----------|--------|--------|
| `app_perfil` | 2 | Perfis de usuários | ✅ Essencial |
| `app_conta` | 17 | Contas bancárias | ✅ Essencial |
| `app_categoria` | 3 | Categorias customizadas | ✅ Essencial |
| `app_transacoes` | 605 | Transações financeiras | ✅ Essencial |
| `app_transacoes_fixas` | 20 | Transações recorrentes | ✅ Essencial |
| `app_cartao_credito` | 3 | Cartões de crédito | ✅ Essencial |
| `app_fatura` | 35 | Faturas de cartão | ✅ Essencial |
| `app_orcamento` | 5 | Orçamentos por categoria | ✅ Essencial |
| `app_indicadores` | 45 | Métricas calculadas | ✅ Essencial |
| `app_saldo_historico` | 24 | Auditoria de saldos | ✅ Essencial |
| `app_meta_despesa_mensal` | 2 | Meta de limite mensal | ✅ Essencial |

### Central IA Atual (4 tabelas) ✅

| Tabela | Registros | Função | Status |
|--------|-----------|--------|--------|
| `app_chat_sessoes` | 11 | Sessões de chat | ✅ Em uso |
| `app_chat_mensagens` | 48 | Mensagens do chat | ✅ Em uso |
| `app_pending_actions` | 1 | Ações pendentes | ✅ Em uso |
| `app_system_docs` | 12 | Documentação para IA | ✅ Em uso |

### Patrimônio (1 tabela) ✅

| Tabela | Registros | Função | Status |
|--------|-----------|--------|--------|
| `app_patrimonio_ativo` | 4 | Ativos patrimoniais | ✅ Em uso |

### Memória IA (1 tabela) ✅

| Tabela | Registros | Função | Status |
|--------|-----------|--------|--------|
| `app_memoria_ia` | 3 | Memória contextual da IA | ✅ Em uso |

---

## 2. REMOÇÃO SEGURA (Código existe mas nunca foi usado)

### Sistema RAG/IA Avançado - 12 tabelas ❌

> **Situação:** Código desenvolvido, páginas admin existem (`/admin/ai-center`), mas NUNCA foi integrado à Central IA do usuário. Todas vazias.

| Tabela | Serviço que Referencia | Decisão |
|--------|------------------------|---------|
| `app_agente_config` | AgentConfigService.ts | ❌ Remover |
| `app_agente_metricas` | AgentConfigService.ts | ❌ Remover |
| `app_conversas_log` | Edge Function ai-chat | ❌ Remover |
| `app_prompt_historico` | AgentConfigService.ts | ❌ Remover |
| `app_knowledge_base` | EmbeddingService.ts | ❌ Remover |
| `app_document_uploads` | RAGDocumentProcessor.ts | ❌ Remover |
| `app_training_conversations` | RAGDocumentProcessor.ts | ❌ Remover |
| `app_training_sessions` | Não usado | ❌ Remover |
| `app_sessao_treinamento` | Não usado | ❌ Remover |
| `app_rag_feedback` | RAGEnhancedChatService.ts | ❌ Remover |
| `app_rag_metrics` | VectorSearchService.ts | ❌ Remover |
| `app_rag_quality_metrics` | Não usado | ❌ Remover |
| `app_rag_learning_patterns` | Não usado | ❌ Remover |

**Impacto da remoção:**
- ✅ Central IA do usuário: **NÃO afetada** (usa sistema diferente)
- ⚠️ Páginas admin `/admin/ai-center`: Vão quebrar (precisam ser removidas também)
- ⚠️ Arquivos de código: Podem ser removidos junto

**Arquivos de código relacionados (também podem ser removidos):**
```
src/services/ai/RAGEnhancedChatService.ts
src/services/ai/VectorSearchService.ts
src/services/ai/EmbeddingService.ts
src/services/ai/HybridRAGService.ts
src/services/ai/RAGDocumentProcessor.ts
src/services/api/agentConfig.ts
src/components/chat/SmartFinancialChat.tsx (órfão)
src/components/admin/training/KnowledgeBaseDashboard.tsx
src/components/admin/training/RAGTester.tsx
src/pages/admin/TrainingCenterPage.tsx
src/pages/admin/AICenterPage.tsx (parcialmente)
```

---

## 3. FEATURE NÃO IMPLEMENTADA (Pode remover)

| Tabela | Registros | Situação | Decisão |
|--------|-----------|----------|---------|
| `app_conta_grupo` | 0 | Tipos definidos, UI não existe | ❌ Remover |

**Impacto:** Nenhum. Feature de "agrupar contas" nunca foi criada.

---

## 4. AVALIAR COM CUIDADO

### Metas Financeiras Individuais

| Tabela | Registros | Situação | Decisão |
|--------|-----------|----------|---------|
| `app_meta_financeira` | 0 | GoalService.ts COMPLETO | ⚠️ MANTER |

**Explicação:**
- Diferente de `app_meta_despesa_mensal` (limite mensal)
- Esta é para metas de LONGO PRAZO (ex: "Juntar R$ 50.000")
- Código está 100% pronto em `src/services/api/GoalService.ts`
- Só não tem dados porque você nunca criou metas
- **Recomendação:** MANTER - pode usar no futuro

### Patrimônio Histórico

| Tabela | Registros | Situação | Decisão |
|--------|-----------|----------|---------|
| `app_patrimonio_historico` | 0 | Tabela auxiliar de `app_patrimonio_ativo` | ⚠️ Avaliar |

**Explicação:**
- Deveria guardar histórico mensal dos ativos
- `app_patrimonio_ativo` tem 4 registros
- Trigger ou função deveria popular automaticamente
- **Recomendação:** Verificar se há trigger. Se não, pode remover.

### Sistema de Compartilhamento (Grupos/Casal)

| Tabela | Registros | Situação | Decisão |
|--------|-----------|----------|---------|
| `app_grupo_compartilhado` | 1 | Em uso | ✅ Manter |
| `app_grupo_membro` | 1 | Em uso | ✅ Manter |
| `app_solicitacao_vinculo` | 1 | Em uso | ✅ Manter |
| `app_convite_grupo` | 0 | Feature de convite | ⚠️ Manter (faz parte do sistema) |
| `app_meta_compartilhada` | 0 | Metas em grupo | ⚠️ Manter (faz parte do sistema) |
| `app_meta_contribuicao` | 0 | Contribuições | ⚠️ Manter (faz parte do sistema) |

**Explicação:**
- Sistema de compartilhamento está ATIVO (tem dados em 3 tabelas)
- As 3 vazias são parte do mesmo sistema
- **Recomendação:** MANTER todas - sistema funcional

---

## 5. RESUMO DAS AÇÕES

### Tabelas para REMOVER (13 tabelas)

```sql
-- Sistema RAG/IA Avançado (não integrado)
DROP TABLE IF EXISTS app_rag_learning_patterns CASCADE;
DROP TABLE IF EXISTS app_rag_quality_metrics CASCADE;
DROP TABLE IF EXISTS app_rag_metrics CASCADE;
DROP TABLE IF EXISTS app_rag_feedback CASCADE;
DROP TABLE IF EXISTS app_training_sessions CASCADE;
DROP TABLE IF EXISTS app_sessao_treinamento CASCADE;
DROP TABLE IF EXISTS app_training_conversations CASCADE;
DROP TABLE IF EXISTS app_document_uploads CASCADE;
DROP TABLE IF EXISTS app_knowledge_base CASCADE;
DROP TABLE IF EXISTS app_prompt_historico CASCADE;
DROP TABLE IF EXISTS app_conversas_log CASCADE;
DROP TABLE IF EXISTS app_agente_metricas CASCADE;
DROP TABLE IF EXISTS app_agente_config CASCADE;

-- Feature não implementada
DROP TABLE IF EXISTS app_conta_grupo CASCADE;
```

### Tabelas para MANTER (25 tabelas)

**Core (11):** `app_perfil`, `app_conta`, `app_categoria`, `app_transacoes`, `app_transacoes_fixas`, `app_cartao_credito`, `app_fatura`, `app_orcamento`, `app_indicadores`, `app_saldo_historico`, `app_meta_despesa_mensal`

**Central IA (4):** `app_chat_sessoes`, `app_chat_mensagens`, `app_pending_actions`, `app_system_docs`

**Patrimônio (2):** `app_patrimonio_ativo`, `app_patrimonio_historico`

**Memória IA (1):** `app_memoria_ia`

**Compartilhamento (6):** `app_grupo_compartilhado`, `app_grupo_membro`, `app_solicitacao_vinculo`, `app_convite_grupo`, `app_meta_compartilhada`, `app_meta_contribuicao`

**Metas (1):** `app_meta_financeira`

---

## 6. ARQUIVOS DE CÓDIGO PARA REMOVER

Após remover as tabelas RAG, estes arquivos ficam obsoletos:

### Serviços (src/services/ai/)
- [ ] `RAGEnhancedChatService.ts`
- [ ] `VectorSearchService.ts`
- [ ] `EmbeddingService.ts`
- [ ] `HybridRAGService.ts`
- [ ] `RAGDocumentProcessor.ts`

### Serviços (src/services/api/)
- [ ] `agentConfig.ts`

### Componentes (src/components/)
- [ ] `chat/SmartFinancialChat.tsx` (órfão)
- [ ] `admin/training/KnowledgeBaseDashboard.tsx`
- [ ] `admin/training/RAGTester.tsx`

### Páginas (src/pages/admin/)
- [ ] `TrainingCenterPage.tsx`
- [ ] `AICenterPage.tsx` (ou remover apenas as abas de RAG)

### Rotas (src/App.tsx)
Remover:
```tsx
<Route path="/admin/ai-center" element={<AICenterPage />} />
<Route path="/admin/centro-ia" element={<AICenterPage />} />
<Route path="/admin/ai-center/training" element={<TrainingCenterPage />} />
<Route path="/admin/centro-ia/treinamento" element={<TrainingCenterPage />} />
```

---

## 7. TIPOS TYPESCRIPT PARA LIMPAR

Após remover tabelas, limpar tipos em:
- `src/types/supabase.ts` - Remover interfaces das tabelas deletadas

---

## 8. BENEFÍCIOS DA LIMPEZA

| Métrica | Antes | Depois |
|---------|-------|--------|
| Total de tabelas | 38 | 25 |
| Tabelas vazias | 17 | 4 |
| Complexidade do schema | Alta | Média |
| Código morto | ~15 arquivos | 0 |

### Vantagens:
1. **Schema mais limpo** - Fácil de entender e manter
2. **Menos código** - Remover ~15 arquivos não utilizados
3. **Menos confusão** - Dois sistemas de IA → Um sistema claro
4. **Build mais leve** - Menos código = bundle menor
5. **Supabase mais limpo** - Menos tabelas no dashboard

---

## 9. ORDEM DE EXECUÇÃO RECOMENDADA

### Etapa 1: Backup
```bash
# Fazer backup completo do banco antes de qualquer alteração
```

### Etapa 2: Remover código (frontend)
1. Remover arquivos de serviços RAG
2. Remover componentes admin RAG
3. Remover rotas do App.tsx
4. Limpar tipos TypeScript
5. Testar build: `npm run build`

### Etapa 3: Remover tabelas (banco)
1. Executar DROP TABLE em ordem (respeitar foreign keys)
2. Verificar se não quebrou nada

### Etapa 4: Validar
1. Testar Central IA
2. Testar todas as funcionalidades financeiras
3. Verificar console por erros

---

## 10. DECISÃO PENDENTE

**Você quer remover o sistema RAG completo?**

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Remover tudo** | Código limpo, menos confusão | Perde trabalho feito, se quiser RAG no futuro precisa refazer |
| **B) Manter tabelas, remover código** | Pode reativar depois | Schema ainda "sujo" |
| **C) Manter tudo** | Nenhum esforço agora | Código morto, confusão permanece |

**Minha recomendação:** Opção A (remover tudo) - O sistema RAG atual não está integrado e provavelmente seria refeito de forma diferente se necessário no futuro.

---

*Documento gerado para avaliação. Nenhuma alteração foi executada.*
