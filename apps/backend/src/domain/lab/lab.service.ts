import { prisma } from "../../infrastructure/prisma.js";
import { Prisma } from "@prisma/client";
import { HttpError } from "../../shared/httpError.js";
import { GamificationService } from "../gamification/gamification.service.js";
import { ValidationService } from "./validation.service.js";

const validationService = new ValidationService();
const gamification = new GamificationService();

export class LabService {
  async createSampleLab(ownerId: string) {
    return prisma.lab.create({
      data: {
        title: "CI Failure Triage Basics",
        description: "Use logs and run status to validate a successful run.",
        instructorId: ownerId,
        steps: {
          create: [
            {
              order: 1,
              title: "Execute pipeline",
              content: "Run the configured pipeline from dashboard.",
              stepType: "ACTION",
              hint: "Click Execute Pipeline first."
            },
            {
              order: 2,
              title: "Validate final state",
              content: "Submit state object with pipelineStatus set to SUCCESS.",
              stepType: "VALIDATION",
              hint: "Use {\"pipelineStatus\":\"SUCCESS\"}."
            }
          ]
        },
        rules: {
          create: [
            {
              stepOrder: 2,
              ruleType: "pipeline_status",
              expectedJson: { status: "SUCCESS" }
            }
          ]
        }
      },
      include: {
        steps: { orderBy: { order: "asc" } },
        rules: true
      }
    });
  }

  async createLab(instructorId: string, payload: {
    title: string;
    description: string;
    steps: Array<{ order: number; title: string; content: string; stepType: "ACTION" | "VALIDATION" | "OBSERVATION"; hint?: string }>;
    rules: Array<{ stepOrder: number; ruleType: string; expectedJson: Prisma.InputJsonValue }>;
  }) {
    return prisma.lab.create({
      data: {
        title: payload.title,
        description: payload.description,
        instructorId,
        steps: { create: payload.steps },
        rules: { create: payload.rules }
      },
      include: { steps: { orderBy: { order: "asc" } }, rules: true }
    });
  }

  async startLab(userId: string, labId: string) {
    const progress = await prisma.progress.upsert({
      where: { userId_labId: { userId, labId } },
      create: { userId, labId, currentStep: 1, completed: false, score: 0, streak: 0 },
      update: {}
    });

    const steps = await prisma.labStep.findMany({ where: { labId }, orderBy: { order: "asc" } });
    return { progress, step: steps[0] ?? null };
  }

  async submitStep(userId: string, labId: string, stepOrder: number, state: Record<string, unknown>) {
    const progress = await prisma.progress.findUnique({ where: { userId_labId: { userId, labId } } });
    if (!progress) {
      throw new HttpError(404, "Lab progress not initialized");
    }

    if (stepOrder !== progress.currentStep) {
      throw new HttpError(400, "Step locking active: complete current step first");
    }

    const validation = await validationService.validateStep(labId, stepOrder, state);
    if (!validation.valid) {
      const step = await prisma.labStep.findUnique({ where: { labId_order: { labId, order: stepOrder } } });
      return {
        success: false,
        feedback: validation.reason,
        hint: step?.hint ?? "Review previous step and try again."
      };
    }

    const totalSteps = await prisma.labStep.count({ where: { labId } });
    const nextStep = stepOrder + 1;
    const completed = nextStep > totalSteps;

    const updated = await prisma.progress.update({
      where: { userId_labId: { userId, labId } },
      data: {
        currentStep: completed ? totalSteps : nextStep,
        completed
      }
    });

    await gamification.applyProgressScore(userId, labId, 10);

    return {
      success: true,
      feedback: completed ? "Lab completed" : "Step validated",
      progress: updated,
      nextStep: completed
        ? null
        : await prisma.labStep.findUnique({ where: { labId_order: { labId, order: nextStep } } })
    };
  }

  async getLab(labId: string) {
    return prisma.lab.findUnique({
      where: { id: labId },
      include: {
        steps: { orderBy: { order: "asc" } },
        rules: true
      }
    });
  }
}
