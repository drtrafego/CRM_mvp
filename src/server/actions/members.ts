'use server'

import { db } from "@/lib/db";
import { members, users, organizations, invitations } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addMember(email: string, orgId: string, role: 'admin' | 'viewer' = 'viewer') {
  const session = await auth();
  if (!session?.user?.email) {
      throw new Error("Unauthorized");
  }

  // 1. Check if requester is admin/owner of the org
  const requester = await db.query.members.findFirst({
      where: and(
          eq(members.organizationId, orgId),
          eq(members.userId, session.user.id!) 
      )
  });

  // Also allow Super Admins (from env) to add members
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  const isSuperAdmin = adminEmails.includes(session.user.email);

  if (!requester && !isSuperAdmin) {
      throw new Error("Permission denied");
  }

  // 2. Find the user by email
  let targetUser = await db.query.users.findFirst({
      where: eq(users.email, email)
  });

  if (!targetUser) {
      // Create invitation if user doesn't exist
      const existingInvite = await db.query.invitations.findFirst({
          where: and(
              eq(invitations.email, email),
              eq(invitations.organizationId, orgId),
              eq(invitations.status, 'pending')
          )
      });

      if (existingInvite) {
          throw new Error("Já existe um convite pendente para este email.");
      }

      await db.insert(invitations).values({
          email,
          organizationId: orgId,
          role,
          status: 'pending'
      });
      
      revalidatePath(`/org/${orgId}/settings`);
      return { status: "invited" };
  }

  // 3. Check if already member
  const existingMember = await db.query.members.findFirst({
      where: and(
          eq(members.organizationId, orgId),
          eq(members.userId, targetUser.id)
      )
  });

  if (existingMember) {
      throw new Error("Usuário já é membro da organização.");
  }

  // 4. Add member
  await db.insert(members).values({
      userId: targetUser.id,
      organizationId: orgId,
      role: role
  });

  revalidatePath(`/org/${orgId}/settings`);
  return { status: "added" };
}

export async function removeMember(memberId: string, orgId: string) {
    await db.delete(members).where(eq(members.id, memberId));
    revalidatePath(`/org/${orgId}/settings`);
}

export async function getMembers(orgId: string) {
    // Join members with users to get names and emails
    const orgMembers = await db
        .select({
            id: members.id,
            role: members.role,
            userId: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            joinedAt: members.createdAt,
            status: sql<'active'>`'active'` // Add status field for UI consistency
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(eq(members.organizationId, orgId));
        
    // Fetch pending invitations
    const pendingInvites = await db
        .select({
            id: invitations.id,
            role: invitations.role,
            userId: sql<string>`'pending'`, // Placeholder
            name: sql<string>`'Convidado'`,
            email: invitations.email,
            image: sql<string>`''`,
            joinedAt: invitations.createdAt,
            status: sql<'pending'>`'pending'`
        })
        .from(invitations)
        .where(and(eq(invitations.organizationId, orgId), eq(invitations.status, 'pending')));

    return [...orgMembers, ...pendingInvites];
}
