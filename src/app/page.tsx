import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    // Se estiver logado, redireciona para o painel admin (para criar/selecionar orgs)
    redirect("/admin/dashboard");
  }

  // Se não estiver logado, mostra uma landing page simples com botão de login
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          CRM Multi-tenant
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Gerencie seus leads e oportunidades com inteligência artificial.
        </p>
        
        <form
          action={async () => {
            "use server"
            const { signIn } = await import("@/auth")
            await signIn("google", { redirectTo: "/admin/dashboard" })
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-11 px-8 py-2 w-full shadow-lg"
          >
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
