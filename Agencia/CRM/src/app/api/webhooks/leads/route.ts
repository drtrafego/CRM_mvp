import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, notes, campaignSource, organizationId } = body;

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Use a default org ID if not provided (for testing/demo)
    const orgId = organizationId || "org_demo_123";

    // Find the "Novos Leads" column or the first column
    let targetColumn = await db.query.columns.findFirst({
      where: (cols, { eq, and }) => and(
        eq(cols.organizationId, orgId),
        eq(cols.title, "Novos Leads")
      ),
    });

    if (!targetColumn) {
      // Fallback to first column by order
      targetColumn = await db.query.columns.findFirst({
        where: eq(columns.organizationId, orgId),
        orderBy: [asc(columns.order)],
      });
    }

    if (!targetColumn) {
      return NextResponse.json(
        { error: "No columns found for this organization" },
        { status: 500 }
      );
    }

    // Create the lead
    const newLead = await db.insert(leads).values({
      name,
      email,
      phone,
      company,
      notes,
      campaignSource,
      organizationId: orgId,
      columnId: targetColumn.id,
      status: "active",
      position: 0, // Add to top
    }).returning();

    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error processing lead webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
