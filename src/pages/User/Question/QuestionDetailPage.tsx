import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchQuestionSetDetail, type QuestionSetDetail } from "@/mocks/questions.mock";

export function QuestionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [questionSet, setQuestionSet] = useState<QuestionSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadQuestionSet = async () => {
      // Validate id parameter
      const numericId = Number(id);
      if (!id || isNaN(numericId) || numericId <= 0) {
        setQuestionSet(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchQuestionSetDetail(numericId);
        setQuestionSet(data);
      } catch (error) {
        console.error("Error loading question set:", error);
        setQuestionSet(null);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionSet();
  }, [id]);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="font-['Inter'] text-lg text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!questionSet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <div className="font-['Inter'] text-lg text-gray-500">Không tìm thấy bộ câu hỏi</div>
        <button
          onClick={() => navigate("/dashboard/questions")}
          className="rounded-md bg-indigo-500 px-4 py-2 font-['Inter'] text-sm font-bold text-white hover:bg-indigo-600">
          Quay lại Danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-9 overflow-hidden bg-white p-10">
      {/* Header Section */}
      <div className="relative h-20">
        {/* Back Link */}
        <button
          onClick={() => navigate("/dashboard/questions")}
          className="mb-2 font-['Inter'] text-xl font-normal text-stone-500 hover:text-indigo-500">
          ← Quay lại Danh sách
        </button>

        {/* Title with Border */}
        <div className="h-12 border-b-[3px] border-indigo-500">
          <h1 className="font-['Inter'] text-3xl font-bold text-zinc-800">{questionSet.title}</h1>
        </div>
      </div>

      {/* Info Card */}
      <div className="relative h-28 rounded-[10px] bg-white px-5 py-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]">
        {/* Description */}
        <p className="mb-4 font-['Inter'] text-sm leading-6 font-normal text-stone-500">
          {questionSet.description}
        </p>

        {/* Metadata Row */}
        <div className="flex items-center gap-0">
          <div className="border-r border-zinc-100 pr-6">
            <span className="font-['Inter'] text-xs font-normal text-zinc-500">
              Ngành: <strong>{questionSet.industry}</strong>
            </span>
          </div>
          <div className="border-r border-zinc-100 px-6">
            <span className="font-['Inter'] text-xs font-normal text-zinc-500">
              Cấp độ: <strong>{questionSet.level}</strong>
            </span>
          </div>
          <div className="px-6">
            <span className="font-['Inter'] text-xs font-normal text-zinc-500">
              Số lượng: <strong>{questionSet.questionCount} câu</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-4">
        {questionSet.questions.map((question) => (
          <div
            key={question.id}
            className="relative overflow-hidden rounded-lg bg-white shadow-[0px_1px_4px_0px_rgba(0,0,0,0.03)] outline outline-1 outline-offset-[-1px] outline-neutral-200">
            <div className="flex h-14 items-center bg-stone-50 px-5">
              {/* Question Number */}
              <span className="mr-3 font-['Inter'] text-2xl font-bold text-indigo-500">
                {question.id}.
              </span>

              {/* Question Text */}
              <span className="flex-1 font-['Inter'] text-xl leading-6 font-bold text-zinc-800">
                {question.text}
              </span>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleQuestion(question.id)}
                className="font-['Inter'] text-2xl leading-6 font-bold text-indigo-500 hover:text-indigo-600">
                {expandedQuestions.has(question.id) ? (
                  <ChevronUp className="h-7 w-7" />
                ) : (
                  <ChevronDown className="h-7 w-7" />
                )}
              </button>
            </div>

            {/* Expanded Answer Section (Placeholder) */}
            {expandedQuestions.has(question.id) && (
              <div className="border-t border-neutral-200 bg-white p-5">
                <p className="font-['Inter'] text-sm text-gray-600">
                  {question.answer ||
                    "Câu trả lời sẽ được hiển thị ở đây. Trong phiên bản đầy đủ, bạn có thể xem câu trả lời chi tiết cho mỗi câu hỏi."}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
