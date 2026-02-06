# MCP Server - Vitto Financial

## Visão Geral

O MCP Server é uma Edge Function do Supabase que implementa o Model Context Protocol (MCP) para permitir que agentes de IA (como n8n) executem operações CRUD no sistema financeiro Vitto.

**URL**: `https://omgrgbyexbxtqoyewwra.supabase.co/functions/v1/mcp-server`

**Protocolo**: JSON-RPC 2.0

**JWT**: Desabilitado (autenticação via telefone do usuário)

---

## Como Usar

### Listar Tools Disponíveis

```json
POST /functions/v1/mcp-server
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### Executar uma Tool

```json
POST /functions/v1/mcp-server
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "nome_da_tool",
    "arguments": {
      "parametro1": "valor1",
      "parametro2": "valor2"
    }
  }
}
```

---

## Fluxo de Identificação

O usuário é identificado pelo número de telefone (WhatsApp). O fluxo típico é:

1. **Identificar usuário** pelo telefone
2. **Usar o user_id** retornado nas demais operações

```json
// Passo 1: Identificar
{
  "method": "tools/call",
  "params": {
    "name": "identificar_usuario",
    "arguments": { "telefone": "+5511999999999" }
  }
}

// Resposta
{
  "result": {
    "success": true,
    "user_id": "uuid-do-usuario",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}

// Passo 2: Usar o user_id
{
  "method": "tools/call",
  "params": {
    "name": "get_saldo_total",
    "arguments": { "user_id": "uuid-do-usuario" }
  }
}
```

---

## Tools Disponíveis (22 total)

### 1. Identificação e Perfil

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `identificar_usuario` | Identifica usuário pelo telefone | `telefone` |
| `get_perfil` | Retorna dados do perfil | `user_id` |

### 2. Contas Bancárias

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_contas` | Lista todas as contas | `user_id` |
| `get_saldo_total` | Saldo consolidado | `user_id` |
| `criar_conta` | Cria nova conta | `user_id`, `nome`, `tipo` |

**Tipos de conta**: `corrente`, `poupanca`, `carteira`, `investimento`

### 3. Transações

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_transacoes` | Lista transações com filtros | `user_id` |
| `criar_transacao` | Cria receita/despesa | `user_id`, `descricao`, `valor`, `tipo`, `categoria_id`, `conta_id` |
| `editar_transacao` | Edita transação existente | `user_id`, `transacao_id` |
| `excluir_transacao` | Remove transação | `user_id`, `transacao_id` |

**Tipos de transação**: `receita`, `despesa` (para cartão use `criar_despesa_cartao`)

### 4. Transações Fixas (Recorrentes)

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_transacoes_fixas` | Lista transações recorrentes | `user_id` |
| `criar_transacao_fixa` | Cria transação recorrente | `user_id`, `descricao`, `valor`, `tipo`, `categoria_id`, `conta_id`, `dia_vencimento` |

### 5. Cartões de Crédito

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_cartoes` | Lista cartões | `user_id` |
| `get_fatura_atual` | Detalhes da fatura | `user_id`, `cartao_id` |
| `criar_despesa_cartao` | Registra gasto no cartão | `user_id`, `cartao_id`, `descricao`, `valor_total`, `categoria_id` |

### 6. Categorias

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_categorias` | Lista categorias disponíveis | `user_id` |

### 7. Orçamento

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `get_orcamento_mes` | Orçamento do mês | `user_id` |
| `definir_orcamento` | Define orçamento por categoria | `user_id`, `categoria_id`, `valor_planejado`, `mes`, `ano` |

### 8. Indicadores e Resumo

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `get_resumo_financeiro` | Resumo completo do mês | `user_id` |
| `get_saude_financeira` | Score e status financeiro | `user_id` |

### 9. Metas Financeiras

| Tool | Descrição | Parâmetros Obrigatórios |
|------|-----------|------------------------|
| `listar_metas` | Lista metas | `user_id` |
| `criar_meta` | Cria nova meta | `user_id`, `titulo`, `valor_alvo` |
| `atualizar_progresso_meta` | Atualiza progresso | `user_id`, `meta_id`, `valor_adicional` |

---

## Categorias Padrão

| ID | Nome | Tipo |
|----|------|------|
| 17 | Salário | receita |
| 19 | Investimentos | receita |
| 24 | Freelance | receita |
| 18 | Alimentação | despesa |
| 20 | Transporte | despesa |
| 21 | Moradia | despesa |
| 22 | Lazer | despesa |
| 23 | Saúde | despesa |
| 25 | Educação | despesa |
| 26 | Compras | despesa |
| 27 | Outros | despesa |
| 28 | Assinaturas | despesa |
| 29 | Pets | despesa |

---

## Exemplos de Uso

### Registrar uma Despesa

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "criar_transacao",
    "arguments": {
      "user_id": "uuid-do-usuario",
      "descricao": "Almoço restaurante",
      "valor": 45.90,
      "tipo": "despesa",
      "categoria_id": 18,
      "conta_id": 1,
      "data": "2025-01-30"
    }
  }
}
```

### Registrar Compra Parcelada no Cartão

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "criar_despesa_cartao",
    "arguments": {
      "user_id": "uuid-do-usuario",
      "cartao_id": 1,
      "descricao": "TV Samsung 55 polegadas",
      "valor_total": 2500.00,
      "categoria_id": 26,
      "parcelas": 10
    }
  }
}
```

