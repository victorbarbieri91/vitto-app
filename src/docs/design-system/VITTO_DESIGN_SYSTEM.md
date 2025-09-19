# Vitto Design System 🎨

## Visão Geral

O Vitto Design System é baseado em princípios de design moderno, inspirado em interfaces como Crextio e DisputeFox, com foco em elegância, funcionalidade e experiência do usuário excepcional. Este documento registra todos os padrões visuais e de interação desenvolvidos para garantir consistência em todo o sistema.

---

## 🎨 Paleta de Cores

### Cores Primárias
```css
/* Coral - Cor principal da marca Vitto */
--coral-50: #fef7f0
--coral-100: #feede0
--coral-200: #fdd9c1
--coral-300: #fbb596
--coral-400: #f8876a
--coral-500: #F87060  /* Cor principal */
--coral-600: #ed4f37
--coral-700: #dc3626
--coral-800: #b92d20
--coral-900: #9a2a1f

/* Deep Blue - Cor secundária */
--deep-blue: #102542  /* Azul escuro para textos e elementos secundários */
```

### Cores de Apoio
```css
/* Slate - Para textos neutros e backgrounds */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-300: #cbd5e1
--slate-400: #94a3b8
--slate-500: #64748b
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a
```

### Cores Funcionais
```css
/* Success */
--green-500: #10b981
--green-600: #059669

/* Warning */
--yellow-500: #f59e0b
--yellow-600: #d97706

/* Error */
--red-500: #ef4444
--red-600: #dc2626
```

---

## 📝 Tipografia

### Fonte Principal
- **Família**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif

### Hierarquia Tipográfica
```css
/* Títulos Principais */
.title-xl { font-size: 2.5rem; font-weight: 700; } /* 40px */
.title-lg { font-size: 2rem; font-weight: 600; }   /* 32px */
.title-md { font-size: 1.5rem; font-weight: 600; } /* 24px */

/* Subtítulos */
.subtitle-lg { font-size: 1.25rem; font-weight: 500; } /* 20px */
.subtitle-md { font-size: 1.125rem; font-weight: 500; } /* 18px */

/* Corpo de Texto */
.body-lg { font-size: 1rem; font-weight: 400; }     /* 16px */
.body-md { font-size: 0.875rem; font-weight: 400; } /* 14px */
.body-sm { font-size: 0.75rem; font-weight: 400; }  /* 12px */

/* Texto Destacado */
.text-emphasis { font-weight: 600; }
.text-subtle { color: var(--slate-500); }
```

### Padrões de Cor Tipográfica
- **Títulos principais**: `text-deep-blue` ou combinação `text-deep-blue` + `text-coral-500`
- **Subtítulos**: `text-deep-blue`
- **Corpo de texto**: `text-slate-600` ou `text-slate-700`
- **Texto secundário**: `text-slate-500`
- **Texto em fundos escuros**: `text-white` ou `text-slate-200`

---

## 🧱 Componentes Base

### ModernCard
Componente principal para containers de conteúdo.

#### Variantes Disponíveis
```typescript
type CardVariant = 
  | 'default'           // Fundo branco, borda sutil
  | 'glass'            // Efeito glassmorphism
  | 'glass-strong'     // Glassmorphism mais intenso
  | 'metric'           // Para cards de métricas/KPIs
  | 'metric-interactive' // Cards de métricas com hover
  | 'dark'             // Fundo deep-blue, texto claro
```

#### Uso Padrão
```tsx
<ModernCard variant="default" padding="md">
  {children}
</ModernCard>
```

### ModernButton
Botões com design consistente e estados de interação.

#### Variantes
- `primary`: Fundo coral, texto branco
- `secondary`: Borda coral, texto coral
- `outline`: Borda cinza, texto neutro
- `ghost`: Transparente com hover

#### Tamanhos
- `sm`: Altura 36px, padding pequeno
- `md`: Altura 44px, padding médio
- `lg`: Altura 52px, padding grande

### ModernInput
Campos de entrada com design glassmorphism sutil.

#### Características
- Bordas arredondadas (rounded-2xl)
- Focus ring coral
- Ícones à esquerda opcionais
- Estados de erro com feedback visual

