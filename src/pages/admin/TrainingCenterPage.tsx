import { useState } from 'react';
import { GraduationCap, Upload, Database, TestTube, BarChart3, BookOpen } from 'lucide-react';
import DocumentUpload from '../../components/admin/training/DocumentUpload';
import KnowledgeBaseDashboard from '../../components/admin/training/KnowledgeBaseDashboard';
import RAGTester from '../../components/admin/training/RAGTester';
import { ProcessingResult } from '../../services/ai/RAGDocumentProcessor';

type TabType = 'overview' | 'upload' | 'knowledge' | 'testing' | 'analytics';

export default function TrainingCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [recentUploads, setRecentUploads] = useState<ProcessingResult[]>([]);

  const handleUploadComplete = (result: ProcessingResult) => {
    setRecentUploads(prev => [result, ...prev].slice(0, 5));
  };

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Visão Geral',
      icon: GraduationCap,
      description: 'Status geral do sistema de treinamento'
    },
    {
      id: 'upload' as TabType,
      label: 'Upload',
      icon: Upload,
      description: 'Adicionar novos documentos à base'
    },
    {
      id: 'knowledge' as TabType,
      label: 'Base de Conhecimento',
      icon: Database,
      description: 'Gerenciar conteúdo da base vetorial'
    },
    {
      id: 'testing' as TabType,
      label: 'Teste RAG',
      icon: TestTube,
      description: 'Testar consultas e precisão'
    },
    {
      id: 'analytics' as TabType,
      label: 'Análises',
      icon: BarChart3,
      description: 'Métricas e performance'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <GraduationCap className="w-8 h-8 mr-3" />
          Centro de Treinamento RAG
        </h1>
        <p className="text-blue-100">
          Sistema avançado para treinamento da IA financeira com embeddings vetoriais
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Base Vetorial</h3>
              <p className="text-sm text-gray-500">Sistema pgvector ativo</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Processamento</h3>
              <p className="text-sm text-gray-500">OpenAI embeddings</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TestTube className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Teste RAG</h3>
              <p className="text-sm text-gray-500">Busca semântica</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas</h3>
              <p className="text-sm text-gray-500">Performance tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Uploads Recentes
          </h3>

          {recentUploads.length > 0 ? (
            <div className="space-y-3">
              {recentUploads.map((upload, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {upload.success ? '✅' : '❌'} Upload {upload.uploadId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {upload.chunksCreated} chunks criados
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum upload recente</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Ações Rápidas
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-blue-900">Adicionar Conhecimento</div>
              <div className="text-sm text-blue-700">Upload de documentos e textos</div>
            </button>

            <button
              onClick={() => setActiveTab('testing')}
              className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-900">Testar RAG</div>
              <div className="text-sm text-green-700">Validar busca semântica</div>
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-yellow-900">Gerenciar Base</div>
              <div className="text-sm text-yellow-700">Aprovar/rejeitar conteúdo</div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">Database pgvector</div>
            <div className="text-xs text-gray-500">Operacional</div>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">OpenAI Embeddings</div>
            <div className="text-xs text-gray-500">Conectado</div>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium">Busca Vetorial</div>
            <div className="text-xs text-gray-500">Ativo</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Análises e Métricas</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Análises em Desenvolvimento
        </h3>
        <p className="text-gray-500">
          Dashboard de métricas e análises será implementado em breve.
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'upload':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Upload de Documentos</h2>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        );
      case 'knowledge':
        return (
          <div className="space-y-6">
            <KnowledgeBaseDashboard />
          </div>
        );
      case 'testing':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Teste de Busca RAG</h2>
            <RAGTester />
          </div>
        );
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={tab.description}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}