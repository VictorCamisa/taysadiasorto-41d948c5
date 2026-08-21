import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAuthMenu } from "@/components/UserAuthMenu";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileWhatsApp } from "@/components/mobile/pages/MobileWhatsApp";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isAssistenteIA = location.pathname === "/assistente-ia";
  const isWhatsApp = location.pathname === "/crm/whatsapp";
  const isFullHeightPage = isAssistenteIA || isWhatsApp;

  // Mobile Layout - completely different structure
  if (isMobile) {
    // Full-screen mobile WhatsApp experience
    if (isWhatsApp) {
      return <MobileWhatsApp />;
    }

    return (
      <div className={cn(
        "flex flex-col w-full",
        isFullHeightPage ? "h-screen" : "min-h-screen"
      )}>
        {/* Adaptive Background for Mobile */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-background" />
        </div>

        {/* Mobile Content */}
        <main className={cn(
          "flex-1 flex flex-col min-w-0",
          isFullHeightPage 
            ? "h-full overflow-hidden" 
            : "overflow-y-auto pb-20"
        )}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!isFullHeightPage && <MobileBottomNav />}
      </div>
    );
  }

  // Desktop Layout - original structure
  return (
    <div className={cn(
      "flex w-full overflow-hidden relative bg-background",
      isFullHeightPage ? "h-screen" : "min-h-screen"
    )}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Main Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isFullHeightPage ? "h-full overflow-hidden" : "min-h-screen"
      )}>
        {/* Mobile Top Bar (tablet) */}
        <TopBar />

        {/* Desktop Top Actions */}
        <header className="hidden lg:flex h-16 items-center justify-end gap-4 px-8 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-px h-6 bg-border/50" />
            <UserAuthMenu />
          </div>
        </header>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-hidden",
            isFullHeightPage
              ? "flex flex-col min-h-0"
              : "p-6 md:p-8 lg:p-10 overflow-y-auto"
          )}
        >
          <div
            className={cn(
              isFullHeightPage
                ? "flex-1 flex flex-col min-h-0 h-full"
                : "max-w-[1600px] mx-auto w-full"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
