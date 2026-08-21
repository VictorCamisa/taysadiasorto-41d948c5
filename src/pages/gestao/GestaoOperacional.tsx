import { Link } from "react-router-dom";
import {
  FileText,
  ClipboardList,
  FlaskConical,
  Camera,
  Pill,
  Stethoscope,
  FileSignature,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/ui/KPICard";
import { cn } from "@/lib/utils";

interface ProcessCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  total: number;
  pending: number;
  completed: number;
  color: string;
}

function ProcessCard({ title, description, icon: Icon, href, total, pending, completed, color }: ProcessCardProps) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col rounded-2xl p-6 overflow-hidden",
        "bg-card/80 dark:bg-card/90",
        "border border-border/50 dark:border-border/40",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg dark:hover:shadow-xl",
        "hover:border-primary/20 dark:hover:border-primary/30",
        "hover:-translate-y-1"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          "bg-primary/10 dark:bg-primary/15",
          "border border-primary/10 dark:border-primary/20",
          "group-hover:scale-105 transition-transform duration-300"
        )}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {/* Stats */}
      <div className="mt-auto space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Conclusão</span>
            <span className="font-medium text-foreground">{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Counts */}
        <div className="flex gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">{pending} pendentes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">{completed} completos</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GestaoOperacional() {
  // Fetch counts for each process
  const { data: counts } = useQuery({
    queryKey: ["gestao-operacional-counts"],
    queryFn: async () => {
      const [
        { count: totalPacientes },
        { count: planosPendentes },
        { count: planosCompletos },
        { count: contratosPendentes },
        { count: contratosAssinados },
        { count: anamneses },
        { count: exames },
        { count: fotos },
        { count: receituarios },
        { count: prontuarios },
      ] = await Promise.all([
        supabase.from("pacientes").select("*", { count: "exact", head: true }),
        supabase.from("planos_tratamento").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("planos_tratamento").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
        supabase.from("contratos_paciente").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("contratos_paciente").select("*", { count: "exact", head: true }).eq("status", "assinado"),
        supabase.from("anamneses").select("*", { count: "exact", head: true }),
        supabase.from("exames_paciente").select("*", { count: "exact", head: true }),
        supabase.from("fotos_paciente").select("*", { count: "exact", head: true }),
        supabase.from("receituario_digital").select("*", { count: "exact", head: true }),
        supabase.from("prontuarios").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalPacientes: totalPacientes || 0,
        planosPendentes: planosPendentes || 0,
        planosCompletos: planosCompletos || 0,
        contratosPendentes: contratosPendentes || 0,
        contratosAssinados: contratosAssinados || 0,
        anamneses: anamneses || 0,
        exames: exames || 0,
        fotos: fotos || 0,
        receituarios: receituarios || 0,
        prontuarios: prontuarios || 0,
      };
    },
  });

  const processes: ProcessCardProps[] = [
    {
      title: "Planos de Tratamento",
      description: "Propostas e orçamentos de tratamentos",
      icon: FileText,
      href: "/gestao/planos-tratamento",
      total: (counts?.planosPendentes || 0) + (counts?.planosCompletos || 0),
      pending: counts?.planosPendentes || 0,
      completed: counts?.planosCompletos || 0,
      color: "text-blue-500 dark:text-blue-400",
    },
    {
      title: "Contratos",
      description: "Termos de serviço e consentimento",
      icon: FileSignature,
      href: "/gestao/contratos",
      total: (counts?.contratosPendentes || 0) + (counts?.contratosAssinados || 0),
      pending: counts?.contratosPendentes || 0,
      completed: counts?.contratosAssinados || 0,
      color: "text-violet-500 dark:text-violet-400",
    },
    {
      title: "Anamneses",
      description: "Fichas de anamnese dos pacientes",
      icon: ClipboardList,
      href: "/gestao/anamneses",
      total: counts?.anamneses || 0,
      pending: 0,
      completed: counts?.anamneses || 0,
      color: "text-emerald-500 dark:text-emerald-400",
    },
    {
      title: "Exames",
      description: "Resultados de exames laboratoriais",
      icon: FlaskConical,
      href: "/gestao/exames",
      total: counts?.exames || 0,
      pending: 0,
      completed: counts?.exames || 0,
      color: "text-cyan-500 dark:text-cyan-400",
    },
    {
      title: "Fotos",
      description: "Galeria de fotos antes/depois",
      icon: Camera,
      href: "/gestao/fotos",
      total: counts?.fotos || 0,
      pending: 0,
      completed: counts?.fotos || 0,
      color: "text-pink-500 dark:text-pink-400",
    },
    {
      title: "Receituários",
      description: "Prescrições médicas digitais",
      icon: Pill,
      href: "/gestao/receituarios",
      total: counts?.receituarios || 0,
      pending: 0,
      completed: counts?.receituarios || 0,
      color: "text-orange-500 dark:text-orange-400",
    },
    {
      title: "Prontuários",
      description: "Registros médicos dos pacientes",
      icon: Stethoscope,
      href: "/gestao/prontuarios",
      total: counts?.prontuarios || 0,
      pending: 0,
      completed: counts?.prontuarios || 0,
      color: "text-red-500 dark:text-red-400",
    },
  ];

  // KPIs
  const totalProcessos = processes.reduce((acc, p) => acc + p.total, 0);
  const totalPendentes = processes.reduce((acc, p) => acc + p.pending, 0);
  const totalCompletos = processes.reduce((acc, p) => acc + p.completed, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão Operacional"
        description="Visão agregada entre todos os pacientes — fila de acompanhamento dos processos clínicos"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Pacientes Ativos" value={counts?.totalPacientes || 0} icon={TrendingUp} />
        <KPICard label="Total Processos" value={totalProcessos} icon={FileText} />
        <KPICard label="Pendentes" value={totalPendentes} icon={Clock} tone="warning" />
        <KPICard label="Completos" value={totalCompletos} icon={CheckCircle2} tone="success" />
      </div>

      {/* Processes Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Processos Clínicos
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {processes.map((process) => (
            <ProcessCard key={process.title} {...process} />
          ))}
        </div>
      </div>
    </div>
  );
}
