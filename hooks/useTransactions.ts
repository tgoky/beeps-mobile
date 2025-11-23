import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Transaction, TransactionStatus, TransactionType } from '@/types/database';

export function useTransactions(userId?: string) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((transaction) => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type as TransactionType,
        amount: transaction.amount,
        status: transaction.status as TransactionStatus,
        referenceId: transaction.reference_id,
        referenceType: transaction.reference_type,
        description: transaction.description,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      })) as Transaction[];
    },
    enabled: !!userId,
  });
}

export function useTransactionsByType(userId?: string, type?: TransactionType) {
  return useQuery({
    queryKey: ['transactions', userId, type],
    queryFn: async () => {
      if (!userId || !type) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((transaction) => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type as TransactionType,
        amount: transaction.amount,
        status: transaction.status as TransactionStatus,
        referenceId: transaction.reference_id,
        referenceType: transaction.reference_type,
        description: transaction.description,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      })) as Transaction[];
    },
    enabled: !!userId && !!type,
  });
}

export function useTransactionStats(userId?: string) {
  return useQuery({
    queryKey: ['transactions', 'stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

      if (error) throw error;

      const total = data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const count = data?.length || 0;

      // Group by type
      const byType = data?.reduce((acc, t) => {
        const type = t.type as TransactionType;
        if (!acc[type]) {
          acc[type] = { count: 0, amount: 0 };
        }
        acc[type].count++;
        acc[type].amount += t.amount;
        return acc;
      }, {} as Record<TransactionType, { count: number; amount: number }>);

      return {
        total,
        count,
        byType: byType || {},
      };
    },
    enabled: !!userId,
  });
}
