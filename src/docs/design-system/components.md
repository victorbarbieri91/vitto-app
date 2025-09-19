# 🧩 Componentes do Design System

## 🔘 ModernButton

Botão moderno inspirado no design da Crextio com estados de hover, focus e variantes tipadas.

### **Variantes**
- `primary`: Ação principal (coral)
- `secondary`: Ação secundária (outline coral)
- `ghost`: Ação sutil (transparente)
- `outline`: Ação alternativa (borda neutra)
- `success`: Ação de sucesso (verde)
- `warning`: Ação de aviso (amarelo)
- `danger`: Ação de perigo (vermelho)

### **Tamanhos**
- `sm`: 36px altura, padding pequeno
- `md`: 44px altura, padding padrão
- `lg`: 52px altura, padding grande
- `xl`: 60px altura, padding extra

### **Exemplos de Uso**
```tsx
<ModernButton variant="primary" size="md">
  Salvar Alterações
</ModernButton>

<ModernButton variant="secondary" size="lg" fullWidth>
  Cancelar
</ModernButton>

<ModernButton variant="ghost" size="sm" isLoading>
  Carregando...
</ModernButton>
```

---

## 🎴 ModernCard

Card moderno com glassmorphism opcional, sombras suaves e variantes para diferentes usos.

### **Variantes**
- `default`: Card padrão branco
- `glass`: Glassmorphism sutil
- `glass-strong`: Glassmorphism pronunciado
- `metric`: Para cards de métricas
- `metric-primary`: Métrica com tema coral
- `metric-success`: Métrica com tema verde
- `metric-warning`: Métrica com tema amarelo
- `metric-danger`: Métrica com tema vermelho

### **Exemplos de Uso**
```tsx
<ModernCard variant="default" padding="lg">
  <h3>Título do Card</h3>
  <p>Conteúdo do card...</p>
</ModernCard>

<ModernCard variant="glass" hover>
  Card com glassmorphism
</ModernCard>

<ModernCard variant="metric-primary">
  <MetricContent />
</ModernCard>
```

---

## 📊 MetricCard

Card especializado para exibir métricas financeiras, inspirado nos cards "78 Employee" da Crextio.

### **Props**
- `title`: Título da métrica
- `value`: Valor principal (número ou string)
- `change`: Porcentagem de mudança (opcional)
- `trend`: 'up' | 'down' | 'neutral'
- `icon`: Ícone representativo
- `color`: Tema de cor

### **Exemplo de Uso**
```tsx
<MetricCard
  title="Saldo Total"
  value="R$ 15.420,50"
  change={+12.5}
  trend="up"
  icon={<WalletIcon />}
  color="primary"
/>
```

---

## 🔄 ProgressRing

Componente de progresso circular inspirado no "Time tracker" da Crextio.

### **Props**
- `value`: Valor atual (0-100)
- `max`: Valor máximo (padrão: 100)
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: Cor do progresso
- `centerContent`: Conteúdo no centro

### **Exemplo de Uso**
```tsx
<ProgressRing
  value={65}
  size="lg"
  color="success"
  centerContent={
    <div className="text-center">
      <div className="text-2xl font-bold">65%</div>
      <div className="text-sm text-neutral-500">deste mês</div>
    </div>
  }
/>
```

---

## 💎 GlassmorphCard

Card com efeito glassmorphism para elementos flutuantes e modais.

### **Variantes**
- `subtle`: Glassmorphism sutil (20% opacidade)
- `medium`: Glassmorphism médio (30% opacidade)  
- `strong`: Glassmorphism forte (40% opacidade)

### **Exemplo de Uso**
```tsx
<GlassmorphCard variant="medium" blur="md">
  <SignUpForm />
</GlassmorphCard>
```

---

## 📝 ModernInput

Input moderno com estados visuais claros e animações suaves.

### **Estados**
- `default`: Estado normal
- `error`: Estado de erro (vermelho)
- `success`: Estado de sucesso (verde)
- `disabled`: Estado desabilitado

### **Exemplo de Uso**
```tsx
<ModernInput
  label="Email"
  type="email"
  placeholder="seu@email.com"
  error={errors.email}
  icon={<MailIcon />}
/>
```

---

## 📈 AnimatedNumber

Componente para animar números grandes, como valores financeiros.

### **Props**
- `value`: Valor a ser exibido
- `format`: Função de formatação
- `duration`: Duração da animação
- `prefix`: Prefixo (R$, +, -, etc.)

### **Exemplo de Uso**
```tsx
<AnimatedNumber
  value={15420.50}
  format={(value) => formatCurrency(value)}
  duration={1000}
  prefix="R$ "
/>
```

---

## 🎛️ Padrões de Composição

### **Dashboard Card Pattern**
```tsx
<ModernCard variant="metric-primary" hover>
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-primary-500 rounded-2xl">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="caption">Título da Métrica</p>
        <AnimatedNumber 
          value={value} 
          className="display-text text-primary-600"
        />
      </div>
    </div>
    <TrendIndicator trend="up" change={12.5} />
  </div>
</ModernCard>
```

### **Form Field Pattern**
```tsx
<div className="space-y-2">
  <label className="body-small font-medium text-neutral-700">
    Campo
  </label>
  <ModernInput
    variant={error ? 'error' : 'default'}
    placeholder="Digite aqui..."
  />
  {error && (
    <p className="caption text-danger-500">{error}</p>
  )}
</div>
```

### **Loading Pattern**
```tsx
<ModernCard>
  <div className="space-y-4">
    <div className="skeleton h-6 w-32" />
    <div className="skeleton h-10 w-full" />
    <div className="skeleton h-4 w-24" />
  </div>
</ModernCard>
```

---

## 🎨 Customização

### **CSS Custom Properties**
```css
.metric-card-custom {
  --card-bg: linear-gradient(135deg, #FEF3F2 0%, #FEE4E2 100%);
  --card-border: #FECDCA;
  --shadow: var(--shadow-soft);
}
```

### **Tailwind Variants**
```tsx
// Criando variantes customizadas
const customCardVariants = cva(cardVariants(), {
  variants: {
    theme: {
      ocean: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      sunset: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
    }
  }
});
```

---

> **Nota**: Todos os componentes incluem suporte completo a TypeScript, props tipadas e documentação inline com JSDoc. 