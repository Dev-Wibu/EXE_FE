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
import { Edit, Power, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuestionBank } from "../types";

type QuestionBankSortKey = "idSortValue" | "questionTextSortValue" | "levelSortValue";

interface SortProps {
  direction: SortDirection;
  onChange: (_direction: SortDirection) => void;
}

interface QuestionBankTableProps {
  questions: QuestionBank[];
  onEdit: (_question: QuestionBank) => void;
  onDelete: (_question: QuestionBank) => void;
  getSortProps?: (_key: QuestionBankSortKey) => SortProps;
}

export function QuestionBankTable({
  questions,
  onEdit,
  onDelete,
  getSortProps,
}: QuestionBankTableProps) {
  const { t } = useTranslation();

  if (questions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("common.noData", t("adminQuestionbankmanagement.noDataFound"))}
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
          <TableHead className="w-48">{t("common.category", t("general.category"))}</TableHead>
          <TableHead className="w-32">
            {getSortProps ? (
              <SortButton {...getSortProps("levelSortValue")}>
                {t("common.level", t("common.difficulty"))}
              </SortButton>
            ) : (
              t("common.level", t("common.difficulty"))
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("questionTextSortValue")}>
                {t("common.questionText", t("common.questionText"))}
              </SortButton>
            ) : (
              t("common.questionText", t("common.questionText"))
            )}
          </TableHead>
          <TableHead className="w-24 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((q) => (
          <TableRow key={q.id}>
            <TableCell className="font-medium">{q.id}</TableCell>
            <TableCell className="font-medium">{q.questionCategory?.categoryName || "-"}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  q.questionLevel === "EASY"
                    ? "bg-green-100 text-green-800"
                    : q.questionLevel === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}>
                {q.questionLevel}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {q.questionText || "-"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(q)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(q)}
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
