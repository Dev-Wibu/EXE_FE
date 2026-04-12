import { 
  Search, 
  MessageSquare, 
  Linkedin, 
  Mail, 
  User as UserIcon,
  Star,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatManager } from "@/services/chat.manager";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MentorListPage() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredMentors = mentors.filter((m) =>
    (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.expertise || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.currentCompany || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = (mentor: any) => {
    navigate("/user?tab=messenger", { 
      state: { 
        openMentorId: mentor.id,
        mentorData: mentor 
      } 
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-12 lg:p-20">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100/40 blur-[100px] dark:bg-blue-900/10" />
      <div className="absolute top-1/2 -right-24 h-[500px] w-[500px] rounded-full bg-indigo-100/30 blur-[120px] dark:bg-indigo-900/10" />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-purple-100/30 blur-[80px] dark:bg-purple-900/10" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-16 flex flex-col gap-4 text-center md:text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:bg-blue-900/20">
            <CheckCircle2 className="h-4 w-4" />
            Đội ngũ chuyên gia
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Kết nối với <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mentors</span>
          </h1>
          <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Những chuyên gia hàng đầu sẵn sàng chia sẻ kiến thức, kinh nghiệm và thắp sáng con đường sự nghiệp của bạn.
          </p>
        </div>

        {/* Search Bar - Modern Floating Style */}
        <div className="mb-20 flex w-full max-w-2xl items-center rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 transition-all focus-within:ring-blue-400 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex h-12 w-12 items-center justify-center text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <Input
            placeholder="Tìm kiếm Mentor theo tên, kỹ năng hoặc công ty..."
            className="h-12 border-none bg-transparent text-lg focus-visible:ring-0 placeholder:text-slate-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mentor Cards Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-[2rem] bg-white p-8 shadow-sm dark:bg-slate-900">
                <div className="flex animate-pulse gap-8">
                  <div className="h-48 w-48 rounded-3xl bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-8 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-6 w-1/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-20 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[3rem] bg-white py-32 shadow-sm dark:bg-slate-900">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">Không tìm thấy Mentor</p>
              <p className="mt-2 text-slate-500">Hãy thử tìm kiếm với các từ khóa khác</p>
            </div>
          ) : (
            filteredMentors.map((mentor) => (
              <Card 
                key={mentor.id} 
                className="group relative overflow-hidden rounded-[2.5rem] border-0 bg-white/70 p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] dark:bg-slate-900/60 dark:hover:bg-slate-900"
              >
                <div className="flex flex-col gap-10 md:flex-row md:items-center">
                  {/* Left: Avatar with Ring */}
                  <div className="relative shrink-0 self-center md:self-auto">
                    <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 blur-xl transition-opacity group-hover:opacity-30" />
                    <Avatar className="h-48 w-48 rounded-[2rem] border-[6px] border-white shadow-xl ring-1 ring-slate-100 dark:border-slate-800 dark:ring-slate-700">
                      <AvatarImage src={mentor.avatarUrl} alt={mentor.name} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-4xl font-black text-slate-200">
                        {mentor.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Rating Overlay */}
                    <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-1.5 shadow-lg ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">{mentor.averageRating || "5.0"}</span>
                    </div>
                  </div>

                  {/* Right: Content Section */}
                  <div className="flex flex-1 flex-col p-2">
                    <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
                      <div className="text-center md:text-left">
                        <h3 className="text-3xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                          {mentor.name}
                        </h3>
                        <p className="mt-1 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-500 md:justify-start">
                          <CheckCircle2 className="h-4 w-4" />
                          {mentor.expertise || "Expert Mentor"}
                        </p>
                      </div>
                      
                      {/* Social Actions Buttons */}
                      <div className="flex gap-3">
                        {mentor.linkedInUrl && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl border-slate-100 bg-white shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900"
                            onClick={() => window.open(mentor.linkedInUrl, '_blank')}
                          >
                            <Linkedin className="h-5 w-5" />
                          </Button>
                        )}
                        {mentor.email && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl border-slate-100 bg-white shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900"
                            onClick={() => window.location.href = `mailto:${mentor.email}`}
                          >
                            <Mail className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mb-8 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-400">
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        Trực thuộc: <span className="text-slate-600 dark:text-slate-300">{mentor.currentCompany || "Đại diện tự do"}</span>
                      </div>
                      <p className="text-lg font-medium leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
                        {mentor.bio || "Mang đến giải pháp và định hướng chuyên nghiệp cho sự vươn tầm của các thế hệ trẻ."}
                      </p>
                    </div>

                    {/* Primary CTA */}
                    <div className="flex items-center gap-6">
                      <Button 
                        className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 text-lg font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-blue-500/40 active:scale-95"
                        onClick={() => handleStartChat(mentor)}
                      >
                        <MessageSquare className="mr-3 h-5 w-5" />
                        Bắt đầu hội thoại
                      </Button>
                      
                      <button className="hidden items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white md:flex">
                        Xem hồ sơ chi tiết
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
