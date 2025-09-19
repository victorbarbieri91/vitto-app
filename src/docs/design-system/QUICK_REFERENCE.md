# Vitto Design System - Referência Rápida 🚀

## 🎨 Cores Mais Usadas
```css
/* Principais */
--coral-500: #F87060      /* Cor da marca */
--deep-blue: #102542      /* Textos principais */
--slate-500: #64748b      /* Textos secundários */
--slate-200: #e2e8f0      /* Bordas */
```

## 📐 Espaçamentos Padrão
```css
gap-4    /* 16px - elementos próximos */
gap-6    /* 24px - cards pequenos */
gap-8    /* 32px - seções principais */
p-4      /* 16px - padding pequeno */
p-6      /* 24px - padding médio (padrão cards) */
p-8      /* 32px - padding grande */
```

## 🧱 Componentes Essenciais

### Card Básico
```tsx
<ModernCard variant="default" className="p-6">
  {children}
</ModernCard>
```

### Card com Hover (KPIs)
```tsx
<ModernCard variant="metric-interactive" className="p-6">
  {children}
</ModernCard>
```

### Card Destaque
```tsx
<ModernCard variant="dark" className="p-6">
  {children}
</ModernCard>
```

### Botão Principal
```tsx
<ModernButton variant="primary" size="md">
  Texto
</ModernButton>
```

### Input
```tsx
<ModernInput
  label="Label"
  placeholder="placeholder..."
  leftIcon={<IconeComponent />}
/>
```

## 🎭 Classes de Layout Comum

### Grid Dashboard
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
  <div className="lg:col-span-3"> {/* 60% */}
  <div className="lg:col-span-2"> {/* 40% */}
</div>
```

### Grid Cards 2x2
```tsx
<div className="grid grid-cols-2 gap-6">
  {/* 4 cards */}
</div>
```

### Flex com Gap
```tsx
<div className="flex items-center gap-4">
  {/* elementos alinhados */}
</div>
```

## 🎨 Padrões de Cor Texto

### Títulos
```tsx
<h1 className="text-2xl font-semibold text-deep-blue">
  Título
</h1>
```

### Título com Destaque
```tsx
<h1 className="text-2xl font-semibold">
  <span className="text-deep-blue">Olá, </span>
  <span className="text-coral-500">Victor</span>
</h1>
```

### Texto Secundário
```tsx
<p className="text-slate-500">Texto secundário</p>
```

### Texto em Fundo Escuro
```tsx
<p className="text-white">Texto principal</p>
<p className="text-slate-200">Texto secundário</p>
```

## 🎭 Efeitos de Hover

### Hover Simples
```tsx
className="transform transition-all duration-300 hover:scale-[1.02]"
```

### Hover com Cores (MetricCard)
```tsx
className="group hover:bg-coral-500"
// Filhos:
className="text-slate-500 group-hover:text-deep-blue"
```

## 📱 Responsividade

### Quebras Comuns
```tsx
className="flex flex-col sm:flex-row"
className="grid grid-cols-1 lg:grid-cols-3"
className="hidden sm:block"
className="block sm:hidden"
```

## 🔧 Utilitários Frequentes

### Sombras
```css
shadow-soft    /* Sutil */
shadow-medium  /* Padrão */
shadow-xl      /* Destaque */
```

### Bordas Arredondadas
```css
rounded-xl     /* 24px - inputs */
rounded-2xl    /* 32px - cards padrão */
rounded-3xl    /* 48px - cards especiais */
```

### Backdrop Blur
```css
backdrop-blur-sm   /* Sutil */
backdrop-blur-md   /* Médio */
backdrop-blur-lg   /* Forte - padrão glass */
```

## 📋 Checklist de Nova Página

- [ ] Usar `ModernAppLayout` como wrapper
- [ ] Começar com `WelcomeHeader` se aplicável
- [ ] Grid responsivo `lg:grid-cols-X`
- [ ] Cards com `ModernCard` apropriado
- [ ] Cores seguindo padrão (coral + deep-blue)
- [ ] Espaçamentos com gap-8 / gap-6
- [ ] Hover effects nos elementos interativos
- [ ] Testar responsividade mobile

## 🎯 Exemplos Rápidos

### Card de Métrica
```tsx
<ModernCard variant="metric-interactive">
  <div className="flex justify-between items-start">
    <p className="text-sm text-slate-500">Receitas</p>
    <TrendingUp className="w-5 h-5" />
  </div>
  <p className="text-3xl font-bold text-deep-blue mt-2">
    R$ 7.500,00
  </p>
</ModernCard>
```

### Header de Seção
```tsx
<div className="flex items-center gap-4 mb-6">
  <img src="/logo.Vitto.png" className="h-8 w-auto" />
  <h1 className="text-2xl font-semibold text-deep-blue">
    Título da Página
  </h1>
</div>
```

### Lista com Cards
```tsx
<div className="space-y-4">
  {items.map(item => (
    <ModernCard key={item.id} className="p-4">
      {/* conteúdo */}
    </ModernCard>
  ))}
</div>
``` 