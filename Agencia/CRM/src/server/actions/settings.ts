'use server'

import { db } from "@/lib/db";
import { settings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { stackServerApp } from "@/stack";

async function getOrgId() {
  const user = await stackServerApp.getUser();
  return user?.selectedTeam?.id || user?.id || "org_demo_123";
}

export async function getSettings() {
  const user = await stackServerApp.getUser();
  const orgId = user?.selectedTeam?.id || user?.id || "org_demo_123";
  const email = user?.primaryEmail || "";

  const existing = await db.query.settings.findFirst({
    where: eq(settings.organizationId, orgId),
  });

  // Lazy initialization: if settings don't exist, create them with the email
  if (!existing) {
    const [newSettings] = await db.insert(settings).values({
      organizationId: orgId,
      companyName: user?.displayName || "Minha Empresa",
      email: email,
      viewMode: 'kanban',
    }).returning();
    return newSettings;
  }

  // Update email if it's missing in DB but we have it now
  if (!existing.email && email) {
      await db.update(settings).set({ email }).where(eq(settings.id, existing.id));
  }

  return existing;
}

export async function updateCompanyName(name: string) {
  const orgId = await getOrgId();
  const existing = await getSettings(); // This will now ensure creation
  
  if (existing) {
    await db.update(settings)
      .set({ companyName: name })
      .where(eq(settings.id, existing.id));
  }
  
  revalidatePath('/dashboard/crm');
}

export async function updateViewMode(viewMode: string) {
    const orgId = await getOrgId();
    const existing = await getSettings(); // Ensure existence

    if (existing) {
        await db.update(settings)
            .set({ viewMode })
            .where(eq(settings.id, existing.id));
    }
    revalidatePath('/dashboard/crm');
}
