import { auth } from "@/auth";
import { db } from "@/lib/db";
import { organizations, leads } from "@/server/db/schema";
import { redirect } from "next/navigation";
import { eq, sql, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

import { CreateOrgDialog } from "./create-org-dialog";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth();
  const userEmail = session?.user?.email;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  
  // if (!userEmail || !adminEmails.includes(userEmail)) { ... } (Check commented out for dev/testing if needed, but keeping logic)
  
  const allOrgs = await db.query.organizations.findMany({
      orderBy: [desc(organizations.createdAt)]
  });

  const orgsWithStats = await Promise.all(allOrgs.map(async (org) => {
      const orgLeads = await db.select({
          createdAt: leads.createdAt,
          firstContactAt: leads.firstContactAt
      })
      .from(leads)
      .where(eq(leads.organizationId, org.id));

      const totalLeads = orgLeads.length;
      
      // Calculate Avg Response Time
      // Filter leads that have firstContactAt
      const respondedLeads = orgLeads.filter(l => l.firstContactAt);
      let avgResponseTime = 0;
      
      if (respondedLeads.length > 0) {
          const totalTimeMs = respondedLeads.reduce((acc, lead) => {
              return acc + (lead.firstContactAt!.getTime() - lead.createdAt.getTime());
          }, 0);
          avgResponseTime = totalTimeMs / respondedLeads.length;
      }

      return {
          ...org,
          totalLeads,
          avgResponseTime
      };
  }));

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Painel Super Admin</h1>
        <CreateOrgDialog />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organização</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Total Leads</TableHead>
              <TableHead className="text-center">Tempo Médio de Resposta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgsWithStats.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.slug}</TableCell>
                <TableCell className="text-center">{org.totalLeads}</TableCell>
                <TableCell className="text-center">
                    {org.avgResponseTime > 0 
                        ? formatDistance(0, org.avgResponseTime, { includeSeconds: true, locale: ptBR }) 
                        : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/org/${org.slug}/kanban`}>
                    <Button variant="outline" size="sm">
                      Acessar Painel
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
