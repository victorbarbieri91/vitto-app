# 🎯 Módulo "Sua História" - Documentação Completa

## Visão Geral

O módulo "Sua História" é um sistema de gamificação completo que transforma a jornada financeira do usuário em uma experiência interativa e motivadora. Inspirado em jogos de progressão, o sistema permite que os usuários visualizem sua evolução financeira através de marcos, badges e conquistas.

---

## 🎮 Conceitos Principais

### 1. **Marcos (Milestones)**
- **Sistema**: Marcos automáticos criados pelo sistema baseados na atividade do usuário
- **Objetivos**: Marcos criados pelo próprio usuário para suas metas pessoais
- **Progresso**: Marcos podem ter valores quantitativos para acompanhar evolução

### 2. **Badges (Conquistas)**
- Recompensas especiais por comportamentos específicos
- Desbloqueadas automaticamente pelo sistema
- Diferentes categorias e níveis de dificuldade

### 3. **Personagem Vitto**
- Mentor virtual que guia o usuário
- Fornece dicas, parabenizações e motivação
- Personalidade: elegante, acolhedor, experiente (60 anos)

### 4. **Timeline Interativa**
- Visualização cronológica de toda a jornada
- Filtros por tipo, status e busca
- Interface gamificada com animações

---

## 🏗️ Estrutura do Sistema

### **Banco de Dados**

```sql
-- Tabela principal para marcos
app_marco:
  - id (UUID)
  - user_id (UUID)
  - categoria ('sistema' | 'objetivo')
  - titulo (TEXT)
  - descricao (TEXT)
  - valor_alvo (DECIMAL)
  - valor_atual (DECIMAL)
  - status ('pendente' | 'concluido')
  - icon_slug (TEXT)
  - cor (TEXT)
  - created_at, updated_at, achieved_at

-- Tabela para badges
app_badge:
  - id (UUID)
  - user_id (UUID)
  - nome (TEXT)
  - descricao (TEXT)
  - icon_slug (TEXT)
  - cor (TEXT)
  - created_at, unlocked_at

-- View unificada para timeline
app_evento_timeline:
  - União de marcos e badges em ordem cronológica
  - Campos padronizados para exibição
```

### **Componentes React**

```
src/components/historia/
├── TimelineBoard.tsx          # Tabuleiro principal
├── MilestoneCard.tsx          # Card de marco individual
├── BadgeCard.tsx              # Card de badge individual
├── VittoCue.tsx               # Personagem Vitto
├── CreateMilestoneModal.tsx   # Modal para criar objetivos
├── ConfettiEffect.tsx         # Efeitos de confete
└── SoundManager.tsx           # Sistema de som
```

### **Serviços e Hooks**

```
src/services/api/MarcosService.ts   # API para marcos e badges
src/hooks/useHistoriaService.ts     # Hook principal
src/types/historia.ts               # Tipos TypeScript
```

---

## 🚀 Instalação e Configuração

### **1. Executar Migrations do Banco**

```bash
# Conectar ao Supabase
npx supabase link --project-ref YOUR_PROJECT_ID

# Executar as migrations
psql -d postgresql://[CONNECTION_STRING] -f docs/database/migrations/create_historia_tables.sql
psql -d postgresql://[CONNECTION_STRING] -f docs/database/seeds/historia_initial_milestones.sql
```

### **2. Atualizar Tipos TypeScript**

```bash
# Gerar tipos atualizados do Supabase
npx supabase gen types typescript --linked > src/types/supabase.ts
```

### **3. Verificar Rotas**

As rotas já foram adicionadas ao sistema:
- `/sua-historia` - Página principal
- `/historia` - Alias
- `/jornada` - Alias

---

## 🎨 Uso dos Componentes

### **TimelineBoard**
```tsx
import TimelineBoard from '../components/historia/TimelineBoard';

function MinhaPage() {
  return (
    <div>
      <TimelineBoard />
    </div>
  );
}
```

### **Personagem Vitto**
```tsx
import VittoCue, { useVittoCue } from '../components/historia/VittoCue';

function MeuComponent() {
  const { parabenizar, motivar, darDica } = useVittoCue();

  const handleSuccess = () => {
    parabenizar('Parabéns! Você atingiu sua meta!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>
        Completar Marco
      </button>
    </div>
  );
}
```

