import { ImagePlus, Send, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { invalidatePostFeedQueries } from "@/lib/post-feed";
import { postManager } from "@/services/post.manager";
import { type Major, questionMajorManager } from "@/services/question-major.manager";
import { useAuthStore } from "@/stores/authStore";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onCreated?: () => void;
}

export function CreatePostModal({ open, onOpenChange, onCreated }: CreatePostModalProps) {
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [majorId, setMajorId] = useState<number | undefined>(undefined);
  const [majors, setMajors] = useState<Major[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMajors = async () => {
      const result = await questionMajorManager.getAll();
      if (result.success && result.data) {
        const list = Array.isArray(result.data) ? result.data : (result.data.data ?? []);
        setMajors(list);
      }
    };
    void fetchMajors();
  }, []);

  const authorName = user?.name ?? "Bạn";
  const authorInitials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSummary("");
    setTagInput("");
    setTags([]);
    setCoverFile(null);
    setCoverPreview(null);
    setMajorId(undefined);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !user?.id) return;

    setSubmitting(true);
    try {
      const response = await postManager.createPost({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        authorId: user.id as number,
        majorId,
        tags: tags.length > 0 ? tags : undefined,
        coverImg: coverFile ?? undefined,
        status: "DRAFT",
      });

      if (response.success) {
        toast.success("Đăng bài thành công.");
        invalidatePostFeedQueries();
        resetForm();
        onOpenChange(false);
        onCreated?.();
      } else {
        toast.error(response.error ?? "Không thể đăng bài");
      }
    } catch {
      toast.error("Không thể đăng bài");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pt-5 pb-4">
          <DialogTitle className="text-center text-lg">Tạo bài viết</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-73px)] space-y-4 overflow-y-auto px-6 pt-2 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={authorName} />
              <AvatarFallback className="bg-[#0047AB]/10 text-sm font-semibold text-[#0047AB]">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{authorName}</p>
              <Badge variant="secondary" className="mt-0.5 text-[10px]">
                Đã đăng
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Tiêu đề *</Label>
            <Input
              placeholder="Đặt tiêu đề cho bài viết của bạn..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Nội dung *</Label>
            <Textarea
              placeholder={`${user?.name?.split(" ").pop() ?? "Bạn"} ơi, bạn đang nghĩ gì?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Tóm tắt</Label>
            <Textarea
              placeholder="Viết tóm tắt ngắn gọn (tùy chọn)..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Chuyên ngành</Label>
            <Select
              value={majorId !== undefined ? String(majorId) : ""}
              onValueChange={(val) => setMajorId(val ? Number(val) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chuyên ngành (tùy chọn)" />
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

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={coverPreview}
                  alt="Ảnh bìa"
                  className="h-44 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="border-muted hover:bg-muted/50 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-6 w-6 text-slate-400" />
                <span className="text-muted-foreground text-sm">Thêm ảnh bìa</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">
              <Tag className="mr-1 inline h-3 w-3" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập tag rồi nhấn Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}>
                Thêm
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 text-[#0047AB] dark:text-[#66B2FF]">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-muted rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky bottom-0 -mx-6 border-t px-6 pt-4 pb-2 backdrop-blur">
            <Button
              className="w-full gap-2 bg-[#0047AB] hover:bg-[#003580]"
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || submitting}>
              {submitting ? <Spinner size="sm" tone="white" /> : <Send className="h-4 w-4" />}
              Đăng bài
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
