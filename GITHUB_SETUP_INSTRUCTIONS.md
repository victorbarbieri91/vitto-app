# Instruções para Configurar GitHub e Deploy - Vitto App

## 📋 Status Atual
✅ Repositório Git inicializado
✅ Arquivos commitados
✅ .env.example criado (dados sensíveis protegidos)

## 🔧 Próximos Passos

### 1. Instalar GitHub CLI (se necessário)
```bash
# Abra um novo terminal como administrador e execute:
winget install GitHub.cli

# Ou baixe diretamente de: https://cli.github.com/
```

### 2. Autenticar no GitHub
```bash
# Após instalar o GitHub CLI:
gh auth login
# Selecione "GitHub.com" → "HTTPS" → "Login with a web browser"
```

### 3. Criar Repositório no GitHub
```bash
# Opção 1: Com GitHub CLI (recomendado)
gh repo create vitto-app --public --description "Sistema Financeiro Pessoal - React + TypeScript + Supabase"

# Opção 2: Manual
# 1. Acesse https://github.com/new
# 2. Nome: vitto-app
# 3. Descrição: Sistema Financeiro Pessoal - React + TypeScript + Supabase
# 4. Público
# 5. NÃO inicializar com README (já temos)
```

### 4. Conectar Repositório Local ao GitHub
```bash
# Se usou GitHub CLI:
git remote add origin https://github.com/SEU_USUARIO/vitto-app.git
git push -u origin master

# Se criou manualmente, GitHub fornecerá os comandos exatos
```

### 5. Configurar Deploy - Vercel (Recomendado)
1. Acesse https://vercel.com
2. Conecte com sua conta GitHub
3. Clique "New Project"
4. Selecione o repositório "vitto-app"
5. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`: https://omgrgbyexbxtqoyewwra.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: [sua chave anônima]
   - `VITE_OPENAI_API_KEY`: [sua chave OpenAI - opcional]
   - `VITE_AI_MODEL`: gpt-4o-mini
   - `VITE_AI_ENABLED`: true
6. Deploy automático!

### 6. Configurar Deploy - Netlify (Alternativa)
1. Acesse https://netlify.com
2. Conecte com GitHub
3. "New site from Git" → Selecione repositório
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Configure variáveis de ambiente (mesmo que Vercel)

## 🚀 Após o Deploy

### Domínio Personalizado (Opcional)
- **Vercel**: Projeto → Settings → Domains
- **Netlify**: Site → Domain settings

### CI/CD Automático
✅ Deploy automático já configurado em ambas plataformas
✅ Cada push para `master` dispara novo deploy

### Monitoramento
- Vercel: Dashboard com analytics integrado
- Netlify: Deploy previews automáticos para PRs

## 🔒 Segurança
✅ .env ignorado pelo Git
✅ Variáveis sensíveis apenas no painel da plataforma
✅ Build apenas com variáveis de ambiente seguras

## 📊 URLs de Exemplo
- **Repositório**: https://github.com/[usuario]/vitto-app
- **Deploy Vercel**: https://vitto-app.vercel.app
- **Deploy Netlify**: https://vitto-app.netlify.app

## ⚡ Commands Úteis
```bash
# Ver status do repositório
git status

# Fazer novo deploy
git add .
git commit -m "feat: nova funcionalidade"
git push origin master

# Ver logs de deploy
gh repo view --web  # abre repositório no browser
```

---

💡 **Dica**: Recomendo Vercel pela integração superior com React/Vite e analytics gratuitos!