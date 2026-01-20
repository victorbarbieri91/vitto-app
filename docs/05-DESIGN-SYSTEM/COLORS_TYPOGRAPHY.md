# 🎨 Colors & Typography - Vitto Design System

## 🌈 Paleta de Cores

### Cores Primárias

#### Coral (Cor Principal da Marca)
```css
--coral-50:  #fef7f0  /* Backgrounds muito claros */
--coral-100: #feede0  /* Backgrounds claros */
--coral-200: #fdd9c1  /* Borders sutis */
--coral-300: #fbb596  /* Hover states leves */
--coral-400: #f8876a  /* Hover states */
--coral-500: #F87060  /* ⭐ COR PRINCIPAL - CTAs, ações primárias */
--coral-600: #ed4f37  /* Active states */
--coral-700: #dc3626  /* Pressed states */
--coral-800: #b92d20  /* Dark mode variants */
--coral-900: #9a2a1f  /* Texto em backgrounds claros */
```

**Quando usar:**
- ✅ Botões primários (CTA)
- ✅ Links importantes
- ✅ Ícones de ações principais
- ✅ Badges de destaque
- ✅ Progress bars
- ⚠️ **Use com moderação** - apenas para elementos que precisam destaque

**Contraste:**
- Coral-500 sobre branco: 3.5:1 (AAA para texto grande)
- Branco sobre Coral-500: 3.5:1 (AAA para texto grande)

#### Deep Blue (Cor Secundária)
```css
--deep-blue: #102542  /* Azul escuro para textos e elementos */
```

**Quando usar:**
- ✅ Títulos principais
- ✅ Textos de corpo (quando precisa mais contraste que slate)
- ✅ Ícones estruturais
- ✅ Borders em elementos importantes
- ✅ Backgrounds escuros (cards dark)

**Contraste:**
- Deep Blue sobre branco: 13.5:1 (AAA)

---

### Cores de Apoio

#### Slate (Neutral Scale)
```css
--slate-50:  #f8fafc  /* Background principal do app */
--slate-100: #f1f5f9  /* Background secundário */
--slate-200: #e2e8f0  /* Borders sutis */
--slate-300: #cbd5e1  /* Borders normais */
--slate-400: #94a3b8  /* Placeholder text */
--slate-500: #64748b  /* Texto secundário ⭐ */
--slate-600: #475569  /* Texto normal */
--slate-700: #334155  /* Texto com ênfase */
--slate-800: #1e293b  /* Texto forte */
--slate-900: #0f172a  /* Texto principal alternativo */
```

**Quando usar:**
- ✅ Backgrounds do app (50, 100)
- ✅ Borders e dividers (200, 300)
- ✅ Textos secundários (500, 600)
- ✅ Textos principais (700, 800, 900)

---

### Cores Funcionais

#### Success (Verde)
```css
--green-400: #4ade80  /* Backgrounds leves */
--green-500: #10b981  /* ⭐ Padrão */
--green-600: #059669  /* Hover/Active */
--green-700: #047857  /* Dark mode */
```

**Uso:**
- Mensagens de sucesso
- Indicadores positivos (↑ +12%)
- Badges de status "ativo"
- Progress bars completos

#### Warning (Amarelo)
```css
--yellow-400: #fbbf24  /* Backgrounds leves */
--yellow-500: #f59e0b  /* ⭐ Padrão */
--yellow-600: #d97706  /* Hover/Active */
--yellow-700: #b45309  /* Dark mode */
```

**Uso:**
- Avisos e alertas
- Indicadores de atenção
- Badges de status "pendente"

#### Error (Vermelho)
```css
--red-400: #f87171    /* Backgrounds leves */
--red-500: #ef4444    /* ⭐ Padrão */
--red-600: #dc2626    /* Hover/Active */
--red-700: #b91c1c    /* Dark mode */
```

