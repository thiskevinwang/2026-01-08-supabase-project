"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Board, Task, Column } from "@/lib/types/kanban";
import { KanbanColumn } from "./kanban-column";
import { AddColumnDialog } from "./add-column-dialog";
import { TaskCard } from "./task-card";
import { reorderTasksInColumn } from "@/lib/actions/kanban";

interface KanbanBoardProps {
  initialBoard: Board;
}

export function KanbanBoard({ initialBoard }: KanbanBoardProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnByTaskId = useCallback(
    (taskId: string): Column | undefined => {
      return board.columns.find((column) =>
        column.tasks.some((task) => task.id === taskId)
      );
    },
    [board.columns]
  );

  // Handler for deleting a task - optimistically updates the UI
  const handleDeleteTask = useCallback((taskId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      })),
    }));
  }, []);

  // Handler for adding a task - optimistically updates the UI
  const handleTaskCreated = useCallback((task: Task) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === task.column_id) {
          return {
            ...column,
            tasks: [...column.tasks, task],
          };
        }
        return column;
      }),
    }));
  }, []);

  // Handler for updating a task - optimistically updates the UI
  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
      })),
    }));
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeData = active.data.current;

      if (activeData?.type === "task") {
        setActiveTask(activeData.task);
        const column = findColumnByTaskId(active.id as string);
        if (column) {
          setActiveColumn(column);
        }
      }
    },
    [findColumnByTaskId]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Only handle task dragging
      if (activeData?.type !== "task") return;

      // Find source and destination columns
      const sourceColumn = findColumnByTaskId(activeId);
      let destColumn: Column | undefined;

      if (overData?.type === "column") {
        destColumn = board.columns.find((c) => c.id === overId);
      } else if (overData?.type === "task") {
        destColumn = findColumnByTaskId(overId);
      }

      if (!sourceColumn || !destColumn) return;
      if (sourceColumn.id === destColumn.id) return;

      // Move task between columns (optimistic update)
      setBoard((prev) => {
        const newColumns = prev.columns.map((column) => {
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              tasks: column.tasks.filter((t) => t.id !== activeId),
            };
          }
          if (column.id === destColumn.id) {
            const taskToMove = sourceColumn.tasks.find((t) => t.id === activeId);
            if (!taskToMove) return column;

            const overIndex = column.tasks.findIndex((t) => t.id === overId);
            const newTasks = [...column.tasks];

            if (overIndex >= 0) {
              newTasks.splice(overIndex, 0, {
                ...taskToMove,
                column_id: destColumn.id,
              });
            } else {
              newTasks.push({ ...taskToMove, column_id: destColumn.id });
            }

            return {
              ...column,
              tasks: newTasks,
            };
          }
          return column;
        });

        return { ...prev, columns: newColumns };
      });
    },
    [board.columns, findColumnByTaskId]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setActiveColumn(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type !== "task") return;

      // Find the column where the task ended up
      let destColumn: Column | undefined;
      if (overData?.type === "column") {
        destColumn = board.columns.find((c) => c.id === overId);
      } else if (overData?.type === "task") {
        destColumn = findColumnByTaskId(overId);
      }

      if (!destColumn) {
        // Task was dropped in the same column it came from
        destColumn = findColumnByTaskId(activeId);
      }

      if (!destColumn) return;

      // Reorder within the destination column
      const taskIds = destColumn.tasks.map((t) => t.id);

      // Handle reordering within same column
      if (activeId !== overId && overData?.type === "task") {
        const oldIndex = taskIds.indexOf(activeId);
        const newIndex = taskIds.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newTaskIds = [...taskIds];
          newTaskIds.splice(oldIndex, 1);
          newTaskIds.splice(newIndex, 0, activeId);

          // Update local state
          setBoard((prev) => {
            const newColumns = prev.columns.map((column) => {
              if (column.id === destColumn.id) {
                const reorderedTasks = newTaskIds
                  .map((id) => column.tasks.find((t) => t.id === id))
                  .filter(Boolean) as Task[];
                return { ...column, tasks: reorderedTasks };
              }
              return column;
            });
            return { ...prev, columns: newColumns };
          });

          // Persist to database
          await reorderTasksInColumn(destColumn.id, newTaskIds);
          return;
        }
      }

      // Persist the move to database
      await reorderTasksInColumn(
        destColumn.id,
        destColumn.tasks.map((t) => t.id)
      );
    },
    [board.columns, findColumnByTaskId]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
        {board.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onDeleteTask={handleDeleteTask}
            onTaskCreated={handleTaskCreated}
            onTaskUpdated={handleTaskUpdated}
          />
        ))}
        <AddColumnDialog boardId={board.id} />
      </div>

      <DragOverlay>
        {activeTask && activeColumn && (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} columnColor={activeColumn.color} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
