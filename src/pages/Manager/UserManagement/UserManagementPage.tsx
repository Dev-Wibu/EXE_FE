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
        toast.error(response.error || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users based on search query and role filter
  const filteredUsers = users.filter((user) => {
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
      bio: user.bio,
      university: user.university,
      major: user.major,
      targetPosition: user.targetPosition,
      targetLevel: user.targetLevel,
      isActive: user.isActive,
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
        toast.success("User created successfully");
        setIsCreateDialogOpen(false);
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser?.id) return;

    try {
      const response = await usersAdminManager.update(selectedUser.id, formData);
      if (response.success) {
        toast.success("User updated successfully");
        setIsEditDialogOpen(false);
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) return;

    try {
      const response = await usersAdminManager.delete(selectedUser.id);
      if (response.success) {
        toast.success("User deleted successfully");
        setIsDeleteDialogOpen(false);
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="font-['Inter'] text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          User Management
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Manage user accounts, roles, and permissions
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
              placeholder="Search users by name, email, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="MENTOR">Mentor</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New User
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
        {filteredUsers.length === 0 && (searchQuery || roleFilter !== "all") && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
              }}>
              Clear Filters
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
        title="Add New User"
        description="Fill in the information to create a new user account."
        submitLabel="Create User"
      />

      {/* Edit Dialog */}
      <UserFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Edit User"
        description="Update the user information."
        submitLabel="Save Changes"
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
