# 🎨 VÔ BARSI DESIGN SYSTEM

Inspirado no design moderno da Crextio, este design system define a identidade visual e padrões de componentes para o aplicativo Vô Barsi.

## 🎯 Princípios de Design

### **1. Glassmorphism Sutil**
- Transparência com `bg-white/80` e `backdrop-blur-sm`
- Bordas suaves com `border-white/20`
- Sombras de vidro com `shadow-glass`

### **2. Rounded Design**
- Border radius generoso: `rounded-3xl` (24px) para cards
- Border radius médio: `rounded-2xl` (16px) para botões/inputs
- Border radius pequeno: `rounded-xl` (12px) para elementos menores

### **3. Soft Shadows**
- `shadow-soft`: Sombra sutil para elementos em repouso
- `shadow-medium`: Sombra média para hover states
- `shadow-large`: Sombra pronunciada para elementos elevados
- `shadow-glass`: Sombra especial para glassmorphism

### **4. Micro-interactions**
- Transições suaves: `transition-all duration-200`
- Hover states com elevação: `hover:-translate-y-1`
- Animações de entrada: `animate-fade-in`, `animate-slide-up`

### **5. Color Hierarchy**
- **Primary**: #F87060 (Coral vibrante) - CTAs e ações principais
- **Secondary**: #102542 (Azul marinho) - Textos e contrastes
- **Accent**: #FFE5B4 (Bege claro) - Backgrounds suaves
- **Neutral**: Escala de cinzas para textos e bordas

## 🎨 Paleta de Cores

### **Cores Principais**
```css
Primary:   #F87060  /* Coral vibrante */
Secondary: #102542  /* Azul marinho profundo */
Accent:    #FFE5B4  /* Bege claro */
```

### **Cores de Estado**
```css
Success: #22C55E   /* Verde para sucessos */
Warning: #F59E0B   /* Amarelo para avisos */
Danger:  #EF4444   /* Vermelho para erros */
```

### **Escala Neutral**
```css
neutral-50:  #FAFAFA  /* Background principal */
neutral-100: #F5F5F5  /* Background secundário */
neutral-200: #E5E5E5  /* Bordas suaves */
neutral-300: #D4D4D4  /* Bordas normais */
neutral-400: #A3A3A3  /* Texto placeholder */
neutral-500: #737373  /* Texto secundário */
neutral-600: #525252  /* Texto normal */
neutral-700: #404040  /* Texto ênfase */
neutral-800: #262626  /* Texto forte */
neutral-900: #171717  /* Texto principal */
```

## 📐 Tipografia

### **Hierarquia de Texto**
- **Display**: 48px/56px - Para números grandes e destaques
- **Heading 1**: 32px/40px - Títulos principais
- **Heading 2**: 24px/32px - Subtítulos
- **Body Large**: 18px/28px - Texto importante
- **Body**: 16px/24px - Texto padrão
- **Caption**: 14px/20px - Legendas
- **Small**: 12px/16px - Texto pequeno

### **Font Weights**
- **300**: Light - Para textos suaves
- **400**: Regular - Texto padrão
- **500**: Medium - Texto com ênfase
- **600**: Semibold - Subtítulos
- **700**: Bold - Títulos
- **800**: Extrabold - Destaques
- **900**: Black - Display numbers

## 📏 Espaçamento

### **Grid System (Base 8px)**
```css
Space-1:  4px   (0.25rem)
Space-2:  8px   (0.5rem)  
Space-3:  12px  (0.75rem)
Space-4:  16px  (1rem)    ← Padrão
Space-6:  24px  (1.5rem)
Space-8:  32px  (2rem)
Space-12: 48px  (3rem)
Space-16: 64px  (4rem)
Space-24: 96px  (6rem)
```

### **Padding Padrão**
- **Cards**: `p-6` (24px)
- **Buttons**: `px-5 py-3` (20px/12px)
- **Inputs**: `px-4 py-3` (16px/12px)

## 🧩 Componentes Base

### **Cards**
- **Default**: Fundo branco com sombra suave
- **Glass**: Transparência com blur
- **Metric**: Gradiente sutil para métricas

### **Buttons**
- **Primary**: Ação principal
- **Secondary**: Ação secundária  
- **Ghost**: Ação sutil
- **Outline**: Ação alternativa

### **Inputs**
- **Default**: Estado normal
- **Error**: Estado de erro
- **Success**: Estado de sucesso

## 🎬 Animações

### **Timings**
- **Fast**: 150ms - Micro-interactions
- **Normal**: 200ms - Transitions padrão
- **Slow**: 300ms - Layout changes

### **Easings**
- **ease-out**: Para animações de entrada
- **ease-in-out**: Para transições
- **ease-in**: Para animações de saída

## 📱 Responsividade

### **Breakpoints**
```css
sm:  640px  /* Mobile landscape */
md:  768px  /* Tablet portrait */
lg:  1024px /* Tablet landscape */
xl:  1280px /* Desktop */
2xl: 1536px /* Large desktop */
```

### **Grid Patterns**
- **Mobile**: 1 coluna
- **Tablet**: 2-3 colunas
- **Desktop**: 3-4 colunas

## 🔧 Utilitários

### **Class Composition**
```typescript
import { cn } from '@/utils/cn';

// Combinar classes condicionalmente
cn('base-class', condition && 'conditional-class', {
  'variant-class': variant === 'primary'
});
```

### **Component Variants**
```typescript
import { buttonVariants } from '@/utils/variants';

// Usar variantes tipadas
buttonVariants({ variant: 'primary', size: 'lg' });
```

## 📋 Checklist de Implementação

### **Componentes Base**
- [ ] ModernButton
- [ ] ModernCard  
- [ ] ModernInput
- [ ] MetricCard
- [ ] ProgressRing
- [ ] GlassmorphCard

### **Layout Components**
- [ ] DashboardGrid
- [ ] MetricsGrid
- [ ] WelcomeHeader

### **Páginas**
- [ ] Login Page Redesign
- [ ] Dashboard Redesign

---

> **Última atualização**: Fase 1 da implementação
> **Próximos passos**: Implementar componentes base modernos 