import { HomepageFooter, HomepageHeader } from "@/components/homepage-redesign";
import { BlogFeedPage } from "@/components/post/feed/BlogFeedPage";

export function BlogPage() {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-slate-950">
      <HomepageHeader />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-20 pb-10">
        <BlogFeedPage title="Bảng tin" description="Cập nhật bài viết mới nhất từ cộng đồng" />
      </main>

      <HomepageFooter />
    </div>
  );
}
