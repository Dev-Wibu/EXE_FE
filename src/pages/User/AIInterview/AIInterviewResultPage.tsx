import { ArrowLeft, Plus, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockInterviewResult } from "@/mocks/interviews.mock";

export function AIInterviewResultPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // In a real app, we would fetch the result based on id
  void id;
  const result = mockInterviewResult;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/ai-interview")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Kết quả Đánh giá Phỏng vấn AI</h1>
            <p className="text-muted-foreground text-sm">{result.title}</p>
          </div>
        </div>

        {/* Score Card */}
        <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF]">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-lg text-white/80">Điểm Tổng thể</p>
            <div className="flex items-center gap-2">
              <Star className="h-10 w-10 fill-yellow-400 text-yellow-400" />
              <span className="text-6xl font-bold text-white">{result.overallScore}</span>
              <span className="mt-4 text-2xl text-white/70">/10</span>
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30">Kết luận: Rất Tốt</Badge>
            <p className="max-w-2xl text-white/90">{result.conclusion}</p>
          </CardContent>
        </Card>

        {/* Strengths and Improvements */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Strengths */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-lg">✅ Điểm Mạnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm">👍</span>
                  <p className="text-muted-foreground text-sm leading-relaxed">{strength}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-lg">⚠️ Cần Cải thiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm">👇</span>
                  <p className="text-muted-foreground text-sm leading-relaxed">{improvement}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
            Xem lại Câu hỏi đã trả lời
          </Button>
          <Button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            <Plus className="mr-2 h-4 w-4" />
            Bắt đầu Buổi Phỏng vấn Mới
          </Button>
        </div>
      </div>
    </div>
  );
}
