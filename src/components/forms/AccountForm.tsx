import { useEffect, useRef, useState } from 'react';
import { useForm } from '../../hooks/useForm';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import { ModernButton, ModernInput } from '../ui/modern';
import { Building2, PiggyBank, TrendingUp, Wallet } from 'lucide-react';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Corrente', icon: Building2 },
  { value: 'poupanca', label: 'Poupança', icon: PiggyBank },
  { value: 'investimento', label: 'Investimento', icon: TrendingUp },
  { value: 'carteira', label: 'Carteira', icon: Wallet },
];

function formatBRL(value: string | number) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  let v = value.replace(/[^\d]/g, '');
  if (!v) return '';
  v = (parseInt(v, 10) / 100).toFixed(2) + '';
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return 'R$ ' + v;
}

function parseBRL(value: string) {
  return Number(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export default function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const initialValues: AccountFormData = {
    nome: account?.nome || '',
    tipo: account?.tipo || 'corrente',
    saldo_inicial: account?.saldo_atual || account?.saldo_inicial || 0,
    cor: null,
    icone: null,
    status: (account?.status as AccountFormData['status']) || 'ativa',
    moeda: account?.moeda || 'BRL',
  };

  const validationRules = {
    nome: (value: string) => {
      if (!value) return 'O nome da conta é obrigatório.';
      if (value.length < 2) return 'O nome deve ter pelo menos 2 caracteres.';
      if (value.length > 50) return 'O nome deve ter no máximo 50 caracteres.';
      return '';
    },
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    setValues,
  } = useForm<AccountFormData>({ initialValues, validationRules });

  const saldoInputRef = useRef<HTMLInputElement>(null);
  const [saldoMasked, setSaldoMasked] = useState('');

  useEffect(() => {
    if (account) {
      const saldoAtual = account.saldo_atual || account.saldo_inicial || 0;
      setValues({
        nome: account.nome,
        tipo: account.tipo,
        saldo_inicial: saldoAtual,
        cor: null,
        icone: null,
        status: (account.status as AccountFormData['status']) || 'ativa',
        moeda: account.moeda || 'BRL',
      });
      setSaldoMasked(saldoAtual ? formatBRL(saldoAtual) : '');
    }
  }, [account, setValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(values);
  };

  const handleMaskedSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length < 3) raw = raw.padStart(3, '0');
    const masked = formatBRL(raw);
    setSaldoMasked(masked === 'R$ 0,00' ? '' : masked);
    setValues({ ...values, saldo_inicial: parseBRL(masked) });
  };

  const handleSaldoFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!saldoMasked || saldoMasked === 'R$ 0,00') {
      setSaldoMasked('');
    }
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
    }, 0);
  };

  const handleSaldoBlur = () => {
    if (!saldoMasked || saldoMasked === 'R$ 0,00') {
      setSaldoMasked('');
      setValues({ ...values, saldo_inicial: 0 });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nome da conta */}
      <ModernInput
        label="Nome da Conta"
        id="nome"
        name="nome"
        placeholder="Ex: Nubank, C6 Bank, Itaú..."
        value={values.nome}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.nome}
        autoFocus
      />

      {/* Tipo de conta - botões visuais */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Tipo de Conta
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValues({ ...values, tipo: value })}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 h-[72px] rounded-xl border-2 transition-all ${
                values.tipo === value
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saldo */}
      <ModernInput
        label="Saldo Atual"
        id="saldo_inicial"
        name="saldo_inicial"
        type="text"
        placeholder="R$ 0,00"
        inputRef={saldoInputRef}
        value={saldoMasked}
        onChange={handleMaskedSaldoChange}
        onFocus={handleSaldoFocus}
        onBlur={handleSaldoBlur}
        error={errors.saldo_inicial}
      />

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-2">
        <ModernButton type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </ModernButton>
        <ModernButton type="submit" variant="primary">
          {account ? 'Salvar' : 'Criar Conta'}
        </ModernButton>
      </div>
    </form>
  );
}
