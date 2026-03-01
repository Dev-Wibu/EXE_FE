import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CandidateProfile } from "@/interfaces/schema.types";

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
  if (props.mode === "view") {
    const { profile } = props;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Vai trò mục tiêu</Label>
              <p className="font-medium">{profile.targetRole || "—"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-slate-400">Cấp độ</Label>
              <p className="font-medium">{profile.targetLevel || "—"}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500 dark:text-slate-400">Giới thiệu</Label>
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
        <CardTitle>Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Vai trò mục tiêu</Label>
            <Input
              value={formData.targetRole ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetRole: e.target.value,
                }))
              }
              placeholder="VD: Kỹ sư phần mềm"
            />
          </div>
          <div>
            <Label>Cấp độ</Label>
            <Input
              value={formData.targetLevel ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetLevel: e.target.value,
                }))
              }
              placeholder="VD: Intern, Fresher, Junior, Middle"
            />
          </div>
        </div>
        <div>
          <Label>Giới thiệu</Label>
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
            placeholder="Giới thiệu bản thân..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
