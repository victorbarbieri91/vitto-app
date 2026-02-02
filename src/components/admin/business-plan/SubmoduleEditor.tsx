import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import type {
  BusinessPlanSubmodule,
  BusinessPlanContent,
  ThesisContent,
  MarketContent,
  ProductContent,
  RevenueContent,
  GoToMarketContent,
  MetricsContent,
  RisksContent
} from '../../../types/admin';

interface SubmoduleEditorProps {
  submodule: BusinessPlanSubmodule;
  content: BusinessPlanContent;
  onSave: (content: BusinessPlanContent, changeSummary?: string) => Promise<void>;
}

export default function SubmoduleEditor({ submodule, content, onSave }: SubmoduleEditorProps) {
  const [saving, setSaving] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  const handleSave = async (data: BusinessPlanContent) => {
    setSaving(true);
    try {
      await onSave(data, changeSummary || undefined);
      setChangeSummary('');
    } finally {
      setSaving(false);
    }
  };

  // Render different forms based on submodule type
  switch (submodule) {
    case 'thesis':
      return <ThesisEditor content={content as ThesisContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'market':
      return <MarketEditor content={content as MarketContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'product':
      return <ProductEditor content={content as ProductContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'revenue':
      return <RevenueEditor content={content as RevenueContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'go_to_market':
      return <GoToMarketEditor content={content as GoToMarketContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'metrics':
      return <MetricsEditor content={content as MetricsContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    case 'risks':
      return <RisksEditor content={content as RisksContent} onSave={handleSave} saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />;
    default:
      return <div>Editor não disponível</div>;
  }
}

// Common components
const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";
const sectionClass = "space-y-3";

interface EditorProps<T> {
  content: T;
  onSave: (data: T) => Promise<void>;
  saving: boolean;
  changeSummary: string;
  setChangeSummary: (value: string) => void;
}

const SaveFooter = ({ saving, changeSummary, setChangeSummary }: { saving: boolean; changeSummary: string; setChangeSummary: (v: string) => void }) => (
  <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
    <input
      type="text"
      placeholder="Resumo da alteração (opcional)"
      value={changeSummary}
      onChange={(e) => setChangeSummary(e.target.value)}
      className={`flex-1 ${inputClass}`}
    />
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 disabled:opacity-50 transition-colors"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      Salvar
    </button>
  </div>
);

// THESIS EDITOR
function ThesisEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<ThesisContent>) {
  const { register, control, handleSubmit } = useForm<ThesisContent>({
    defaultValues: content
  });

  const { fields: diffFields, append: appendDiff, remove: removeDiff } = useFieldArray({ control, name: 'differentiators' as never });
  const { fields: hypFields, append: appendHyp, remove: removeHyp } = useFieldArray({ control, name: 'hypotheses' });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <label className={labelClass}>Problema Central</label>
        <textarea {...register('problem')} rows={3} className={inputClass} placeholder="Qual problema você resolve?" />
      </div>

      <div className={sectionClass}>
        <label className={labelClass}>Público-Alvo (Beachhead)</label>
        <textarea {...register('targetAudience')} rows={2} className={inputClass} placeholder="Quem é seu cliente inicial?" />
      </div>

      <div className={sectionClass}>
        <label className={labelClass}>Proposta de Valor</label>
        <textarea {...register('valueProposition')} rows={2} className={inputClass} placeholder="Qual valor você entrega?" />
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Diferenciais</label>
          <button type="button" onClick={() => appendDiff('')} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {diffFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input {...register(`differentiators.${index}` as const)} className={`flex-1 ${inputClass}`} placeholder="Diferencial" />
            <button type="button" onClick={() => removeDiff(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Hipóteses</label>
          <button type="button" onClick={() => appendHyp({ text: '', validated: false })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {hypFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-center">
            <input {...register(`hypotheses.${index}.text`)} className={`flex-1 ${inputClass}`} placeholder="Hipótese" />
            <Controller
              control={control}
              name={`hypotheses.${index}.validated`}
              render={({ field: checkField }) => (
                <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                  <input type="checkbox" checked={checkField.value} onChange={checkField.onChange} className="rounded" />
                  Validada
                </label>
              )}
            />
            <button type="button" onClick={() => removeHyp(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// MARKET EDITOR
function MarketEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<MarketContent>) {
  const { register, control, handleSubmit } = useForm<MarketContent>({
    defaultValues: content
  });

  const { fields: segFields, append: appendSeg, remove: removeSeg } = useFieldArray({ control, name: 'segments' });
  const { fields: compFields, append: appendComp, remove: removeComp } = useFieldArray({ control, name: 'competitors' });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Segmentos</label>
          <button type="button" onClick={() => appendSeg({ name: '', size: '', characteristics: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {segFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`segments.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Nome do segmento" />
              <input {...register(`segments.${index}.size`)} className={`w-32 ${inputClass}`} placeholder="Tamanho" />
              <button type="button" onClick={() => removeSeg(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`segments.${index}.characteristics`)} className={inputClass} placeholder="Características" />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Concorrentes</label>
          <button type="button" onClick={() => appendComp({ name: '', strengths: [], weaknesses: [] })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {compFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`competitors.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Nome do concorrente" />
              <button type="button" onClick={() => removeComp(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <label className={labelClass}>Posicionamento</label>
        <textarea {...register('positioning')} rows={3} className={inputClass} placeholder="Como você se posiciona no mercado?" />
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// PRODUCT EDITOR
function ProductEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<ProductContent>) {
  const { register, control, handleSubmit } = useForm<ProductContent>({
    defaultValues: content
  });

  const { fields: featFields, append: appendFeat, remove: removeFeat } = useFieldArray({ control, name: 'features' });
  const { fields: roadFields, append: appendRoad, remove: removeRoad } = useFieldArray({ control, name: 'roadmap' });
  const { fields: limFields, append: appendLim, remove: removeLim } = useFieldArray({ control, name: 'limitations' as never });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Funcionalidades</label>
          <button type="button" onClick={() => appendFeat({ name: '', description: '', status: 'planned' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {featFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`features.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Nome" />
              <select {...register(`features.${index}.status`)} className={`w-36 ${inputClass}`}>
                <option value="implemented">Implementado</option>
                <option value="in_progress">Em progresso</option>
                <option value="planned">Planejado</option>
              </select>
              <button type="button" onClick={() => removeFeat(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`features.${index}.description`)} className={inputClass} placeholder="Descrição" />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <label className={labelClass}>Valor Entregue</label>
        <textarea {...register('valueDelivered')} rows={2} className={inputClass} placeholder="Qual valor o produto entrega?" />
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Limitações Atuais</label>
          <button type="button" onClick={() => appendLim('')} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {limFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input {...register(`limitations.${index}` as const)} className={`flex-1 ${inputClass}`} placeholder="Limitação" />
            <button type="button" onClick={() => removeLim(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Roadmap</label>
          <button type="button" onClick={() => appendRoad({ phase: '', description: '', targetDate: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {roadFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`roadmap.${index}.phase`)} className={`w-32 ${inputClass}`} placeholder="Fase" />
              <input {...register(`roadmap.${index}.targetDate`)} type="date" className={`w-40 ${inputClass}`} />
              <button type="button" onClick={() => removeRoad(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`roadmap.${index}.description`)} className={inputClass} placeholder="Descrição" />
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// REVENUE EDITOR
function RevenueEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<RevenueContent>) {
  const { register, control, handleSubmit } = useForm<RevenueContent>({
    defaultValues: content
  });

  const { fields: planFields, append: appendPlan, remove: removePlan } = useFieldArray({ control, name: 'plans' });
  const { fields: stratFields, append: appendStrat, remove: removeStrat } = useFieldArray({ control, name: 'monetizationStrategies' as never });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Planos</label>
          <button type="button" onClick={() => appendPlan({ name: '', price: '', features: [] })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {planFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`plans.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Nome do plano" />
              <input {...register(`plans.${index}.price`)} className={`w-32 ${inputClass}`} placeholder="Preço" />
              <button type="button" onClick={() => removePlan(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Estratégias de Monetização</label>
          <button type="button" onClick={() => appendStrat('')} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {stratFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input {...register(`monetizationStrategies.${index}` as const)} className={`flex-1 ${inputClass}`} placeholder="Estratégia" />
            <button type="button" onClick={() => removeStrat(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// GO TO MARKET EDITOR
function GoToMarketEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<GoToMarketContent>) {
  const { register, control, handleSubmit } = useForm<GoToMarketContent>({
    defaultValues: content
  });

  const { fields: chanFields, append: appendChan, remove: removeChan } = useFieldArray({ control, name: 'channels' });
  const { fields: msgFields, append: appendMsg, remove: removeMsg } = useFieldArray({ control, name: 'keyMessages' as never });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Canais de Aquisição</label>
          <button type="button" onClick={() => appendChan({ name: '', strategy: '', priority: 'medium' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {chanFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`channels.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Canal" />
              <select {...register(`channels.${index}.priority`)} className={`w-28 ${inputClass}`}>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
              <button type="button" onClick={() => removeChan(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`channels.${index}.strategy`)} className={inputClass} placeholder="Estratégia" />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Mensagens-Chave</label>
          <button type="button" onClick={() => appendMsg('')} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {msgFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input {...register(`keyMessages.${index}` as const)} className={`flex-1 ${inputClass}`} placeholder="Mensagem" />
            <button type="button" onClick={() => removeMsg(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// METRICS EDITOR
function MetricsEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<MetricsContent>) {
  const { register, control, handleSubmit } = useForm<MetricsContent>({
    defaultValues: content
  });

  const { fields: kpiFields, append: appendKpi, remove: removeKpi } = useFieldArray({ control, name: 'keyIndicators' });
  const { fields: objFields, append: appendObj, remove: removeObj } = useFieldArray({ control, name: 'periodObjectives' });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Indicadores-Chave</label>
          <button type="button" onClick={() => appendKpi({ name: '', target: '', current: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {kpiFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input {...register(`keyIndicators.${index}.name`)} className={`flex-1 ${inputClass}`} placeholder="Indicador" />
            <input {...register(`keyIndicators.${index}.target`)} className={`w-28 ${inputClass}`} placeholder="Meta" />
            <input {...register(`keyIndicators.${index}.current`)} className={`w-28 ${inputClass}`} placeholder="Atual" />
            <button type="button" onClick={() => removeKpi(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Objetivos por Período</label>
          <button type="button" onClick={() => appendObj({ period: '', objectives: [], status: 'pending' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {objFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`periodObjectives.${index}.period`)} className={`flex-1 ${inputClass}`} placeholder="Período (ex: Q1 2024)" />
              <select {...register(`periodObjectives.${index}.status`)} className={`w-36 ${inputClass}`}>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em progresso</option>
                <option value="achieved">Alcançado</option>
              </select>
              <button type="button" onClick={() => removeObj(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}

// RISKS EDITOR
function RisksEditor({ content, onSave, saving, changeSummary, setChangeSummary }: EditorProps<RisksContent>) {
  const { register, control, handleSubmit } = useForm<RisksContent>({
    defaultValues: content
  });

  const { fields: riskFields, append: appendRisk, remove: removeRisk } = useFieldArray({ control, name: 'mappedRisks' });
  const { fields: decMadeFields, append: appendDecMade, remove: removeDecMade } = useFieldArray({ control, name: 'decisionsMade' });
  const { fields: decPendFields, append: appendDecPend, remove: removeDecPend } = useFieldArray({ control, name: 'decisionsPending' });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Riscos Mapeados</label>
          <button type="button" onClick={() => appendRisk({ risk: '', impact: 'medium', probability: 'medium', mitigation: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {riskFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`mappedRisks.${index}.risk`)} className={`flex-1 ${inputClass}`} placeholder="Risco" />
              <select {...register(`mappedRisks.${index}.impact`)} className={`w-24 ${inputClass}`}>
                <option value="low">Baixo</option>
                <option value="medium">Médio</option>
                <option value="high">Alto</option>
              </select>
              <select {...register(`mappedRisks.${index}.probability`)} className={`w-24 ${inputClass}`}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
              <button type="button" onClick={() => removeRisk(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`mappedRisks.${index}.mitigation`)} className={inputClass} placeholder="Mitigação" />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Decisões Tomadas</label>
          <button type="button" onClick={() => appendDecMade({ decision: '', date: '', justification: '', impact: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {decMadeFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-emerald-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`decisionsMade.${index}.decision`)} className={`flex-1 ${inputClass}`} placeholder="Decisão" />
              <input {...register(`decisionsMade.${index}.date`)} type="date" className={`w-40 ${inputClass}`} />
              <button type="button" onClick={() => removeDecMade(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`decisionsMade.${index}.justification`)} className={inputClass} placeholder="Justificativa" />
            <input {...register(`decisionsMade.${index}.impact`)} className={inputClass} placeholder="Impacto esperado" />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Decisões Pendentes</label>
          <button type="button" onClick={() => appendDecPend({ decision: '', context: '', deadline: '' })} className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {decPendFields.map((field, index) => (
          <div key={field.id} className="p-3 bg-amber-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input {...register(`decisionsPending.${index}.decision`)} className={`flex-1 ${inputClass}`} placeholder="Decisão pendente" />
              <input {...register(`decisionsPending.${index}.deadline`)} type="date" className={`w-40 ${inputClass}`} />
              <button type="button" onClick={() => removeDecPend(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input {...register(`decisionsPending.${index}.context`)} className={inputClass} placeholder="Contexto" />
          </div>
        ))}
      </div>

      <SaveFooter saving={saving} changeSummary={changeSummary} setChangeSummary={setChangeSummary} />
    </form>
  );
}