**Uso:**
- Mensagens de erro
- Indicadores negativos (↓ -8%)
- Validação de formulários
- Badges de status "erro"

---

## 📝 Tipografia

### Fonte Principal

**Família**: Inter (Google Fonts)
**Fallback**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Por que Inter?**
- ✅ Excelente legibilidade em telas
- ✅ Suporte completo a caracteres especiais
- ✅ Múltiplos pesos disponíveis (300-900)
- ✅ Open source e gratuita
- ✅ Otimizada para UI

### Pesos Disponíveis

```css
--font-light:     300  /* Textos suaves, raramente usado */
--font-normal:    400  /* ⭐ Texto padrão */
--font-medium:    500  /* Texto com ênfase leve */
--font-semibold:  600  /* ⭐ Subtítulos */
--font-bold:      700  /* ⭐ Títulos */
--font-extrabold: 800  /* Destaques especiais */
--font-black:     900  /* Display numbers (valores grandes) */
```

---

## 📐 Hierarquia Tipográfica

### Títulos (Headings)

#### Display
```css
font-size: 3rem (48px)
line-height: 3.5rem (56px)
font-weight: 700-900
letter-spacing: -0.02em
```
**Uso:** Números grandes, valores em destaque
**Exemplo:** "R$ 15.420,50" no SaldoScore

#### Heading 1 (H1)
```css
font-size: 2rem (32px)
line-height: 2.5rem (40px)
font-weight: 700
```
**Uso:** Título principal da página
**Exemplo:** "Olá, Victor" no Dashboard

#### Heading 2 (H2)
```css
font-size: 1.5rem (24px)
line-height: 2rem (32px)
font-weight: 600
```
**Uso:** Seções principais
**Exemplo:** "Resumo Financeiro"

#### Heading 3 (H3)
```css
font-size: 1.25rem (20px)
line-height: 1.75rem (28px)
font-weight: 600
```
**Uso:** Sub-seções
**Exemplo:** "Transações Recentes"

---

### Corpo de Texto (Body)

#### Body Large
```css
font-size: 1.125rem (18px)
line-height: 1.75rem (28px)
font-weight: 400
```
**Uso:** Texto destacado, descrições importantes

#### Body (Padrão) ⭐
```css
font-size: 1rem (16px)
line-height: 1.5rem (24px)
font-weight: 400
```
**Uso:** Texto padrão do app

#### Body Small
```css
font-size: 0.875rem (14px)
line-height: 1.25rem (20px)
font-weight: 400
```
**Uso:** Legendas, textos secundários

---

### Texto Pequeno (Small)

#### Caption
```css
font-size: 0.75rem (12px)
line-height: 1rem (16px)
font-weight: 400
```
**Uso:** Labels, timestamps, meta informações

#### Tiny
```css
font-size: 0.625rem (10px)
line-height: 0.875rem (14px)
font-weight: 500
```
**Uso:** Badges, tags, micro textos

---

## 🎨 Padrões de Cor Tipográfica

### Títulos

**Padrão (recomendado):**
```tsx
<h1 className="text-2xl font-bold text-deep-blue">
  Título Principal
</h1>
```

**Com destaque (nome de usuário, valores):**
```tsx
<h1 className="text-2xl font-semibold">
  <span className="text-deep-blue">Olá, </span>
  <span className="text-coral-500">Victor</span>
</h1>
```

### Corpo de Texto

**Texto primário:**
```tsx
<p className="text-base text-slate-700">
  Texto principal com boa legibilidade
</p>
```

**Texto secundário:**
```tsx
<p className="text-sm text-slate-500">
  Informação secundária menos importante
</p>
```

**Texto desabilitado:**
```tsx
<p className="text-sm text-slate-400">
  Campo desabilitado
</p>
```

### Texto em Backgrounds Escuros

