import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { mockSignup } from "@/mocks/auth.mock";

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthday: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate terms agreement
    if (!agreeTerms) {
      setError("Vui lòng đồng ý với các điều khoản");
      return;
    }

    setIsLoading(true);

    const result = await mockSignup({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      birthday: formData.birthday,
      password: formData.password,
    });

    if (result.success) {
      // Navigate to select role page after successful signup
      navigate("/select-role");
    } else {
      setError(result.error || "Đăng ký thất bại");
    }

    setIsLoading(false);
  };

  const handleGoogleSignup = () => {
    // Mock Google signup - redirect to select role
    navigate("/select-role");
  };

  return (
    <div className="flex w-full max-w-[720px] flex-col items-center py-8">
      {/* Card Container */}
      <div className="w-full rounded-[30px] bg-white/40 px-[121px] py-8 outline outline-1 outline-offset-[-1px] outline-black/60">
        {/* Title */}
        <h1 className="mb-2 text-center font-['Markazi_Text'] text-5xl font-semibold text-indigo-600">
          Đăng ký
        </h1>

        {/* Subtitle */}
        <p className="mb-8 text-center font-['Markazi_Text'] text-2xl font-normal text-black/70">
          Chào mừng đến với InBlue. Vui lòng điền thông tin
        </p>

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="mb-8 flex h-16 w-full items-center justify-center gap-3 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black/40 transition-colors hover:bg-gray-50">
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-['Markazi_Text'] text-3xl font-medium text-black">
            Tiếp tục với Google
          </span>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Họ và tên
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-2 h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Email
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Số điện thoại
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-2 h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Birthday Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Ngày sinh
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <div className="relative mt-2">
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
                required
              />
              <CalendarIcon className="pointer-events-none absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 text-black/70" />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Mật khẩu
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label className="mb-1 block font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Xác nhận mật khẩu
            </label>
            <div className="h-px w-full rounded-sm border border-neutral-200/60 bg-neutral-700" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-2 h-10 w-full border-b border-neutral-700 bg-transparent font-['Markazi_Text'] text-2xl font-normal text-black focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Terms Checkbox */}
          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-6 w-6 rounded-[5px] border border-purple-600"
            />
            <label
              htmlFor="agreeTerms"
              className="font-['Markazi_Text'] text-3xl font-medium text-black/40">
              Tôi đồng ý với các điều khoản của InBlue
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <p className="mb-4 text-center font-['Markazi_Text'] text-xl text-red-500">{error}</p>
          )}

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="h-16 w-full rounded-[20px] bg-gradient-to-r from-violet-400 via-violet-400 to-indigo-600 font-['Markazi_Text'] text-3xl font-normal text-white outline outline-1 outline-offset-[-1px] outline-black/40 transition-opacity hover:opacity-90 disabled:opacity-50">
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center">
          <span className="font-['Markazi_Text'] text-2xl font-normal text-black">
            Bạn đã có tài khoản?{" "}
          </span>
          <Link
            to="/login"
            className="font-['Markazi_Text'] text-2xl font-normal text-indigo-600 hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
