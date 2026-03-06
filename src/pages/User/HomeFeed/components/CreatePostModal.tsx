import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { useCreatePost } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onCreated?: () => void;
}

export function CreatePostModal({ open, onOpenChange, onCreated }: CreatePostModalProps) {
  const { user } = useAuthStore();
  const createPost = useCreatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSummary("");
    setTagInput("");
    setTags([]);
    setCoverFile(null);
    setCoverPreview(null);
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

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !user?.id) return;

    const body: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      authorId: user.id,
      tags: tags.length > 0 ? tags : undefined,
      status: "PUBLISHED",
    };

    if (coverFile) {
      body.coverImg = coverFile;
    }

    createPost.mutate({ body } as never, {
      onSuccess: () => {
        toast.success("Đăng bài thành công!");
        queryClient.invalidateQueries({ queryKey: ["get", "/api/posts/feed"] });
        resetForm();
        onOpenChange(false);
        onCreated?.();
      },
      onError: () => toast.error("Không thể đăng bài"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài viết</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Tiêu đề bài viết *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Textarea
              placeholder="Nội dung bài viết *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div>
            <Textarea
              placeholder="Tóm tắt (tùy chọn)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập tag với Enter để thêm"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Thêm
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
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

          {/* Cover image */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {coverPreview ? (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Ảnh bìa"
                  className="h-40 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                Thêm ảnh bìa
              </Button>
            )}
          </div>

          <Button
            className="w-full bg-[#0047AB] hover:bg-[#003580]"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || createPost.isPending}>
            {createPost.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Đăng bài
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
