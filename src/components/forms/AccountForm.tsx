import { useEffect, useRef, useState } from 'react';
import { useForm } from '../../hooks/useForm';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import { ModernButton, ModernInput } from '../ui/modern';
import { X } from 'lucide-react';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'carteira', label: 'Carteira' },
];

// Função para aplicar máscara de moeda brasileira
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
    cor: account?.cor || '#4299E1',
    icone: account?.icone || 'wallet',
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
    saldo_inicial: (value: number) => {
      if (value === null || value === undefined) return 'O saldo atual é obrigatório.';
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

  // Corrigir formatação do saldo quando o formulário é carregado
  useEffect(() => {
    if (account) {
      const saldoAtual = account.saldo_atual || account.saldo_inicial || 0;
      const newValues = {
        nome: account.nome,
        tipo: account.tipo,
        saldo_inicial: saldoAtual,
        cor: account.cor || '#4299E1',
        icone: account.icone || 'wallet',
        status: (account.status as AccountFormData['status']) || 'ativa',
        moeda: account.moeda || 'BRL',
      };
      setValues(newValues);
      // Corrigir formatação do saldo para edição
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

  const handleSaldoBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!saldoMasked || saldoMasked === 'R$ 0,00') {
      setSaldoMasked('');
      setValues({ ...values, saldo_inicial: 0 });
    }
  };

  return (
    <div className="relative">
      {/* Botão X para fechar */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4 text-slate-600" />
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ModernInput
          label="Nome da Conta"
          id="nome"
          name="nome"
          placeholder="Ex: Conta Principal"
          value={values.nome}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.nome}
          autoFocus
        />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          helperText="Digite o saldo atual da conta"
        />
        
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Conta
          </label>
          <select 
            id="tipo" 
            name="tipo" 
            value={values.tipo} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cor" className="block text-sm font-medium text-slate-700 mb-2">
          Cor da Conta
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="cor"
            name="cor"
            value={values.cor}
            onChange={handleChange}
            className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
          />
          <div className="flex-1">
            <input
              type="text"
              value={values.cor}
              onChange={(e) => setValues({ ...values, cor: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition text-sm font-mono"
              placeholder="#4299E1"
            />
          </div>
        </div>
      </div>

        <div className="flex justify-end space-x-4 pt-4">
          <ModernButton type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </ModernButton>
          <ModernButton type="submit" variant="primary">
            {account ? 'Salvar Alterações' : 'Criar Conta'}
          </ModernButton>
        </div>
      </form>
    </div>
  );
}
