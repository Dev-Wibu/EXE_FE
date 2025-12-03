import { Check, ChevronDown, Search, Star, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { mockInterviewTypes, mockMentors } from "@/mocks/mentors.mock";

export function MockInterviewSelectMentorPage() {
  const navigate = useNavigate();
  // Initialize with first mentor selected by default (for demo purposes)
  const [selectedMentor, setSelectedMentor] = useState<number | null>(
    mockMentors.length > 0 ? mockMentors[0].id : null
  );
  // Initialize with second interview type (Kiến thức) selected by default
  const [selectedInterviewType, setSelectedInterviewType] = useState<number>(
    mockInterviewTypes.length > 1 ? mockInterviewTypes[1].id : (mockInterviewTypes[0]?.id ?? 1)
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 font-['Inter'] text-sm font-normal text-stone-500">({rating})</span>
      </div>
    );
  };

  const handleNext = () => {
    if (selectedMentor && selectedInterviewType) {
      navigate("/dashboard/mock-interview/schedule");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Progress Stepper */}
      <div className="relative mx-auto mt-10 flex w-full max-w-4xl items-center justify-center">
        {/* Step 1: Chọn mentor - Active */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-gradient-to-l from-indigo-600 via-indigo-600 to-purple-600">
            <User className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Chọn mentor
          </span>
        </div>

        {/* Line 1 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 2: Lên lịch - Inactive */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-neutral-200">
            <div className="h-20 w-20 rounded-full bg-neutral-300" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Lên lịch
          </span>
        </div>

        {/* Line 2 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 3: Xác nhận - Inactive */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-neutral-200">
            <div className="h-20 w-20 rounded-full bg-neutral-300" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Xác nhận
          </span>
        </div>
      </div>

      {/* Search Section */}
      <div className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="font-['Inter'] text-2xl font-bold text-zinc-800">Tìm kiếm mentor phù hợp</h2>
        <p className="mt-2 font-['Inter'] text-sm font-normal text-stone-500">
          Để có buổi phỏng vấn giả lập chất lượng cao
        </p>

        {/* Search Input */}
        <div className="mt-4 flex h-12 w-full max-w-[875px] items-center rounded-lg bg-white outline outline-1 outline-offset-[-1px] outline-neutral-200">
          <div className="flex flex-1 items-center px-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo chuyên ngành"
              className="flex-1 font-['Inter'] text-base font-normal text-neutral-500 outline-none placeholder:text-neutral-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4">
            <Search className="h-4 w-4 text-stone-500" />
            <ChevronDown className="h-4 w-4 text-stone-500" />
          </div>
        </div>
      </div>

      {/* Mentor Cards */}
      <div className="mx-auto mt-8 max-w-4xl space-y-4 px-6">
        {mockMentors.slice(0, 2).map((mentor) => (
          <button
            key={mentor.id}
            onClick={() => setSelectedMentor(mentor.id)}
            className={`relative h-28 w-full rounded-[10px] text-left shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] ${
              selectedMentor === mentor.id
                ? "bg-indigo-100 outline outline-[3px] outline-offset-[-3px] outline-indigo-500"
                : "bg-white"
            }`}>
            {/* Avatar */}
            <div className="absolute top-[25px] left-[23px] flex h-14 w-14 items-center justify-center rounded-[30px] bg-stone-300">
              <User className="h-7 w-7 text-stone-600" />
            </div>

            {/* Name */}
            <div className="absolute top-[23px] left-[98px] font-['Inter'] text-lg font-bold text-zinc-800">
              {mentor.name}
            </div>

            {/* Position */}
            <div className="absolute top-[49px] left-[98px] font-['Inter'] text-sm font-normal text-stone-500">
              {mentor.position}
            </div>

            {/* Company, Location, Language */}
            <div className="absolute top-[73px] left-[98px] flex gap-2">
              <span className="font-['Inter'] text-xs font-normal text-neutral-400">
                {mentor.company}
              </span>
              <span className="font-['Inter'] text-xs font-normal text-neutral-400">
                {mentor.location}
              </span>
              <span className="font-['Inter'] text-xs font-normal text-neutral-400">
                {mentor.language}
              </span>
            </div>

            {/* Rating */}
            <div className="absolute top-[28px] left-[580px]">{renderStars(mentor.rating)}</div>

            {/* Skills and Sessions */}
            <div className="absolute top-[60px] left-[580px] flex items-center gap-4">
              {mentor.skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-2xl bg-slate-200 px-3 py-1 font-['Inter'] text-xs font-bold text-indigo-500">
                  {skill}
                </span>
              ))}
              {mentor.moreSkills > 0 && (
                <span className="rounded-2xl bg-stone-300 px-3 py-1 font-['Inter'] text-[10px] font-bold text-zinc-800">
                  +{mentor.moreSkills}
                </span>
              )}
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-indigo-500" />
                <span className="font-['Inter'] text-sm font-bold text-zinc-800">
                  {mentor.totalSessions} buổi
                </span>
              </div>
            </div>

            {/* Selected indicator */}
            {selectedMentor === mentor.id && (
              <div className="absolute top-[28px] right-[20px]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}

        {/* More link */}
        <div className="text-center">
          <button className="font-['Inter'] text-base font-medium text-indigo-500 hover:text-indigo-600">
            More →
          </button>
        </div>
      </div>

      {/* Interview Type Selection */}
      <div className="mx-auto mt-8 max-w-4xl rounded-[10px] bg-indigo-100 p-7">
        <h3 className="text-center font-['Inter'] text-xl font-bold text-zinc-800">
          Chọn loại phỏng vấn
        </h3>

        <div className="mt-7 flex items-center justify-center gap-3.5">
          {mockInterviewTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedInterviewType(type.id)}
              className={`relative h-52 w-48 rounded-lg bg-white ${
                selectedInterviewType === type.id
                  ? "shadow-[0px_0px_0px_4px_rgba(93,93,219,0.20)] outline outline-2 outline-offset-[-2px] outline-indigo-500"
                  : ""
              }`}>
              <div className="absolute top-[17px] left-[17px] h-20 w-40 border-b border-neutral-200">
                <div className="flex justify-center text-2xl">{type.icon}</div>
                <div className="mt-2 text-center font-['Inter'] text-sm font-bold text-zinc-800">
                  {type.duration} phút
                </div>
                <div className="mt-1 text-center font-['Inter'] text-xs font-bold text-indigo-500">
                  {formatCurrency(type.price)}
                </div>
              </div>

              <div className="absolute top-[119px] left-0 w-full text-center font-['Inter'] text-base font-bold text-zinc-800">
                {type.name}
              </div>

              <div className="absolute top-[149px] left-0 w-full px-4 text-center font-['Inter'] text-xs font-normal text-stone-500">
                {type.description}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-7 flex justify-center">
          <button
            onClick={handleNext}
            disabled={!selectedMentor || !selectedInterviewType}
            className="h-10 w-36 rounded-lg bg-indigo-500 font-['Inter'] text-base font-bold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300">
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
