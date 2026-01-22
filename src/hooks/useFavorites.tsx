import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Favorite {
  id: string;
  billboard_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("user_favorites")
        .select("billboard_id")
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      const favoriteIds = new Set((data || []).map((f) => f.billboard_id));
      setFavorites(favoriteIds);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a billboard is favorited
  const isFavorite = useCallback(
    (billboardId: string): boolean => {
      return favorites.has(billboardId);
    },
    [favorites]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (billboardId: string): Promise<boolean> => {
      if (!user) {
        console.warn("User must be logged in to favorite");
        return false;
      }

      const isCurrentlyFavorite = favorites.has(billboardId);

      // Optimistic update
      setFavorites((prev) => {
        const updated = new Set(prev);
        if (isCurrentlyFavorite) {
          updated.delete(billboardId);
        } else {
          updated.add(billboardId);
        }
        return updated;
      });

      try {
        if (isCurrentlyFavorite) {
          // Remove favorite
          const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("billboard_id", billboardId);

          if (error) throw error;
        } else {
          // Add favorite
          const { error } = await supabase
            .from("user_favorites")
            .insert({
              user_id: user.id,
              billboard_id: billboardId,
            });

          if (error) throw error;
        }

        return !isCurrentlyFavorite;
      } catch (err: any) {
        console.error("Error toggling favorite:", err);
        // Revert optimistic update on error
        setFavorites((prev) => {
          const reverted = new Set(prev);
          if (isCurrentlyFavorite) {
            reverted.add(billboardId);
          } else {
            reverted.delete(billboardId);
          }
          return reverted;
        });
        return isCurrentlyFavorite;
      }
    },
    [user, favorites]
  );

  // Get count of favorites
  const favoritesCount = favorites.size;

  // Get array of favorite IDs
  const favoriteIds = Array.from(favorites);

  return {
    favorites: favoriteIds,
    favoritesCount,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}
