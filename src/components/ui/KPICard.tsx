import { forwardRef } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KPITone = "default" | "success" | "warning" | "danger" | "info";

interface KPICardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  tone?: KPITone;
  size?: "sm" | "md";
}

const toneIconClass: Record<KPITone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

const KPICard = forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, label, value, subtitle, icon: Icon, trend, tone = "default", size = "md", ...props }, ref) => {
    const TrendIcon = !trend ? null : trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus;
    const trendColorClass =
      !trend || trend.value === 0
        ? "text-muted-foreground"
        : trend.value > 0
        ? "text-success"
        : "text-destructive";

    return (
      <div
        ref={ref}
        className={cn("surface-card", size === "sm" ? "p-4" : "p-5", className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
            <p className={cn("font-bold text-foreground tracking-tight mt-1", size === "sm" ? "text-xl" : "text-2xl")}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", toneIconClass[tone])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        {trend && TrendIcon && (
          <div className={cn("flex items-center gap-1 text-xs font-medium mt-3", trendColorClass)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
    );
  }
);

KPICard.displayName = "KPICard";

export { KPICard };
