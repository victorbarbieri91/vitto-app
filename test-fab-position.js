import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testFABPosition() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    const page = await context.newPage();

    try {
        console.log('1. Navegando para a aplicação...');
        
        // Tentar acessar diretamente o dashboard
        console.log('2. Tentando acessar dashboard diretamente...');
        
        // Primeiro, configurar localStorage/sessionStorage se necessário
        await page.goto('http://localhost:5174');
        await page.evaluate(() => {
            // Simular uma sessão autenticada se possível
            localStorage.setItem('supabase.auth.token', 'fake-token');
            sessionStorage.setItem('authenticated', 'true');
        });
        
        await page.goto('http://localhost:5174/dashboard');
        
        // Aguardar a página carregar completamente
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Verificar se foi redirecionado para login
        const currentUrl = page.url();
        console.log(`   URL atual: ${currentUrl}`);
        
        if (currentUrl.includes('/login')) {
            console.log('   Redirecionado para login, tentando fazer login automático...');
            
            // Preencher email
            const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
            if (await emailInput.count() > 0) {
                await emailInput.fill('user@example.com');
            }
            
            // Preencher senha
            const passwordInput = page.locator('input[type="password"], input[placeholder*="senha"]');
            if (await passwordInput.count() > 0) {
                await passwordInput.fill('password123');
            }
            
            // Clicar em entrar
            const loginButton = page.locator('button:has-text("Entrar"), button[type="submit"], .login-button');
            if (await loginButton.count() > 0) {
                await loginButton.click();
                await page.waitForTimeout(3000); // Aguardar redirecionamento
            }
            
            // Verificar se o login funcionou
            const newUrl = page.url();
            console.log(`   URL após login: ${newUrl}`);
            
            if (!newUrl.includes('/dashboard')) {
                console.log('   ⚠️ Login automático falhou, tentando navegar manualmente...');
                await page.goto('http://localhost:5174/dashboard');
                await page.waitForTimeout(2000);
            }
        }
        
        console.log('3. Fazendo screenshot inicial do dashboard...');
        await page.screenshot({ 
            path: 'dashboard-fab-corrigido.png',
            fullPage: true 
        });

        console.log('4. Verificando posição do botão FAB...');
        
        // Localizar o botão FAB
        const fabButton = page.locator('.fab-button, [class*="fab"], [aria-label*="adicionar"], button[style*="position: fixed"]');
        
        if (await fabButton.count() === 0) {
            console.log('⚠️ Botão FAB não encontrado. Tentando localizar por outros seletores...');
            
            // Tentar outros seletores possíveis
            const alternativeSelectors = [
                'button[style*="bottom"]',
                'button[style*="right"]',
                '[class*="floating"]',
                '[class*="add"]',
                'button[class*="fixed"]'
            ];
            
            for (const selector of alternativeSelectors) {
                const element = page.locator(selector);
                if (await element.count() > 0) {
                    console.log(`✅ Encontrado elemento com seletor: ${selector}`);
                    const box = await element.boundingBox();
                    if (box) {
                        console.log(`   Posição: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
                    }
                }
            }
        } else {
            const fabCount = await fabButton.count();
            console.log(`✅ Encontrados ${fabCount} botão(ões) FAB`);
            
            for (let i = 0; i < fabCount; i++) {
                const element = fabButton.nth(i);
                const box = await element.boundingBox();
                if (box) {
                    const viewportSize = page.viewportSize();
                    const rightDistance = viewportSize.width - (box.x + box.width);
                    const bottomDistance = viewportSize.height - (box.y + box.height);
                    
                    console.log(`   Botão ${i + 1}:`);
                    console.log(`   - Posição: x=${box.x}, y=${box.y}`);
                    console.log(`   - Tamanho: ${box.width}x${box.height}`);
                    console.log(`   - Distância da direita: ${rightDistance}px`);
                    console.log(`   - Distância do fundo: ${bottomDistance}px`);
                    
                    // Verificar se está no canto inferior direito
                    const isInBottomRight = rightDistance <= 30 && bottomDistance <= 30;
                    console.log(`   - No canto inferior direito: ${isInBottomRight ? '✅ SIM' : '❌ NÃO'}`);
                }
            }
        }

        console.log('5. Verificando sobreposição com cards...');
        
        // Localizar cards do dashboard
        const cards = page.locator('.card, [class*="card"], .dashboard-card, [class*="dashboard"]');
        const cardCount = await cards.count();
        console.log(`   Encontrados ${cardCount} cards`);
        
        if (cardCount > 0 && await fabButton.count() > 0) {
            const fabBox = await fabButton.first().boundingBox();
            let hasOverlap = false;
            
            for (let i = 0; i < Math.min(cardCount, 10); i++) { // Verificar até 10 cards
                const cardBox = await cards.nth(i).boundingBox();
                if (fabBox && cardBox) {
                    // Verificar sobreposição
                    const overlap = !(fabBox.x + fabBox.width < cardBox.x || 
                                    cardBox.x + cardBox.width < fabBox.x || 
                                    fabBox.y + fabBox.height < cardBox.y || 
                                    cardBox.y + cardBox.height < fabBox.y);
                    
                    if (overlap) {
                        hasOverlap = true;
                        console.log(`   ⚠️ Sobreposição detectada com card ${i + 1}`);
                    }
                }
            }
            
            console.log(`   Sobreposição com cards: ${hasOverlap ? '❌ SIM' : '✅ NÃO'}`);
        }

        console.log('6. Testando hover no botão FAB...');
        
        if (await fabButton.count() > 0) {
            try {
                await fabButton.first().hover();
                await page.waitForTimeout(1000);
                
                console.log('7. Fazendo screenshot do hover...');
                await page.screenshot({ 
                    path: 'dashboard-fab-hover.png',
                    fullPage: true 
                });
                
                console.log('8. Testando click no botão FAB...');
                await fabButton.first().click();
                await page.waitForTimeout(1000);
                
                console.log('9. Fazendo screenshot após click...');
                await page.screenshot({ 
                    path: 'dashboard-fab-clicked.png',
                    fullPage: true 
                });
                
                console.log('✅ Teste de hover e click realizado com sucesso');
                
            } catch (error) {
                console.log(`❌ Erro ao testar interação: ${error.message}`);
            }
        } else {
            console.log('❌ Não foi possível testar hover/click - botão não encontrado');
        }

        console.log('\n🎯 RESUMO DOS TESTES:');
        console.log('=====================================');
        
        // Análise final
        const fabExists = await fabButton.count() > 0;
        console.log(`✓ Botão FAB encontrado: ${fabExists ? 'SIM' : 'NÃO'}`);
        
        if (fabExists) {
            const box = await fabButton.first().boundingBox();
            if (box) {
                const viewportSize = page.viewportSize();
                const rightDistance = viewportSize.width - (box.x + box.width);
                const bottomDistance = viewportSize.height - (box.y + box.height);
                const isCorrectPosition = rightDistance <= 30 && bottomDistance <= 30;
                
                console.log(`✓ Posicionamento correto: ${isCorrectPosition ? 'SIM' : 'NÃO'}`);
                console.log(`✓ Screenshots salvos: dashboard-fab-corrigido.png, dashboard-fab-hover.png, dashboard-fab-clicked.png`);
            }
        }

    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
    } finally {
        await browser.close();
    }
}

testFABPosition().catch(console.error);