// Tasks composable

import type { Task } from './useBoards';
import type { Label } from './useProjects';

export interface TaskWithDetails extends Task {
  labels?: Label[];
}

export interface Comment {
  id: number;
  task_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

export interface TaskDetail {
  task: TaskWithDetails;
  subtasks: Task[];
  comments: Comment[];
}

export interface CreateTaskData {
  type: 'issue' | 'bugfix' | 'story' | 'subtask';
  title: string;
  description?: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  assignee_id?: number;
  reporter_id?: number; // Optional on frontend create, but required in backend
  deadline?: string;
  time_spent?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  assignee_id?: number | null;
  deadline?: string | null;
  time_spent?: number;
  position?: number;
}

export function useTasks() {
  const api = useApi();

  const getTasks = async (boardId: number) => {
    const response = await api.get<{ tasks: Task[] }>(`/boards/${boardId}/tasks`);
    return response.tasks;
  };

  const getTask = async (id: number) => {
    const response = await api.get<TaskDetail>(`/tasks/${id}`);
    return response;
  };

  const createTask = async (boardId: number, data: CreateTaskData) => {
    const response = await api.post<{ task: Task }>(`/boards/${boardId}/tasks`, data);
    return response.task;
  };

  const updateTask = async (id: number, data: UpdateTaskData) => {
    const response = await api.patch<{ task: Task }>(`/tasks/${id}`, data);
    return response.task;
  };

  const deleteTask = async (id: number) => {
    await api.del(`/tasks/${id}`);
  };

  // Subtasks
  const createSubtask = async (parentId: number, data: Omit<CreateTaskData, 'type'>) => {
    const response = await api.post<{ subtask: Task }>(`/tasks/${parentId}/subtasks`, data);
    return response.subtask;
  };

  // Labels
  const addLabel = async (taskId: number, labelId: number) => {
    await api.post(`/tasks/${taskId}/labels/${labelId}`);
  };

  const removeLabel = async (taskId: number, labelId: number) => {
    await api.del(`/tasks/${taskId}/labels/${labelId}`);
  };

  // Comments
  const getComments = async (taskId: number) => {
    const response = await api.get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);
    return response.comments;
  };

  const addComment = async (taskId: number, content: string) => {
    const response = await api.post<{ comment: Comment }>(`/tasks/${taskId}/comments`, { content });
    return response.comment;
  };

  return {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    addLabel,
    removeLabel,
    getComments,
    addComment,
  };
}
