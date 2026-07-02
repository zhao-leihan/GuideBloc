import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

/**
 * Subscribe to real-time messages for a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: RealtimeMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "Message",
        filter: `conversationId=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as RealtimeMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to typing indicators for a conversation
 */
export function subscribeToTyping(
  conversationId: string,
  onTyping: (userId: string, isTyping: boolean) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      onTyping(payload.userId, payload.isTyping);
    })
    .subscribe();

  return channel;
}

/**
 * Send typing indicator
 */
export function sendTypingIndicator(
  channel: RealtimeChannel,
  userId: string,
  isTyping: boolean
) {
  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId, isTyping },
  });
}

/**
 * Subscribe to new conversations for a user (for sidebar updates)
 */
export function subscribeToConversations(
  userId: string,
  onNewConversation: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Message",
      },
      () => {
        onNewConversation();
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to booking status updates
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  onUpdate: (status: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`booking:${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "Booking",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        onUpdate((payload.new as any).status);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
