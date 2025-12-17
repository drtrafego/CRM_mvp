import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, leads, columns, leadHistory } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// CORS headers for cross-origin requests (Elementor, WordPress, etc.)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Allow-Credentials": "true",
};

// Handle preflight requests (OPTIONS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Simple field normalization without AI (faster, no timeout risk)
function normalizeLeadData(rawData: Record<string, any>) {
  // Common field name mappings (Portuguese/English variations)
  const nameFields = ['name', 'nome', 'nome_completo', 'full_name', 'fullname', 'Nome', 'Nome Completo'];
  const emailFields = ['email', 'e-mail', 'Email', 'E-mail', 'email_corporativo', 'Email Corporativo'];
  const phoneFields = ['phone', 'telefone', 'whatsapp', 'celular', 'tel', 'Phone', 'Telefone', 'WhatsApp', 'Celular'];
  const companyFields = ['company', 'empresa', 'Company', 'Empresa', 'company_name'];
  const messageFields = ['message', 'mensagem', 'notes', 'observacoes', 'Message', 'Mensagem', 'Observações'];

  const findValue = (fields: string[]) => {
    for (const field of fields) {
      if (rawData[field] !== undefined && rawData[field] !== null && rawData[field] !== '') {
        return String(rawData[field]);
      }
    }
    return null;
  };

  return {
    name: findValue(nameFields),
    email: findValue(emailFields),
    phone: findValue(phoneFields),
    company: findValue(companyFields),
    message: findValue(messageFields),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;

    // 1. Validate Organization Slug
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!org) {
      console.error(`[Webhook] Organization not found: ${orgSlug}`);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Get Request Body (JSON or FormData)
    let rawData: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        rawData = await req.json();
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        rawData = Object.fromEntries(formData.entries());
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        rawData = Object.fromEntries(new URLSearchParams(text));
      } else {
        // Fallback: try to parse as JSON, then as form data
        const text = await req.text();
        try {
          rawData = JSON.parse(text);
        } catch {
          rawData = Object.fromEntries(new URLSearchParams(text));
        }
      }
    } catch (parseError) {
      console.error("[Webhook] Failed to parse body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("[Webhook] Received data:", JSON.stringify(rawData));

    // 3. Normalize Data (fast, no AI)
    const normalizedData = normalizeLeadData(rawData);
    console.log("[Webhook] Normalized data:", JSON.stringify(normalizedData));

    // 4. Find Default Column for the Organization
    const defaultColumn = await db.query.columns.findFirst({
      where: eq(columns.organizationId, org.id),
      orderBy: (columns, { asc }) => [asc(columns.order)],
    });

    // 5. Save Lead to Database
    const newLead = await db.insert(leads).values({
      name: normalizedData.name || "Sem Nome",
      email: normalizedData.email,
      whatsapp: normalizedData.phone,
      company: normalizedData.company,
      notes: normalizedData.message,
      organizationId: org.id,
      status: "New",
      columnId: defaultColumn?.id,
    }).returning();

    // 6. Log History
    if (newLead[0]) {
      await db.insert(leadHistory).values({
        leadId: newLead[0].id,
        action: 'create',
        details: `Lead criado via Webhook em ${defaultColumn?.title || 'Coluna Inicial'}`,
        toColumn: defaultColumn?.id,
      });
    }

    console.log("[Webhook] Lead created successfully:", newLead[0]?.id);

    // Return plain text 'success' - some form handlers prefer this
    return new NextResponse("success", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain"
      }
    });

  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new NextResponse("error", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain"
      }
    });
  }
}
