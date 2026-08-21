# Relatório de atualizações de UX/UI — consolidação de componentes e padronização de páginas

**Branch:** `feat/ux-ui-consolidacao` · **Base:** `main` (taysadiasorto-41d948c5) · **Data:** 2026-08-21

## Resumo

Este PR consolida componentes de UI duplicados, padroniza o padrão de filtro/tabela/estado-vazio/confirmação usado em quase todas as páginas do sistema (financeiro, CRM, estoque, fornecedores, tratamentos, gestão, admin, BI), centraliza a navegação em um único arquivo de configuração e introduz cor distinta por módulo para facilitar a orientação visual (wayfinding). Resultado líquido: **redução de ~2.900 linhas** de código (2.590 inserções / 5.451 remoções em 83 arquivos), sem alterar o sistema de cores/sombras/glass já em produção.

## Contexto: este PR chega no mesmo dia em que existe outro repositório irmão

Esse trabalho de UX/UI foi feito originalmente contra uma versão deste projeto que, entretanto, evoluiu de forma paralela em outro repositório GitHub (`remix-of-remix-of-esthetic-flow`) — lá, uma leva de commits do Lovable introduziu uma arquitetura de shell nova (`AppShell`/`ModuleRail`/`SubNav`/`CommandPalette`). **Este repositório (`taysadiasorto-41d948c5`), que é o que está conectado ao Lovable hoje, não tem esse redesign** — ainda usa `AppSidebar`/`TopBar`/`Layout` como estão. Por isso, diferente da versão desse mesmo PR aberta no outro repositório, aqui foi possível reaplicar a consolidação **por completo**, incluindo Sidebar, TopBar, Layout, Dashboard, Home e a navegação central — nada disso é código morto aqui.

A única área que exigiu reconciliação manual, em vez de reaplicação direta, foram as 7 páginas do módulo **Gestão** (Anamneses, Contratos, Exames, Fotos, Planos de Tratamento, Prontuários, Receituários): elas haviam sido independentemente simplificadas neste repositório — de telas de CRUD completo (com diálogos de criar/editar) para dashboards agregados somente-leitura entre pacientes (o CRUD de cada registro passou a viver na ficha do próprio paciente, em `crm/fichas/*Tab.tsx`). Cada uma das 7 páginas foi reescrita à mão para manter exatamente esse comportamento atual, só trocando a barra de busca/filtro, o estado de carregamento/vazio e as ações de linha pelos componentes novos — nenhuma lógica de dados ou de filtro foi alterada.

Assim como no PR irmão, o sistema de glass/gradiente/sombra/hover-lift que já está em produção em `src/index.css` **não foi removido** — a versão original desse trabalho propunha um sistema "flat" de 3 níveis que chegou a aplicar de forma limpa aqui (nada mais competia por essas linhas), mas decidi não incluir essa reescrita: é uma mudança de direção visual maior, e principalmente aqui — no repositório que alimenta o site em produção — não é uma chamada que eu deveria fazer sozinho numa consolidação de componentes. Os componentes novos usam o mesmo estilo de card já usado hoje (`rounded-2xl border border-border/50 bg-card shadow-sm` / `bg-card/60 border-border/40`).

## O que mudou

### 1. Cor por módulo (wayfinding)
`tailwind.config.ts` e `src/index.css` ganharam tokens `--module-financeiro`, `--module-crm`, `--module-admin`, `--module-bi` e `--module-gestao` com matizes distintos (antes, todos os cinco módulos usavam a mesma cor dourada). Também adicionei ao `tailwind.config.ts` o mapeamento de `success`/`warning`/`info` que já existia como variável CSS mas não estava exposto como classe utilitária Tailwind (`bg-success`, `text-warning`, etc.) — sem isso, essas cores não podiam ser usadas nos componentes novos.

