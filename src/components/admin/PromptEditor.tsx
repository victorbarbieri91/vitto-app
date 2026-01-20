import { useState, useEffect } from 'react';
import { AgentConfig, AgentConfigService } from '../../services/api/agentConfig';
import { useAuth } from '../../store/AuthContext';
import { ModernCard, ModernButton } from '../ui/modern';
import { Edit3, Save, X, TestTube, Eye } from 'lucide-react';

interface PromptEditorProps {
  agent: AgentConfig;
  onUpdate?: (updatedAgent: AgentConfig) => void;
  onClose?: () => void;
}

export function PromptEditor({ agent, onUpdate, onClose }: PromptEditorProps) {
  const { user } = useAuth();
  const [editedPrompt, setEditedPrompt] = useState(agent.prompt_system);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<unknown[]>([]);
  const [motivoAlteracao, setMotivoAlteracao] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setEditedPrompt(agent.prompt_system);
  }, [agent]);

  const handleSave = async () => {
    if (!user?.id || editedPrompt.trim() === '') return;

    try {
      setIsSaving(true);

      const updatedAgent = await AgentConfigService.update(
        agent.id,
        {
          prompt_system: editedPrompt,
          motivo_alteracao: motivoAlteracao || 'Atualização via painel admin'
        },
        user.id
      );

      setIsEditing(false);
      setMotivoAlteracao('');
      onUpdate?.(updatedAgent);

      // Mostrar feedback de sucesso
      alert('Prompt atualizado com sucesso! As próximas conversas usarão o novo prompt.');
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      alert('Erro ao salvar o prompt. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPrompt(agent.prompt_system);
    setIsEditing(false);
    setMotivoAlteracao('');
  };

  const loadHistory = async () => {
    try {
      const historyData = await AgentConfigService.getHistory(agent.id);
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico de alterações.');
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) {
      alert('Digite uma mensagem de teste primeiro.');
      return;
    }

    try {
      const result = await AgentConfigService.testPrompt(
        agent.tipo,
        editedPrompt,
        testMessage
      );
      setTestResult(result);
    } catch (error) {
      console.error('Erro ao testar prompt:', error);
      setTestResult('Erro ao testar o prompt. Tente novamente.');
    }
  };

  const formatPromptForDisplay = (prompt: string) => {
    return prompt
      .split('\n\n')
      .map((section, index) => (
        <div key={index} className="mb-4">
          {section.split('\n').map((line, lineIndex) => (
            <div key={lineIndex} className="mb-1">
              {line.startsWith('PERSONALIDADE:') ||
               line.startsWith('CAPACIDADES:') ||
               line.startsWith('REGRAS IMPORTANTES:') ||
               line.startsWith('ESPECIALIZAÇÃO:') ||
               line.startsWith('CONTEXTO BRASILEIRO:') ||
               line.startsWith('OUTPUTS:') ||
               line.startsWith('RESPONSABILIDADES:') ||
               line.startsWith('PRECISÃO:') ||
               line.startsWith('SEGURANÇA:') ||
               line.startsWith('VALIDAÇÕES:') ||
               line.startsWith('ANOMALIAS A DETECTAR:') ||
               line.startsWith('RELATÓRIOS:') ||
               line.startsWith('DOCUMENTOS SUPORTADOS:') ||
               line.startsWith('EXTRAÇÃO:') ||
               line.startsWith('FORMATO BRASILEIRO:') ||
               line.startsWith('QUALIDADE:') ? (
                <div className="font-semibold text-blue-700 mt-3 mb-1">{line}</div>
              ) : line.startsWith('-') ? (
                <div className="ml-4 text-gray-700">{line}</div>
              ) : line.match(/^\d+\./) ? (
                <div className="ml-4 text-gray-700">{line}</div>
              ) : (
                <div className="text-gray-800">{line}</div>
              )}
            </div>
          ))}
        </div>
      ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{agent.nome}</h3>
          <p className="text-sm text-gray-600 mt-1">{agent.descricao}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>Versão {agent.versao}</span>
            <span>•</span>
            <span>Atualizado em {new Date(agent.atualizado_em).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={loadHistory}
            icon="📊"
          >
            Histórico
          </ModernButton>
          {onClose && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={onClose}
              icon="✕"
            >
              Fechar
            </ModernButton>
          )}
        </div>
      </div>

      {/* Content */}
      <ModernCard variant="glass" className="p-6">
        {!isEditing ? (
          // View Mode
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Prompt do Sistema</h4>
              <div className="flex items-center space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showPreview ? 'Ocultar' : 'Visualizar'}
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Editar
                </ModernButton>
              </div>
            </div>

            {showPreview ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="text-sm">
                  {formatPromptForDisplay(agent.prompt_system)}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 font-mono">
                  {agent.prompt_system.substring(0, 200)}...
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {agent.prompt_system.length} caracteres
                </div>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Editando Prompt</h4>
              <div className="flex items-center space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || editedPrompt.trim() === ''}
                  loading={isSaving}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </ModernButton>
              </div>
            </div>

            {/* Motivo da alteração */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Alteração (opcional)
              </label>
              <input
                type="text"
                value={motivoAlteracao}
                onChange={(e) => setMotivoAlteracao(e.target.value)}
                placeholder="Ex: Melhorar precisão nas respostas sobre investimentos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Editor de prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt do Sistema
              </label>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Digite o prompt do sistema..."
              />
              <div className="mt-1 text-xs text-gray-500">
                {editedPrompt.length} caracteres
              </div>
            </div>

            {/* Seção de teste */}
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-900 mb-3">Testar Prompt</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Teste
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={4}
                    placeholder="Digite uma mensagem para testar como o agente responderia..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={!testMessage.trim()}
                    className="mt-2"
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    Testar
                  </ModernButton>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultado do Teste
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[100px] text-sm">
                    {testResult || 'Execute um teste para ver o resultado...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModernCard>

      {/* Histórico Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Histórico de Alterações</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma alteração registrada ainda.
                </p>
              ) : (
                history.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{item.app_perfil?.nome || 'Usuário'}</span>
                        {' • '}
                        {new Date(item.criado_em).toLocaleString('pt-BR')}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Versão {history.length - index}
                      </span>
                    </div>
                    {item.motivo_alteracao && (
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Motivo:</strong> {item.motivo_alteracao}
                      </div>
                    )}
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Ver alterações
                      </summary>
                      <div className="mt-2 bg-gray-50 rounded p-3">
                        <div className="mb-2">
                          <strong>Prompt anterior:</strong>
                          <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-x-auto">
                            {item.prompt_anterior?.substring(0, 200)}...
                          </pre>
                        </div>
                        <div>
                          <strong>Prompt novo:</strong>
                          <pre className="mt-1 text-xs bg-green-50 p-2 rounded overflow-x-auto">
                            {item.prompt_novo?.substring(0, 200)}...
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}