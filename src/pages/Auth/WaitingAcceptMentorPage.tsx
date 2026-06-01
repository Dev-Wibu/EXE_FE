import { CheckCircle, Clock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WaitingAcceptMentorPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            {/* Clock Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>

            <CardTitle className="mt-6 text-2xl">
              {t("authWaitingacceptmentorpage.applicationUnderReview")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("authWaitingacceptmentorpage.thankYouForRegisteringAsMentor")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Box */}
            <div className="space-y-3 rounded-xl bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-slate-700">
                  {t("authWaitingacceptmentorpage.reviewTime")}{" "}
                  <span className="font-semibold">
                    {t("authWaitingacceptmentorpage.timeFrame24To48Hours")}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-slate-700">
                  {t("authWaitingacceptmentorpage.weWillSendAnEmail")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-slate-700">
                  {t("authWaitingacceptmentorpage.checkEmailRegularly")}
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900">
                {t("authWaitingacceptmentorpage.processingProcess")}
              </h4>

              {/* Step 1: Submitted */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="h-8 w-0.5 bg-slate-200" />
                </div>
                <div>
                  <h5 className="font-medium text-slate-900">
                    {t("authWaitingacceptmentorpage.applicationSubmitted")}
                  </h5>
                  <p className="text-sm text-slate-500">
                    {t("authWaitingacceptmentorpage.applicationSubmittedSuccessfully")}
                  </p>
                </div>
              </div>

              {/* Step 2: Reviewing */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500">
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <div className="h-8 w-0.5 bg-slate-200" />
                </div>
                <div>
                  <h5 className="font-medium text-slate-900">{t("adminUsermanagement.hide")}</h5>
                  <p className="text-sm text-slate-500">
                    {t("authWaitingacceptmentorpage.reviewingYourProfile")}
                  </p>
                </div>
              </div>

              {/* Step 3: Result */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                </div>
                <div>
                  <h5 className="font-medium text-slate-500">
                    {t("authWaitingacceptmentorpage.notificationOfResults")}
                  </h5>
                  <p className="text-sm text-slate-400">{t("common.friend")}</p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/">{t("authWaitingacceptmentorpage.returnToHomePage")}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
