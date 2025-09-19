# 🧪 Guia de Testes - Módulo "Sua História"

## Como Testar o Sistema

### **1. Preparação do Ambiente**

```bash
# 1. Executar migrations do banco
npx supabase link --project-ref YOUR_PROJECT_ID
psql -d postgresql://[CONNECTION_STRING] -f docs/database/migrations/create_historia_tables.sql
psql -d postgresql://[CONNECTION_STRING] -f docs/database/seeds/historia_initial_milestones.sql

# 2. Atualizar tipos TypeScript
npx supabase gen types typescript --linked > src/types/supabase.ts

# 3. Iniciar aplicação
npm run dev
```

### **2. Cenários de Teste**

#### **Cenário 1: Novo Usuário**
1. **Criar nova conta** no sistema
2. **Verificar** se marcos iniciais foram criados automaticamente
3. **Acessar** `/sua-historia`
4. **Verificar** se o Vitto aparece com saudação de boas-vindas
5. **Verificar** se existem ~15 marcos pendentes

#### **Cenário 2: Criar Objetivo Pessoal**
1. **Clicar** no botão flutuante "+"
2. **Preencher** formulário:
   - Título: "Reserva de R$ 5.000"
   - Descrição: "Para emergências"
   - Valor meta: 5000
   - Ícone: Shield
   - Cor: Verde
3. **Salvar** e verificar se aparece na timeline
4. **Verificar** se o Vitto parabeniza

#### **Cenário 3: Completar Marco**
1. **Selecionar** um marco do sistema
2. **Clicar** em "Concluir"
3. **Verificar** animações:
   - Confete aparece
   - Som de sucesso (se habilitado)
   - Vitto parabeniza
   - Card muda para verde
4. **Verificar** se progresso geral aumenta

#### **Cenário 4: Atualizar Progresso**
1. **Criar** objetivo com valor (ex: R$ 10.000)
2. **Clicar** em "Atualizar"
3. **Inserir** valor parcial (ex: R$ 3.000)
4. **Verificar** barra de progresso (30%)
5. **Inserir** valor total (R$ 10.000)
6. **Verificar** se completa automaticamente

#### **Cenário 5: Filtros e Busca**
1. **Testar** filtros:
   - Todos
   - Marcos
   - Badges
   - Concluídos
   - Pendentes
2. **Testar** busca por texto
3. **Verificar** se resultados são filtrados corretamente

### **3. Testes de Responsividade**

#### **Mobile (< 640px)**
- Layout em coluna única
- Botões maiores
- Timeline vertical
- Modal em tela cheia

#### **Tablet (640px - 1024px)**
- Layout em 2 colunas
- Cards menores
- Navegação compacta

#### **Desktop (> 1024px)**
- Layout completo
- Grid de cards
- Animações completas

### **4. Testes de Acessibilidade**

#### **Keyboard Navigation**
- Tab através dos elementos
- Enter para ações
- Escape para fechar modais

#### **Screen Reader**
- Textos alternativos
- Labels apropriados
- Estrutura semântica

#### **Contrast**
- Texto legível
- Botões visíveis
- Estados focados

### **5. Testes de Performance**

#### **Carregamento Inicial**
- Tempo < 3 segundos
- Estados de loading
- Fallbacks para erros

#### **Animações**
- 60fps nas transições
- Sem travamentos
- Respect reduced motion

#### **Dados**
- Paginação se necessário
- Cache de resultados
- Atualizações otimistas

### **6. Testes de Sistema**

#### **Base de Dados**
```sql
-- Verificar criação de marcos automáticos
SELECT COUNT(*) FROM app_marco WHERE categoria = 'sistema';

-- Verificar RLS
SELECT * FROM app_marco WHERE user_id != auth.uid(); -- Deve retornar vazio

-- Verificar triggers
INSERT INTO app_perfil (id, nome, email) VALUES (gen_random_uuid(), 'Test', 'test@test.com');
SELECT COUNT(*) FROM app_marco WHERE categoria = 'sistema'; -- Deve ter aumentado
```

#### **APIs**
```typescript
// Testar serviço de marcos
const marcosService = new MarcosService();
const marcos = await marcosService.fetchMarcos();
console.log('Marcos:', marcos);

// Testar criação
const novoMarco = await marcosService.createMarco({
  categoria: 'objetivo',
  titulo: 'Teste',
  descricao: 'Teste de criação',
  valor_alvo: 1000,
  valor_atual: 0
});
console.log('Novo marco:', novoMarco);
```

### **7. Testes de Integração**

#### **Com Sistema de Autenticação**
- Login/logout mantém estado
- Dados corretos por usuário
- Sessão expira corretamente

#### **Com Outros Módulos**
- Criar conta → Marco completado
- Registrar transação → Progresso atualizado
- Atingir meta → Badge desbloqueada

### **8. Testes de Erro**

#### **Erros de Rede**
- Falha na conexão
- Timeout de requisições
- Dados corrompidos

#### **Erros de Validação**
- Campos obrigatórios
- Valores inválidos
- Limites excedidos

#### **Erros de Estado**
- Dados inconsistentes
- Referências quebradas
- Sincronização falha

### **9. Checklist de Funcionalidades**

