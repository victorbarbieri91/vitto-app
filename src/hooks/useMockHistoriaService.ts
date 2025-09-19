import { useEffect, useState } from 'react';
import { addDays, subMonths, addMonths, formatISO } from 'date-fns';
import type { EventoTimeline } from '../types/historia';

const nomesMarcos = [
  'Viagem Itália',
  'Comprar Notebook',
  'Curso de Inglês',
  'Reforma da Sala',
  'Reserva de Emergência',
];

const nomesBadges = [
  'Economista Iniciante',
  'Caçador de Descontos',
  'Mestre do Cartão',
  'Planejador Top',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const useMockHistoriaService = () => {
  const [timeline, setTimeline] = useState<EventoTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const now = new Date();
      const start = subMonths(now, 3);
      const end = addMonths(now, 2);

      const events: EventoTimeline[] = [];
      let current = start;
      while (current <= end) {
        // 2 a 4 eventos por semana
        const numEventsWeek = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numEventsWeek; i++) {
          const dayOffset = Math.floor(Math.random() * 7);
          const eventDate = addDays(current, dayOffset);
          const isBadge = Math.random() < 0.2; // 20% chance de ser badge
          const id = Math.random().toString(36).substring(2, 10);

          events.push({
            id,
            user_id: 'demo',
            tipo: isBadge ? 'badge' : 'marco',
            nome: isBadge ? randomItem(nomesBadges) : randomItem(nomesMarcos),
            descricao: isBadge ? 'Você desbloqueou uma badge!' : 'Meta financeira importante.',
            status: 'concluido',
            icon_slug: isBadge ? 'star' : 'check-circle',
            cor: isBadge ? '#fbbf24' : '#34d399',
            valor_alvo: isBadge ? undefined : 1000,
            valor_atual: isBadge ? undefined : 1000,
            created_at: formatISO(eventDate),
            data_evento: formatISO(eventDate),
            concluido: true,
          });
        }
        current = addDays(current, 7);
      }

      // ordenar por data
      events.sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime());

      setTimeline(events);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { timeline, loading, error } as const;
}; 