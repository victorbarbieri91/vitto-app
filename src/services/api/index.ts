export { BaseApi } from './BaseApi';

// Export classes
export { TransactionService } from './TransactionService';
export { AccountService } from './AccountService';
export { CategoryService } from './CategoryService';
export { GoalService } from './GoalService';
export { BudgetService } from './BudgetService';
export { CreditCardService } from './CreditCardService';
export { FaturaService } from './FaturaService';
export { IndicatorsService } from './IndicatorsService';
export { RecurrentTransactionService } from './RecurrentTransactionService';
export { SaldoService } from './SaldoService';
export { OnboardingService } from './OnboardingService';
export { PatrimonioService } from './PatrimonioService';
export { ResetService } from './ResetService';

// Export default instances
export { default as accountService } from './AccountService';
export { default as categoryService } from './CategoryService';
export { default as transactionService } from './TransactionService';
export { default as indicatorsService } from './IndicatorsService';
export { default as recurrentTransactionService } from './RecurrentTransactionService';
export { default as creditCardService } from './CreditCardService';
export { default as faturaService } from './FaturaService';
export { default as goalService } from './GoalService';
export { default as budgetService } from './BudgetService';
export { automationService } from './AutomationService';
export { saldoService } from './SaldoService';
export { default as onboardingService } from './OnboardingService';
export { default as patrimonioService } from './PatrimonioService';
export { default as resetService } from './ResetService';

// Export types
export type { Account, NewAccount } from './AccountService';
export type { Category, NewCategory } from './CategoryService';
export type {
  Transaction,
  NewTransaction,
  TransactionFilters,
  TransactionListResponse,
  InstallmentTransactionRequest,
  CreateInstallmentTransactionRequest,
  TransferTransactionRequest,
  CreateTransactionRequest,
  RevenueData,
  ExpenseData,
  CreditCardExpenseData
} from './TransactionService';
export type {
  IndicatorsData,
  DashboardSummary,
  IndicadorMensal,
  IndicadorResumo,
  RefreshIndicadoresRequest
} from './IndicatorsService';
export type {
  RecurrentTransaction,
  NewRecurrentTransaction,
  RecurrentTransactionSummary,
  RecurrentTransactionCreate,
  RecurrentTransactionUpdate,
  ProcessRecurrentRequest,
  CreateRecurrentTransactionRequest
} from './RecurrentTransactionService';
export type {
  CreditCard,
  NewCreditCard,
  CreditCardWithUsage,
  CreateCreditCardRequest, 
  UpdateCreditCardRequest
} from './CreditCardService';
export type {
  Fatura,
  CreateFaturaRequest,
  UpdateFaturaRequest,
  PayInvoiceRequest,
  FaturaTransaction,
} from './FaturaService';
export type {
  FinancialGoal,
  NewFinancialGoal
} from './GoalService';
export type {
  Budget,
  NewBudget,
  BudgetWithCategory,
  BudgetStatus,
  BudgetTipo
} from './BudgetService';
export type {
  SaldoHistorico,
  MetricasFinanceiras,
  DadosAjusteSaldo
} from './SaldoService';
export type {
  OnboardingData,
  OnboardingStatus
} from './OnboardingService';
export type {
  PatrimonioAtivo,
  NewPatrimonioAtivo,
  UpdatePatrimonioAtivo,
  PatrimonioPorCategoria,
  EvolucaoPatrimonial,
  PatrimonioConsolidado,
  CategoriaAtivo
} from '../../types/patrimonio';
export type {
  DataSummary,
  ResetResult
} from './ResetService';