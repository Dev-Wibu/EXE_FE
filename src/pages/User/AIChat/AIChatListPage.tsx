import { MessageCircle, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatSession } from "@/mocks/chat.mock";
import { chatManager } from "@/services";

export function AIChatListPage() {
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatSessions = async () => {
      setLoading(true);
      try {
        const response = await chatManager.getChatSessions();
        if (response.success && response.data) {
          const sessions = Array.isArray(response.data) ? response.data : [];
          setChatSessions(sessions);
        }
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatSessions();
  }, []);

  const handleNewChat = () => {
    // Navigate to a new chat conversation
    navigate("/dashboard/ai-chat/new");
  };

  const handleOpenChat = (sessionId: number) => {
    navigate(`/dashboard/ai-chat/${sessionId}`);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Top Banner */}
      <Card className="overflow-hidden border-0 bg-linear-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">Trò Chuyện AI</h1>
            </div>
            <p className="max-w-md text-lg text-white/90">
              Trò chuyện với AI để luyện tập phỏng vấn và nhận phản hồi chi tiết về câu trả lời của
              bạn!
            </p>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <MessageCircle className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div className="flex flex-col gap-6">
        {/* Title and New Chat Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-zinc-800">Lịch sử trò chuyện</h2>
            <p className="text-muted-foreground text-sm">
              Xem lại các cuộc trò chuyện trước đây của bạn
            </p>
          </div>
          <Button onClick={handleNewChat} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Bắt đầu cuộc trò chuyện mới
          </Button>
        </div>

        {/* Chat History Cards */}
        {loading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </Card>
        ) : (
          <Card className="divide-y">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Cuộc trò chuyện gần đây</CardTitle>
              <CardDescription>Click vào để tiếp tục cuộc trò chuyện</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {chatSessions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                [...chatSessions].reverse().map((session, index) => (
                  <div
                    key={session.id}
                    onClick={() => handleOpenChat(session.id)}
                    className={`group hover:bg-muted/50 flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors ${
                      index !== chatSessions.length - 1 ? "border-b" : ""
                    }`}>
                    {/* Icon */}
                    <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                      <MessageCircle className="text-primary h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="group-hover:text-primary font-semibold text-zinc-800">
                          {session.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {session.lastMessageTime}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 truncate text-sm">
                        {session.lastMessage}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
