import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import axios from "axios";
import { ProjectAnalysisService } from "./project-analysis.service.js";
import { HttpError } from "../../shared/httpError.js";

interface GitHubImportOptions {
  repository: string; // owner/repo format
  token?: string; // GitHub personal access token (optional)
  branch?: string; // branch to clone from (default: main)
}

export class GitHubImportService {
  private analysisService = new ProjectAnalysisService();

  /**
   * Clone a GitHub repository and analyze it
   */
  async cloneAndAnalyze(projectId: string, options: GitHubImportOptions) {
    const extractDir = path.join(process.cwd(), "uploads", projectId, "extracted");
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      const normalizedRepository = this.normalizeRepositoryPath(options.repository);

      // Construct GitHub URL
      let repoUrl = `https://github.com/${normalizedRepository}.git`;
      
      // If token is provided, use it for authentication (supports private repos)
      if (options.token) {
        repoUrl = `https://${options.token}@github.com/${normalizedRepository}.git`;
      }

      // Clone the repository
      const branch = options.branch || "main";
      const cloneCommand = `git clone --depth 1 --branch ${branch} ${repoUrl} "${extractDir}"`;
      
      console.log(`Cloning repository from GitHub: ${normalizedRepository} (branch: ${branch})`);
      execSync(cloneCommand, { stdio: "pipe", timeout: 60000 });

      // Remove .git directory to save space
      const gitDir = path.join(extractDir, ".git");
      if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
      }

      // Find project root and analyze
      const projectRoot = this.analysisService.findProjectRoot(extractDir);
      const type = this.analysisService.detectProjectType(projectRoot);
      const dependencies = this.analysisService.analyzeDependencies(projectRoot, type);
      const buildSteps = this.analysisService.generateBuildSteps(type);
      const autoConfig = this.analysisService.generatePipelineConfig(type, buildSteps);

      return {
        success: true,
        projectRoot,
        type,
        dependencies,
        buildSteps,
        autoConfig,
        sourceType: "github" as const,
        repository: normalizedRepository,
        branch
      };
    } catch (error) {
      console.error("GitHub import failed:", error);
      
      // Clean up on failure
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }

      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("repository") && message.includes("not found")) {
          throw new HttpError(404, "Repository not found or inaccessible");
        }
        if (message.includes("remote branch") && message.includes("not found")) {
          throw new HttpError(400, "Selected branch does not exist");
        }
        throw new HttpError(502, `Failed to import from GitHub: ${error.message}`);
      }

      throw new HttpError(502, "Failed to import repository from GitHub");
    }
  }

  /**
   * Validate GitHub repository URL format and accessibility
   */
  async validateRepository(repository: string, token?: string): Promise<boolean> {
    try {
      const repoPath = this.normalizeRepositoryPath(repository);
      const url = `https://api.github.com/repos/${repoPath}`;
      
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json"
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await axios.head(url, { headers, timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      console.error("Repository validation failed:", error);
      return false;
    }
  }

  /**
   * Get repository metadata from GitHub
   */
  async getRepositoryMetadata(repository: string, token?: string) {
    try {
      const repoPath = this.normalizeRepositoryPath(repository);
      const url = `https://api.github.com/repos/${repoPath}`;
      
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json"
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await axios.get(url, { headers, timeout: 10000 });
      const data = response.data;

      if (!data || data.message === "Not Found") {
        throw new Error("Repository not found");
      }

      return {
        name: data.name,
        description: data.description || "",
        owner: data.owner.login,
        defaultBranch: data.default_branch,
        isPrivate: data.private,
        url: data.html_url,
        topics: data.topics || []
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new HttpError(404, "Repository not found");
        }
        if (error.response?.status === 401) {
          throw new HttpError(401, "Invalid GitHub token or insufficient permissions");
        }
        if (error.response?.status === 403) {
          throw new HttpError(403, "GitHub API rate limit exceeded or access denied");
        }
        console.error("Failed to fetch repository metadata:", error);
        throw new HttpError(502, "Unable to fetch repository information from GitHub");
      }
      console.error("Failed to fetch repository metadata:", error);
      throw new HttpError(500, "Failed to fetch repository information from GitHub");
    }
  }

  /**
   * List available branches for a repository
   */
  async listBranches(repository: string, token?: string): Promise<string[]> {
    try {
      const repoPath = this.normalizeRepositoryPath(repository);
      const url = `https://api.github.com/repos/${repoPath}/branches`;
      
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json"
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await axios.get(url, { headers, timeout: 10000 });
      const data = response.data;

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((branch: { name: string }) => branch.name);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      return [];
    }
  }

  /**
   * Normalize repository path (handle full URLs and owner/repo format)
   */
  private normalizeRepositoryPath(repository: string): string {
    const trimmedRepository = repository.trim();

    if (!trimmedRepository) {
      throw new HttpError(400, "Repository is required");
    }

    // If it's already in owner/repo format, return as-is
    if (!trimmedRepository.includes("://") && trimmedRepository.includes("/")) {
      const parts = trimmedRepository.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`.replace(/\.git$/, "");
      }
    }

    // If it's a full GitHub URL, extract owner/repo
    if (trimmedRepository.includes("github.com/")) {
      const match = trimmedRepository.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/)?$/);
      if (match) {
        return match[1];
      }
    }

    if (/^[^/\s]+\/[^/\s]+$/.test(trimmedRepository)) {
      return trimmedRepository.replace(/\.git$/, "");
    }

    throw new HttpError(400, "Repository must be a GitHub URL or owner/repo path");
  }
}
