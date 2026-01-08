"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { Task, Priority } from "@/lib/types/kanban";
import { cn } from "@/lib/utils";
import { deleteTask, updateTask } from "@/lib/actions/kanban";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  columnColor: string;
  onDelete?: (taskId: string) => void;
  onUpdate?: (task: Task) => void;
}

const priorityConfig: Record<
  Priority,
  { label: string; className: string; menuClassName: string }
> = {
  low: {
    label: "Low",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    menuClassName: "text-emerald-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    menuClassName: "text-amber-500",
  },
  high: {
    label: "High",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    menuClassName: "text-rose-500",
  },
};

const priorities: Priority[] = ["low", "medium", "high"];

export function TaskCard({
  task,
  columnColor,
  onDelete,
  onUpdate,
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPriority, setCurrentPriority] = useState<Priority>(
    task.priority
  );
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
    disabled: isDeleting,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsDeleting(true);

    // Optimistically remove from UI via callback
    onDelete?.(task.id);

    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
    }
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    if (newPriority === currentPriority) return;

    const oldPriority = currentPriority;

    // Optimistic update
    setCurrentPriority(newPriority);
    setIsUpdatingPriority(true);

    // Notify parent of the update
    onUpdate?.({ ...task, priority: newPriority });

    try {
      await updateTask({ id: task.id, priority: newPriority });
    } catch (error) {
      console.error("Failed to update priority:", error);
      // Revert on error
      setCurrentPriority(oldPriority);
      onUpdate?.({ ...task, priority: oldPriority });
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const priority = priorityConfig[currentPriority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm transition-all",
        "hover:shadow-md hover:border-muted-foreground/30",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/20",
        isDeleting && "opacity-50 scale-95 pointer-events-none"
      )}
    >
      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: columnColor }}
      />

      <div className="flex items-start gap-2 pl-2">
        {/* Drag handle */}
        <button
          className={cn(
            "mt-0.5 cursor-grab rounded p-1 opacity-0 transition-opacity",
            "hover:bg-muted group-hover:opacity-100",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
            isDeleting && "pointer-events-none"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug">{task.title}</h4>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            {/* Priority dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all",
                    "hover:ring-2 hover:ring-ring/20 focus:outline-none focus:ring-2 focus:ring-ring/20",
                    priority.className,
                    isUpdatingPriority && "opacity-50"
                  )}
                  disabled={isUpdatingPriority}
                >
                  {currentPriority === "high" && (
                    <AlertCircle className="h-2.5 w-2.5" />
                  )}
                  {isUpdatingPriority ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    priority.label
                  )}
                  <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[100px]">
                {priorities.map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={cn(
                      "text-xs font-medium",
                      priorityConfig[p].menuClassName,
                      currentPriority === p && "bg-accent"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {p === "high" && <AlertCircle className="h-3 w-3" />}
                      {priorityConfig[p].label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 opacity-0 transition-all",
            "group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive",
            isDeleting && "opacity-100"
          )}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-full mb-1" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}
