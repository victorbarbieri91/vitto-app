# 🧩 Components - Vitto Design System

Catálogo completo dos componentes React do Vitto Financial com props, variantes e exemplos de uso.

## 📚 Índice Rápido

| Componente | Categoria | Descrição | Storybook |
|------------|-----------|-----------|-----------|
| [ModernCard](#moderncard) | Containers | Card base com múltiplas variantes | [View](http://localhost:6006/?path=/docs/cards-moderncard) |
| [ModernButton](#modernbutton) | Actions | Botões com estados e animações | [View](http://localhost:6006/?path=/docs/buttons-modernbutton) |
| [ModernInput](#moderninput) | Forms | Campos de entrada com validação | [View](http://localhost:6006/?path=/docs/forms-moderninput) |
| [MetricCard](#metriccard) | Display | Card de métricas com tendências | [View](http://localhost:6006/?path=/docs/cards-metriccard) |
| [SimpleMetricCard](#simplemetriccard) | Display | Card de métricas simplificado | [View](http://localhost:6006/?path=/docs/cards-simplemetriccard) |
| [GlassmorphCard](#glassmorphcard) | Containers | Card com efeito glassmorphism | [View](http://localhost:6006/?path=/docs/cards-glassmorphcard) |
| [ProgressRing](#progressring) | Display | Indicador circular de progresso | [View](http://localhost:6006/?path=/docs/display-progressring) |
| [WelcomeHeader](#welcomeheader) | Layout | Cabeçalho com saudação | [View](http://localhost:6006/?path=/docs/layout-welcomeheader) |
| [ModernBadge](#modernbadge) | Display | Badges de status | [View](http://localhost:6006/?path=/docs/display-modernbadge) |
| [ModernSwitch](#modernswitch) | Forms | Toggle switch animado | [View](http://localhost:6006/?path=/docs/forms-modernswitch) |
| [ModernSelect](#modernselect) | Forms | Dropdown select | [View](http://localhost:6006/?path=/docs/forms-modernselect) |
| [AnimatedNumber](#animatednumber) | Display | Números animados | [View](http://localhost:6006/?path=/docs/display-animatednumber) |
| [MonthNavigator](#monthnavigator) | Navigation | Navegador de mês/ano | [View](http://localhost:6006/?path=/docs/navigation-monthnavigator) |

---

## 🎴 Cards

### ModernCard

**Card base** do design system com múltiplas variantes para diferentes casos de uso.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'default' \| 'glass' \| 'glass-strong' \| 'metric' \| 'metric-primary' \| 'metric-success' \| 'metric-warning' \| 'metric-danger' \| 'dark' \| 'metric-interactive'` | `'default'` | Variante visual do card |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Espaçamento interno |
| `hover` | `boolean` | `false` | Ativa efeitos de hover (escala + elevação) |
| `animate` | `boolean` | `true` | Ativa animação de entrada |
| `className` | `string` | `undefined` | Classes Tailwind adicionais |
| `children` | `ReactNode` | - | Conteúdo do card |

#### Variantes

**default** - Card branco padrão
```tsx
<ModernCard variant="default" padding="lg">
  Conteúdo padrão
</ModernCard>
```

**glass / glass-strong** - Efeito glassmorphism
```tsx
<ModernCard variant="glass" padding="md">
  Card translúcido com blur
</ModernCard>
```

**metric-*** - Cards com gradientes para métricas
```tsx
<ModernCard variant="metric-primary" padding="md">
  <p className="text-sm text-neutral-600">Receitas</p>
  <p className="text-3xl font-bold text-primary-600">R$ 7.500</p>
</ModernCard>
```

**metric-interactive** - Card interativo para KPIs clicáveis
```tsx
<ModernCard
  variant="metric-interactive"
  padding="md"
  onClick={() => console.log('Clicked')}
>
  Card que muda de cor ao hover
</ModernCard>
```

**dark** - Card escuro para destaques
```tsx
<ModernCard variant="dark" padding="lg">
  <p className="text-white">Conteúdo com fundo escuro</p>
</ModernCard>
```

#### Quando Usar

- ✅ **default**: Conteúdo geral, formulários, listas
- ✅ **glass**: Modais, overlays, elementos flutuantes
- ✅ **metric-***: KPIs, estatísticas, dashboards
- ✅ **metric-interactive**: KPIs clicáveis com feedback visual
- ✅ **dark**: CTAs importantes, elementos de destaque

#### Best Practices

- Use `padding="lg"` para cards com muito conteúdo
- Combine `hover={true}` com `onClick` para indicar interatividade
- `glass` funciona melhor sobre backgrounds coloridos ou imagens
- `metric-interactive` automaticamente muda cores no hover (branco → coral)

---

### GlassmorphCard

**Card especializado** com efeito glassmorphism avançado e múltiplos níveis de transparência.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'subtle' \| 'medium' \| 'strong' \| 'frosted'` | `'medium'` | Nível de transparência |
| `blur` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Intensidade do blur |
| `border` | `boolean` | `true` | Exibir borda translúcida |
| `shadow` | `boolean` | `true` | Aplicar sombra glassmorphism |
| `animate` | `boolean` | `true` | Animação de entrada (scale + fade) |
| `className` | `string` | `undefined` | Classes adicionais |
| `children` | `ReactNode` | - | Conteúdo |

#### Níveis de Transparência

- **subtle**: `bg-white/70` - Muito translúcido
- **medium**: `bg-white/80` - Balanceado (padrão)
- **strong**: `bg-white/90` - Quase opaco
- **frosted**: `bg-white/95` - Praticamente sólido

#### Exemplo Completo

```tsx
<GlassmorphCard
  variant="medium"
  blur="lg"
  border={true}
  shadow={true}
  className="p-8 max-w-md"
>
  <h2 className="text-2xl font-bold mb-4">Modal Glassmorphism</h2>
  <p>Conteúdo com efeito de vidro</p>
</GlassmorphCard>
```

#### Componentes Auxiliares

**GlassOverlay** - Overlay de fundo para modais
```tsx
<GlassOverlay onClick={closeModal}>
  <GlassmorphCard>
    Conteúdo do modal
  </GlassmorphCard>
</GlassOverlay>
```

**GlassFormContainer** - Container pré-configurado para formulários
```tsx
<GlassFormContainer
  title="Login"
  subtitle="Entre com suas credenciais"
>
  <form>...</form>
</GlassFormContainer>
```

#### Quando Usar

- ✅ Modais e dialogs
- ✅ Overlays sobre imagens ou gradientes
- ✅ Formulários flutuantes
- ✅ Cards de boas-vindas
- ❌ Não usar sobre fundos brancos (perde o efeito)

---

### MetricCard

**Card de métricas** com animação de números, ícone, tendências e indicadores visuais.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | - | Título da métrica |
| `value` | `string \| number` | - | Valor principal |
| `subtitle` | `string` | `undefined` | Texto secundário opcional |
| `change` | `number` | `undefined` | Percentual de mudança (+/-) |
| `icon` | `ReactNode` | `undefined` | Ícone opcional |
| `isLoading` | `boolean` | `false` | Estado de carregamento (skeleton) |
| `animate` | `boolean` | `true` | Anima a entrada |
| `onClick` | `() => void` | `undefined` | Handler de clique |
| `className` | `string` | `undefined` | Classes adicionais |

#### Exemplo de Uso

```tsx
<MetricCard
  title="Receitas do Mês"
  value={7500.00}
  subtitle="Março 2025"
  change={12.5}
  icon={<TrendingUp className="w-5 h-5" />}
  onClick={() => navigate('/receitas')}
/>
```

#### Features Automáticas

**Animação de Números**
- Se `value` for número, usa `AnimatedNumber` para contar até o valor
- Formatação automática em BRL: `R$ 7.500,00`

**Indicador de Tendência**
- `change > 0`: Seta verde ↑ +12.5%
- `change < 0`: Seta vermelha ↓ -8.3%
- `change === 0 ou undefined`: Sem indicador

**Skeleton Loading**
- Quando `isLoading={true}`, exibe skeleton animado

**Hover Interativo**
- Usa `variant="metric-interactive"` do ModernCard
- Muda de branco para coral no hover
- Textos mudam de cor (slate → deep-blue)

#### Quando Usar

- ✅ KPIs de dashboard
- ✅ Estatísticas financeiras
- ✅ Valores monetários com tendências
- ✅ Métricas clicáveis

---

### SimpleMetricCard

**Versão simplificada** do MetricCard sem tendências, focado em exibição limpa.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | - | Título da métrica |
| `value` | `number \| null` | - | Valor (sempre número) |
| `icon` | `ReactNode` | `undefined` | Ícone opcional |
| `isLoading` | `boolean` | `false` | Estado de loading |
| `onClick` | `() => void` | `undefined` | Handler de clique |
| `className` | `string` | `undefined` | Classes adicionais |

#### Exemplo

```tsx
<SimpleMetricCard
  title="Saldo Atual"
  value={15000.50}
  icon={<Wallet className="w-4 h-4" />}
/>
```

#### Diferenças do MetricCard

| Feature | MetricCard | SimpleMetricCard |
|---------|------------|------------------|
| Animação de número | ✅ | ✅ |
| Indicador de tendência | ✅ | ❌ |
| Subtitle | ✅ | ❌ |
| Formatação BRL | ✅ | ✅ |
| Responsividade mobile | Padrão | Otimizada (texto menor) |

#### Mobile Optimization

No mobile (`size === 'mobile'`):
- Padding reduzido: `p-3`
- Fonte menor: `text-[10px]` (título), `text-xs` (valor)
- Valores sem centavos: `R$ 15.000` ao invés de `R$ 15.000,50`

---

## 🔘 Buttons

### ModernButton

**Botão moderno** com múltiplas variantes, estados de loading e ícones.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'outline' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon'` | `'md'` | Tamanho do botão |
| `fullWidth` | `boolean` | `false` | Largura 100% |
| `isLoading` | `boolean` | `false` | Exibe spinner e desabilita |
| `leftIcon` | `ReactNode` | `undefined` | Ícone à esquerda |
| `rightIcon` | `ReactNode` | `undefined` | Ícone à direita |
| `icon` | `ReactNode` | `undefined` | Alias para `leftIcon` |
| `disabled` | `boolean` | `false` | Desabilita o botão |
| `className` | `string` | `undefined` | Classes adicionais |

#### Variantes

**primary** - Ação principal (coral)
```tsx
<ModernButton variant="primary">
  Salvar
</ModernButton>
```

**secondary** - Ação alternativa (outline coral)
```tsx
<ModernButton variant="secondary">
  Cancelar
</ModernButton>
```

**ghost** - Ação sutil (transparente)
```tsx
<ModernButton variant="ghost">
  Ver mais
</ModernButton>
```

**outline** - Ação secundária com borda
```tsx
<ModernButton variant="outline">
  Editar
</ModernButton>
```

**success / warning / danger** - Ações contextuais
```tsx
<ModernButton variant="success">Aprovar</ModernButton>
<ModernButton variant="warning">Atenção</ModernButton>
<ModernButton variant="danger">Deletar</ModernButton>
```

#### Tamanhos

```tsx
<ModernButton size="sm">Pequeno</ModernButton>
<ModernButton size="md">Médio (padrão)</ModernButton>
<ModernButton size="lg">Grande</ModernButton>
<ModernButton size="xl">Extra Grande</ModernButton>
<ModernButton size="icon"><Plus /></ModernButton>
```

#### Com Ícones

```tsx
<ModernButton
  leftIcon={<Save className="w-4 h-4" />}
>
  Salvar
</ModernButton>

<ModernButton
  rightIcon={<ArrowRight className="w-4 h-4" />}
>
  Próximo
</ModernButton>
```

#### Estado de Loading

```tsx
<ModernButton isLoading>
  Salvando...
</ModernButton>
// Exibe spinner animado e desabilita interação
```

#### Animações

- **Hover**: `scale(1.02)` - Cresce 2%
- **Active**: `scale(0.98)` - Reduz ao clicar
- **Duration**: `100ms` - Feedback instantâneo

#### Best Practices

- 🎯 Use apenas **1 botão primary** por tela (ação principal)
- ✅ Loading state ao invés de disabled durante operações async
- ✅ Ícones devem ter `w-4 h-4` ou `w-5 h-5`
- ❌ Não use `fullWidth` em desktop (apenas mobile)

---

## 📝 Forms

### ModernInput

**Campo de entrada** moderno com validação, ícones e estados visuais.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `undefined` | Label do campo |
| `error` | `string` | `undefined` | Mensagem de erro |
| `helperText` | `string` | `undefined` | Texto de ajuda |
| `leftIcon` | `ReactNode` | `undefined` | Ícone à esquerda |
| `rightIcon` | `ReactNode` | `undefined` | Ícone à direita |
| `rightElement` | `ReactNode` | `undefined` | Elemento customizado à direita |
| `isLoading` | `boolean` | `false` | Exibe spinner |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Estilo (erro sobrescreve) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `disabled` | `boolean` | `false` | Desabilita campo |

#### Exemplo Básico

```tsx
<ModernInput
  label="E-mail"
  type="email"
  placeholder="seu@email.com"
  helperText="Nunca compartilharemos seu e-mail"
/>
```

#### Com Validação

```tsx
<ModernInput
  label="Senha"
  type="password"
  error="Senha deve ter no mínimo 8 caracteres"
  leftIcon={<Lock className="w-5 h-5" />}
/>
```

#### Com Loading

```tsx
<ModernInput
  label="Username"
  isLoading
  helperText="Verificando disponibilidade..."
/>
```

#### Com Right Element (Custom)

```tsx
<ModernInput
  label="Valor"
  type="number"
  rightElement={
    <span className="text-sm font-medium text-neutral-500">
      BRL
    </span>
  }
/>
```

#### Features Automáticas

**Label Animado**
- Muda de cor ao focar: `neutral-700` → `coral-500`
- Se houver erro: sempre `danger-600`

**Validação Visual**
- Erro: Borda vermelha + ícone de alerta + mensagem
- Sucesso: Borda verde (variant="success")

**Mobile Optimization**
- `inputMode="numeric"` para campos numéricos
- `autoComplete="off"` no mobile (evita suggestions)

**Estados de Foco**
- Ring coral animado: `focus:ring-4 focus:ring-coral-500/10`
- Borda coral: `focus:border-coral-500`

#### Best Practices

- ✅ Sempre forneça `label` para acessibilidade
- ✅ Use `helperText` para instruções
- ✅ `error` deve ser específico, não genérico
- ❌ Não use `placeholder` como label (acessibilidade)

---

### ModernSelect

**Dropdown select** customizado com estilo Vitto.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `undefined` | Label do select |
| `error` | `string` | `undefined` | Mensagem de erro |
| `variant` | `'default' \| 'error'` | `'default'` | Estilo visual |
| `wrapperClassName` | `string` | `undefined` | Classes do container |

#### Exemplo

```tsx
<ModernSelect
  label="Categoria"
  error={errors.category}
>
  <option value="">Selecione...</option>
  <option value="1">Alimentação</option>
  <option value="2">Transporte</option>
  <option value="3">Saúde</option>
</ModernSelect>
```

#### Com React Hook Form

```tsx
<ModernSelect
  label="Conta"
  {...register('conta_id', { required: true })}
  error={errors.conta_id?.message}
>
  {accounts.map(acc => (
    <option key={acc.id} value={acc.id}>
      {acc.nome}
    </option>
  ))}
</ModernSelect>
```

#### Features

- Ícone de chevron automático (direita)
- Mesma altura de ModernInput (`h-12`)
- Focus ring coral
- Borda arredondada (`rounded-2xl`)

---

### ModernSwitch

**Toggle switch** animado com label e descrição.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `checked` | `boolean` | - | Estado do switch |
| `onChange` | `(checked: boolean) => void` | - | Handler de mudança |
| `label` | `string` | - | Texto principal |
| `description` | `string` | `undefined` | Texto secundário |
| `disabled` | `boolean` | `false` | Desabilita o switch |

#### Exemplo

```tsx
const [enabled, setEnabled] = useState(false);

<ModernSwitch
  checked={enabled}
  onChange={setEnabled}
  label="Notificações por e-mail"
  description="Receba atualizações sobre suas transações"
/>
```

#### Animação

- Transição suave com **Framer Motion**
- Spring physics: `stiffness: 700, damping: 30`
- Cores: `bg-coral-500` (on) / `bg-slate-200` (off)

---

## 📊 Display

### ProgressRing

**Indicador circular** de progresso com múltiplas cores e tamanhos.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `value` | `number` | - | Valor atual |
| `max` | `number` | `100` | Valor máximo |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamanho do anel |
| `color` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'neutral' \| 'coral'` | `'primary'` | Cor do progresso |
| `strokeWidth` | `number` | `undefined` | Espessura customizada |
| `centerContent` | `ReactNode` | `undefined` | Conteúdo no centro |
| `showValue` | `boolean` | `false` | Exibir porcentagem |
| `animate` | `boolean` | `true` | Animação de entrada |

#### Tamanhos

- **sm**: 60px (strokeWidth: 4px)
- **md**: 80px (strokeWidth: 6px)
- **lg**: 120px (strokeWidth: 8px)
- **xl**: 160px (strokeWidth: 10px)

#### Exemplo Básico

```tsx
<ProgressRing
  value={75}
  max={100}
  size="lg"
  color="success"
  showValue
/>
// Exibe anel verde com "75%" no centro
```

#### Com Conteúdo Customizado

```tsx
<ProgressRing
  value={8}
  max={10}
  size="xl"
  color="primary"
  centerContent={
    <div className="text-center">
      <p className="text-3xl font-bold text-primary-600">8</p>
      <p className="text-sm text-neutral-500">Metas</p>
    </div>
  }
/>
```

#### Componente Auxiliar

**ProgressRingCompact** - Versão menor para uso inline
```tsx
<ProgressRingCompact
  value={60}
  color="success"
  size={40}
  strokeWidth={4}
/>
```

#### Animações

- Anel: Animação de 1.5s com easing `easeInOut`
- Centro: Fade + scale após 0.8s
- Suave e performático (GPU-accelerated)

---

### AnimatedNumber

**Contador animado** para valores numéricos com formatação customizável.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `value` | `number` | - | Valor alvo |
| `duration` | `number` | `4000` | Duração da animação (ms) |
| `format` | `(value: number) => string` | `undefined` | Função de formatação |
| `prefix` | `string` | `''` | Prefixo (ex: "R$") |
| `suffix` | `string` | `''` | Sufixo (ex: "%") |
| `decimals` | `number` | `0` | Casas decimais |
| `className` | `string` | `undefined` | Classes adicionais |

#### Exemplo Básico

```tsx
<AnimatedNumber
  value={7500}
  decimals={2}
  prefix="R$ "
/>
// Anima de 0 até R$ 7500.00
```

#### Com Formatação BRL

```tsx
<AnimatedNumber
  value={15000.50}
  format={(v) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)}
/>
// R$ 15.000,50
```

#### Como Porcentagem

```tsx
<AnimatedNumber
  value={87.5}
  decimals={1}
  suffix="%"
/>
// 87.5%
```

#### Hook Auxiliar

**useAnimatedNumber** - Controle manual da animação
```tsx
const { value, isAnimating, animate } = useAnimatedNumber(0, {
  duration: 2000,
  decimals: 2,
  autoStart: false,
});

// Disparar animação manualmente
<button onClick={() => animate(500)}>
  Animar para 500
</button>
```

#### Physics

- Usa **Framer Motion Spring** para suavidade natural
- `stiffness: 100, damping: 30, mass: 1`
- Animação responsiva e não-linear

---

### ModernBadge

**Badge de status** com cores contextuais.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Cor do badge |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `className` | `string` | `undefined` | Classes adicionais |
| `children` | `ReactNode` | - | Texto do badge |

#### Variantes

```tsx
<ModernBadge variant="default">Padrão</ModernBadge>
<ModernBadge variant="success">Pago</ModernBadge>
<ModernBadge variant="warning">Pendente</ModernBadge>
<ModernBadge variant="danger">Atrasado</ModernBadge>
<ModernBadge variant="info">Novo</ModernBadge>
```

#### Tamanhos

- **sm**: `px-2 py-1 text-xs`
- **md**: `px-3 py-1 text-sm`
- **lg**: `px-4 py-2 text-base`

#### Cores

| Variant | Background | Text |
|---------|------------|------|
| default | slate-100 | slate-700 |
| success | green-100 | green-700 |
| warning | yellow-100 | yellow-700 |
| danger | red-100 | red-700 |
| info | blue-100 | blue-700 |

---

## 🎯 Layout

### WelcomeHeader

**Cabeçalho de boas-vindas** com saudação contextual e conteúdo à direita.

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `userName` | `string` | - | Nome do usuário |
| `subtitle` | `string` | `undefined` | Texto secundário |
| `rightContent` | `ReactNode` | `undefined` | Conteúdo à direita |
| `className` | `string` | `undefined` | Classes adicionais |

#### Exemplo

```tsx
<WelcomeHeader
  userName="Victor"
  subtitle="Bem-vindo de volta!"
  rightContent={<DateTimeDisplay />}
/>
```

#### Saudação Automática

Calcula automaticamente baseado na hora:
- 00:00 - 11:59: **Bom dia**
- 12:00 - 17:59: **Boa tarde**
- 18:00 - 23:59: **Boa noite**

#### Cores do Texto

- Saudação: `text-deep-blue`
- Nome do usuário: `text-coral-500`
- Subtitle: `text-slate-500`

#### Componentes Auxiliares

**DateTimeDisplay** - Exibe data e hora
```tsx
<DateTimeDisplay />
// Exibe: "segunda-feira, 15 de janeiro de 2025"
//         "Última atualização: 14:30"
```

**PeriodDisplay** - Exibe período selecionado
```tsx
<PeriodDisplay
  period="month"
  customRange={{ startDate: '2025-01-01', endDate: '2025-01-31' }}
/>
```

#### Animações

- Título: Fade + slide up (500ms)
- Subtitle: Fade + slide up (600ms, delay 100ms)
- Right content: Fade + slide left (700ms, delay 200ms)

---

## 🧭 Navigation

### MonthNavigator

**Navegador de mês/ano** com botões de anterior/próximo e botão "hoje".

#### Props

| Prop | Type | Default | Descrição |
|------|------|---------|-----------|
| `currentMonth` | `number` | - | Mês atual (1-12) |
| `currentYear` | `number` | - | Ano atual |
| `onMonthChange` | `(month: number, year: number) => void` | - | Callback de mudança |
| `className` | `string` | `undefined` | Classes adicionais |

#### Exemplo

```tsx
const [month, setMonth] = useState(new Date().getMonth() + 1);
const [year, setYear] = useState(new Date().getFullYear());

<MonthNavigator
  currentMonth={month}
  currentYear={year}
  onMonthChange={(m, y) => {
    setMonth(m);
    setYear(y);
  }}
/>
```

#### Features

**Navegação Circular**
- Dezembro → Janeiro (próximo ano)
- Janeiro → Dezembro (ano anterior)

**Botão "Hoje"**
- Clicável para voltar ao mês atual
- Desabilitado se já estiver no mês atual
- Ícone de calendário

**Glassmorphism**
- Background: `bg-white/10 backdrop-blur-md`
- Bordas translúcidas
- Botões com hover coral

#### Animações

- Entrada: Fade + slide left (500ms, delay 200ms)
- Botões: Scale no hover (1.05) e tap (0.95)
- Transições suaves

---

## 📋 Padrões de Uso

### Importação

Todos os componentes são exportados de `@/components/ui/modern/`:

```tsx
import ModernCard from '@/components/ui/modern/ModernCard';
import ModernButton from '@/components/ui/modern/ModernButton';
import MetricCard from '@/components/ui/modern/MetricCard';
// ... etc
```

### Composição de Cards

Combine componentes para criar layouts ricos:

```tsx
<ModernCard variant="default" padding="lg">
  <WelcomeHeader
    userName="Victor"
    subtitle="Dashboard financeiro"
  />

  <div className="grid grid-cols-3 gap-4 mt-6">
    <MetricCard
      title="Receitas"
      value={7500}
      change={12.5}
      icon={<TrendingUp />}
    />
    <MetricCard
      title="Despesas"
      value={3200}
      change={-5.8}
      icon={<TrendingDown />}
    />
    <SimpleMetricCard
      title="Saldo"
      value={4300}
      icon={<Wallet />}
    />
  </div>

  <ModernButton
    variant="primary"
    fullWidth
    className="mt-6"
  >
    Ver Relatório Completo
  </ModernButton>
</ModernCard>
```

### Formulários com Validação

Use com React Hook Form + Zod:

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

<form onSubmit={handleSubmit(onSubmit)}>
  <ModernInput
    label="E-mail"
    type="email"
    {...register('email')}
    error={errors.email?.message}
    leftIcon={<Mail />}
  />

  <ModernInput
    label="Valor"
    type="number"
    {...register('valor')}
    error={errors.valor?.message}
    leftIcon={<DollarSign />}
  />

  <ModernSelect
    label="Categoria"
    {...register('categoria_id')}
    error={errors.categoria_id?.message}
  >
    <option value="">Selecione...</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.nome}</option>
    ))}
  </ModernSelect>

  <ModernButton
    type="submit"
    variant="primary"
    fullWidth
    isLoading={isSubmitting}
  >
    Salvar
  </ModernButton>
</form>
```

### Dashboard com Glassmorphism

Combine glassmorphism com métricas:

```tsx
<div className="min-h-screen bg-gradient-to-br from-primary-500 to-deep-blue p-6">
  <GlassmorphCard variant="medium" blur="lg">
    <WelcomeHeader userName="Victor" />

    <div className="grid grid-cols-2 gap-4 mt-6">
      <ProgressRing
        value={75}
        max={100}
        size="lg"
        color="success"
        showValue
      />

      <MetricCard
        title="Meta do Mês"
        value={10000}
        change={25}
      />
    </div>
  </GlassmorphCard>
</div>
```

---

## ✅ Best Practices Gerais

### Performance

1. **Use `memo()` para componentes pesados**
   ```tsx
   const MemoizedCard = memo(MetricCard);
   ```

2. **Desabilite animações se não necessário**
   ```tsx
   <ModernCard animate={false} />
   ```

3. **Lazy load em listas longas**
   ```tsx
   {items.map((item, i) => (
     <ModernCard
       key={item.id}
       animate={i < 10} // Apenas primeiros 10
     />
   ))}
   ```

### Acessibilidade

1. **Sempre forneça labels**
   ```tsx
   <ModernInput label="E-mail" />
   ```

2. **Use ARIA quando necessário**
   ```tsx
   <ModernButton aria-label="Fechar modal">
     <X />
   </ModernButton>
   ```

3. **Feedback visual de foco**
   - Todos os componentes têm `focus:ring` automático

### Responsividade

1. **Use Tailwind responsive classes**
   ```tsx
   <ModernCard className="p-4 md:p-6 lg:p-8">
   ```

2. **Aproveite `useResponsiveClasses`**
   - MetricCard e WelcomeHeader já usam
   - Adapta automaticamente mobile/tablet/desktop

3. **FullWidth em mobile, fixo em desktop**
   ```tsx
   <ModernButton
     variant="primary"
     className="w-full md:w-auto"
   >
   ```

### Consistência

1. **Siga a paleta de cores**
   - Primary (coral): CTAs principais
   - Deep Blue: Textos e estrutura
   - Slate: Elementos neutros

2. **Use variantes apropriadas**
   - `primary`: 1 por tela (ação principal)
   - `secondary`: Ações alternativas
   - `ghost`: Links e ações sutis

3. **Espaçamentos padronizados**
   - `padding="md"` padrão para cards
   - `size="md"` padrão para botões/inputs
   - Sistema base 8px (p-4, p-6, p-8)

---

## 🔗 Recursos

- **Storybook**: http://localhost:6006 - Visualize todos os componentes
- **Design System**: [OVERVIEW.md](./OVERVIEW.md) - Princípios e filosofia
- **Cores**: [COLORS_TYPOGRAPHY.md](./COLORS_TYPOGRAPHY.md) - Paleta completa
- **Animações**: [ANIMATIONS.md](./ANIMATIONS.md) - Guidelines de animação
- **Responsividade**: [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) - Sistema responsivo

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
**Total de componentes**: 13
