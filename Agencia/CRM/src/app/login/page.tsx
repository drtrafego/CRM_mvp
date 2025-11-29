import { LoginForm } from "@/components/auth/login-form";
import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await stackServerApp.getUser();

  if (user) {
    redirect("/crm");
  }

  return <LoginForm />;
}
