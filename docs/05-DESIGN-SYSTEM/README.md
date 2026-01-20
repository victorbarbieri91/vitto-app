# 🎨 Vitto Design System

Bem-vindo à documentação completa do **Vitto Design System** - o sistema de design que define a identidade visual e padrões de componentes do Vitto Financial.

## 🚀 Quick Links

- **🎨 [Storybook Live](http://localhost:6006)** - Visualize componentes interativamente
- **📖 [Quick Reference](../../src/docs/design-system/QUICK_REFERENCE.md)** - Referência rápida para desenvolvimento
- **🎯 [Overview](./OVERVIEW.md)** - Princípios e visão do design system
- **🎨 [Colors & Typography](./COLORS_TYPOGRAPHY.md)** - Paleta de cores e tipografia
- **🧩 [Components](./COMPONENTS.md)** - Catálogo completo de componentes
- **📱 [Responsive Design](./RESPONSIVE_DESIGN.md)** - Sistema responsivo
- **✨ [Animations](./ANIMATIONS.md)** - Transições e efeitos
- **📚 [Storybook Guide](./STORYBOOK_GUIDE.md)** - Como usar o Storybook

---

## 🎯 O que é o Vitto Design System?

O Vitto Design System é baseado em princípios de design moderno, com foco em:

✨ **Elegância** - Glassmorphism sutil e efeitos de profundidade
🎨 **Consistência** - Cores e padrões uniformes em todo o app
📱 **Responsividade** - Mobile-first com adaptações inteligentes
⚡ **Performance** - Animações otimizadas e componentes leves
♿ **Acessibilidade** - Contraste adequado e navegação por teclado

### Cores Principais

- **Primary**: Coral `#F87060` - CTAs e ações principais
- **Secondary**: Deep Blue `#102542` - Textos e contrastes
- **Neutral**: Slate - Backgrounds e elementos secundários

### Componentes Base

- **ModernCard** - Container com variantes (default, glass, metric, dark)
- **ModernButton** - Botões com estados e variantes
- **ModernInput** - Campos de entrada com validação
- **MetricCard** - Cards de KPIs com interatividade
- **GlassmorphCard** - Overlays com efeito glassmorphism
- **ProgressRing** - Indicadores circulares de progresso
- **AnimatedNumber** - Números animados para valores
- **WelcomeHeader** - Cabeçalho com saudação personalizada

---

## 🛠️ Como Usar

### Visualizar Componentes (Storybook)

```bash
npm run storybook
```

Acesse: http://localhost:6006

### Importar Componentes

```tsx
import { ModernCard, ModernButton, MetricCard } from '@/components/ui/modern';

function MyComponent() {
  return (
    <ModernCard variant="glass" padding="lg">
      <h2>Título</h2>
      <MetricCard
        title="Receitas"
        value="R$ 5.000"
        trend="up"
        change={12.5}
      />
      <ModernButton variant="primary">
        Salvar
      </ModernButton>
    </ModernCard>
  );
}
```

### Usar Classes do Tailwind

```tsx
// Seguir padrões do design system
<div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-soft p-6">
  <h3 className="text-2xl font-semibold text-deep-blue">
    Título
  </h3>
  <p className="text-slate-500">Texto secundário</p>
</div>
```

---

## 📚 Documentação Detalhada

### 1. [Overview](./OVERVIEW.md)
Princípios de design, filosofia e guidelines gerais do sistema.

### 2. [Colors & Typography](./COLORS_TYPOGRAPHY.md)
Paleta completa de cores, escalas, tipografia e hierarquia de texto.

### 3. [Components](./COMPONENTS.md)
Catálogo completo de componentes com props, variantes e exemplos de uso.

### 4. [Responsive Design](./RESPONSIVE_DESIGN.md)
Sistema responsivo, breakpoints, adaptações mobile e hook `useResponsiveClasses`.

### 5. [Animations](./ANIMATIONS.md)
Transições, efeitos de hover, animações de entrada e guidelines de performance.

### 6. [Storybook Guide](./STORYBOOK_GUIDE.md)
Como usar o Storybook, criar stories e documentar componentes.

---

## 🎨 Storybook

O Storybook é a ferramenta principal para visualizar, testar e documentar componentes.

### Rodar Storybook

```bash
npm run storybook
```

### Build Storybook

```bash
npm run build-storybook
```

---

## ✅ Status de Implementação

### Componentes Implementados (13)
- [x] ModernCard
- [x] ModernButton
- [x] ModernInput
- [x] MetricCard
- [x] SimpleMetricCard
- [x] GlassmorphCard
- [x] ProgressRing
- [x] WelcomeHeader
- [x] ModernBadge
- [x] ModernSwitch
- [x] ModernSelect
- [x] AnimatedNumber
- [x] MonthNavigator

### Páginas Modernizadas
- [x] Login Page
- [x] Dashboard Modern
- [x] Transactions Page Modern

### Próximos Componentes
- [ ] ModernModal
- [ ] ModernTooltip
- [ ] ModernDropdown
- [ ] LoadingStates
- [ ] EmptyStates

---

## 🤝 Contribuindo

Ao criar ou modificar componentes:

1. **Siga os padrões** do design system (cores, espaçamentos, animações)
2. **Adicione JSDoc** completo com exemplos
3. **Crie story no Storybook** com todas as variantes
4. **Teste responsividade** em mobile, tablet e desktop
5. **Documente** no [COMPONENTS.md](./COMPONENTS.md)

Ver [Component Guidelines](../../src/components/COMPONENT_GUIDELINES.md) para detalhes.

---

## 📞 Suporte

- **Issues**: Reporte bugs ou sugira melhorias
- **Documentação**: Consulte os links acima
- **Storybook**: Explore componentes visualmente

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
**Projeto**: Vitto Financial - Assistente Financeiro Inteligente
