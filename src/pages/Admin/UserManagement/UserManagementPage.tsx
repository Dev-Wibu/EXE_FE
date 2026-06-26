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
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { candidateProfileManager, usersAdminManager } from "@/services";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CandidateProfileModal, DeleteUserDialog, UserFormDialog, UserTable } from "./components";
import type { User, UserFormData } from "./types";
export function UserManagementPage() {
  const { t } = useTranslation();
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
  const loadUsers = useCallback(
    async (showReloading = false) => {
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
          toast.error(response.error || t("common.unableToLoadUserList"));
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error(t("common.unableToLoadUserList"));
      } finally {
        if (showReloading) {
          setIsReloading(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    },
    [t]
  );
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
          // @ts-expect-error: Backend Swagger schema mismatch - university/major not in User type
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
    setFormData({
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: user.password || "",
      role: user.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((user as any).university !== undefined && { university: (user as any).university }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((user as any).major !== undefined && { major: (user as any).major }),
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
        toast.info(t("adminUsermanagement.thisUserDoesNotHave"));
      }
    } catch {
      toast.info(t("adminUsermanagement.thisUserDoesNotHave"));
    }
  };

  // Handle CV upload via dedicated modal
  const handleCvUpload = async (file: File) => {
    if (!selectedUser?.id) return;
    setIsCvUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(selectedUser.id, file);
      if (response.success) {
        toast.success(t("common.uploadCvSuccessfully"));
        void loadUsers(); // Refresh the list to show updated CV status
      } else {
        toast.error(response.error || t("common.uploadCvFailed"));
      }
    } finally {
      setIsCvUploading(false);
    }
  };
  const handleSubmitCreate = async () => {
    try {
      const response = await usersAdminManager.create(formData);
      if (response.success) {
        toast.success(t("adminUsermanagement.userCreatedSuccessfully"));
        setIsCreateDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || t("common.unableToCreateUser"));
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(t("common.unableToCreateUser"));
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
        toast.success(t("adminUsermanagement.userUpdatedSuccessfully"));
        setIsEditDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || t("common.unableToUpdateUser"));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(t("common.unableToUpdateUser"));
    }
  };
  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) return;
    try {
      // Toggle the user's active status (activate/deactivate)
      const response = await usersAdminManager.toggleActive(selectedUser.id, selectedUser);
      if (response.success) {
        const action =
          selectedUser.isActive !== false
            ? t("adminUsermanagement.disabled")
            : t("paymentPaymentsuccesspage.activated");
        toast.success(
          t("general.userSuccessfully", {
            var_0: action,
          })
        );
        setIsDeleteDialogOpen(false);
        void loadUsers(); // Refresh the list
      } else {
        toast.error(response.error || t("adminUsermanagement.userStatusCannotBeChanged"));
      }
    } catch (error) {
      console.error("Error changing user status:", error);
      toast.error(t("adminUsermanagement.userStatusCannotBeChanged"));
    }
  };
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("adminUsermanagement.userManagement")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("adminUsermanagement.manageUserAccountsRolesAnd")}
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
              placeholder={t("adminUsermanagement.searchByNameEmailUniversity")}
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
              <SelectValue placeholder={t("common.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.shutDown")}</SelectItem>
              <SelectItem value="all">{t("common.allStatus")}</SelectItem>
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
              {t("common.clearFilter")}
            </Button>
          )}
          <ReloadButton
            onReload={() => loadUsers(true)}
            isLoading={isReloading}
            tooltip={t("adminUsermanagement.reloadUserList")}
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("adminUsermanagement.addUser")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label={t("adminUsermanagement.loadingUserList")} />
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
                  {t("common.clearFilter")}
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
        title={t("adminUsermanagement.addNewUser")}
        description={t("adminUsermanagement.fillInTheInformationTo")}
        submitLabel={t("adminUsermanagement.createUsers")}
      />

      {/* Edit Dialog */}
      <UserFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title={t("adminUsermanagement.userEditing")}
        description={t("adminUsermanagement.updateUserInformation")}
        submitLabel={t("common.saveChanges")}
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
        title={t("common.uploadCv")}
        description={t("adminUsermanagement.uploadUserSCvOnly")}
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
