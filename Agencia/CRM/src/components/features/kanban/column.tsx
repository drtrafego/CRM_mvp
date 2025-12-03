'use client';import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { LeadCard } from "./lead-card";
import { Lead } from "@/server/db/schema";
import { useMemo, useState } from "react";
import { updateColumn, deleteColumn } from "@/server/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  isOverlay?: boolean;
}

export function Column({ id, title, leads, isOverlay }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  
  const isDefault = title === "Novos Leads";

  // Sortable hook for the column itself
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
        type: "Column",
        columnId: id,
    },
    disabled: !!isOverlay
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Droppable hook for leads within the column
    const { setNodeRef: setDroppableRef } = useDroppable({
      id: id,
      data: {
          type: "Column",
          columnId: id,
      },
      disabled: !!isOverlay
    });

  const leadIds = useMemo(() => leads.map((lead) => lead.id), [leads]);

  async function handleSave() {
      if (editTitle.trim() && editTitle !== title) {
          await updateColumn(id, editTitle);
      }
      setIsEditing(false);
  }

  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
      if (isDefault) return;
      
      if (confirm(`Tem certeza que deseja excluir a coluna "${title}"? Os leads serão movidos para a coluna anterior ou seguinte.`)) {
          setIsDeleting(true);
          try {
              await deleteColumn(id);
          } catch (error) {
              console.error("Erro ao excluir coluna:", error);
              alert("Ocorreu um erro ao excluir a coluna.");
          } finally {
              setIsDeleting(false);
          }
      }
  }

  return (
    <div 
        ref={setSortableRef}
        style={style}
        className={cn(
            "flex flex-col h-full w-[300px] min-w-[300px] bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50",
            isDragging && "opacity-50 border-dashed border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20",
            isDeleting && "opacity-50 pointer-events-none"
        )}
    >
      {/* Column Header */}
      <div 
        {...attributes} 
        {...listeners}
        className={cn(
            "p-3 pb-2 flex items-center justify-between group cursor-grab active:cursor-grabbing",
            isEditing && "cursor-default"
        )}
      >
        {isEditing ? (
             <div 
                className="flex items-center gap-2 w-full" 
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
             >
                 <Input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    className="h-7 text-sm px-2"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSave();
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                            setEditTitle(title);
                        }
                    }}
                 />
                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                     <Check className="h-4 w-4 text-green-600" />
                 </Button>
                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                     setIsEditing(false);
                     setEditTitle(title);
                 }}>
                     <X className="h-4 w-4 text-red-600" />
                 </Button>
             </div>
        ) : (
            <>
                <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {title}
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {leads.length}
                    </span>
                </h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 transition-opacity"
                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on menu click
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Renomear
                        </DropdownMenuItem>
                        {!isDefault && (
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </>
        )}
      </div>

      {/* Droppable Area */}
      <div ref={setDroppableRef} className="flex-1 p-2 overflow-hidden">
         <div className="h-full pr-3 overflow-y-auto custom-scrollbar">
            <SortableContext items={leadIds}>
            <div className="flex flex-col gap-3 pb-4">
                {leads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                ))}
            </div>
            </SortableContext>
         </div>
      </div>
    </div>
  );
}
