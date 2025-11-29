import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    const orgId = user?.selectedTeam?.id || user?.id || "org_demo_123";

    // Ensure columns exist
    const existingColumns = await db.query.columns.findMany({
        where: eq(columns.organizationId, orgId),
    });

    let columnMap: Record<string, string> = {};

    if (existingColumns.length === 0) {
         const inserted = await db.insert(columns).values([
             { title: "Novos Leads", organizationId: orgId, order: 0 },
             { title: "Em Contato", organizationId: orgId, order: 1 },
             { title: "Não Retornou", organizationId: orgId, order: 2 },
             { title: "Proposta Enviada", organizationId: orgId, order: 3 },
             { title: "Fechado", organizationId: orgId, order: 4 },
             { title: "Perdido", organizationId: orgId, order: 5 },
         ]).returning();
         inserted.forEach(c => columnMap[c.title] = c.id);
    } else {
        existingColumns.forEach(c => columnMap[c.title] = c.id);
    }

    // Helper to get column ID
    const getColId = (title: string) => columnMap[title] || Object.values(columnMap)[0];

    await db.insert(leads).values([
      {
        name: "Alice Johnson",
        company: "TechCorp",
        email: "alice@techcorp.com",
        status: "active",
        columnId: getColId("Novos Leads"),
        organizationId: orgId,
        position: 0,
        notes: "Interested in enterprise plan",
        campaignSource: "LinkedIn",
        value: "5000.00"
      },
      {
        name: "Bob Smith",
        company: "BizInc",
        email: "bob@bizinc.com",
        status: "active",
        columnId: getColId("Em Contato"),
        organizationId: orgId,
        position: 1,
        notes: "Follow up next week",
        campaignSource: "Google Ads",
        value: "2500.00"
      },
      {
        name: "Charlie Brown",
        company: "Cafe 123",
        email: "charlie@cafe123.com",
        status: "active",
        columnId: getColId("Proposta Enviada"),
        organizationId: orgId,
        position: 0,
        notes: "Sent proposal via email",
        campaignSource: "Referral",
        value: "1200.00"
      },
       {
        name: "Diana Prince",
        company: "Wonder Arts",
        email: "diana@wonder.com",
        status: "active",
        columnId: getColId("Novos Leads"),
        organizationId: orgId,
        position: 1,
        campaignSource: "Website",
        value: "10000.00"
      },
    ]);
    
    return NextResponse.json({ success: true, message: `Seeded successfully for org: ${orgId}` });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