---

## 🎭 Padrões de Interface

### Layout Principal
```
┌─────────────────────────────────────────┐
│ Header (Sticky, Glassmorphism)          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Main Content (max-w-screen-2xl)    │ │
│ │                                     │ │
│ │ [WelcomeHeader com Logo]            │ │
│ │                                     │ │
│ │ [Grid de Conteúdo]                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Grid do Dashboard
- **Coluna Principal (60%)**: `lg:col-span-3`
  - SaldoScore (destaque principal)
  - Chat integrado
- **Coluna Lateral (40%)**: `lg:col-span-2`
  - Grid 2x2 de MetricCards
  - Calendário financeiro
  - Lista de última atividade (largura total)

### Navegação Horizontal
- Header sticky com backdrop-blur
- Logo à esquerda
- Menu horizontal centralizado
- Avatar do usuário à direita
- Responsivo com menu mobile

---

## 🎨 Componentes Específicos

### SaldoScore
Componente de destaque principal do dashboard.

#### Design
- Layout lado a lado: valor (esquerda) + gráfico semi-circular (direita)
- Fundo dark (deep-blue) com texto branco
- Hover: scale(1.02) com transição suave
- Link para página de detalhes

#### Estrutura
```tsx
<Link className="hover:scale-[1.02]">
  <ModernCard variant="dark">
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <h2>Saldo do Mês</h2>
        <p className="text-4xl font-bold text-white">{valor}</p>
      </div>
      <div className="w-28 text-center">
        {/* Gráfico semi-circular */}
        <p className="text-sm text-slate-300">{percentage}% da meta</p>
      </div>
    </div>
  </ModernCard>
</Link>
```

### MetricCards
Cards de KPIs com interatividade rica.

#### Estados
- **Normal**: Fundo branco, texto deep-blue
- **Hover**: Fundo coral, textos deep-blue, scale(1.03)

#### Componentes Internos
- Título (pequeno, slate-500 → deep-blue)
- Ícone (mesmo comportamento de cor)
- Valor principal (grande, bold)
- Indicador de tendência (↑/↓ com cores semânticas)

### WelcomeHeader
Saudação personalizada com logo.

#### Estrutura
```tsx
<div className="flex items-center gap-4">
  <img src="/logo.Vitto.png" className="h-10 w-auto" />
  <div>
    <h1>
      <span className="text-deep-blue">{greeting}, </span>
      <span className="text-coral-500">{userName}</span>
    </h1>
    {subtitle && <p className="text-slate-500">{subtitle}</p>}
  </div>
</div>
```

### IntegratedChat
Chat integrado ao dashboard com sistema responsivo completo.

#### Características
- Fundo glassmorphism com transparência suave
- Header com ícone da marca Vitto e título responsivo
- Chips de sugestões com scroll horizontal em mobile
- Input com botão de envio coral e ícones adaptativos
- Altura dinâmica baseada na tela (usa hook responsivo)

#### Adaptações Responsivas
- **Mobile**: Chips em linha única com scroll, altura otimizada
- **Compact**: Interface compacta, ícones menores
- **Desktop**: Layout expandido com máximo aproveitamento

### MiniCalendario
Calendário financeiro compacto e responsivo.

#### Design Responsivo
- Padding e espaçamentos adaptativos
- Tamanho de fonte ajustável por tela
- Layout otimizado para diferentes resoluções
- Usa `useResponsiveClasses` para consistência

#### Características
- Fundo glassmorphism sutil
- Navegação entre meses
- Destaque para dias com transações
- Hover effects suaves

---

## 🎭 Efeitos e Transições

### Hover Effects
```css
/* Cards gerais */
.card-hover {
  transition: all 300ms ease;
  transform: scale(1);
}
.card-hover:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* MetricCards específicos */
.metric-hover:hover {
  transform: scale(1.03);
  background-color: var(--coral-500);
  border-color: var(--coral-500);
}
```

### Animações de Entrada
- **Fadeup**: `opacity: 0, y: 20` → `opacity: 1, y: 0`
- **Scale**: `scale: 0.95` → `scale: 1`
- **Duração padrão**: 300-500ms
- **Easing**: `ease-out` ou custom `[0.25, 0.25, 0, 1]`

### Glassmorphism
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  backdrop-saturate: 150%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## 📐 Espacamento e Layout

### Grid System
- **Gap padrão**: `gap-8` (32px) para elementos principais
- **Gap cards**: `gap-6` (24px) para grids de cards
- **Gap interno**: `gap-4` (16px) para elementos próximos

### Padding/Margin Padrões
```css
/* Cards */
.card-padding-sm { padding: 1rem; }     /* 16px */
.card-padding-md { padding: 1.5rem; }   /* 24px */
.card-padding-lg { padding: 2rem; }     /* 32px */

