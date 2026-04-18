import {
  ChatComposer,
  MessageBubble,
  SocketStatusBadge,
  type MessageDeliveryStatus,
} from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import {
  formatDayMonth,
  formatTime,
  parseBackendDate,
  toTimestamp,
  toVietnamDateKey,
} from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { chatManager, type ChatHistoryMessage } from "@/services/chat.manager";
import {
  socketService,
  type ChatMessageDto,
  type SocketConnectionState,
} from "@/services/socket.service";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
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

interface MessengerMessage {
  id: string;
  sender: "ai" | "user";
  content: string;
  timestamp: string;
  status?: MessageDeliveryStatus;
  retries?: number;
}

interface ConversationMeta {
  lastMessage: string;
  lastTimestamp: string;
}

interface TimelineDayItem {
  type: "day";
  key: string;
  label: string;
}

interface TimelineMessageItem {
  type: "message";
  key: string;
  message: MessengerMessage;
  isGroupedWithPrevious: boolean;
  isGroupedWithNext: boolean;
}

type TimelineItem = TimelineDayItem | TimelineMessageItem;

const MESSAGE_RENDER_STEP = 80;
const MAX_RETRY_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 1200;
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

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

const getRoleLabel = (role: Contact["role"]): string => {
  return role === "MENTOR" ? "Mentor" : "Học viên";
};

