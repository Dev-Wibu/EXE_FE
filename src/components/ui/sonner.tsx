import { getEffectiveTheme, useThemeStore } from "@/stores/themeStore";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useThemeStore();
  const effectiveTheme = getEffectiveTheme(theme);

  return (
    <Sonner
      theme={effectiveTheme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      duration={4000}
      gap={12}
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-500" />,
        info: <InfoIcon className="size-5 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-5 text-amber-500" />,
        error: <OctagonXIcon className="size-5 text-red-500" />,
        loading: <Loader2Icon className="size-5 animate-spin text-blue-500" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-900 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800 group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          description:
            "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900 group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400 group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!border-emerald-200 group-[.toaster]:!text-emerald-900 dark:group-[.toaster]:!bg-emerald-950/50 dark:group-[.toaster]:!border-emerald-800 dark:group-[.toaster]:!text-emerald-100",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!border-red-200 group-[.toaster]:!text-red-900 dark:group-[.toaster]:!bg-red-950/50 dark:group-[.toaster]:!border-red-800 dark:group-[.toaster]:!text-red-100",
          warning:
            "group-[.toaster]:!bg-amber-50 group-[.toaster]:!border-amber-200 group-[.toaster]:!text-amber-900 dark:group-[.toaster]:!bg-amber-950/50 dark:group-[.toaster]:!border-amber-800 dark:group-[.toaster]:!text-amber-100",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!border-blue-200 group-[.toaster]:!text-blue-900 dark:group-[.toaster]:!bg-blue-950/50 dark:group-[.toaster]:!border-blue-800 dark:group-[.toaster]:!text-blue-100",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:border-slate-200 group-[.toast]:text-slate-500 group-[.toast]:hover:bg-slate-100 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:border-slate-700 dark:group-[.toast]:text-slate-400 dark:group-[.toast]:hover:bg-slate-700",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          zIndex: 9999,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
