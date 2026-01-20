# 📱 Responsive Design - Vitto Design System

## 🎯 Filosofia Mobile-First

Todo componente do Vitto é **projetado primeiro para mobile** e depois adaptado para telas maiores.

**Por quê?**
- ✅ Garante boa experiência em dispositivos menores
- ✅ Força priorização de conteúdo
- ✅ Performance melhor (menos estilos para sobrescrever)
- ✅ Maioria dos usuários acessa via mobile

---

## 📐 Breakpoints

### Sistema Padrão (Tailwind)

```css
/* Mobile (padrão, sem prefixo) */
/* < 640px */

sm:  640px   /* Mobile landscape, tablets pequenos */
md:  768px   /* Tablets portrait */
lg:  1024px  /* Tablets landscape, laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Desktops grandes */
```

### Breakpoints Customizados (Vitto)

```typescript
export const BREAKPOINTS = {
  mobile: 0,        // < 640px
  mobileWide: 640,  // 640px - 768px
  compact: 768,     // 768px - 1024px
  desktop: 1024,    // > 1024px
} as const;
```

**Categorias:**
- **Mobile**: Smartphones (< 640px)
- **Mobile Wide**: Smartphones landscape, tablets pequenos (640-768px)
- **Compact**: Tablets, laptops pequenos (768-1024px)
- **Desktop**: Laptops e desktops (> 1024px)

---

## 🪝 Hook: useResponsiveClasses

### Uso

```typescript
import { useResponsiveClasses } from '@/hooks/useScreenDetection';

function MyComponent() {
  const { size, classes } = useResponsiveClasses();

  return (
    <div className={classes.container}>
      <p>Tela atual: {size}</p>
    </div>
  );
}
```

### Retorno

```typescript
{
  size: 'mobile' | 'mobileWide' | 'compact' | 'desktop',
  classes: {
    container: string,    // Classes para container principal
    grid: string,         // Classes para grids
    metricGrid: string,   // Classes para grid de métricas
    iconSize: string,     // Tamanho de ícones
    padding: string,      // Padding responsivo
    gap: string,          // Gap responsivo
  }
}
```

### Classes Retornadas

```typescript
// size === 'mobile'
{
  container: "w-full max-w-screen-2xl mx-auto p-4 space-y-4",
  grid: "grid grid-cols-1 gap-4",
  metricGrid: "grid grid-cols-1 gap-3",
  iconSize: "h-4 w-4",
  padding: "p-4",
  gap: "gap-4",
}

// size === 'desktop'
{
  container: "w-full max-w-screen-2xl mx-auto p-8 space-y-6",
  grid: "grid grid-cols-1 lg:grid-cols-5 gap-8",
  metricGrid: "grid grid-cols-2 gap-4",
  iconSize: "h-5 w-5",
  padding: "p-6 lg:p-8",
  gap: "gap-6 lg:gap-8",
}
```

---

## 🎨 Padrões Responsivos

### Grid Layouts

#### Dashboard Principal

```tsx
// Mobile: 1 coluna
// Desktop: 60% (col-span-3) + 40% (col-span-2)
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
  {/* Coluna Principal - 60% */}
  <div className="lg:col-span-3 space-y-6">
    <SaldoScore />
    <IntegratedChat />
  </div>

  {/* Coluna Lateral - 40% */}
  <div className="lg:col-span-2 space-y-6">
    <MetricsGrid />
    <MiniCalendario />
  </div>
</div>
```

#### Grid de Métricas (2x2)

```tsx
// Mobile: 1 coluna
// Compact+: 2 colunas
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <MetricCard title="Receitas" value="R$ 5.000" />
  <MetricCard title="Despesas" value="R$ 3.200" />
  <MetricCard title="Saldo" value="R$ 1.800" />
  <MetricCard title="Meta" value="85%" />
</div>
```

---

### Espaçamentos Responsivos

#### Padding

```tsx
// Aumenta em telas maiores
<div className="p-4 lg:p-8">
  {/* Mobile: 16px, Desktop: 32px */}
</div>

// Apenas lateral em mobile
<div className="px-4 lg:px-8 py-6">
  {/* Horizontal responsivo, vertical fixo */}
</div>
```

#### Gap

```tsx
// Gap cresce com tela
<div className="flex flex-col gap-4 lg:gap-8">
  {/* Mobile: 16px, Desktop: 32px */}
</div>

<div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
  {/* Mobile: 12px, Tablet: 16px, Desktop: 24px */}
</div>
```

---

### Tipografia Responsiva

#### Títulos

```tsx
// Cresce 33% em telas grandes
<h1 className="text-2xl lg:text-3xl font-bold">
  Título Principal
</h1>

<h2 className="text-xl lg:text-2xl font-semibold">
  Subtítulo
</h2>
```

#### Display Numbers

```tsx
// Valores grandes escalam significativamente
<p className="text-3xl md:text-4xl lg:text-5xl font-bold">
  R$ 15.420,50
</p>
```

---

### Visibilidade Condicional

#### Mostrar/Esconder por Tela

```tsx
// Só em mobile
<div className="block lg:hidden">
  Menu Mobile
</div>

// Só em desktop
<div className="hidden lg:block">
  Sidebar Desktop
</div>

// Só em tablet/desktop
<div className="hidden md:block">
  Conteúdo Extra
</div>
```

---

## 📱 Componentes Adaptativos

### IntegratedChat

**Alturas dinâmicas por tela:**

