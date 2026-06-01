import { Button } from "@/components/ui/button";
import i18n from "@/lib/i18n";
import { Component, type ErrorInfo, type ReactNode } from "react";
const t = i18n.t.bind(i18n);
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Future: Send to monitoring service (Sentry, etc.)
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <h2 className="mb-4 text-2xl font-bold">{t("common.anErrorHasOccurred")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("compErrorboundary.theApplicationCrashesPleaseReload")}
            </p>
            <Button onClick={() => window.location.reload()}>{t("common.reloadThePage")}</Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
