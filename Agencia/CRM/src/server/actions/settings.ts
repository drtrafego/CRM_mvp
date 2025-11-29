'use server'

import { db } from "@/lib/db";
import { settings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MOCK_ORG_ID = "org_demo_123";

export async function getSettings() {
  return await db.query.settings.findFirst({
    where: eq(settings.organizationId, MOCK_ORG_ID),
  });
}

export async function updateCompanyName(name: string) {
  const existing = await getSettings();
  
  if (existing) {
    await db.update(settings)
      .set({ companyName: name })
      .where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({
      organizationId: MOCK_ORG_ID,
      companyName: name,
    });
  }
  
  revalidatePath('/dashboard/crm');
}
