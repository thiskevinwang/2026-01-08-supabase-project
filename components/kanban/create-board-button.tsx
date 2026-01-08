"use client";

import { useState } from "react";
import { Plus, LayoutDashboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBoard } from "@/lib/actions/kanban";

export function CreateBoardButton() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createBoard();
    } catch (error) {
      console.error("Failed to create board:", error);
      setIsCreating(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleCreate}
      disabled={isCreating}
      className="gap-2"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating board...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Create your first board
        </>
      )}
    </Button>
  );
}

export function EmptyBoardState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
          <LayoutDashboard className="h-10 w-10 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Welcome to TaskFlow!</h2>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have a kanban board yet. Create one to start organizing
          your tasks with drag-and-drop simplicity.
        </p>
        <CreateBoardButton />
      </div>
    </div>
  );
}
