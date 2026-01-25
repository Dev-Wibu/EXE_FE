import { BookOpen, Bot, HelpCircle, Lightbulb, Newspaper, Users } from "lucide-react";
import { Link } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={icon2} alt="INBLUE AI" className="h-10 w-10" />
          <span className="text-lg font-bold tracking-tight text-[#002654] dark:text-white">
            INBLUE AI
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Questions Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                Câu hỏi
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/questions/bank"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">Ngân hàng câu hỏi</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Hơn 1,500+ câu hỏi phỏng vấn thực tế
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/questions/tips"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">Mẹo phỏng vấn</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Bí quyết phỏng vấn từ chuyên gia
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Features Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                Tính năng
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/features/ai-interview"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">AI Interview</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Phỏng vấn với trí tuệ nhân tạo 24/7
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/features/mentor-interview"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">Mock Interview</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Phỏng vấn với mentor chuyên nghiệp
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Resources Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                Tài nguyên
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/resources/faq"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">Câu hỏi thường gặp</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Giải đáp thắc mắc phổ biến
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/resources/blog"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">Blog</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Kiến thức và hướng dẫn phỏng vấn
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Buttons & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle iconOnly />
          <Button variant="ghost" className="text-slate-600 dark:text-slate-300" asChild>
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button
            className="rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-6 shadow-sm hover:shadow-md"
            asChild>
            <Link to="/select-role">Bắt đầu</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
