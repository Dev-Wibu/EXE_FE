import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";

import { useSortable } from "@/hooks/useSortable";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { candidateProfileManager, usersAdminManager } from "@/services";
import { toast } from "sonner";

import { CandidateProfileModal, DeleteUserDialog, UserFormDialog, UserTable } from "./components";
import type { User, UserFormData } from "./types";

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to show only active users
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<UserFormData>>({});

  // CV Upload Modal state
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [isCvUploading, setIsCvUploading] = useState(false);

  // Candidate Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState<CandidateProfile | null>(null);

  // Load users using the users admin manager service
  const loadUsers = useCallback(async (showReloading = false) => {
    if (showReloading) {
      setIsReloading(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const response = await usersAdminManager.getAll();
      if (response.success && response.data) {
        // Handle both paginated and array responses
        const userData = Array.isArray(response.data) ? response.data : response.data.data;
        setUsers(userData as User[]);
      } else {
        toast.error(response.error || "Không thể tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      if (showReloading) {
        setIsReloading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Filter users based on search query and status filter
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filter by status (active/inactive/all) - default shows active only
      if (statusFilter === "active") {
        if (user.isActive === false) {
          return false;
        }
      } else if (statusFilter === "inactive") {
        if (user.isActive !== false) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          user.name?.toLowerCase().includes(lowerQuery) ||
          user.email?.toLowerCase().includes(lowerQuery) ||
          user.university?.toLowerCase().includes(lowerQuery) ||
          user.major?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [users, statusFilter, searchQuery]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredUsers);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_usermanagement_usermanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleCreate = () => {
    // Note: Role removed from form as UserInfo schema doesn't include it
    // New users will be created with default role from backend
    setFormData({ isActive: true });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    // Note: Role not editable via form as UserInfo schema doesn't include it
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      university: user.university,
      major: user.major,
      isActive: user.isActive,
      // Include Cloudinary public_id fields for file management during update
      public_id: user.public_id,
      cv_public_id: user.cv_public_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUploadCV = (user: User) => {
    setSelectedUser(user);
    setIsCvModalOpen(true);
  };

  // Handle viewing candidate profile
  const handleViewProfile = async (user: User) => {
    if (!user.id) return;
    try {
      const response = await candidateProfileManager.getByUserId(user.id);
      if (response.success && response.data) {
        setSelectedProfileData(response.data);
        setIsProfileModalOpen(true);
      } else {
        toast.info("Người dùng này chưa có hồ sơ ứng viên");
      }
    } catch {
      toast.info("Người dùng này chưa có hồ sơ ứng viên");
    }
  };

  // Handle CV upload via dedicated modal
  const handleCvUpload = async (file: File) => {
    if (!selectedUser?.id) return;

    setIsCvUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(selectedUser.id, file);
      if (response.success) {
        toast.success("Upload CV thành công!");
        void loadUsers(); // Refresh the list to show updated CV status
      } else {
        toast.error(response.error || "Upload CV thất bại");
      }
    } finally {
      setIsCvUploading(false);
    }
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await usersAdminManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo người dùng thành công");
        setIsCreateDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo người dùng");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Không thể tạo người dùng");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser?.id) return;

    try {
      // Separate avatar file from user data (CV upload is handled via dedicated CVUploadModal)
      const { avatar, ...userData } = formData as {
        avatar?: File;
        [key: string]: unknown;
      };

      // Call update with avatar file only (CV upload is now separate)
      const response = await usersAdminManager.update(selectedUser.id, userData, avatar);
      if (response.success) {
        toast.success("Đã cập nhật người dùng thành công");
        setIsEditDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật người dùng");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Không thể cập nhật người dùng");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) return;

    try {
      // Toggle the user's active status (activate/deactivate)
      const response = await usersAdminManager.toggleActive(selectedUser.id, selectedUser);
      if (response.success) {
        const action = selectedUser.isActive !== false ? "đã vô hiệu hóa" : "đã kích hoạt";
        toast.success(`Người dùng ${action} thành công`);
        setIsDeleteDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể thay đổi trạng thái người dùng");
      }
    } catch (error) {
      console.error("Error changing user status:", error);
      toast.error("Không thể thay đổi trạng thái người dùng");
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Người Dùng
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý tài khoản, vai trò và quyền hạn người dùng
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email, trường đại học..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          {/* Status Filter - Default shows active users only */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {(searchQuery || statusFilter !== "active") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("active");
                pagination.goToFirstPage();
              }}>
              Xóa bộ lọc
            </Button>
          )}
          <ReloadButton
            onReload={() => loadUsers(true)}
            isLoading={isReloading}
            tooltip="Tải lại danh sách người dùng"
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Người Dùng
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label="Đang tải danh sách người dùng..." />
        ) : (
          <>
            <UserTable
              users={pageData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUploadCV={handleUploadCV}
              onViewProfile={handleViewProfile}
              getSortProps={getSortProps}
            />

            {/* Pagination */}
            {sortedData.length > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
              />
            )}

            {/* Empty State with Clear Filters */}
            {sortedData.length === 0 && (searchQuery || statusFilter !== "active") && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("active");
                    pagination.goToFirstPage();
                  }}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <UserFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Người Dùng Mới"
        description="Điền thông tin để tạo tài khoản người dùng mới."
        submitLabel="Tạo người dùng"
      />

      {/* Edit Dialog */}
      <UserFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Người Dùng"
        description="Cập nhật thông tin người dùng."
        submitLabel="Lưu thay đổi"
        selectedUser={selectedUser}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
      />

      {/* CV Upload Modal */}
      <CVUploadModal
        isOpen={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
        currentCvUrl={selectedUser?.cvUrl}
        onUpload={handleCvUpload}
        isUploading={isCvUploading}
        title="Upload CV"
        description="Tải lên CV của người dùng. Chỉ chấp nhận file PDF."
      />

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        profile={selectedProfileData}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </div>
  );
}
