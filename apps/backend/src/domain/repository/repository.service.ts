import crypto from "node:crypto";
import { prisma } from "../../infrastructure/prisma.js";
import { HttpError } from "../../shared/httpError.js";

export class RepositoryService {
  async init(projectId: string) {
    const repo = await prisma.repository.create({
      data: {
        projectId,
        branches: {
          create: { name: "main" }
        }
      },
      include: { branches: true }
    });
    return repo;
  }

  async commit(projectId: string, message: string, diff: unknown) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: {
        branches: true,
        commits: true
      }
    });

    if (!repo) {
      throw new HttpError(404, "Repository not found");
    }

    const branch = repo.branches.find((b) => b.name === repo.currentBranch);
    if (!branch) {
      throw new HttpError(404, "Current branch not found");
    }

    const hash = crypto.createHash("sha1").update(`${Date.now()}-${message}`).digest("hex").slice(0, 10);
    const commit = await prisma.commit.create({
      data: {
        hash,
        message,
        repositoryId: repo.id,
        parentCommitId: branch.headCommitId,
        branchName: branch.name,
        diffJson: diff ?? {}
      }
    });

    await prisma.branch.update({ where: { id: branch.id }, data: { headCommitId: commit.id } });
    return commit;
  }

  async branch(projectId: string, name: string) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { branches: true }
    });
    if (!repo) {
      throw new HttpError(404, "Repository not found");
    }

    const current = repo.branches.find((b) => b.name === repo.currentBranch);
    return prisma.branch.create({
      data: {
        repositoryId: repo.id,
        name,
        headCommitId: current?.headCommitId
      }
    });
  }

  async checkout(projectId: string, branchName: string) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { branches: true }
    });

    if (!repo) {
      throw new HttpError(404, "Repository not found");
    }

    if (!repo.branches.some((b) => b.name === branchName)) {
      throw new HttpError(404, "Branch not found");
    }

    return prisma.repository.update({
      where: { id: repo.id },
      data: { currentBranch: branchName }
    });
  }

  async merge(projectId: string, sourceBranch: string, targetBranch: string) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { branches: true }
    });

    if (!repo) {
      throw new HttpError(404, "Repository not found");
    }

    const source = repo.branches.find((b) => b.name === sourceBranch);
    const target = repo.branches.find((b) => b.name === targetBranch);

    if (!source || !target) {
      throw new HttpError(404, "Invalid branches");
    }

    await prisma.branch.update({ where: { id: target.id }, data: { headCommitId: source.headCommitId } });
    return { merged: true, sourceBranch, targetBranch, headCommitId: source.headCommitId };
  }
}
