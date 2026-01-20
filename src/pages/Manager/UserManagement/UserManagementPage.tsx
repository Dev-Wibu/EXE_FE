import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersAdminManager } from "@/services";
import { toast } from "sonner";

import { DeleteUserDialog, UserFormDialog, UserTable } from "./components";
import type { User, UserFormData } from "./types";

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to show only active users
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<UserFormData>>({});

  // Load users using the users admin manager service
  const loadUsers = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users based on search query, role filter, and status filter
  const filteredUsers = users.filter((user) => {
    // Filter by status (active/inactive/all) - default shows active only
    // Backend can return isActive as: true (active), false (deactivated), or null/undefined (not set)
    // - isActive === true: Explicitly active user
    // - isActive === false: Explicitly deactivated user (soft deleted)
    // - isActive === null/undefined: Treated as active (default state)
    if (statusFilter === "active") {
      // Show users that are active (true) or not explicitly set (null/undefined)
      // Hide users that are explicitly inactive (false)
      if (user.isActive === false) {
        return false;
      }
    } else if (statusFilter === "inactive") {
      // Show only users that are explicitly deactivated (isActive === false)
      if (user.isActive !== false) {
        return false;
      }
    }
    // statusFilter === "all" shows everything

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

    // Filter by role
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    return true;
  });

  const handleCreate = () => {
    setFormData({ role: "USER", isActive: true });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "USER",
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

  const handleSubmitCreate = async () => {
    try {
      const response = await usersAdminManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo người dùng thành công");
        setIsCreateDialogOpen(false);
        loadUsers(); // Refresh the list
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
      // Extract files from formData (if present from ExtendedUserFormData)
      const { avatar, cvFile, ...userData } = formData as {
        avatar?: File;
        cvFile?: File;
        [key: string]: unknown;
      };

      // Call update with separate file parameters for clarity
      const response = await usersAdminManager.update(selectedUser.id, userData, avatar, cvFile);
      if (response.success) {
        toast.success("Đã cập nhật người dùng thành công");
        setIsEditDialogOpen(false);
        loadUsers(); // Refresh the list
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
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể thay đổi trạng thái người dùng");
      }
    } catch (error) {
      console.error("Error changing user status:", error);
      toast.error("Không thể thay đổi trạng thái người dùng");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="font-['Inter'] text-lg text-gray-500 dark:text-slate-400">Đang tải...</div>
      </div>
    );
  }

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email, trường đại học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="USER">Người dùng</SelectItem>
              <SelectItem value="MENTOR">Mentor</SelectItem>
              <SelectItem value="STAFF">Nhân viên</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter - Default shows active users only */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm Người Dùng
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <UserTable
          users={filteredUsers.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Filters */}
        {filteredUsers.length === 0 &&
          (searchQuery || roleFilter !== "all" || statusFilter !== "active") && (
            <div className="flex justify-center pb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("active");
                }}>
                Xóa bộ lọc
              </Button>
            </div>
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
    </div>
  );
}
