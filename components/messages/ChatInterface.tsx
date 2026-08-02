"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video, Image as ImageIcon, Paperclip, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

type UserSummary = {
  id: string;
  name: string;
  avatar: string | null;
  role?: "GUIDE" | "TOURIST";
};

type Conversation = {
  id: string;
  otherParticipant: UserSummary;
  gig?: { id: string; title: string } | null;
  lastMessage?: { id: string; content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  updatedAt: string;
};

type DBMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  sender: UserSummary;
};

export default function ChatInterface({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations on load
  const fetchConversations = async (selectFirst = false) => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        if (selectFirst && convs.length > 0 && !activeConversationId) {
          setActiveConversationId(convs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages and conversation updates every 3 seconds
  useEffect(() => {
    let activeId = activeConversationId;
    
    const interval = setInterval(async () => {
      // 1. Poll conversations for sidebar updates & incoming messages in inactive threads
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          const newConvs: Conversation[] = data.conversations || [];
          
          setConversations(prev => {
            newConvs.forEach(c => {
              const prevConv = prev.find(p => p.id === c.id);
              if (c.lastMessage && c.lastMessage.senderId !== currentUserId) {
                const isNewMessage = !prevConv || !prevConv.lastMessage || prevConv.lastMessage.id !== c.lastMessage.id;
                
                // Only notify if it's NOT the active conversation thread
                if (isNewMessage && c.id !== activeId) {
                  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
                  audio.play().catch(() => {});
                  toast(`Pesan baru dari ${c.otherParticipant.name}: "${c.lastMessage.content.slice(0, 40)}${c.lastMessage.content.length > 40 ? '...' : ''}"`, {
                    icon: "💬",
                    duration: 4000,
                  });
                }
              }
            });
            return newConvs;
          });
        }
      } catch (err) {
        console.error("Conversations polling error:", err);
      }

      // 2. Poll messages for the active conversation thread
      if (activeId) {
        try {
          const res = await fetch(`/api/conversations/${activeId}/messages?limit=100`);
          if (res.ok) {
            const data = await res.json();
            const newMessages: DBMessage[] = data.messages || [];
            
            setMessages(prev => {
              const prevIds = new Set(prev.map(m => m.id));
              const freshMessages = newMessages.filter(m => !prevIds.has(m.id));
              
              if (freshMessages.length > 0) {
                const incoming = freshMessages.filter(m => m.senderId !== currentUserId);
                if (incoming.length > 0) {
                  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
                  audio.play().catch(() => {});
                  incoming.forEach(m => {
                    toast(`Pesan baru dari ${m.sender.name}: "${m.content.slice(0, 40)}${m.content.length > 40 ? '...' : ''}"`, {
                      icon: "💬",
                      duration: 4000,
                    });
                  });
                }
                return [...prev, ...freshMessages];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Messages polling error:", err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConversationId, currentUserId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Sending image...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "📷 Sent an image",
            type: "IMAGE",
            mediaUrl: base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, data.message]);
          fetchConversations(false);
          toast.success("Image sent!", { id: toastId });
        } else {
          toast.error("Failed to send image", { id: toastId });
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Error uploading image", { id: toastId });
      setUploadingImage(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId) return;

    const messageText = inputText;
    setInputText("");

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        // Append message
        setMessages(prev => [...prev, data.message]);
        // Refresh conversations to update the lastMessage preview
        fetchConversations(false);
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending message");
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.otherParticipant.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className={`${mobileView === "list" ? "flex" : "hidden"} md:flex w-full md:w-80 flex-shrink-0 border-r border-dark-100 flex-col bg-dark-50/30`}>
        <div className="p-4 border-b border-dark-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-dark-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-center text-sm text-dark-400">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-dark-400">
              No chats found.
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setMobileView("chat");
                }}
                className={`w-full flex items-start gap-3 p-4 transition-colors text-left ${
                  activeConversationId === conv.id ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-white border-l-4 border-transparent"
                }`}
              >
                <div className="relative flex-shrink-0">
                  {conv.otherParticipant.avatar ? (
                    <img src={conv.otherParticipant.avatar} alt={conv.otherParticipant.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {conv.otherParticipant.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-dark-900 truncate text-sm flex items-center gap-1.5">
                      {conv.otherParticipant.name}
                      {conv.otherParticipant.role === "GUIDE" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">Guide</span>
                      )}
                    </h3>
                    <span className="text-[10px] text-dark-400 flex-shrink-0">
                      {format(new Date(conv.updatedAt), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs truncate text-dark-500">
                    {conv.lastMessage ? (
                      (conv.lastMessage as any).type === "IMAGE" || (conv.lastMessage as any).mediaUrl
                        ? "📷 Photo" 
                        : conv.lastMessage.content
                    ) : "Start chatting..."}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConversation ? (
        <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col bg-white`}>
          {/* Chat Header */}
          <div className="h-16 border-b border-dark-100 flex items-center justify-between px-4 md:px-6 bg-white/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                type="button"
                onClick={() => setMobileView("list")} 
                className="md:hidden p-1.5 hover:bg-dark-50 rounded-full text-dark-600 transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                {activeConversation.otherParticipant.avatar ? (
                  <img src={activeConversation.otherParticipant.avatar} alt={activeConversation.otherParticipant.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {activeConversation.otherParticipant.name[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="font-semibold text-dark-900 text-sm flex items-center gap-1.5">
                  {activeConversation.otherParticipant.name}
                  {activeConversation.otherParticipant.role === "GUIDE" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Local Guide</span>
                  )}
                  {activeConversation.otherParticipant.role === "TOURIST" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">Tourist</span>
                  )}
                </h2>
                {activeConversation.gig && (
                  <span className="text-[10px] text-primary font-medium">
                    Gig: {activeConversation.gig.title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-dark-400">
              <button className="hover:text-primary transition-colors"><Phone className="w-4 h-4" /></button>
              <button className="hover:text-primary transition-colors"><Video className="w-4 h-4" /></button>
              <button className="hover:text-primary transition-colors"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-dark-50/20">
            {loadingMsgs ? (
              <div className="text-center text-sm text-dark-400 py-4">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-dark-400 py-12">
                No messages yet. Send a message to start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                const isImageMsg = msg.type === "IMAGE" || !!(msg as any).mediaUrl;
                const imageUrl = (msg as any).mediaUrl || msg.content;

                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                    {!isMe && (
                      <div className="w-8 flex-shrink-0">
                        {showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {activeConversation.otherParticipant.name[0]}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${isMe ? "order-1" : "order-2"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        isMe 
                          ? "bg-primary text-white rounded-br-sm" 
                          : "bg-white border border-dark-100 text-dark-900 rounded-bl-sm shadow-sm"
                      }`}>
                        {isImageMsg && imageUrl && (
                          <div className="mb-1.5 overflow-hidden rounded-xl">
                            <img 
                              src={imageUrl} 
                              alt="Shared image" 
                              className="max-h-64 w-auto object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-95 transition-opacity" 
                              onClick={() => window.open(imageUrl, "_blank")}
                            />
                          </div>
                        )}
                        {msg.content && msg.content !== "📷 Sent an image" && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] text-dark-400 ${isMe ? "justify-end" : "justify-start"}`}>
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-dark-100">
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex gap-1 pb-2 text-dark-400">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  title="Send Image"
                  className="p-2 hover:bg-dark-50 hover:text-primary rounded-full transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-dark-50/50 border border-dark-200 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={uploadingImage ? "Uploading image..." : "Type a message..."}
                  disabled={uploadingImage}
                  className="w-full max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-sm focus:outline-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!inputText.trim() || uploadingImage}
                className="w-11 h-11 flex-shrink-0 bg-primary hover:bg-primary-600 disabled:bg-dark-200 disabled:text-dark-400 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 items-center justify-center bg-dark-50/20 text-dark-400`}>
          <p>Select a contact to start messaging</p>
        </div>
      )}
    </div>
  );
}
