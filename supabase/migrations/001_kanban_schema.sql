-- Kanban Board Schema Migration
-- Run this migration against your Supabase database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boards table: A user can have multiple boards
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columns table: Each board has configurable columns
CREATE TABLE IF NOT EXISTS columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1', -- Indigo default
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table: Tasks belong to columns and can be moved between them
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_position ON columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(column_id, position);

-- Enable Row Level Security (RLS)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view their own boards"
    ON boards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards"
    ON boards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
    ON boards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
    ON boards FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for columns (access through board ownership)
CREATE POLICY "Users can view columns of their boards"
    ON columns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create columns in their boards"
    ON columns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update columns in their boards"
    ON columns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete columns in their boards"
    ON columns FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.user_id = auth.uid()
        )
    );

-- RLS Policies for tasks (access through column -> board ownership)
CREATE POLICY "Users can view tasks in their boards"
    ON tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM columns
            JOIN boards ON boards.id = columns.board_id
            WHERE columns.id = tasks.column_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their boards"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM columns
            JOIN boards ON boards.id = columns.board_id
            WHERE columns.id = tasks.column_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their boards"
    ON tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM columns
            JOIN boards ON boards.id = columns.board_id
            WHERE columns.id = tasks.column_id
            AND boards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their boards"
    ON tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM columns
            JOIN boards ON boards.id = columns.board_id
            WHERE columns.id = tasks.column_id
            AND boards.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
    BEFORE UPDATE ON columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default board with columns for new users
CREATE OR REPLACE FUNCTION create_default_board_for_user()
RETURNS TRIGGER AS $$
DECLARE
    new_board_id UUID;
BEGIN
    -- Create a default board
    INSERT INTO boards (user_id, name, description)
    VALUES (NEW.id, 'My Kanban Board', 'Your default kanban board')
    RETURNING id INTO new_board_id;
    
    -- Create default columns
    INSERT INTO columns (board_id, name, color, position) VALUES
        (new_board_id, 'To Do', '#f97316', 0),      -- Orange
        (new_board_id, 'In Progress', '#3b82f6', 1), -- Blue
        (new_board_id, 'Done', '#22c55e', 2);        -- Green
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create default board when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_board_for_user();
