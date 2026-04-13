import { API_BASE_URL } from "@/constants/api.config";
import { useAuthStore } from "@/stores/authStore";
import { Client, type Message } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type SocketConnectionState = "connecting" | "connected" | "disconnected";

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
  private onMessageReceived: ((_msg: ChatMessageDto) => void) | null = null;
  private onConnectionStateChange: ((_state: SocketConnectionState) => void) | null = null;
  private currentUserId: string | null = null;
  private connectionState: SocketConnectionState = "disconnected";

  private setConnectionState(state: SocketConnectionState) {
    this.connectionState = state;
    this.onConnectionStateChange?.(state);
  }

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
      this.setConnectionState("connected");
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
      this.setConnectionState("disconnected");
      console.error("STOMP broker error", frame.headers["message"], frame.body);
    };

    this.stompClient.onWebSocketClose = (event) => {
      this.setConnectionState("disconnected");
      console.warn("WebSocket closed", event.code);
    };

    this.stompClient.onWebSocketError = (event) => {
      this.setConnectionState("disconnected");
      console.error("WebSocket error", event);
    };

    this.stompClient.onDisconnect = () => {
      this.setConnectionState("disconnected");
    };
  }

  connect(
    userId: string,
    onMessageCallback: (_msg: ChatMessageDto) => void,
    onConnectionStateChange?: (_state: SocketConnectionState) => void
  ) {
    this.onMessageReceived = onMessageCallback;
    this.onConnectionStateChange = onConnectionStateChange || null;
    this.currentUserId = userId;

    if (!this.stompClient) {
      this.initClient(userId);
    }

    if (this.stompClient?.connected) {
      this.setConnectionState("connected");
      return;
    }

    if (!this.stompClient?.active) {
      this.setConnectionState("connecting");
      this.stompClient?.activate();
    }
  }

  sendMessage(recipientId: string, content: string): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    if (!this.stompClient) {
      const fullId = `${user.role?.toUpperCase()}_${user.id}`;
      this.initClient(fullId);
    }

    if (!this.stompClient?.connected) {
      console.warn("Socket not connected, activating...");
      this.setConnectionState("connecting");
      if (!this.stompClient?.active) {
        this.stompClient?.activate();
      }
      return false;
    }

    const senderId = useAuthStore.getState().user?.id;
    const senderRole = useAuthStore.getState().user?.role?.toUpperCase();

    if (!senderId || !senderRole) return false;

    // Backend expects a single string like "USER_1" for both IDs
    const chatDto: ChatMessageDto = {
      senderId: `${senderRole}_${senderId}`,
      recipientId: recipientId,
      content: content,
    };

    console.log("DEBUG: Sending Payload:", chatDto);

    try {
      this.stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify(chatDto),
      });
      return true;
    } catch (error) {
      console.error("Failed to publish message", error);
      this.setConnectionState("disconnected");
      return false;
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.setConnectionState("disconnected");
      console.log("Disconnected from STOMP");
    }
  }

  getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }
}

export const socketService = new SocketService();
