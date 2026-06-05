import { MediaLightboxDialog, type MediaViewerItem } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SchemaMentorResponse } from "@/interfaces/schema.types";
import { formatCurrency } from "@/lib/formatting";
import { inferFileKind, openUrlInNewTab } from "@/lib/media-file-utils";
import { chatManager } from "@/services/chat.manager";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MentorActionPanel,
  MentorDetailHero,
  MentorHighlights,
  SimilarMentors,
} from "./components";
type MentorDocumentItem = {
  label: string;
  url: string;
};
function isActiveMentor(mentor: SchemaMentorResponse): boolean {
  return mentor.active === true;
}
function documentItems(
  mentor: SchemaMentorResponse,
  t: (key: string) => string
): MentorDocumentItem[] {
  return [
    {
      label: t("userMentordetail.identificationDocuments"),
      url: mentor.identityImg,
    },
    {
      label: t("common.degree"),
      url: mentor.degreeImg,
    },
    {
      label: t("userMentordetail.additionalDocuments"),
      url: mentor.otherFile,
    },
  ].filter(
    (item): item is MentorDocumentItem => typeof item.url === "string" && item.url.length > 0
  );
}
function buildMentorHighlights(
  mentor: SchemaMentorResponse,
  t: (key: string, opts?: Record<string, unknown>) => string
): string[] {
  const highlights: string[] = [];
  if (mentor.yearsOfExperience && mentor.yearsOfExperience > 0) {
    highlights.push(
      t("general.yearsOfPracticalInterviewTraining", {
        var_0: mentor.yearsOfExperience,
      })
    );
  }
  if (mentor.totalSession && mentor.totalSession > 0) {
    highlights.push(
      t("general.accompaniedSessionsWithStudentsOf", {
        var_0: mentor.totalSession,
      })
    );
  }
  if (mentor.currentCompany) {
    highlights.push(
      t("general.currentlyOrPreviouslyWorkingAt", {
        var_0: mentor.currentCompany,
      })
    );
  }
  if (mentor.expertise) {
    highlights.push(
      t("general.coreStrengths", {
        var_0: mentor.expertise,
      })
    );
  }
  if (highlights.length === 0) {
    highlights.push(t("userMentordetail.abilityToProvide11"));
    highlights.push(t("userMentordetail.suitableForPracticingCvReview"));
    highlights.push(t("userMentordetail.readyToHelpBuildA"));
  }
  return highlights.slice(0, 4);
}
function buildSlaEstimate(mentor: SchemaMentorResponse | null, t: (key: string) => string): string {
  if (!mentor) {
    return t("userMentordetail.usuallyRespondsWithin24Hours");
  }
  if (mentor.active === false) {
    return t("userMentordetail.responseMayTakeLongerThan");
  }
  return t("userMentordetail.usuallyRespondsWithin24Hours");
}
function buildVerificationTags(mentor: SchemaMentorResponse, t: (key: string) => string): string[] {
  const tags: string[] = [];
  if (mentor.identityImg) {
    tags.push(t("userMentordetail.identityVerified"));
  }
  if (mentor.degreeImg) {
    tags.push(t("userMentordetail.degreeProvided"));
  }
  if (mentor.otherFile) {
    tags.push(t("userMentordetail.additionalDocumentationIsAvailable"));
  }
  if (tags.length === 0) {
    tags.push(t("userMentordetail.updatingVerificationProfile"));
  }
  return tags;
}
function buildExpertiseTags(mentor: SchemaMentorResponse): string[] {
  if (!mentor.expertise) {
    return [];
  }
  const normalized = mentor.expertise
    .split(/[,/|]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  if (normalized.length === 0) {
    return [mentor.expertise.trim()];
  }
  return Array.from(new Set(normalized)).slice(0, 6);
}
export function MentorDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mentorId } = useParams<{
    mentorId: string;
  }>();
  const parsedMentorId = Number(mentorId);
  const isMentorIdValid = Number.isFinite(parsedMentorId) && parsedMentorId > 0;
  const [mentor, setMentor] = useState<SchemaMentorResponse | null>(null);
  const [allMentors, setAllMentors] = useState<SchemaMentorResponse[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);
  const [mentorUnavailableReason, setMentorUnavailableReason] = useState<
    "inactive" | "not-found" | null
  >(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isMentorIdValid) {
      setLoading(false);
      return;
    }
    const fetchMentorData = async () => {
      setLoading(true);
      setMentor(null);
      setMentorUnavailableReason(null);
      try {
        const [detailRes, listRes] = await Promise.all([
          chatManager.getMentorDetail(parsedMentorId),
          chatManager.getAllMentors(),
        ]);
        if (detailRes.success && detailRes.data) {
          if (isActiveMentor(detailRes.data)) {
            setMentor(detailRes.data);
          } else {
            setMentorUnavailableReason("inactive");
          }
        } else {
          setMentorUnavailableReason("not-found");
          toast.error(t("userMentordetail.unableToLoadMentorProfile"));
        }
        if (listRes.success && listRes.data) {
          setAllMentors(listRes.data.filter(isActiveMentor));
        }
      } catch (error) {
        console.error("Error fetching mentor detail:", error);
        setMentorUnavailableReason("not-found");
        toast.error(t("userMentordetail.anErrorOccurredWhileLoading"));
      } finally {
        setLoading(false);
      }
    };
    fetchMentorData();
  }, [isMentorIdValid, parsedMentorId, t]);
  const ratingText = useMemo(() => {
    const raw = mentor?.averageRating;
    return typeof raw === "number" ? raw.toFixed(1) : "0.0";
  }, [mentor?.averageRating]);
  const priceText = useMemo(() => {
    const pricePerMinute = mentor?.pricePerMinute;
    if (typeof pricePerMinute !== "number" || pricePerMinute <= 0) {
      return t("userMentordetail.priceNotUpdatedYet");
    }
    return t("general.min", {
      var_0: formatCurrency(pricePerMinute),
    });
  }, [mentor?.pricePerMinute, t]);
  const totalSessions = useMemo(() => {
    const raw = mentor?.totalSession;
    if (typeof raw !== "number" || raw <= 0) {
      return 0;
    }
    return raw;
  }, [mentor?.totalSession]);
  const docs = useMemo(() => (mentor ? documentItems(mentor, t) : []), [mentor, t]);
  const highlights = useMemo(() => (mentor ? buildMentorHighlights(mentor, t) : []), [mentor, t]);
  const verificationTags = useMemo(
    () => (mentor ? buildVerificationTags(mentor, t) : []),
    [mentor, t]
  );
  const expertiseTags = useMemo(() => (mentor ? buildExpertiseTags(mentor) : []), [mentor]);
  const slaEstimate = useMemo(() => buildSlaEstimate(mentor, t), [mentor, t]);
  const similarMentors = useMemo(() => {
    if (!mentor || allMentors.length === 0) {
      return [];
    }
    return allMentors
      .filter(
        (candidate) =>
          candidate.id !== undefined && candidate.id !== mentor.id && isActiveMentor(candidate)
      )
      .sort((candidateA, candidateB) => {
        const ratingDiff = (candidateB.averageRating || 0) - (candidateA.averageRating || 0);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }
        return (candidateB.totalSession || 0) - (candidateA.totalSession || 0);
      })
      .slice(0, 3);
  }, [allMentors, mentor]);
  const handleStartChat = () => {
    if (!mentor || mentor.id === undefined) {
      toast.error(t("common.notEnoughInformationToStartAConver"));
      return;
    }
    if (!isActiveMentor(mentor)) {
      toast.error(t("common.mentorIsCurrentlyInactive"));
      return;
    }
    navigate("/user?tab=messenger", {
      state: {
        openMentorId: mentor.id,
        mentorData: mentor,
      },
    });
  };
  const handleBookNow = () => {
    if (!mentor || mentor.id === undefined) {
      toast.error(t("userMentordetail.notEnoughInformationToSchedule"));
      return;
    }
    if (!isActiveMentor(mentor)) {
      toast.error(t("common.mentorIsCurrentlyInactive"));
      return;
    }
    navigate("/user/mock-interview/schedule", {
      state: {
        preselectedMentorId: mentor.id,
      },
    });
  };
  const handleViewSimilarProfile = (targetMentor: SchemaMentorResponse) => {
    if (!isActiveMentor(targetMentor)) {
      toast.error(t("common.mentorIsCurrentlyInactive"));
      return;
    }
    if (targetMentor.id === undefined) {
      toast.error(t("userMentordetail.notEnoughInformationToView"));
      return;
    }
    navigate(`/user/mentors/${targetMentor.id}`);
  };
  const handleOpenMentorDocument = (doc: MentorDocumentItem) => {
    const docKind = inferFileKind({
      fileName: doc.url,
    });
    if (docKind === "other") {
      openUrlInNewTab(doc.url);
      return;
    }
    setViewerItems([
      {
        id: `mentor-detail-doc-${doc.label}`,
        name: doc.label,
        src: doc.url,
        kind: docKind,
        requireAuth: true,
      },
    ]);
    setViewerOpen(true);
  };
  if (!isMentorIdValid) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {t("userMentordetail.mentorIsNotValid")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("userMentordetail.mentorProfilePathIsIncorrect")}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/user?tab=mentors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("userMentordetail.returnToMentorList")}
        </Button>
      </section>
    );
  }
  if (loading) {
    return (
      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="h-72 animate-pulse border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          <Card className="h-72 animate-pulse border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </section>
    );
  }
  if (!mentor) {
    const isInactiveMentor = mentorUnavailableReason === "inactive";
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {isInactiveMentor
            ? t("userMentordetail.mentorIsTemporarilyClosed")
            : t("common.noMentorFound")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isInactiveMentor
            ? t("userMentordetail.thisMentorIsNotCurrently")
            : t("userMentordetail.mentorProfileMayBeHidden")}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/user?tab=mentors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("userMentordetail.returnToMentorList")}
        </Button>
      </section>
    );
  }
  return (
    <section className="relative h-full overflow-y-auto rounded-3xl border border-slate-200/80 bg-linear-to-br from-blue-50 via-white to-cyan-50/60 p-5 text-slate-900 md:p-6 dark:border-slate-800 dark:from-slate-950 dark:via-[#0a1a4f] dark:to-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute -top-16 right-16 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-500/25" />

      <div className="relative z-10 space-y-5">
        <MentorDetailHero
          mentor={mentor}
          ratingText={ratingText}
          priceText={priceText}
          onBack={() => navigate("/user?tab=mentors")}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("common.introduce")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {mentor.bio || t("userMentordetail.mentorHasNotUpdatedThe")}
              </p>
            </Card>

            <MentorHighlights
              highlights={highlights}
              slaEstimate={slaEstimate}
              ratingText={ratingText}
              totalSessions={totalSessions}
              priceText={priceText}
              verificationTags={verificationTags}
              expertiseTags={expertiseTags}
            />

            <Card className="border-slate-200 bg-white/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="mr-2 h-5 w-5 text-cyan-600 dark:text-cyan-200" />
                {t("userMentordetail.verificationDocuments")}
              </h2>
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />

              {docs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("userMentordetail.mentorHasNotSharedVerification")}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {docs.map((doc) => (
                    <button
                      type="button"
                      key={doc.label}
                      onClick={() => handleOpenMentorDocument(doc)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 transition-colors hover:border-cyan-300/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                        {doc.label}
                      </span>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <SimilarMentors mentors={similarMentors} onViewProfile={handleViewSimilarProfile} />
          </div>

          <MentorActionPanel
            mentor={mentor}
            onBookNow={handleBookNow}
            onStartChat={handleStartChat}
          />
        </div>
      </div>

      <MediaLightboxDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        items={viewerItems}
        initialIndex={0}
      />
    </section>
  );
}
