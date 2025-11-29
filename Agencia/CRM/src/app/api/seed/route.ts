import { db } from "@/lib/db";
import { leads } from "@/server/db/schema";
import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    const orgId = user?.selectedTeam?.id || user?.id || "org_demo_123";

    await db.insert(leads).values([
      {
        name: "Alice Johnson",
        company: "TechCorp",
        email: "alice@techcorp.com",
        status: "new",
        organizationId: orgId,
        position: 0,
        notes: "Interested in enterprise plan",
        campaignSource: "LinkedIn",
      },
      {
        name: "Bob Smith",
        company: "BizInc",
        email: "bob@bizinc.com",
        status: "contacted",
        organizationId: orgId,
        position: 1,
        notes: "Follow up next week",
        campaignSource: "Google Ads",
      },
      {
        name: "Charlie Brown",
        company: "Cafe 123",
        email: "charlie@cafe123.com",
        status: "proposal",
        organizationId: orgId,
        position: 0,
        notes: "Sent proposal via email",
        campaignSource: "Referral",
      },
       {
        name: "Diana Prince",
        company: "Wonder Arts",
        email: "diana@wonder.com",
        status: "new",
        organizationId: orgId,
        position: 1,
        campaignSource: "Website",
      },
    ]);
    
    return NextResponse.json({ success: true, message: `Seeded successfully for org: ${orgId}` });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
