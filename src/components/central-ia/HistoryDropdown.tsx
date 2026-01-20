import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ChatSession } from '../../types/central-ia';

interface HistoryDropdownProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

// Agrupar sessões por data
function groupSessionsByDate(sessions: ChatSession[]) {
  const groups: Record<string, ChatSession[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  sessions.forEach(session => {
    const sessionDate = new Date(session.created_at);
    sessionDate.setHours(0, 0, 0, 0);

    let groupKey: string;
    if (sessionDate.getTime() === today.getTime()) {
      groupKey = 'Hoje';
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      groupKey = 'Ontem';
    } else if (sessionDate >= weekAgo) {
      groupKey = 'Últimos 7 dias';
    } else {
      groupKey = sessionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(session);
  });

  return groups;
}

export function HistoryDropdown({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isLoading = false
}: HistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedSessions = groupSessionsByDate(sessions);
  const groupOrder = ['Hoje', 'Ontem', 'Últimos 7 dias'];

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setIsOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-4 py-2 rounded-xl transition-all duration-200',
          'hover:bg-white/60 text-slate-600 hover:text-slate-800',
          isOpen && 'bg-white/60 text-slate-800'
        )}
      >
        <span className="text-sm font-medium">Histórico</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full mt-2 w-72 sm:w-80',
              'bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60',
              'overflow-hidden z-50'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700">Conversas</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Nova Conversa */}
            <button
              onClick={handleNewSession}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'hover:bg-coral-50 transition-colors',
                'border-b border-slate-100'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-coral-100 flex items-center justify-center">
                <Plus className="w-4 h-4 text-coral-600" />
              </div>
              <span className="font-medium text-coral-600">Nova conversa</span>
            </button>

            {/* Lista de Sessões */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-slate-400">
                  <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-coral-500 rounded-full mx-auto" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                </div>
              ) : (
                <>
                  {/* Grupos ordenados */}
                  {groupOrder.map(groupKey => {
                    const groupSessions = groupedSessions[groupKey];
                    if (!groupSessions?.length) return null;

                    return (
                      <div key={groupKey}>
                        <div className="px-4 py-2 bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {groupKey}
                          </span>
                        </div>
                        {groupSessions.map(session => (
                          <div
                            key={session.id}
                            className={cn(
                              'relative group',
                              currentSessionId === session.id && 'bg-coral-50'
                            )}
                            onMouseEnter={() => setHoveredSession(session.id)}
                            onMouseLeave={() => setHoveredSession(null)}
                          >
                            <button
                              onClick={() => handleSelectSession(session.id)}
                              className={cn(
                                'w-full flex items-start gap-3 px-4 py-3 text-left',
                                'hover:bg-slate-50 transition-colors',
                                currentSessionId === session.id && 'hover:bg-coral-50'
                              )}
                            >
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                currentSessionId === session.id
                                  ? 'bg-coral-100'
                                  : 'bg-slate-100'
                              )}>
                                <MessageSquare className={cn(
                                  'w-4 h-4',
                                  currentSessionId === session.id
                                    ? 'text-coral-600'
                                    : 'text-slate-400'
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'font-medium truncate',
                                  currentSessionId === session.id
                                    ? 'text-coral-700'
                                    : 'text-slate-700'
                                )}>
                                  {session.titulo || 'Nova conversa'}
                                </p>
                                {session.ultima_mensagem && (
                                  <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {session.ultima_mensagem}
                                  </p>
                                )}
                              </div>
                            </button>

                            {/* Delete button */}
                            {hoveredSession === session.id && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                className={cn(
                                  'absolute right-2 top-1/2 -translate-y-1/2',
                                  'p-2 rounded-lg hover:bg-red-50 transition-colors'
                                )}
                              >
                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                              </motion.button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Outros meses */}
                  {Object.entries(groupedSessions)
                    .filter(([key]) => !groupOrder.includes(key))
                    .map(([groupKey, groupSessions]) => (
                      <div key={groupKey}>
                        <div className="px-4 py-2 bg-slate-50">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {groupKey}
                          </span>
                        </div>
                        {groupSessions.map(session => (
                          <button
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={cn(
                              'w-full flex items-start gap-3 px-4 py-3 text-left',
                              'hover:bg-slate-50 transition-colors',
                              currentSessionId === session.id && 'bg-coral-50 hover:bg-coral-50'
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              currentSessionId === session.id ? 'bg-coral-100' : 'bg-slate-100'
                            )}>
                              <MessageSquare className={cn(
                                'w-4 h-4',
                                currentSessionId === session.id ? 'text-coral-600' : 'text-slate-400'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'font-medium truncate',
                                currentSessionId === session.id ? 'text-coral-700' : 'text-slate-700'
                              )}>
                                {session.titulo || 'Nova conversa'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
