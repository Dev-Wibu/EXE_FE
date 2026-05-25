import { ArrowRight, BookOpen, Calendar, Search, Tag, TrendingUp, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/layouts";
import { HomepageHeader } from "@/components/homepage-redesign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Post } from "@/interfaces/schema.types";
import { formatDateTime } from "@/lib/formatting";
import { postManager } from "@/services/post.manager";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

export function BlogPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const dashboardPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Use getPublished() endpoint to get only published posts
      const response = await postManager.getPublished();
      if (response.success) {
        const allPosts = Array.isArray(response.data) ? response.data : [];
        setPosts(allPosts);
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Build categories from unique tags/majors
  const categories = (() => {
    const tagCounts = new Map<string, number>();
    let total = 0;
    posts.forEach((post) => {
      total++;
      post.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
      if (post.major?.name || post.major?.majorName) {
        const majorLabel = post.major.name || post.major.majorName || "";
        tagCounts.set(majorLabel, (tagCounts.get(majorLabel) || 0) + 1);
      }
    });
    const result = [{ name: "Tất cả", count: total }];
    tagCounts.forEach((count, name) => {
      result.push({ name, count });
    });
    return result.slice(0, 6);
  })();

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      <HomepageHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-50 via-white to-[#DCEEFF]/30 py-16 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#66B2FF]/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-72 w-72 rounded-full bg-[#A5C8F2]/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
              <BookOpen className="mr-2 h-4 w-4" />
              Blog
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
              Kiến thức & Hướng dẫn
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Cập nhật những bài viết mới nhất về kỹ năng phỏng vấn, xu hướng tuyển dụng và mẹo nghề
              nghiệp
            </p>

            {/* Search */}
            <div className="mx-auto max-w-xl">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  className="h-12 pl-10 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-12 lg:flex-row">
            {/* Blog Posts */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Bài viết mới nhất
                </h2>
                <Badge variant="outline" className="dark:border-slate-700">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Cập nhật hàng tuần
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {loading ? (
                  <div className="col-span-2 flex items-center justify-center py-16">
                    <Spinner size="lg" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="col-span-2 py-16 text-center">
                    <p className="text-muted-foreground">Chưa có bài viết nào</p>
                  </div>
                ) : (
                  [...posts].reverse().map((post) => (
                    <Card
                      key={post.postId}
                      className="group cursor-pointer transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => navigate(dashboardPath)}>
                      {/* Image */}
                      {post.coverImgUrl ? (
                        <div className="h-48 w-full overflow-hidden">
                          <img
                            src={post.coverImgUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 w-full bg-linear-to-br from-[#DCEEFF] to-[#A5C8F2] dark:from-slate-700 dark:to-slate-600" />
                      )}
                      <CardHeader>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {post.tags?.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs dark:bg-slate-700 dark:text-slate-300">
                              <Tag className="mr-1 h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                          {(post.major?.name || post.major?.majorName) && (
                            <Badge
                              variant="outline"
                              className="text-xs dark:border-slate-600 dark:text-slate-300">
                              {post.major?.name || post.major?.majorName}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-[#0047AB] dark:text-white dark:group-hover:text-[#66B2FF]">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 dark:text-slate-400">
                          {post.summary || post.content}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author?.name ?? "Ẩn danh"}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(post.creationDate)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full dark:border-slate-700"
                  onClick={() => navigate(dashboardPath)}>
                  Xem thêm bài viết
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80">
              {/* Categories */}
              <Card className="mb-6 dark:border-slate-700 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Button
                        key={category.name}
                        variant="ghost"
                        className="w-full justify-between dark:hover:bg-slate-700"
                        onClick={() => navigate(dashboardPath)}>
                        <span>{category.name}</span>
                        <Badge
                          variant="secondary"
                          className="text-xs dark:bg-slate-700 dark:text-slate-300">
                          {category.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card className="bg-linear-to-br from-[#0047AB] to-[#007BFF] text-white dark:from-[#0047AB]/80 dark:to-[#007BFF]/80">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Đăng ký nhận tin</CardTitle>
                  <CardDescription className="text-[#A5C8F2]">
                    Nhận bài viết mới nhất mỗi tuần
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      placeholder="Email của bạn"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/60"
                    />
                    <Button
                      className="w-full bg-white text-[#0047AB] hover:bg-slate-100"
                      onClick={() => navigate(isLoggedIn ? dashboardPath : "/signup")}>
                      Đăng ký
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
