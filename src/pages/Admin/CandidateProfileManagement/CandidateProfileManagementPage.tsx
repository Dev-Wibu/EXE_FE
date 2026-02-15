/**
 * Candidate Profile Management Page (Admin)
 * For managing, organizing, and reviewing submitted applications
 */

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { useCandidateProfiles } from "@/services/candidate-profile.manager";

import { CandidateProfileModal } from "../UserManagement/components/CandidateProfileModal";

export function CandidateProfileManagementPage() {
  const { data: profilesData, isLoading } = useCandidateProfiles();
  const profiles = (profilesData as unknown as CandidateProfile[]) ?? [];

  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);

  const filteredProfiles = useMemo(() => {
    const filtered = profiles.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.targetRole?.toLowerCase().includes(q) ||
        p.targetLevel?.toLowerCase().includes(q)
      );
    });
    return filtered.reverse();
  }, [profiles, search]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý hồ sơ ứng viên</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Xem và quản lý tất cả hồ sơ ứng viên trong hệ thống.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Tìm kiếm theo tên, email, vai trò..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hồ sơ ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-slate-400">Không tìm thấy hồ sơ nào.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Cấp độ</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
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
                    <TableCell>
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProfile(profile)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Improved Candidate Profile Modal */}
      <CandidateProfileModal
        profile={selectedProfile}
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
      />
    </div>
  );
}
