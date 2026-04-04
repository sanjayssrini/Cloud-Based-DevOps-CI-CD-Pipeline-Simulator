import { api } from "./api";

export const memoryApi = {
  // Build Script Memory
  getUserBuildScriptMemory: async () => {
    const { data } = await api.get("/projects/memory/build-scripts");
    return data;
  },

  getProjectBuildScriptMemory: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/memory/build-scripts`);
    return data;
  },

  getFrequentlyUsedScripts: async (limit: number = 10) => {
    const { data } = await api.get("/projects/memory/frequently-used-scripts", {
      params: { limit }
    });
    return data;
  },

  toggleFavoriteBuildScript: async (projectId: string, scriptId: string, isFavorite: boolean) => {
    const { data } = await api.post(`/projects/${projectId}/memory/build-scripts/favorite`, {
      scriptId,
      isFavorite
    });
    return data;
  },

  // Test Case Memory
  getUserTestCaseMemory: async () => {
    const { data } = await api.get("/projects/memory/test-cases");
    return data;
  },

  getProjectTestCaseMemory: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/memory/test-cases`);
    return data;
  },

  getFrequentlyUsedTestCases: async (limit: number = 10) => {
    const { data } = await api.get("/projects/memory/frequently-used-tests", {
      params: { limit }
    });
    return data;
  },

  getTestCaseExecutionHistory: async (projectId: string, testCaseId: string, limit: number = 20) => {
    const { data } = await api.get(`/projects/${projectId}/memory/test-cases/history`, {
      params: { testCaseId, limit }
    });
    return data;
  },

  toggleFavoriteTestCase: async (projectId: string, testCaseId: string, isFavorite: boolean) => {
    const { data } = await api.post(`/projects/${projectId}/memory/test-cases/favorite`, {
      testCaseId,
      isFavorite
    });
    return data;
  },

  getTestTemplates: async (projectType: string) => {
    const { data } = await api.get("/projects/memory/test-templates", {
      params: { projectType }
    });
    return data;
  }
};
