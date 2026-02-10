/**
 * Step3Destination - Passo 3: Configuracao de destino
 */

import { useState, useEffect } from 'react';
import { Wallet, CreditCard, ArrowUpCircle, ArrowDownCircle, Sparkles, Tag, Loader2 } from 'lucide-react';
import { smartImportService } from '../../../services/ai/SmartImportService';
import type { ImportTarget, TransactionType } from '../../../types/smart-import';

interface Step3Config {
  transactionType: TransactionType | 'auto';
  destinationType: 'conta' | 'cartao' | 'auto';
  contaId?: number;
  cartaoId?: number;
  categoriaDefault?: number;
}

interface Step3DestinationProps {
  importType: ImportTarget;
  config?: Step3Config;
  onChange: (config: Step3Config) => void;
}

/**
 *
 */
export function Step3Destination({
  importType,
  config,
  onChange,
}: Step3DestinationProps) {
  const [accounts, setAccounts] = useState<Array<{ id: number; nome: string; tipo: string }>>([]);
  const [cards, setCards] = useState<Array<{ id: number; nome: string; ultimos_quatro_digitos?: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; nome: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentConfig = config || {
    transactionType: 'despesa',
    destinationType: 'conta',
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setIsLoading(true);
    try {
      const [accountsData, cardsData, categoriesData] = await Promise.all([
        smartImportService.getAccounts(),
        smartImportService.getCards(),
        smartImportService.getCategories(),
      ]);
      setAccounts(accountsData);
      setCards(cardsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar opcoes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (updates: Partial<Step3Config>) => {
    onChange({ ...currentConfig, ...updates });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-coral-500 animate-spin mb-3" />
        <p className="text-slate-500">Carregando opcoes...</p>
      </div>
    );
  }

  // Para patrimonio, nao precisa de destino
  if (importType === 'patrimonio') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            Configuracao do Patrimonio
          </h3>
          <p className="text-sm text-slate-500">
            Os ativos serao importados para sua carteira de patrimonio
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800">Importacao de Patrimonio</p>
              <p className="text-sm text-blue-600 mt-1">
                Os ativos serao adicionados a sua carteira e voce podera
                acompanhar a evolucao no painel de Patrimonio.
              </p>
            </div>
          </div>
        </div>

        {/* Categoria default */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Tag className="w-4 h-4 inline-block mr-1" />
            Categoria padrao (quando nao detectada)
          </label>
          <select
            value={currentConfig.categoriaDefault || ''}
            onChange={(e) => handleChange({ categoriaDefault: Number(e.target.value) || undefined })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          >
            <option value="">Manter como esta no arquivo</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Destino das {importType === 'transacoes_fixas' ? 'Transacoes Fixas' : 'Transacoes'}
        </h3>
        <p className="text-sm text-slate-500">
          Configure o tipo e destino das transacoes
        </p>
      </div>

      {/* Tipo de transacao */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Tipo de transacao
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'receita', label: 'Receitas', icon: ArrowUpCircle, color: 'green' },
            { value: 'despesa', label: 'Despesas', icon: ArrowDownCircle, color: 'red' },
            { value: 'auto', label: 'Detectar', icon: Sparkles, color: 'blue' },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = currentConfig.transactionType === type.value;
            const colors = {
              green: 'border-green-500 bg-green-50 text-green-700',
              red: 'border-red-500 bg-red-50 text-red-700',
              blue: 'border-blue-500 bg-blue-50 text-blue-700',
            };

            return (
              <button
                key={type.value}
                onClick={() => handleChange({ transactionType: type.value as any })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? colors[type.color as keyof typeof colors]
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? '' : 'text-slate-600'}`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          "Detectar" usa o sinal do valor (+/-) para determinar receita ou despesa
        </p>
      </div>

      {/* Destino */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Onde essas transacoes foram feitas?
        </label>
        <div className="space-y-3">
          {/* Conta */}
          <label
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              currentConfig.destinationType === 'conta'
                ? 'border-coral-500 bg-coral-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="destinationType"
              checked={currentConfig.destinationType === 'conta'}
              onChange={() => handleChange({ destinationType: 'conta', cartaoId: undefined })}
              className="sr-only"
            />
            <div
              className={`p-2 rounded-lg ${
                currentConfig.destinationType === 'conta' ? 'bg-coral-100' : 'bg-slate-100'
              }`}
            >
              <Wallet
                className={`w-5 h-5 ${
                  currentConfig.destinationType === 'conta' ? 'text-coral-600' : 'text-slate-500'
                }`}
              />
            </div>
            <div className="flex-1">
              <span
                className={`font-medium ${
                  currentConfig.destinationType === 'conta' ? 'text-coral-700' : 'text-slate-700'
                }`}
              >
                Conta bancaria
              </span>
              <p className="text-sm text-slate-500">Debito, transferencias, PIX</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                currentConfig.destinationType === 'conta'
                  ? 'border-coral-500 bg-coral-500'
                  : 'border-slate-300'
              }`}
            >
              {currentConfig.destinationType === 'conta' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
              )}
            </div>
          </label>

          {/* Select de conta */}
          {currentConfig.destinationType === 'conta' && (
            <select
              value={currentConfig.contaId || ''}
              onChange={(e) => handleChange({ contaId: Number(e.target.value) || undefined })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl ml-10 max-w-[calc(100%-2.5rem)] focus:ring-2 focus:ring-coral-500"
            >
              <option value="">Selecione a conta</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome} ({acc.tipo})
                </option>
              ))}
            </select>
          )}

          {/* Cartao */}
          <label
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              currentConfig.destinationType === 'cartao'
                ? 'border-coral-500 bg-coral-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="destinationType"
              checked={currentConfig.destinationType === 'cartao'}
              onChange={() => handleChange({ destinationType: 'cartao', contaId: undefined })}
              className="sr-only"
            />
            <div
              className={`p-2 rounded-lg ${
                currentConfig.destinationType === 'cartao' ? 'bg-coral-100' : 'bg-slate-100'
              }`}
            >
              <CreditCard
                className={`w-5 h-5 ${
                  currentConfig.destinationType === 'cartao' ? 'text-coral-600' : 'text-slate-500'
                }`}
              />
            </div>
            <div className="flex-1">
              <span
                className={`font-medium ${
                  currentConfig.destinationType === 'cartao' ? 'text-coral-700' : 'text-slate-700'
                }`}
              >
                Cartao de credito
              </span>
              <p className="text-sm text-slate-500">Fatura do cartao</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                currentConfig.destinationType === 'cartao'
                  ? 'border-coral-500 bg-coral-500'
                  : 'border-slate-300'
              }`}
            >
              {currentConfig.destinationType === 'cartao' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
              )}
            </div>
          </label>

          {/* Select de cartao */}
          {currentConfig.destinationType === 'cartao' && (
            <select
              value={currentConfig.cartaoId || ''}
              onChange={(e) => handleChange({ cartaoId: Number(e.target.value) || undefined })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl ml-10 max-w-[calc(100%-2.5rem)] focus:ring-2 focus:ring-coral-500"
            >
              <option value="">Selecione o cartao</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nome}
                  {card.ultimos_quatro_digitos && ` •••• ${card.ultimos_quatro_digitos}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Categoria default */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Tag className="w-4 h-4 inline-block mr-1" />
          Categoria padrao (quando nao detectada)
        </label>
        <select
          value={currentConfig.categoriaDefault || ''}
          onChange={(e) => handleChange({ categoriaDefault: Number(e.target.value) || undefined })}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-coral-500"
        >
          <option value="">Usar categoria "Outros"</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
