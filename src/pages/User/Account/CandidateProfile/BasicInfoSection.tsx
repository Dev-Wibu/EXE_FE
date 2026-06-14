import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { Edit3, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BasicInfoEditProps {
  mode: "edit";
  formData: Partial<CandidateProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CandidateProfile>>>;
}

interface BasicInfoViewProps {
  mode: "view";
  profile: CandidateProfile;
}

type BasicInfoSectionProps = BasicInfoEditProps | BasicInfoViewProps;

export function BasicInfoSection(props: BasicInfoSectionProps) {
  const { t } = useTranslation();
  if (props.mode === "view") {
    const { profile } = props;
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
            <Target className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
            {t("common.basicInformation")}
          </h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
            <p className="mb-1 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
              {t("common.targetRole")}
            </p>
            <p className="font-medium text-[#0b1c30] dark:text-white">
              {profile.targetRole || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
            <p className="mb-1 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
              {t("common.level")}
            </p>
            <p className="font-medium text-[#0b1c30] dark:text-white">
              {profile.targetLevel || "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#131b2e]">
          <p className="mb-1 text-xs font-medium tracking-wide text-[#45464d] uppercase dark:text-[#8f9099]">
            {t("common.introduce")}
          </p>
          <p className="text-sm leading-relaxed text-[#0b1c30] dark:text-white">
            {profile.introduction || "—"}
          </p>
        </div>
      </div>
    );
  }

  const { formData, setFormData } = props;
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dae2fd] dark:bg-[#0058be]/30">
          <Edit3 className="h-5 w-5 text-[#0058be] dark:text-[#66B2FF]" />
        </div>
        <h3 className="text-lg font-semibold text-[#0b1c30] dark:text-white">
          {t("common.basicInformation")}
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1 block text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
            {t("common.targetRole")}
          </Label>
          <Input
            value={formData.targetRole ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                targetRole: e.target.value,
              }))
            }
            placeholder={t("userAccount.exampleSoftwareEngineer")}
            className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
          />
        </div>
        <div>
          <Label className="mb-1 block text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
            {t("common.level")}
          </Label>
          <Input
            value={formData.targetLevel ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                targetLevel: e.target.value,
              }))
            }
            placeholder={t("userAiinterview.placeholderLevel")}
            className="border-[#c6c6cd] bg-white dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white"
          />
        </div>
      </div>
      <div className="mt-4">
        <Label className="mb-1 block text-sm font-medium text-[#45464d] dark:text-[#8f9099]">
          {t("common.introduce")}
        </Label>
        <textarea
          className="mt-1 w-full rounded-xl border border-[#c6c6cd] bg-white p-3 text-sm transition-colors focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 focus:outline-none dark:border-[#3a4558] dark:bg-[#1a2a3a] dark:text-white dark:focus:border-[#66B2FF] dark:focus:ring-[#66B2FF]/20"
          rows={4}
          value={formData.introduction ?? ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              introduction: e.target.value,
            }))
          }
          placeholder={t("userAccount.introducingMyself")}
        />
      </div>
    </div>
  );
}
