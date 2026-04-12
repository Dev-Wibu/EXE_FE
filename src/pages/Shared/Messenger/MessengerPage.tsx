import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/mocks/chat.mock";
import { chatManager, type ChatHistoryMessage } from "@/services/chat.manager";
import { socketService, type ChatMessageDto } from "@/services/socket.service";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft, MessageSquare, Plus, Search, Send, User as UserIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

interface Contact {
  id: number;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "MENTOR";
  lastMessage?: string;
  time?: string;
  unreadCount?: number;
}

interface MessengerLocationState {
  openMentorId?: number;
  mentorData?: SchemaMentorResponse;
}

const createContactFromMentor = (mentorData?: SchemaMentorResponse): Contact | null => {
  if (mentorData?.id === undefined || !mentorData.name) {
    return null;
  }

  return {
    id: mentorData.id,
    name: mentorData.name,
    avatarUrl: mentorData.avatarUrl ?? null,
    role: "MENTOR",
  };
};

export function MessengerPage() {
  const location = useLocation();
  const locationState = location.state as MessengerLocationState | null;
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(() =>
    createContactFromMentor(locationState?.mentorData)
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  // Search states
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);

  // Mentor discovery states
  const [showMentorList, setShowMentorList] = useState(false);
  const [mentors, setMentors] = useState<SchemaMentorResponse[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const currentUserId = user?.id;
  const currentRole = user?.role?.toUpperCase();

  const selectedContactRef = useRef<Contact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync ref with state
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUserId || !currentRole) return;

      setLoadingContacts(true);
      const res = await chatManager.getContacts(currentUserId, currentRole);

      if (res.success && res.data) {
        const contactIds = res.data;
        const contactDetails: Contact[] = [];

        for (const id of contactIds) {
          let detailRes;
          if (currentRole === "USER") {
            detailRes = await chatManager.getMentorDetail(id);
          } else {
            detailRes = await chatManager.getUserDetail(id);
          }

          if (detailRes.success && detailRes.data) {
            if (detailRes.data.id !== undefined && detailRes.data.name) {
              contactDetails.push({
                id: detailRes.data.id,
                name: detailRes.data.name,
                avatarUrl: detailRes.data.avatarUrl ?? null,
                role: currentRole === "USER" ? "MENTOR" : "USER",
              });
            }
          }
        }
        setContacts(contactDetails);
      } else {
        toast.error("Không thể tải danh sách liên hệ");
      }
      setLoadingContacts(false);
    };

    fetchContacts();
  }, [currentUserId, currentRole]);

  // Load mentors
  useEffect(() => {
    const fetchMentors = async () => {
      if (!showMentorList || mentors.length > 0) return;

      setLoadingMentors(true);
      const res = await chatManager.getAllMentors();
      if (res.success && res.data) {
        setMentors(res.data);
      }
      setLoadingMentors(false);
    };

    fetchMentors();
  }, [showMentorList, mentors.length]);

  // Load messages when contact is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact || !currentUserId || !currentRole) return;

      setLoadingMessages(true);
      const currentFullId = `${currentRole}_${currentUserId}`;
      const recipientFullId = `${selectedContact.role}_${selectedContact.id}`;

      const res = await chatManager.getChatHistoryByParticipants(currentFullId, recipientFullId);

      console.log("DEBUG: currentFullId =", currentFullId);
      console.log("DEBUG: recipientFullId =", recipientFullId);

      if (res.success && res.data) {
        // Map raw messages to UI format, deciding 'user' (me) or 'ai' (other)
        const mappedMessages: ChatMessage[] = res.data.map((msg: ChatHistoryMessage) => {
          // 1. Try to detect if it's "me" using raw fields
          const sId = msg.senderId ?? msg.sender_id;
          const sType = msg.senderType ?? msg.sender_type;

          let isMe = false;
          if (sId !== undefined && sType !== undefined) {
            const combinedSenderId = `${sType}_${sId}`;
            isMe = combinedSenderId.toUpperCase() === currentFullId.toUpperCase();
          } else if (msg.sender) {
            // 2. Fallback to existing 'sender' field if server already mapped it
            isMe = msg.sender === "user" || msg.sender === "me";
          }

          return {
            id: typeof msg.id === "number" ? msg.id : Date.now() + Math.floor(Math.random() * 1000),
            content: msg.content ?? "",
            sender: isMe ? "user" : "ai",
            time: msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : msg.time ||
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        });
        setMessages(mappedMessages);
      } else {
        toast.error("Không thể tải lịch sử tin nhắn");
      }
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [selectedContact, currentUserId, currentRole]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!currentUserId || !currentRole) return;

    const currentFullId = `${currentRole}_${currentUserId}`;
    socketService.connect(currentFullId, (receivedMsg: ChatMessageDto) => {
      console.log("DEBUG: Received Socket Message:", receivedMsg);

      // Handle both formats: combined "USER_1" or separate fields
      const msgSenderId = receivedMsg.senderId;
      const msgSenderType = receivedMsg.senderType;
      const msgRecipientId = receivedMsg.recipientId;
      const msgRecipientType = receivedMsg.recipientType;

      const msgSenderFullId = msgSenderType
        ? `${msgSenderType}_${msgSenderId}`
        : String(msgSenderId);
      const msgRecipientFullId = msgRecipientType
        ? `${msgRecipientType}_${msgRecipientId}`
        : String(msgRecipientId);

      console.log(
        `DEBUG: WebSocket Comparison: Recipient ${msgRecipientFullId} vs Me ${currentFullId}`
      );

      // If we are the recipient
      if (
        msgRecipientFullId.toUpperCase() === currentFullId.toUpperCase() ||
        String(msgRecipientId) === String(currentUserId)
      ) {
        const activeContact = selectedContactRef.current;
        const activeContactFullId = activeContact
          ? `${activeContact.role}_${activeContact.id}`
          : "";

        console.log(`DEBUG: Is from Active Contact? ${msgSenderFullId} vs ${activeContactFullId}`);

        // If the message is from the currently selected contact, add it to messages
        if (
          activeContact &&
          (msgSenderFullId.toUpperCase() === activeContactFullId.toUpperCase() ||
            String(msgSenderId) === String(activeContact.id))
        ) {
          const newMessage: ChatMessage = {
            id: Number(receivedMsg.id) || Date.now(),
            sender: "ai",
            content: receivedMsg.content,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, newMessage]);
        } else {
          toast.info(`Bạn có tin nhắn mới`);
        }
      }
    });

    return () => {
      socketService.disconnect();
    };
    // Only reconnect if user identity changes, not when selecting a contact
  }, [currentUserId, currentRole]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const recipientFullId = `${selectedContact.role.toUpperCase()}_${selectedContact.id}`;

    console.log("DEBUG: Sending message to:", recipientFullId);

    // Send via socket with combined ROLE_ID
    socketService.sendMessage(recipientFullId, messageInput);

    // Add locally immediately for better UX
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      content: messageInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  // Filtered lists
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  const filteredMentors = mentors.filter((m) =>
    (m.name || "").toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Contact List */}
      <div
        className={cn(
          "flex h-full w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96 dark:border-slate-800 dark:bg-slate-900",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {showMentorList ? "Tìm Mentor" : "Tin nhắn"}
            </h2>
            {!showMentorList ? (
              currentRole === "USER" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400"
                  onClick={() => setShowMentorList(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              )
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                onClick={() => setShowMentorList(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={showMentorList ? "Tìm Mentor theo tên..." : "Tìm kiếm người nhắn..."}
              className="bg-slate-50 pl-10 dark:bg-slate-800"
              value={contactSearchQuery}
              onChange={(e) => setContactSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {showMentorList ? (
              loadingMentors ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : filteredMentors.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <UserIcon className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs">Không tìm thấy Mentor nào</p>
                </div>
              ) : (
                filteredMentors.map((mentor, index) => (
                  <button
                    key={mentor.id ?? mentor.email ?? `${mentor.name ?? "mentor"}-${index}`}
                    onClick={() => {
                      if (mentor.id === undefined || !mentor.name) {
                        toast.error("Không đủ thông tin để bắt đầu hội thoại");
                        return;
                      }

                      const newContact: Contact = {
                        id: mentor.id,
                        name: mentor.name,
                        avatarUrl: mentor.avatarUrl ?? null,
                        role: "MENTOR",
                      };

                      setSelectedContact(newContact);
                      setShowMentorList(false);
                      setContactSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-700">
                      <AvatarImage src={mentor.avatarUrl || ""} alt={mentor.name || "Mentor"} />
                      <AvatarFallback>{mentor.name?.charAt(0) ?? "M"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <span className="block truncate font-semibold text-slate-900 dark:text-white">
                        {mentor.name || "Mentor"}
                      </span>
                      <p className="truncate text-[11px] text-slate-500">
                        {mentor.expertise || "Mentor chuyên nghiệp"}
                      </p>
                    </div>
                  </button>
                ))
              )
            ) : loadingContacts ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="mb-2 h-12 w-12 opacity-20" />
                <p className="text-sm">Chưa có cuộc hội thoại nào</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Search className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-xs">Không tìm thấy người nhắn</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    selectedContact?.id === contact.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}>
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-slate-100 dark:border-slate-700">
                      <AvatarImage src={contact.avatarUrl || ""} alt={contact.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-900"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">{contact.name}</span>
                      {contact.time && (
                        <span className="text-[10px] text-slate-400">{contact.time}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {contact.role}
                      </p>
                      {contact.unreadCount && (
                        <Badge className="h-5 w-5 justify-center rounded-full bg-blue-600 p-0 text-[10px] text-white">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex flex-1 flex-col bg-slate-50/50 dark:bg-slate-950/20">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-700">
                  <AvatarImage src={selectedContact.avatarUrl || ""} alt={selectedContact.name} />
                  <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {selectedContact.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Đang trực tuyến
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMessageSearchOpen && (
                  <div className="animate-in fade-in slide-in-from-right-2 relative duration-200">
                    <Input
                      placeholder="Tìm tin nhắn..."
                      className="h-8 w-40 border-none bg-slate-50 text-xs focus-visible:ring-1 md:w-64"
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {messageSearchQuery && (
                      <button
                        onClick={() => setMessageSearchQuery("")}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-slate-500",
                    isMessageSearchOpen && "bg-blue-50 text-blue-600"
                  )}
                  onClick={() => {
                    setIsMessageSearchOpen(!isMessageSearchOpen);
                    if (isMessageSearchOpen) setMessageSearchQuery("");
                  }}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-12 w-48 rounded-2xl" />
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <Skeleton className="h-12 w-64 rounded-2xl" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <p>Hãy gửi lời chào đầu tiên!</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Search className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">Không tìm thấy tin nhắn nào khớp</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-max max-w-[80%] flex-col gap-1",
                        msg.sender === "user" ? "ml-auto items-end" : "items-start"
                      )}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 text-sm shadow-sm",
                          msg.sender === "user"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-100 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        )}>
                        {msg.content}
                      </div>
                      <span className="px-1 text-[10px] text-slate-400">{msg.time}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Footer - Message Input */}
            <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Nhập nội dung tin nhắn..."
                  className="bg-slate-50 dark:bg-slate-800"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="shrink-0 bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <MessageSquare className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Chào mừng đến với Messenger
            </h3>
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Chọn một liên hệ từ danh sách bên trái để bắt đầu cuộc trò chuyện.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
