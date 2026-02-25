import { BookOpen, Filter, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractDataArray } from "@/lib/utils";
import { practiceSetManager } from "@/services";
import type { PracticeSet } from "@/services/practice-set.manager";
import { toast } from "sonner";

const levelBadgeMap: Record<string, string> = {
  INTERN: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  FRESHER: "bg-green-100 text-green-700 hover:bg-green-100",
  JUNIOR: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  MIDDLE: "bg-red-100 text-red-700 hover:bg-red-100",
};

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
        toast.error(response.error || "Không thể tải danh sách bộ luyện tập");
      }
    } catch (error) {
      console.error("Error loading practice sets:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSets = useMemo(() => {
    return practiceSets.filter((ps) => {
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          ps.practiceSetName?.toLowerCase().includes(lowerQuery) ||
          ps.objective?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }
      if (levelFilter !== "all" && ps.level !== levelFilter) {
        return false;
      }
      return true;
    });
  }, [practiceSets, searchQuery, levelFilter]);

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-white">Bộ Luyện Tập</h1>
            <p className="max-w-lg text-lg text-white/90">
              Chọn bộ luyện tập phù hợp với cấp độ của bạn để bắt đầu ôn tập!
            </p>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-14 w-14 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
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
                <SelectItem value="INTERN">Thực tập</SelectItem>
                <SelectItem value="FRESHER">Mới tốt nghiệp</SelectItem>
                <SelectItem value="JUNIOR">Mới vào nghề</SelectItem>
                <SelectItem value="MIDDLE">Trung cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Practice Sets Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredSets.map((ps) => (
          <Card
            key={ps.id}
            className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg"
            onClick={() => navigate(`/dashboard/practice/${ps.id}`)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-primary text-lg">{ps.practiceSetName}</CardTitle>
                <Badge className={levelBadgeMap[ps.level || ""] || "bg-gray-100 text-gray-700"}>
                  {ps.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-2">{ps.objective}</CardDescription>
              <div className="text-muted-foreground flex items-center gap-6 border-t pt-4 text-sm">
                {ps.major?.majorName && <span>🎓 {ps.major.majorName}</span>}
              </div>
              <Button className="w-full">Xem chi tiết</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSets.length === 0 && (
        <Card className="flex h-64 flex-col items-center justify-center gap-4">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">Không tìm thấy bộ luyện tập nào phù hợp</p>
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
    </div>
  );
}
