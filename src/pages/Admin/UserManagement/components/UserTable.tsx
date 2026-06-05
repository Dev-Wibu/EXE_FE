import { SortButton, type SortDirection } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMajorLabel } from "@/constants/majors";
import { Edit, FileText, Power, Search, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserRole, User as UserType } from "../types";
interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}
interface UserTableProps {
  users: UserType[];
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
  onUploadCV: (user: UserType) => void;
  onViewProfile?: (user: UserType) => void;
  getSortProps?: (key: keyof UserType) => SortProps;
}
const getRoleBadgeClass = (role?: UserRole): string => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-600 hover:bg-purple-600";
    case "STAFF":
      return "bg-blue-600 hover:bg-blue-600";
    case "MENTOR":
      return "bg-orange-500 hover:bg-orange-500";
    default:
      return "bg-gray-500 hover:bg-gray-500";
  }
};
export function UserTable({
  users,
  onEdit,
  onDelete,
  onUploadCV,
  onViewProfile,
  getSortProps,
}: UserTableProps) {
  const { t } = useTranslation();
  if (users.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("adminUsermanagement.noUsersFound")}
        </p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t("common.id")}</TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("name")}>{t("common.name")}</SortButton>
            ) : (
              t("common.name")
            )}
          </TableHead>
          <TableHead>{t("common.email")}</TableHead>
          <TableHead className="w-24">{t("common.role")}</TableHead>
          <TableHead>{t("common.university")}</TableHead>
          <TableHead>{t("common.specialized")}</TableHead>
          <TableHead className="w-24">{t("common.status")}</TableHead>
          <TableHead className="w-24 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.id}</TableCell>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant="default" className={`text-white ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{user.university || "-"}</TableCell>
            <TableCell>{getMajorLabel(user.major || "", t) || "-"}</TableCell>
            <TableCell>
              <Badge variant={user.isActive !== false ? "default" : "destructive"}>
                {user.isActive !== false ? t("common.work") : t("common.shutDown")}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {onViewProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewProfile(user)}
                    className="h-8 w-8 p-0 hover:bg-purple-50"
                    title={t("adminUsermanagement.viewCandidateProfile")}>
                    <User className="h-4 w-4 text-purple-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUploadCV(user)}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  title={user.cvUrl ? t("common.updateCv") : t("common.uploadCv")}>
                  <FileText
                    className={`h-4 w-4 ${user.cvUrl ? "text-green-600" : "text-gray-400"}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(user)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(user)}
                  className={`h-8 w-8 p-0 ${user.isActive !== false ? "hover:bg-red-50" : "hover:bg-green-50"}`}
                  title={user.isActive !== false ? t("common.disable") : t("common.activate")}>
                  <Power
                    className={`h-4 w-4 ${user.isActive !== false ? "text-red-600" : "text-green-600"}`}
                  />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
