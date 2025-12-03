import { Calendar, Clock, Filter, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { mockMockInterviews } from "@/mocks/mentors.mock";

export function MockInterviewListPage() {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex h-14 w-32 items-center justify-center rounded-[30px] bg-green-500/80">
            <span className="font-['Open_Sans'] text-sm leading-5 font-semibold text-green-900">
              Đã hoàn thành
            </span>
          </div>
        );
      case "upcoming":
        return (
          <div className="flex h-14 w-32 items-center justify-center rounded-[30px] bg-blue-100/80">
            <span className="font-['Open_Sans'] text-sm leading-5 font-semibold text-blue-700">
              Sắp diễn ra
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="h-56 w-full overflow-hidden rounded-[30px] bg-indigo-50">
        <div className="p-7">
          <h2 className="font-['Open_Sans'] text-3xl leading-8 font-semibold text-blue-800">
            Bạn đã hoàn thành 1 buổi phỏng vấn giả lập với mentor
          </h2>
          <p className="mt-2 font-['Open_Sans'] text-base leading-5 font-normal text-black">
            Bạn làm rất tốt, hãy giữ vững phong độ nhé !
          </p>
        </div>
        <div className="mt-4 flex justify-end px-7">
          <button
            onClick={() => navigate("/dashboard/mock-interview/select-mentor")}
            className="flex items-center gap-2 font-['Open_Sans'] text-2xl leading-5 font-semibold text-blue-800 hover:text-blue-900">
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
        {mockMockInterviews.map((interview) => (
          <div
            key={interview.id}
            className="relative h-32 w-full overflow-hidden rounded-[20px] bg-white/50">
            {/* Avatar Icon */}
            <div className="absolute top-[13px] left-[18px] flex h-12 w-12 items-center justify-center rounded-full bg-stone-300">
              <User className="h-6 w-6 text-stone-600" />
            </div>

            {/* Title */}
            <h3 className="absolute top-[13px] left-[95px] font-['Open_Sans'] text-3xl leading-5 font-semibold text-black">
              {interview.title}
            </h3>

            {/* Metadata */}
            <div className="absolute top-[70px] left-[95px] flex items-center gap-2 bg-neutral-400/10 px-2 py-1">
              <Calendar className="h-7 w-7 text-gray-500" />
              <span className="font-['Open_Sans'] text-sm leading-5 font-normal text-black">
                {interview.date}
              </span>
              <Clock className="h-7 w-7 rounded-full text-gray-500" />
              <span className="font-['Open_Sans'] text-sm leading-5 font-normal text-black">
                {interview.time}
              </span>
              <User className="h-7 w-7 rounded-full text-gray-500" />
              <span className="font-['Open_Sans'] text-sm leading-5 font-normal text-black">
                {interview.mentorName}
              </span>
            </div>

            {/* Status Badge */}
            <div className="absolute top-[38px] right-[20px]">
              {getStatusBadge(interview.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
