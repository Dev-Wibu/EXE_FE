import { ArrowLeft, Award, FileText, User } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";

import { mockMentorRegister } from "@/mocks/auth.mock";

interface FileUploadProps {
  label: string;
  required?: boolean;
  acceptedTypes: string;
  maxSize: string;
  icon: React.ReactNode;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: Record<string, string[]>;
  maxSizeBytes?: number;
}

function FileUploadBox({
  label,
  required,
  acceptedTypes,
  maxSize,
  icon,
  onFileSelect,
  selectedFile,
  accept,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept,
    maxSize: maxSizeBytes,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-lg outline outline-2 outline-offset-[-2px] outline-gray-300 transition-colors ${
        isDragActive ? "bg-violet-50 outline-violet-400" : "hover:bg-gray-50"
      }`}>
      <input {...getInputProps()} />
      <div className="flex h-10 w-10 items-center justify-center text-gray-400">{icon}</div>
      <p className="mt-2 font-['Roboto'] text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <p className="mt-1 font-['Roboto'] text-xs font-normal text-gray-500">
        {acceptedTypes} (Tối đa {maxSize})
      </p>
      {selectedFile ? (
        <p className="mt-2 font-['Inter'] text-xs font-medium text-violet-600">
          ✓ {selectedFile.name}
        </p>
      ) : (
        <button
          type="button"
          className="mt-3 h-8 w-20 rounded-md bg-violet-100 font-['Inter'] text-xs font-medium text-violet-600">
          Chọn file
        </button>
      )}
    </div>
  );
}

export function MentorRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    yearsOfExperience: "",
    company: "",
    position: "",
    expertise: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await mockMentorRegister({
      ...formData,
      cvFile: cvFile ?? undefined,
      certificateFile: certificateFile ?? undefined,
      idCardFile: idCardFile ?? undefined,
    });

    if (result.success) {
      navigate("/waiting-accept");
    } else {
      setError(result.error || "Đăng ký thất bại");
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    navigate("/select-role");
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-blue-50 pb-12">
      {/* Header */}
      <header className="h-40 w-full overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-100">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-28 w-40 items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-blue-800" />
            </div>
            <span className="font-['Orelega_One'] text-2xl font-normal text-blue-800">
              AI INTERVIEW
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">Câu hỏi</span>
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">
              Tính năng
            </span>
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">
              Tài nguyên
            </span>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex h-12 w-36 items-center justify-center rounded-2xl border border-black/20 bg-white font-['Open_Sans'] text-2xl font-normal text-neutral-900">
              Đăng nhập
            </Link>
            <button className="flex h-12 w-44 items-center justify-center rounded-2xl bg-violet-600 font-['Open_Sans'] text-xl font-normal text-white">
              Bắt đầu
            </button>
          </div>
        </div>
      </header>

      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link
          to="/select-role"
          className="inline-flex items-center gap-2 font-['Roboto'] text-lg font-bold text-violet-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="mx-auto mt-4 max-w-[1113px] rounded-2xl bg-white px-8 py-8 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.10)]">
        {/* Title */}
        <h1 className="text-center font-['Roboto'] text-3xl font-bold text-gray-800">
          Đăng ký trở thành Mentor
        </h1>
        <p className="mt-2 text-center font-['Roboto'] text-base font-normal text-gray-500">
          Vui lòng cung cấp thông tin và giấy tờ cần thiết
        </p>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Information */}
          <div className="mt-8 border-b border-gray-200 pb-8">
            <h2 className="font-['Roboto'] text-xl font-bold text-gray-800">Thông tin cá nhân</h2>

            <div className="mt-6 grid grid-cols-3 gap-6">
              {/* Full Name */}
              <div>
                <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="mt-2 h-9 w-full rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="mt-2 h-9 w-full rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className="mt-2 h-9 w-full rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                  required
                />
              </div>
            </div>

            {/* Years of Experience */}
            <div className="mt-4">
              <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                Số năm kinh nghiệm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="5 năm"
                className="mt-2 h-9 w-96 rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                required
              />
            </div>
          </div>

          {/* Section 2: Professional Information */}
          <div className="mt-8 border-b border-gray-200 pb-8">
            <h2 className="font-['Roboto'] text-xl font-bold text-gray-800">
              Thông tin nghề nghiệp
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Company */}
              <div>
                <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                  Công ty hiện tại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Google Vietnam"
                  className="mt-2 h-9 w-full rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                  Vị trí công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Senior Software Engineer"
                  className="mt-2 h-9 w-full rounded-lg bg-white px-4 font-['Inter'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                  required
                />
              </div>
            </div>

            {/* Expertise */}
            <div className="mt-4">
              <label className="font-['Roboto'] text-sm font-medium text-gray-700">
                Lĩnh vực chuyên môn <span className="text-red-500">*</span>
              </label>
              <textarea
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                placeholder="Ví dụ: AI, Machine Learning, Python, Data Science..."
                className="mt-2 h-16 w-full resize-none rounded-lg bg-white px-4 py-3 font-['Roboto'] text-sm font-normal text-neutral-500 outline outline-1 outline-offset-[-1px] outline-gray-300 focus:outline-violet-500"
                required
              />
            </div>
          </div>

          {/* Section 3: Documents */}
          <div className="mt-8 border-b border-gray-200 pb-8">
            <h2 className="font-['Roboto'] text-xl font-bold text-gray-800">Giấy tờ chứng minh</h2>

            <div className="mt-6 space-y-6">
              {/* CV Upload */}
              <FileUploadBox
                label="CV/Resume"
                required
                acceptedTypes="PDF, DOC, DOCX"
                maxSize="5MB"
                icon={<FileText className="h-10 w-10" />}
                onFileSelect={setCvFile}
                selectedFile={cvFile}
                accept={{
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
                    ".docx",
                  ],
                }}
                maxSizeBytes={5 * 1024 * 1024}
              />

              {/* Certificate Upload */}
              <FileUploadBox
                label="Chứng chỉ/Bằng cấp"
                acceptedTypes="PDF, JPG, PNG"
                maxSize="5MB"
                icon={<Award className="h-10 w-10" />}
                onFileSelect={setCertificateFile}
                selectedFile={certificateFile}
                accept={{
                  "application/pdf": [".pdf"],
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/png": [".png"],
                }}
                maxSizeBytes={5 * 1024 * 1024}
              />

              {/* ID Card Upload */}
              <FileUploadBox
                label="CCCD/CMND"
                acceptedTypes="JPG, PNG"
                maxSize="5MB"
                icon={<User className="h-10 w-10" />}
                onFileSelect={setIdCardFile}
                selectedFile={idCardFile}
                accept={{
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/png": [".png"],
                }}
                maxSizeBytes={5 * 1024 * 1024}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="mt-4 text-center font-['Roboto'] text-base text-red-500">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 flex-1 rounded-lg bg-white font-['Inter'] text-sm font-bold text-gray-700 outline outline-2 outline-offset-[-2px] outline-gray-300 transition-colors hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 flex-1 rounded-lg bg-violet-600 font-['Inter'] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {isLoading ? "Đang gửi..." : "Gửi đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
