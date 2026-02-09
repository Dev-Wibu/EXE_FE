import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postManager } from "@/services/post.manager";
import type { Post } from "@/interfaces/schema.types";

import { PostCard } from "./components/PostCard";

export function PostListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const result = await postManager.getAll();
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const allMajors = [...new Set(posts.map((p) => p.major?.name).filter(Boolean))] as string[];

  const filtered = posts.filter((p) => {
    if (tagFilter && !p.tags?.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) {
      return false;
    }
    if (majorFilter !== "all" && p.major?.name !== majorFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cộng đồng</h1>
          <p className="text-muted-foreground">Bài viết</p>
        </div>
        <Button onClick={() => navigate("create")}>
          <Plus className="mr-1 h-4 w-4" />
          Tạo bài viết mới
        </Button>
      </div>

      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        ⚠️ Tính năng danh sách bài viết đang sử dụng dữ liệu mẫu. API GET /api/posts cần được triển khai từ phía Backend.
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Lọc theo thẻ..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-48"
        />
        <Select value={majorFilter} onValueChange={setMajorFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Chuyên ngành" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên ngành</SelectItem>
            {allMajors.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết nào</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onClick={() => navigate(`${post.postId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