### Consultar Resumo Financeiro

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_resumo_financeiro",
    "arguments": {
      "user_id": "uuid-do-usuario",
      "mes": 1,
      "ano": 2025
    }
  }
}
```

### Criar Meta Financeira

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "criar_meta",
    "arguments": {
      "user_id": "uuid-do-usuario",
      "titulo": "Viagem para Europa",
      "valor_alvo": 15000.00,
      "data_limite": "2025-12-31",
      "valor_atual": 2000.00
    }
  }
}
```

---

## Integração com n8n

### Configuração Básica

1. Use o nó **HTTP Request** no n8n
2. Configure:
   - Method: `POST`
   - URL: `https://omgrgbyexbxtqoyewwra.supabase.co/functions/v1/mcp-server`
   - Headers: `Content-Type: application/json`
   - Body: JSON conforme exemplos acima

### Fluxo Sugerido para WhatsApp

```
WhatsApp Trigger
     ↓
Extract Phone Number
     ↓
Call: identificar_usuario
     ↓
Parse User Intent (AI)
     ↓
Call: tool apropriada
     ↓
Format Response
     ↓
Send WhatsApp Message
```

---

## Respostas de Erro

### Usuário não encontrado
```json
{
  "success": false,
  "error": "Usuário não encontrado com este telefone"
}
```

### Tool não encontrada
```json
{
  "error": {
    "code": -32601,
    "message": "Método não suportado: nome_invalido"
  }
}
```

### Erro de execução
```json
{
  "error": {
    "code": -32000,
    "message": "Erro ao criar transação: detalhes do erro"
  }
}
```

---

## Cadastrar Telefone do Usuário

Para que o usuário seja identificado via WhatsApp, o telefone deve estar cadastrado:

```sql
UPDATE app_perfil
SET telefone = '+5511999999999'
WHERE id = 'uuid-do-usuario';
```

Ou via interface do sistema (funcionalidade a ser implementada no perfil do usuário).

---

## Changelog

- **v1.0** (2025-02-01): Versão inicial com 22 tools
  - Identificação por telefone
  - CRUD completo de transações
  - Gestão de cartões e faturas
  - Orçamentos e metas
  - Indicadores de saúde financeira

---

**Projeto**: Vitto Financial
**Autor**: Claude AI
**Data**: Fevereiro 2025
