import { LoginForm } from "@/components/auth/login-form";
import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const stackEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID && !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  if (!stackEnabled) {
    redirect("/crm");
  }
  const user = await stackServerApp.getUser();
  if (user) {
    redirect("/crm");
  }
  return <LoginForm />;
}
