import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ViewerPresence {
  user_id: string;
  viewing_at: string;
}

export function useBillboardViews(billboardId: string | null) {
  const [viewersCount, setViewersCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!billboardId) return;

    // Create a unique channel for this billboard
    const channelName = `billboard:${billboardId}`;
    const realtimeChannel = supabase.channel(channelName);

    realtimeChannel
      .on('presence', { event: 'sync' }, () => {
        const state = realtimeChannel.presenceState();
        // Count unique users viewing
        const uniqueUsers = Object.keys(state).length;
        setViewersCount(uniqueUsers);
      })
      .on('presence', { event: 'join' }, () => {
        const state = realtimeChannel.presenceState();
        const uniqueUsers = Object.keys(state).length;
        setViewersCount(uniqueUsers);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = realtimeChannel.presenceState();
        const uniqueUsers = Object.keys(state).length;
        setViewersCount(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          const presence: ViewerPresence = {
            user_id: crypto.randomUUID(), // Anonymous tracking
            viewing_at: new Date().toISOString(),
          };
          await realtimeChannel.track(presence);
        }
      });

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [billboardId]);

  return { viewersCount, channel };
}
