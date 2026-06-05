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
import { Edit, Eye, Power, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PracticeSet, PracticeSetLevel } from "../types";
interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}
interface PracticeSetTableProps {
  practiceSets: PracticeSet[];
  onEdit: (practiceSet: PracticeSet) => void;
  onDelete: (practiceSet: PracticeSet) => void;
  onViewItems: (practiceSet: PracticeSet) => void;
  getSortProps?: (key: keyof PracticeSet) => SortProps;
}
const getLevelBadgeClass = (level?: PracticeSetLevel): string => {
  switch (level) {
    case "INTERN":
      return "bg-gray-500 hover:bg-gray-500";
    case "FRESHER":
      return "bg-green-500 hover:bg-green-500";
    case "JUNIOR":
      return "bg-blue-500 hover:bg-blue-500";
    case "MIDDLE":
      return "bg-purple-600 hover:bg-purple-600";
    default:
      return "bg-gray-400 hover:bg-gray-400";
  }
};
export function PracticeSetTable({
  practiceSets,
  onEdit,
  onDelete,
  onViewItems,
  getSortProps,
}: PracticeSetTableProps) {
  const { t } = useTranslation();
  if (practiceSets.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("adminPracticesetmanagement.noQuestionSetsFound")}
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
              <SortButton {...getSortProps("practiceSetName")}>{t("common.name")}</SortButton>
            ) : (
              t("common.name")
            )}
          </TableHead>
          <TableHead>{t("adminPracticesetmanagement.target")}</TableHead>
          <TableHead className="w-24">
            {getSortProps ? (
              <SortButton {...getSortProps("level")}>{t("common.level")}</SortButton>
            ) : (
              t("common.level")
            )}
          </TableHead>
          <TableHead>{t("common.specialized")}</TableHead>
          <TableHead className="w-24 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {practiceSets.map((ps) => (
          <TableRow key={ps.id}>
            <TableCell className="font-medium">{ps.id}</TableCell>
            <TableCell className="font-medium">{ps.practiceSetName}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {ps.objective || "-"}
            </TableCell>
            <TableCell>
              {ps.level && (
                <Badge variant="default" className={`text-white ${getLevelBadgeClass(ps.level)}`}>
                  {ps.level}
                </Badge>
              )}
            </TableCell>
            <TableCell>{ps.major?.majorName || "-"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewItems(ps)}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  title={t("adminPracticesetmanagement.seeQuestion")}>
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(ps)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(ps)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title={t("general.delete")}>
                  <Power className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
