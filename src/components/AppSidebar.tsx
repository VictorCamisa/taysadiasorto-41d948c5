import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoTaysa from "@/assets/logo-dra-taysa.png";
import { Home, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  modules,
  globalItems,
  moduleColorClass,
  getActiveModule,
  isLeafActive,
  type NavModule,
} from "@/config/navigation";

const COLLAPSE_KEY = "sidebar:collapsed";

function NavModuleSection({ module, collapsed }: { module: NavModule; collapsed: boolean }) {
  const location = useLocation();
  const activeModule = getActiveModule(location.pathname);
  const isActive = activeModule?.id === module.id;
  const [isOpen, setIsOpen] = useState(isActive);
  const Icon = module.icon;

  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  if (collapsed) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Link
            to={module.basePath}
            className={cn(
              "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors",
              isActive
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && moduleColorClass[module.id])} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{module.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
          "text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-4 w-4", isActive && moduleColorClass[module.id])} />
          <span>{module.label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="ml-5 mt-1 space-y-0.5 border-l border-border pl-3">
          {module.items.map((item) => {
            const ItemIcon = item.icon;
            const itemActive = isLeafActive(location.pathname, location.search, item);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                  itemActive
                    ? "text-primary font-medium bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ItemIcon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  const isHomeActive = location.pathname === "/";

  return (
    <aside
      className={cn(
        "h-screen flex flex-col flex-shrink-0",
        "bg-card border-r border-border",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img
              src={logoTaysa}
              alt="Dra. Taysa Dias"
              className="h-10 w-auto dark:brightness-125 dark:contrast-110 dark:saturate-110"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {/* Home */}
          {collapsed ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className={cn(
                    "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors",
                    isHomeActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Home className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Início</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isHomeActive
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
          )}

          <Separator className="my-3" />

          {!collapsed && (
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
              Módulos
            </p>
          )}
          <div className={cn("space-y-1", collapsed && "space-y-2")}>
            {modules.map((module) => (
              <NavModuleSection key={module.id} module={module} collapsed={collapsed} />
            ))}
          </div>

          <Separator className="my-3" />

          {!collapsed && (
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
              Sistema
            </p>
          )}
          <div className={cn("space-y-1", collapsed && "space-y-2")}>
            {globalItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              if (collapsed) {
                return (
                  <Tooltip key={item.to} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            © 2024 Dra. Taysa Dias
          </p>
        </div>
      )}
    </aside>
  );
}
