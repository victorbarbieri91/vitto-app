/**
 * Utilitários de cores para o sistema Vitto
 */

/**
 * Converte cor hexadecimal para RGBA com alpha especificado
 * @param hex - Cor em formato hex (#RRGGBB ou #RGB)
 * @param alpha - Valor de opacidade (0-1), padrão 0.15
 * @returns String rgba()
 */
export const hexToRgba = (hex: string, alpha: number = 0.15): string => {
  // Remove # se presente
  const cleanHex = hex.replace('#', '');

  // Expande formato curto (#RGB -> #RRGGBB)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  // Valida se os valores são números válidos
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(100, 116, 139, ${alpha})`; // Fallback para slate-500
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Calcula a luminosidade de uma cor para determinar contraste
 * @param hex - Cor em formato hex
 * @returns Luminosidade relativa (0-1)
 */
export const getLuminance = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;

  // Fórmula de luminosidade relativa (WCAG)
  const [rs, gs, bs] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Determina se deve usar texto claro ou escuro baseado na cor de fundo
 * @param bgColor - Cor de fundo em hex
 * @returns true se deve usar texto escuro, false para texto claro
 */
export const shouldUseDarkText = (bgColor: string): boolean => {
  const luminance = getLuminance(bgColor);
  return luminance > 0.179; // Threshold para contraste adequado
};

/**
 * Retorna classe de cor de texto apropriada para o fundo
 * @param bgColor - Cor de fundo em hex
 * @returns Classe Tailwind para cor de texto
 */
export const getContrastTextClass = (bgColor: string): string => {
  return shouldUseDarkText(bgColor) ? 'text-slate-800' : 'text-white';
};

/**
 * Escurece uma cor hex por uma porcentagem
 * @param hex - Cor em formato hex
 * @param percent - Porcentagem para escurecer (0-100)
 * @returns Cor hex escurecida
 */
export const darkenColor = (hex: string, percent: number): string => {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const r = Math.max(0, Math.floor(parseInt(fullHex.slice(0, 2), 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(parseInt(fullHex.slice(2, 4), 16) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor(parseInt(fullHex.slice(4, 6), 16) * (1 - percent / 100)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Cores padrão por tipo de conta - tons muito foscos/muted
 */
export const accountTypeColors: Record<string, string> = {
  corrente: '#4B5563',     // gray-600 (cinza neutro fosco)
  poupanca: '#047857',     // emerald-700 (verde bem fosco)
  investimento: '#5B21B6', // violet-800 (roxo escuro fosco)
  carteira: '#92400E',     // amber-800 (marrom alaranjado fosco)
};

/**
 * Reduz a saturação de uma cor para deixá-la mais fosca
 * @param hex - Cor em formato hex
 * @param amount - Quanto reduzir (0-1), padrão 0.35
 * @returns Cor hex mais fosca
 */
export const desaturateColor = (hex: string, amount: number = 0.35): string => {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  let r = parseInt(fullHex.slice(0, 2), 16);
  let g = parseInt(fullHex.slice(2, 4), 16);
  let b = parseInt(fullHex.slice(4, 6), 16);

  // Calcular a média (cinza)
  const gray = (r + g + b) / 3;

  // Mover em direção ao cinza mais agressivamente
  r = Math.round(r + (gray - r) * amount);
  g = Math.round(g + (gray - g) * amount);
  b = Math.round(b + (gray - b) * amount);

  // Escurecer mais para ficar bem fosco
  r = Math.max(0, Math.round(r * 0.70));
  g = Math.max(0, Math.round(g * 0.70));
  b = Math.max(0, Math.round(b * 0.70));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Retorna a cor para um tipo de conta (sempre fosca)
 * @param tipo - Tipo da conta
 * @param customColor - Cor customizada (opcional)
 * @returns Cor hex fosca
 */
export const getAccountColor = (tipo: string, customColor?: string | null): string => {
  if (customColor) {
    // Aplicar tom fosco mais intenso na cor customizada
    return desaturateColor(customColor, 0.40);
  }
  return accountTypeColors[tipo.toLowerCase()] || accountTypeColors.corrente;
};