/* Seções */
.section-spacing { margin: 2rem 0; }    /* 32px vertical */
.page-padding { padding: 1.5rem; }      /* 24px nas páginas */
```

### Border Radius
```css
.rounded-sm { border-radius: 0.5rem; }   /* 8px */
.rounded-md { border-radius: 0.75rem; }  /* 12px */
.rounded-lg { border-radius: 1rem; }     /* 16px */
.rounded-xl { border-radius: 1.5rem; }   /* 24px */
.rounded-2xl { border-radius: 2rem; }    /* 32px - Padrão cards */
.rounded-3xl { border-radius: 3rem; }    /* 48px - Cards especiais */
```

---

## 🔧 Utilitários e Helpers

### Classes Customizadas
```css
/* Gradientes de fundo */
.bg-gradient-vitto {
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
}

/* Sombras personalizadas */
.shadow-soft { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.shadow-medium { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.shadow-large { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.shadow-glass { box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37); }
```

### Sistema de Responsividade Implementado

#### Breakpoints e Detecção
- **Mobile**: < 640px (1 coluna, interface compacta)
- **Mobile Wide**: 640px - 768px (layout móvel otimizado)
- **Compact**: 768px - 1024px (layout compacto desktop)
- **Desktop**: > 1024px (layout completo)

#### Hook Personalizado: useResponsiveClasses
```typescript
const { size, classes } = useResponsiveClasses();

// Retorna:
// - size: 'mobile' | 'mobileWide' | 'compact' | 'desktop'
// - classes: objeto com classes responsivas pré-configuradas
```

#### Classes Responsivas Automáticas
```typescript
{
  container: "w-full max-w-screen-2xl mx-auto p-4 lg:p-8 space-y-6",
  grid: "grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8",
  metricGrid: "grid grid-cols-1 md:grid-cols-2 gap-3",
  iconSize: size === 'compact' ? "h-4 w-4" : "h-5 w-5"
}
```

#### Adaptações por Tela
- **Mobile**: Altura viewport otimizada `h-[calc(100vh-240px)]`
- **Compact**: Espaçamentos reduzidos, altura `h-[calc(100vh-265px)]`
- **Desktop**: Layout completo com máximo aproveitamento de espaço

---

## 📱 Páginas Padrão

### Página de Login
#### Estrutura
1. **Background**: Gradiente com elementos flutuantes animados
2. **Logo**: Centrado acima do formulário
3. **Formulário**: GlassFormContainer com campos modernos
4. **Footer**: Copyright e tagline

#### Animações
- Logo: fadeUp com delay
- Formulário: scale + fadeUp
- Elementos de fundo: movimento contínuo suave

### Dashboard Moderno
#### Layout Responsivo
1. **WelcomeHeader**: Logo + saudação personalizada responsiva
2. **Grid Principal**: 5 colunas desktop → 1 coluna mobile
3. **Componentes Adaptativos**: 
   - SaldoScore (coluna principal)
   - IntegratedChat (altura dinâmica)
   - MetricCards (grid 2x2 → single column)
   - MiniCalendario (layout otimizado)

#### Comportamentos por Tela
- **Mobile**: Layout vertical, alturas otimizadas para viewport
- **Compact**: Espaçamentos reduzidos, ícones menores
- **Desktop**: Grid completo com máximo aproveitamento

#### Interações
- Todos os cards são hover-friendly
- SaldoScore é clicável (link para detalhes)
- MetricCards têm feedback visual rico com animações
- Chat responsivo com chips que fazem scroll horizontal em mobile

---

## 🎯 Diretrizes de Uso

### Quando Usar Cada Variante

#### ModernCard
- `default`: Conteúdo geral, listas, formulários
- `glass`: Overlays, modais, elementos flutuantes
- `metric`: KPIs, estatísticas, dados numéricos
- `metric-interactive`: KPIs clicáveis com hover
- `dark`: Elementos de destaque, call-to-actions importantes

#### Cores
- **Coral**: CTAs, elementos interativos, destaques
- **Deep Blue**: Textos principais, elementos estruturais
- **Slate**: Textos secundários, elementos neutros

#### Tipografia
- **Títulos**: Sempre em deep-blue ou combinação blue+coral
- **Destaque de usuário**: Nome em coral, contexto em blue
- **Hierarquia clara**: Usar tamanhos e pesos consistentes

### Boas Práticas

1. **Consistência**: Sempre usar os componentes base ao invés de criar estilos ad-hoc
2. **Acessibilidade**: Manter contrastes adequados (especialmente coral sobre branco)
3. **Performance**: Usar animações com `transform` e `opacity` para melhor performance
4. **Responsividade**: Testar em diferentes tamanhos de tela
5. **Escalabilidade**: Preferir classes utilitárias do Tailwind quando possível

---

## 🚀 Status de Implementação

### ✅ Componentes Implementados
- [x] **ModernCard** - Todas as variantes funcionais
- [x] **ModernButton** - Estados e tamanhos completos
- [x] **ModernInput** - Validação e ícones
- [x] **MetricCard** - Interatividade rica e responsiva
- [x] **WelcomeHeader** - Saudação personalizada
- [x] **SaldoScore** - Componente de destaque principal
- [x] **IntegratedChat** - Chat responsivo completo
- [x] **MiniCalendario** - Calendário adaptativo
- [x] **AnimatedNumber** - Animações numéricas
- [x] **ProgressRing** - Indicadores circulares

### ✅ Páginas Modernizadas
- [x] **Login** - Design glassmorphism completo
- [x] **Dashboard** - Layout responsivo com todos componentes

### ✅ Sistema de Design
- [x] **Paleta de cores** - Coral + Deep Blue estabelecidas
- [x] **Tipografia** - Hierarquia completa
- [x] **Responsividade** - Hook personalizado implementado
- [x] **Animações** - Transições suaves padronizadas
- [x] **Documentação** - Guia completo de uso

### 🔄 Próximos Passos

#### Componentes a Desenvolver
- [ ] ProgressBar com estilo Vitto
- [ ] Modais com glassmorphism
- [ ] Tooltips personalizados
- [ ] Loading states consistentes
- [ ] Empty states elegantes
- [ ] Dropdown menus modernos

#### Páginas a Padronizar com Novo Design
- [ ] **Transações** - Lista e formulários
- [ ] **Contas** - Dashboard de contas
- [ ] **Categorias** - Gestão de categorias
- [ ] **Configurações** - Painel de configurações
- [ ] **Perfil** - Dados do usuário

#### Melhorias de Sistema
- [ ] Testes automatizados dos componentes
- [ ] Storybook para documentação visual
- [ ] Dark mode variants
- [ ] Micro-interações avançadas

---

**Última atualização**: Janeiro 2025  
**Versão**: 2.0 - Sistema Responsivo Completo  
**Projeto**: Vitto - Assistente Financeiro Inteligente

### 🎯 Changelog v2.0
- ✅ Sistema de responsividade completo implementado
- ✅ Hook `useResponsiveClasses` criado e integrado
- ✅ Todos os componentes principais atualizados com design responsivo
- ✅ Dashboard totalmente adaptativo (mobile → compact → desktop)
- ✅ Chat integrado com comportamento responsivo avançado
- ✅ Calendário com layout otimizado para diferentes telas
- ✅ Remoção de indicadores de debug (tela no canto direito)
- ✅ Documentação atualizada com novos padrões e componentes 