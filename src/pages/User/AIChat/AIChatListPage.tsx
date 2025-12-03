import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { ChatSession } from "@/mocks/chat.mock";
import { mockChatSessions } from "@/mocks/chat.mock";

export function AIChatListPage() {
  const navigate = useNavigate();
  const [chatSessions] = useState<ChatSession[]>(mockChatSessions);

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
      <div className="h-56 w-full overflow-hidden rounded-[30px] bg-indigo-100">
        <div className="flex h-full flex-col justify-center px-8">
          <h1 className="font-['Open_Sans'] text-3xl leading-5 font-normal text-blue-800">
            AI Chat
          </h1>
          <p className="mt-4 font-['Open_Sans'] text-base leading-5 font-normal text-black">
            Bạn làm rất tốt, hãy giữ vững phong độ nhé !
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-6">
        {/* Title and New Chat Button */}
        <div className="flex items-center justify-between">
          <h2 className="font-['Inter'] text-3xl font-bold text-zinc-800">AI Chat</h2>
          <button
            onClick={handleNewChat}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-6 text-center font-['Inter'] text-base font-bold text-white hover:bg-indigo-600">
            <Plus className="h-5 w-5" />
            Bắt đầu Cuộc trò chuyện Mới
          </button>
        </div>

        {/* Chat History Card */}
        <div className="w-full rounded-[10px] bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
          {chatSessions.map((session, index) => (
            <div
              key={session.id}
              onClick={() => handleOpenChat(session.id)}
              className={`flex cursor-pointer flex-col justify-center px-5 py-5 hover:bg-gray-50 ${
                index !== chatSessions.length - 1 ? "border-b border-neutral-200" : ""
              }`}>
              {/* Chat Title */}
              <div className="flex items-center gap-4">
                <h3 className="font-['Inter'] text-base font-bold text-zinc-800">
                  {session.title}
                </h3>
                <span className="font-['Inter'] text-xs font-normal text-neutral-400">
                  {session.lastMessageTime}
                </span>
              </div>
              {/* Last Message Preview */}
              <div className="mt-2 overflow-hidden">
                <p className="truncate font-['Inter'] text-sm font-normal text-stone-500">
                  {session.lastMessage}
                </p>
              </div>
            </div>
          ))}

          {/* Empty state if no chat sessions */}
          {chatSessions.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center">
              <p className="font-['Inter'] text-base text-gray-500">
                Chưa có cuộc trò chuyện nào. Hãy bắt đầu cuộc trò chuyện mới!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
