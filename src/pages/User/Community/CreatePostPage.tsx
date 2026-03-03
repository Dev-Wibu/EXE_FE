import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PostStatus } from "@/interfaces/schema.types";
import { postManager } from "@/services/post.manager";
import { type Major, questionMajorManager } from "@/services/question-major.manager";
import { useAuthStore } from "@/stores/authStore";

export function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [majorId, setMajorId] = useState<number | undefined>(undefined);
  const [majors, setMajors] = useState<Major[]>([]);

  useEffect(() => {
    const fetchMajors = async () => {
      const result = await questionMajorManager.getAll();
      if (result.success && result.data) {
        const list = Array.isArray(result.data) ? result.data : (result.data.data ?? []);
        setMajors(list);
      }
    };
    fetchMajors();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    setSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await postManager.createPost({
        title: title.trim(),
        content: content.trim() || undefined,
        summary: summary.trim() || undefined,
        authorId: user?.id,
        majorId,
        coverImg: coverFile ?? undefined,
        tags: tagList.length > 0 ? tagList : undefined,
        status,
      });

      if (result.success) {
        toast.success("Đăng bài viết thành công!");
        navigate(-1);
      } else {
        toast.error(result.error ?? "Đăng bài viết thất bại");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi đăng bài viết");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tạo bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề bài viết"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung</Label>
              <Textarea
                id="content"
                placeholder="Nhập nội dung bài viết"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Tóm tắt</Label>
              <Textarea
                id="summary"
                placeholder="Nhập tóm tắt bài viết"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Ảnh bìa</Label>
              <Input id="cover" type="file" accept="image/*" onChange={handleFileChange} />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Xem trước ảnh bìa"
                  className="mt-2 max-h-48 rounded-md object-cover"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Chuyên ngành</Label>
              <Select
                value={majorId?.toString()}
                onValueChange={(v) => setMajorId(v ? Number(v) : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chuyên ngành" />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.majorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Thẻ</Label>
              <Input
                id="tags"
                placeholder="Nhập các thẻ, cách nhau bởi dấu phẩy"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang đăng..." : "Đăng bài"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("..")}>
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
