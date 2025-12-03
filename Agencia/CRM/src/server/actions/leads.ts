'use server'

import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { eq, asc, desc, and, ne, lt, gt, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { stackServerApp } from "@/stack";

async function getOrgId() {
  const user = await stackServerApp.getUser();
  // Use the user's selected team (if any), or their own personal ID
  return user?.selectedTeam?.id || user?.id || "org_demo_123";
}


export async function getColumns() {
  const orgId = await getOrgId();
  
  // First, fetch all existing columns
  const existing = await db.query.columns.findMany({
    where: eq(columns.organizationId, orgId),
    orderBy: [asc(columns.order)],
  });

  // Define the expected standard columns
  const expectedTitles = ["Novos Leads", "Em Contato", "Não Retornou", "Proposta Enviada", "Fechado", "Perdido"];

  // 1. Handle empty state - Only initialize if NO columns exist
  if (existing.length === 0) {
      const inserted = await db.insert(columns).values(
          expectedTitles.map((title, i) => ({
              title,
              organizationId: orgId,
              order: i
          }))
      ).returning();
      return inserted.sort((a, b) => a.order - b.order);
  }

  // Return existing columns as-is, just sorted
  return existing.sort((a, b) => a.order - b.order);
}

export async function deleteLead(id: string) {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath('/dashboard/crm');
}

export async function getLeads() {
  // In real app: const user = await stackServerApp.getUser();
  // const orgId = user.selectedTeam?.id || user.id;
  const orgId = await getOrgId();
  
  return await db.query.leads.findMany({
    where: eq(leads.organizationId, orgId),
    orderBy: [asc(leads.position), desc(leads.createdAt)],
  });
}

export async function updateLeadStatus(id: string, newColumnId: string, newPosition: number) {
  // Verify ownership...
  
  await db.update(leads)
    .set({ 
      columnId: newColumnId, 
      position: newPosition 
    })
    .where(eq(leads.id, id));
    
  revalidatePath('/dashboard/crm');
}

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const email = formData.get("email") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const notes = formData.get("notes") as string;
  const valueStr = formData.get("value") as string;
  const value = valueStr ? valueStr : null;
  const orgId = await getOrgId();

  // Get the first column to add the lead to
  const firstColumn = await db.query.columns.findFirst({
    where: eq(columns.organizationId, orgId),
    orderBy: [asc(columns.order)],
  });

  if (!firstColumn) {
    throw new Error("No columns found");
  }

  await db.insert(leads).values({
    name,
    company,
    email,
    whatsapp,
    notes,
    value,
    status: 'active', // Default status, or use column title if needed
    columnId: firstColumn.id,
    organizationId: orgId,
    position: 0, // Add to top
  });

  revalidatePath('/dashboard/crm');
}

export async function createColumn(title: string) {
    const orgId = await getOrgId();
    const existingColumns = await getColumns();
    
    await db.insert(columns).values({
        title,
        organizationId: orgId,
        order: existingColumns.length,
    });
    
    revalidatePath('/dashboard/crm');
}

export async function updateColumn(id: string, title: string) {
    await db.update(columns)
        .set({ title })
        .where(eq(columns.id, id));
    revalidatePath('/dashboard/crm');
}

export async function updateColumnOrder(orderedIds: string[]) {
    const orgId = await getOrgId();
    
    // Use a transaction to ensure atomicity if possible, or just parallel updates
    // For simplicity, we iterate and update. In production, use a single SQL query with CASE/WHEN or transaction.
    
    await db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
            await tx.update(columns)
                .set({ order: i })
                .where(and(eq(columns.id, orderedIds[i]), eq(columns.organizationId, orgId)));
        }
    });
    
    revalidatePath('/dashboard/crm');
}

export async function deleteColumn(id: string) {
    const orgId = await getOrgId();
    
    // Get the column being deleted to know its order
    const columnToDelete = await db.query.columns.findFirst({
        where: eq(columns.id, id)
    });

    if (!columnToDelete) return; // Already deleted

    // Find a fallback column:
    // 1. Try to find the immediate predecessor (order < deleted.order)
    let fallbackCol = await db.query.columns.findFirst({
        where: and(
            eq(columns.organizationId, orgId),
            ne(columns.id, id),
            lt(columns.order, columnToDelete.order) // Less than
        ),
        orderBy: [desc(columns.order)] // Highest order less than current (closest predecessor)
    });

    // 2. If no predecessor (was first column), find immediate successor
    if (!fallbackCol) {
        fallbackCol = await db.query.columns.findFirst({
            where: and(
                eq(columns.organizationId, orgId),
                ne(columns.id, id),
                gt(columns.order, columnToDelete.order) // Greater than
            ),
            orderBy: [asc(columns.order)] // Lowest order greater than current (closest successor)
        });
    }
    
    // 3. If still nothing, just pick ANY other column
    if (!fallbackCol) {
        fallbackCol = await db.query.columns.findFirst({
            where: and(
                eq(columns.organizationId, orgId),
                ne(columns.id, id)
            ),
            orderBy: [asc(columns.order)]
        });
    }

    if (fallbackCol) {
        // Move leads to fallback column
        await db.update(leads)
            .set({ columnId: fallbackCol.id })
            .where(eq(leads.columnId, id));
    } else {
        // If no other column exists, delete the leads to avoid orphans
        await db.delete(leads).where(eq(leads.columnId, id));
    }

    await db.delete(columns).where(eq(columns.id, id));
    revalidatePath('/dashboard/crm');
}

export async function updateLeadContent(id: string, data: Partial<typeof leads.$inferInsert>) {
    // Whitelist allowed fields to prevent accidental overwrites of critical data
    // like columnId, position, organizationId, etc.
    // Removed 'status' from whitelist to prevent any accidental status changes during edit
    const allowedFields: (keyof typeof leads.$inferInsert)[] = [
        'name', 
        'company', 
        'email', 
        'whatsapp', 
        'notes', 
        'value'
    ];
    
    const updatePayload: Partial<typeof leads.$inferInsert> = {};
    
    // Only copy allowed fields
    for (const key of allowedFields) {
        if (data[key] !== undefined) {
            // @ts-ignore - dynamic assignment
            updatePayload[key] = data[key];
        }
    }

    // Handle empty strings or whitespace for value
    if (typeof updatePayload.value === 'string' && updatePayload.value.trim() === '') {
        updatePayload.value = null;
    } else if (updatePayload.value === "") {
        updatePayload.value = null;
    }

    // If nothing to update, return early
    if (Object.keys(updatePayload).length === 0) return;

    console.log(`Updating lead content ${id} with payload:`, updatePayload);
    
    // Verify lead exists first (optional but good for debugging)
    const existingLead = await db.query.leads.findFirst({
        where: eq(leads.id, id),
        columns: { id: true, columnId: true, position: true }
    });

    if (!existingLead) {
        console.error(`Lead ${id} not found for update`);
        return;
    }

    // Explicitly force preservation of columnId and position
    // This prevents any DB default behavior or trigger from moving the lead
    // @ts-ignore - forcing these fields into the update payload
    updatePayload.columnId = existingLead.columnId;
    // @ts-ignore - forcing these fields into the update payload
    updatePayload.position = existingLead.position;

    console.log(`Final update payload for lead ${id}:`, updatePayload);

    await db.update(leads)
        .set(updatePayload)
        .where(eq(leads.id, id));
        
    revalidatePath('/dashboard/crm');
}
