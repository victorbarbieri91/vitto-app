# Arquitetura do Banco de Dados - Vitto Financas

> **Ultima Atualizacao:** 01/02/2026
> **Projeto Supabase:** omgrgbyexbxtqoyewwra
> **Regiao:** sa-east-1 (Sao Paulo, Brazil)
> **PostgreSQL:** 17.6.1.003

Este documento descreve a estrutura completa do banco de dados do Vitto Financas.
Serve como referencia para desenvolvimento, integracao e operacoes de importacao.

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Tabelas Detalhadas](#3-tabelas-detalhadas)
4. [Relacionamentos](#4-relacionamentos)
5. [Services do Frontend](#5-services-do-frontend)
6. [Triggers e Funcoes](#6-triggers-e-funcoes)
7. [Seguranca (RLS)](#7-seguranca-rls)
8. [Guia de Importacao](#8-guia-de-importacao)

---

## 1. VISAO GERAL

### Resumo do Banco

| Metrica | Valor |
|---------|-------|
| Total de Tabelas | 25 |
| Tabelas com Dados | 21 |
| Tabelas Vazias | 4 |
| RLS Habilitado | 100% |
| Prefixo Padrao | `app_` |

### Organizacao por Modulo

| Modulo | Tabelas | Descricao |
|--------|---------|-----------|
| Core Financeiro | 11 | Transacoes, contas, cartoes, faturas, categorias |
| Central IA | 4 | Chat, sessoes, acoes pendentes, documentacao |
| Patrimonio | 2 | Ativos e historico de valores |
| Memoria IA | 1 | Contexto e memoria da IA |
| Metas | 1 | Metas financeiras de longo prazo |
| Compartilhamento | 6 | Grupos, membros, convites, metas compartilhadas |

---

## 2. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                      VITTO FINANCAS                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │    AUTH      │  │   CORE       │  │    CENTRAL IA        │   │
│  │  (Supabase)  │  │ FINANCEIRO   │  │   (Chat + Memoria)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                 │                      │               │
│         ▼                 ▼                      ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ app_perfil   │  │ Transacoes   │  │  app_chat_sessoes    │   │
│  │              │  │ Contas       │  │  app_chat_mensagens  │   │
│  │              │  │ Cartoes      │  │  app_pending_actions │   │
│  │              │  │ Faturas      │  │  app_memoria_ia      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PATRIMONIO  │  │    METAS     │  │  COMPARTILHAMENTO    │   │
│  │   (Ativos)   │  │  (Objetivos) │  │     (Juntos)         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. TABELAS DETALHADAS

### 3.1 AUTENTICACAO E PERFIL

#### `app_perfil`
Perfis de usuarios vinculados ao auth.users do Supabase.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | - | PK, FK para auth.users |
| nome | text | Sim | - | Nome completo |
| email | text | Sim | - | Email (unique) |
| avatar_url | text | Nao | NULL | URL do avatar |
| created_at | timestamptz | Sim | now() | Data de criacao |
| onboarding_completed | boolean | Nao | false | Onboarding concluido |
| onboarding_step | integer | Nao | 0 | Etapa atual do onboarding |
| receita_mensal_estimada | numeric | Nao | 0 | Receita mensal estimada |
| meta_despesa_percentual | numeric | Nao | 80 | % da receita como limite |
| tipo_usuario | text | Nao | 'usuario' | usuario, admin, especialista |

---

### 3.2 CORE FINANCEIRO

#### `app_conta`
Contas bancarias dos usuarios.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| nome | text | Sim | - | Nome da conta |
| tipo | text | Sim | - | conta_corrente, poupanca, investimento |
| saldo_inicial | numeric | Sim | 0 | Saldo inicial |
| saldo_atual | numeric | Sim | 0 | Saldo atual (trigger) |
| cor | text | Nao | NULL | Cor para UI |
| icone | text | Nao | NULL | Icone para UI |
| status | varchar | Sim | 'ativo' | ativo, inativo |
| moeda | varchar | Sim | 'BRL' | Moeda da conta |
| descricao | text | Nao | NULL | Descricao opcional |
| instituicao | varchar | Nao | NULL | Nome do banco |
| ultima_conciliacao | timestamptz | Nao | NULL | Ultima conciliacao |
| created_at | timestamptz | Sim | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_categoria`
Categorias para classificar transacoes.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Nao | NULL | FK (NULL = padrao) |
| nome | text | Sim | - | Nome da categoria |
| tipo | text | Sim | - | despesa, receita, ambos |
| cor | text | Nao | NULL | Cor hex para UI |
| icone | text | Nao | NULL | Nome do icone |
| is_default | boolean | Nao | false | Categoria padrao do sistema |
| overrides_default_id | integer | Nao | NULL | ID da categoria que customiza |
| created_at | timestamptz | Sim | now() | Data de criacao |

**Categorias Padrao:**
- **Despesa:** Alimentacao (18), Mercado (25), Transporte (19), Moradia (7), Saude (21), Lazer (20), Educacao (9), Compras (11), Contas (12), Pet (6), Investimento (5), Fatura (1), Pagamento de Fatura (22), Outros (13)
- **Receita:** Salario (17), Investimentos (3), Freelance (2), Outros (4)
- **Ambos:** Saldo Inicial (14), Ajuste de Saldo (15), Transferencia (16)

---

#### `app_transacoes`
Transacoes financeiras (receitas, despesas, cartao).

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| descricao | text | Sim | - | Descricao da transacao |
| valor | numeric | Sim | - | Valor (sempre positivo) |
| data | date | Sim | - | Data da transacao |
| tipo | text | Sim | - | receita, despesa, despesa_cartao |
| categoria_id | bigint | Sim | - | FK para app_categoria |
| conta_id | bigint | Nao | NULL | FK para app_conta |
| cartao_id | bigint | Nao | NULL | FK para app_cartao_credito |
| status | text | Nao | 'pendente' | pendente, confirmado, cancelado |
| origem | text | Nao | 'manual' | manual, fixo, importacao |
| fixo_id | bigint | Nao | NULL | FK para app_transacoes_fixas |
| parcela_atual | integer | Nao | NULL | Numero da parcela |
| total_parcelas | integer | Nao | NULL | Total de parcelas |
| grupo_parcelamento | uuid | Nao | NULL | UUID para agrupar parcelas |
| tipo_especial | text | Nao | 'normal' | normal, saldo_inicial, ajuste_manual |
| data_vencimento | date | Nao | NULL | Data de vencimento |
| observacoes | text | Nao | NULL | Observacoes |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

**Regras de Negocio:**
- `valor` deve ser sempre > 0
- Se `tipo = 'despesa_cartao'`: `cartao_id` obrigatorio, `conta_id` NULL
- Se `tipo IN ('receita', 'despesa')`: `conta_id` obrigatorio, `cartao_id` NULL

---

#### `app_transacoes_fixas`
Regras de transacoes recorrentes mensais.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| descricao | text | Sim | - | Nome da transacao fixa |
| valor | numeric | Sim | - | Valor mensal (> 0) |
| tipo | text | Sim | - | receita, despesa, despesa_cartao |
| categoria_id | bigint | Sim | - | FK para app_categoria |
| conta_id | bigint | Nao | NULL | FK para app_conta |
| cartao_id | bigint | Nao | NULL | FK para app_cartao_credito |
| dia_mes | integer | Sim | - | Dia do mes (1-31) |
| data_inicio | date | Sim | - | Data de inicio |
| data_fim | date | Nao | NULL | Data de fim (NULL = indefinido) |
| ativo | boolean | Nao | true | Se esta ativo |
| observacoes | text | Nao | NULL | Observacoes |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_cartao_credito`
Cartoes de credito cadastrados.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| nome | text | Sim | - | Nome do cartao |
| limite | numeric | Sim | - | Limite do cartao |
| dia_fechamento | integer | Sim | - | Dia de fechamento |
| dia_vencimento | integer | Sim | - | Dia de vencimento |
| cor | text | Nao | NULL | Cor para UI |
| icone | text | Nao | NULL | Icone para UI |
| ultimos_quatro_digitos | varchar | Nao | NULL | Ultimos 4 digitos |
| created_at | timestamptz | Sim | now() | Data de criacao |

---

#### `app_fatura`
Faturas de cartao de credito.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| cartao_id | bigint | Sim | - | FK para app_cartao_credito |
| mes | integer | Sim | - | Mes de referencia (1-12) |
| ano | integer | Sim | - | Ano de referencia |
| valor_total | numeric | Sim | 0 | Valor total da fatura |
| status | text | Sim | 'aberta' | aberta, fechada, paga |
| data_vencimento | date | Sim | - | Data de vencimento |
| data_pagamento | date | Nao | NULL | Data do pagamento |
| created_at | timestamptz | Sim | now() | Data de criacao |

---

#### `app_orcamento`
Orcamentos por categoria.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| categoria_id | bigint | Sim | - | FK para app_categoria |
| mes | integer | Sim | - | Mes (1-12) |
| ano | integer | Sim | - | Ano |
| valor | numeric | Sim | - | Valor orcado |
| tipo | text | Sim | 'despesa' | receita (meta) ou despesa (limite) |
| created_at | timestamptz | Sim | now() | Data de criacao |

---

#### `app_indicadores`
Metricas financeiras calculadas automaticamente.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| conta_id | bigint | Nao | NULL | FK para app_conta (NULL = consolidado) |
| mes | integer | Nao | - | Mes de referencia |
| ano | integer | Nao | - | Ano de referencia |
| saldo_inicial | numeric | Nao | 0 | Saldo no inicio do mes |
| saldo_atual | numeric | Nao | 0 | Saldo atual |
| saldo_previsto | numeric | Nao | 0 | Saldo previsto fim do mes |
| receitas_confirmadas | numeric | Nao | 0 | Receitas confirmadas |
| despesas_confirmadas | numeric | Nao | 0 | Despesas confirmadas |
| receitas_pendentes | numeric | Nao | 0 | Receitas pendentes |
| despesas_pendentes | numeric | Nao | 0 | Despesas pendentes |
| receitas_recorrentes | numeric | Nao | 0 | Receitas recorrentes previstas |
| despesas_recorrentes | numeric | Nao | 0 | Despesas recorrentes previstas |
| fatura_atual | numeric | Nao | 0 | Fatura aberta atual |
| fatura_proxima | numeric | Nao | 0 | Proxima fatura |
| fluxo_liquido | numeric | Generated | - | receitas - despesas |
| projecao_fim_mes | numeric | Generated | - | Projecao do saldo |
| score_saude_financeira | integer | Generated | - | Score 0-100 |
| taxa_economia | numeric | Generated | - | % de economia |
| burn_rate | numeric | Generated | - | Meses de sobrevivencia |
| tendencia_despesas | text | Generated | - | positivo, negativo, neutro |
| ultima_atualizacao | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_saldo_historico`
Historico de mudancas de saldo para auditoria.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| conta_id | bigint | Sim | - | FK para app_conta |
| data_referencia | date | Sim | - | Data da mudanca |
| saldo_anterior | numeric | Nao | 0 | Saldo antes |
| saldo_novo | numeric | Sim | - | Saldo depois |
| tipo_operacao | text | Sim | - | inicial, ajuste_manual, transacao |
| observacoes | text | Nao | NULL | Observacoes |
| created_at | timestamptz | Nao | now() | Data do registro |

---

#### `app_meta_despesa_mensal`
Meta de limite de gastos mensal.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| mes | integer | Sim | - | Mes (1-12) |
| ano | integer | Sim | - | Ano |
| receita_estimada | numeric | Sim | 0 | Receita estimada |
| meta_despesa | numeric | Sim | 0 | Valor limite |
| meta_percentual | numeric | Sim | 80 | Percentual da receita |
| despesa_atual | numeric | Nao | 0 | Despesas atuais |
| status | text | Nao | 'ativa' | ativa, inativa |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

### 3.3 CENTRAL IA

#### `app_chat_sessoes`
Sessoes de conversa com a IA.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| titulo | text | Nao | NULL | Titulo da sessao |
| mensagem_count | integer | Nao | 0 | Contador de mensagens |
| ultima_mensagem | text | Nao | NULL | Preview da ultima |
| metadata | jsonb | Nao | '{}' | Metadados extras |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_chat_mensagens`
Mensagens do chat.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| sessao_id | uuid | Sim | - | FK para app_chat_sessoes |
| role | text | Sim | - | user, assistant, system, tool |
| content | text | Nao | NULL | Conteudo da mensagem |
| tool_calls | jsonb | Nao | NULL | Chamadas de ferramentas |
| tool_results | jsonb | Nao | NULL | Resultados |
| metadata | jsonb | Nao | '{}' | Metadados |
| created_at | timestamptz | Nao | now() | Data de criacao |

---

#### `app_pending_actions`
Acoes pendentes aguardando confirmacao.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| sessao_id | uuid | Nao | NULL | FK para app_chat_sessoes |
| action_type | text | Sim | - | Tipo da acao |
| action_data | jsonb | Sim | - | Dados da acao |
| status | text | Nao | 'pending' | pending, confirmed, rejected, expired |
| expires_at | timestamptz | Nao | now() + 5min | Expiracao |
| created_at | timestamptz | Nao | now() | Data de criacao |

---

#### `app_system_docs`
Documentacao do sistema para contexto da IA.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| categoria | text | Sim | - | Categoria do documento |
| titulo | text | Sim | - | Titulo |
| conteudo | text | Sim | - | Conteudo |
| metadata | jsonb | Nao | '{}' | Metadados |
| ativo | boolean | Nao | true | Se esta ativo |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_memoria_ia`
Memoria contextual da IA sobre o usuario.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | uuid | Sim | gen_random_uuid() | PK |
| usuario_id | uuid | Sim | - | FK para auth.users |
| tipo_conteudo | varchar | Sim | - | Tipo do conteudo |
| conteudo | text | Sim | - | Conteudo da memoria |
| resumo | text | Nao | NULL | Resumo para busca |
| embedding | vector | Nao | NULL | Embedding semantico |
| metadata | jsonb | Nao | '{}' | Metadados |
| relevancia_score | float8 | Nao | 0.0 | Score de relevancia |
| contexto_financeiro | jsonb | Nao | '{}' | Contexto associado |
| data_criacao | timestamptz | Nao | now() | Data de criacao |
| data_atualizacao | timestamptz | Nao | now() | Ultima atualizacao |
| ativo | boolean | Nao | true | Se esta ativo |

---

### 3.4 PATRIMONIO

#### `app_patrimonio_ativo`
Ativos patrimoniais do usuario.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| nome | text | Sim | - | Nome do ativo |
| categoria | text | Sim | - | Categoria (ver abaixo) |
| subcategoria | text | Nao | NULL | Subcategoria |
| valor_atual | numeric | Sim | 0 | Valor atual |
| valor_aquisicao | numeric | Nao | 0 | Valor de aquisicao |
| data_aquisicao | date | Nao | NULL | Data de aquisicao |
| instituicao | text | Nao | NULL | Instituicao/corretora |
| observacoes | text | Nao | NULL | Observacoes |
| ativo | boolean | Sim | true | Se esta ativo |
| dados_especificos | jsonb | Nao | '{}' | Dados extras (ticker, qtd) |
| conta_id | bigint | Nao | NULL | FK app_conta (se liquidez) |
| created_at | timestamptz | Sim | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

**Categorias:**
- `liquidez` - Conta corrente, poupanca, dinheiro
- `renda_fixa` - CDB, LCI, LCA, Tesouro
- `renda_variavel` - Acoes, FIIs, ETFs
- `cripto` - Bitcoin, Ethereum, etc
- `imoveis` - Apartamentos, casas, terrenos
- `veiculos` - Carros, motos
- `previdencia` - PGBL, VGBL
- `outros` - Outros ativos

---

#### `app_patrimonio_historico`
Historico mensal de valores dos ativos.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| ativo_id | bigint | Nao | NULL | FK app_patrimonio_ativo |
| mes | integer | Sim | - | Mes (1-12) |
| ano | integer | Sim | - | Ano |
| valor_inicio_mes | numeric | Nao | 0 | Valor no inicio |
| valor_fim_mes | numeric | Nao | 0 | Valor no fim |
| variacao_absoluta | numeric | Generated | - | Diferenca absoluta |
| variacao_percentual | numeric | Generated | - | Variacao % |
| categoria | text | Nao | NULL | Categoria (consolidados) |
| created_at | timestamptz | Sim | now() | Data de criacao |

---

### 3.5 METAS

#### `app_meta_financeira`
Metas financeiras de longo prazo.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| user_id | uuid | Sim | - | FK para auth.users |
| titulo | text | Sim | - | Titulo da meta |
| valor_meta | numeric | Sim | - | Valor objetivo |
| valor_atual | numeric | Sim | 0 | Valor acumulado |
| data_inicio | date | Sim | - | Data de inicio |
| data_fim | date | Sim | - | Data objetivo |
| descricao | text | Nao | NULL | Descricao |
| cor | text | Nao | NULL | Cor para UI |
| created_at | timestamptz | Sim | now() | Data de criacao |

---

### 3.6 COMPARTILHAMENTO (JUNTOS)

#### `app_grupo_compartilhado`
Grupos para compartilhar financas.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| nome | text | Sim | - | Nome do grupo |
| criado_por | uuid | Sim | - | FK para auth.users |
| tipo | text | Nao | 'casal' | casal, familia, parceiros |
| ativo | boolean | Nao | true | Se esta ativo |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_grupo_membro`
Membros de cada grupo com permissoes.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| grupo_id | bigint | Sim | - | FK app_grupo_compartilhado |
| user_id | uuid | Sim | - | FK para auth.users |
| papel | text | Nao | 'membro' | admin, membro |
| apelido | text | Nao | NULL | Apelido no grupo |
| pode_ver_patrimonio | boolean | Nao | true | Permissao |
| pode_ver_receitas | boolean | Nao | true | Permissao |
| pode_ver_despesas | boolean | Nao | true | Permissao |
| pode_ver_transacoes | boolean | Nao | false | Permissao |
| pode_ver_metas | boolean | Nao | true | Permissao |
| aceito_em | timestamptz | Nao | NULL | Data de aceite |
| created_at | timestamptz | Nao | now() | Data de criacao |

---

#### `app_convite_grupo`
Convites pendentes para grupos.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| grupo_id | bigint | Sim | - | FK app_grupo_compartilhado |
| convidado_email | text | Sim | - | Email do convidado |
| convidado_user_id | uuid | Nao | NULL | FK se usuario existe |
| token | uuid | Sim | gen_random_uuid() | Token unico |
| status | text | Nao | 'pendente' | pendente, aceito, recusado, expirado |
| mensagem_convite | text | Nao | NULL | Mensagem personalizada |
| expira_em | timestamptz | Nao | now() + 7 days | Data de expiracao |
| created_at | timestamptz | Nao | now() | Data de criacao |

---

#### `app_solicitacao_vinculo`
Solicitacoes de vinculo entre usuarios.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| grupo_id | bigint | Sim | - | FK app_grupo_compartilhado |
| solicitante_id | uuid | Sim | - | FK para auth.users |
| destinatario_id | uuid | Sim | - | FK para auth.users |
| mensagem | text | Nao | NULL | Mensagem |
| status | text | Nao | 'pendente' | pendente, aceito, recusado |
| created_at | timestamptz | Nao | now() | Data de criacao |
| respondido_em | timestamptz | Nao | NULL | Data da resposta |

---

#### `app_meta_compartilhada`
Metas financeiras compartilhadas no grupo.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| grupo_id | bigint | Sim | - | FK app_grupo_compartilhado |
| titulo | text | Sim | - | Titulo da meta |
| descricao | text | Nao | NULL | Descricao |
| valor_meta | numeric | Sim | - | Valor objetivo (> 0) |
| valor_atual | numeric | Nao | 0 | Valor acumulado |
| data_inicio | date | Sim | - | Data de inicio |
| data_fim | date | Sim | - | Data objetivo |
| cor | text | Nao | NULL | Cor para UI |
| icone | text | Nao | NULL | Icone |
| created_at | timestamptz | Nao | now() | Data de criacao |
| updated_at | timestamptz | Nao | now() | Ultima atualizacao |

---

#### `app_meta_contribuicao`
Contribuicoes para metas compartilhadas.

| Coluna | Tipo | Obrigatorio | Default | Descricao |
|--------|------|-------------|---------|-----------|
| id | bigint | Sim | auto | PK |
| meta_id | bigint | Sim | - | FK app_meta_compartilhada |
| user_id | uuid | Sim | - | FK para auth.users |
| valor | numeric | Sim | - | Valor da contribuicao (> 0) |
| data | date | Nao | CURRENT_DATE | Data da contribuicao |
| observacao | text | Nao | NULL | Observacao |
| created_at | timestamptz | Nao | now() | Data de criacao |

---

## 4. RELACIONAMENTOS

```
auth.users
    │
    ├──► app_perfil (1:1)
    │
    ├──► app_conta (1:N)
    │       ├──► app_transacoes (1:N)
    │       ├──► app_indicadores (1:N)
    │       ├──► app_saldo_historico (1:N)
    │       └──► app_patrimonio_ativo (1:N) [liquidez]
    │
    ├──► app_categoria (1:N)
    │       ├──► app_transacoes (N:1)
    │       ├──► app_transacoes_fixas (N:1)
    │       └──► app_orcamento (N:1)
    │
    ├──► app_cartao_credito (1:N)
    │       ├──► app_fatura (1:N)
    │       ├──► app_transacoes (1:N) [despesa_cartao]
    │       └──► app_transacoes_fixas (1:N) [despesa_cartao]
    │
    ├──► app_chat_sessoes (1:N)
    │       ├──► app_chat_mensagens (1:N)
    │       └──► app_pending_actions (1:N)
    │
    ├──► app_memoria_ia (1:N)
    │
    ├──► app_patrimonio_ativo (1:N)
    │       └──► app_patrimonio_historico (1:N)
    │
    ├──► app_meta_financeira (1:N)
    │
    ├──► app_meta_despesa_mensal (1:N)
    │
    └──► app_grupo_compartilhado (1:N) [criador]
            ├──► app_grupo_membro (1:N)
            ├──► app_convite_grupo (1:N)
            ├──► app_solicitacao_vinculo (1:N)
            └──► app_meta_compartilhada (1:N)
                    └──► app_meta_contribuicao (1:N)
```

---

## 5. SERVICES DO FRONTEND

| Service | Arquivo | Tabelas |
|---------|---------|---------|
| AccountService | src/services/api/accounts.ts | app_conta |
| TransactionService | src/services/api/transactions.ts | app_transacoes, app_categoria |
| FixedTransactionService | src/services/api/fixedTransactions.ts | app_transacoes_fixas |
| CreditCardService | src/services/api/creditCards.ts | app_cartao_credito, app_fatura |
| CategoryService | src/services/api/categories.ts | app_categoria |
| BudgetService | src/services/api/budgets.ts | app_orcamento |
| PatrimonioService | src/services/api/patrimonio.ts | app_patrimonio_* |
| GoalService | src/services/api/GoalService.ts | app_meta_financeira |
| IndicatorsService | src/services/api/indicators.ts | app_indicadores |
| ChatSessionService | src/services/central-ia/ChatSessionService.ts | app_chat_* |
| CentralIAService | src/services/central-ia/CentralIAService.ts | app_pending_actions |
| FinancialMemoryManager | src/services/ai/FinancialMemoryManager.ts | app_memoria_ia |
| SharedGroupService | src/services/api/sharedGroup.ts | app_grupo_*, app_convite_*, app_meta_* |

---

## 6. TRIGGERS E FUNCOES

### Triggers Ativos
- `handle_new_user` - Cria perfil automatico apos signup
- `trigger_atualizar_saldo_conta` - Atualiza saldo da conta apos transacao
- `trigger_atualizar_indicadores` - Recalcula indicadores apos transacao

### Funcoes Uteis
```sql
-- Calcular periodo da fatura
SELECT * FROM calcular_periodo_fatura(cartao_id, data_compra);

-- Criar fatura se nao existe
SELECT criar_fatura_se_nao_existe(cartao_id, mes, ano);

-- Recalcular indicadores
CALL atualizar_indicadores_mes(user_id, conta_id, mes, ano);
```

---

## 7. SEGURANCA (RLS)

Todas as 25 tabelas possuem Row Level Security habilitado.

**Politicas:**
- Usuarios so veem/modificam seus proprios dados
- Grupos compartilhados permitem visualizacao entre membros
- `app_system_docs` tem leitura publica (documentacao do sistema)

---

## 8. GUIA DE IMPORTACAO

Esta secao contem instrucoes especificas para o agente de importacao de dados.

### 8.1 Destinos de Importacao

| Destino | Tabela | Quando Usar | Exemplo |
|---------|--------|-------------|---------|
| Transacoes | `app_transacoes` | Gastos/receitas avulsos, faturas | Print de fatura, extrato |
| Transacoes Fixas | `app_transacoes_fixas` | Despesas/receitas recorrentes | Aluguel, salario, Netflix |
| Patrimonio | `app_patrimonio_ativo` | Investimentos e ativos | CDBs, acoes, imoveis |

### 8.2 Regras de Vinculacao

```
SE tipo = 'receita' OU tipo = 'despesa':
   -> OBRIGATORIO: conta_id
   -> cartao_id deve ser NULL

SE tipo = 'despesa_cartao':
   -> OBRIGATORIO: cartao_id
   -> conta_id deve ser NULL
```

### 8.3 Fluxo de Importacao

1. **Identificar tipo de documento** (fatura, extrato, investimentos, fixos)
2. **Perguntar confirmacao** ao usuario sobre o destino
3. **Coletar dados faltantes** (mes de referencia, cartao/conta)
4. **Mostrar preview** das transacoes a importar
5. **Confirmar e executar** a importacao

### 8.4 Categorias para Mapeamento

**Despesa:**
| ID | Nome | Palavras-chave |
|----|------|----------------|
| 18 | Alimentacao | ifood, restaurante, padaria |
| 25 | Mercado | supermercado, mercado |
| 19 | Transporte | uber, 99, combustivel, gasolina |
| 7 | Moradia | aluguel, condominio, luz, agua |
| 21 | Saude | farmacia, medico, hospital |
| 20 | Lazer | netflix, spotify, cinema |
| 11 | Compras | amazon, roupa, eletronico |
| 13 | Outros | quando nao se encaixa |

**Receita:**
| ID | Nome | Palavras-chave |
|----|------|----------------|
| 17 | Salario | salario, pagamento, holerite |
| 3 | Investimentos | dividendo, rendimento, juros |
| 2 | Freelance | freelance, servico, projeto |

### 8.5 Regras de Negocio

- Valores SEMPRE positivos no banco
- O tipo (receita/despesa) indica a direcao
- Converter "R$ 1.234,56" para 1234.56
- Formato de data: YYYY-MM-DD
- Verificar duplicatas antes de importar

---

*Documento de referencia completa do banco de dados Vitto Financas.*
*Para historico de limpezas, veja DATABASE_CLEANUP_PLAN.md*
