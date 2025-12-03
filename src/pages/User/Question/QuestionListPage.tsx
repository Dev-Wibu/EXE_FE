import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchQuestionSets,
  mockIndustries,
  mockLevels,
  type QuestionSet,
} from "@/mocks/questions.mock";

// Map level to Tailwind color classes
const levelColorMap: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  red: "bg-red-600",
};

export function QuestionListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("Tất cả Ngành");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả Cấp độ");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestionSets = async () => {
      setLoading(true);
      try {
        const data = await fetchQuestionSets();
        setQuestionSets(data);
      } catch (error) {
        console.error("Error loading question sets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionSets();
  }, []);

  // Filter question sets based on search and filters
  const filteredQuestionSets = questionSets.filter((qs) => {
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesTitle = qs.title.toLowerCase().includes(lowerQuery);
      const matchesTags = qs.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
      if (!matchesTitle && !matchesTags) return false;
    }

    // Filter by industry
    if (selectedIndustry !== "Tất cả Ngành" && qs.industry !== selectedIndustry) {
      return false;
    }

    // Filter by level
    if (selectedLevel !== "Tất cả Cấp độ" && qs.level !== selectedLevel) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="font-['Inter'] text-lg text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="mb-8 h-56 overflow-hidden rounded-[30px] bg-indigo-100 px-8 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-['Open_Sans'] text-3xl leading-5 font-normal text-blue-800">
            Hãy thử luyện tập trước với bộ câu hỏi trước nhé !
          </h1>
          <p className="font-['Open_Sans'] text-base leading-5 font-normal text-black">
            Bạn làm rất tốt, hãy giữ vững phong độ nhé !
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-10">
        {/* Title */}
        <h2 className="mb-4 font-['Inter'] text-3xl font-bold text-zinc-800">Bộ Câu Hỏi</h2>

        {/* Filter Bar */}
        <div className="mb-8 flex h-20 items-center gap-4 rounded-[10px] bg-white px-5 shadow-[0px_2px_5px_0px_rgba(0,0,0,0.05)]">
          {/* Search Input */}
          <div className="relative h-10 w-[455px]">
            <input
              type="text"
              placeholder="Tìm kiếm bộ câu hỏi, ví dụ: Java, React, SQL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full w-full rounded-md bg-white px-4 font-['Inter'] text-sm font-normal text-black outline outline-1 outline-offset-[-1px] outline-stone-300 placeholder:text-neutral-500 focus:outline-indigo-500"
            />
          </div>

          {/* Industry Filter Label */}
          <span className="font-['Inter'] text-sm font-bold text-neutral-600">Lọc theo Ngành:</span>

          {/* Industry Dropdown */}
          <div className="relative h-10 w-48">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="h-full w-full appearance-none rounded-md bg-white px-5 pr-10 font-['Inter'] text-sm leading-4 font-normal text-black outline outline-1 outline-offset-[-1px] outline-stone-300 focus:outline-indigo-500">
              {mockIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-gray-500" />
          </div>

          {/* Level Filter Label */}
          <span className="font-['Inter'] text-sm font-bold text-neutral-600">
            Lọc theo Cấp độ:
          </span>

          {/* Level Dropdown */}
          <div className="relative h-10 w-36">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="h-full w-full appearance-none rounded-md bg-white px-5 pr-10 font-['Inter'] text-sm leading-4 font-normal text-black outline outline-1 outline-offset-[-1px] outline-stone-300 focus:outline-indigo-500">
              {mockLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Question Set Cards Grid */}
        <div className="grid grid-cols-2 gap-6">
          {filteredQuestionSets.map((questionSet) => (
            <QuestionSetCard
              key={questionSet.id}
              questionSet={questionSet}
              onClick={() => navigate(`/dashboard/questions/${questionSet.id}`)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredQuestionSets.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[10px] bg-gray-50">
            <Search className="h-12 w-12 text-gray-400" />
            <p className="font-['Inter'] text-lg text-gray-500">
              Không tìm thấy bộ câu hỏi nào phù hợp
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedIndustry("Tất cả Ngành");
                setSelectedLevel("Tất cả Cấp độ");
              }}
              className="rounded-md bg-indigo-500 px-4 py-2 font-['Inter'] text-sm font-bold text-white hover:bg-indigo-600">
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Question Set Card Component
interface QuestionSetCardProps {
  questionSet: QuestionSet;
  onClick: () => void;
}

function QuestionSetCard({ questionSet, onClick }: QuestionSetCardProps) {
  return (
    <div className="relative h-72 rounded-[10px] bg-white p-5 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]">
      {/* Title and Tags Row */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="w-52 font-['Inter'] text-lg leading-6 font-bold text-indigo-500">
          {questionSet.title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {questionSet.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-slate-200 px-2 py-1 font-['Inter'] text-xs font-bold text-indigo-600">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Level Badge */}
      <div className="mb-4">
        <span
          className={`inline-block rounded-sm px-2 py-1 font-['Inter'] text-xs font-bold text-white ${levelColorMap[questionSet.levelColor]}`}>
          {questionSet.level}
        </span>
      </div>

      {/* Description */}
      <p className="mb-4 font-['Inter'] text-sm font-normal text-stone-500">
        {questionSet.description}
      </p>

      {/* Metadata Row */}
      <div className="mb-4 flex items-center gap-8 border-t border-zinc-100 pt-4">
        <span className="font-['Inter'] text-xs font-normal text-neutral-400">
          Số lượng: {questionSet.questionCount} câu
        </span>
        <span className="font-['Inter'] text-xs font-normal text-neutral-400">
          Ngành: {questionSet.industry}
        </span>
      </div>

      {/* View Detail Button */}
      <button
        onClick={onClick}
        className="h-11 w-28 rounded-md bg-indigo-500 font-['Inter'] text-sm font-bold text-white hover:bg-indigo-600">
        Xem Chi tiết
      </button>
    </div>
  );
}
