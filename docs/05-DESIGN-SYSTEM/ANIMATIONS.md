# ✨ Animations - Vitto Design System

## 🎯 Princípios de Animação

### Performance-First
- ✅ Usar apenas `transform` e `opacity` (GPU-accelerated)
- ✅ Evitar animações de `width`, `height`, `top`, `left` (causam reflow)
- ✅ Usar `will-change` com moderação
- ❌ Nunca animar propriedades que causam layout shift

### Sutileza
- Animações devem **melhorar UX**, não distrair
- Durações curtas (150-300ms)
- Easings naturais
- Feedback imediato

### Acessibilidade
- Respeitar `prefers-reduced-motion`
- Animações essenciais apenas
- Sempre ter fallback sem animação

---

## ⏱️ Durações

### Sistema de Timing

```css
--duration-fast:   150ms  /* Micro-interactions (hover, focus) */
--duration-normal: 200ms  /* ⭐ Padrão (transitions gerais) */
--duration-medium: 300ms  /* Modais, dropdowns */
--duration-slow:   500ms  /* Animações de entrada de página */
```

**Quando usar cada uma:**

| Duração | Uso | Exemplo |
|---------|-----|---------|
| 150ms | Hover states, focus rings | Botão hover |
| 200ms | Transitions padrão, scale | Card hover |
| 300ms | Modais, overlays, slides | Modal open |
| 500ms | Entrada de página, carregamento | Page fade-in |

---

## 🎭 Easing Functions

### Easings Padrão (Tailwind)

```css
ease-linear:     cubic-bezier(0, 0, 1, 1)       /* Velocidade constante */
ease-in:         cubic-bezier(0.4, 0, 1, 1)     /* Aceleração */
ease-out:        cubic-bezier(0, 0, 0.2, 1)     /* ⭐ Desaceleração (entrada) */
ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)   /* Aceleração + desaceleração */
```

**Quando usar:**
- **ease-out**: Animações de entrada (aparecer, crescer)
- **ease-in**: Animações de saída (desaparecer, diminuir)
- **ease-in-out**: Transições bidirecionais (hover states)
- **ease-linear**: Raramente (loading spinners, indeterminate progress)

### Easings Customizados (Vitto)

```css
/* Bounce sutil */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Snap rápido */
--ease-snap: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Smooth */
--ease-smooth: cubic-bezier(0.25, 0.25, 0, 1);
```

---

## 🎨 Animações Pré-Definidas (Tailwind Config)

### Fade In

```tsx
<div className="animate-fade-in">
  Aparece suavemente
</div>
```

**Keyframes:**
```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
/* Duration: 500ms, Easing: ease-in-out */
```

### Slide Up

```tsx
<div className="animate-slide-up">
  Desliza de baixo para cima
</div>
```

**Keyframes:**
```css
@keyframes slideUp {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
/* Duration: 300ms, Easing: ease-out */
```

### Scale In

```tsx
<div className="animate-scale-in">
  Cresce suavemente
</div>
```

**Keyframes:**
```css
@keyframes scaleIn {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
/* Duration: 200ms, Easing: ease-out */
```

### Bounce Gentle

```tsx
<div className="animate-bounce-gentle">
  Bounce sutil (contínuo)
</div>
```

**Keyframes:**
```css
@keyframes bounceGentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
/* Duration: 2s, Infinite */
```

---

## 🎭 Hover Effects

### Cards

```tsx
// Hover com elevação e escala
<div className="transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg">
  Card com hover
</div>
```

**Breakdown:**
- `transition-all duration-200`: Transição suave de 200ms
- `hover:scale-[1.02]`: Cresce 2% no hover
- `hover:-translate-y-1`: Sobe 4px no hover
- `hover:shadow-lg`: Sombra maior no hover

### Buttons

```tsx
// Primary button hover
<button className="bg-coral-500 hover:bg-coral-600 transition-colors duration-150">
  Clique aqui
</button>

// Ghost button hover
<button className="text-slate-600 hover:text-coral-500 hover:bg-coral-50 transition-all duration-200">
  Ver mais
</button>
```

### MetricCard Interativo

```tsx
<div className={cn(
  "transition-all duration-300",
  "hover:scale-[1.03]",
  "hover:bg-coral-500",
  "hover:border-coral-500",
  "group" // Para filhos mudarem cor
)}>
  <p className="text-slate-500 group-hover:text-deep-blue transition-colors">
    Título
  </p>
  <p className="text-deep-blue group-hover:text-white transition-colors">
    Valor
  </p>
</div>
```

**Efeito:**
- Card cresce 3%
- Background muda para coral
- Textos mudam de cor (slate → deep-blue, deep-blue → white)

---

