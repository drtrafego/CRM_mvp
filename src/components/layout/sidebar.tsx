'use client';

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, KanbanSquare, Settings, LogOut, LineChart, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  // If we are not in an org context (e.g. root or admin), don't show sidebar or show different one
  if (!orgSlug) {
      // Simple Admin Sidebar or Return Null
      if (pathname?.startsWith('/admin')) {
           return (
            <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen flex flex-col fixed left-0 top-0 z-10">
                <div className="p-6 h-16 flex items-center border-b border-slate-100 dark:border-slate-800">
                    <h1 className="font-bold text-xl text-indigo-600 tracking-tight">Admin</h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-800 text-indigo-600">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </nav>
                 <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </div>
           )
      }
      return null; 
  }

  const items = [
    {
      title: "Kanban",
      url: `/org/${orgSlug}/kanban`,
      icon: KanbanSquare,
    },
    {
        title: "Analytics",
        url: `/org/${orgSlug}/kanban/analytics`,
        icon: LineChart,
    },
    {
        title: "Calendário",
        url: `/org/${orgSlug}/kanban/calendar`,
        icon: CalendarDays,
    },
    {
      title: "Configurações",
      url: `/org/${orgSlug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 h-16 flex items-center border-b border-slate-100 dark:border-slate-800">
        <h1 className="font-bold text-xl text-indigo-600 tracking-tight">CRM SaaS</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === item.url || pathname?.startsWith(item.url)
                ? "bg-slate-100 dark:bg-slate-800 text-indigo-600"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
         <div className="flex flex-col gap-2">
             <Link href="/admin/dashboard">
                <Button variant="outline" className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Voltar p/ Admin
                </Button>
             </Link>
             <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Sair
             </Button>
         </div>
      </div>
    </div>
  );
}
