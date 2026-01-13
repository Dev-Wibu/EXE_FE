import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mentorManager } from "@/services";
import { toast } from "sonner";

import { DeleteMentorDialog, MentorFormDialog, MentorTable } from "./components";
import type { Mentor, MentorFormData } from "./types";

export function MentorManagementPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [formData, setFormData] = useState<Partial<MentorFormData>>({});

  // Load mentors using the mentor manager service
  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mentorManager.getAll();
      if (response.success && response.data) {
        // Handle both paginated and array responses
        const mentorData = Array.isArray(response.data) ? response.data : response.data.data;
        setMentors(mentorData as Mentor[]);
      } else {
        toast.error(response.error || "Failed to load mentors");
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast.error("Failed to load mentors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // Filter mentors based on search query
  const filteredMentors = mentors.filter((mentor) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      mentor.name?.toLowerCase().includes(lowerQuery) ||
      mentor.email?.toLowerCase().includes(lowerQuery) ||
      mentor.expertise?.toLowerCase().includes(lowerQuery) ||
      mentor.currentCompany?.toLowerCase().includes(lowerQuery)
    );
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setFormData({
      name: mentor.name || "",
      email: mentor.email || "",
      bio: mentor.bio,
      expertise: mentor.expertise,
      yearsOfExperience: mentor.yearsOfExperience,
      linkedInUrl: mentor.linkedInUrl,
      currentCompany: mentor.currentCompany,
      rate: mentor.rate,
      active: mentor.active ?? true, // Ensure boolean value, default to true if null/undefined
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await mentorManager.create(formData);
      if (response.success) {
        toast.success("Mentor created successfully");
        setIsCreateDialogOpen(false);
        loadMentors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to create mentor");
      }
    } catch (error) {
      console.error("Error creating mentor:", error);
      toast.error("Failed to create mentor");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedMentor?.id) return;

    try {
      console.log("Updating mentor with formData:", formData);
      const response = await mentorManager.update(selectedMentor.id, formData);
      if (response.success) {
        toast.success("Mentor updated successfully");
        setIsEditDialogOpen(false);
        loadMentors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to update mentor");
      }
    } catch (error) {
      console.error("Error updating mentor:", error);
      toast.error("Failed to update mentor");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMentor?.id) return;

    try {
      const response = await mentorManager.delete(selectedMentor.id);
      if (response.success) {
        toast.success("Mentor deleted successfully");
        setIsDeleteDialogOpen(false);
        loadMentors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to delete mentor");
      }
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast.error("Failed to delete mentor");
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
          Mentor Management
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Manage mentor accounts, profiles, and settings
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Search mentors by name, email, expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Mentor
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <MentorTable
          mentors={filteredMentors.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Search */}
        {filteredMentors.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <MentorFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Add New Mentor"
        description="Fill in the information to create a new mentor account."
        submitLabel="Create Mentor"
      />

      {/* Edit Dialog */}
      <MentorFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Edit Mentor"
        description="Update the mentor information."
        submitLabel="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMentorDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        mentor={selectedMentor}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
