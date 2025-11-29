'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLead } from "@/server/actions/leads";
import { Lead } from "@/server/db/schema";
import { User, Phone, Mail, Building2, FileText, Save, X, DollarSign, Trash2 } from "lucide-react";
import { deleteLead } from "@/server/actions/leads";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const data = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        company: formData.get("company") as string,
        notes: formData.get("notes") as string,
        value: formData.get("value") as string,
    };
    
    await updateLead(lead.id, data);
    onOpenChange(false);
  }

  async function handleDelete() {
    await deleteLead(lead.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 p-0 gap-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <DialogHeader className="p-6 pb-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            Editar Lead
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 ml-10">
            Atualize as informações do lead {lead.name}.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Nome
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={lead.name}
                  required 
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" /> Whatsapp
                </Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={lead.phone || ""}
                  required
                  placeholder="(11) 99999-9999" 
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> Email
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={lead.email || ""}
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" /> Empresa
                </Label>
                <Input 
                  id="company" 
                  name="company" 
                  defaultValue={lead.company || ""}
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="value" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" /> Valor (R$)
                </Label>
                <Input 
                  id="value" 
                  name="value" 
                  type="number"
                  step="0.01"
                  defaultValue={lead.value || ""}
                  placeholder="0.00"
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" /> Observações
              </Label>
              <Textarea 
                  id="notes" 
                  name="notes" 
                  defaultValue={lead.notes || ""}
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors min-h-[100px] resize-none" 
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
               {isDeleting ? (
                 <>
                    <span className="text-sm text-red-600 font-medium">Tem certeza?</span>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, excluir
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsDeleting(false)}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Cancelar
                    </Button>
                 </>
               ) : (
                 <Button 
                   type="button" 
                   variant="ghost" 
                   onClick={() => setIsDeleting(true)}
                   className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                 >
                   <Trash2 className="mr-2 h-4 w-4" /> Excluir Lead
                 </Button>
               )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
