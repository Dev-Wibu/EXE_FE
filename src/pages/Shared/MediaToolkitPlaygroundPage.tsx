import { FileText, ImageIcon, Link2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import {
  ImageZoomPreview,
  MediaLightboxDialog,
  PdfPreviewViewer,
  UniversalMediaUploader,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inferFileKind, normalizeRelativeAssetPath } from "@/lib/media-file-utils";
import { cn } from "@/lib/utils";

import type { MediaViewerItem, UploadTransportMode } from "@/components/shared";

const TEMP_IMAGE_URL = normalizeRelativeAssetPath("temp-file/Screenshot 2026-01-21 153334.png");
const TEMP_PDF_URL = normalizeRelativeAssetPath("temp-file/rereree.pdf");

function buildTempSampleItems(): MediaViewerItem[] {
  return [
    {
      id: "temp-image",
      name: "Ảnh mẫu temp-file",
      src: TEMP_IMAGE_URL,
      alt: "Ảnh mẫu temp-file",
      kind: "image",
      requireAuth: false,
    },
    {
      id: "temp-pdf",
      name: "PDF mẫu temp-file",
      src: TEMP_PDF_URL,
      kind: "pdf",
      requireAuth: false,
    },
  ];
}

export function MediaToolkitPlaygroundPage() {
  const tempSampleItems = useMemo(() => buildTempSampleItems(), []);

  const [transportMode, setTransportMode] = useState<UploadTransportMode>("mock");
  const [uploadEndpoint, setUploadEndpoint] = useState("");
  const [sequentialUpload, setSequentialUpload] = useState(true);
  const [bundleUpload, setBundleUpload] = useState(false);

  const [mediaItems, setMediaItems] = useState<MediaViewerItem[]>(tempSampleItems);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [pdfSource, setPdfSource] = useState<string | File | null>(TEMP_PDF_URL);
  const [pdfRequireAuth, setPdfRequireAuth] = useState(false);

  const preferredImageItem = useMemo(
    () => mediaItems.find((item) => (item.kind ?? inferFileKind(item)) === "image" && item.src),
    [mediaItems]
  );

  const handleAppendLocalFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const nextItems: MediaViewerItem[] = Array.from(files).map((file, index) => {
      const kind = inferFileKind({
        fileName: file.name,
        mimeType: file.type,
      });

      return {
        id: `local-${Date.now()}-${index}`,
        name: file.name,
        file,
        mimeType: file.type,
        kind,
        requireAuth: false,
      };
    });

    setMediaItems((previous) => [...nextItems, ...previous]);

    const localPdf = nextItems.find((item) => item.kind === "pdf" && item.file);
    if (localPdf?.file) {
      setPdfSource(localPdf.file);
      setPdfRequireAuth(false);
    }

    event.target.value = "";
  };

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleResetTempSamples = () => {
    setMediaItems(buildTempSampleItems());
    setPdfSource(TEMP_PDF_URL);
    setPdfRequireAuth(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <HomepageHeader />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Media Toolkit Playground (DEV)</CardTitle>
              <CardDescription>
                Khu thử nghiệm uploader ảnh/PDF, xem tài liệu PDF và trình xem toàn màn hình cho
                ảnh/PDF. Dữ liệu mẫu đang lấy từ thư mục temp-file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Ảnh mẫu: {TEMP_IMAGE_URL}</Badge>
                <Badge variant="outline">PDF mẫu: {TEMP_PDF_URL}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={handleResetTempSamples}>
                  Nạp lại dữ liệu temp-file
                </Button>
                <Label
                  htmlFor="local-media-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900">
                  <UploadCloud className="h-4 w-4" />
                  Thêm ảnh/PDF từ máy
                </Label>
                <Input
                  id="local-media-input"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handleAppendLocalFiles}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1) Uploader đa năng (Uppy)</CardTitle>
              <CardDescription>
                Hỗ trợ kéo thả, chọn nhiều tệp, copy-paste, tải theo đợt và tải liên tiếp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm",
                    transportMode === "mock" ? "border-[#0047AB] bg-[#DCEEFF]" : "border-slate-300"
                  )}
                  onClick={() => setTransportMode("mock")}>
                  Mock Upload (khuyên dùng khi BE sập)
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm",
                    transportMode === "xhr" ? "border-[#0047AB] bg-[#DCEEFF]" : "border-slate-300"
                  )}
                  onClick={() => setTransportMode("xhr")}>
                  XHR Upload (endpoint thật)
                </button>

                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sequentialUpload}
                    onChange={(event) => setSequentialUpload(event.target.checked)}
                  />
                  Tải liên tiếp (tuần tự)
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bundleUpload}
                    onChange={(event) => setBundleUpload(event.target.checked)}
                  />
                  Gộp theo nhóm (1 request)
                </label>
              </div>

              {transportMode === "xhr" && (
                <div className="space-y-2">
                  <Label htmlFor="uploader-endpoint">Endpoint upload</Label>
                  <Input
                    id="uploader-endpoint"
                    value={uploadEndpoint}
                    onChange={(event) => setUploadEndpoint(event.target.value)}
                    placeholder="Ví dụ: https://api.example.com/upload"
                  />
                </div>
              )}

              <UniversalMediaUploader
                transportMode={transportMode}
                endpoint={uploadEndpoint || undefined}
                sequentialUpload={sequentialUpload}
                bundleUpload={bundleUpload}
                acceptedFileTypes={["image/*", ".pdf", "application/pdf"]}
                maxFileSizeMB={50}
                maxNumberOfFiles={50}
                title="Uploader ảnh/PDF dùng chung"
                description="Thử drag-drop, paste, upload nhiều tệp và theo dõi trạng thái upload."
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>2) Preview PDF linh hoạt</CardTitle>
                <CardDescription>
                  Mặc định tải PDF bằng fetch + Authorization và render trong app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPdfSource(TEMP_PDF_URL)}>
                    Dùng PDF mẫu temp-file
                  </Button>
                  <Label
                    htmlFor="local-pdf-input"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900">
                    <FileText className="h-4 w-4" />
                    Chọn PDF local
                  </Label>
                  <Input
                    id="local-pdf-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      setPdfSource(file);
                      setPdfRequireAuth(false);
                      event.target.value = "";
                    }}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pdfRequireAuth}
                    onChange={(event) => setPdfRequireAuth(event.target.checked)}
                    disabled={!(typeof pdfSource === "string")}
                  />
                  Yêu cầu Authorization khi tải từ URL
                </label>

                <PdfPreviewViewer source={pdfSource} requireAuth={pdfRequireAuth} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3) Preview ảnh phóng to</CardTitle>
                <CardDescription>
                  Component nhanh để click ảnh và mở fullscreen với zoom/rotate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageZoomPreview
                  src={preferredImageItem?.src ?? TEMP_IMAGE_URL}
                  alt="Ảnh demo zoom"
                  title="Xem ảnh phóng to"
                  className="w-full"
                  imageClassName="max-h-96"
                  requireAuth={false}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>4) Trình xem fullscreen cho nhiều ảnh/PDF</CardTitle>
              <CardDescription>
                Hỗ trợ next/prev, zoom, xoay và mở/tải nhanh theo từng loại media.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mediaItems.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có media để hiển thị.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {mediaItems.map((item, index) => {
                    const itemKind = item.kind ?? inferFileKind(item);

                    return (
                      <div key={item.id} className="overflow-hidden rounded-lg border bg-white">
                        <div className="flex h-36 items-center justify-center bg-slate-100 dark:bg-slate-900">
                          {itemKind === "image" && item.src ? (
                            <img
                              src={item.src}
                              alt={item.alt ?? item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : itemKind === "image" ? (
                            <ImageIcon className="h-8 w-8 text-slate-500" />
                          ) : itemKind === "pdf" ? (
                            <FileText className="h-8 w-8 text-rose-500" />
                          ) : (
                            <Link2 className="h-8 w-8 text-slate-500" />
                          )}
                        </div>

                        <div className="space-y-2 p-3">
                          <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                          <Badge variant="outline">{itemKind.toUpperCase()}</Badge>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleOpenViewer(index)}>
                            Mở fullscreen
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <MediaLightboxDialog
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                items={mediaItems}
                initialIndex={viewerIndex}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
