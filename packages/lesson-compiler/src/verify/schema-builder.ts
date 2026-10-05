import { verifyDesignTask, type DesignTask } from '@learn-code/lesson-schema';
import { createInlineEngine } from '@learn-code/sql-engine';

/**
 * Runs a schemaBuilder step's reference drafts and wrong drafts through the inline sql-engine
 * adapter (PGlite): every reference must pass every scenario, every wrong draft must fail the
 * scenario it names. The checking logic itself is pure and lives in `lesson-schema`.
 */
export function checkSchemaBuilder(task: DesignTask): Promise<readonly string[]> {
  return verifyDesignTask(createInlineEngine(), task);
}
