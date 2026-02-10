import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ChatSession } from '../../types/central-ia';

interface ConversationSidebarProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, titulo: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

/**
 *
 */
export function ConversationSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onSearch,
  isLoading,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.titulo || '');
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Agrupa sessões por data
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={onNewSession}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'px-4 py-2.5 rounded-xl',
            'bg-coral-500 text-white font-medium',
            'hover:bg-coral-600 transition-colors',
            'shadow-sm'
          )}
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </button>
      </div>

      {/* Busca */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Buscar conversas..."
            className={cn(
              'w-full pl-9 pr-4 py-2 rounded-lg',
              'bg-gray-50 border border-gray-100',
              'text-sm placeholder-gray-400',
              'focus:outline-none focus:border-coral-200 focus:ring-1 focus:ring-coral-100'
            )}
          />
        </div>
      </div>

      {/* Lista de sessões */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {searchQuery
                ? 'Nenhuma conversa encontrada'
                : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {Object.entries(groupedSessions).map(([dateLabel, dateSessions]) => (
              <div key={dateLabel}>
                <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {dateLabel}
                </p>
                <div className="space-y-1">
                  {dateSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      isEditing={session.id === editingId}
                      editTitle={editTitle}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                      onStartEdit={() => startEditing(session)}
                      onEditChange={setEditTitle}
                      onSaveEdit={saveEdit}
                      onCancelEdit={cancelEdit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onDelete,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: SessionItemProps) {
  const [showActions, setShowActions] = useState(false);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-2 rounded-lg bg-coral-50">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
          className="flex-1 px-2 py-1 text-sm bg-white rounded border border-coral-200 focus:outline-none focus:border-coral-400"
        />
        <button
          onClick={onSaveEdit}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancelEdit}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer',
        'transition-colors duration-150',
        isActive
          ? 'bg-coral-50 text-coral-700'
          : 'hover:bg-gray-50 text-gray-700'
      )}
      onClick={onSelect}
    >
      <MessageSquare className={cn(
        'w-4 h-4 flex-shrink-0',
        isActive ? 'text-coral-500' : 'text-gray-400'
      )} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {session.titulo || 'Nova conversa'}
        </p>
        {session.ultima_mensagem && (
          <p className="text-xs text-gray-400 truncate">
            {session.ultima_mensagem}
          </p>
        )}
      </div>

      {/* Ações */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onStartEdit}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper para agrupar sessões por data
function groupSessionsByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updated_at);
    sessionDate.setHours(0, 0, 0, 0);

    let label: string;

    if (sessionDate.getTime() === today.getTime()) {
      label = 'Hoje';
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      label = 'Ontem';
    } else if (sessionDate >= lastWeek) {
      label = 'Últimos 7 dias';
    } else {
      label = sessionDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(session);
  });

  return groups;
}
