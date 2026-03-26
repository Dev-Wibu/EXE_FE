import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

interface CreatePostPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePostPage({ onSuccess, onCancel }: CreatePostPageProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [majorId, setMajorId] = useState<number | undefined>(undefined);
  const [majors, setMajors] = useState<Major[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);

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

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    // Commit any un-submitted tag still in the input
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim()] : tags;

    setSubmitting(true);
    try {
      const result = await postManager.createPost({
        title: title.trim(),
        content: content.trim() || undefined,
        summary: summary.trim() || undefined,
        authorId: user?.id,
        majorId,
        coverImg: coverFile ?? undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
        status,
      });

      if (result.success) {
        toast.success("Đăng bài viết thành công!");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(-1);
        }
      } else {
        toast.error(result.error ?? "Đăng bài viết thất bại");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi đăng bài viết");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("..");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tạo bài viết</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-4 px-6 pt-6 pb-24">
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
                <Label>Thẻ</Label>
                <div
                  className="border-input bg-background flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border px-3 py-2 text-sm"
                  onClick={() => tagInputRef.current?.focus()}>
                  {tags.map((tag, i) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-black/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(i);
                        }}
                        aria-label={`Xóa thẻ ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder={
                      tags.length === 0 ? "Nhập thẻ, nhấn Enter hoặc dấu phẩy để thêm" : ""
                    }
                    className="placeholder:text-muted-foreground min-w-[160px] flex-1 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 flex gap-3 border-t px-6 py-4 backdrop-blur">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang đăng..." : "Đăng bài"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
