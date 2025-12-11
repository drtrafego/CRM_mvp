import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, leads, columns, leadHistory } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client only if API Key is present
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    if (!openai) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json(
        { error: "Server configuration error: AI service unavailable" },
        { status: 503 }
      );
    }

    const { orgSlug } = await params;
    
    // 1. Validate Organization Slug
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // 2. Get Request Body (JSON or FormData)
    let rawData: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      rawData = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      rawData = Object.fromEntries(formData.entries());
    } else {
      // Fallback for x-www-form-urlencoded or others
       try {
          rawData = await req.json();
       } catch (e) {
           return NextResponse.json(
            { error: "Unsupported content type or invalid body" },
            { status: 400 }
          );
       }
    }

    // 3. Normalize Data with OpenAI (Zero-ETL)
    const systemPrompt = `Você é um normalizador de dados para CRM. Analise o JSON de entrada. Extraia e mapeie para estritamente estas chaves: { name: string | null, email: string | null, phone: string | null, message: string | null, company: string | null }. Retorne APENAS o JSON limpo.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(rawData) },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const normalizedData = JSON.parse(completion.choices[0].message.content || "{}");

    // 4. Find Default Column ("New") for the Organization
    // Assuming the first column by order is the default "New" column
    const defaultColumn = await db.query.columns.findFirst({
      where: eq(columns.organizationId, org.id),
      orderBy: (columns, { asc }) => [asc(columns.order)],
    });

    // If no column exists, we might need to create one or handle error. 
    // For now, we proceed only if a column is found or leave columnId null/undefined if schema permits.
    // Ideally, organization creation should ensure default columns exist.
    
    // 5. Save Lead to Database
    const newLead = await db.insert(leads).values({
      name: normalizedData.name || "Sem Nome",
      email: normalizedData.email,
      whatsapp: normalizedData.phone, // Mapping phone to whatsapp field as per schema usually
      company: normalizedData.company,
      notes: normalizedData.message,
      organizationId: org.id,
      status: "New", // Default status text
      columnId: defaultColumn?.id, // Link to the first column if exists
    }).returning();

    // 6. Log History
    if (newLead[0]) {
       await db.insert(leadHistory).values({
          leadId: newLead[0].id,
          action: 'create',
          details: `Lead criado via Integração (Webhook) em ${defaultColumn?.title || 'Coluna Inicial'}`,
          toColumn: defaultColumn?.id,
       });
    }

    return NextResponse.json(
      { success: true, lead: newLead[0] },
      { status: 200 }
    );

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
