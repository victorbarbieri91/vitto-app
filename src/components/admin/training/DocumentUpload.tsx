import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import ragDocumentProcessor, { ProcessingResult } from '../../../services/ai/RAGDocumentProcessor';

interface DocumentUploadProps {
  onUploadComplete?: (result: ProcessingResult) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  category?: string;
}

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: ProcessingResult;
}

export default function DocumentUpload({
  onUploadComplete,
  acceptedTypes = ['text/plain', 'text/csv', 'application/json', 'text/markdown'],
  maxFiles = 5,
  category = 'general'
}: DocumentUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    multiple: true
  });

  const processFile = async (file: UploadFile) => {
    if (!user) return;

    try {
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 25 } : f
      ));

      // Simula progresso de upload
      await new Promise(resolve => setTimeout(resolve, 500));

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'processing', progress: 50 } : f
      ));

      // Processa o arquivo
      const result = await ragDocumentProcessor.uploadAndProcess(
        file,
        user.id,
        category,
        file.name
      );

      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? {
              ...f,
              status: result.success ? 'completed' : 'error',
              progress: 100,
              result,
              error: result.error
            }
          : f
      ));

      if (result.success && onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? {
              ...f,
              status: 'error',
              progress: 100,
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : f
      ));
    }
  };

  const processAllFiles = async () => {
    setIsProcessing(true);

    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const file of pendingFiles) {
      await processFile(file);
    }

    setIsProcessing(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-5 h-5 text-gray-400" />;
      case 'uploading':
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'pending':
        return 'Aguardando processamento';
      case 'uploading':
        return 'Fazendo upload...';
      case 'processing':
        return 'Processando e criando embeddings...';
      case 'completed':
        return `✅ ${file.result?.chunksCreated || 0} chunks criados`;
      case 'error':
        return `❌ ${file.error || 'Erro desconhecido'}`;
      default:
        return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

        {isDragActive ? (
          <p className="text-blue-600">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Arraste e solte arquivos aqui, ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              Tipos suportados: TXT, CSV, JSON, MD (máximo {maxFiles} arquivos)
            </p>
          </div>
        )}
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Arquivos ({files.length})
            </h3>

            <div className="flex space-x-2">
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar concluídos ({completedCount})
                </button>
              )}

              {pendingCount > 0 && (
                <button
                  onClick={processAllFiles}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processando...' : `Processar ${pendingCount} arquivo(s)`}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          {(completedCount > 0 || errorCount > 0) && (
            <div className="flex space-x-4 text-sm">
              {completedCount > 0 && (
                <span className="text-green-600">
                  ✅ {completedCount} concluído(s)
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">
                  ❌ {errorCount} com erro(s)
                </span>
              )}
            </div>
          )}

          {/* File Items */}
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(file.status)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {getStatusText(file)}
                  </p>

                  {/* Progress Bar */}
                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 Dicas para melhores resultados:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use arquivos com conteúdo financeiro relevante</li>
          <li>• Textos bem estruturados geram embeddings mais precisos</li>
          <li>• Arquivos CSV devem ter colunas: question, ideal_answer</li>
          <li>• Evite arquivos com muito ruído ou formatação complexa</li>
        </ul>
      </div>
    </div>
  );
}