```markdown
### Básico
- [ ] Página carrega sem erros
- [ ] Marcos iniciais criados
- [ ] Timeline exibe corretamente
- [ ] Filtros funcionam
- [ ] Busca funciona

### Interação
- [ ] Criar objetivo funciona
- [ ] Completar marco funciona
- [ ] Atualizar progresso funciona
- [ ] Vitto aparece nas horas certas
- [ ] Sons tocam (se habilitados)

### Visual
- [ ] Animações suaves
- [ ] Confete aparece
- [ ] Cores consistentes
- [ ] Ícones carregam
- [ ] Responsivo em todas as telas

### Performance
- [ ] Carregamento rápido
- [ ] Transições fluidas
- [ ] Sem memory leaks
- [ ] Dados cachados apropriadamente

### Acessibilidade
- [ ] Navegação por teclado
- [ ] Screen reader friendly
- [ ] Contrast adequado
- [ ] Focus visível
```

### **10. Automatização de Testes**

#### **Testes Unitários**
```typescript
// hooks/useHistoriaService.test.ts
import { renderHook, act } from '@testing-library/react';
import { useHistoriaService } from '../useHistoriaService';

describe('useHistoriaService', () => {
  test('should load marcos on mount', async () => {
    const { result } = renderHook(() => useHistoriaService());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.marcos).toEqual(expect.any(Array));
  });
});
```

#### **Testes de Integração**
```typescript
// components/TimelineBoard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TimelineBoard from '../TimelineBoard';

describe('TimelineBoard', () => {
  test('should display marcos correctly', () => {
    render(<TimelineBoard />);
    
    expect(screen.getByText('Sua História Financeira')).toBeInTheDocument();
    expect(screen.getByText('Marcos')).toBeInTheDocument();
    expect(screen.getByText('Badges')).toBeInTheDocument();
  });
  
  test('should filter marcos when clicking filter button', () => {
    render(<TimelineBoard />);
    
    fireEvent.click(screen.getByText('Marcos'));
    
    // Verificar se apenas marcos são exibidos
    expect(screen.queryByText('badge-item')).not.toBeInTheDocument();
  });
});
```

#### **Testes E2E**
```typescript
// e2e/historia.spec.ts
import { test, expect } from '@playwright/test';

test('complete milestone flow', async ({ page }) => {
  await page.goto('/sua-historia');
  
  // Verificar carregamento
  await expect(page.locator('h2')).toContainText('Sua História Financeira');
  
  // Completar marco
  await page.click('[data-testid="complete-milestone"]');
  
  // Verificar confete
  await expect(page.locator('[data-testid="confetti"]')).toBeVisible();
  
  // Verificar Vitto
  await expect(page.locator('[data-testid="vitto-cue"]')).toBeVisible();
});
```

### **11. Monitoramento em Produção**

#### **Métricas Importantes**
- Taxa de completamento de marcos
- Tempo médio na página
- Erros de JavaScript
- Performance das animações
- Uso de recursos

#### **Logs de Auditoria**
```typescript
// Rastrear ações importantes
const logAction = (action: string, data: any) => {
  console.log(`[Historia] ${action}:`, data);
  
  // Enviar para serviço de analytics
  analytics.track('historia_action', {
    action,
    data,
    timestamp: new Date().toISOString()
  });
};
```

### **12. Troubleshooting Comum**

#### **Problema: Marcos não aparecem**
```bash
# Verificar tabelas
psql -d postgresql://[CONNECTION_STRING] -c "SELECT COUNT(*) FROM app_marco;"

# Verificar RLS
psql -d postgresql://[CONNECTION_STRING] -c "SELECT * FROM app_marco LIMIT 1;"

# Verificar triggers
psql -d postgresql://[CONNECTION_STRING] -c "SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%historia%';"
```

#### **Problema: Vitto não aparece**
```javascript
// Debug no console
localStorage.setItem('debug_vitto', 'true');
window.location.reload();

// Verificar hooks
const vittoHook = useVittoCue();
console.log('Vitto Hook:', vittoHook);
```

#### **Problema: Animações lentas**
```javascript
// Verificar performance
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', entry);
  }
});

observer.observe({ entryTypes: ['measure'] });
```

### **13. Dados de Teste**

#### **Usuário de Teste**
```sql
-- Criar usuário com dados completos
INSERT INTO app_perfil (id, nome, email) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'João Teste', 'joao@teste.com');

-- Marcos variados
INSERT INTO app_marco (user_id, categoria, titulo, status, valor_alvo, valor_atual) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'sistema', 'Marco Completado', 'concluido', NULL, 0),
('550e8400-e29b-41d4-a716-446655440000', 'objetivo', 'Meta de R$ 10.000', 'pendente', 10000, 3000),
('550e8400-e29b-41d4-a716-446655440000', 'objetivo', 'Reserva de Emergência', 'concluido', 5000, 5000);

-- Badges de exemplo
INSERT INTO app_badge (user_id, nome, descricao, cor) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Organizador', 'Criou 10 categorias', '#10b981'),
('550e8400-e29b-41d4-a716-446655440000', 'Poupador', 'Economizou R$ 1.000', '#f59e0b');
```

---

**📅 Última atualização**: Janeiro 2025  
**🎯 Projeto**: Vitto - Testes do Módulo Sua História  
**👨‍💻 Ferramentas**: Jest, React Testing Library, Playwright