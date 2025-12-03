import { Calendar, Clock, Filter, Plus, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { mockAIInterviews } from "@/mocks/interviews.mock";

export function AIInterviewListPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="h-56 w-full overflow-hidden rounded-[30px] bg-indigo-100">
        <div className="p-7">
          <h2 className="font-['Open_Sans'] text-3xl leading-8 font-normal text-blue-800">
            Hãy thử luyện tập phỏng vấn với AI trước nhé
          </h2>
          <p className="mt-2 font-['Open_Sans'] text-base leading-5 font-normal text-black">
            Bạn làm rất tốt, hãy giữ vững phong độ nhé !
          </p>
        </div>
        <div className="mt-4 flex justify-end px-7">
          <button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="flex items-center gap-2 font-['Open_Sans'] text-2xl leading-5 font-normal text-blue-800 hover:text-blue-900">
            Bắt đầu phỏng vấn
            <span className="inline-block h-[2px] w-6 bg-blue-800" />
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mt-8 flex items-center justify-between px-6">
        <h2 className="font-['Roboto'] text-2xl font-bold text-gray-900">Lịch sử phỏng vấn</h2>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative h-8 w-80 overflow-hidden rounded-lg bg-white outline outline-1 outline-offset-[-1px] outline-gray-300">
            <Search className="absolute top-2 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, vị trí..."
              className="h-full w-full pr-4 pl-10 font-['Inter'] text-sm font-normal text-neutral-500 outline-none placeholder:text-neutral-500"
            />
          </div>
          {/* Filter Button */}
          <button className="flex h-9 w-11 items-center justify-center rounded-lg bg-white outline outline-1 outline-offset-[-1px] outline-gray-300">
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Interview History Cards */}
      <div className="mt-6 flex flex-col gap-4 px-6">
        {mockAIInterviews.map((interview, index) => (
          <div
            key={interview.id}
            className="relative h-32 w-full rounded-lg bg-white outline outline-1 outline-offset-[-1px] outline-gray-200">
            {/* Number Badge */}
            <div className="absolute top-5 left-5 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <span className="font-['Roboto'] text-lg font-bold text-green-800">{index + 1}</span>
            </div>

            {/* Title and Info */}
            <div className="absolute top-5 left-[85px]">
              <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">{interview.title}</h3>

              {/* Metadata */}
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                    {interview.date}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                    {interview.duration} phút
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                    {interview.interviewer}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-2 flex gap-2">
                {interview.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-2xl bg-blue-100 px-3 py-1 font-['Roboto'] text-xs font-medium text-blue-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Score Badge */}
            <div className="absolute top-5 right-28 flex h-9 w-20 items-center justify-center rounded-[20px] bg-emerald-100">
              <span className="font-['Roboto'] text-lg font-bold text-emerald-500">
                {interview.score}/10
              </span>
            </div>

            {/* View Details Button */}
            <button
              onClick={() => navigate(`/dashboard/ai-interview/result/${interview.id}`)}
              className="absolute right-5 bottom-5 flex h-8 w-28 items-center justify-center rounded-lg bg-emerald-500">
              <span className="font-['Inter'] text-xs font-medium text-white">Xem chi tiết</span>
            </button>
          </div>
        ))}

        {/* CTA Card */}
        <div className="relative mt-4 h-72 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-800">
          {/* Plus Icon */}
          <div className="absolute top-10 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center opacity-90">
            <Plus className="h-12 w-12 text-white" strokeWidth={3} />
          </div>

          {/* Title */}
          <div className="absolute top-[120px] left-1/2 -translate-x-1/2">
            <h3 className="font-['Roboto'] text-2xl font-bold text-white">
              Bắt đầu buổi phỏng vấn mới
            </h3>
          </div>

          {/* Description */}
          <div className="absolute top-[156px] left-1/2 -translate-x-1/2">
            <p className="font-['Roboto'] text-base font-normal text-white opacity-90">
              Luyện tập với AI để cải thiện kỹ năng phỏng vấn của bạn
            </p>
          </div>

          {/* Button */}
          <button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="absolute top-[198px] left-1/2 flex h-10 w-52 -translate-x-1/2 items-center justify-center rounded-lg bg-white">
            <span className="font-['Inter'] text-base font-medium text-indigo-500">
              Tạo phỏng vấn mới
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
