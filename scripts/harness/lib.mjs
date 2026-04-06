import { execFile, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class CommandError extends Error {
  constructor(command, code, stdout, stderr) {
    super(`Command failed (${code}): ${command}`);
    this.name = "CommandError";
    this.code = code;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
  return targetPath;
}

export async function readJson(filePath, fallback = null) {
  if (!(await pathExists(filePath))) {
    return fallback;
  }

  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, value, "utf8");
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function phaseKey(number) {
  return String(number).padStart(2, "0");
}

export function replaceTokens(template, tokens) {
  return Object.entries(tokens).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

export async function runCapture(command, args, options = {}) {
  const { cwd, env, allowFailure = false } = options;

  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env,
      maxBuffer: 20 * 1024 * 1024,
    });

    return {
      code: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    if (allowFailure) {
      return {
        code: error.code ?? 1,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? "",
      };
    }

    throw new CommandError(
      [command, ...args].join(" "),
      error.code ?? 1,
      error.stdout ?? "",
      error.stderr ?? "",
    );
  }
}

export async function runStreaming(command, args, options = {}) {
  const { cwd, env, input = "", logFile = null, quiet = false } = options;

  if (logFile) {
    await ensureDir(path.dirname(logFile));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";
    const logStream = logFile ? createWriteStream(logFile, { flags: "a" }) : null;

    const onStdout = (chunk) => {
      const text = chunk.toString();
      stdout += text;

      if (!quiet) {
        process.stdout.write(text);
      }

      logStream?.write(text);
    };

    const onStderr = (chunk) => {
      const text = chunk.toString();
      stderr += text;

      if (!quiet) {
        process.stderr.write(text);
      }

      logStream?.write(text);
    };

    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.on("error", reject);
    child.on("close", (code) => {
      logStream?.end();

      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject(
        new CommandError([command, ...args].join(" "), code ?? 1, stdout, stderr),
      );
    });

    child.stdin.end(input);
  });
}

export async function resolveRepoRoot(cwd) {
  const result = await runCapture("git", ["rev-parse", "--show-toplevel"], { cwd });
  return result.stdout.trim();
}

export async function readGitStatus(cwd, ignoredPrefixes = []) {
  const result = await runCapture(
    "git",
    ["status", "--short", "--untracked-files=all"],
    { cwd },
  );

  return result.stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .filter((line) => {
      const candidate = line.slice(3).trim();
      return !ignoredPrefixes.some((prefix) => candidate === prefix || candidate.startsWith(`${prefix}/`));
    });
}

export async function removePath(targetPath) {
  if (!(await pathExists(targetPath))) {
    return;
  }

  await rm(targetPath, { recursive: true, force: true });
}

export function formatList(items, empty = "- 없음") {
  if (!items || items.length === 0) {
    return empty;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function normalizeVerification(result) {
  return {
    lint: result?.lint ?? "skipped",
    typecheck: result?.typecheck ?? "skipped",
    build: result?.build ?? "skipped",
    test: result?.test ?? "skipped",
  };
}
