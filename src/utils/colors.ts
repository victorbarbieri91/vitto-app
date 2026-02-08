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
 * Cores de bancos brasileiros (tons elegantes, levemente escurecidos)
 */
const bankColors: Record<string, string> = {
  nubank:        '#7B2D8E',
  nu:            '#7B2D8E',
  c6:            '#2A2A2A',
  'c6 bank':     '#2A2A2A',
  itau:          '#CF6300',
  itaú:          '#CF6300',
  bradesco:      '#B0082A',
  'banco do brasil': '#003070',
  bb:            '#003070',
  santander:     '#C40000',
  caixa:         '#005090',
  inter:         '#D46800',
  'banco inter': '#D46800',
  btg:           '#002840',
  'btg pactual': '#002840',
  xp:            '#1A1A1A',
  neon:          '#0F9B7A',
  picpay:        '#1EA84E',
  'mercado pago': '#0080C8',
  stone:         '#008A58',
  pagbank:       '#35A86E',
  pagseguro:     '#35A86E',
  safra:         '#003560',
  original:      '#008A48',
  sicoob:        '#003038',
  sicredi:       '#2E8B3E',
  rico:          '#D84600',
  clear:         '#1A1A28',
  modal:         '#1A365D',
  daycoval:      '#004070',
  will:          '#D43060',
  'will bank':   '#D43060',
  next:          '#00A850',
  pan:           '#0055A0',
  bmg:           '#E85C00',
  sofisa:        '#2C2C5A',
  abc:           '#004880',
  pine:          '#005830',
};

/**
 * Paleta de cores elegantes para contas sem banco reconhecido
 */
const elegantPalette = [
  '#475569', // slate-600
  '#3730A3', // indigo-800
  '#0F766E', // teal-700
  '#9F1239', // rose-800
  '#92400E', // amber-800
  '#5B21B6', // violet-800
  '#0E7490', // cyan-700
  '#166534', // green-800
];

/**
 * Detecta cor do banco pelo nome da conta
 */
const getBankColor = (nome: string): string | null => {
  const normalized = nome.toLowerCase().trim();
  // Tenta match exato primeiro, depois parcial
  for (const [bank, color] of Object.entries(bankColors)) {
    if (normalized.includes(bank)) {
      return color;
    }
  }
  return null;
};

/**
 * Retorna uma cor elegante baseada em hash do nome (determinística)
 */
const getElegantColor = (nome: string): string => {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return elegantPalette[Math.abs(hash) % elegantPalette.length];
};

/**
 * Cores padrão por tipo de conta (fallback)
 */
export const accountTypeColors: Record<string, string> = {
  corrente: '#475569',     // slate-600
  poupanca: '#0F766E',     // teal-700
  investimento: '#5B21B6', // violet-800
  carteira: '#92400E',     // amber-800
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
 * Retorna a cor para uma conta com lógica inteligente:
 * 1. Detecta banco pelo nome → usa cor da marca
 * 2. Se não reconhecer → cor elegante determinística pelo nome
 * 3. Fallback → cor por tipo de conta
 */
export const getAccountColor = (tipo: string, customColor?: string | null, nome?: string): string => {
  // Prioridade 1: Detectar banco pelo nome
  if (nome) {
    const bankColor = getBankColor(nome);
    if (bankColor) return bankColor;
  }

  // Prioridade 2: Cor elegante baseada no nome (determinística)
  if (nome) {
    return getElegantColor(nome);
  }

  // Prioridade 3: Cor por tipo de conta
  return accountTypeColors[tipo.toLowerCase()] || accountTypeColors.corrente;
};
