"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DateRange } from "react-day-picker";
import { subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Column as DbColumn, Lead } from "@/server/db/schema";
import { Board } from "@/components/features/kanban/board";
import { LeadsList } from "@/components/features/crm/leads-list";
import { DateRangePickerWithPresets } from "./date-range-picker";
import { NewLeadDialog } from "@/components/features/kanban/new-lead-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, TrendingUp, AlertCircle, CheckCircle2, LayoutGrid, List, Wallet, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { CompanyOnboarding } from "./company-onboarding";
import { UserMenu } from "@/components/layout/user-menu";

import { updateViewMode } from "@/server/actions/settings";

interface CrmViewProps {
  initialLeads: Lead[];
  columns: DbColumn[];
  companyName?: string | null;
  initialViewMode?: string | null;
  orgId: string;
}

export function CrmView({ initialLeads, columns, companyName, initialViewMode, orgId }: CrmViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const initialView = (searchParams.get("view") as "board" | "list") || (initialViewMode as "board" | "list") || "board";
  const [view, setView] = useState<"board" | "list">(initialView);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "list" && view !== "list") setView("list");
    if (viewParam === "board" && view !== "board") setView("board");
  }, [searchParams, view]);

  const handleViewChange = (newView: "board" | "list") => {
      setView(newView);
      const params = new URLSearchParams(searchParams);
      params.set("view", newView);
      router.replace(`${pathname}?${params.toString()}`);
      updateViewMode(newView, orgId);
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30), // Last 30 days default for better data visibility
    to: new Date(),
  });

  // Optimistic leads state to handle instant updates from drag-and-drop
  const [optimisticLeads, setOptimisticLeads] = useState(initialLeads);

  // Sync with server props if they change (revalidation)
  useEffect(() => {
      setOptimisticLeads(initialLeads);
  }, [initialLeads]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = useMemo(() => {
    let leads = optimisticLeads;

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        leads = leads.filter(l => 
            l.name.toLowerCase().includes(query) || 
            l.email?.toLowerCase().includes(query) || 
            l.company?.toLowerCase().includes(query) ||
            l.whatsapp?.includes(query)
        );
    }

    // 2. Filter by Date Range
    if (!dateRange?.from) return leads;

    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return leads.filter((lead) => {
      const created = new Date(lead.createdAt);
      return isWithinInterval(created, { start, end });
    });
  }, [optimisticLeads, dateRange, searchQuery]);

  const handleLeadsChange = (newFilteredLeads: Lead[]) => {
      setOptimisticLeads(prev => {
          // Create a map of the updated leads for O(1) lookup
          const updatedMap = new Map(newFilteredLeads.map(l => [l.id, l]));
          
          // Merge: if lead exists in updated list, use it; otherwise keep existing
          return prev.map(l => updatedMap.get(l.id) || l);
      });
  };

  // Stats Calculation
  const totalLeads = filteredLeads.length;
  
  const newLeadsCount = filteredLeads.filter(l => {
     const col = columns.find(c => c.id === l.columnId);
     return col?.title.toLowerCase().includes("novos") || col?.order === 0;
  }).length;
  
  const wonLeads = filteredLeads.filter(l => {
      const col = columns.find(c => c.id === l.columnId);
      if (!col) return false;
      
      const title = col.title.toLowerCase().trim();
      // Check for keywords - STRICTLY "Fechado", "Won", "Ganho" for Revenue
      if (title.includes("ganho") || title.includes("won") || title.includes("fechado")) return true;
      
      // Fallback: Check order. Usually "Fechado" is one of the last columns.
      // If it's the 2nd to last or last column and NOT "Perdido", maybe it's won?
      // Standard order: Novos, Contact, Nao Retornou, Proposta, Fechado, Perdido. (6 columns)
      // Fechado is index 4.
      if (col.order === 4 && !title.includes("perdido") && !title.includes("lost")) return true;
      
      return false;
   });
   
   const parseValue = (val: string | null | number | undefined) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    
    // If it matches standard float format (digits, optional dot, digits) AND no comma
    // This handles "5000.00" (DB format) correctly
    if (/^-?\d+(\.\d+)?$/.test(val)) {
        return parseFloat(val);
    }

    // Otherwise assume BR format (comma decimal)
    // Handle currency strings like "R$ 1.200,00" or "50.000,00"
    // Remove everything that is NOT a digit or comma or minus sign
    // We assume BRL format: dot = thousand, comma = decimal
    const clean = val.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const wonValue = wonLeads.reduce((sum, lead) => sum + parseValue(lead.value), 0);

  const lostLeadsCount = filteredLeads.filter(l => {
      const col = columns.find(c => c.id === l.columnId);
      if (!col) return false;
      const title = col.title.toLowerCase().trim();
      return title.includes("perdido") || title.includes("lost");
  }).length;

  const activeLeads = filteredLeads.filter(l => {
      const col = columns.find(c => c.id === l.columnId);
      if (!col) return false;
      const title = col.title.toLowerCase().trim();
      
      const isWon = title.includes("ganho") || title.includes("won") || title.includes("fechado") || (col.order === 4 && !title.includes("perdido") && !title.includes("lost"));
      const isLost = title.includes("perdido") || title.includes("lost");
      return !isWon && !isLost;
   });
   
   // Custom Pipeline Value: Sum of "Proposta Enviada" ONLY as requested by user
   // "somátória ainda não está na coluna Proposta Enviada" implies specific mapping.
   const potentialValue = filteredLeads
      .filter(l => {
         const col = columns.find(c => c.id === l.columnId);
         if (!col) return false;
         const title = col.title.toLowerCase().trim();
         // Match ONLY "proposta" or "enviada" for Potential Pipeline
         return title.includes("proposta") || title.includes("enviada");
      })
      .reduce((sum, lead) => sum + parseValue(lead.value), 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col gap-6">
      <CompanyOnboarding hasCompanyName={!!companyName} orgId={orgId} />
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{companyName || "Dashboard CRM"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64 hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Pesquisar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-white dark:bg-slate-900 h-9"
                />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => handleViewChange("board")}
                className={cn(
                    "h-8 px-2", 
                    view === "board" && "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                )}
              >
                  <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
              </Button>
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => handleViewChange("list")}
                className={cn(
                    "h-8 px-2", 
                    view === "list" && "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                )}
              >
                  <List className="h-4 w-4 mr-1" /> Lista
              </Button>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <UserMenu />
          {mounted && (
            <>
              <DateRangePickerWithPresets date={dateRange} setDate={setDateRange} />
              <NewLeadDialog orgId={orgId} />
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total de Leads" 
          value={totalLeads} 
          icon={Users} 
          description="No período selecionado"
        />
        <StatsCard 
          title="Novos Leads" 
          value={newLeadsCount} 
          icon={AlertCircle} 
          description="Aguardando contato"
          iconClassName="text-blue-600 dark:text-blue-400"
        />
        <StatsCard 
          title="Potencial (Pipeline)" 
          value={formatCurrency(potentialValue)} 
          icon={TrendingUp} 
          description="Valor em negociação"
          iconClassName="text-amber-600 dark:text-amber-400"
        />
        <StatsCard 
          title="Ganhos (Receita)" 
          value={formatCurrency(wonValue)} 
          icon={Wallet} 
          description={`${wonLeads.length} negócios fechados`}
          iconClassName="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
         {view === "board" ? (
             <Board initialLeads={filteredLeads} columns={columns} onLeadsChange={handleLeadsChange} orgId={orgId} />
         ) : (
             <div className="p-4 h-full overflow-y-auto">
                <LeadsList leads={filteredLeads} columns={columns} orgId={orgId} />
             </div>
         )}
      </div>
    </div>
  );
}

function StatsCard({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    className,
    iconClassName
}: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string; 
    className?: string;
    iconClassName?: string;
}) {
  return (
    <Card className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4 text-slate-500 dark:text-slate-400", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
