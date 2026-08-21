import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function LoadingState({ label = "Carregando...", size = "md", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-muted-foreground",
        size === "sm" ? "py-8" : "py-12",
        className
      )}
    >
      <Loader2 className={cn("animate-spin", size === "sm" ? "h-5 w-5" : "h-6 w-6")} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
