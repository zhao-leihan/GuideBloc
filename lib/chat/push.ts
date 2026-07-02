import webpush from "web-push";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    "mailto:notifications@explomate.ly",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a subscriber
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logo-192.png",
        data: {
          url: payload.url || "/",
        },
        tag: payload.tag,
      })
    );
    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}

/**
 * Send booking confirmation push
 */
export async function sendBookingConfirmation(
  subscription: webpush.PushSubscription,
  gigTitle: string,
  date: string
) {
  return sendPushNotification(subscription, {
    title: "Booking Confirmed!",
    body: `Your booking for "${gigTitle}" on ${date} has been confirmed.`,
    tag: "booking-confirmation",
  });
}

/**
 * Send new message push
 */
export async function sendNewMessagePush(
  subscription: webpush.PushSubscription,
  senderName: string,
  preview: string
) {
  return sendPushNotification(subscription, {
    title: `New message from ${senderName}`,
    body: preview,
    tag: "new-message",
    url: "/dashboard/guide/messages",
  });
}

/**
 * Send payment received push
 */
export async function sendPaymentReceivedPush(
  subscription: webpush.PushSubscription,
  amount: string,
  token: string
) {
  return sendPushNotification(subscription, {
    title: "Payment Received",
    body: `You received ${amount} ${token} from a booking.`,
    tag: "payment-received",
  });
}

/**
 * Send booking status change push
 */
export async function sendBookingStatusPush(
  subscription: webpush.PushSubscription,
  gigTitle: string,
  newStatus: string
) {
  const statusMessages: Record<string, string> = {
    CONFIRMED: "has been confirmed",
    COMPLETED: "has been completed",
    CANCELLED: "has been cancelled",
    DISPUTED: "has a dispute",
  };

  return sendPushNotification(subscription, {
    title: "Booking Update",
    body: `Your booking for "${gigTitle}" ${statusMessages[newStatus] || `is now ${newStatus}`}.`,
    tag: "booking-status",
  });
}
