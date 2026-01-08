import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDefaultBoard } from "@/lib/actions/kanban";
import { KanbanBoard, EmptyBoardState } from "@/components/kanban";
import { LayoutDashboard } from "lucide-react";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const board = await getDefaultBoard();

  if (!board) {
    return (
      <div className="flex-1 flex flex-col w-full">
        <EmptyBoardState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{board.name}</h1>
            <p className="text-sm text-muted-foreground">
              {board.description || "Organize your tasks with drag and drop"}
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard initialBoard={board} />
    </div>
  );
}
