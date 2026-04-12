import { Card } from "@/components/ui/card";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { chatManager } from "@/services/chat.manager";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { MentorFilters, MentorGridCard, MentorListHero } from "./components";

export function MentorListPage() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<SchemaMentorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("all");

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const res = await chatManager.getAllMentors();
        if (res.success && res.data) {
          setMentors(res.data);
        } else {
          toast.error("Không thể tải danh sách Mentor");
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
        toast.error("Đã xảy ra lỗi khi tải danh sách");
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const expertiseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          mentors
            .map((mentor) => mentor.expertise)
            .filter(
              (expertise): expertise is string =>
                typeof expertise === "string" && expertise.trim().length > 0
            )
        )
      ).slice(0, 8),
    [mentors]
  );

  const filteredMentors = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return mentors
      .filter((mentor) => {
        const matchSearch =
          normalizedSearch.length === 0 ||
          (mentor.name || "").toLowerCase().includes(normalizedSearch) ||
          (mentor.expertise || "").toLowerCase().includes(normalizedSearch) ||
          (mentor.currentCompany || "").toLowerCase().includes(normalizedSearch);

        const matchExpertise =
          selectedExpertise === "all" || (mentor.expertise || "") === selectedExpertise;

        return matchSearch && matchExpertise;
      })
      .sort((mentorA, mentorB) => {
        const ratingDiff = (mentorB.averageRating || 0) - (mentorA.averageRating || 0);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }

        return (mentorB.totalSession || 0) - (mentorA.totalSession || 0);
      });
  }, [mentors, searchQuery, selectedExpertise]);

  const mentorStats = useMemo(() => {
    const companies = new Set(mentors.map((mentor) => mentor.currentCompany).filter(Boolean));
    return {
      total: mentors.length,
      companies: companies.size,
      expertise: expertiseOptions.length,
    };
  }, [mentors, expertiseOptions.length]);

  const handleStartChat = (mentor: SchemaMentorResponse) => {
    if (mentor.id === undefined) {
      toast.error("Không đủ thông tin Mentor để bắt đầu hội thoại");
      return;
    }

    navigate("/user?tab=messenger", {
      state: {
        openMentorId: mentor.id,
        mentorData: mentor,
      },
    });
  };

  const handleViewProfile = (mentor: SchemaMentorResponse) => {
    if (mentor.id === undefined) {
      toast.error("Không đủ thông tin Mentor để xem hồ sơ");
      return;
    }

    navigate(`/user/mentors/${mentor.id}`);
  };

  return (
    <section className="relative h-full overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute -top-20 -left-14 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-900/25" />
      <div className="pointer-events-none absolute top-10 right-6 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-900/25" />

      <div className="relative flex h-full flex-col">
        <div className="px-5 pt-5 md:px-6 md:pt-6">
          <MentorListHero
            totalMentors={mentorStats.total}
            totalCompanies={mentorStats.companies}
            totalExpertise={mentorStats.expertise}
          />
        </div>

        <div className="px-5 pt-4 md:px-6">
          <MentorFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedExpertise={selectedExpertise}
            expertiseOptions={expertiseOptions}
            onSelectExpertise={setSelectedExpertise}
            onReset={() => {
              setSearchQuery("");
              setSelectedExpertise("all");
            }}
            matchedCount={filteredMentors.length}
          />
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 md:px-6 md:pb-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={index}
                  className="h-[290px] animate-pulse rounded-2xl border-slate-200/80 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/70"
                />
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border-slate-200/80 bg-white/85 py-20 text-center dark:border-slate-800 dark:bg-slate-900/75">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Không có mentor phù hợp với bộ lọc hiện tại
              </h2>
              <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                Hãy thử đổi từ khóa tìm kiếm hoặc bấm "Tất cả" để xem toàn bộ mạng lưới mentor.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredMentors.map((mentor, index) => (
                <MentorGridCard
                  key={mentor.id ?? `${mentor.name ?? "mentor"}-${index}`}
                  mentor={mentor}
                  onStartChat={handleStartChat}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
