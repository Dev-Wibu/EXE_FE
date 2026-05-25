import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ScrollToTopButtonProps {
  target?: HTMLElement | null;
  threshold?: number;
  hidden?: boolean;
  className?: string;
}

const DEFAULT_THRESHOLD = 600;

const getScrollTop = (target?: HTMLElement | null) => {
  if (target) {
    return target.scrollTop;
  }

  return window.scrollY || window.pageYOffset || 0;
};

export function ScrollToTopButton({
  target = null,
  threshold = DEFAULT_THRESHOLD,
  hidden = false,
  className,
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hidden) {
      return;
    }

    const scrollTarget: HTMLElement | Window = target ?? window;
    let frameId = 0;
    let lastScrollTop = getScrollTop(target);

    const updateVisibility = () => {
      setIsVisible(lastScrollTop >= threshold);
    };

    const handleScroll = () => {
      lastScrollTop = getScrollTop(target);

      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        updateVisibility();
        frameId = 0;
      });
    };

    handleScroll();
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [hidden, target, threshold]);

  const handleClick = () => {
    if (target) {
      target.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shouldShow = isVisible && !hidden;

  return (
    <button
      type="button"
      aria-label="Cuộn lên đầu trang"
      onClick={handleClick}
      className={cn(
        "fixed right-4 bottom-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg transition-opacity duration-300 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none md:right-6 md:bottom-6 md:h-12 md:w-12 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:focus-visible:ring-offset-slate-950",
        shouldShow ? "opacity-60" : "pointer-events-none opacity-0",
        className
      )}>
      <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
    </button>
  );
}
