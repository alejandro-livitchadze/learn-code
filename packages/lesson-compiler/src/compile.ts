import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Markdoc, { type Node } from '@markdoc/markdoc';
import { parse as parseYaml, YAMLParseError } from 'yaml';
import { lesson as lessonSchema, type Lesson } from '@learn-code/lesson-schema';
import { FILE_ATTRIBUTES, KIND_TAGS, markdocConfig, type BuildContext } from './tags';

export interface CompileError {
  readonly file: string;
  /** 1-based line in `file`. */
  readonly line: number;
  readonly message: string;
}

export type CompileResult =
  | {
      readonly ok: true;
      readonly lesson: Lesson;
      /** 1-based source line of each step tag, keyed by step id. */
      readonly stepLines: Readonly<Record<string, number>>;
      /** 1-based source line of each step tag, in step order (unlike `stepLines`, safe with duplicate ids). */
      readonly stepLineList: readonly number[];
    }
  | { readonly ok: false; readonly errors: readonly CompileError[] };

export const formatError = (e: CompileError): string => `${e.file}:${e.line}: ${e.message}`;

/** Markdoc lines are 0-based; ours are 1-based. */
const lineOf = (node: Node): number => (node.lines[0] ?? 0) + 1;

/** Compile a `lesson.mdoc` file to a validated Lesson, or report every problem found. */
export function compileLesson(path: string): CompileResult {
  let source: string;
  try {
    source = readFileSync(path, 'utf8');
  } catch (e) {
    return fail([{ file: path, line: 1, message: `cannot read file: ${(e as Error).message}` }]);
  }
  return compileSource(source, path);
}

/** Same as compileLesson but for source text; `path` is used for messages and `./file` lookups. */
export function compileSource(source: string, path: string): CompileResult {
  const errors: CompileError[] = [];
  const add = (line: number, message: string): void =>
    void errors.push({ file: path, line, message });

  const ast = Markdoc.parse(source);

  // 1. Markdoc validation: unknown tags, missing or mistyped attributes.
  for (const v of Markdoc.validate(ast, markdocConfig)) {
    if (v.error.level === 'error' || v.error.level === 'critical') {
      add((v.location?.start.line ?? v.lines[0] ?? 0) + 1, v.error.message);
    }
  }

  // 2. Frontmatter.
  const frontmatter = readFrontmatter(ast.attributes['frontmatter'], add);

  // 3. Top level: only step tags allowed.
  const stepNodes: Node[] = [];
  for (const child of ast.children) {
    if (child.type === 'tag' && child.tag && child.tag in KIND_TAGS) stepNodes.push(child);
    else if (child.type === 'tag')
      add(
        lineOf(child),
        `tag "${child.tag}" cannot be used as a step; it belongs inside another step tag`,
      );
    else
      add(lineOf(child), 'text outside a step tag; every piece of content must belong to a step');
  }

  // 4. Nested structure and file references.
  const dir = dirname(resolve(path));
  const steps = stepNodes.map((n) => buildStep(n, dir, add));

  if (errors.length > 0) return fail(errors);

  // 5. Zod is the final gate.
  const parsed = lessonSchema.safeParse({ schemaVersion: 1, ...frontmatter, steps });
  if (parsed.success) {
    const stepLines: Record<string, number> = {};
    for (const n of stepNodes) {
      const id = n.attributes['id'];
      if (typeof id === 'string') stepLines[id] = lineOf(n);
    }
    return { ok: true, lesson: parsed.data, stepLines, stepLineList: stepNodes.map(lineOf) };
  }
  for (const issue of parsed.error.issues) {
    const stepIndex = issue.path[0] === 'steps' ? issue.path[1] : undefined;
    const node = typeof stepIndex === 'number' ? stepNodes[stepIndex] : undefined;
    const where = issue.path.slice(typeof stepIndex === 'number' ? 2 : 0).join('.');
    const at = node
      ? `step "${String(node.tag)}"${where ? ` field ${where}` : ''}`
      : issue.path.join('.') || 'lesson';
    add(node ? lineOf(node) : 1, `${at}: ${issue.message}`);
  }
  return fail(errors);
}

function fail(errors: readonly CompileError[]): CompileResult {
  return { ok: false, errors: [...errors].sort((a, b) => a.line - b.line) };
}

function readFrontmatter(
  raw: unknown,
  add: (line: number, message: string) => void,
): Record<string, unknown> {
  if (typeof raw !== 'string') {
    add(1, 'missing frontmatter (--- block with id, courseId, title, concepts)');
    return {};
  }
  try {
    const data: unknown = parseYaml(raw);
    if (data && typeof data === 'object' && !Array.isArray(data))
      return data as Record<string, unknown>;
    add(1, 'frontmatter must be a YAML mapping');
  } catch (e) {
    // The first line of the block is line 2 of the file.
    const line = e instanceof YAMLParseError ? (e.linePos?.[0].line ?? 1) + 1 : 1;
    add(line, `invalid frontmatter YAML: ${(e as Error).message.split('\n')[0]}`);
  }
  return {};
}

function buildStep(node: Node, dir: string, add: (line: number, message: string) => void): unknown {
  const spec = KIND_TAGS[node.tag ?? ''];
  if (!spec) return {};
  const ctx = (n: Node): BuildContext => {
    const attrs: Record<string, unknown> = { ...n.attributes };
    for (const [key, value] of Object.entries(attrs)) {
      if (FILE_ATTRIBUTES.has(key) && typeof value === 'string' && value.startsWith('./')) {
        const file = resolve(dir, value);
        if (existsSync(file)) attrs[key] = readFileSync(file, 'utf8').replace(/\n$/, '');
        else add(lineOf(n), `file "${value}" referenced by attribute "${key}" does not exist`);
      }
    }
    return {
      node: n,
      attrs,
      body: () =>
        Markdoc.format(
          new Markdoc.Ast.Node(
            'document',
            {},
            n.children.filter((c) => c.type !== 'tag'),
          ),
        ).trim(),
      kids: (name) => n.children.filter((c) => c.type === 'tag' && c.tag === name),
      child: ctx,
    };
  };
  for (const c of node.children) {
    for (const inner of c.walk()) {
      if (inner !== c && inner.type === 'tag' && c.type !== 'tag') {
        add(lineOf(inner), `tag "${inner.tag}" must start on its own line, not inside a paragraph`);
      }
    }
    if (c.type === 'tag' && !spec.children.includes(c.tag ?? '')) {
      add(lineOf(c), `tag "${c.tag}" is not allowed inside "${node.tag}"`);
    }
  }
  return spec.build(ctx(node));
}
