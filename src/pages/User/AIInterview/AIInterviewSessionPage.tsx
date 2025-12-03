import { Mic, Video } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AIInterviewSessionPage() {
  const navigate = useNavigate();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const handleStartInterview = () => {
    setIsInterviewStarted(true);
  };

  const handleEndInterview = () => {
    setIsInterviewStarted(false);
    navigate("/dashboard/ai-interview/result/1");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Interview Container */}
      <div className="mx-auto mt-6 h-[1001px] w-[1181px] overflow-hidden rounded-[20px] bg-white outline outline-1 outline-offset-[-1px] outline-black/60">
        {/* Title */}
        <div className="px-6 py-4">
          <h1 className="font-['Inter'] text-4xl font-semibold text-blue-800">Trò chuyện với AI</h1>
        </div>

        {/* Video Area */}
        <div className="relative mx-auto mt-8 flex h-[596px] w-[849px] items-center justify-center border border-black bg-white/60">
          {/* Placeholder for webcam feed */}
          <div className="flex flex-col items-center gap-4">
            <Video className="h-24 w-24 text-gray-400" />
            <p className="font-['Inter'] text-xl text-gray-500">
              {isInterviewStarted
                ? "Cuộc phỏng vấn đang diễn ra..."
                : "Camera sẽ được bật khi bắt đầu phỏng vấn"}
            </p>
          </div>

          {/* Recording indicator */}
          {isInterviewStarted && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-['Inter'] text-sm text-red-500">Recording</span>
            </div>
          )}
        </div>

        {/* Microphone Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex h-24 w-28 items-center justify-center rounded-full bg-gray-100">
            <Mic
              className={`h-12 w-12 ${isInterviewStarted ? "text-emerald-500" : "text-gray-400"}`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-6">
          {!isInterviewStarted ? (
            <button
              onClick={handleStartInterview}
              className="flex h-28 w-96 items-center justify-center gap-2.5 overflow-hidden rounded-[20px] bg-green-600 py-4">
              <span className="font-['Inter'] text-3xl font-semibold text-black">
                Bắt đầu cuộc phỏng vấn
              </span>
            </button>
          ) : (
            <button
              onClick={handleEndInterview}
              className="flex h-28 w-96 items-center justify-center gap-2.5 overflow-hidden rounded-[20px] bg-rose-700 py-4">
              <span className="font-['Inter'] text-3xl font-semibold text-black">
                Kết thúc cuộc phỏng vấn
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
