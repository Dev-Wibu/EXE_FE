import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Check, User, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
export function SelectRolePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMentor = user?.role?.toUpperCase() === "MENTOR" || user?.role?.toLowerCase() === "mentor";
  const handleUserSelect = () => {
    navigate("/signup?role=user");
  };
  const handleMentorSelect = () => {
    if (isMentor) {
      navigate("/mentor");
      return;
    }
    navigate("/mentor-register");
  };
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-slate-50 via-blue-50/70 to-[#DCEEFF]/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0047AB]/10 blur-3xl dark:bg-[#66B2FF]/10" />
      </div>

      <HomepageHeader />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white">
              {t("authSelectrolepage.welcomeTo")}{" "}
              <span className="bg-linear-to-r from-[#0047AB] to-[#007BFF] bg-clip-text text-transparent dark:from-[#66B2FF] dark:to-[#A5C8F2]">
                INBLUE AI Interview
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 md:text-lg dark:text-slate-300">
              {t("compShared.select")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/40">
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0047AB]/10 dark:bg-[#0047AB]/25">
                  <User className="h-8 w-8 text-[#0047AB] dark:text-[#66B2FF]" />
                </div>
                <CardTitle className="mt-1 text-slate-900 dark:text-white">
                  {t("common.user")}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  {t("authSelectrolepage.practiceInterviewsWithAiAnd")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <BenefitItem text={t("authSelectrolepage.practiceInterviewsWithSmartAi")} />
                  <BenefitItem text={t("authSelectrolepage.receiveDetailedFeedbackFromMentor")} />
                  <BenefitItem text={t("adminPostmanagement.card")} />
                </div>

                <Button
                  className="w-full bg-[#0047AB] text-white hover:bg-[#003A8C] dark:bg-[#005FD1] dark:hover:bg-[#4A90FF]"
                  onClick={handleUserSelect}>
                  {t("common.turnOn")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/40">
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/35">
                  <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                </div>
                <CardTitle className="mt-1 text-slate-900 dark:text-white">Mentor</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  {isMentor
                    ? t("authSelectrolepage.quickAccessToYourMentor")
                    : t("enterpriseCompanydetail.share")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  {isMentor ? (
                    <>
                      <BenefitItem text={t("common.manageInterviewSessions")} />
                      <BenefitItem text={t("authSelectrolepage.viewStudentReviews")} />
                      <BenefitItem text={t("authSelectrolepage.trackYourIncome")} />
                    </>
                  ) : (
                    <>
                      <BenefitItem text={t("authSelectrolepage.supportLearnersNationwide")} />
                      <BenefitItem text={t("authSelectrolepage.flexibleWorkingTime")} />
                      <BenefitItem text={t("authSelectrolepage.getAttractiveIncome")} />
                    </>
                  )}
                </div>

                <Button
                  variant={isMentor ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    isMentor
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                      : "border-slate-300 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:bg-emerald-900/20"
                  )}
                  onClick={handleMentorSelect}>
                  {isMentor
                    ? t("authSelectrolepage.goToMentorPage")
                    : t("adminUsermanagement.hide")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/35">
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
      </div>
      <span className="text-sm text-slate-600 dark:text-slate-300">{text}</span>
    </div>
  );
}
