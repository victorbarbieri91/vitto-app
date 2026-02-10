/**
 * Script de otimização de imagens
 * Converte PNGs grandes para WebP com qualidade alta
 * Uso: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const PUBLIC_DIR = './public';
const MIN_SIZE_KB = 500; // Só otimiza imagens > 500KB
const WEBP_QUALITY = 82; // Qualidade WebP (80-85 é ótimo para UI)

async function optimizeImages() {
  console.log('🖼️  Otimizando imagens...\n');

  const files = await readdir(PUBLIC_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  let totalOriginal = 0;
  let totalOptimized = 0;
  let converted = 0;

  for (const file of pngFiles) {
    const filePath = join(PUBLIC_DIR, file);
    const fileStats = await stat(filePath);
    const sizeKB = fileStats.size / 1024;

    if (sizeKB < MIN_SIZE_KB) {
      console.log(`⏭️  ${file} (${Math.round(sizeKB)}KB) - muito pequeno, pulando`);
      continue;
    }

    const webpFile = file.replace('.png', '.webp');
    const webpPath = join(PUBLIC_DIR, webpFile);

    try {
      const result = await sharp(filePath)
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);

      const newSizeKB = result.size / 1024;
      const savings = ((1 - newSizeKB / sizeKB) * 100).toFixed(1);

      console.log(`✅ ${file} (${Math.round(sizeKB)}KB) → ${webpFile} (${Math.round(newSizeKB)}KB) [-${savings}%]`);

      totalOriginal += sizeKB;
      totalOptimized += newSizeKB;
      converted++;
    } catch (error) {
      console.error(`❌ Erro ao converter ${file}:`, error.message);
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`   Imagens convertidas: ${converted}`);
  console.log(`   Tamanho original: ${(totalOriginal / 1024).toFixed(1)}MB`);
  console.log(`   Tamanho otimizado: ${(totalOptimized / 1024).toFixed(1)}MB`);
  console.log(`   Economia total: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
  console.log('\n⚠️  Lembre-se de atualizar as referências nos componentes para usar .webp');
  console.log('⚠️  Os PNGs originais foram mantidos como fallback');
}

optimizeImages().catch(console.error);
