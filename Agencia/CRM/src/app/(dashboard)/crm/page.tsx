import { getLeads, getColumns } from "@/server/actions/leads";
import { getSettings } from "@/server/actions/settings";
import { CrmView } from "@/components/features/crm/crm-view";

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const [leads, columns, settings] = await Promise.all([
    getLeads(),
    getColumns(),
    getSettings()
  ]);

  return (
    <div className="h-[calc(100vh-100px)]">
      <CrmView 
        initialLeads={leads} 
        columns={columns} 
        companyName={settings?.companyName} 
        initialViewMode={settings?.viewMode || 'kanban'}
      />
    </div>
  );
}
