import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, type LucideIcon } from "lucide-react";
import { modules, globalItems } from "@/config/navigation";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  matchPaths?: string[];
}

const financeiro = modules.find((m) => m.id === "financeiro")!;
const crm = modules.find((m) => m.id === "crm")!;
const gestao = modules.find((m) => m.id === "gestao")!;
const assistenteIA = globalItems.find((i) => i.to === "/assistente-ia")!;

// Curated 5-slot subset for thumb reach — icons/paths derive from the shared
// nav config so they can't drift, but the selection/labels here stay hand-picked.
const navItems: NavItem[] = [
  { label: "Início", to: "/", icon: Home, matchPaths: ["/"] },
  { label: "Financeiro", to: financeiro.basePath, icon: financeiro.icon, matchPaths: [financeiro.basePath] },
  { label: "CRM", to: "/crm/pipeline", icon: crm.icon, matchPaths: [crm.basePath] },
  { label: "Gestão", to: gestao.basePath, icon: gestao.icon, matchPaths: [gestao.basePath] },
  { label: "IA", to: assistenteIA.to, icon: assistenteIA.icon, matchPaths: [assistenteIA.to] },
];

export function MobileBottomNav() {
  const location = useLocation();

  const isActive = (item: NavItem) => {
    if (item.to === "/" && location.pathname === "/") return true;
    if (item.to === "/" && location.pathname !== "/") return false;
    return item.matchPaths?.some(path => location.pathname.startsWith(path));
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      "bg-background/95 dark:bg-background/90",
      "backdrop-blur-xl",
      "border-t border-border/40 dark:border-border/20",
      "safe-area-bottom"
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isAI = item.to === "/assistente-ia";

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "min-w-[60px] py-1.5 px-2 rounded-xl",
                "transition-all duration-200 active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-8 rounded-lg",
                "transition-all duration-200",
                active && "bg-primary/15",
                isAI && !active && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isAI && "text-primary"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