**Sobre Deep Blue:**
```tsx
<div className="bg-deep-blue p-6">
  <h2 className="text-xl font-semibold text-white">
    Título
  </h2>
  <p className="text-slate-200">
    Descrição com contraste adequado
  </p>
</div>
```

### Links

**Link padrão:**
```tsx
<a className="text-coral-500 hover:text-coral-600 underline">
  Ver mais
</a>
```

**Link sutil:**
```tsx
<a className="text-slate-600 hover:text-coral-500">
  Detalhes
</a>
```

---

## 📏 Line Height e Letter Spacing

### Line Height (Leading)

```css
/* Títulos */
leading-tight:  1.25  /* Para títulos grandes */
leading-snug:   1.375 /* Para subtítulos */
leading-normal: 1.5   /* ⭐ Padrão para corpo */
leading-relaxed: 1.625 /* Para textos longos */
leading-loose:  2     /* Para espaçamento extra */
```

**Regra geral:**
- Textos grandes (títulos): line-height menor (1.25-1.375)
- Textos normais: line-height padrão (1.5)
- Textos pequenos: line-height maior (1.625-1.75)

### Letter Spacing (Tracking)

```css
tracking-tighter: -0.05em  /* Títulos muito grandes */
tracking-tight:   -0.025em /* Display text */
tracking-normal:   0em     /* ⭐ Padrão */
tracking-wide:     0.025em /* Maiúsculas */
tracking-wider:    0.05em  /* Spacing em labels */
```

**Quando usar:**
- Números grandes: `-0.02em`
- Títulos: `-0.025em` a `0em`
- Corpo de texto: `0em`
- Maiúsculas: `0.05em` a `0.1em`

---

## 🎯 Combinações Recomendadas

### Card de Métrica
```tsx
<div className="p-6 bg-white rounded-2xl">
  <p className="text-sm text-slate-500 font-medium">
    Receitas do Mês
  </p>
  <p className="text-3xl font-bold text-deep-blue mt-2">
    R$ 7.500,00
  </p>
  <p className="text-sm text-green-600 font-medium mt-1">
    ↑ +12.5%
  </p>
</div>
```

### Header de Página
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-deep-blue">
    Dashboard
  </h1>
  <p className="text-base text-slate-500 mt-2">
    Visão geral das suas finanças
  </p>
</div>
```

### Lista de Transações
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-base font-medium text-slate-900">
        Mercado
      </p>
      <p className="text-sm text-slate-500">
        15 Jan 2025
      </p>
    </div>
    <p className="text-base font-semibold text-red-600">
      -R$ 127,50
    </p>
  </div>
</div>
```

---

## ✅ Checklist de Uso

Ao criar novos componentes, verifique:

- [ ] Títulos usam deep-blue ou combinação blue+coral
- [ ] Corpo de texto usa slate-600 ou slate-700
- [ ] Textos secundários usam slate-500
- [ ] Contraste mínimo 4.5:1 (AAA para texto normal)
- [ ] Line-height adequado (1.5 para corpo de texto)
- [ ] Font weight consistente (400 corpo, 600 subtítulos, 700 títulos)
- [ ] Evitar uso excessivo de coral (apenas destaques)

---

## 🚫 Anti-Patterns

❌ **Evite:**

```tsx
// Cores aleatórias
<p className="text-purple-500">Texto</p>

// Contraste inadequado
<p className="text-slate-300">Texto importante</p> // Muito claro!

// Line-height muito pequeno
<p className="leading-tight text-sm">
  Parágrafo longo... (difícil de ler)
</p>

// Peso excessivo
<p className="font-bold">Texto de corpo comum</p>
```

✅ **Prefira:**

```tsx
// Cores da paleta
<p className="text-slate-600">Texto</p>

// Contraste adequado
<p className="text-slate-700">Texto importante</p>

// Line-height confortável
<p className="leading-normal text-sm">
  Parágrafo longo...
</p>

// Peso apropriado
<p className="font-normal">Texto de corpo comum</p>
```

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
