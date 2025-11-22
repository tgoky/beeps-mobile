import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Equipment } from '@/types/database';

export interface EquipmentWithSeller extends Equipment {
  seller: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          users!seller_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((equipment) => {
        const sellerUser = equipment.users;

        return {
          id: equipment.id,
          name: equipment.name,
          description: equipment.description,
          category: equipment.category,
          sellerId: equipment.seller_id,
          clubId: equipment.club_id,
          price: equipment.price,
          rentalRate: equipment.rental_rate,
          condition: equipment.condition,
          address: equipment.address,
          city: equipment.city,
          state: equipment.state,
          country: equipment.country,
          imageUrl: equipment.image_url,
          isActive: equipment.is_active,
          createdAt: equipment.created_at,
          updatedAt: equipment.updated_at,
          seller: {
            id: sellerUser?.id || '',
            username: sellerUser?.username || '',
            fullName: sellerUser?.full_name,
            avatar: sellerUser?.avatar,
          },
        };
      }) as EquipmentWithSeller[];
    },
  });
}

// Fetch equipment by category
export function useEquipmentByCategory(category?: string) {
  return useQuery({
    queryKey: ['equipment', 'category', category],
    queryFn: async () => {
      if (!category) {
        // If no category specified, return all equipment
        const { data, error } = await supabase
          .from('equipment')
          .select(`
            *,
            users!seller_id (
              id,
              username,
              full_name,
              avatar
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((equipment) => {
          const sellerUser = equipment.users;

          return {
            id: equipment.id,
            name: equipment.name,
            description: equipment.description,
            category: equipment.category,
            sellerId: equipment.seller_id,
            clubId: equipment.club_id,
            price: equipment.price,
            rentalRate: equipment.rental_rate,
            condition: equipment.condition,
            address: equipment.address,
            city: equipment.city,
            state: equipment.state,
            country: equipment.country,
            imageUrl: equipment.image_url,
            isActive: equipment.is_active,
            createdAt: equipment.created_at,
            updatedAt: equipment.updated_at,
            seller: {
              id: sellerUser?.id || '',
              username: sellerUser?.username || '',
              fullName: sellerUser?.full_name,
              avatar: sellerUser?.avatar,
            },
          };
        }) as EquipmentWithSeller[];
      }

      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          users!seller_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((equipment) => {
        const sellerUser = equipment.users;

        return {
          id: equipment.id,
          name: equipment.name,
          description: equipment.description,
          category: equipment.category,
          sellerId: equipment.seller_id,
          clubId: equipment.club_id,
          price: equipment.price,
          rentalRate: equipment.rental_rate,
          condition: equipment.condition,
          address: equipment.address,
          city: equipment.city,
          state: equipment.state,
          country: equipment.country,
          imageUrl: equipment.image_url,
          isActive: equipment.is_active,
          createdAt: equipment.created_at,
          updatedAt: equipment.updated_at,
          seller: {
            id: sellerUser?.id || '',
            username: sellerUser?.username || '',
            fullName: sellerUser?.full_name,
            avatar: sellerUser?.avatar,
          },
        };
      }) as EquipmentWithSeller[];
    },
    enabled: !!category,
  });
}
