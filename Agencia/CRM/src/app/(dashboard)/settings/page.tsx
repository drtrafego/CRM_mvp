import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerencie as configurações da sua conta e preferências do CRM.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" defaultValue="Usuário Demo" readOnly className="bg-slate-50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="demo@bilderai.com" readOnly className="bg-slate-50" />
            </div>
          </CardContent>
          <CardFooter className="border-t p-4 bg-slate-50/50">
            <Button variant="outline" disabled>Salvar Alterações</Button>
          </CardFooter>
        </Card>

        {/* Notifications Section */}
        <Card>
            <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Escolha como você quer ser notificado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Novos Leads</Label>
                        <p className="text-sm text-slate-500">Receba um email quando um novo lead for criado.</p>
                    </div>
                    {/* Switch mock since I don't have the component installed or imported properly yet, using simple checkbox style div if needed or Button */}
                    <div className="h-6 w-11 bg-indigo-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                    </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Resumo Semanal</Label>
                        <p className="text-sm text-slate-500">Receba um resumo semanal das suas vendas.</p>
                    </div>
                    <div className="h-6 w-11 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card>
            <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>Conecte seu CRM a outras ferramentas (Zapier, n8n, Typeform, etc).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-base font-semibold">Webhook URL (Captura de Leads)</Label>
                    <p className="text-sm text-slate-500">
                        Use este URL para enviar leads automaticamente para o seu CRM.
                    </p>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input readOnly value="https://seu-crm.com/api/webhooks/leads" className="font-mono text-xs bg-slate-50 pr-10" />
                        </div>
                        <Button variant="outline" size="icon" title="Copiar URL">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-base font-semibold">Formato do Payload (JSON)</Label>
                    <p className="text-sm text-slate-500">
                        Configure sua ferramenta de automação (Zapier, n8n, Make, Typeform) para enviar uma requisição <strong>POST</strong> para a URL acima com o seguinte corpo JSON. Certifique-se de definir o cabeçalho <code>Content-Type: application/json</code>.
                    </p>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto relative group">
                        <pre>{`{
  "name": "Nome do Cliente",
  "email": "cliente@email.com",
  "phone": "11999999999",
  "company": "Empresa LTDA",
  "notes": "Interesse no plano premium...",
  "campaignSource": "Instagram Ads"
}`}</pre>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copiar JSON"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                         </Button>
                    </div>
                    <p className="text-xs text-slate-500 pt-2">
                        * O campo <code>name</code> e (<code>email</code> ou <code>phone</code>) são obrigatórios.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
