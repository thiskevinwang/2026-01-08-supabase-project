"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Board,
  Column,
  Task,
  CreateTaskInput,
  CreateColumnInput,
  UpdateTaskInput,
  UpdateColumnInput,
} from "@/lib/types/kanban";

// Board Actions
export async function getBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data: boards, error } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return boards || [];
}

export async function createBoard(
  name: string = "My Kanban Board",
  description: string = "Your personal kanban board"
): Promise<Board> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create a board");
  }

  // Create the board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select()
    .single();

  if (boardError) throw boardError;

  // Create default columns
  const defaultColumns = [
    { name: "To Do", color: "#f97316", position: 0 },
    { name: "In Progress", color: "#3b82f6", position: 1 },
    { name: "Done", color: "#22c55e", position: 2 },
  ];

  const { error: columnsError } = await supabase.from("columns").insert(
    defaultColumns.map((col) => ({
      board_id: board.id,
      ...col,
    }))
  );

  if (columnsError) throw columnsError;

  revalidatePath("/protected");

  return {
    ...board,
    columns: defaultColumns.map((col, index) => ({
      id: `temp-${index}`,
      board_id: board.id,
      ...col,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [],
    })),
  };
}

export async function getBoardWithColumnsAndTasks(
  boardId: string
): Promise<Board | null> {
  const supabase = await createClient();

  // Fetch board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (boardError || !board) return null;

  // Fetch columns for this board
  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (columnsError) throw columnsError;

  // Fetch all tasks for all columns
  const columnIds = columns?.map((c) => c.id) || [];
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .in("column_id", columnIds)
    .order("position", { ascending: true });

  if (tasksError) throw tasksError;

  // Group tasks by column
  const tasksByColumn = (tasks || []).reduce(
    (acc, task) => {
      if (!acc[task.column_id]) {
        acc[task.column_id] = [];
      }
      acc[task.column_id].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // Attach tasks to columns
  const columnsWithTasks: Column[] = (columns || []).map((column) => ({
    ...column,
    tasks: tasksByColumn[column.id] || [],
  }));

  return {
    ...board,
    columns: columnsWithTasks,
  };
}

export async function getDefaultBoard(): Promise<Board | null> {
  const supabase = await createClient();

  const { data: board, error } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !board) return null;

  return getBoardWithColumnsAndTasks(board.id);
}

// Column Actions
export async function createColumn(input: CreateColumnInput): Promise<Column> {
  const supabase = await createClient();

  // Get the max position for the board
  const { data: existingColumns } = await supabase
    .from("columns")
    .select("position")
    .eq("board_id", input.board_id)
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = existingColumns?.[0]?.position ?? -1;

  const { data: column, error } = await supabase
    .from("columns")
    .insert({
      board_id: input.board_id,
      name: input.name,
      color: input.color || "#6366f1",
      position: maxPosition + 1,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/protected");
  return { ...column, tasks: [] };
}

export async function updateColumn(input: UpdateColumnInput): Promise<Column> {
  const supabase = await createClient();

  const updateData: Partial<Column> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.position !== undefined) updateData.position = input.position;

  const { data: column, error } = await supabase
    .from("columns")
    .update(updateData)
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/protected");
  return { ...column, tasks: [] };
}

export async function deleteColumn(columnId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) throw error;

  revalidatePath("/protected");
}

// Task Actions
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = await createClient();

  // Get the max position for the column
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .eq("column_id", input.column_id)
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = existingTasks?.[0]?.position ?? -1;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      column_id: input.column_id,
      title: input.title,
      description: input.description || null,
      priority: input.priority || "medium",
      position: maxPosition + 1,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/protected");
  return task;
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const supabase = await createClient();

  const updateData: Partial<Task> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.column_id !== undefined) updateData.column_id = input.column_id;
  if (input.position !== undefined) updateData.position = input.position;

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/protected");
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) throw error;

  revalidatePath("/protected");
}

export async function moveTask(
  taskId: string,
  targetColumnId: string,
  newPosition: number
): Promise<void> {
  const supabase = await createClient();

  // Update the task's column and position
  const { error } = await supabase
    .from("tasks")
    .update({
      column_id: targetColumnId,
      position: newPosition,
    })
    .eq("id", taskId);

  if (error) throw error;

  revalidatePath("/protected");
}

export async function reorderTasksInColumn(
  columnId: string,
  taskIds: string[]
): Promise<void> {
  const supabase = await createClient();

  // Update positions for all tasks in the new order
  const updates = taskIds.map((taskId, index) =>
    supabase
      .from("tasks")
      .update({ position: index, column_id: columnId })
      .eq("id", taskId)
  );

  await Promise.all(updates);

  revalidatePath("/protected");
}

export async function reorderColumns(
  boardId: string,
  columnIds: string[]
): Promise<void> {
  const supabase = await createClient();

  // Update positions for all columns in the new order
  const updates = columnIds.map((columnId, index) =>
    supabase.from("columns").update({ position: index }).eq("id", columnId)
  );

  await Promise.all(updates);

  revalidatePath("/protected");
}
