import { API_BASE_URL } from "@/constants/api.config";
import { useAuthStore } from "@/stores/authStore";
import { Client, type Message } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface ChatMessageDto {
  id?: string | number;
  senderId: string;
  recipientId: string;
  recipientType?: string;
  content: string;
  timestamp?: string;
  senderType?: string; // Opt-in if BE sends it back separately
}

class SocketService {
  private stompClient: Client | null = null;
  private onMessageReceived: ((msg: ChatMessageDto) => void) | null = null;
  private currentUserId: string | null = null;

  private initClient(userId: string) {
    const token = useAuthStore.getState().token;
    const socketUrl = token ? `${API_BASE_URL}/ws-chat?token=${token}` : `${API_BASE_URL}/ws-chat`;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => console.log("STOMP: " + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log("Connected to STOMP: " + frame);

      const subUserId = this.currentUserId || userId;
      const topics = [`/user/${subUserId}/queue/messages`, `/user/${subUserId}/topic/messages`];

      topics.forEach((topic) => {
        this.stompClient?.subscribe(topic, (message: Message) => {
          if (message.body && this.onMessageReceived) {
            try {
              this.onMessageReceived(JSON.parse(message.body));
            } catch (e) {
              console.error("STOMP parse error", e);
            }
          }
        });
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error("STOMP broker error", frame.headers["message"], frame.body);
    };

    this.stompClient.onWebSocketClose = (event) => {
      console.warn("WebSocket closed", event.code);
    };
  }

  connect(userId: string, onMessageCallback: (msg: ChatMessageDto) => void) {
    this.onMessageReceived = onMessageCallback;
    this.currentUserId = userId;

    if (!this.stompClient) {
      this.initClient(userId);
    }

    if (!this.stompClient?.active) {
      this.stompClient?.activate();
    }
  }

  sendMessage(recipientId: string, content: string) {
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!this.stompClient) {
      const fullId = `${user.role?.toUpperCase()}_${user.id}`;
      this.initClient(fullId);
    }

    if (!this.stompClient?.connected) {
      console.warn("Socket not connected, activating...");
      this.stompClient?.activate();
      return;
    }

    const senderId = useAuthStore.getState().user?.id;
    const senderRole = useAuthStore.getState().user?.role?.toUpperCase();

    if (!senderId || !senderRole) return;

    // Backend expects a single string like "USER_1" for both IDs
    const chatDto: ChatMessageDto = {
      senderId: `${senderRole}_${senderId}`,
      recipientId: recipientId,
      content: content,
    };

    console.log("DEBUG: Sending Payload:", chatDto);

    this.stompClient.publish({
      destination: "/app/chat",
      body: JSON.stringify(chatDto),
    });
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log("Disconnected from STOMP");
    }
  }
}

export const socketService = new SocketService();
