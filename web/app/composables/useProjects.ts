// Projects composable

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

export interface ProjectMember {
  user_id: number;
  role: string;
  name: string;
  email: string;
}

export interface Board {
  id: number;
  project_id: number;
  name: string;
}

export interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  boards: Board[];
  labels: Label[];
}

export function useProjects() {
  const api = useApi();

  const getProjects = async () => {
    const response = await api.get<{ projects: Project[] }>('/projects');
    return response.projects;
  };

  const getProject = async (id: number) => {
    const response = await api.get<{
      project: Project;
      members: ProjectMember[];
      boards: Board[];
      labels: Label[];
    }>(`/projects/${id}`);
    return {
      ...response.project,
      members: response.members,
      boards: response.boards,
      labels: response.labels,
    };
  };

  const createProject = async (data: { name: string; key: string; description?: string }) => {
    const response = await api.post<{ project: Project }>('/projects', data);
    return response.project;
  };

  const updateProject = async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.patch<{ project: Project }>(`/projects/${id}`, data);
    return response.project;
  };

  const addMember = async (projectId: number, userId: number, role: 'admin' | 'member' = 'member') => {
    await api.post(`/projects/${projectId}/members`, { user_id: userId, role });
  };

  const removeMember = async (projectId: number, userId: number) => {
    await api.del(`/projects/${projectId}/members/${userId}`);
  };

  return {
    getProjects,
    getProject,
    createProject,
    updateProject,
    addMember,
    removeMember,
  };
}
