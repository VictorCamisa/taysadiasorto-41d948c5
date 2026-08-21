import {
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { modules as navModules, globalItems, moduleColorClass, type ModuleId } from "@/config/navigation";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  features: string[];
  gradient: string;
  accentColor: string;
}

const moduleGradient: Record<ModuleId, string> = {
  financeiro: "from-module-financeiro/20 via-module-financeiro/5 to-transparent",
  crm: "from-module-crm/20 via-module-crm/5 to-transparent",
  admin: "from-module-admin/20 via-module-admin/5 to-transparent",
  bi: "from-module-bi/20 via-module-bi/5 to-transparent",
  gestao: "from-module-gestao/20 via-module-gestao/5 to-transparent",
};

const modules: ModuleCardProps[] = navModules.map((module) => ({
  title: module.label,
  description: module.description,
  icon: module.icon,
  href: module.basePath,
  features: module.items.slice(0, 3).map((item) => item.label),
  gradient: moduleGradient[module.id],
  accentColor: moduleColorClass[module.id],
}));

const assistenteIA = globalItems.find((i) => i.to === "/assistente-ia")!;
const configuracoes = globalItems.find((i) => i.to === "/configuracoes")!;

function ModuleCard({
  title,
  description,
  icon: Icon,
  href,
  features,
  gradient,
  accentColor,
}: ModuleCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col rounded-2xl p-6 h-full overflow-hidden",
        "bg-card/80 dark:bg-card/90",
        "border border-border/50 dark:border-border/40",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg dark:hover:shadow-xl",
        "hover:border-primary/20 dark:hover:border-primary/30",
        "hover:-translate-y-1.5"
      )}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100",
          "transition-opacity duration-500",
          gradient
        )}
      />

      {/* Glow Effect (dark mode only) - subtle */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              "bg-primary/10 dark:bg-primary/15",
              "border border-primary/10 dark:border-primary/20",
              "group-hover:scale-105 transition-transform duration-300"
            )}
          >
            <Icon className={cn("h-6 w-6", accentColor)} />
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              "bg-muted/50 dark:bg-muted/30",
              "opacity-0 group-hover:opacity-100",
              "translate-x-2 group-hover:translate-x-0",
              "transition-all duration-300"
            )}
          >
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {features.map((feature) => (
            <span
              key={feature}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg",
                "bg-muted/60 dark:bg-muted/40",
                "text-muted-foreground",
                "border border-border/30 dark:border-border/20",
                "group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20",
                "transition-all duration-300"
              )}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  variant = "default",
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  variant?: "default" | "primary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex items-center gap-5 p-5 rounded-2xl overflow-hidden",
        "transition-all duration-500 ease-out",
        isPrimary
          ? [
              "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
              "dark:from-primary/20 dark:via-primary/10 dark:to-primary/5",
              "border border-primary/20 dark:border-primary/30",
              "hover:border-primary/40 dark:hover:border-primary/50",
              "hover:shadow-lg hover:shadow-primary/10",
              "dark:hover:shadow-xl dark:hover:shadow-primary/20",
            ]
          : [
              "bg-card/80 dark:bg-card/40",
              "border border-border/50 dark:border-border/30",
              "backdrop-blur-sm",
              "hover:border-border dark:hover:border-border/50",
              "hover:shadow-lg dark:hover:shadow-xl",
            ],
        "hover:-translate-y-1"
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0",
          "transition-all duration-500",
          isPrimary
            ? [
                "bg-primary/10 dark:bg-primary/20",
                "group-hover:bg-primary/20 dark:group-hover:bg-primary/30",
                "group-hover:scale-110",
              ]
            : [
                "bg-muted/60 dark:bg-muted/40",
                "group-hover:bg-primary/10 dark:group-hover:bg-primary/20",
                "group-hover:scale-110",
              ]
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6 transition-colors duration-300",
            isPrimary
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-semibold text-foreground mb-1",
            "group-hover:text-primary transition-colors duration-300"
          )}
        >
          {title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>

      {/* Arrow */}
      <ArrowRight
        className={cn(
          "h-5 w-5 shrink-0",
          "text-muted-foreground/50 group-hover:text-primary",
          "translate-x-0 group-hover:translate-x-1",
          "transition-all duration-300"
        )}
      />
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-full">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Light mode gradient */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl dark:hidden" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl dark:hidden" />

        {/* Dark mode - minimal accent */}
        <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/[0.03] rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-10 animate-fade-in py-2">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Dashboard
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Bem-vindo ao Sistema
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Gerencie sua clínica de forma inteligente. Selecione um módulo para
            começar.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: TrendingUp,
              label: "Receita Mensal",
              value: "Módulo Financeiro",
            },
            { icon: Users, label: "Pacientes Ativos", value: "Módulo CRM" },
            { icon: Shield, label: "Conformidade", value: "Módulo Admin" },
            { icon: Zap, label: "Insights", value: "Módulo BI" },
          ].map((stat, i) => (
            <div
              key={i}
              className={cn(
                "p-4 rounded-xl",
                "bg-card/60 dark:bg-card/30",
                "border border-border/40 dark:border-border/20",
                "backdrop-blur-sm"
              )}
            >
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
            Módulos Principais
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {modules.map((module) => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
            Ações Rápidas
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <QuickActionCard
              href={assistenteIA.to}
              icon={assistenteIA.icon}
              title={assistenteIA.label}
              description="Tire dúvidas com inteligência artificial"
              variant="primary"
            />
            <QuickActionCard
              href={configuracoes.to}
              icon={configuracoes.icon}
              title={configuracoes.label}
              description="Categorias, contas e formas de pagamento"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
