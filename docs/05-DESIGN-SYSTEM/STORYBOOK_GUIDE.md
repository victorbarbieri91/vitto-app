# 📚 Storybook Guide - Vitto Design System

## 🎯 O que é Storybook?

Storybook é uma ferramenta para desenvolver, testar e documentar componentes UI de forma isolada. No Vitto, usamos Storybook para:

✅ **Visualizar** componentes com diferentes props e estados
✅ **Testar** interatividade e responsividade
✅ **Documentar** uso e variantes de cada componente
✅ **Compartilhar** componentes com o time

---

## 🚀 Começando

### Rodar Storybook Localmente

```bash
npm run storybook
```

Acesse: **http://localhost:6006**

### Build para Produção

```bash
npm run build-storybook
```

Output em: `storybook-static/`

---

## 📖 Navegando no Storybook

### Estrutura de Navegação

```
Design System/
├── Cards/
│   ├── ModernCard
│   ├── MetricCard
│   ├── SimpleMetricCard
│   └── GlassmorphCard
├── Buttons/
│   └── ModernButton
├── Inputs/
│   ├── ModernInput
│   └── ModernSelect
└── Other/
    ├── ProgressRing
    ├── AnimatedNumber
    └── WelcomeHeader
```

### Canvas vs Docs

- **Canvas**: Visualize o componente isoladamente com controles interativos
- **Docs**: Veja a documentação completa com todos os exemplos

---

## ✍️ Criando Stories

### Anatomia de uma Story

```tsx
// ModernCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ModernCard } from './ModernCard';

// 1. Metadata
const meta: Meta<typeof ModernCard> = {
  title: 'Design System/Cards/ModernCard',  // Caminho na navegação
  component: ModernCard,                     // Componente a documentar
  tags: ['autodocs'],                        // Gera docs automaticamente
  argTypes: {                                // Controles interativos
    variant: {
      control: 'select',
      options: ['default', 'glass', 'metric', 'dark'],
      description: 'Visual variant of the card',
    },
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModernCard>;

// 2. Stories (variantes do componente)

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Conteúdo do card padrão',
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-deep-blue mb-2">
          Card Glassmorphism
        </h3>
        <p className="text-slate-500">
          Efeito de vidro com transparência e blur
        </p>
      </div>
    ),
  },
};

export const MetricInteractive: Story = {
  args: {
    variant: 'metric-interactive',
    className: 'cursor-pointer',
    children: (
      <div>
        <p className="text-sm text-slate-500">Receitas do Mês</p>
        <p className="text-3xl font-bold text-deep-blue mt-2">R$ 7.500</p>
        <p className="text-sm text-green-600 mt-2">↑ +12.5%</p>
      </div>
    ),
  },
};
```

---

## 🎨 Personalizando Stories

### Decorators (Wrappers)

Adicione contexto ou layout às stories:

```tsx
const meta: Meta<typeof Component> = {
  title: 'Component',
  component: Component,
  decorators: [
    (Story) => (
      <div className="p-8 bg-slate-50">
        <Story />
      </div>
    ),
  ],
};
```

### Parameters

Configure comportamento da story:

```tsx
export const Dark: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  args: {
    variant: 'dark',
  },
};
```

### Args vs ArgTypes

- **args**: Valores padrão das props
- **argTypes**: Configuração dos controles

```tsx
argTypes: {
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    description: 'Size of the component',
    table: {
      defaultValue: { summary: 'md' },
      type: { summary: "'sm' | 'md' | 'lg'" },
    },
  },
}
```

---

## 📚 Documentação Automática

### JSDoc → Storybook

Storybook extrai documentação do JSDoc:

```tsx
/**
 * ModernCard - Container moderno com glassmorphism
 *
 * Parte do Vitto Design System. Suporta múltiplas variantes.
 *
 * @example
 * ```tsx
 * <ModernCard variant="glass" padding="lg">
 *   Conteúdo
 * </ModernCard>
 * ```
 */
export const ModernCard: React.FC<ModernCardProps> = ({ ... }) => { ... };
```

Aparece automaticamente na tab **Docs**!

---

## 🎯 Best Practices

### 1. Organize por Categoria

```
Design System/
├── Components/ (componentes reutilizáveis)
├── Patterns/   (padrões compostos)
└── Pages/      (páginas completas)
```

### 2. Crie Stories para Todos os Estados

```tsx
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { error: 'Erro de validação' } };
export const Success: Story = { args: { success: true } };
```

### 3. Use Nomes Descritivos

❌ `export const Story1`
✅ `export const WithLongText`
✅ `export const MobileView`
✅ `export const InteractiveHover`

### 4. Documente Edge Cases

```tsx
export const LongContent: Story = {
  args: {
    children: 'Lorem ipsum dolor sit amet...'.repeat(50),
  },
};

export const EmptyState: Story = {
  args: {
    children: null,
  },
};
```

---

## 🧪 Testando no Storybook

### Addon Interactions

Teste comportamentos:

```tsx
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const ClickButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.getByRole('button');

    await userEvent.click(button);
    await expect(button).toHaveTextContent('Clicked');
  },
};
```

### Addon A11y

Testa acessibilidade automaticamente (já configurado).

Veja a tab **Accessibility** no Storybook.

---

## 📱 Testando Responsividade

### Viewports

Use o toolbar do Storybook para testar diferentes tamanhos:

- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080

### Custom Viewports

```tsx
// .storybook/preview.ts
export const parameters = {
  viewport: {
    viewports: {
      vitto_mobile: {
        name: 'Vitto Mobile',
        styles: { width: '375px', height: '667px' },
      },
      vitto_tablet: {
        name: 'Vitto Tablet',
        styles: { width: '768px', height: '1024px' },
      },
    },
  },
};
```

---

## 🎨 Temas no Storybook

O Vitto usa tema customizado (`vitto-theme.ts`):

```tsx
// .storybook/preview.ts
import vittoTheme from './vitto-theme';

export default {
  parameters: {
    docs: {
      theme: vittoTheme,
    },
  },
};
```

### Backgrounds

Teste componentes em diferentes fundos:

```tsx
parameters: {
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#f8fafc' },
      { name: 'white', value: '#ffffff' },
      { name: 'dark', value: '#102542' },
    ],
  },
}
```

---

## 🚀 Deploy do Storybook

### Build

```bash
npm run build-storybook
```

### Deploy (Vercel/Netlify)

1. Build: `npm run build-storybook`
2. Output: `storybook-static/`
3. Deploy a pasta

**URL Exemplo**: https://vitto-storybook.vercel.app

---

## 📋 Checklist para Nova Story

Ao criar um novo componente:

- [ ] Criar arquivo `.stories.tsx` na mesma pasta do componente
- [ ] Adicionar metadata (title, component, tags)
- [ ] Criar story "Default" com valores padrão
- [ ] Criar stories para todas as variantes
- [ ] Criar stories para estados (loading, disabled, error)
- [ ] Adicionar argTypes para props principais
- [ ] Testar em diferentes viewports
- [ ] Verificar acessibilidade (tab Accessibility)
- [ ] Documentar com JSDoc no componente
- [ ] Adicionar exemplos de código

---

## 🔗 Recursos

- [Storybook Docs](https://storybook.js.org/docs/react/get-started/introduction)
- [Args](https://storybook.js.org/docs/react/writing-stories/args)
- [Decorators](https://storybook.js.org/docs/react/writing-stories/decorators)
- [Interactions](https://storybook.js.org/docs/react/writing-tests/interaction-testing)

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
