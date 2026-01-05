import { BookOpen, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  fetchQuestionSets,
  mockIndustries,
  mockLevels,
  type QuestionSet,
} from "@/mocks/questions.mock";

// Map level to badge variant and colors
const levelBadgeMap: Record<string, { className: string }> = {
  Fresher: { className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  "Junior/Mid": { className: "bg-green-100 text-green-700 hover:bg-green-100" },
  "Mid-level": { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  Senior: { className: "bg-red-100 text-red-700 hover:bg-red-100" },
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
            <h1 className="text-3xl font-bold text-white">Ngân hàng câu hỏi</h1>
            <p className="max-w-lg text-lg text-white/90">
              Hãy thử luyện tập trước với bộ câu hỏi để chuẩn bị tốt nhất cho buổi phỏng vấn!
            </p>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-14 w-14 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div className="space-y-6">
        {/* Title */}
        <h2 className="text-foreground text-2xl font-bold">Bộ Câu Hỏi</h2>

        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative min-w-[300px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Tìm kiếm bộ câu hỏi, ví dụ: Java, React, SQL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Industry Filter */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
                Ngành:
              </span>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockIndustries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
                Cấp độ:
              </span>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Question Set Cards Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          <Card className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
              <Search className="text-muted-foreground h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Không tìm thấy bộ câu hỏi nào phù hợp</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Hãy thử điều chỉnh bộ lọc để tìm kết quả khác
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedIndustry("Tất cả Ngành");
                setSelectedLevel("Tất cả Cấp độ");
              }}>
              <Filter className="mr-2 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </Card>
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
  const levelStyle = levelBadgeMap[questionSet.level] || { className: "bg-gray-100 text-gray-700" };

  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-primary text-lg">{questionSet.title}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {questionSet.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={levelStyle.className}>{questionSet.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-2">{questionSet.description}</CardDescription>

        {/* Metadata Row */}
        <div className="text-muted-foreground flex items-center gap-6 border-t pt-4 text-sm">
          <span>📝 {questionSet.questionCount} câu hỏi</span>
          <span>🏢 {questionSet.industry}</span>
        </div>

        {/* View Detail Button */}
        <Button className="w-full">Xem Chi tiết</Button>
      </CardContent>
    </Card>
  );
}
