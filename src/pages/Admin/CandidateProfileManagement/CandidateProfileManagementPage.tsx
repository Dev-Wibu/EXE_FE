/**
 * Candidate Profile Management Page (Admin)
 * View and manage all candidate profiles
 */

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function CandidateProfileManagementPage() {
  const { data: profilesData, isLoading } = useCandidateProfiles();
  const profiles = (profilesData as unknown as CandidateProfile[]) ?? [];

  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.targetRole?.toLowerCase().includes(q) ||
        p.targetLevel?.toLowerCase().includes(q)
    );
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProfile(profile)}>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hồ sơ ứng viên</DialogTitle>
            <DialogDescription>
              {selectedProfile?.user?.name} — {selectedProfile?.user?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="mb-2 font-semibold">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Vai trò mục tiêu:</span>{" "}
                    {selectedProfile.targetRole || "—"}
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Cấp độ:</span>{" "}
                    {selectedProfile.targetLevel || "—"}
                  </div>
                </div>
                {selectedProfile.introduction && (
                  <p className="mt-2 text-sm">{selectedProfile.introduction}</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="mb-2 font-semibold">Kỹ năng</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng kỹ thuật:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selectedProfile.technicalSkills ?? []).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                      {(selectedProfile.technicalSkills ?? []).length === 0 && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-slate-400">Kỹ năng mềm:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selectedProfile.softSkills ?? []).map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                      {(selectedProfile.softSkills ?? []).length === 0 && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-slate-400">Công cụ:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selectedProfile.tools ?? []).map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                      {(selectedProfile.tools ?? []).length === 0 && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects */}
              {(selectedProfile.projects ?? []).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Dự án</h4>
                  <div className="space-y-2">
                    {selectedProfile.projects!.map((p, i) => (
                      <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-gray-600 dark:text-slate-300">{p.description}</p>
                        <p className="text-gray-500 dark:text-slate-400">
                          {p.role} · Đội {p.teamSize} người · {p.outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {(selectedProfile.workExperiences ?? []).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Kinh nghiệm làm việc</h4>
                  <div className="space-y-2">
                    {selectedProfile.workExperiences!.map((w, i) => (
                      <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                        <p className="font-medium">
                          {w.position} — {w.company}
                        </p>
                        <p className="text-gray-600 dark:text-slate-300">{w.description}</p>
                        <p className="text-xs text-gray-400">
                          {w.start_date} — {w.end_date || "Hiện tại"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {(selectedProfile.educations ?? []).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Học vấn</h4>
                  <div className="space-y-2">
                    {selectedProfile.educations!.map((e, i) => (
                      <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                        <p className="font-medium">{e.school}</p>
                        <p className="text-gray-600 dark:text-slate-300">
                          {e.major} — {e.degree}
                        </p>
                        {e.gpa && <p>GPA: {e.gpa}</p>}
                        <p className="text-xs text-gray-400">
                          {e.start_date} — {e.end_date || "Hiện tại"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {(selectedProfile.certifications ?? []).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Chứng chỉ</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedProfile.certifications!.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {(selectedProfile.achievements ?? []).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Thành tích</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedProfile.achievements!.map((a) => (
                      <Badge key={a} variant="outline">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
