import { Edit, Search, Trash2 } from "lucide-react";

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

import type { QuestionSet, QuestionSetLevel } from "../types";

interface QuestionSetTableProps {
  questionSets: QuestionSet[];
  onEdit: (questionSet: QuestionSet) => void;
  onDelete: (questionSet: QuestionSet) => void;
}

const getLevelBadgeClass = (level?: QuestionSetLevel): string => {
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

export function QuestionSetTable({ questionSets, onEdit, onDelete }: QuestionSetTableProps) {
  if (questionSets.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">No question sets found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Objective</TableHead>
          <TableHead className="w-24">Level</TableHead>
          <TableHead>Major</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questionSets.map((questionSet) => (
          <TableRow key={questionSet.questionSetId}>
            <TableCell className="font-medium">{questionSet.questionSetId}</TableCell>
            <TableCell className="font-medium">{questionSet.questionSetName}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {questionSet.objective || "-"}
            </TableCell>
            <TableCell>
              {questionSet.level && (
                <Badge
                  variant="default"
                  className={`text-white ${getLevelBadgeClass(questionSet.level)}`}>
                  {questionSet.level}
                </Badge>
              )}
            </TableCell>
            <TableCell>{questionSet.major?.majorName || "-"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(questionSet)}
                  className="h-8 w-8 p-0 hover:bg-blue-50">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(questionSet)}
                  className="h-8 w-8 p-0 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
