import {
  Home,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Target,
  FileBarChart,
  Kanban,
  Calendar,
  Heart,
  XCircle,
  Building2,
  Lock,
  History,
  PieChart,
  LineChart,
  Sparkles,
  Settings,
  ClipboardList,
  CheckSquare,
  FileSignature,
  FlaskConical,
  Camera,
  Pill,
  Stethoscope,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type ModuleId = "financeiro" | "crm" | "admin" | "bi" | "gestao";

export interface NavLeaf {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Exact-match only (react-router NavLink `end`) — for a module's own root item. */
  end?: boolean;
}

export interface NavModule {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  basePath: string;
  /** Short description used by Home's module cards. */
  description: string;
  items: NavLeaf[];
}

/** Single source of truth for every module + its sub-items. Every nav-rendering
 * component (sidebar, mobile drawer, mobile bottom nav, Home cards) reads from
 * this array instead of declaring its own copy. */
export const modules: NavModule[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    basePath: "/financeiro",
    description: "Controle completo de fluxo de caixa, DRE e análises",
    items: [
      { label: "Dashboard", to: "/financeiro", icon: Home, end: true },
      { label: "Diário de Caixa", to: "/financeiro/diario-caixa", icon: FileText },
      { label: "Lançamentos", to: "/financeiro/lancamentos", icon: DollarSign },
      { label: "Contas a Pagar", to: "/financeiro/contas-pagar", icon: CreditCard },
      { label: "Tratamentos", to: "/financeiro/tratamentos", icon: TrendingUp },
      { label: "Estoque", to: "/financeiro/estoque", icon: Package },
      { label: "Fornecedores", to: "/financeiro/fornecedores", icon: Users },
      { label: "DRE", to: "/financeiro/dre", icon: BarChart3 },
      { label: "Budget", to: "/financeiro/orcamento", icon: Target },
      { label: "Relatórios", to: "/financeiro/relatorios", icon: FileBarChart },
      { label: "Relatórios de Estoque", to: "/financeiro/relatorios-estoque", icon: Package },
    ],
  },
  {
    id: "crm",
    label: "Comercial",
    icon: Users,
    basePath: "/crm",
    description: "Pipeline de vendas e gestão de pacientes",
    items: [
      { label: "Pipeline", to: "/crm/pipeline", icon: Kanban },
      { label: "Agendamentos", to: "/crm/agendamentos", icon: Calendar },
      { label: "WhatsApp", to: "/crm/whatsapp", icon: MessageCircle },
      { label: "Pós-venda", to: "/crm/pos-venda", icon: Heart },
      { label: "Leads", to: "/crm/leads", icon: Users },
      { label: "Leads Perdidos", to: "/crm/leads-perdidos", icon: XCircle },
      { label: "Pacientes", to: "/crm/pacientes", icon: Users },
    ],
  },
  {
    id: "admin",
    label: "Administrativo",
    icon: Building2,
    basePath: "/admin",
    description: "Gestão de usuários, LGPD e auditoria",
    items: [
      { label: "Usuários", to: "/admin?tab=usuarios", icon: Users },
      { label: "Checklists", to: "/admin?tab=checklists", icon: CheckSquare },
      { label: "LGPD", to: "/admin?tab=lgpd", icon: Lock },
      { label: "Documentos", to: "/admin?tab=documentos", icon: FileText },
      { label: "Auditoria", to: "/admin?tab=auditoria", icon: History },
    ],
  },
  {
    id: "bi",
    label: "BI",
    icon: BarChart3,
    basePath: "/bi",
    description: "Análises avançadas e indicadores de performance",
    items: [
      { label: "Dashboard BI", to: "/bi", icon: BarChart3, end: true },
      { label: "LTV / CAC", to: "/bi?tab=ltv-cac", icon: Users },
      { label: "Marketing", to: "/bi?tab=marketing", icon: Target },
      { label: "Tratamentos", to: "/bi?tab=tratamentos", icon: PieChart },
      { label: "Sazonalidade", to: "/bi?tab=sazonalidade", icon: Calendar },
      { label: "Projeções", to: "/bi?tab=projecoes", icon: LineChart },
    ],
  },
  {
    id: "gestao",
    label: "Gestão Operacional",
    icon: ClipboardList,
    basePath: "/gestao",
    description: "Visão geral e fila de acompanhamento entre todos os pacientes",
    items: [
      { label: "Dashboard", to: "/gestao", icon: Home, end: true },
      { label: "Planos de Tratamento", to: "/gestao/planos-tratamento", icon: FileText },
      { label: "Contratos", to: "/gestao/contratos", icon: FileSignature },
      { label: "Anamneses", to: "/gestao/anamneses", icon: ClipboardList },
      { label: "Exames", to: "/gestao/exames", icon: FlaskConical },
      { label: "Fotos", to: "/gestao/fotos", icon: Camera },
      { label: "Receituários", to: "/gestao/receituarios", icon: Pill },
      { label: "Prontuários", to: "/gestao/prontuarios", icon: Stethoscope },
    ],
  },
];

export const globalItems: NavLeaf[] = [
  { label: "Assistente IA", to: "/assistente-ia", icon: Sparkles },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
];

/** Maps a module id to its Tailwind color-token utility classes (see tailwind.config.ts `module.*`). */
export const moduleColorClass: Record<ModuleId, string> = {
  financeiro: "text-module-financeiro",
  crm: "text-module-crm",
  admin: "text-module-admin",
  bi: "text-module-bi",
  gestao: "text-module-gestao",
};

export function getActiveModule(pathname: string): NavModule | undefined {
  return modules.find((m) => pathname === m.basePath || pathname.startsWith(m.basePath + "/"));
}

export function isLeafActive(pathname: string, search: string, leaf: NavLeaf): boolean {
  if (leaf.to.includes("?")) {
    return pathname + search === leaf.to;
  }
  if (leaf.end) {
    return pathname === leaf.to;
  }
  return pathname === leaf.to || pathname.startsWith(leaf.to + "/");
}
