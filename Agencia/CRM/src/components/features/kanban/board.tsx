'use client';

import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { useState, useTransition, useEffect } from "react";
import { Column } from "./column";
import { LeadCard } from "./lead-card";
import { Lead, Column as DbColumn } from "@/server/db/schema";
import { updateLeadStatus } from "@/server/actions/leads";
import { createPortal } from "react-dom";
import { createColumn } from "@/server/actions/leads";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface BoardProps {
  initialLeads: Lead[];
  columns: DbColumn[];
  onLeadsChange?: (leads: Lead[]) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function Board({ initialLeads, columns, onLeadsChange }: BoardProps) {
  // Optimistic state is now controlled or falls back to local
  const [localLeads, setLocalLeads] = useState<Lead[]>(initialLeads);
  
  // Use props leads if provided (controlled mode), otherwise local
  const leads = localLeads;
  
  useEffect(() => {
    setLocalLeads(initialLeads);
  }, [initialLeads]);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // Avoid accidental drags
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function findColumn(id: string | undefined) {
      if (!id) return null;
      if (columns.some(c => c.id === id)) return id;
      return leads.find(l => l.id === id)?.columnId || null;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) {
      setActiveLead(lead);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeColumn = findColumn(active.id as string);
    const overColumn = findColumn(overId as string);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Moving between columns - update state immediately for visual feedback
    // Calculate new state based on current 'leads'
    const prev = leads;
    const activeItems = prev.filter(l => l.columnId === activeColumn);
    const overItems = prev.filter(l => l.columnId === overColumn);
    
    // const activeIndex = activeItems.findIndex(l => l.id === active.id);
    
    let newIndex;
    if (overItems.some(l => l.id === overId)) {
        newIndex = overItems.findIndex(l => l.id === overId);
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height;
  
        const modifier = isBelowOverItem ? 1 : 0;
  
        newIndex = newIndex >= 0 ? newIndex + modifier : overItems.length + 1;
    } else {
        newIndex = overItems.length + 1;
    }

    const newLeads = prev.map(l => {
        if (l.id === active.id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...l, columnId: overColumn as any, position: newIndex };
        }
        return l;
    });

    setLocalLeads(newLeads);
    // Trigger parent update in transition
    startTransition(() => {
        onLeadsChange?.(newLeads);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || !over) {
        setActiveLead(null);
        return;
    }

    // Calculate final positions
    const activeItems = leads.filter(l => l.columnId === activeColumn);
    const overItems = leads.filter(l => l.columnId === overColumn);
    
    const activeIndex = activeItems.findIndex(l => l.id === activeId);
    const overIndex = overItems.findIndex(l => l.id === overId);
    
    let newIndex = overIndex;
    
    // If dropped on the column itself (empty or end)
    if (columns.some(c => c.id === overId)) {
        newIndex = overItems.length;
    } else if (overIndex === -1) {
        newIndex = overItems.length; // fallback
    }

    if (activeColumn === overColumn && activeIndex !== overIndex) {
         // Reorder in same column
         const reordered = arrayMove(leads, leads.indexOf(leads.find(l => l.id === activeId)!), leads.indexOf(leads.find(l => l.id === overId)!));
         
         setLocalLeads(reordered);
         startTransition(() => {
            onLeadsChange?.(reordered);
            updateLeadStatus(activeId, activeColumn, newIndex);
         });
    } else if (activeColumn !== overColumn) {
        // Moved to different column
        // State already updated in dragOver, just sync to server
         startTransition(() => {
             updateLeadStatus(activeId, overColumn, newIndex);
         });
    }

    setActiveLead(null);
  }

  const [mounted, setMounted] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  async function handleCreateColumn() {
    if (!newColumnName.trim()) return;
    await createColumn(newColumnName);
    setNewColumnName("");
    setIsCreateColumnOpen(false);
  }

  if (!mounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4 pb-2 items-start">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            leads={leads
                .filter((l) => l.columnId === col.id)
                .sort((a,b) => {
                    if (a.position !== b.position) return a.position - b.position;
                    // Tie-breaker: Newest first or by ID for stability
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
            }
          />
        ))}
        <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-[50px] min-w-[300px] border-dashed border-2 hover:border-solid hover:bg-slate-50 dark:hover:bg-slate-900">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Adicionar Coluna
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Coluna</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Coluna</Label>
                        <Input id="name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} placeholder="Ex: Aguardando Resposta" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateColumn}>Criar Coluna</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeLead ? <LeadCard lead={activeLead} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
