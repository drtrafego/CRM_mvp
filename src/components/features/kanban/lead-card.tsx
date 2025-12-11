'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/server/db/schema";
import { cn } from "@/lib/utils";
import { Calendar, MessageCircle, Paperclip, Pencil } from "lucide-react";
import { useState } from "react";
import { EditLeadDialog } from "./edit-lead-dialog";
import { Button } from "@/components/ui/button";
import { getWhatsAppLink } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Lead",
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "opacity-50 ring-2 ring-indigo-500/20 rounded-lg rotate-2",
        )}
      >
        <Card className="bg-slate-50 border-dashed border-2 border-slate-300 h-[150px]" />
      </div>
    );
  }

  return (
    <>
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        className="touch-none mb-3"
      >
        <Card 
            className="group hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing"
            onClick={(e) => {
                // Prevent triggering edit if we are just finishing a drag
                if (!isDragging) {
                    setShowEditDialog(true);
                }
            }}
        >
          <CardContent className="p-4 space-y-3">
            {/* Header with Tags */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                 {lead.campaignSource && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                      {lead.campaignSource}
                    </Badge>
                 )}
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!lead.whatsapp}
                        className={cn(
                          "h-6 w-6 -mt-1 transition-colors",
                          lead.whatsapp 
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                            : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        )}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening edit dialog
                          if (lead.whatsapp) {
                            window.open(getWhatsAppLink(lead.whatsapp), '_blank');
                          }
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {lead.whatsapp ? "Conversar no WhatsApp" : "Sem WhatsApp cadastrado"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                 
                 {lead.value && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.value))}
                    </span>
                 )}
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 hover:text-indigo-600 -mt-1 -mr-1 transition-opacity"
                    title="Editar Lead"
                 >
                    <Pencil className="h-3 w-3" />
                 </Button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {lead.name}
              </h4>
              {lead.company && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {lead.company}
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[1.5em]">
                {lead.notes || "Sem observações"}
              </p>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              {/* Assignee */}
              <div className="flex items-center gap-2">
                 <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800">
                    <AvatarImage src={`https://avatar.vercel.sh/${lead.email}`} />
                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600">
                      {lead.name.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                 </Avatar>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{lead.name.split(' ')[0]}</span>
              </div>

              {/* Meta Stats */}
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-[10px]">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric'})}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditLeadDialog lead={lead} open={showEditDialog} onOpenChange={setShowEditDialog} orgId={lead.organizationId} />
    </>
  );
}
