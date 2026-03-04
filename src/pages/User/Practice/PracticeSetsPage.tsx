import {
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatting";
import { cn, extractDataArray } from "@/lib/utils";
import { practiceSetManager } from "@/services";
import type { PracticeSet } from "@/services/practice-set.manager";

const levelBadgeMap: Record<string, string> = {
  INTERN: "bg-blue-100 text-blue-700",
  FRESHER: "bg-green-100 text-green-700",
  JUNIOR: "bg-yellow-100 text-yellow-700",
  MIDDLE: "bg-red-100 text-red-700",
};

function PracticeSetCard({
  ps,
  index,
  navigate,
}: {
  ps: PracticeSet;
  index: number;
  navigate: (path: string) => void;
}) {
  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
      onClick={() => navigate(`/user/practice/${ps.id}`)}>
      <CardContent className="flex items-center gap-5 p-5">
        {/* Index badge */}
        <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
          <span className="text-primary text-xl font-bold">{index + 1}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-foreground line-clamp-1 text-base">
            {ps.practiceSetName ?? "Bộ luyện tập"}
          </CardTitle>
          {ps.objective && (
            <CardDescription className="mt-0.5 line-clamp-2 text-sm">
              {ps.objective}
            </CardDescription>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ps.level && (
              <Badge
                className={cn("text-xs", levelBadgeMap[ps.level] ?? "bg-gray-100 text-gray-700")}>
                {ps.level}
              </Badge>
            )}
            {ps.major?.majorName && (
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="mr-1 h-3 w-3" />
                {ps.major.majorName}
              </Badge>
            )}
            {ps.startDate && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(ps.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/practice/${ps.id}`);
          }}>
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionGroupCard({
  index,
  sets,
  navigate,
}: {
  index: number;
  sets: PracticeSet[];
  navigate: (path: string) => void;
}) {
  const first = sets[0];
  const sessionId = first.interviewSessionId;
  const dayCount = sets.length;

  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
      onClick={() => navigate(`/user/practice/session/${sessionId}`)}>
      <CardContent className="flex items-center gap-5 p-5">
        {/* Index badge */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <span className="text-xl font-bold text-amber-600">{index + 1}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-foreground line-clamp-1 text-base">
            Lộ trình {dayCount} ngày — Phiên phỏng vấn #{sessionId}
          </CardTitle>
          {first.objective && (
            <CardDescription className="mt-0.5 line-clamp-2 text-sm">
              {first.objective}
            </CardDescription>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100 text-xs text-amber-700 hover:bg-amber-100">
              <Sparkles className="mr-1 h-3 w-3" />
              {dayCount} ngày
            </Badge>
            {first.level && (
              <Badge
                className={cn(
                  "text-xs",
                  levelBadgeMap[first.level] ?? "bg-gray-100 text-gray-700"
                )}>
                {first.level}
              </Badge>
            )}
            {first.major?.majorName && (
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="mr-1 h-3 w-3" />
                {first.major.majorName}
              </Badge>
            )}
            {first.startDate && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(first.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/practice/session/${sessionId}`);
          }}>
          Xem lộ trình
        </Button>
      </CardContent>
    </Card>
  );
}

export function PracticeSetsPage() {
  const navigate = useNavigate();
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await practiceSetManager.getAll();
      if (response.success) {
        setPracticeSets(extractDataArray<PracticeSet>(response));
      } else {
        toast.error(response.error ?? "Không thể tải danh sách bộ luyện tập");
      }
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSets = useMemo(() => {
    return practiceSets.filter((ps) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !ps.practiceSetName?.toLowerCase().includes(q) &&
          !ps.objective?.toLowerCase().includes(q)
        )
          return false;
      }
      if (levelFilter !== "all" && ps.level !== levelFilter) return false;
      return true;
    });
  }, [practiceSets, searchQuery, levelFilter]);

  // Tách thành 2 nhóm: AI-linked (có interviewSessionId) và standalone
  const aiLinkedSets = useMemo(
    () => filteredSets.filter((ps) => ps.interviewSessionId != null),
    [filteredSets]
  );
  const standaloneSets = useMemo(
    () => filteredSets.filter((ps) => ps.interviewSessionId == null),
    [filteredSets]
  );

  // Gom nhóm các practice-set AI theo interviewSessionId — mỗi session = 1 thẻ
  const sessionGroups = useMemo(() => {
    const map = new Map<number, PracticeSet[]>();
    for (const ps of aiLinkedSets) {
      const key = ps.interviewSessionId!;
      const group = map.get(key) ?? [];
      group.push(ps);
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [aiLinkedSets]);

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">Bộ Luyện Tập</h1>
            </div>
            <p className="max-w-lg text-lg text-white/90">
              Luyện tập theo lộ trình được AI tạo ra từ kết quả phỏng vấn của bạn.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/user/ai-interview/setup")}>
              <Plus className="mr-2 h-5 w-5" />
              Bắt đầu phỏng vấn AI
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[300px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mục tiêu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
            Cấp độ:
          </span>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
              <SelectItem value="FRESHER">Fresher</SelectItem>
              <SelectItem value="JUNIOR">Junior</SelectItem>
              <SelectItem value="MIDDLE">Middle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-5 p-5">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-24 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* Section 1: Lộ trình từ AI */}
          {sessionGroups.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-foreground text-2xl font-bold">Lộ trình từ AI</h2>
                <p className="text-muted-foreground text-sm">
                  Các lộ trình được tạo tự động từ kết quả phỏng vấn AI
                </p>
              </div>
              <div className="space-y-4">
                {sessionGroups.map((sets, i) => (
                  <SessionGroupCard
                    key={sets[0].interviewSessionId}
                    sets={sets}
                    index={i}
                    navigate={navigate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Bộ luyện tập tự học */}
          {standaloneSets.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-foreground text-2xl font-bold">Bộ luyện tập tự học</h2>
                <p className="text-muted-foreground text-sm">Các bộ luyện tập được tạo thủ công</p>
              </div>
              <div className="space-y-4">
                {standaloneSets.map((ps, i) => (
                  <PracticeSetCard key={ps.id} ps={ps} index={i} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state khi filter không khớp */}
          {filteredSets.length === 0 && practiceSets.length > 0 && (
            <Card className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  Không tìm thấy bộ luyện tập nào phù hợp
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Hãy thử điều chỉnh bộ lọc để tìm kết quả khác
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setLevelFilter("all");
                }}>
                <Filter className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </Card>
          )}

          {/* Empty state khi không có bộ luyện tập nào */}
          {practiceSets.length === 0 && (
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <ExternalLink className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Chưa có bộ luyện tập nào</CardTitle>
                <CardDescription className="text-white/90">
                  Hoàn thành buổi phỏng vấn AI để nhận lộ trình luyện tập cá nhân hóa
                </CardDescription>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate("/user/ai-interview/setup")}>
                  Bắt đầu phỏng vấn AI
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
