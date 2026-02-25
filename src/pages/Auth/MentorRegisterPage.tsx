import { ArrowLeft, Award, FileText, User } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authManager } from "@/services/auth.manager";

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
      className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isDragActive
          ? "border-[#0047AB] bg-[#0047AB]/5"
          : "border-slate-200 hover:border-[#0047AB]/50 hover:bg-slate-50"
      }`}>
      <input {...getInputProps()} />
      <div className="flex h-10 w-10 items-center justify-center text-slate-400">{icon}</div>
      <p className="mt-2 text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {acceptedTypes} (Tối đa {maxSize})
      </p>
      {selectedFile ? (
        <p className="mt-2 text-xs font-medium text-[#0047AB]">✓ {selectedFile.name}</p>
      ) : (
        <Button type="button" variant="secondary" size="sm" className="mt-2">
          Chọn file
        </Button>
      )}
    </div>
  );
}

export function MentorRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    yearsOfExperience: "",
    expertise: "",
    linkedInUrl: "",
    currentCompany: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [otherFile, setOtherFile] = useState<File | null>(null);
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    const result = await authManager.registerMentor({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      bio: formData.bio || undefined,
      expertise: formData.expertise,
      yearsOfExperience: formData.yearsOfExperience
        ? Number(formData.yearsOfExperience)
        : undefined,
      linkedInUrl: formData.linkedInUrl || undefined,
      currentCompany: formData.currentCompany,
      avatar: avatarFile ?? undefined,
      identityFile: identityFile ?? undefined,
      degreeFile: degreeFile ?? undefined,
      otherFile: otherFile ?? undefined,
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-3xl px-6">
          {/* Back Button */}
          <Link
            to="/select-role"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0047AB] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          {/* Main Form Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Đăng ký trở thành Mentor</CardTitle>
              <CardDescription>Vui lòng cung cấp thông tin và giấy tờ cần thiết</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Thông tin tài khoản</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Họ và tên <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Mật khẩu <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Nhập mật khẩu"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Professional Information */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-slate-900">Thông tin nghề nghiệp</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentCompany">
                        Công ty hiện tại <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="currentCompany"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleChange}
                        placeholder="Tên công ty hiện tại"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">
                        Số năm kinh nghiệm <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        min="0"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        placeholder="5"
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="linkedInUrl">Hồ sơ LinkedIn</Label>
                      <Input
                        id="linkedInUrl"
                        name="linkedInUrl"
                        type="url"
                        value={formData.linkedInUrl}
                        onChange={handleChange}
                        placeholder="https://www.linkedin.com/in/ho-so-cua-ban"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expertise">
                      Lĩnh vực chuyên môn <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="expertise"
                      name="expertise"
                      value={formData.expertise}
                      onChange={handleChange}
                      placeholder="Ví dụ: AI, Học máy, Python, Khoa học dữ liệu..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu bản thân</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Viết vài dòng giới thiệu về kinh nghiệm và phong cách cố vấn của bạn..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Section 3: Documents */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-slate-900">Giấy tờ chứng minh</h3>
                  <p className="text-sm text-slate-500">
                    Tải lên các giấy tờ để xác minh danh tính và năng lực của bạn
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileUploadBox
                      label="Ảnh đại diện"
                      acceptedTypes="JPG, PNG"
                      maxSize="5MB"
                      icon={<User className="h-8 w-8" />}
                      onFileSelect={setAvatarFile}
                      selectedFile={avatarFile}
                      accept={{
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      }}
                      maxSizeBytes={5 * 1024 * 1024}
                    />

                    <FileUploadBox
                      label="CCCD/CMND"
                      acceptedTypes="JPG, PNG, PDF"
                      maxSize="5MB"
                      icon={<FileText className="h-8 w-8" />}
                      onFileSelect={setIdentityFile}
                      selectedFile={identityFile}
                      accept={{
                        "application/pdf": [".pdf"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      }}
                      maxSizeBytes={5 * 1024 * 1024}
                    />

                    <FileUploadBox
                      label="Bằng cấp/Chứng chỉ"
                      acceptedTypes="PDF, JPG, PNG"
                      maxSize="5MB"
                      icon={<Award className="h-8 w-8" />}
                      onFileSelect={setDegreeFile}
                      selectedFile={degreeFile}
                      accept={{
                        "application/pdf": [".pdf"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      }}
                      maxSizeBytes={5 * 1024 * 1024}
                    />

                    <FileUploadBox
                      label="Tài liệu khác"
                      acceptedTypes="PDF, JPG, PNG"
                      maxSize="5MB"
                      icon={<FileText className="h-8 w-8" />}
                      onFileSelect={setOtherFile}
                      selectedFile={otherFile}
                      accept={{
                        "application/pdf": [".pdf"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      }}
                      maxSizeBytes={5 * 1024 * 1024}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && <p className="text-center text-sm text-red-500">{error}</p>}

                {/* Action Buttons */}
                <div className="flex gap-4 border-t pt-6">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Đang gửi..." : "Gửi đăng ký"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
