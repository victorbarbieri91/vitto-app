import { useState } from 'react';
import { BookOpen, ListFilter, Plus, MessageSquareWarning } from 'lucide-react';
import KnowledgeList from '../../components/admin/conhecimento/KnowledgeList';
import FeedbackQueue from '../../components/admin/conhecimento/FeedbackQueue';
import KnowledgeForm from '../../components/admin/conhecimento/KnowledgeForm';

type Tab = 'regras' | 'feedback';

export default function BaseConhecimentoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('regras');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingEntry(null);
    setRefreshKey(k => k + 1);
  };

  const tabs = [
    { id: 'regras' as Tab, label: 'Regras Ativas', icon: <ListFilter size={16} /> },
    { id: 'feedback' as Tab, label: 'Fila de Review', icon: <MessageSquareWarning size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <BookOpen size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Base de Conhecimento</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Regras RAG para os agentes IA (WhatsApp + Central IA)
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nova Regra
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'regras' ? (
        <KnowledgeList key={`list-${refreshKey}`} onEdit={handleEdit} />
      ) : (
        <FeedbackQueue key={`queue-${refreshKey}`} onRefresh={() => setRefreshKey(k => k + 1)} />
      )}

      {/* Form Modal */}
      {showForm && (
        <KnowledgeForm
          entry={editingEntry}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
