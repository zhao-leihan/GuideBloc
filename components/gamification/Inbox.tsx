"use client";

import { useEffect, useState } from "react";
import { Mail as MailIcon, MailOpen, Calendar, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Mail {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function Inbox() {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);

  const fetchMails = async () => {
    try {
      const res = await fetch("/api/mail");
      if (res.ok) {
        const data = await res.json();
        setMails(data);
      }
    } catch (err) {
      console.error("Failed to fetch mails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMails();
  }, []);

  const handleReadMail = async (mail: Mail) => {
    setSelectedMail(mail);

    if (!mail.isRead) {
      try {
        const res = await fetch("/api/mail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mailId: mail.id }),
        });

        if (res.ok) {
          // Update local state
          setMails((prev) =>
            prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
          );
        }
      } catch (err) {
        console.error("Error reading mail:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-dark-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading inbox...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Mail List */}
      <div className="md:col-span-1 bg-white border border-dark-200 rounded-2xl p-4 shadow-sm h-[450px] flex flex-col">
        <div className="border-b border-dark-100 pb-3 mb-3 flex items-center justify-between">
          <h3 className="font-bold text-dark-900 flex items-center gap-2">
            <MailIcon className="w-5 h-5 text-primary" />
            System Inbox
          </h3>
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
            {mails.filter((m) => !m.isRead).length} new
          </span>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          {mails.map((mail) => (
            <button
              key={mail.id}
              onClick={() => handleReadMail(mail)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                selectedMail?.id === mail.id
                  ? "border-primary bg-primary/5"
                  : mail.isRead
                  ? "border-dark-100 bg-white hover:bg-dark-50"
                  : "border-dark-200 bg-dark-50 hover:bg-dark-100/50"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {mail.isRead ? (
                  <MailOpen className="w-4 h-4 text-dark-400" />
                ) : (
                  <Circle className="w-4 h-4 text-primary fill-primary" />
                )}
              </div>
              <div className="min-w-0 flex-grow">
                <h4 className={`text-xs truncate ${mail.isRead ? "text-dark-600" : "font-bold text-dark-900"}`}>
                  {mail.subject}
                </h4>
                <p className="text-[10px] text-dark-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(mail.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}

          {mails.length === 0 && (
            <div className="text-center text-dark-400 py-12 text-sm">
              Your inbox is empty.
            </div>
          )}
        </div>
      </div>

      {/* Mail Detail Pane */}
      <div className="md:col-span-2 bg-white border border-dark-200 rounded-2xl p-6 shadow-sm min-h-[450px] flex flex-col justify-between">
        {selectedMail ? (
          <div className="space-y-4">
            <div className="border-b border-dark-100 pb-4">
              <h3 className="text-lg font-bold text-dark-900">{selectedMail.subject}</h3>
              <p className="text-xs text-dark-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedMail.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="text-dark-700 text-sm whitespace-pre-wrap leading-relaxed">
              {selectedMail.body}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow text-dark-400 gap-2">
            <MailIcon className="w-12 h-12 text-dark-200" />
            <p className="text-sm">Select a message from your inbox to read it</p>
          </div>
        )}

        <div className="border-t border-dark-100 pt-4 text-[10px] text-dark-400 flex items-center justify-between mt-6">
          <span>Explomate Rewards & Achievements</span>
          <span>© 2026 Explomate</span>
        </div>
      </div>
    </div>
  );
}
