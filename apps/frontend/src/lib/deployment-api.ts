import axios from "axios";
import { api as backendApi } from "./api";

const api = axios.create({
  baseURL: backendApi.defaults.baseURL || "http://localhost:4000",
  withCredentials: true
});

export interface DeploymentSimulateRequest {
  projectId: string;
  environmentType: "development" | "staging" | "production";
}

export interface DeploymentMetricsResponse {
  successRate: number;
  averageDeploymentTime: number;
  totalDeployments: number;
  failedDeployments: number;
}

export interface DeploymentHistoryItem {
  id: string;
  environmentType: string;
  version: string;
  timestamp: string;
  status: "success" | "failed";
  duration: number;
}

export interface RollbackRequest {
  projectId: string;
  environmentId: string;
  targetVersion: string;
}

export class DeploymentAPI {
  /**
   * Simulate a deployment to a specific environment
   */
  static async simulateDeployment(request: DeploymentSimulateRequest) {
    try {
      const response = await api.post("/deployment/simulate", request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get deployment metrics for a project
   */
  static async getMetrics(projectId: string): Promise<DeploymentMetricsResponse> {
    try {
      const response = await api.get("/deployment/metrics", {
        params: { projectId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get deployment history for a project
   */
  static async getHistory(
    projectId: string,
    environmentType?: string
  ): Promise<DeploymentHistoryItem[]> {
    try {
      const response = await api.get("/deployment/history", {
        params: { projectId, environmentType }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rollback a deployment to a previous version
   */
  static async rollbackDeployment(request: RollbackRequest) {
    try {
      const response = await api.post("/deployment/rollback", request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific deployment by ID
   */
  static async getDeployment(deploymentId: string) {
    try {
      const response = await api.get(`/deployment/${deploymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel an in-progress deployment
   */
  static async cancelDeployment(deploymentId: string) {
    try {
      const response = await api.post(`/deployment/${deploymentId}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}
