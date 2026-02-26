import { supabase } from "@/lib/supabase";
import { User } from "@/types/database";
import { useQuery } from "@tanstack/react-query";

export interface UserProfile extends User {
  producerProfile?: {
    id: string;
    bio?: string;
    productionRate?: number;
    genres: string[];
    equipment: string[];
    credits: string[];
  };
  artistProfile?: {
    id: string;
    bio?: string;
    performanceRate?: number;
    genres: string[];
  };
  studioCount?: number;
  collaborationCount?: number;
  clubCount?: number;
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Fetch user data with all profiles
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error("User not found");

      // Fetch producer profile if user is a producer
      let producerProfile = null;
      if (
        userData.primary_role === "producer" ||
        userData.roles?.includes("producer")
      ) {
        const { data: producerData } = await supabase
          .from("producer_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (producerData) {
          producerProfile = {
            id: producerData.id,
            bio: producerData.bio,
            productionRate: producerData.production_rate,
            genres: producerData.genres || [],
            equipment: producerData.equipment || [],
            credits: producerData.credits || [],
          };
        }
      }

      // Fetch artist profile if user is an artist
      let artistProfile = null;
      if (
        userData.primary_role === "artist" ||
        userData.roles?.includes("artist")
      ) {
        const { data: artistData } = await supabase
          .from("artist_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (artistData) {
          artistProfile = {
            id: artistData.id,
            bio: artistData.bio,
            performanceRate: artistData.performance_rate,
            genres: artistData.genres || [],
          };
        }
      }

      // Count user's resources
      const { count: studioCount } = await supabase
        .from("studios")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId);

      const { count: collaborationCount } = await supabase
        .from("collaborations")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId);

      const { count: clubCount } = await supabase
        .from("club_memberships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      return {
        id: userData.id,
        supabaseId: userData.supabase_id,
        email: userData.email,
        username: userData.username,
        fullName: userData.full_name,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location,
        primaryRole: userData.primary_role,
        roles: userData.roles || [],
        verified: userData.verified,
        // 🔥 ADDED THIS LINE TO FIX THE ERROR
        membershipTier: userData.membership_tier || "FREE",
        followersCount: userData.followers_count || 0,
        followingCount: userData.following_count || 0,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        producerProfile,
        artistProfile,
        studioCount: studioCount || 0,
        collaborationCount: collaborationCount || 0,
        clubCount: clubCount || 0,
      } as UserProfile;
    },
    enabled: !!userId,
  });
}

// 👇 THIS IS REQUIRED FOR YOUR MAP HOOK
export function useUserCollaborations(userId?: string) {
  return useQuery({
    queryKey: ["userCollaborations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("collaborations")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching collaborations:", error);
        return [];
      }

      return data.map((collab) => ({
        id: collab.id,
        title: collab.title,
        description: collab.description,
        creatorId: collab.creator_id,
        studioId: collab.studio_id, // Important for the Map
        status: collab.status,
        imageUrl: collab.image_url,
        genre: collab.genre,
        createdAt: collab.created_at,
        availableDate: collab.available_date,
      }));
    },
    enabled: !!userId,
  });
}
