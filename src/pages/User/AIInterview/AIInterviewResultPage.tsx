import { useNavigate, useParams } from "react-router-dom";

import { mockInterviewResult } from "@/mocks/interviews.mock";

export function AIInterviewResultPage() {
  const navigate = useNavigate();
  const { id: _id } = useParams<{ id: string }>();

  // In a real app, we would fetch the result based on id
  const result = mockInterviewResult;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Title */}
        <h1 className="text-center font-['Inter'] text-3xl font-bold text-blue-800">
          Kết quả Đánh giá Phỏng vấn AI
        </h1>

        {/* Main Result Card */}
        <div className="mt-8 rounded-[10px] bg-white px-8 py-12 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
          {/* Interview Title */}
          <h2 className="text-center font-['Inter'] text-3xl font-bold text-black">
            {result.title}
          </h2>

          {/* Score */}
          <div className="mt-8 text-center">
            <p className="font-['Inter'] text-sm font-normal text-black">Điểm Tổng thể</p>
            <p className="mt-2 font-['Inter'] text-4xl font-bold text-green-600">
              {result.overallScore}/10
            </p>
          </div>

          {/* Conclusion */}
          <div className="mt-12 text-center">
            <p className="font-['Inter'] text-xl leading-7 font-normal text-black">
              Kết luận: <strong>Rất Tốt</strong>. {result.conclusion}
            </p>
          </div>
        </div>

        {/* Strengths and Improvements Cards */}
        <div className="mt-8 flex gap-4">
          {/* Strengths Card */}
          <div className="flex-1 rounded-[10px] border-l-[5px] border-green-600 bg-white p-8 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]">
            <h3 className="font-['Inter'] text-lg font-bold text-black">✅ Điểm Mạnh</h3>

            <div className="mt-6 flex flex-col gap-4">
              {result.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm">👍</span>
                  <p className="font-['Inter'] text-sm leading-6 font-normal text-black">
                    {strength}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements Card */}
          <div className="flex-1 rounded-[10px] border-l-[5px] border-yellow-400 bg-white p-8 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]">
            <h3 className="font-['Inter'] text-lg font-bold text-black">⚠️ Cần Cải thiện</h3>

            <div className="mt-6 flex flex-col gap-4">
              {result.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm">👇</span>
                  <p className="font-['Inter'] text-sm leading-6 font-normal text-black">
                    {improvement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard/ai-interview")}
            className="flex h-12 items-center justify-center rounded-lg bg-gray-100 px-6">
            <span className="font-['Inter'] text-base font-normal text-black">
              Xem lại Câu hỏi đã trả lời
            </span>
          </button>

          <button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="flex h-12 items-center justify-center rounded-lg bg-violet-500 px-6">
            <span className="font-['Inter'] text-base font-medium text-white">
              Bắt đầu Buổi Phỏng vấn Mới
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
