import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { ChatMessage } from "@/mocks/chat.mock";
import {
  fetchChatMessages,
  fetchChatSession,
  getAIResponse,
  sendChatMessage,
} from "@/mocks/chat.mock";

export function AIChatConversationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isNewChat = id === "new";
  const [sessionId] = useState(() => (isNewChat ? Date.now() : Number(id)));

  useEffect(() => {
    const loadChat = async () => {
      if (isNewChat) {
        setChatTitle("Cuộc trò chuyện mới");
        // Start with a welcome message for new chats
        setMessages([
          {
            id: 1,
            sender: "ai",
            content:
              "Chào bạn! Tôi là AI trợ lý của Inblue. Tôi có thể giúp gì cho bạn hôm nay? Hãy hỏi bất cứ điều gì về phỏng vấn, lập trình, hoặc các câu hỏi kỹ thuật.",
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          },
        ]);
      } else {
        const session = await fetchChatSession(sessionId);
        if (session) {
          setChatTitle(session.title);
        }
        const chatMessages = await fetchChatMessages(sessionId);
        // Set messages from API response, or use mock data for demo purposes
        setMessages(chatMessages);
      }
    };
    loadChat();
  }, [id, isNewChat, sessionId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBack = () => {
    navigate("/dashboard/ai-chat");
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message
    const userMessage = await sendChatMessage(sessionId, messageContent);
    setMessages((prev) => [...prev, userMessage]);

    // Get AI response
    try {
      const aiResponse = await getAIResponse(sessionId);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat Container */}
      <div className="mx-auto flex h-full w-full max-w-[958px] flex-col outline outline-1 outline-offset-[-1px] outline-black/40">
        {/* Header */}
        <div className="flex h-20 items-center gap-4 border-b border-neutral-200 bg-stone-50 px-8">
          <button
            onClick={handleBack}
            className="font-['Inter'] text-base font-normal text-indigo-500 hover:text-indigo-600">
            ← Trở về
          </button>
          <h1 className="font-['Inter'] text-xl font-bold text-zinc-800">{chatTitle}</h1>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}>
                {/* Message Bubble */}
                <div
                  className={`max-w-[630px] px-5 py-4 ${
                    message.sender === "ai"
                      ? "rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-sm bg-slate-200"
                      : "rounded-tl-[20px] rounded-tr-[20px] rounded-br-sm rounded-bl-[20px] bg-indigo-500"
                  }`}>
                  <p
                    className={`font-['Inter'] text-sm leading-6 font-normal ${
                      message.sender === "ai" ? "text-zinc-800" : "text-white"
                    }`}>
                    {message.content}
                  </p>
                </div>
                {/* Timestamp */}
                <span
                  className={`mt-2 font-['Inter'] text-xs font-normal text-neutral-400 ${
                    message.sender === "user" ? "text-right" : "text-left"
                  }`}>
                  {message.time}
                </span>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="max-w-[630px] rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-sm bg-slate-200 px-5 py-4">
                  <p className="font-['Inter'] text-sm leading-6 font-normal text-zinc-800">
                    AI đang nhập...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex h-20 items-center gap-4 border-t border-neutral-200 bg-white px-8">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu trả lời của bạn hoặc câu hỏi tiếp theo..."
              className="h-11 w-full rounded-lg bg-white px-4 font-['Inter'] text-base font-normal text-neutral-900 outline outline-1 outline-offset-[-1px] outline-stone-300 placeholder:text-neutral-500 focus:outline-indigo-500"
              disabled={isLoading}
              aria-label="Nhập tin nhắn"
              aria-disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex h-11 w-16 items-center justify-center rounded-lg bg-indigo-500 font-['Inter'] text-sm font-bold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi tin nhắn">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
