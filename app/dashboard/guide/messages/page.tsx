"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatInterface from "@/components/messages/ChatInterface";
import { useSession } from "next-auth/react";

export default function GuideMessagesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "";

  return (
    <DashboardLayout role="guide">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900">Inbox</h1>
        <p className="text-dark-500">Communicate with your upcoming tourists.</p>
      </div>
      
      {userId ? (
        <ChatInterface currentUserId={userId} />
      ) : (
        <div className="card p-12 text-center text-dark-500">Loading chat session...</div>
      )}
    </DashboardLayout>
  );
}
