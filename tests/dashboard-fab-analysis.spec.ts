import { test, expect } from '@playwright/test';

test('Analisar posicionamento do botão FAB no dashboard', async ({ page }) => {
  // Configurar localStorage para simular usuário logado
  await page.addInitScript(() => {
    // Simular dados de autenticação no localStorage
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: {
        id: 'mock-user-id',
        email: 'test@test.com'
      }
    }));
  });
  
  // Navegar para o dashboard
  console.log('Navegando para /dashboard com auth simulada...');
  await page.goto('/dashboard');
  
  // Aguardar carregamento
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Se ainda estiver no login, tentar uma abordagem diferente
  if (await page.locator('text=Bem-vindo de volta').isVisible()) {
    console.log('Auth simulada não funcionou, tentando rota direta...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  
  // Tentar localizar elementos do dashboard
  console.log('Procurando elementos do dashboard...');
  
  const dashboardElements = [
    'text=Receitas',
    'text=Saldo Total',
    'text=Despesas', 
    'text=Balanço',
    'button[class*="coral"]', // Botão FAB coral
    '[class*="metric"]'
  ];
  
  let dashboardFound = false;
  for (const selector of dashboardElements) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      console.log(`Dashboard detectado pelo elemento: ${selector}`);
      dashboardFound = true;
      break;
    } catch (e) {
      console.log(`Elemento não encontrado: ${selector}`);
    }
  }
  
  if (!dashboardFound) {
    console.log('Dashboard não encontrado, mas continuando com análise...');
  }
  
  // Primeiro, capturar screenshot completo para ver o que temos
  await page.screenshot({ 
    path: 'tests/screenshots/dashboard-current.png',
    fullPage: true 
  });
  console.log('Screenshot inicial capturado');
  
  // Tentar localizar o botão FAB de diferentes maneiras
  let fabButton = null;
  let fabBox = null;
  
  // Tentar diferentes seletores para o botão FAB
  const fabSelectors = [
    'button[class*="coral"]',
    'button[class*="bg-coral"]',
    'button:has-text("+")',
    'button:has-text("Novo")',
    'button[class*="rounded-full"]',
    'button[class*="absolute"]'
  ];
  
  for (const selector of fabSelectors) {
    try {
      fabButton = page.locator(selector).first();
      if (await fabButton.isVisible()) {
        fabBox = await fabButton.boundingBox();
        console.log(`Botão FAB encontrado com seletor: ${selector}`, fabBox);
        break;
      }
    } catch (e) {
      console.log(`Seletor FAB não funcionou: ${selector}`);
    }
  }
  
  // Pegar informações dos cards de receitas/métricas
  let receitasBox = null;
  try {
    const receitasCard = page.locator('text=Receitas').first();
    if (await receitasCard.isVisible()) {
      receitasBox = await receitasCard.boundingBox();
      console.log('Card de Receitas encontrado:', receitasBox);
    }
  } catch (e) {
    console.log('Card de Receitas não encontrado');
  }
  
  // Verificar se há sobreposição
  if (fabBox && receitasBox) {
    const isOverlapping = (
      fabBox.x < receitasBox.x + receitasBox.width &&
      fabBox.x + fabBox.width > receitasBox.x &&
      fabBox.y < receitasBox.y + receitasBox.height &&
      fabBox.y + fabBox.height > receitasBox.y
    );
    
    console.log('Há sobreposição?', isOverlapping);
    
    // Capturar screenshot focado na área do problema
    await page.screenshot({ 
      path: 'tests/screenshots/fab-area-focus.png',
      clip: {
        x: Math.min(fabBox.x, receitasBox.x) - 50,
        y: Math.min(fabBox.y, receitasBox.y) - 50,
        width: Math.max(fabBox.x + fabBox.width, receitasBox.x + receitasBox.width) - Math.min(fabBox.x, receitasBox.x) + 100,
        height: Math.max(fabBox.y + fabBox.height, receitasBox.y + receitasBox.height) - Math.min(fabBox.y, receitasBox.y) + 100
      }
    });
  }
  
  // Pegar dimensões da viewport
  const viewport = page.viewportSize();
  console.log('Dimensões da viewport:', viewport);
  
  // Salvar relatório em JSON
  const report = {
    timestamp: new Date().toISOString(),
    viewport,
    fabButton: fabBox,
    receitasCard: receitasBox,
    hasOverlap: fabBox && receitasBox ? (
      fabBox.x < receitasBox.x + receitasBox.width &&
      fabBox.x + fabBox.width > receitasBox.x &&
      fabBox.y < receitasBox.y + receitasBox.height &&
      fabBox.y + fabBox.height > receitasBox.y
    ) : false
  };
  
  // Imprimir relatório no console
  console.log('=== RELATÓRIO DE POSICIONAMENTO ===');
  console.log(JSON.stringify(report, null, 2));
});