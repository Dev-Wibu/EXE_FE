import { Edit, Power, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Major } from "../types";

interface QuestionMajorTableProps {
  majors: Major[];
  onEdit: (major: Major) => void;
  onDelete: (major: Major) => void;
}

export function QuestionMajorTable({ majors, onEdit, onDelete }: QuestionMajorTableProps) {
  if (majors.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">No question majors found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Major Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {majors.map((major) => (
          <TableRow key={major.id}>
            <TableCell className="font-medium">{major.id}</TableCell>
            <TableCell className="font-medium">{major.majorName}</TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {major.description || "-"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(major)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Edit major">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(major)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Deactivate major">
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
