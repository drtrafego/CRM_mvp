'use client';

import { SortableContext, useSortable } from "@dnd-kit/sortable";
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
}

export function Column({ id, title, leads }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const isDefault = title === "Novos Leads";
  const [isDeleting, setIsDeleting] = useState(false);

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
        column: { id, title },
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  async function handleSave() {
      if (!editTitle.trim() || editTitle === title) {
          setIsEditing(false);
          return;
      }
      await updateColumn(id, editTitle);
      setIsEditing(false);
  }

  async function handleDelete() {
      if (isDefault) return;
      setIsDeleting(true);
      try {
        await deleteColumn(id);
      } catch (error) {
        setIsDeleting(false);
      }
  }

  return (
    <ColumnVisual 
        id={id}
        title={title}
        leads={leads}
        setSortableRef={setSortableRef}
        style={style}
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
        isDeleting={isDeleting}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        handleSave={handleSave}
        isDefault={isDefault}
        isOverlay={false}
    />
  );
}

export function ColumnDragOverlay({ id, title, leads }: ColumnProps) {
    return (
        <ColumnVisual
            id={id}
            title={title}
            leads={leads}
            isOverlay={true}
            isDragging={true}
            style={{ cursor: 'grabbing' }}
            // Pass empty/noop props for interactive elements
            isEditing={false}
            setIsEditing={() => {}}
            editTitle={title}
            setEditTitle={() => {}}
            handleSave={async () => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            isDefault={false}
            isDeleting={false}
        />
    );
}

// Internal UI Component
function ColumnVisual({
    id,
    title,
    leads,
    isOverlay,
    setSortableRef,
    style,
    attributes,
    listeners,
    isDragging,
    isDeleting,
    onEdit,
    onDelete,
    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    handleSave,
    isDefault
}: any) {
    const leadIds = useMemo(() => leads.map((lead: Lead) => lead.id), [leads]);
    
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
                isEditing && "cursor-default",
                "touch-none" // CRITICAL: prevent touch scrolling interference
            )}
          >
            {isEditing ? (
                 <div className="flex items-center gap-2 w-full">
                    <Input 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                 </div>
            ) : (
                <>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm">
                         <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {title}
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                            {leads.length}
                        </span>
                    </h3>
                    {!isOverlay && (
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
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Renomear
                                </DropdownMenuItem>
                                {!isDefault && (
                                    <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </>
            )}
          </div>
    
          {/* Droppable Area */}
          <div className="flex-1 p-2 overflow-hidden">
             <div className="h-full pr-3 overflow-y-auto custom-scrollbar min-h-[150px]">
                {/* Only enable SortableContext if NOT an overlay to avoid ID collisions */}
                {!isOverlay ? (
                    <SortableContext items={leadIds}>
                        <div className="flex flex-col gap-3 pb-4">
                            {leads.map((lead: Lead) => (
                                <LeadCard key={lead.id} lead={lead} />
                            ))}
                        </div>
                    </SortableContext>
                ) : (
                    <div className="flex flex-col gap-3 pb-4">
                        {leads.map((lead: Lead) => (
                            <LeadCard key={lead.id} lead={lead} />
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      );
}
