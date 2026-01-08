"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Task } from "@/lib/types/kanban";
import { TaskCard } from "./task-card";
import { AddTaskDialog } from "./add-task-dialog";
import { ColumnHeader } from "./column-header";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: Column;
  onDeleteTask?: (taskId: string) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
}

export function KanbanColumn({
  column,
  onDeleteTask,
  onTaskCreated,
  onTaskUpdated,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const taskIds = column.tasks.map((task) => task.id);

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className={cn(
          "flex flex-col h-full rounded-xl border bg-muted/30 transition-colors",
          isOver && "bg-muted/50 border-primary/30"
        )}
      >
        {/* Column Header */}
        <div className="p-3 pb-2">
          <ColumnHeader column={column} />
        </div>

        {/* Tasks Container */}
        <div
          ref={setNodeRef}
          className="flex-1 px-3 pb-3 overflow-y-auto min-h-[200px]"
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columnColor={column.color}
                  onDelete={onDeleteTask}
                  onUpdate={onTaskUpdated}
                />
              ))}
            </div>
          </SortableContext>

          {column.tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              No tasks yet
            </div>
          )}
        </div>

        {/* Add Task Button */}
        <div className="p-3 pt-0">
          <AddTaskDialog
            columnId={column.id}
            columnName={column.name}
            onTaskCreated={onTaskCreated}
          />
        </div>
      </div>
    </div>
  );
}
