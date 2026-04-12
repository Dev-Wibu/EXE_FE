import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { chatManager } from "@/services/chat.manager";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  MentorActionPanel,
  MentorDetailHero,
  MentorHighlights,
  SimilarMentors,
} from "./components";

type MentorDocumentItem = {
  label: string;
  url: string;
};

function documentItems(mentor: SchemaMentorResponse): MentorDocumentItem[] {
  return [
    { label: "Giấy tờ định danh", url: mentor.identityImg },
    { label: "Bằng cấp", url: mentor.degreeImg },
    { label: "Tài liệu bổ sung", url: mentor.otherFile },
  ].filter(
    (item): item is MentorDocumentItem => typeof item.url === "string" && item.url.length > 0
  );
}

function buildMentorHighlights(mentor: SchemaMentorResponse): string[] {
  const highlights: string[] = [];

  if (mentor.yearsOfExperience && mentor.yearsOfExperience > 0) {
    highlights.push(`${mentor.yearsOfExperience} năm kinh nghiệm luyện phỏng vấn thực chiến.`);
  }

  if (mentor.totalSession && mentor.totalSession > 0) {
    highlights.push(`Đã đồng hành ${mentor.totalSession} phiên cùng học viên ở nhiều cấp độ.`);
  }

  if (mentor.currentCompany) {
    highlights.push(`Đang hoặc từng làm việc tại ${mentor.currentCompany}.`);
  }

  if (mentor.expertise) {
    highlights.push(`Thế mạnh trọng tâm: ${mentor.expertise}.`);
  }

  if (highlights.length === 0) {
    highlights.push("Có khả năng đồng hành 1-1 theo mục tiêu nghề nghiệp cá nhân hóa.");
    highlights.push("Phù hợp luyện tập CV review, mock interview và tối ưu câu trả lời STAR.");
    highlights.push("Sẵn sàng hỗ trợ xây dựng lộ trình luyện tập theo mốc thời gian.");
  }

  return highlights.slice(0, 4);
}

function buildSlaEstimate(mentor: SchemaMentorResponse | null): string {
  if (!mentor) {
    return "Thường phản hồi trong 24h";
  }

  if (mentor.active === false) {
    return "Có thể phản hồi chậm hơn 24h";
  }

  return "Thường phản hồi trong 24h";
}

export function MentorDetailPage() {
  const navigate = useNavigate();
  const { mentorId } = useParams<{ mentorId: string }>();

  const parsedMentorId = Number(mentorId);
  const isMentorIdValid = Number.isFinite(parsedMentorId) && parsedMentorId > 0;

  const [mentor, setMentor] = useState<SchemaMentorResponse | null>(null);
  const [allMentors, setAllMentors] = useState<SchemaMentorResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMentorIdValid) {
      setLoading(false);
      return;
    }

    const fetchMentorData = async () => {
      setLoading(true);
      try {
        const [detailRes, listRes] = await Promise.all([
          chatManager.getMentorDetail(parsedMentorId),
          chatManager.getAllMentors(),
        ]);

        if (detailRes.success && detailRes.data) {
          setMentor(detailRes.data);
        } else {
          toast.error("Không thể tải hồ sơ mentor");
        }

        if (listRes.success && listRes.data) {
          setAllMentors(listRes.data);
        }
      } catch (error) {
        console.error("Error fetching mentor detail:", error);
        toast.error("Đã xảy ra lỗi khi tải dữ liệu mentor");
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [isMentorIdValid, parsedMentorId]);

  const rating = useMemo(() => {
    const raw = mentor?.averageRating;
    return typeof raw === "number" ? raw.toFixed(1) : "0.0";
  }, [mentor?.averageRating]);

  const docs = useMemo(() => (mentor ? documentItems(mentor) : []), [mentor]);

  const highlights = useMemo(() => (mentor ? buildMentorHighlights(mentor) : []), [mentor]);

  const slaEstimate = useMemo(() => buildSlaEstimate(mentor), [mentor]);

  const similarMentors = useMemo(() => {
    if (!mentor || allMentors.length === 0) {
      return [];
    }

    return allMentors
      .filter((candidate) => candidate.id !== undefined && candidate.id !== mentor.id)
      .sort((candidateA, candidateB) => {
        const ratingDiff = (candidateB.averageRating || 0) - (candidateA.averageRating || 0);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }

        return (candidateB.totalSession || 0) - (candidateA.totalSession || 0);
      })
      .slice(0, 3);
  }, [allMentors, mentor]);

  const handleStartChat = () => {
    if (!mentor || mentor.id === undefined) {
      toast.error("Không đủ thông tin để bắt đầu hội thoại");
      return;
    }

    navigate("/user?tab=messenger", {
      state: {
        openMentorId: mentor.id,
        mentorData: mentor,
      },
    });
  };

  const handleBookNow = () => {
    if (!mentor || mentor.id === undefined) {
      toast.error("Không đủ thông tin để đặt lịch");
      return;
    }

    navigate("/user/mock-interview/schedule", {
      state: {
        preselectedMentorId: mentor.id,
      },
    });
  };

  const handleViewSimilarProfile = (targetMentor: SchemaMentorResponse) => {
    if (targetMentor.id === undefined) {
      toast.error("Không đủ thông tin để xem hồ sơ mentor");
      return;
    }

    navigate(`/user/mentors/${targetMentor.id}`);
  };

  if (!isMentorIdValid) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mentor không hợp lệ</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Đường dẫn hồ sơ mentor không đúng. Vui lòng quay lại danh sách mentor.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/user?tab=mentors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách Mentor
        </Button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="h-72 animate-pulse border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          <Card className="h-72 animate-pulse border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </section>
    );
  }

  if (!mentor) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Không tìm thấy mentor
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Hồ sơ mentor có thể đã bị ẩn hoặc chưa sẵn sàng.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/user?tab=mentors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách Mentor
        </Button>
      </section>
    );
  }

  return (
    <section className="relative h-full overflow-y-auto rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-50 via-white to-cyan-50/60 p-5 text-slate-900 md:p-6 dark:border-slate-800 dark:from-slate-950 dark:via-[#0a1a4f] dark:to-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute -top-16 right-16 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-500/25" />

      <div className="relative z-10 space-y-5">
        <MentorDetailHero
          mentor={mentor}
          ratingText={rating}
          onBack={() => navigate("/user?tab=mentors")}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Giới thiệu</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {mentor.bio ||
                  "Mentor chưa cập nhật phần giới thiệu. Bạn có thể bắt đầu hội thoại để trao đổi thêm về kinh nghiệm thực chiến và định hướng luyện tập."}
              </p>
            </Card>

            <MentorHighlights highlights={highlights} slaEstimate={slaEstimate} />

            <Card className="border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="mr-2 h-5 w-5 text-cyan-600 dark:text-cyan-200" />
                Tài liệu xác minh
              </h2>
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />

              {docs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Mentor chưa chia sẻ tài liệu xác minh trong hồ sơ công khai.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {docs.map((doc) => (
                    <a
                      key={doc.label}
                      href={doc.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 transition-colors hover:border-cyan-300/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                        {doc.label}
                      </span>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </Card>

            <SimilarMentors mentors={similarMentors} onViewProfile={handleViewSimilarProfile} />
          </div>

          <MentorActionPanel
            mentor={mentor}
            onBookNow={handleBookNow}
            onStartChat={handleStartChat}
          />
        </div>
      </div>
    </section>
  );
}
