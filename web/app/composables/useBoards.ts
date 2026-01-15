// Boards composable

import type { Board } from './useProjects';

export interface BoardColumn {
  id: number;
  board_id: number;
  name: string;
  color: string;
  position: number;
}

export interface Task {
  id: number;
  board_id: number;
  type: 'issue' | 'bugfix' | 'story' | 'subtask';
  title: string;
  description?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  assignee_id?: number;
  reporter_id: number;
  parent_id?: number;
  position: number;
  deadline?: string;
  time_spent?: number;
  created_at: string;
  subtasks?: Task[];
}

export interface BoardWithTasks {
  board: Board;
  columns: BoardColumn[];
  tasks: Task[];
}

export function useBoards() {
  const api = useApi();

  const getBoards = async (projectId: number) => {
    const response = await api.get<{ boards: Board[] }>(`/projects/${projectId}/boards`);
    return response.boards;
  };

  const getBoard = async (id: number) => {
    const response = await api.get<BoardWithTasks>(`/boards/${id}`);
    return response;
  };

  const createBoard = async (projectId: number, name: string) => {
    const response = await api.post<{ board: Board }>(`/projects/${projectId}/boards`, { name });
    return response.board;
  };

  const updateBoard = async (id: number, name: string) => {
    const response = await api.patch<{ board: Board }>(`/boards/${id}`, { name });
    return response.board;
  };

  const deleteBoard = async (id: number) => {
    await api.del(`/boards/${id}`);
  };

  // Column operations
  const createColumn = async (boardId: number, name: string, color?: string) => {
    const response = await api.post<{ column: BoardColumn }>(`/boards/${boardId}/columns`, { name, color });
    return response.column;
  };

  const updateColumn = async (columnId: number, data: { name?: string; color?: string }) => {
    const response = await api.patch<{ column: BoardColumn }>(`/columns/${columnId}`, data);
    return response.column;
  };

  const deleteColumn = async (columnId: number) => {
    await api.del(`/columns/${columnId}`);
  };

  const reorderColumns = async (boardId: number, columnIds: number[]) => {
    const response = await api.patch<{ columns: BoardColumn[] }>(`/boards/${boardId}/columns/reorder`, { columnIds });
    return response.columns;
  };

  return {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
}
