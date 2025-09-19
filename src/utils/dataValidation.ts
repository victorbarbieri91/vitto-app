/**
 * Utilitários para validação e sanitização de dados do banco
 */

// Função para verificar se um valor é um número válido
export const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

// Função para converter valor para número seguro
export const toSafeNumber = (value: any, defaultValue: number = 0): number => {
  if (isValidNumber(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isValidNumber(parsed)) return parsed;
  }
  return defaultValue;
};

// Função para verificar se uma string é válida
export const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.length > 0;
};

// Função para converter valor para string segura
export const toSafeString = (value: any, defaultValue: string = ''): string => {
  if (isValidString(value)) return value;
  if (value !== null && value !== undefined) {
    return String(value);
  }
  return defaultValue;
};

// Função para verificar se uma data é válida
export const isValidDate = (value: any): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

// Função para converter valor para data segura
export const toSafeDate = (value: any, defaultValue?: Date): Date => {
  if (isValidDate(value)) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isValidDate(parsed)) return parsed;
  }
  return defaultValue || new Date();
};

// Função para validar propriedades obrigatórias de um objeto
export const validateRequiredProps = <T extends Record<string, any>>(
  obj: any,
  requiredProps: (keyof T)[],
  objectName: string = 'Object'
): obj is T => {
  if (!obj || typeof obj !== 'object') {
    console.warn(`${objectName} validation failed: not an object`, obj);
    return false;
  }

  for (const prop of requiredProps) {
    if (!(prop in obj) || obj[prop] === null || obj[prop] === undefined) {
      console.warn(`${objectName} validation failed: missing required property '${String(prop)}'`, obj);
      return false;
    }
  }

  return true;
};

// Função para sanitizar dados de conta
export const sanitizeAccount = (account: any): any => {
  if (!account) return null;

  return {
    id: toSafeNumber(account.id),
    nome: toSafeString(account.nome, 'Conta sem nome'),
    tipo: toSafeString(account.tipo, 'corrente'),
    saldo_atual: toSafeNumber(account.saldo_atual, 0),
    cor: toSafeString(account.cor, '#F87060'),
    icone: toSafeString(account.icone, 'wallet'),
    ativo: Boolean(account.ativo),
    created_at: toSafeString(account.created_at),
    updated_at: toSafeString(account.updated_at),
    user_id: toSafeString(account.user_id)
  };
};

// Função para sanitizar dados de transação
export const sanitizeTransaction = (transaction: any): any => {
  if (!transaction) return null;

  return {
    id: toSafeNumber(transaction.id),
    descricao: toSafeString(transaction.descricao, 'Transação sem descrição'),
    valor: toSafeNumber(transaction.valor, 0),
    tipo: toSafeString(transaction.tipo, 'despesa'),
    data: toSafeString(transaction.data),
    categoria_id: toSafeNumber(transaction.categoria_id),
    conta_id: toSafeNumber(transaction.conta_id),
    observacoes: toSafeString(transaction.observacoes, ''),
    created_at: toSafeString(transaction.created_at),
    updated_at: toSafeString(transaction.updated_at),
    user_id: toSafeString(transaction.user_id)
  };
};

// Função para sanitizar dados de orçamento
export const sanitizeBudget = (budget: any): any => {
  if (!budget) return null;

  return {
    id: toSafeNumber(budget.id),
    categoria_id: toSafeNumber(budget.categoria_id),
    mes: toSafeNumber(budget.mes, 1),
    ano: toSafeNumber(budget.ano, new Date().getFullYear()),
    valor: toSafeNumber(budget.valor, 0),
    created_at: toSafeString(budget.created_at),
    user_id: toSafeString(budget.user_id)
  };
};

// Função para verificar se um array é válido e não vazio
export const isValidArray = (value: any): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

// Função para converter valor para array seguro
export const toSafeArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(value)) return value;
  return defaultValue;
};

// Hook para tratar erros de API com fallback seguro
export const withFallback = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  errorContext: string = 'API call'
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorContext} failed:`, error);
    return fallbackValue;
  }
};