### **Sistema de Som**
```tsx
import { SoundManagerProvider, useGameSounds } from '../components/historia/SoundManager';

function App() {
  return (
    <SoundManagerProvider>
      <MeuApp />
    </SoundManagerProvider>
  );
}

function MeuComponent() {
  const { playMilestoneComplete, playBadgeUnlock } = useGameSounds();

  const handleComplete = () => {
    playMilestoneComplete();
  };
}
```

### **Efeitos de Confete**
```tsx
import { useConfetti, MilestoneConfetti } from '../components/historia/ConfettiEffect';

function MeuComponent() {
  const { celebrate } = useConfetti();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleCelebrate = () => {
    celebrate({ intensity: 'high' });
    setShowConfetti(true);
  };

  return (
    <div>
      <button onClick={handleCelebrate}>
        Celebrar!
      </button>
      <MilestoneConfetti 
        isVisible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
}
```

---

## 📊 Hooks Disponíveis

### **useHistoriaService**
Hook principal para gerenciar marcos e badges:

```tsx
const {
  marcos,                    // Lista de marcos
  badges,                    // Lista de badges
  timeline,                  // Timeline unificada
  resumo,                    // Resumo da jornada
  loading,                   // Estado de carregamento
  createMarco,              // Criar novo marco
  completeMarco,            // Completar marco
  updateProgressoMarco,     // Atualizar progresso
  refreshData              // Recarregar dados
} = useHistoriaService();
```

### **useVittoCue**
Hook para interagir com o personagem Vitto:

```tsx
const {
  parabenizar,              // Parabenizar usuário
  motivar,                  // Motivar usuário
  darDica,                  // Dar dica
  saudar,                   // Saudar usuário
  comemorar                 // Comemorar conquista
} = useVittoCue();
```

### **useGameSounds**
Hook para feedback sonoro:

```tsx
const {
  playMilestoneComplete,    // Som de marco completado
  playBadgeUnlock,          // Som de badge desbloqueada
  playCelebration,          // Som de celebração
  playSuccess,              // Som de sucesso
  playNotification          // Som de notificação
} = useGameSounds();
```

---

## 🎯 Marcos Iniciais do Sistema

Quando um usuário cria seu perfil, os seguintes marcos são criados automaticamente:

1. **Bem-vindo ao Vitto!** 🎉
2. **Primeira conta cadastrada** 💳
3. **Primeiro lançamento registrado** 📝
4. **Primeiro mês organizado** 📅
5. **Saldo positivo por 30 dias** 📈
6. **Primeira categoria personalizada** 🏷️
7. **Primeira meta financeira** 🎯
8. **Primeira conversa com Vitto** 💬
9. **Primeiro orçamento criado** 📊
10. **Cartão de crédito cadastrado** 💳
11. **Reserva de emergência de R$ 1.000** 🛡️
12. **3 salários recebidos no prazo** 💰
13. **1 ano com o Vitto** 🎂
14. **Patrimônio de R$ 10.000** 🏆
15. **Primeira meta conquistada** ⭐

---

## 🎨 Personalização Visual

### **Cores Disponíveis**
- **Coral**: `#F87060` (padrão para marcos do sistema)
- **Verde**: `#10b981` (padrão para badges)
- **Azul**: `#3b82f6`
- **Roxo**: `#9333ea`
- **Amarelo**: `#f59e0b`
- **Vermelho**: `#ef4444`

### **Ícones Disponíveis**
- `target`, `piggy-bank`, `home`, `car`, `plane`
- `graduation-cap`, `heart`, `trophy`, `star`, `gift`
- `shield`, `dollar-sign`, `calendar-check`, `check-circle`

### **Variantes de Cards**
- **default**: Fundo branco padrão
- **glass**: Efeito glassmorphism
- **metric**: Para cards de métricas
- **interactive**: Com hover especial

---

## 🔧 Configurações e Personalização

### **Configurações do Usuário**
- **Notificações do Vitto**: Ativar/desativar dicas
- **Efeitos de Confete**: Ativar/desativar animações
- **Marcos Automáticos**: Ativar/desativar criação automática
- **Som**: Controle de volume e mute

### **Configurações de Desenvolvedor**
```typescript
// Configurar intensidade do confete
const confettiConfig = {
  intensity: 'high',
  duration: 3000,
  colors: ['#F87060', '#10b981']
};

// Configurar duração das mensagens do Vitto
const vittoConfig = {
  duracao: 5000,
  animacao: 'bounce'
};
```

