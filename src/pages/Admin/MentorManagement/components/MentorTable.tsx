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
import { formatCurrency } from "@/lib/formatting";
import { Edit, Eye, Power, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Mentor } from "../types";
interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}
interface MentorTableProps {
  mentors: Mentor[];
  onEdit: (mentor: Mentor) => void;
  onDelete: (mentor: Mentor) => void;
  onViewDetail: (mentor: Mentor) => void;
  getSortProps?: (key: keyof Mentor) => SortProps;
}
export function MentorTable({
  mentors,
  onEdit,
  onDelete,
  onViewDetail,
  getSortProps,
}: MentorTableProps) {
  const { t } = useTranslation();
  if (mentors.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("adminMentormanagement.noMentorsFound")}
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
          <TableHead>{t("common.expertise")}</TableHead>
          <TableHead className="w-24">
            {getSortProps ? (
              <SortButton {...getSortProps("yearsOfExperience")}>
                {t("common.experience")}
              </SortButton>
            ) : (
              t("common.experience")
            )}
          </TableHead>
          <TableHead>{t("common.company")}</TableHead>
          <TableHead className="w-36">{t("adminMentormanagement.priceMin")}</TableHead>
          <TableHead className="w-20">
            {getSortProps ? (
              <SortButton {...getSortProps("totalSession")}>
                {t("adminMentormanagement.numberOfSessions")}
              </SortButton>
            ) : (
              t("adminMentormanagement.numberOfSessions")
            )}
          </TableHead>
          <TableHead className="w-24">{t("common.status")}</TableHead>
          <TableHead className="w-24 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mentors.map((mentor) => (
          <TableRow key={mentor.id}>
            <TableCell className="font-medium">{mentor.id}</TableCell>
            <TableCell className="font-medium">{mentor.name}</TableCell>
            <TableCell className="text-muted-foreground">{mentor.email}</TableCell>
            <TableCell className="max-w-xs truncate">{mentor.expertise || "-"}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {mentor.yearsOfExperience || 0} {t("common.year")}
              </Badge>
            </TableCell>
            <TableCell>{mentor.currentCompany || "-"}</TableCell>
            <TableCell>
              {typeof mentor.pricePerMinute === "number" && mentor.pricePerMinute > 0
                ? t("common.var0Min", {
                    var_0: formatCurrency(mentor.pricePerMinute),
                  })
                : "-"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{mentor.totalSession || 0}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={mentor.active !== false ? "default" : "destructive"}>
                {mentor.active !== false ? t("common.active") : t("common.inactive")}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(mentor)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title={t("common.userDetail") || "View Details"}>
                  <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(mentor)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(mentor)}
                  className={`h-8 w-8 p-0 ${mentor.active !== false ? "hover:bg-red-50" : "hover:bg-green-50"}`}
                  title={mentor.active !== false ? t("common.disable") : t("common.activate")}>
                  <Power
                    className={`h-4 w-4 ${mentor.active !== false ? "text-red-600" : "text-green-600"}`}
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
