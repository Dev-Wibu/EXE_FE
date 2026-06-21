import type { SortDirection } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/interfaces";
import { extractDataArray } from "@/lib/utils";
import { questionBankManager } from "@/services/question-bank.manager";
import { questionCategoryManager } from "@/services/question-category.manager";
import { FolderOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DeleteQuestionBankDialog } from "./components/DeleteQuestionBankDialog";
import { QuestionBankFormDialog } from "./components/QuestionBankFormDialog";
import { QuestionBankTable } from "./components/QuestionBankTable";
import type { QuestionBank, QuestionBankFormData, QuestionCategory } from "./types";

export function QuestionBankManagementPage() {
  const { t } = useTranslation();

  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBank | null>(null);
  const [formData, setFormData] = useState<Partial<QuestionBankFormData>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [banksRes, catRes] = await Promise.all([
        questionBankManager.getAll(),
        questionCategoryManager.getAll(),
      ]);
      if (banksRes.success && banksRes.data) {
        setQuestions(banksRes.data);
      }
      if (catRes.success && catRes.data) {
        setCategories(extractDataArray(catRes as unknown as ApiResponse<QuestionCategory[]>));
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setFormData({ options: ["", "", "", ""] });
    setIsFormOpen(true);
  };

  const handleCreateCategory = async (categoryName: string) => {
    try {
      const res = await questionCategoryManager.create({ categoryName });
      if (res.success) {
        toast.success("Thêm chuyên mục thành công");
        fetchData();
        return res.data?.id;
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Đã xảy ra lỗi hệ thống");
    }
  };

  const handleEdit = (q: QuestionBank) => {
    setEditingQuestion(q);
    setFormData({
      questionCategory: q.questionCategory?.id ? { id: q.questionCategory.id } : undefined,
      questionLevel: q.questionLevel,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (q: QuestionBank) => {
    setEditingQuestion(q);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.questionCategory?.id || !formData.questionLevel || !formData.questionText) {
      toast.error("Vui lòng nhập đầy đủ Chuyên mục, Độ khó và Nội dung câu hỏi.");
      return;
    }

    try {
      let res;
      if (editingQuestion?.id) {
        res = await questionBankManager.update(
          editingQuestion.id,
          formData as QuestionBankFormData
        );
      } else {
        res = await questionBankManager.create(formData as QuestionBankFormData);
      }

      if (res.success) {
        toast.success(editingQuestion ? "Cập nhật thành công" : "Thêm mới thành công");
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Đã xảy ra lỗi hệ thống");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!editingQuestion?.id) return;

    try {
      const res = await questionBankManager.delete(editingQuestion.id);
      if (res.success) {
        toast.success("Đã xóa câu hỏi");
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Đã xảy ra lỗi hệ thống");
    }
  };

  const getSortProps = () => ({
    direction: "asc" as SortDirection,
    onChange: () => {},
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("common.questionBank", "Ngân hàng đề")}
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Quản lý danh sách câu hỏi cho các vòng thi Quiz.
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("adminQuestionbankmanagement.addQuestion")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-6 dark:bg-slate-900/50">
        <div className="flex h-full flex-col space-y-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <QuestionBankTable
                questions={questions}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                getSortProps={getSortProps}
              />
            </div>
          )}
        </div>
      </div>

      <QuestionBankFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleFormSubmit}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        title={editingQuestion ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}
        description={
          editingQuestion
            ? "Chỉnh sửa thông tin câu hỏi. Các thay đổi sẽ được cập nhật ngay."
            : "Tạo câu hỏi mới hoặc sử dụng AI để tự động tạo câu hỏi."
        }
        submitLabel={
          editingQuestion ? t("general.update", "Cập nhật") : t("general.create", "Thêm mới")
        }
      />

      <DeleteQuestionBankDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        question={editingQuestion}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
