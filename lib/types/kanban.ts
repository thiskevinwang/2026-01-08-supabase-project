export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  columns: Column[];
}

// For creating new items
export interface CreateTaskInput {
  column_id: string;
  title: string;
  description?: string;
  priority?: Priority;
}

export interface CreateColumnInput {
  board_id: string;
  name: string;
  color?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  column_id?: string;
  position?: number;
}

export interface UpdateColumnInput {
  id: string;
  name?: string;
  color?: string;
  position?: number;
}

export interface MoveTaskInput {
  taskId: string;
  targetColumnId: string;
  newPosition: number;
}