## 🎬 Animações de Entrada (Page Load)

### Sequência de Entrada

```tsx
// Escalonar delays para efeito cascata
<div className="space-y-4">
  <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
    Item 1
  </div>
  <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
    Item 2
  </div>
  <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
    Item 3
  </div>
</div>
```

### Com Framer Motion

```tsx
import { motion } from 'framer-motion';

// Container
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Filhos com stagger */}
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: i * 0.1,
        ease: [0, 0, 0.2, 1]
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🌊 Glassmorphism com Transição

```tsx
<div className={cn(
  // Base glassmorphism
  "bg-white/80 backdrop-blur-sm border border-white/20",
  // Transição suave
  "transition-all duration-300",
  // Hover intensifica efeito
  "hover:bg-white/90 hover:backdrop-blur-md hover:border-white/30"
)}>
  Card glassmorphism interativo
</div>
```

---

## 🎯 Loading States

### Skeleton Loading

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
  <div className="h-4 bg-slate-200 rounded"></div>
  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
</div>
```

### Spinner

```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
```

### Progress Bar Animado

```tsx
<div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
  <div
    className="bg-coral-500 h-full transition-all duration-500 ease-out"
    style={{ width: `${progress}%` }}
  ></div>
</div>
```

---

## 🎨 Micro-Interactions

### Focus States

```tsx
// Input focus
<input className={cn(
  "border-2 border-slate-200",
  "focus:border-coral-500 focus:ring-4 focus:ring-coral-500/20",
  "transition-all duration-150"
)} />
```

### Checkbox/Switch Toggle

```tsx
// Switch com transição
<button
  className={cn(
    "relative w-12 h-6 rounded-full transition-colors duration-200",
    isOn ? "bg-coral-500" : "bg-slate-300"
  )}
>
  <span className={cn(
    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full",
    "transition-transform duration-200",
    isOn && "translate-x-6"
  )} />
</button>
```

### Button Click (Active State)

```tsx
<button className={cn(
  "bg-coral-500",
  "active:scale-95",  // Diminui 5% ao clicar
  "transition-transform duration-100"
)}>
  Clique
</button>
```

---

## 📱 Modais e Overlays

### Modal Fade + Scale

```tsx
<Dialog>
  {/* Overlay backdrop */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
  />

  {/* Modal content */}
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
    className="fixed inset-0 flex items-center justify-center p-4"
  >
    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
      Conteúdo do modal
    </div>
  </motion.div>
</Dialog>
```

### Slide-in (Drawer)

```tsx
// Da direita para esquerda
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl"
>
  Drawer content
</motion.div>
```

---

## ♿ Acessibilidade

### Respeitar Preferências do Sistema

```tsx
// CSS
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// React Hook
import { useReducedMotion } from 'framer-motion';

function Component() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.3
      }}
    >
      Content
    </motion.div>
  );
}
```

---

## ✅ Best Practices

### DO ✅

1. **Performance**
   ```tsx
   // GPU-accelerated
   <div className="transform translate-x-4 opacity-50 transition-all" />
   ```

2. **Feedback imediato**
   ```tsx
   // Hover rápido (150ms)
   <button className="hover:bg-coral-600 transition-colors duration-150" />
   ```

3. **Easing natural**
   ```tsx
   // ease-out para entrada
   <div className="animate-slide-up [animation-timing-function:ease-out]" />
   ```

### DON'T ❌

1. **Animações pesadas**
   ```tsx
   // ❌ Causa reflow
   <div className="hover:w-96 transition-all" />

   // ✅ Usar transform
   <div className="hover:scale-110 transition-transform" />
   ```

2. **Durações longas**
   ```tsx
   // ❌ Muito lento
   <div className="transition-all duration-1000" />

   // ✅ Rápido e responsivo
   <div className="transition-all duration-200" />
   ```

3. **Animações desnecessárias**
   ```tsx
   // ❌ Distrai
   <p className="animate-bounce">Texto normal</p>

   // ✅ Apenas para elementos interativos
   <button className="hover:scale-105">CTA</button>
   ```

---

## 📋 Checklist de Animação

Ao adicionar animações:

- [ ] Usa apenas `transform` e `opacity`?
- [ ] Duração apropriada (150-300ms)?
- [ ] Easing natural (ease-out para entrada)?
- [ ] Tem fallback para `prefers-reduced-motion`?
- [ ] Não causa layout shift?
- [ ] Melhora UX (não apenas visual)?
- [ ] Performance testada (60fps)?
- [ ] Funciona em mobile?

---

## 📚 Recursos

- [Tailwind Animations](https://tailwindcss.com/docs/animation)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Triggers](https://csstriggers.com/) - O que causa reflow

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
