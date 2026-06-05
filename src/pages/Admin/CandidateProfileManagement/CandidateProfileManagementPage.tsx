import { useTranslation } from "react-i18next";
/**
 * Candidate Profile Management Page (Admin)
 * For managing, organizing, and reviewing submitted applications
 */

import { ReloadButton } from "@/components/shared";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { SortButton } from "@/components/shared/SortButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { formatDate } from "@/lib/formatting";
import { useCandidateProfiles } from "@/services/candidate-profile.manager";
import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CandidateProfileModal } from "../UserManagement/components/CandidateProfileModal";
type SortableCandidateProfile = CandidateProfile & {
  nameSortValue: string;
  emailSortValue: string;
  createdAtSortValue: number;
};
export function CandidateProfileManagementPage() {
  const { t } = useTranslation();
  const { data: profilesData, isLoading, isRefetching, refetch } = useCandidateProfiles();
  const profiles = useMemo(() => {
    return ((profilesData as unknown as CandidateProfile[]) ?? []).sort(
      (a, b) => (a.id ?? 0) - (b.id ?? 0)
    );
  }, [profilesData]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .map((profile) => profile.targetRole)
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        )
      ),
    [profiles]
  );
  const levelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .map((profile) => profile.targetLevel)
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        )
      ),
    [profiles]
  );
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.targetRole?.toLowerCase().includes(q) ||
        p.targetLevel?.toLowerCase().includes(q);
      if (!matchesSearch) {
        return false;
      }
      if (roleFilter !== "all" && p.targetRole !== roleFilter) {
        return false;
      }
      if (levelFilter !== "all" && p.targetLevel !== levelFilter) {
        return false;
      }
      return true;
    });
  }, [levelFilter, profiles, roleFilter, search]);
  const sortableProfiles = useMemo<SortableCandidateProfile[]>(
    () =>
      filteredProfiles.map((profile) => ({
        ...profile,
        nameSortValue: profile.user?.name?.toLowerCase() || "",
        emailSortValue: profile.user?.email?.toLowerCase() || "",
        createdAtSortValue: profile.createdAt ? new Date(profile.createdAt).getTime() : 0,
      })),
    [filteredProfiles]
  );
  const { sortedData, getSortProps } = useSortable(sortableProfiles);
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_candidateprofilemanagement_candidateprofilemanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("adminCandidateprofilemanagement.manageCandidateProfiles")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("adminCandidateprofilemanagement.viewAndManageAllCandidate")}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder={t("adminCandidateprofilemanagement.searchByNameEmailRole")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              pagination.goToFirstPage();
            }}
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            pagination.goToFirstPage();
          }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("adminCandidateprofilemanagement.filterByRole")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("adminCandidateprofilemanagement.allRoles")}</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={levelFilter}
          onValueChange={(value) => {
            setLevelFilter(value);
            pagination.goToFirstPage();
          }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("common.filterByLevel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allLevels")}</SelectItem>
            {levelOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {(search || roleFilter !== "all" || levelFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setLevelFilter("all");
                pagination.goToFirstPage();
              }}>
              {t("common.clearFilter")}
            </Button>
          )}

          <ReloadButton
            onReload={async () => {
              await refetch();
            }}
            isLoading={isRefetching}
            tooltip={t("adminCandidateprofilemanagement.reloadProfileList")}
            showLabel
            hideTooltip
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b px-6 py-4 dark:border-slate-800">
          <h2 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
            {t("adminCandidateprofilemanagement.listOfRecords")}
            {sortedData.length})
          </h2>
        </div>

        {isLoading ? (
          <SpinnerBlock
            size="lg"
            label={t("adminCandidateprofilemanagement.loadingListOfCandidateProfiles")}
          />
        ) : sortedData.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-slate-400">
              {t("adminCandidateprofilemanagement.noRecordsFound")}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton {...getSortProps("nameSortValue")}>{t("common.name")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton {...getSortProps("emailSortValue")}>{t("common.email")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton {...getSortProps("targetRole")}>{t("common.role")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton {...getSortProps("targetLevel")}>{t("common.level")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton {...getSortProps("createdAtSortValue")}>
                      {t("common.creationDate")}
                    </SortButton>
                  </TableHead>
                  <TableHead className="text-right">{t("common.act")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.user?.name || "—"}</TableCell>
                    <TableCell>{profile.user?.email || "—"}</TableCell>
                    <TableCell>{profile.targetRole || "—"}</TableCell>
                    <TableCell>
                      {profile.targetLevel ? (
                        <Badge variant="secondary">{profile.targetLevel}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(profile.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProfile(profile)}>
                        <Eye className="mr-1 h-4 w-4" />
                        {t("common.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-4 pb-4">
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  pagination.goToFirstPage();
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        )}
      </div>

      {/* Improved Candidate Profile Modal */}
      <CandidateProfileModal
        profile={selectedProfile}
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
      />
    </div>
  );
}
