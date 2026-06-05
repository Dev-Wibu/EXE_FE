import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile } from "@/interfaces/schema.types";
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
      <Card>
        <CardHeader>
          <CardTitle>{t("common.basicInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                {t("common.targetRole")}
              </Label>
              <p className="font-medium">{profile.targetRole || "—"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                {t("common.level")}
              </Label>
              <p className="font-medium">{profile.targetLevel || "—"}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">
              {t("common.introduce")}
            </Label>
            <p className="mt-1">{profile.introduction || "—"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { formData, setFormData } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.basicInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>{t("common.targetRole")}</Label>
            <Input
              value={formData.targetRole ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetRole: e.target.value,
                }))
              }
              placeholder={t("userAccount.exampleSoftwareEngineer")}
            />
          </div>
          <div>
            <Label>{t("common.level")}</Label>
            <Input
              value={formData.targetLevel ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetLevel: e.target.value,
                }))
              }
              placeholder={t("userAiinterview.placeholderLevel")}
            />
          </div>
        </div>
        <div>
          <Label>{t("common.introduce")}</Label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            rows={3}
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
      </CardContent>
    </Card>
  );
}
