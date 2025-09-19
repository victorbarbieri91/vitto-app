# 🔧 Configuração do MCP Supabase no Cursor

## ✅ Arquivo MCP Criado

O arquivo `.cursor/mcp.json` foi criado com a configuração base. Agora você precisa substituir os valores placeholder pelos dados reais do seu projeto.

## 📋 **PASSO A PASSO PARA CONFIGURAR**

### **1. Obter Personal Access Token (PAT)**

1. **Acesse**: https://supabase.com/dashboard
2. **Navegue**: Settings → Access Tokens
3. **Clique**: "Create new token"
4. **Nome**: "Cursor MCP Server"
5. **Copie** o token gerado (ex: `sbp_abc123...`)

### **2. Obter Project Reference ID**

1. **No dashboard do Supabase**, selecione seu projeto "barsi app"
2. **Navegue**: Settings → General
3. **Copie** o "Project ID" ou "Reference ID" (ex: `abcdefghijklmnop`)

### **3. Configurar o arquivo MCP**

Edite o arquivo `.cursor/mcp.json` e substitua:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=SEU_PROJECT_REF_AQUI"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_TOKEN_AQUI"
      }
    }
  }
}
```

**Substitua:**
- `SEU_PROJECT_REF_AQUI` → Seu Project Reference ID
- `SEU_TOKEN_AQUI` → Seu Personal Access Token

### **4. Ativar no Cursor**

1. **Salve** o arquivo `.cursor/mcp.json`
2. **Abra**: Cursor Settings
3. **Navegue**: Settings → MCP
4. **Verifique**: Status verde "Active" deve aparecer

## 🔒 **Modo Read-Only Ativado**

A configuração usa `--read-only` por segurança, que significa:

### ✅ **O que você PODE fazer:**
- Consultar tabelas e dados
- Analisar schema do banco
- Buscar informações das tabelas
- Investigar estrutura dos dados
- Gerar queries de consulta

### ❌ **O que você NÃO pode fazer:**
- Modificar dados das tabelas
- Deletar registros
- Alterar schema
- Executar INSERT/UPDATE/DELETE

### 🛠️ **Operações de projeto ainda disponíveis:**
- `create_project` (gerenciamento de projetos)
- Consultas de configuração
- Análise de estrutura

## 🧪 **Testando a Conexão**

Depois de configurar, teste no chat do Cursor:

```
"Mostre-me as tabelas que começam com 'app_' no meu projeto Supabase"
```

```
"Qual é a estrutura da tabela app_conta?"
```

```
"Quantos usuários existem na tabela app_perfil?"
```

## 📚 **Comandos Úteis MCP**

### **Consultar Schema:**
```
"Mostre o schema completo das tabelas app_*"
"Quais são os relacionamentos entre as tabelas?"
"Mostre as colunas da tabela app_lancamento"
```

### **Análise de Dados:**
```
"Quantas transações existem na app_lancamento?"
"Mostre as categorias mais usadas"
"Qual o saldo total de todas as contas?"
```

### **Debugging:**
```
"Verifique se existem dados órfãos nas tabelas"
"Mostre usuários sem perfil na app_perfil"
"Analise a integridade dos dados"
```

## ⚠️ **Troubleshooting**

### **Problema: MCP não conecta**
- ✅ Verifique se o token está correto
- ✅ Confirme o project-ref
- ✅ Restart o Cursor
- ✅ Verificar se tem internet

### **Problema: Erro de permissão**
- ✅ Regenere o Personal Access Token
- ✅ Verifique se o projeto existe
- ✅ Confirme se você tem acesso ao projeto

### **Problema: Comandos não funcionam**
- ✅ Verifique se o MCP está "Active" nas settings
- ✅ Teste com comandos simples primeiro
- ✅ Restart o servidor MCP

## 🔄 **Alternativa: Configuração de produção**

Para uso em produção ou sem read-only, remova o `--read-only`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=SEU_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_TOKEN"
      }
    }
  }
}
```

⚠️ **ATENÇÃO**: Sem `--read-only`, o MCP pode modificar dados!

---

## 📞 **Referências**

- **Documentação oficial**: https://supabase.com/docs/guides/getting-started/mcp
- **GitHub MCP Supabase**: https://github.com/supabase/mcp-server-supabase
- **Troubleshooting**: https://github.com/supabase/mcp-server-supabase/issues

**📅 Criado**: Janeiro 2025  
**🎯 Projeto**: Vitto - Configuração MCP Supabase 