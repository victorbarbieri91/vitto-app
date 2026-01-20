# Vitto Design System - Overview

## 🎯 Visão Geral

O Vitto Design System é baseado em princípios de design moderno, inspirado em interfaces como Crextio e DisputeFox, com foco em **elegância**, **funcionalidade** e **experiência do usuário excepcional**.

Este documento registra todos os padrões visuais e de interação desenvolvidos para garantir consistência em todo o sistema.

---

## 🎨 Princípios de Design

### 1. **Glassmorphism Sutil**
Transparência elegante sem exageros:
- Transparência com `bg-white/80` e `backdrop-blur-sm`
- Bordas suaves com `border-white/20`
- Sombras de vidro com `shadow-glass`

**Por quê?**
Cria profundidade visual e modernidade sem prejudicar legibilidade.

### 2. **Rounded Design**
Bordas arredondadas em todos os elementos:
- **Border radius generoso**: `rounded-3xl` (24px) para cards principais
- **Border radius médio**: `rounded-2xl` (16px) para botões/inputs
- **Border radius pequeno**: `rounded-xl` (12px) para elementos menores

**Por quê?**
Suaviza a interface e torna mais amigável, especialmente em mobile.

### 3. **Soft Shadows**
Sistema de sombras em 4 níveis:
- `shadow-soft`: Sombra sutil para elementos em repouso
- `shadow-medium`: Sombra média para hover states
- `shadow-large`: Sombra pronunciada para elementos elevados
- `shadow-glass`: Sombra especial para glassmorphism

**Por quê?**
Cria hierarquia visual clara sem peso excessivo.

### 4. **Micro-interactions**
Animações sutis e responsivas:
- Transições suaves: `transition-all duration-200`
- Hover states com elevação: `hover:-translate-y-1`
- Animações de entrada: `animate-fade-in`, `animate-slide-up`

**Por quê?**
Feedback visual imediato melhora UX e torna o app mais vivo.

