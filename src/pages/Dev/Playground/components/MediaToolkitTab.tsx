import { FileText, ImageIcon, Link2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { addDays } from "date-fns";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import {
  DateTimePicker,
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

function buildTempSampleItems(t: (key: string) => string): MediaViewerItem[] {
  return [
    {
      id: "temp-image",
      name: t("adminUsermanagement.hide"),
      src: TEMP_IMAGE_URL,
      alt: t("adminUsermanagement.hide"),
      kind: "image",
      requireAuth: false,
    },
    {
      id: "temp-pdf",
      name: t("sharedMediatoolkitplaygroundpage.samplePdf"),
      src: TEMP_PDF_URL,
      kind: "pdf",
      requireAuth: false,
    },
  ];
}

export function MediaToolkitTab() {
  const { t } = useTranslation();
  const tempSampleItems = useMemo(() => buildTempSampleItems(t), [t]);

  const [transportMode, setTransportMode] = useState<UploadTransportMode>("mock");
  const [uploadEndpoint, setUploadEndpoint] = useState("");
  const [sequentialUpload, setSequentialUpload] = useState(true);
  const [bundleUpload, setBundleUpload] = useState(false);

  const [mediaItems, setMediaItems] = useState<MediaViewerItem[]>(tempSampleItems);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [pdfSource, setPdfSource] = useState<string | File | null>(TEMP_PDF_URL);
  const [pdfRequireAuth, setPdfRequireAuth] = useState(false);

  const [date1, setDate1] = useState<Date | null>(new Date());
  const [date2, setDate2] = useState<Date | null>(null);
  const [date3, setDate3] = useState<Date | null>(new Date());
  const [date4, setDate4] = useState<Date | null>(new Date());
  const [date5, setDate5] = useState<Date | null>(new Date());

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
    setMediaItems(buildTempSampleItems(t));
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
                {t("sharedMediatoolkitplaygroundpage.playgroundUploaderDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {t("sharedMediatoolkitplaygroundpage.samplePhoto")} {TEMP_IMAGE_URL}
                </Badge>
                <Badge variant="outline">
                  {t("sharedMediatoolkitplaygroundpage.samplePdf")} {TEMP_PDF_URL}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={handleResetTempSamples}>
                  {t("sharedMediatoolkitplaygroundpage.reloadTempFileData")}
                </Button>
                <Label
                  htmlFor="local-media-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900">
                  <UploadCloud className="h-4 w-4" />
                  {t("sharedMediatoolkitplaygroundpage.addPhotosPdfsFromYour")}
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
              <CardTitle className="text-xl font-bold">
                Shared DateTime Picker Playground (DEV)
              </CardTitle>
              <CardDescription>
                Test interactive instances of the new premium DateTimePicker component supporting
                quick presets, scroll wheel time alignment, and role themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    1. Standard (24h format)
                  </Label>
                  <DateTimePicker
                    value={date1}
                    onChange={setDate1}
                    placeholder={t("general.selectDateTime")}
                    hour12={false}
                  />
                  <p className="font-mono text-[11px] text-slate-500">
                    Value: {date1 ? date1.toISOString() : "null"}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    2. 12h Format (with AM/PM)
                  </Label>
                  <DateTimePicker
                    value={date2}
                    onChange={setDate2}
                    placeholder="dd/mm/yyyy --:-- --"
                    hour12={true}
                  />
                  <p className="font-mono text-[11px] text-slate-500">
                    Value: {date2 ? date2.toISOString() : "null"}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    3. Date Only Picker
                  </Label>
                  <DateTimePicker value={date3} onChange={setDate3} showTime={false} />
                  <p className="font-mono text-[11px] text-slate-500">
                    Value: {date3 ? date3.toISOString() : "null"}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <Label className="text-xs font-bold text-emerald-600 uppercase">
                    4. Mentor Theme (Green, Step 15)
                  </Label>
                  <DateTimePicker
                    value={date4}
                    onChange={setDate4}
                    themeVariant="mentor"
                    minuteStep={15}
                  />
                  <p className="font-mono text-[11px] text-slate-500">
                    Value: {date4 ? date4.toISOString() : "null"}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <Label className="text-xs font-bold text-blue-600 uppercase">
                    5. User Theme (Blue, Limit +7 Days)
                  </Label>
                  <DateTimePicker
                    value={date5}
                    onChange={setDate5}
                    themeVariant="user"
                    minDate={new Date()}
                    maxDate={addDays(new Date(), 7)}
                  />
                  <p className="font-mono text-[11px] text-slate-500">
                    Value: {date5 ? date5.toISOString() : "null"}
                  </p>
                </div>

                <div className="flex flex-col justify-center space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/10">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    💡 Test Tips:
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-500">
                    <li>
                      Click the <strong>Month Year</strong> label in the header to select directly.
                    </li>
                    <li>Presets on the left allow quick date selections.</li>
                    <li>Theme variant matches User (Blue) and Mentor (Green) portals.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sharedMediatoolkitplaygroundpage.uploaderVersatileUppy")}</CardTitle>
              <CardDescription>
                {t("sharedMediatoolkitplaygroundpage.supportDragDropCopyPaste")}
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
                  {t("sharedMediatoolkitplaygroundpage.mockUploadRecommendedWhenBe")}
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm",
                    transportMode === "xhr" ? "border-[#0047AB] bg-[#DCEEFF]" : "border-slate-300"
                  )}
                  onClick={() => setTransportMode("xhr")}>
                  {t("sharedMediatoolkitplaygroundpage.xhrUploadRealEndpoint")}
                </button>

                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sequentialUpload}
                    onChange={(event) => setSequentialUpload(event.target.checked)}
                  />
                  {t("sharedMediatoolkitplaygroundpage.continuousSequentialLoading")}
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bundleUpload}
                    onChange={(event) => setBundleUpload(event.target.checked)}
                  />
                  {t("sharedMediatoolkitplaygroundpage.groupByGroup1Request")}
                </label>
              </div>

              {transportMode === "xhr" && (
                <div className="space-y-2">
                  <Label htmlFor="uploader-endpoint">Endpoint upload</Label>
                  <Input
                    id="uploader-endpoint"
                    value={uploadEndpoint}
                    onChange={(event) => setUploadEndpoint(event.target.value)}
                    placeholder={t("sharedMediatoolkitplaygroundpage.exampleUrl")}
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
                title={t("sharedMediatoolkitplaygroundpage.sharedImagePdfUploader")}
                description={t("sharedMediatoolkitplaygroundpage.tryDragDropUpload")}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("sharedMediatoolkitplaygroundpage.2FlexiblePdfPreview")}</CardTitle>
                <CardDescription>
                  {t("sharedMediatoolkitplaygroundpage.defaultLoadPdfFetchAuth")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPdfSource(TEMP_PDF_URL)}>
                    {t("general.text")}
                  </Button>
                  <Label
                    htmlFor="local-pdf-input"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900">
                    <FileText className="h-4 w-4" />
                    {t("sharedMediatoolkitplaygroundpage.selectPdfLocal")}
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
                  {t("sharedMediatoolkitplaygroundpage.requireAuthorizationWhenDownloadingFrom")}
                </label>

                <PdfPreviewViewer source={pdfSource} requireAuth={pdfRequireAuth} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("sharedMediatoolkitplaygroundpage.3PreviewEnlargedImage")}</CardTitle>
                <CardDescription>
                  {t("sharedMediatoolkitplaygroundpage.quickComponentClickToFullscreen")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageZoomPreview
                  src={preferredImageItem?.src ?? TEMP_IMAGE_URL}
                  alt={t("sharedMediatoolkitplaygroundpage.zoomDemoImage")}
                  title={t("sharedMediatoolkitplaygroundpage.seeEnlargedPhoto")}
                  className="w-full"
                  imageClassName="max-h-96"
                  requireAuth={false}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("sharedMediatoolkitplaygroundpage.fullscreenViewerMultiple")}
              </CardTitle>
              <CardDescription>
                {t("sharedMediatoolkitplaygroundpage.supportNextPrevZoomRotate")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mediaItems.length === 0 ? (
                <p className="text-sm text-slate-500">{t("common.notYet")}</p>
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
                            {t("sharedMediatoolkitplaygroundpage.openFullscreen")}
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
