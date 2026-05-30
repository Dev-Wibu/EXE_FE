import { ArrowRight, Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HeroBackground } from "@/components/homepage-redesign";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export function HomepageHero() {
  const navigate = useNavigate();
  useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      navigate(`/enterprise/companies?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/enterprise/companies");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="hero-gradient relative min-h-screen pt-24 pb-16">
      {/* Interactive canvas background */}
      <HeroBackground className="z-0" />

      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-white/30 dark:to-slate-950/40" />

      {/* Hero Content - Title & Subtitle */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 py-12 md:py-24">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-white">
            Mô phỏng quy trình tuyển dụng <span className="text-[#0058be]">Kỹ sư Phần mềm</span> thế
            hệ mới
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Luyện tập kỹ năng phỏng vấn, thử thách thuật toán và khám phá môi trường làm việc tại
            các tập đoàn công nghệ hàng đầu thông qua AI.
          </p>
        </div>

        {/* Hero Search Bar */}
        <div className="mx-auto mb-6 max-w-2xl">
          <div className="group relative">
            {/* Glow effect behind the card */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#0058be] to-[#2170e4] opacity-30 blur transition duration-1000 group-hover:opacity-50 dark:opacity-40 dark:group-hover:opacity-60" />

            {/* Search Card */}
            <div className="relative flex items-center rounded-xl border border-slate-200/60 bg-white/80 p-3 shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
              <div className="flex items-center pr-4 pl-3">
                <Building2 className="h-5 w-5 text-[#0058be]" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm công ty nổi bật (AI, Fintech, E-commerce...)"
                className="flex-1 border-none bg-transparent py-4 pr-4 pl-0 text-base text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none dark:text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={handleSearch}
                className="mr-1 flex items-center gap-2 bg-[#0058be] px-6 py-3 font-medium hover:bg-[#004395]">
                <span>Khám phá</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