```typescript
const heights = {
  mobile: 'h-[calc(100vh-240px)]',      // Viewport completo menos headers
  mobileWide: 'h-[calc(100vh-240px)]',
  compact: 'h-[calc(100vh-265px)]',     // Mais espaço vertical
  desktop: 'h-[calc(100vh-240px)]',
};

<div className={heights[size]}>
  {/* Chat se adapta ao espaço disponível */}
</div>
```

**Chips de sugestões:**

```tsx
// Mobile: scroll horizontal
// Desktop: wrap normal
<div className={cn(
  "flex gap-2",
  size === 'mobile' || size === 'mobileWide'
    ? "overflow-x-auto scrollbar-hide"
    : "flex-wrap"
)}>
  {suggestions.map(chip => <Chip key={chip} />)}
</div>
```

---

### MiniCalendario

**Grid adaptativo:**

```tsx
const gridClasses = {
  mobile: 'grid-cols-7 gap-1',
  mobileWide: 'grid-cols-7 gap-1.5',
  compact: 'grid-cols-7 gap-2',
  desktop: 'grid-cols-7 gap-2',
};
```

**Tamanhos de fonte:**

```tsx
const fontSizes = {
  mobile: 'text-xs',      // 12px
  compact: 'text-sm',     // 14px
  desktop: 'text-base',   // 16px
};
```

---

### ModernCard

**Padding adaptativo:**

```tsx
const paddingClasses = {
  sm: 'p-3 lg:p-4',
  md: 'p-4 lg:p-6',
  lg: 'p-6 lg:p-8',
};
```

---

## 🎯 Padrões de Layout

### Stack (Flex Column)

```tsx
// Sempre coluna em mobile, pode virar row em desktop
<div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
  <div className="w-full lg:w-1/2">Item 1</div>
  <div className="w-full lg:w-1/2">Item 2</div>
</div>
```

### Grid Responsivo

```tsx
// 1 → 2 → 3 → 4 colunas
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Container com Max-Width

```tsx
// Centralizado com margem lateral
<div className="w-full max-w-screen-2xl mx-auto px-4 lg:px-8">
  Conteúdo limitado a 2xl
</div>
```

---

## 📐 Proporções e Aspect Ratios

### Imagens Responsivas

```tsx
// Mantém aspect ratio 16:9
<div className="aspect-video w-full">
  <img src="..." className="w-full h-full object-cover" />
</div>

// Aspect ratio quadrado
<div className="aspect-square w-24 lg:w-32">
  <img src="..." className="w-full h-full object-cover rounded-full" />
</div>
```

---

## 🎨 Componentes com Variantes Responsivas

### Exemplo Completo: MetricCard

```tsx
export const MetricCard: React.FC<Props> = ({ ...props }) => {
  const { size, classes } = useResponsiveClasses();

  return (
    <ModernCard
      variant="metric-interactive"
      className={cn(
        // Padding responsivo
        size === 'mobile' ? 'p-4' : 'p-6',
        // Hover apenas em desktop
        size === 'desktop' && 'hover:scale-105'
      )}
    >
      <div className="flex items-start justify-between">
        {/* Título */}
        <p className={cn(
          'font-medium',
          size === 'mobile' ? 'text-xs' : 'text-sm'
        )}>
          {title}
        </p>

        {/* Ícone */}
        <Icon className={classes.iconSize} />
      </div>

      {/* Valor */}
      <p className={cn(
        'font-bold text-deep-blue mt-2',
        size === 'mobile' ? 'text-2xl' : 'text-3xl'
      )}>
        {value}
      </p>

      {/* Tendência */}
      {trend && (
        <p className={cn(
          'font-medium mt-1',
          size === 'mobile' ? 'text-xs' : 'text-sm',
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        )}>
          {trendText}
        </p>
      )}
    </ModernCard>
  );
};
```

---

## ✅ Checklist Responsivo

Ao criar novos componentes, verifique:

- [ ] Funciona bem em mobile (< 640px)
- [ ] Funciona bem em tablet (768px - 1024px)
- [ ] Funciona bem em desktop (> 1024px)
- [ ] Usa mobile-first approach (estilos base = mobile)
- [ ] Padding/margin responsivos
- [ ] Tipografia escala apropriadamente
- [ ] Ícones têm tamanho adequado por tela
- [ ] Grids adaptam número de colunas
- [ ] Imagens mantêm aspect ratio
- [ ] Elementos não quebram em telas pequenas
- [ ] Touch targets têm mínimo 44x44px em mobile
- [ ] Testado em viewport real (não apenas resize)

---

## 🚫 Anti-Patterns

❌ **Evite:**

```tsx
// Desktop-first (ruim)
<div className="p-8 md:p-4">
  {/* Começa grande, fica pequeno */}
</div>

// Breakpoints demais
<div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
  {/* Muito granular */}
</div>

// Valores absolutos em mobile
<div className="w-[320px] h-[480px]">
  {/* Não adapta */}
</div>
```

✅ **Prefira:**

```tsx
// Mobile-first
<div className="p-4 lg:p-8">
  {/* Começa pequeno, cresce */}
</div>

// Breakpoints estratégicos
<div className="text-base lg:text-lg">
  {/* Apenas mudanças significativas */}
</div>

// Valores relativos
<div className="w-full max-w-md">
  {/* Adapta ao container */}
</div>
```

---

## 📚 Recursos

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [useScreenDetection Hook](../../src/hooks/useScreenDetection.ts)
- [Dashboard Responsivo](../../src/pages/dashboard/DashboardPageModern.tsx)

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