### 5. **Color Hierarchy**
Sistema de cores com propósito claro:
- **Primary (Coral #F87060)**: CTAs e ações principais
- **Secondary (Deep Blue #102542)**: Textos e contrastes
- **Accent (Bege #FFE5B4)**: Backgrounds suaves
- **Neutral (Slate)**: Escala de cinzas para textos e bordas

**Por quê?**
Cores consistentes criam identidade de marca forte e facilitam navegação.

---

## 🎭 Filosofia de Uso

### Mobile-First
Todo componente é **projetado primeiro para mobile** e depois adaptado para desktop.

**Breakpoints**:
- **Mobile**: < 640px (interface compacta)
- **Compact**: 768px - 1024px (tablet/desktop pequeno)
- **Desktop**: > 1024px (layout completo)

### Acessibilidade
- **Contraste**: Mínimo 4.5:1 para textos
- **Navegação por teclado**: Todos os componentes interativos
- **ARIA labels**: Em elementos personalizados
- **Focus states**: Visíveis e consistentes

### Performance
- **Animações otimizadas**: Usar `transform` e `opacity`
- **Lazy loading**: Componentes pesados carregados sob demanda
- **Tree shaking**: Imports apenas do necessário
- **CSS-in-JS mínimo**: Preferir Tailwind quando possível

---

## 📐 Grid System (Base 8px)

Todo espaçamento segue múltiplos de 8px para consistência visual:

```
Space-1:  4px   (0.25rem)  - Micro espaçamentos
Space-2:  8px   (0.5rem)   - Espaçamento mínimo
Space-3:  12px  (0.75rem)  - Espaçamento pequeno
Space-4:  16px  (1rem)     - Padrão ✓
Space-6:  24px  (1.5rem)   - Médio
Space-8:  32px  (2rem)     - Grande
Space-12: 48px  (3rem)     - Extra grande
Space-16: 64px  (4rem)     - Seções
Space-24: 96px  (6rem)     - Páginas
```

### Padding Padrão por Componente

- **Cards**: `p-6` (24px)
- **Buttons**: `px-5 py-3` (20px horizontal, 12px vertical)
- **Inputs**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Modals**: `p-8` (32px)
- **Pages**: `p-6 lg:p-8` (24px mobile, 32px desktop)

---

## 🧩 Anatomia dos Componentes

### Estrutura Padrão

Todo componente segue esta estrutura:

```tsx
// 1. Imports
import React from 'react';
import { cn } from '@/utils/cn';

// 2. Types
interface ComponentProps {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

// 3. JSDoc
/**
 * ComponentName - Descrição breve
 * @component
 * @example
 * <ComponentName variant="primary">Content</ComponentName>
 */

// 4. Componente
export const ComponentName: React.FC<ComponentProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
}) => {
  return (
    <div className={cn('base-classes', variantClasses[variant], className)}>
      {children}
    </div>
  );
};
```

### Padrões de Props

- **variant**: Variações visuais do componente
- **size**: Tamanhos (sm, md, lg, xl)
- **className**: Classes Tailwind adicionais
- **children**: Conteúdo interno
- **disabled**: Estado desabilitado
- **loading**: Estado de carregamento

---

## 🎯 Diretrizes de Uso

### Quando Usar Cada Variante

#### ModernCard
- `default`: Conteúdo geral, listas, formulários
- `glass`: Overlays, modais, elementos flutuantes
- `metric`: KPIs, estatísticas, dados numéricos
- `metric-interactive`: KPIs clicáveis com hover
- `dark`: Elementos de destaque, call-to-actions importantes

#### ModernButton
- `primary`: Ação principal da página (1 por tela)
- `secondary`: Ações alternativas
- `ghost`: Ações sutis, links
- `outline`: Ações secundárias com mais destaque

#### Cores
- **Coral**: CTAs, elementos interativos, destaques
  ⚠️ Usar com moderação - apenas para ações importantes
- **Deep Blue**: Textos principais, elementos estruturais
  ✅ Pode usar livremente
- **Slate**: Textos secundários, elementos neutros
  ✅ Pode usar livremente

### Tipografia
- **Títulos**: Sempre em deep-blue ou combinação blue+coral
- **Destaque de usuário**: Nome em coral, contexto em blue
- **Hierarquia clara**: Usar tamanhos e pesos consistentes
- **Legibilidade**: Line-height adequado (1.5-1.7 para corpo de texto)

---

## ✅ Boas Práticas

### DO ✅

1. **Consistência**: Sempre usar os componentes base ao invés de criar estilos ad-hoc
2. **Acessibilidade**: Manter contrastes adequados (especialmente coral sobre branco)
3. **Performance**: Usar animações com `transform` e `opacity` para melhor performance
4. **Responsividade**: Testar em diferentes tamanhos de tela
5. **Escalabilidade**: Preferir classes utilitárias do Tailwind quando possível

### DON'T ❌

1. **Duplicação**: Não criar componentes similares aos existentes
2. **Cores aleatórias**: Não usar cores fora da paleta definida
3. **Animações pesadas**: Evitar animações que causam layout shift
4. **Inconsistência**: Não misturar padrões (ex: rounded-lg em alguns cards e rounded-2xl em outros)
5. **Acessibilidade**: Nunca usar apenas cor para indicar estado

---

## 📊 Status de Implementação

### ✅ Implementado
- Sistema de cores completo
- Tipografia hierárquica
- 13 componentes base
- Sistema responsivo com hook customizado
- Animações padronizadas
- Storybook configurado

### 🔄 Em Progresso
- Documentação de todos os componentes
- Stories completas no Storybook
- Testes de acessibilidade
- Dark mode variants

### 📋 Próximos Passos
- Modais e overlays modernos
- Tooltips personalizados
- Loading states consistentes
- Empty states elegantes
- Dropdown menus modernos

---

## 📚 Referências

- [Colors & Typography](./COLORS_TYPOGRAPHY.md) - Paleta completa
- [Components](./COMPONENTS.md) - Catálogo de componentes
- [Responsive Design](./RESPONSIVE_DESIGN.md) - Sistema responsivo
- [Animations](./ANIMATIONS.md) - Transições e efeitos
- [Storybook Guide](./STORYBOOK_GUIDE.md) - Como usar Storybook

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
**Maintainer**: Vitto Team
