import { api } from "./api";

export interface GitHubRepositoryInfo {
  name: string;
  description: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  url: string;
  topics: string[];
}

export const githubApi = {
  /**
   * Validate GitHub repository exists and is accessible
   */
  validateRepository: async (repository: string, token?: string): Promise<boolean> => {
    try {
      const { data } = await api.post("/projects/validate-github", {
        repository,
        token
      });
      return data.success || data === true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get GitHub repository metadata
   */
  getRepositoryInfo: async (
    repository: string,
    token?: string
  ): Promise<GitHubRepositoryInfo | null> => {
    try {
      const { data } = await api.post("/projects/github-info", {
        repository,
        token
      });
      return data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Import repository from GitHub into a project
   */
  importRepository: async (
    projectId: string,
    repository: string,
    options?: {
      token?: string;
      branch?: string;
    }
  ) => {
    const { data } = await api.post(`/projects/${projectId}/import-github`, {
      repository,
      token: options?.token,
      branch: options?.branch || "main"
    });
    return data;
  }
};
