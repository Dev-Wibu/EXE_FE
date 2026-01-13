import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractDataArray } from "@/lib/utils";
import { questionMajorManager } from "@/services";
import { toast } from "sonner";

import {
  DeleteQuestionMajorDialog,
  QuestionMajorFormDialog,
  QuestionMajorTable,
} from "./components";
import type { Major, MajorFormData } from "./types";

export function QuestionMajorManagementPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [formData, setFormData] = useState<Partial<MajorFormData>>({});

  // Load majors using the question major manager service
  const loadMajors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await questionMajorManager.getAll();
      if (response.success) {
        setMajors(extractDataArray<Major>(response));
      } else {
        toast.error(response.error || "Failed to load question majors");
      }
    } catch (error) {
      console.error("Error loading majors:", error);
      toast.error("Failed to load question majors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMajors();
  }, [loadMajors]);

  // Filter majors based on search query
  const filteredMajors = majors.filter((major) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      major.majorName?.toLowerCase().includes(lowerQuery) ||
      major.description?.toLowerCase().includes(lowerQuery)
    );
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (major: Major) => {
    setSelectedMajor(major);
    setFormData({
      majorName: major.majorName || "",
      description: major.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (major: Major) => {
    setSelectedMajor(major);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await questionMajorManager.create(formData);
      if (response.success) {
        toast.success("Question major created successfully");
        setIsCreateDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to create question major");
      }
    } catch (error) {
      console.error("Error creating major:", error);
      toast.error("Failed to create question major");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedMajor?.id) return;

    try {
      const response = await questionMajorManager.update(selectedMajor.id, formData);
      if (response.success) {
        toast.success("Question major updated successfully");
        setIsEditDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to update question major");
      }
    } catch (error) {
      console.error("Error updating major:", error);
      toast.error("Failed to update question major");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMajor?.id) return;

    try {
      const response = await questionMajorManager.delete(selectedMajor.id);
      if (response.success) {
        toast.success("Question major deleted successfully");
        setIsDeleteDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Failed to delete question major");
      }
    } catch (error) {
      console.error("Error deleting major:", error);
      toast.error("Failed to delete question major");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="font-['Inter'] text-lg text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Question Major Management
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Manage question majors/disciplines for interview assessments
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Search majors by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Major
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuestionMajorTable
          majors={filteredMajors.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Search */}
        {filteredMajors.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <QuestionMajorFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Add New Question Major"
        description="Fill in the information to create a new question major."
        submitLabel="Create Major"
      />

      {/* Edit Dialog */}
      <QuestionMajorFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Edit Question Major"
        description="Update the question major information."
        submitLabel="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteQuestionMajorDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        major={selectedMajor}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
