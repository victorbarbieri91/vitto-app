import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import type {
  PatrimonioAtivo,
  NewPatrimonioAtivo,
  CategoriaAtivo
} from '../../types/patrimonio';
import { CATEGORIAS_METADATA, SUBCATEGORIAS } from '../../types/patrimonio';

interface PatrimonioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ativo: NewPatrimonioAtivo) => Promise<void>;
  ativoParaEditar?: PatrimonioAtivo | null;
  categoriaInicial?: CategoriaAtivo;
}

/**
 *
 */
export default function PatrimonioFormModal({
  isOpen,
  onClose,
  onSave,
  ativoParaEditar,
  categoriaInicial = 'outros'
}: PatrimonioFormModalProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';
  const [loading, setLoading] = useState(false);

  // Estado do formulario
  const [formData, setFormData] = useState<{
    nome: string;
    categoria: CategoriaAtivo;
    subcategoria: string;
    valor_atual: string;
    valor_aquisicao: string;
    data_aquisicao: string;
    instituicao: string;
    observacoes: string;
    dados_especificos: Record<string, any>;
  }>({
    nome: '',
    categoria: categoriaInicial,
    subcategoria: '',
    valor_atual: '',
    valor_aquisicao: '',
    data_aquisicao: '',
    instituicao: '',
    observacoes: '',
    dados_especificos: {}
  });

  // Inicializar com dados do ativo para edicao
  useEffect(() => {
    if (ativoParaEditar) {
      setFormData({
        nome: ativoParaEditar.nome,
        categoria: ativoParaEditar.categoria,
        subcategoria: ativoParaEditar.subcategoria || '',
        valor_atual: ativoParaEditar.valor_atual.toString(),
        valor_aquisicao: ativoParaEditar.valor_aquisicao?.toString() || '',
        data_aquisicao: ativoParaEditar.data_aquisicao || '',
        instituicao: ativoParaEditar.instituicao || '',
        observacoes: ativoParaEditar.observacoes || '',
        dados_especificos: ativoParaEditar.dados_especificos as Record<string, any> || {}
      });
    } else {
      setFormData({
        nome: '',
        categoria: categoriaInicial,
        subcategoria: '',
        valor_atual: '',
        valor_aquisicao: '',
        data_aquisicao: '',
        instituicao: '',
        observacoes: '',
        dados_especificos: {}
      });
    }
  }, [ativoParaEditar, categoriaInicial, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDadosEspecificosChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dados_especificos: { ...prev.dados_especificos, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const novoAtivo: NewPatrimonioAtivo = {
        nome: formData.nome,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || undefined,
        valor_atual: parseFloat(formData.valor_atual.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        valor_aquisicao: formData.valor_aquisicao
          ? parseFloat(formData.valor_aquisicao.replace(/[^\d.,]/g, '').replace(',', '.'))
          : undefined,
        data_aquisicao: formData.data_aquisicao || undefined,
        instituicao: formData.instituicao || undefined,
        observacoes: formData.observacoes || undefined,
        ativo: true,
        dados_especificos: formData.dados_especificos
      };

      await onSave(novoAtivo);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Campos especificos por categoria
  const renderCamposEspecificos = () => {
    switch (formData.categoria) {
      case 'renda_fixa':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Taxa de Rentabilidade (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dados_especificos.taxa_rentabilidade || ''}
                  onChange={(e) => handleDadosEspecificosChange('taxa_rentabilidade', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.dados_especificos.tipo_rentabilidade || ''}
                  onChange={(e) => handleDadosEspecificosChange('tipo_rentabilidade', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value="">Selecione</option>
                  <option value="cdi">% CDI</option>
                  <option value="ipca">IPCA +</option>
                  <option value="pre">Prefixado</option>
                  <option value="pos">Pos-fixado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={formData.dados_especificos.data_vencimento || ''}
                onChange={(e) => handleDadosEspecificosChange('data_vencimento', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
              />
            </div>
          </>
        );

      case 'renda_variavel':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ticker
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.ticker || ''}
                  onChange={(e) => handleDadosEspecificosChange('ticker', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue uppercase"
                  placeholder="PETR4"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={formData.dados_especificos.quantidade || ''}
                  onChange={(e) => handleDadosEspecificosChange('quantidade', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Preco Medio (R$)
              </label>
              <input
                type="text"
                value={formData.dados_especificos.preco_medio || ''}
                onChange={(e) => handleDadosEspecificosChange('preco_medio', parseFloat(e.target.value.replace(',', '.')))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                placeholder="35,50"
              />
            </div>
          </>
        );

      case 'cripto':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ticker/Moeda
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.ticker || ''}
                  onChange={(e) => handleDadosEspecificosChange('ticker', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue uppercase"
                  placeholder="BTC"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.dados_especificos.quantidade || ''}
                  onChange={(e) => handleDadosEspecificosChange('quantidade', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="0.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Exchange/Corretora
              </label>
              <input
                type="text"
                value={formData.dados_especificos.exchange || ''}
                onChange={(e) => handleDadosEspecificosChange('exchange', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                placeholder="Binance"
              />
            </div>
          </>
        );

      case 'imoveis':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tipo de Imovel
                </label>
                <select
                  value={formData.dados_especificos.tipo_imovel || ''}
                  onChange={(e) => handleDadosEspecificosChange('tipo_imovel', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value="">Selecione</option>
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Area (m2)
                </label>
                <input
                  type="number"
                  value={formData.dados_especificos.area_m2 || ''}
                  onChange={(e) => handleDadosEspecificosChange('area_m2', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="85"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dados_especificos.financiado || false}
                  onChange={(e) => handleDadosEspecificosChange('financiado', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Financiado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dados_especificos.alugado || false}
                  onChange={(e) => handleDadosEspecificosChange('alugado', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Alugado</span>
              </label>
            </div>
            {formData.dados_especificos.financiado && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Saldo Devedor (R$)
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.saldo_devedor || ''}
                  onChange={(e) => handleDadosEspecificosChange('saldo_devedor', parseFloat(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="150.000"
                />
              </div>
            )}
            {formData.dados_especificos.alugado && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Renda do Aluguel (R$/mes)
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.renda_aluguel || ''}
                  onChange={(e) => handleDadosEspecificosChange('renda_aluguel', parseFloat(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="2.000"
                />
              </div>
            )}
          </>
        );

      case 'veiculos':
        return (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.marca || ''}
                  onChange={(e) => handleDadosEspecificosChange('marca', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="Honda"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.modelo || ''}
                  onChange={(e) => handleDadosEspecificosChange('modelo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="Civic"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ano
                </label>
                <input
                  type="number"
                  value={formData.dados_especificos.ano || ''}
                  onChange={(e) => handleDadosEspecificosChange('ano', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="2022"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dados_especificos.financiado || false}
                  onChange={(e) => handleDadosEspecificosChange('financiado', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Financiado</span>
              </label>
            </div>
            {formData.dados_especificos.financiado && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Saldo Devedor (R$)
                </label>
                <input
                  type="text"
                  value={formData.dados_especificos.saldo_devedor || ''}
                  onChange={(e) => handleDadosEspecificosChange('saldo_devedor', parseFloat(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="45.000"
                />
              </div>
            )}
          </>
        );

      case 'previdencia':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.dados_especificos.tipo_previdencia || ''}
                  onChange={(e) => handleDadosEspecificosChange('tipo_previdencia', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value="">Selecione</option>
                  <option value="PGBL">PGBL</option>
                  <option value="VGBL">VGBL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Taxa Admin. (% a.a.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dados_especificos.taxa_administracao || ''}
                  onChange={(e) => handleDadosEspecificosChange('taxa_administracao', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="1.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Contribuicao Mensal (R$)
              </label>
              <input
                type="text"
                value={formData.dados_especificos.contribuicao_mensal || ''}
                onChange={(e) => handleDadosEspecificosChange('contribuicao_mensal', parseFloat(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                placeholder="500"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden",
            isMobile ? "w-full mx-4" : "w-full max-w-lg"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              {ativoParaEditar ? 'Editar Ativo' : 'Novo Ativo'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  required
                >
                  {Object.entries(CATEGORIAS_METADATA).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome do Ativo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  placeholder="Ex: Tesouro Selic 2029"
                  required
                />
              </div>

              {/* Subcategoria */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Subcategoria
                </label>
                <select
                  value={formData.subcategoria}
                  onChange={(e) => handleChange('subcategoria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value="">Selecione (opcional)</option>
                  {SUBCATEGORIAS[formData.categoria]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor Atual (R$) *
                  </label>
                  <input
                    type="text"
                    value={formData.valor_atual}
                    onChange={(e) => handleChange('valor_atual', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                    placeholder="10.000,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor de Aquisicao (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.valor_aquisicao}
                    onChange={(e) => handleChange('valor_aquisicao', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                    placeholder="8.500,00"
                  />
                </div>
              </div>

              {/* Data e Instituicao */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data de Aquisicao
                  </label>
                  <input
                    type="date"
                    value={formData.data_aquisicao}
                    onChange={(e) => handleChange('data_aquisicao', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Instituicao
                  </label>
                  <input
                    type="text"
                    value={formData.instituicao}
                    onChange={(e) => handleChange('instituicao', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                    placeholder="Ex: Nubank, XP"
                  />
                </div>
              </div>

              {/* Campos especificos da categoria */}
              {renderCamposEspecificos()}

              {/* Observacoes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Observacoes
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue resize-none"
                  rows={2}
                  placeholder="Anotacoes adicionais..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.nome || !formData.valor_atual}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-deep-blue rounded-lg hover:bg-deep-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {ativoParaEditar ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