const createMessageId = (prefix: "temp" | "server" = "temp", rawId?: string | number): string => {
  if (prefix === "server" && rawId !== undefined) {
    return `server-${rawId}`;
  }

  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getDraftStorageKey = (
  userRole: string,
  userId: number | string,
  contactRole: Contact["role"],
  contactId: number
) => {
  return `messenger-draft:${userRole}:${userId}:${contactRole}:${contactId}`;
};

const getConversationKey = (contact: Contact) => `${contact.role}_${contact.id}`;

const getPinnedStorageKey = (
  userRole: string,
  userId: number | string,
  contactRole: Contact["role"],
  contactId: number
) => {
  return `messenger-pinned:${userRole}:${userId}:${contactRole}:${contactId}`;
};

const getTimestampValue = (timestamp: string): number => {
  return toTimestamp(timestamp) ?? 0;
};

const getDayKey = (timestamp: string): string => {
  return toVietnamDateKey(timestamp) || "unknown";
};

const formatDayLabel = (timestamp: string): string => {
  const parsed = parseBackendDate(timestamp);
  if (!parsed) {
    return "Hôm nay";
  }

  return parsed.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatConversationTime = (timestamp: string): string => {
  const parsed = parseBackendDate(timestamp);
  if (!parsed) {
    return "";
  }

  const sameDay = toVietnamDateKey(parsed) === toVietnamDateKey(new Date());

  if (sameDay) {
    return formatTime(parsed, "");
  }

  return formatDayMonth(parsed, "");
};

const buildTimelineItems = (messages: MessengerMessage[]): TimelineItem[] => {
  if (messages.length === 0) {
    return [];
  }

  const sortedMessages = [...messages].sort(
    (a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp)
  );

  const timeline: TimelineItem[] = [];

  for (let index = 0; index < sortedMessages.length; index += 1) {
    const message = sortedMessages[index];
    const previous = sortedMessages[index - 1];
    const next = sortedMessages[index + 1];

    const previousDayKey = previous ? getDayKey(previous.timestamp) : "";
    const currentDayKey = getDayKey(message.timestamp);

    if (!previous || previousDayKey !== currentDayKey) {
      timeline.push({
        type: "day",
        key: `day-${currentDayKey}-${index}`,
        label: formatDayLabel(message.timestamp),
      });
    }

    const isGroupedWithPrevious =
      !!previous &&
      previous.sender === message.sender &&
      previousDayKey === currentDayKey &&
      Math.abs(getTimestampValue(message.timestamp) - getTimestampValue(previous.timestamp)) <=
        GROUPING_WINDOW_MS;

    const nextDayKey = next ? getDayKey(next.timestamp) : "";
    const isGroupedWithNext =
      !!next &&
      next.sender === message.sender &&
      nextDayKey === currentDayKey &&
      Math.abs(getTimestampValue(next.timestamp) - getTimestampValue(message.timestamp)) <=
        GROUPING_WINDOW_MS;

    timeline.push({
      type: "message",
      key: message.id,
      message,
      isGroupedWithPrevious,
      isGroupedWithNext,
    });
  }

  return timeline;
};

export function MessengerPage() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const locationState = location.state as MessengerLocationState | null;
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const currentRole = user?.role?.toUpperCase();
  const initialSelectedContact = createContactFromMentor(locationState?.mentorData);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialSelectedContact);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState(() => {
    if (!initialSelectedContact || !currentRole || !currentUserId) {
      return "";
    }

    try {
      return (
        localStorage.getItem(
          getDraftStorageKey(
            currentRole,
            currentUserId,
            initialSelectedContact.role,
            initialSelectedContact.id
          )
        ) || ""
      );
    } catch {
      return "";
    }
  });
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Record<string, string>>(() => {
    if (!initialSelectedContact || !currentRole || !currentUserId) {
      return {};
    }

    try {
      const storedPinnedId = localStorage.getItem(
        getPinnedStorageKey(
          currentRole,
          currentUserId,
          initialSelectedContact.role,
          initialSelectedContact.id
        )
      );

      if (!storedPinnedId) {
        return {};
      }

      return {
        [getConversationKey(initialSelectedContact)]: storedPinnedId,
      };
    } catch {
      return {};
    }
  });
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(() =>
    socketService.getConnectionState()
  );
  const [conversationMetaMap, setConversationMetaMap] = useState<Record<string, ConversationMeta>>(
    {}
  );
  const [visibleMessageLimit, setVisibleMessageLimit] = useState(MESSAGE_RENDER_STEP);
  const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
  const [isPinnedMessageCollapsed, setIsPinnedMessageCollapsed] = useState(false);

  // Search states
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);

  const deferredContactSearchQuery = useDeferredValue(contactSearchQuery);
  const deferredMessageSearchQuery = useDeferredValue(messageSearchQuery);

  // Mentor discovery states
  const [showMentorList, setShowMentorList] = useState(false);
  const [mentors, setMentors] = useState<SchemaMentorResponse[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const selectedContactRef = useRef<Contact | null>(null);
  const messagesRef = useRef<MessengerMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const retryTimeoutRef = useRef<Record<string, number>>({});
  const retryAttemptRef = useRef<Record<string, number>>({});
  const destroyedRef = useRef(false);

  useEffect(() => {
    return () => {
      destroyedRef.current = true;
      Object.values(retryTimeoutRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      retryTimeoutRef.current = {};
      retryAttemptRef.current = {};
    };
  }, []);

  // Sync ref with state
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearRetryTimer = (messageId: string) => {
    const timeoutId = retryTimeoutRef.current[messageId];
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      delete retryTimeoutRef.current[messageId];
    }
  };

  const updateConversationMeta = (contact: Contact, content: string, timestamp: string) => {
    const conversationKey = getConversationKey(contact);

    setConversationMetaMap((previous) => {
      const existing = previous[conversationKey];
      if (existing && getTimestampValue(existing.lastTimestamp) > getTimestampValue(timestamp)) {
        return previous;
      }

      return {
        ...previous,
        [conversationKey]: {
          lastMessage: content,
          lastTimestamp: timestamp,
        },
      };
    });
  };

  const mapHistoryMessageToUi = (
    msg: ChatHistoryMessage,
    currentFullId: string
  ): MessengerMessage => {
    const senderId = msg.senderId ?? msg.sender_id;
    const senderType = msg.senderType ?? msg.sender_type;

    let isMe = false;
    if (senderId !== undefined && senderType !== undefined) {
      const combinedSenderId = `${senderType}_${senderId}`;
      isMe = combinedSenderId.toUpperCase() === currentFullId.toUpperCase();
    } else if (msg.sender) {
      isMe = msg.sender === "user" || msg.sender === "me";
    }

    return {
      id: typeof msg.id === "number" ? createMessageId("server", msg.id) : createMessageId("temp"),
      content: msg.content ?? "",
      sender: isMe ? "user" : "ai",
      timestamp: msg.timestamp || new Date().toISOString(),
      status: isMe ? "sent" : undefined,
      retries: 0,
    };
  };

  const scheduleRetry = (
    messageId: string,
    content: string,
    recipientFullId: string,
    attempt: number
  ) => {
    if (destroyedRef.current) {
      return;
    }

    if (attempt >= MAX_RETRY_ATTEMPTS) {
      clearRetryTimer(messageId);
      delete retryAttemptRef.current[messageId];
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId ? { ...message, status: "failed", retries: attempt } : message
        )
      );
      toast.error("Tin nhắn chưa gửi được sau nhiều lần thử. Vui lòng gửi lại thủ công");
      return;
    }

    const nextAttempt = attempt + 1;
    retryAttemptRef.current[messageId] = nextAttempt;

    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? { ...message, status: attempt === 0 ? "queued" : "retrying", retries: nextAttempt }
          : message
      )
    );

    clearRetryTimer(messageId);

    const retryDelay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, 12000);
    retryTimeoutRef.current[messageId] = window.setTimeout(() => {
      if (destroyedRef.current) {
        return;
      }

      const isSent = socketService.sendMessage(recipientFullId, content);
      if (isSent) {
        clearRetryTimer(messageId);
        delete retryAttemptRef.current[messageId];
        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId
              ? { ...message, status: "sent", retries: nextAttempt }
              : message
          )
        );
        return;
      }

      scheduleRetry(messageId, content, recipientFullId, nextAttempt);
    }, retryDelay);
  };

  // Load contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUserId || !currentRole) {
        return;
      }

      setLoadingContacts(true);

      try {
        const res = await chatManager.getContacts(currentUserId, currentRole);
        if (!res.success || !res.data) {
          toast.error("Không thể tải danh sách liên hệ");
          return;
        }

        const contactIds = res.data;
        if (contactIds.length === 0) {
          setContacts([]);
          return;
        }

        const detailResults = await Promise.all(
          contactIds.map(async (id) => {
            const detailRes =
              currentRole === "USER"
                ? await chatManager.getMentorDetail(id)
                : await chatManager.getUserDetail(id);

            if (
              !detailRes.success ||
              !detailRes.data ||
              detailRes.data.id === undefined ||
              !detailRes.data.name
            ) {
              return null;
            }

            return {
              id: detailRes.data.id,
              name: detailRes.data.name,
              avatarUrl: detailRes.data.avatarUrl ?? null,
              role: currentRole === "USER" ? "MENTOR" : "USER",
            } satisfies Contact;
          })
        );

        const contactDetails = detailResults.filter((contact): contact is Contact => !!contact);
        setContacts(contactDetails);

        const previewTargets = contactDetails.slice(0, 6);
        if (previewTargets.length === 0) {
          return;
        }

        const currentFullId = `${currentRole}_${currentUserId}`;
        const previewResults = await Promise.allSettled(
          previewTargets.map(async (contact) => {
            const recipientFullId = `${contact.role}_${contact.id}`;
            const historyRes = await chatManager.getChatHistoryByParticipants(
              currentFullId,
              recipientFullId
            );

            if (!historyRes.success || !historyRes.data || historyRes.data.length === 0) {
              return null;
            }

            const lastMessage = historyRes.data[historyRes.data.length - 1];
            return {
              key: getConversationKey(contact),
              value: {
                lastMessage: lastMessage.content ?? "",
                lastTimestamp: lastMessage.timestamp || new Date().toISOString(),
              } satisfies ConversationMeta,
            };
          })
        );

        if (destroyedRef.current) {
          return;
        }

        const previewMeta = previewResults.reduce<Record<string, ConversationMeta>>(
          (acc, result) => {
            if (result.status !== "fulfilled" || !result.value) {
              return acc;
            }

            acc[result.value.key] = result.value.value;
            return acc;
          },
          {}
        );

        if (Object.keys(previewMeta).length > 0) {
          setConversationMetaMap((previous) => ({ ...previous, ...previewMeta }));
        }
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [currentUserId, currentRole]);

  // Load mentors when discovery mode is active
  useEffect(() => {
    const fetchMentors = async () => {
      if (!showMentorList || mentors.length > 0) {
        return;
      }

      setLoadingMentors(true);
      const res = await chatManager.getAllMentors();
      if (res.success && res.data) {
        setMentors(res.data);
      }
      setLoadingMentors(false);
    };

    fetchMentors();
  }, [showMentorList, mentors.length]);

  useEffect(() => {
    if (!selectedContact || !currentRole || !currentUserId) {
      return;
    }

    const draftKey = getDraftStorageKey(
      currentRole,
      currentUserId,
      selectedContact.role,
      selectedContact.id
    );

    try {
      if (messageInput.trim().length === 0) {
        localStorage.removeItem(draftKey);
        setDraftLastSavedAt(null);
      } else {
        localStorage.setItem(draftKey, messageInput);
        setDraftLastSavedAt(formatTime(new Date(), ""));
      }
    } catch {
      // Ignore draft persistence errors to keep chat usable.
    }
  }, [messageInput, selectedContact, currentRole, currentUserId]);

  useEffect(() => {
    if (!selectedContact || !currentRole || !currentUserId) {
      return;
    }

    const conversationKey = getConversationKey(selectedContact);
    const pinnedMessageId = pinnedMessageIds[conversationKey];
    const pinnedStorageKey = getPinnedStorageKey(
      currentRole,
      currentUserId,
      selectedContact.role,
      selectedContact.id
    );

    try {
      if (!pinnedMessageId) {
        localStorage.removeItem(pinnedStorageKey);
      } else {
        localStorage.setItem(pinnedStorageKey, pinnedMessageId);
      }
    } catch {
      // Ignore pin persistence errors to keep chat usable.
    }
  }, [pinnedMessageIds, selectedContact, currentRole, currentUserId]);

  // Load messages when contact is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact || !currentUserId || !currentRole) {
        return;
      }

      Object.values(retryTimeoutRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      retryTimeoutRef.current = {};
      retryAttemptRef.current = {};
      setVisibleMessageLimit(MESSAGE_RENDER_STEP);
      setLoadingMessages(true);
      const currentFullId = `${currentRole}_${currentUserId}`;
      const recipientFullId = `${selectedContact.role}_${selectedContact.id}`;

      try {
        const res = await chatManager.getChatHistoryByParticipants(currentFullId, recipientFullId);

        if (!res.success || !res.data) {
          toast.error("Không thể tải lịch sử tin nhắn");
          return;
        }

        const mappedMessages: MessengerMessage[] = res.data.map((msg: ChatHistoryMessage) =>
          mapHistoryMessageToUi(msg, currentFullId)
        );

        setMessages(mappedMessages);

        const latestMessage = mappedMessages[mappedMessages.length - 1];
        if (latestMessage) {
          updateConversationMeta(selectedContact, latestMessage.content, latestMessage.timestamp);
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedContact, currentRole, currentUserId]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!currentUserId || !currentRole) {
      return;
    }

    const currentFullId = `${currentRole}_${currentUserId}`;

    socketService.connect(
      currentFullId,
      (receivedMsg: ChatMessageDto) => {
        const senderFullId = receivedMsg.senderType
          ? `${receivedMsg.senderType}_${receivedMsg.senderId}`
          : String(receivedMsg.senderId);
        const senderNumericId = Number.parseInt(
          String(receivedMsg.senderId).split("_").pop() || "",
          10
        );

        const recipientFullId = receivedMsg.recipientType
          ? `${receivedMsg.recipientType}_${receivedMsg.recipientId}`
          : String(receivedMsg.recipientId);

        if (
          recipientFullId.toUpperCase() === currentFullId.toUpperCase() ||
          String(receivedMsg.recipientId) === String(currentUserId)
        ) {
          const activeContact = selectedContactRef.current;
          const activeContactFullId = activeContact
            ? `${activeContact.role}_${activeContact.id}`
            : "";

          if (
            activeContact &&
            (senderFullId.toUpperCase() === activeContactFullId.toUpperCase() ||
              String(receivedMsg.senderId) === String(activeContact.id))
          ) {
            const incomingId = createMessageId(
              receivedMsg.id !== undefined ? "server" : "temp",
              receivedMsg.id
            );

            const newMessage: MessengerMessage = {
              id: incomingId,
              sender: "ai",
              content: receivedMsg.content,
              timestamp: receivedMsg.timestamp || new Date().toISOString(),
            };

            setMessages((prev) => {
              if (prev.some((message) => message.id === incomingId)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            updateConversationMeta(
              activeContact,
              receivedMsg.content,
              receivedMsg.timestamp || new Date().toISOString()
            );
          } else {
            if (!Number.isNaN(senderNumericId)) {
              const senderContact = contacts.find((contact) => contact.id === senderNumericId);
              if (senderContact) {
                updateConversationMeta(
                  senderContact,
                  receivedMsg.content,
                  receivedMsg.timestamp || new Date().toISOString()
                );
              }
            }
            toast.info("Bạn có tin nhắn mới");
          }
        }
      },
      setConnectionState
    );

    return () => {
      socketService.disconnect();
    };
  }, [contacts, currentRole, currentUserId]);

  useEffect(() => {
    if (connectionState !== "connected" || !selectedContact) {
      return;
    }

    const recipientFullId = `${selectedContact.role.toUpperCase()}_${selectedContact.id}`;
    const queuedMessages = messagesRef.current.filter(
      (message) =>
        message.sender === "user" && (message.status === "queued" || message.status === "retrying")
    );

    queuedMessages.forEach((message) => {
      const attempt = retryAttemptRef.current[message.id] ?? message.retries ?? 0;
      attemptSendMessage(message.id, message.content, recipientFullId, attempt);
    });
    // Avoid forcing retry effect to rerun when send handler identity changes between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, selectedContact]);

  const closeConversation = () => {
    setSelectedContact(null);
    setMessageInput("");
    setDraftLastSavedAt(null);
    setMessageSearchQuery("");
    setVisibleMessageLimit(MESSAGE_RENDER_STEP);
    setIsMessageSearchOpen(false);
    setIsPinnedMessageCollapsed(false);
  };

  const openConversation = (contact: Contact) => {
    const conversationKey = getConversationKey(contact);
    const storedPinnedId = getStoredPinnedMessageId(contact);

    setSelectedContact(contact);
    setMessageInput(getStoredDraft(contact));
    setDraftLastSavedAt(null);
    setPinnedMessageIds((prev) => {
      const next = { ...prev };

      if (!storedPinnedId) {
        delete next[conversationKey];
      } else {
        next[conversationKey] = storedPinnedId;
      }

      return next;
    });
    setVisibleMessageLimit(MESSAGE_RENDER_STEP);
    setMessageSearchQuery("");
    setIsMessageSearchOpen(false);
    setIsPinnedMessageCollapsed(false);
  };

  const attemptSendMessage = (
    messageId: string,
    content: string,
    recipientFullId: string,
    attempt: number
  ) => {
    const isSent = socketService.sendMessage(recipientFullId, content);
    if (isSent) {
      clearRetryTimer(messageId);
      delete retryAttemptRef.current[messageId];
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId ? { ...message, status: "sent", retries: attempt } : message
        )
      );
      return true;
    }

    scheduleRetry(messageId, content, recipientFullId, attempt);
    return false;
  };

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();

    if (!trimmed || !selectedContact) {
      return;
    }

    const recipientFullId = `${selectedContact.role.toUpperCase()}_${selectedContact.id}`;
    const newMessageId = createMessageId("temp");
    const messageTimestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      {
        id: newMessageId,
        sender: "user",
        content: trimmed,
        timestamp: messageTimestamp,
        status: "sending",
        retries: 0,
      },
    ]);

    updateConversationMeta(selectedContact, trimmed, messageTimestamp);
    setMessageInput("");

    const immediateSuccess = attemptSendMessage(newMessageId, trimmed, recipientFullId, 0);
    if (!immediateSuccess) {
      toast.info("Tin nhắn sẽ tự động gửi lại khi kết nối ổn định");
    }
  };

  const handleRetryMessage = (messageId: string) => {
    if (!selectedContact) {
      return;
    }

    const messageToRetry = messages.find((message) => message.id === messageId);
    if (!messageToRetry) {
      return;
    }

    const recipientFullId = `${selectedContact.role.toUpperCase()}_${selectedContact.id}`;
    const currentRetry = retryAttemptRef.current[messageId] ?? messageToRetry.retries ?? 0;

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, status: "retrying", retries: currentRetry }
          : message
      )
    );

    const isSent = attemptSendMessage(
      messageId,
      messageToRetry.content,
      recipientFullId,
      currentRetry
    );
    if (isSent) {
      toast.success("Đã gửi lại tin nhắn");
    } else {
      toast.info("Tin nhắn sẽ tiếp tục tự động gửi lại trong nền");
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Đã sao chép nội dung tin nhắn");
    } catch {
      toast.error("Không thể sao chép nội dung. Vui lòng thử lại");
    }
  };

  const handleForwardMessage = (content: string) => {
    const quotedContent = content
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");

    setMessageInput((current) => {
      if (!current.trim()) {
        return `${quotedContent}\n`;
      }

      return `${current}\n\n${quotedContent}\n`;
    });

    const composer = document.querySelector<HTMLTextAreaElement>(
      "textarea[data-messenger-composer='true']"
    );
    composer?.focus();
    toast.success("Đã chuyển nội dung vào ô soạn");
  };

  const handleApplyQuickCommand = (command: string) => {
    toast.success(`Đã áp dụng lệnh nhanh ${command}`);
  };

  const handleTogglePinMessage = (messageId: string) => {
    if (!selectedContact) {
      return;
    }

    const conversationKey = getConversationKey(selectedContact);
    const isPinned = pinnedMessageIds[conversationKey] === messageId;

    setPinnedMessageIds((prev) => {
      const next = { ...prev };

      if (isPinned) {
        delete next[conversationKey];
      } else {
        next[conversationKey] = messageId;
      }

      return next;
    });

    if (isPinned) {
      toast.info("Đã bỏ ghim tin nhắn");
    } else {
      toast.success("Đã ghim tin nhắn quan trọng");
    }
  };

  const handleConversationTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (!isMobile || !selectedContact) {
      return;
    }

    const touch = event.changedTouches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleConversationTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    if (!isMobile || !selectedContact || !touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (deltaX > 90 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      closeConversation();
      toast.info("Đã quay lại danh sách hội thoại");
    }
  };

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      const canSwitchConversation = (event.ctrlKey || event.metaKey) && event.shiftKey;
      if (canSwitchConversation && event.key === "ArrowDown" && filteredContacts.length > 0) {
        event.preventDefault();

        const currentIndex = selectedContact
          ? filteredContacts.findIndex((contact) => contact.id === selectedContact.id)
          : -1;

        const nextIndex =
          currentIndex === -1 ? 0 : Math.min(filteredContacts.length - 1, currentIndex + 1);
        openConversation(filteredContacts[nextIndex]);
        return;
      }

      if (canSwitchConversation && event.key === "ArrowUp" && filteredContacts.length > 0) {
        event.preventDefault();

        const currentIndex = selectedContact
          ? filteredContacts.findIndex((contact) => contact.id === selectedContact.id)
          : filteredContacts.length;

        const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        openConversation(filteredContacts[nextIndex]);
        return;
      }

      if (!selectedContact) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsMessageSearchOpen(true);
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        const composer = document.querySelector<HTMLTextAreaElement>(
          "textarea[data-messenger-composer='true']"
        );
        composer?.focus();
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        const conversationKey = getConversationKey(selectedContact);
        const pinnedMessageId = pinnedMessageIds[conversationKey];

        if (pinnedMessageId) {
          setPinnedMessageIds((prev) => {
            const next = { ...prev };
            delete next[conversationKey];
            return next;
          });
          toast.info("Đã bỏ ghim tin nhắn");
        }
      }

      if (event.key === "Escape" && isMessageSearchOpen) {
        setMessageSearchQuery("");
        setIsMessageSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
    // Keep shortcut dependencies stable and avoid listener re-registration loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contacts,
    conversationMetaMap,
    deferredContactSearchQuery,
    selectedContact,
    isMessageSearchOpen,
    pinnedMessageIds,
  ]);

  const getStoredDraft = (contact: Contact): string => {
    if (!currentRole || !currentUserId) {
      return "";
    }

    try {
      return (
        localStorage.getItem(
          getDraftStorageKey(currentRole, currentUserId, contact.role, contact.id)
        ) || ""
      );
    } catch {
      return "";
    }
  };

  const getStoredPinnedMessageId = (contact: Contact): string | null => {
    if (!currentRole || !currentUserId) {
      return null;
    }

    try {
      return localStorage.getItem(
        getPinnedStorageKey(currentRole, currentUserId, contact.role, contact.id)
      );
    } catch {
      return null;
    }
  };

  const filteredContacts = useMemo(() => {
    const normalizedQuery = deferredContactSearchQuery.trim().toLowerCase();

    const candidates = contacts.filter((contact) =>
      contact.name.toLowerCase().includes(normalizedQuery)
    );

    return [...candidates].sort((first, second) => {
      const firstMeta = conversationMetaMap[getConversationKey(first)];
      const secondMeta = conversationMetaMap[getConversationKey(second)];

      const firstTimestamp = getTimestampValue(firstMeta?.lastTimestamp || "");
      const secondTimestamp = getTimestampValue(secondMeta?.lastTimestamp || "");

      if (firstTimestamp !== secondTimestamp) {
        return secondTimestamp - firstTimestamp;
      }

      return first.name.localeCompare(second.name, "vi-VN");
    });
  }, [contacts, conversationMetaMap, deferredContactSearchQuery]);

  const filteredMentors = useMemo(() => {
    const normalizedQuery = deferredContactSearchQuery.trim().toLowerCase();
    return mentors.filter((mentor) => (mentor.name || "").toLowerCase().includes(normalizedQuery));
  }, [deferredContactSearchQuery, mentors]);

  const filteredMessages = useMemo(() => {
    const normalizedQuery = deferredMessageSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return messages;
    }

    return messages.filter((message) => message.content.toLowerCase().includes(normalizedQuery));
  }, [deferredMessageSearchQuery, messages]);

  const visibleMessages = useMemo(() => {
    const startIndex = Math.max(0, filteredMessages.length - visibleMessageLimit);
    return filteredMessages.slice(startIndex);
  }, [filteredMessages, visibleMessageLimit]);

  const timelineItems = useMemo(() => buildTimelineItems(visibleMessages), [visibleMessages]);
  const hasMoreMessageHistory = filteredMessages.length > visibleMessages.length;
  const pendingOutboxCount = useMemo(
    () =>
      messages.filter((message) => message.status === "queued" || message.status === "retrying")
        .length,
    [messages]
  );

  const activeConversationKey = selectedContact ? getConversationKey(selectedContact) : null;
  const pinnedMessageId = activeConversationKey
    ? pinnedMessageIds[activeConversationKey]
    : undefined;
  const pinnedMessage = pinnedMessageId
    ? messages.find((message) => message.id === pinnedMessageId)
    : undefined;

  const shouldShowSidebar = !isMobile || !selectedContact;
  const shouldShowConversation = !isMobile || !!selectedContact;

  return (
    <div className="h-full w-full bg-slate-100/70 dark:bg-slate-950">
      <div
        className={cn(
          "grid h-full w-full",
          shouldShowSidebar && shouldShowConversation
            ? "md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]"
            : "grid-cols-1"
        )}>
        {shouldShowSidebar && (
          <aside
            className={cn(
              "flex min-h-0 flex-col",
              isMobile
                ? "bg-white dark:bg-slate-900"
                : "border-r border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95"
            )}>
            <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    {showMentorList ? "Tìm Mentor" : "Tin nhắn"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {showMentorList
                      ? "Chọn mentor để bắt đầu hội thoại"
                      : `${contacts.length} liên hệ khả dụng`}
                  </p>
                </div>

                {!showMentorList ? (
                  currentRole === "USER" && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-300"
                      onClick={() => setShowMentorList(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    onClick={() => setShowMentorList(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={showMentorList ? "Tìm mentor theo tên..." : "Tìm kiếm liên hệ..."}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={contactSearchQuery}
                  onChange={(event) => setContactSearchQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {showMentorList ? (
                  loadingMentors ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                        <Skeleton className="h-11 w-11 rounded-xl" />
                        <div className="w-full space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ))
                  ) : filteredMentors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-14 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <UserIcon className="mb-3 h-8 w-8 opacity-40" />
                      <p className="text-sm font-semibold">Không tìm thấy mentor phù hợp</p>
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

                          const nextContact: Contact = {
                            id: mentor.id,
                            name: mentor.name,
                            avatarUrl: mentor.avatarUrl ?? null,
                            role: "MENTOR",
                          };

                          setContacts((previous) => {
                            if (previous.some((contact) => contact.id === nextContact.id)) {
                              return previous;
                            }

                            return [nextContact, ...previous];
                          });

                          openConversation(nextContact);
                          setShowMentorList(false);
                          setContactSearchQuery("");
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 rounded-xl border border-white shadow-sm dark:border-slate-700">
                            <AvatarImage
                              src={mentor.avatarUrl || ""}
                              alt={mentor.name || "Mentor"}
                            />
                            <AvatarFallback className="rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {mentor.name?.charAt(0) ?? "M"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {mentor.name || "Mentor"}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {mentor.expertise || "Mentor chuyên nghiệp"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )
                ) : loadingContacts ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))
                ) : contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-14 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <MessageSquare className="mb-3 h-9 w-9 opacity-40" />
                    <p className="text-sm font-semibold">Chưa có hội thoại nào</p>
                    <p className="mt-1 text-xs">
                      Bạn có thể chọn mentor để bắt đầu cuộc trò chuyện mới.
                    </p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-14 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <Search className="mb-3 h-8 w-8 opacity-40" />
                    <p className="text-sm font-semibold">Không có kết quả phù hợp</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isActive = selectedContact?.id === contact.id;
                    const conversationMeta = conversationMetaMap[getConversationKey(contact)];
                    const previewMessage =
                      conversationMeta?.lastMessage ||
                      contact.lastMessage ||
                      `Nhấn để mở hội thoại với ${getRoleLabel(contact.role)}`;
                    const previewTime = conversationMeta?.lastTimestamp
                      ? formatConversationTime(conversationMeta.lastTimestamp)
                      : contact.time;

                    return (
                      <button
                        key={contact.id}
                        onClick={() => openConversation(contact)}
                        className={cn(
                          "group w-full rounded-2xl border px-3 py-3 text-left transition-all",
                          isActive
                            ? "border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-900/20"
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
                        )}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-11 w-11 rounded-xl border border-white shadow-sm dark:border-slate-700">
                              <AvatarImage src={contact.avatarUrl || ""} alt={contact.name} />
                              <AvatarFallback className="rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-600"
                              title="Chưa có trạng thái hoạt động theo thời gian thực"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {contact.name}
                              </p>
                              {previewTime && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {previewTime}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {previewMessage}
                              </p>
                              <Badge
                                variant="secondary"
                                className="rounded-full bg-slate-100 px-2 py-0 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {getRoleLabel(contact.role)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        )}

        {shouldShowConversation && (
          <section
            className="relative flex min-h-0 flex-col bg-linear-to-b from-slate-50 via-white to-slate-100/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
            onTouchStart={handleConversationTouchStart}
            onTouchEnd={handleConversationTouchEnd}>
            {selectedContact ? (
              <>
                <div className="border-b border-slate-200/80 bg-white/80 px-3 py-3 backdrop-blur-sm md:px-5 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                      {isMobile && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                          onClick={closeConversation}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}

                      <Avatar className="h-10 w-10 rounded-xl border border-white shadow-sm dark:border-slate-700">
                        <AvatarImage
                          src={selectedContact.avatarUrl || ""}
                          alt={selectedContact.name}
                        />
                        <AvatarFallback className="rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {selectedContact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 md:text-base dark:text-white">
                          {selectedContact.name}
                        </p>
                        <SocketStatusBadge state={connectionState} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                      <p className="hidden text-[11px] text-slate-400 xl:block">
                        Ctrl+K tìm kiếm · Ctrl+Shift+M soạn nhanh · /camon lệnh nhanh
                      </p>

                      {pendingOutboxCount > 0 && (
                        <Badge className="hidden h-7 items-center gap-1 rounded-full bg-amber-100 px-2.5 text-[11px] text-amber-800 md:inline-flex dark:bg-amber-900/40 dark:text-amber-200">
                          <Sparkles className="h-3.5 w-3.5" />
                          {pendingOutboxCount} tin đang chờ gửi
                        </Badge>
                      )}

                      {isMessageSearchOpen && (
                        <div className={cn("relative", isMobile ? "w-36" : "w-56 lg:w-72")}>
                          <Input
                            placeholder="Tìm tin nhắn..."
                            className="h-9 rounded-xl border-slate-200 bg-white pr-8 text-xs focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                            value={messageSearchQuery}
                            onChange={(event) => setMessageSearchQuery(event.target.value)}
                            autoFocus
                          />
                          {messageSearchQuery.trim().length > 0 && (
                            <button
                              onClick={() => setMessageSearchQuery("")}
                              className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600",
                          isMessageSearchOpen && "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                        )}
                        onClick={() => {
                          setIsMessageSearchOpen((current) => {
                            if (current) {
                              setMessageSearchQuery("");
                            }
                            return !current;
                          });
                        }}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {pinnedMessage && (
                  <div className="border-b border-slate-200/70 bg-amber-50/60 px-3 py-2 md:px-5 dark:border-slate-800 dark:bg-amber-900/10">
                    <div className="mx-auto flex w-full max-w-5xl items-start gap-2 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2.5 dark:border-amber-900/70 dark:bg-slate-900/85">
                      <div className="mt-0.5 rounded-lg bg-amber-100 p-1 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <Pin className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                          Tin nhắn đã ghim
                        </p>

                        {!isPinnedMessageCollapsed && (
                          <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                            {pinnedMessage.content}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => setIsPinnedMessageCollapsed((current) => !current)}>
                        {isPinnedMessageCollapsed ? (
                          <>
                            <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                            Mở rộng
                          </>
                        ) : (
                          <>
                            <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                            Thu gọn
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => handleTogglePinMessage(pinnedMessage.id)}>
                        <PinOff className="mr-1.5 h-3.5 w-3.5" />
                        Bỏ ghim
                      </Button>
                    </div>
                  </div>
                )}

                <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-5">
                  <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                    {loadingMessages ? (
                      <>
                        <div className="flex items-end gap-2.5">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-14 w-56 rounded-2xl" />
                        </div>
                        <div className="ml-auto flex items-end gap-2.5">
                          <Skeleton className="h-14 w-72 rounded-2xl" />
                        </div>
                      </>
                    ) : messages.length === 0 ? (
                      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <MessageSquare className="h-8 w-8" />
                        </div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          Bắt đầu cuộc trò chuyện
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Gửi tin nhắn đầu tiên để mở cuộc hội thoại với liên hệ này.
                        </p>
                      </div>
                    ) : visibleMessages.length === 0 ? (
                      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <Search className="mb-3 h-8 w-8 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Không tìm thấy nội dung khớp từ khóa
                        </p>
                      </div>
                    ) : (
                      <>
                        {hasMoreMessageHistory && (
                          <div className="mx-auto mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              onClick={() =>
                                setVisibleMessageLimit((current) => current + MESSAGE_RENDER_STEP)
                              }>
                              <ChevronsUp className="mr-1.5 h-3.5 w-3.5" />
                              Tải thêm tin cũ ({visibleMessages.length}/{filteredMessages.length})
                            </Button>
                          </div>
                        )}

                        {timelineItems.map((timelineItem) => {
                          if (timelineItem.type === "day") {
                            return (
                              <div key={timelineItem.key} className="my-1 flex justify-center">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                  {timelineItem.label}
                                </span>
                              </div>
                            );
                          }

                          const message = timelineItem.message;
                          return (
                            <MessageBubble
                              key={timelineItem.key}
                              id={message.id}
                              sender={message.sender}
                              content={message.content}
                              timestamp={message.timestamp}
                              status={message.status}
                              searchQuery={deferredMessageSearchQuery}
                              isPinned={pinnedMessageId === message.id}
                              isGroupedWithPrevious={timelineItem.isGroupedWithPrevious}
                              isGroupedWithNext={timelineItem.isGroupedWithNext}
                              onCopy={handleCopyMessage}
                              onRetry={handleRetryMessage}
                              onForward={handleForwardMessage}
                              onTogglePin={handleTogglePinMessage}
                            />
                          );
                        })}
                      </>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t border-slate-200/80 bg-white/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5 md:py-4 dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="mx-auto mb-2 flex w-full max-w-5xl items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Tin nhắn được lưu tự động khi bạn nhập, không cần lo mất nội dung khi chuyển
                      cuộc hội thoại hoặc đóng trình duyệt.
                    </span>

                    {messageInput.trim().length > 0 && draftLastSavedAt && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        Đã lưu lúc {draftLastSavedAt}
                      </span>
                    )}
                  </div>

                  <ChatComposer
                    value={messageInput}
                    onChange={setMessageInput}
                    onSend={handleSendMessage}
                    onApplyQuickCommand={handleApplyQuickCommand}
                    isMobile={isMobile}
                    placeholder={
                      isMobile
                        ? "Nhập nội dung tin nhắn..."
                        : "Nhập nội dung tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
                    }
                  />
                </div>
              </>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center px-8 text-center md:flex">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <MessageSquare className="h-11 w-11" />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Messenger
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Chọn một liên hệ ở cột bên trái để xem lịch sử hội thoại và bắt đầu nhắn tin ngay.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
