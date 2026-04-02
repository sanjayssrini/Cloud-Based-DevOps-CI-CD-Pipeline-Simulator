"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { ProjectCreationForm } from "./project-creation-form";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  uploadPath?: string;
}

interface ProjectsListProps {
  onProjectSelect: (projectId: string) => void;
}

export function ProjectsList({ onProjectSelect }: ProjectsListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get("/projects");
      return data as Project[];
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      projectsQuery.refetch();
    }
  });

  if (showCreateForm) {
    return (
      <ProjectCreationForm
        onSuccess={(projectId) => {
          setShowCreateForm(false);
          projectsQuery.refetch();
          onProjectSelect(projectId);
        }}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  const projects = projectsQuery.data || [];
  const hasProjects = projects.length > 0;

  if (!hasProjects) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="text-center">
          <div className="mb-4 text-5xl">📁</div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No Projects Yet</h3>
          <p className="mb-6 text-sm text-slate-600">Create your first CI/CD project to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-brand-ocean px-6 py-2 font-semibold text-white hover:bg-brand-ocean/90"
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Your Projects</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90"
        >
          + New Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-slate-600">{project.description}</p>
                )}
              </div>
              {project.uploadPath && (
                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  Ready
                </span>
              )}
            </div>

            <p className="mb-4 text-xs text-slate-500">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => onProjectSelect(project.id)}
                className="flex-1 rounded-lg bg-brand-ocean/10 px-3 py-2 text-sm font-semibold text-brand-ocean hover:bg-brand-ocean/20"
              >
                Open
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Delete this project?")) {
                    deleteProjectMutation.mutate(project.id);
                  }
                }}
                disabled={deleteProjectMutation.isPending}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
