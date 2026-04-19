import { Edit, Power, Search } from "lucide-react";

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

import type { MemberShipPlan } from "../types";

type MembershipPlanSortKey =
  | "idSortValue"
  | "nameSortValue"
  | "priceSortValue"
  | "durationSortValue";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface MembershipPlanTableProps {
  plans: MemberShipPlan[];
  onEdit: (plan: MemberShipPlan) => void;
  onDelete: (plan: MemberShipPlan) => void;
  getSortProps?: (key: MembershipPlanSortKey) => SortProps;
}

const PLAN_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  FREE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  BASIC: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PREMIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TEST: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

function formatPrice(price?: number): string {
  if (price === undefined || price === null) return "-";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export function MembershipPlanTable({
  plans,
  onEdit,
  onDelete,
  getSortProps,
}: MembershipPlanTableProps) {
  if (plans.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy gói thành viên nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">
            {getSortProps ? <SortButton {...getSortProps("idSortValue")}>ID</SortButton> : "ID"}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("nameSortValue")}>Tên gói</SortButton>
            ) : (
              "Tên gói"
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("priceSortValue")}>Giá</SortButton>
            ) : (
              "Giá"
            )}
          </TableHead>
          <TableHead className="text-center">AI Interview</TableHead>
          <TableHead className="text-center">Practice Sets</TableHead>
          <TableHead className="text-center">Quiz Sets</TableHead>
          <TableHead className="text-center">
            {getSortProps ? (
              <SortButton {...getSortProps("durationSortValue")}>Thời hạn (ngày)</SortButton>
            ) : (
              "Thời hạn (ngày)"
            )}
          </TableHead>
          <TableHead className="w-24 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.id}</TableCell>
            <TableCell>
              <Badge className={PLAN_COLORS[plan.name ?? ""] ?? "bg-gray-100 text-gray-700"}>
                {plan.name ?? "-"}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{formatPrice(plan.price)}</TableCell>
            <TableCell className="text-center">{plan.max_ai_interview ?? "-"}</TableCell>
            <TableCell className="text-center">{plan.max_practice_sets ?? "-"}</TableCell>
            <TableCell className="text-center">{plan.max_quiz_sets ?? "-"}</TableCell>
            <TableCell className="text-center">{plan.durationDays ?? "-"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(plan)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(plan)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Xóa">
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
