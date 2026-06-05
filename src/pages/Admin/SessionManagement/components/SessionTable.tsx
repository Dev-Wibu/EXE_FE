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
import { formatCurrency, formatDateTime, treatZuluAsVietnamLocal } from "@/lib/formatting";
import { getSessionStatusBadge } from "@/lib/status-utils";
import { Check, Edit, Eye, Search, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Session } from "../types";
interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}
interface SessionTableProps {
  sessions: Session[];
  onView: (session: Session) => void;
  onEdit: (session: Session) => void;
  onCancel: (session: Session) => void;
  onApprove?: (session: Session) => void;
  onReject?: (session: Session) => void;
  getSortProps?: (key: keyof Session | "startTimeSortValue") => SortProps;
}
const formatDuration = (seconds?: number, minutes?: number) => {
  if (typeof minutes === "number" && minutes > 0) {
    return `${minutes}p`;
  }
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutesFromSeconds = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}g ${minutesFromSeconds}p`;
  }
  return `${minutesFromSeconds}p`;
};
export function SessionTable({
  sessions,
  onView,
  onEdit,
  onCancel,
  onApprove,
  onReject,
  getSortProps,
}: SessionTableProps) {
  const { t } = useTranslation();
  if (sessions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">
          {t("adminSessionmanagement.noLessonsFound")}
        </p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t("common.id")}</TableHead>
          <TableHead>{t("common.roomName1")}</TableHead>
          <TableHead className="w-24">{t("general.userId1")}</TableHead>
          <TableHead className="w-24">{t("common.idMentor")}</TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("startTimeSortValue")}>
                {t("adminSessionmanagement.startTime")}
              </SortButton>
            ) : (
              t("adminSessionmanagement.startTime")
            )}
          </TableHead>
          <TableHead>{t("adminSessionmanagement.meetingTime")}</TableHead>
          <TableHead className="w-24">{t("common.duration")}</TableHead>
          <TableHead className="w-36">{t("adminSessionmanagement.totalPrice")}</TableHead>
          <TableHead className="w-40">{t("common.transactionCode")}</TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("status")}>{t("common.status")}</SortButton>
            ) : (
              t("common.status")
            )}
          </TableHead>
          <TableHead className="w-28 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{session.id}</TableCell>
            <TableCell className="max-w-xs truncate font-medium">
              {session.roomName || "-"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{session.userId || "-"}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{session.userId2 || "-"}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(treatZuluAsVietnamLocal(session.startTime1))}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(session.joinTime)}
            </TableCell>
            <TableCell>{formatDuration(session.durationSeconds1, session.duration)}</TableCell>
            <TableCell>
              {session.totalPrice != null ? formatCurrency(session.totalPrice) : "-"}
            </TableCell>
            <TableCell className="font-mono text-xs">{session.transactionCode || "-"}</TableCell>
            <TableCell>
              {(() => {
                const statusConfig = getSessionStatusBadge(session.status);
                return (
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                );
              })()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {session.status === "DRAFT" && onApprove && onReject && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(session)}
                      className="h-8 w-8 p-0 hover:bg-emerald-50"
                      title={t("adminSessionmanagement.browseSessions")}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(session)}
                      className="h-8 w-8 p-0 hover:bg-rose-50"
                      title={t("adminSessionmanagement.rejectSession")}>
                      <X className="h-4 w-4 text-rose-600" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(session)}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  title={t("common.seeDetails")}>
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(session)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 disabled:opacity-50"
                  disabled={session.status === "COMPLETED" || session.status === "CANCELED"}
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(session)}
                  className="h-8 w-8 p-0 hover:bg-red-50 disabled:opacity-50"
                  disabled={session.status === "COMPLETED" || session.status === "CANCELED"}
                  title={t("adminSessionmanagement.cancelClass")}>
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
