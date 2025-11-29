'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, KanbanSquare, Settings } from "lucide-react";
import { UserButton } from "@stackframe/stack";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    url: "/dashboard/crm",
    icon: KanbanSquare,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-slate-200 bg-white h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 h-16 flex items-center border-b border-slate-100">
        <h1 className="font-bold text-xl text-indigo-600 tracking-tight">Acme CRM</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === item.url || pathname?.startsWith(item.url)
                ? "bg-slate-100 text-indigo-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
         <div className="flex items-center gap-3">
            <UserButton />
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">My Account</span>
                <span className="text-xs text-slate-500">Manage profile</span>
            </div>
         </div>
      </div>
    </div>
  );
}
