# Prompt: Construção Completa de CRM Kanban (Full Stack Next.js 16)

**Objetivo:** Construir uma aplicação de CRM moderna do zero, focada em performance, arquitetura limpa e TypeScript estrito.

## 🛠️ Tech Stack (Obrigatório)
- **Framework:** Next.js 16 (App Router, Turbopack).
- **Linguagem:** TypeScript (Strict Mode obrigatório, sem `any`).
- **Estilização:** Tailwind CSS v4 + Shadcn/UI.
- **Banco de Dados:** PostgreSQL (via Neon ou local).
- **ORM:** Drizzle ORM.
- **Gerenciamento de Estado/Data:** React Server Components + Server Actions (Sem API Routes desnecessárias).
- **Drag & Drop:** @dnd-kit (para o Kanban).
- **Datas:** date-fns v4 (Tree-shakeable imports).
- **Ícones:** Lucide React.

---

## 🏗️ Arquitetura do Projeto

### 1. Estrutura de Pastas
```text
src/
├── app/
│   ├── (dashboard)/        # Layout protegido (Sidebar + Header)
│   │   ├── crm/
│   │   │   ├── page.tsx    # Redireciona ou mostra Kanban
│   │   │   ├── calendar/   # Visualização de Calendário
│   │   │   ├── analytics/  # Dashboards e Gráficos
│   │   │   └── settings/   # Configurações da Conta
│   ├── login/              # Página de Login pública
├── components/
│   ├── features/           # Componentes de negócio (KanbanBoard, LeadCard)
│   ├── ui/                 # Componentes base (Shadcn)
├── lib/                    # Utilitários e configuração do DB
├── server/
│   ├── db/                 # Schema do Drizzle
│   ├── actions/            # Server Actions (CRUD)
```

### 2. Banco de Dados (Schema Drizzle)
Preciso de 3 tabelas principais:
1.  **`columns`**: Para gerenciar as colunas do Kanban dinamicamente (id, title, order, color).
2.  **`leads`**: Os cards do CRM (id, name, value, status, columnId, position, createdAt).
3.  **`settings`**: Preferências do usuário (viewMode: 'kanban' | 'list').

---

## 🚀 Funcionalidades Principais

### A. Kanban Board (Core)
-   **Visualização:** Colunas dinâmicas (ex: "Novo", "Contato", "Fechado").
-   **Interação:** Drag and Drop fluido usando `@dnd-kit`. Ao mover um card, deve atualizar `columnId` e `position` no banco via Server Action (`updateLeadPosition`).
-   **Edição:** Ao clicar no card, abrir um Dialog/Sheet para editar detalhes.

### B. Visualização de Calendário
-   Exibir um calendário mensal.
-   Mostrar "bolinhas" ou marcadores nos dias que tiveram leads criados.
-   Ao clicar no dia, listar os leads daquela data.
-   **Requisito Técnico:** Usar `date-fns` corretamente (imports da raiz) para manipular datas.

### C. Analytics (Dashboard)
-   **KPIs:** Receita Total (soma do `value` dos leads na coluna "Ganho"), Total de Leads, Taxa de Conversão.
-   **Gráficos:** Barras ou Linha mostrando leads por mês.

### D. Configurações
-   Permitir alterar o nome da empresa.
-   Alternar entre modo "Kanban" e "Lista" como padrão.

## � Layout Existente (Use como Base)

Já temos o layout pronto para as páginas de Calendário e Analytics. Você deve usar esses componentes, mas **corrigindo a tipagem (any)** e os imports.

### A. Calendário (`src/app/(dashboard)/crm/calendar/page.tsx`)
```tsx
import { getLeads } from "@/server/actions/leads";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const leads = await getLeads();
  
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calendário</h1>
            <p className="text-slate-500 dark:text-slate-400">
                {format(today, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {days.map((day: any, dayIdx: number) => { // <--- FIXME: Tipar corretamente
              const dayLeads = leads.filter((l: any) => isSameDay(new Date(l.createdAt), day));
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div key={day.toString()} className={cn(/* ... */)}>
                    {/* ... Conteúdo do dia ... */}
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}
```

### B. Analytics (`src/app/(dashboard)/crm/analytics/page.tsx`)
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // <--- Use @/
import { getLeads, getColumns } from "@/server/actions/leads"; // <--- Use @/
import { Lead, Column } from "@/server/db/schema";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const leads = await getLeads();
  const columns = await getColumns();
  const totalLeads = leads.length;

  // ... Lógica de cálculo (Receita, Conversão) ...

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400">Visão geral do desempenho do seu CRM.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
               {/* Formatador de Moeda */}
            </div>
          </CardContent>
        </Card>
        {/* Outros Cards ... */}
      </div>
    </div>
  );
}
```

---

## 📜 Regras de Desenvolvimento (Strict Guidelines)
1.  **Zero `any`:** Todo o código deve ser tipado. Use `interface` ou `type` para tudo, inclusive props de componentes e retornos de banco.
2.  **Server Actions:** Toda mutação de dados (Criar Lead, Mover Card) deve ser uma Server Action em `src/server/actions`.
3.  **Imports Absolutos:** Configure o `tsconfig.json` para usar `@/*` apontando para `./src/*`. NUNCA use `../../`.
4.  **Next.js Config:** O arquivo `next.config.mjs` deve ser limpo, sem flags para ignorar erros. O código deve compilar nativamente.

---

## 📦 O Que Entregar
Gere o código passo-a-passo, começando pela **Configuração do Ambiente** (`package.json`, `tsconfig.json`, `drizzle.config.ts`) e depois avançando arquivo por arquivo da estrutura sugerida.
