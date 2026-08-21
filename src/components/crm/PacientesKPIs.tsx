import { Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";

interface PacientesKPIsProps {
  totalPacientes: number;
  pacientesAtivos: number;
  pacientesInativos: number;
  novosEsteMes: number;
}

export function PacientesKPIs({
  totalPacientes,
  pacientesAtivos,
  pacientesInativos,
  novosEsteMes,
}: PacientesKPIsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="Total de Pacientes" value={totalPacientes} icon={Users} />
      <KPICard label="Pacientes Ativos" value={pacientesAtivos} icon={UserCheck} tone="success" />
      <KPICard label="Pacientes Inativos" value={pacientesInativos} icon={UserX} />
      <KPICard label="Novos Este Mês" value={novosEsteMes} icon={UserPlus} tone="info" />
    </div>
  );
}