### 2. Navegação centralizada
`src/config/navigation.ts` — fonte única para os itens de menu de cada módulo, usada agora por `AppSidebar`, `TopBar`, `MobileBottomNav` e pelos cards de módulo da Home. Antes, cada um desses quatro componentes mantinha sua própria lista hardcoded, e elas já haviam divergido (ex.: o menu mobile do Pipeline apontava para uma URL de "Leads Perdidos" que não existia).

### 3. Componentes de UI duplicados, consolidados em um só
| Antes (removido) | Depois |
|---|---|
| `components/dashboard/KPICard.tsx`, `components/dashboard/AdvancedKPICard.tsx`, `components/bi/BIKPICard.tsx`, `components/mobile/MobileKPICard.tsx` | `components/ui/KPICard.tsx` (props `label`, `value`, `icon`, `tone`, `trend`, `size`) |
| `components/admin/EmptyState.tsx`, `components/mobile/MobileEmptyState.tsx` | `components/ui/EmptyState.tsx` |
| `components/admin/ConfirmDialog.tsx` | `components/ui/ConfirmDialog.tsx` (agora reutilizável fora do módulo admin) |
| `components/ui/GlassCard.tsx`, `components/ui/ModularGrid.tsx`, `components/ui/sidebar.tsx`, `components/ModuleNav.tsx` | removidos — nada mais importava esses arquivos |

Antes de apagar qualquer arquivo, conferi por `grep` que não sobrava importação órfã; o único uso real de uma duplicata (`BIKPICard` em `BusinessIntelligence.tsx`) foi migrado para o componente único.

### 4. Três componentes novos
- **`FilterBar`** — casca de layout para busca + filtros, que se repetia com pequenas variações em quase toda página com listagem.
- **`DataTableRowActions`** — ordem padrão de ações de linha (Ver → Editar → ações de status → Excluir), com suporte a tom de cor por ação.
- **`LoadingState`** — substitui o texto solto "Carregando..." repetido em cada tabela.

### 5. Padronização aplicada às páginas
Praticamente todas as páginas de listagem do sistema passaram a usar os componentes acima: Dashboard, Home, Gestão Operacional, as 7 páginas de Gestão (Anamneses, Contratos, Exames, Fotos, Planos de Tratamento, Prontuários, Receituários), Pipeline, Agendamentos, Leads, Leads Perdidos, Pacientes, Ficha do Paciente, Estoque, Fornecedores, Tratamentos, Auditoria, Checklists, Documentos, LGPD, Usuários, Solicitações de Acesso, e os gráficos de BI (LTV/CAC, Marketing ROAS, Projeções).

### 6. Navegação: telas sem link corrigidas
- **Leads Perdidos** (`/crm/leads-perdidos`) — a página já existia, mas não tinha rota registrada em `App.tsx` nem item de menu em nenhum lugar da UI.
- **Checklists** (`/admin?tab=checklists`) — a aba já existia dentro da página Admin, mas não tinha atalho direto no menu.

### 7. Páginas placeholder órfãs, removidas
`AdminPlaceholder.tsx`, `BIPlaceholder.tsx`, `CRMPlaceholder.tsx` e `Index.tsx` não eram mais referenciados por nenhuma rota.

## O que foi validado

- `tsc --noEmit`: limpo (sem erros).
- `vite build`: build de produção completa sem erros (avisos de tamanho de chunk já existiam antes deste PR).
- `eslint`: 419 problemas neste branch contra 426 no baseline do `main` — sem regressão (os erros restantes são `no-explicit-any` pré-existentes, principalmente em Supabase Edge Functions).

## Fora do escopo (de propósito)

- Não removi o sistema de glass/gradiente/sombra/hover-lift de `index.css` — mudança de direção visual maior, não uma consolidação.
- Não toquei em nada dentro de `.lovable/`, nas migrations do Supabase, nos documentos em `Processos TD/` nem no `AUREA_Blueprint.docx` — sem relação com este trabalho.
