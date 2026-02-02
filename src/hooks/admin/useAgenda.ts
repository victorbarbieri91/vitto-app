import { useState, useEffect, useCallback } from 'react';
import { AgendaService, TaskFilters } from '../../services/admin/AgendaService';
import { useAuth } from '../../store/AuthContext';
import type {
  AgendaTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus
} from '../../types/admin';

interface UseAgendaReturn {
  tasks: AgendaTask[];
  loading: boolean;
  error: Error | null;
  statusCounts: Record<TaskStatus, number>;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  createTask: (input: CreateTaskInput) => Promise<AgendaTask>;
  updateTask: (id: number, input: UpdateTaskInput) => Promise<AgendaTask>;
  deleteTask: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAgenda(): UseAgendaReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<TaskStatus, number>>({
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, counts] = await Promise.all([
        AgendaService.getAll(filters),
        AgendaService.getStatusCounts()
      ]);
      setTasks(tasksData);
      setStatusCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<AgendaTask> => {
    if (!user) throw new Error('User not authenticated');

    const newTask = await AgendaService.create(input, user.id);
    await fetchTasks();
    return newTask;
  }, [user, fetchTasks]);

  const updateTask = useCallback(async (id: number, input: UpdateTaskInput): Promise<AgendaTask> => {
    const updated = await AgendaService.update(id, input);
    await fetchTasks();
    return updated;
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    await AgendaService.delete(id);
    await fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    statusCounts,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
}

interface UseUpcomingTasksReturn {
  upcomingTasks: AgendaTask[];
  overdueTasks: AgendaTask[];
  loading: boolean;
}

export function useUpcomingTasks(): UseUpcomingTasksReturn {
  const [upcomingTasks, setUpcomingTasks] = useState<AgendaTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<AgendaTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [upcoming, overdue] = await Promise.all([
          AgendaService.getUpcomingDeadlines(),
          AgendaService.getOverdue()
        ]);
        setUpcomingTasks(upcoming);
        setOverdueTasks(overdue);
      } catch (err) {
        console.error('Failed to fetch upcoming tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { upcomingTasks, overdueTasks, loading };
}
