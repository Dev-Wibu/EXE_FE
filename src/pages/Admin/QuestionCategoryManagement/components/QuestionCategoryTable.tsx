import { SortButton, type SortDirection } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openUrlInNewTab } from "@/lib/media-file-utils";
import { Edit, ExternalLink, Power, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuestionCategory } from "../types";
type QuestionCategorySortKey = "idSortValue" | "nameSortValue" | "descriptionSortValue";
interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}
interface QuestionCategoryTableProps {
  categories: QuestionCategory[];
  onEdit: (category: QuestionCategory) => void;
  onDelete: (category: QuestionCategory) => void;
  getSortProps?: (key: QuestionCategorySortKey) => SortProps;
}

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
export function QuestionCategoryTable({
  categories,
  onEdit,
  onDelete,
  getSortProps,
}: QuestionCategoryTableProps) {
  const { t } = useTranslation();
  if (categories.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("adminQuestioncategorymanagement.noQuestionCategoriesFound")}
        </p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">
            {getSortProps ? (
              <SortButton {...getSortProps("idSortValue")}>{t("common.id")}</SortButton>
            ) : (
              t("common.id")
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("nameSortValue")}>
                {t("adminQuestioncategorymanagement.categoryName")}
              </SortButton>
            ) : (
              t("adminQuestioncategorymanagement.categoryName")
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("descriptionSortValue")}>
                {t("common.describe")}
              </SortButton>
            ) : (
              t("common.describe")
            )}
          </TableHead>
          <TableHead>{t("adminQuestioncategorymanagement.instructionsUrl")}</TableHead>
          <TableHead className="w-24 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.id}</TableCell>
            <TableCell className="font-medium">{category.categoryName}</TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {category.description || "-"}
            </TableCell>
            <TableCell>
              {category.urlTutorial && isValidHttpUrl(category.urlTutorial) ? (
                <a
                  href={category.urlTutorial}
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    openUrlInNewTab(category.urlTutorial || "");
                  }}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  {t("common.link")}
                </a>
              ) : category.urlTutorial ? (
                <span className="text-muted-foreground text-xs" title={category.urlTutorial}>
                  {t("adminQuestioncategorymanagement.invalidUrl")}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(category)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(category)}
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
