import { useState, useEffect, useMemo } from 'react';
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
  // ID da categoria padrão que esta categoria personaliza (se aplicável)
  overrides_default_id?: number | null;
};

export type NewCategory = Omit<Category, 'id' | 'created_at' | 'user_id' | 'overrides_default_id'> & {
  user_id?: string | null;
};

/**
 *
 */
export function useCategories() {
  const { user } = useAuth();
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Processar categorias: se o usuário tem uma versão personalizada de uma categoria padrão,
  // mostrar apenas a versão personalizada
  const categories = useMemo(() => {
    // Encontrar IDs das categorias padrão que o usuário personalizou
    const customizedDefaultIds = new Set(
      rawCategories
        .filter(c => c.user_id && c.overrides_default_id)
        .map(c => c.overrides_default_id)
    );

    // Filtrar: remover categorias padrão que foram personalizadas
    return rawCategories.filter(c => {
      if (c.is_default && customizedDefaultIds.has(c.id)) {
        return false; // Esconder categoria padrão que foi personalizada
      }
      return true;
    });
  }, [rawCategories]);

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

      setRawCategories(data || []);
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
        .insert({
          ...newCategory,
          user_id: user.id,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setRawCategories(prev => [...prev, data]);
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
      // Buscar a categoria original
      const { data: categoryData, error: fetchError } = await supabase
        .from('app_categoria')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Se é uma categoria padrão (user_id é null), criar uma cópia personalizada
      if (!categoryData.user_id) {
        // Verificar se já existe uma personalização desta categoria
        const existingCustom = rawCategories.find(
          c => c.user_id === user.id && c.overrides_default_id === id
        );

        if (existingCustom) {
          // Atualizar a personalização existente
          const { error: updateError } = await supabase
            .from('app_categoria')
            .update({
              nome: updates.nome || categoryData.nome,
              tipo: updates.tipo || categoryData.tipo,
              cor: updates.cor || categoryData.cor,
              icone: updates.icone || categoryData.icone,
            })
            .eq('id', existingCustom.id);

          if (updateError) throw updateError;

          setRawCategories(prev =>
            prev.map(category =>
              category.id === existingCustom.id
                ? { ...category, ...updates }
                : category
            )
          );
        } else {
          // Criar nova personalização
          const { data: newCategory, error: insertError } = await supabase
            .from('app_categoria')
            .insert({
              nome: updates.nome || categoryData.nome,
              tipo: updates.tipo || categoryData.tipo,
              cor: updates.cor || categoryData.cor,
              icone: updates.icone || categoryData.icone,
              user_id: user.id,
              is_default: false,
              overrides_default_id: id,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          setRawCategories(prev => [...prev, newCategory]);
        }

        return true;
      }

      // Se é uma categoria do próprio usuário, atualizar normalmente
      const { error } = await supabase
        .from('app_categoria')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRawCategories(prev =>
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

  // Resetar uma categoria personalizada para a versão padrão
  const resetToDefault = async (categoryId: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      // Buscar a categoria
      const category = rawCategories.find(c => c.id === categoryId);

      if (!category || !category.overrides_default_id) {
        throw new Error('Esta categoria não é uma personalização');
      }

      // Excluir a personalização
      const { error } = await supabase
        .from('app_categoria')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRawCategories(prev => prev.filter(c => c.id !== categoryId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar categoria');
      console.error('Erro ao resetar categoria:', err);
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
      // Buscar a categoria
      const { data: categoryData, error: fetchError } = await supabase
        .from('app_categoria')
        .select('user_id, is_default')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Não permitir exclusão de categorias padrão
      if (categoryData.is_default || !categoryData.user_id) {
        throw new Error('Não é possível excluir categorias padrão');
      }

      const { error } = await supabase
        .from('app_categoria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRawCategories(prev => prev.filter(category => category.id !== id));
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
      setRawCategories([]);
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
    resetToDefault,
  };
}
