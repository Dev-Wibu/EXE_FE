import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { DemoLoginButton } from "@/components/DemoLoginButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authManager } from "@/services/auth.manager";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken, setIsLoggedIn } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await authManager.login({ email, password });

    if (result.success && result.data?.user) {
      const userId =
        typeof result.data.user.id === "string"
          ? parseInt(result.data.user.id)
          : result.data.user.id;

      // Store auth state
      setUser({
        id: userId,
        name: result.data.user.fullName,
        email: result.data.user.email,
        role: result.data.user.role?.toUpperCase() as "USER" | "ADMIN" | "MENTOR" | "STAFF",
        avatarUrl: result.data.user.avatar || undefined,
      });
      setToken(result.data.token ?? null);
      setIsLoggedIn(true);

      // Store current user ID in localStorage for BE queries
      if (userId && !isNaN(userId)) {
        localStorage.setItem("current-user-id", String(userId));
      }

      navigate(getDashboardPath(result.data.user.role));
    } else {
      setError(result.error || "Đăng nhập thất bại");
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    // Mock Google login - redirect to dashboard for regular users
    navigate("/user");
  };

  // Handler for demo account selection - auto-fills credentials
  const handleDemoAccountSelect = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <Card className="w-full max-w-md dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[#0047AB] dark:text-[#66B2FF]">Đăng nhập</CardTitle>
        <CardDescription className="dark:text-slate-400">
          Chào mừng quay trở lại. Vui lòng điền thông tin đăng nhập
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-3 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={handleGoogleLogin}>
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          Tiếp tục với Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              hoặc
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              required
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="dark:text-slate-300">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="#" className="text-sm text-[#0047AB] hover:underline dark:text-[#66B2FF]">
              Quên mật khẩu?
            </Link>
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <DemoLoginButton onSelectAccount={handleDemoAccountSelect} />

        {/* Signup Link */}
        <p className="text-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">Bạn có tài khoản chưa? </span>
          <Link
            to="/signup"
            className="font-medium text-[#0047AB] hover:underline dark:text-[#66B2FF]">
            Đăng ký ngay
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
