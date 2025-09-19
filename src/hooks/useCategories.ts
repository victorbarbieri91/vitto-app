import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../services/supabase/client';

export type Category = {
  id: number;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  user_id: string | null;
  created_at: string;
  is_default: boolean;
};

export type NewCategory = Omit<Category, 'id' | 'created_at'> & {
  user_id?: string;
};

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_categoria')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('nome');

      if (error) throw error;

      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias');
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (newCategory: NewCategory) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_categoria')
        .insert({ ...newCategory, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar categoria');
      console.error('Erro ao adicionar categoria:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      // Verificar se a categoria pertence ao usuário
      const { data: categoryData, error: fetchError } = await supabase
        .from('app_categoria')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Não permitir atualização de categorias padrão (user_id é null)
      if (!categoryData.user_id) {
        throw new Error('Não é possível modificar categorias padrão');
      }

      const { error } = await supabase
        .from('app_categoria')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => 
        prev.map(category => 
          category.id === id ? { ...category, ...updates } : category
        )
      );
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria');
      console.error('Erro ao atualizar categoria:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      // Verificar se a categoria pertence ao usuário
      const { data: categoryData, error: fetchError } = await supabase
        .from('app_categoria')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Não permitir exclusão de categorias padrão (user_id é null)
      if (!categoryData.user_id) {
        throw new Error('Não é possível excluir categorias padrão');
      }

      const { error } = await supabase
        .from('app_categoria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(category => category.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria');
      console.error('Erro ao excluir categoria:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
