import { prisma } from "../../infrastructure/prisma.js";

export class ValidationService {
  async validateStep(labId: string, stepOrder: number, state: Record<string, unknown>) {
    const rules = await prisma.validationRule.findMany({ where: { labId, stepOrder } });

    for (const rule of rules) {
      if (rule.ruleType === "field_equals") {
        const expected = rule.expectedJson as { field: string; value: unknown };
        if (state[expected.field] !== expected.value) {
          return { valid: false, reason: `Expected ${expected.field} to be ${String(expected.value)}` };
        }
      }

      if (rule.ruleType === "pipeline_status") {
        const expected = rule.expectedJson as { status: string };
        if (state.pipelineStatus !== expected.status) {
          return { valid: false, reason: `Expected pipeline status ${expected.status}` };
        }
      }
    }

    return { valid: true, reason: null };
  }
}