---

## 🐛 Troubleshooting

### **Problemas Comuns**

1. **Marcos não aparecem**
   - Verificar se as migrations foram executadas
   - Verificar se o usuário tem perfil criado
   - Checar console para erros de RLS

2. **Vitto não aparece**
   - Verificar se o hook `useVittoCue` está sendo usado
   - Verificar se há erros de JavaScript
   - Checar se o componente está renderizado

3. **Som não funciona**
   - Verificar se o AudioContext foi inicializado
   - Verificar se o som não está mutado
   - Testar em diferentes navegadores

4. **Confetes não aparecem**
   - Verificar se o framer-motion está instalado
   - Verificar se o componente está no DOM
   - Checar se o trigger está sendo ativado

### **Logs de Debug**
```typescript
// Habilitar logs detalhados
localStorage.setItem('debug_historia', 'true');

// Verificar estado do serviço
console.log('Historia Service:', useHistoriaService());
```

---

## 🚀 Extensibilidade

### **Adicionar Novos Tipos de Marco**
```typescript
// Em types/historia.ts
export type NovaCategoria = 'sistema' | 'objetivo' | 'bonus';

// Em services/api/MarcosService.ts
async createBonusMarco(marco: NovoMarco) {
  // Implementar lógica específica
}
```

### **Adicionar Novos Contextos do Vitto**
```typescript
// Em components/historia/VittoCue.tsx
const frasesVitto = {
  'novo-contexto': [
    {
      id: 'novo-1',
      contexto: 'novo-contexto',
      texto: 'Nova mensagem do Vitto!',
      emoji: '🎉'
    }
  ]
};
```

### **Adicionar Novos Efeitos Sonoros**
```typescript
// Em components/historia/SoundManager.tsx
const soundConfigs = {
  novo_som: {
    frequencies: [440, 554, 659],
    duration: 500,
    type: 'custom'
  }
};
```

---

## 📈 Métricas e Analytics

### **Dados Coletados**
- Marcos completados por usuário
- Badges desbloqueadas
- Tempo médio para completar marcos
- Engajamento com o Vitto
- Uso de recursos de gamificação

### **Queries Úteis**
```sql
-- Marcos mais completados
SELECT titulo, COUNT(*) as total
FROM app_marco 
WHERE status = 'concluido'
GROUP BY titulo
ORDER BY total DESC;

-- Usuários mais engajados
SELECT user_id, COUNT(*) as marcos_completados
FROM app_marco
WHERE status = 'concluido'
GROUP BY user_id
ORDER BY marcos_completados DESC;

-- Badges mais comuns
SELECT nome, COUNT(*) as total
FROM app_badge
GROUP BY nome
ORDER BY total DESC;
```

---

## 🎯 Roadmap Futuro

### **Funcionalidades Planejadas**
- [ ] Sistema de níveis e XP
- [ ] Leaderboard entre usuários
- [ ] Marcos colaborativos
- [ ] Integração com redes sociais
- [ ] Avatares personalizáveis do Vitto
- [ ] Conquistas sazonais
- [ ] Sistema de recompensas
- [ ] Modo noturno para gamificação

### **Melhorias Técnicas**
- [ ] Otimização de performance
- [ ] Testes automatizados
- [ ] Documentação Storybook
- [ ] Acessibilidade completa
- [ ] PWA para notificações
- [ ] Sincronização offline

---

## 👥 Contribuição

### **Como Contribuir**
1. Criar branch feature/historia-nova-funcionalidade
2. Seguir padrões de código existentes
3. Adicionar testes se necessário
4. Documentar mudanças
5. Criar PR com descrição detalhada

### **Padrões de Commit**
```
feat(historia): adicionar novo tipo de badge
fix(historia): corrigir bug no VittoCue
docs(historia): atualizar documentação
style(historia): melhorar animações
refactor(historia): reorganizar componentes
test(historia): adicionar testes unitários
```

---

## 📞 Suporte

Para dúvidas e suporte:
- **Documentação**: Este arquivo
- **Código**: Comentários inline nos componentes
- **Issues**: GitHub Issues do projeto
- **Contato**: Equipe de desenvolvimento

---

**📅 Última atualização**: Janeiro 2025  
**🎯 Projeto**: Vitto - Módulo Sua História  
**👨‍💻 Desenvolvido com**: React, TypeScript, Framer Motion, Supabase