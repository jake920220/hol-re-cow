#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import {
  ensureDir,
  formatList,
  normalizeVerification,
  pathExists,
  phaseKey,
  readGitStatus,
  readJson,
  removePath,
  replaceTokens,
  resolveRepoRoot,
  runCapture,
  runStreaming,
  sleep,
  timestamp,
  writeJson,
  writeText,
} from "./lib.mjs";

const RUNTIME_DIR = ".holrecow-harness";
const HARNESS_COMMENT_PREFIX = "HOLRECOW-HARNESS";

function parseArgs(argv) {
  const options = {
    from: null,
    once: false,
    dryRun: false,
    pollMs: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--from") {
      options.from = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === "--poll-ms") {
      options.pollMs = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === "--once") {
      options.once = true;
      continue;
    }

    if (value === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  if (options.from !== null && Number.isNaN(options.from)) {
    throw new Error("--from must be a number");
  }

  if (options.pollMs !== null && Number.isNaN(options.pollMs)) {
    throw new Error("--poll-ms must be a number");
  }

  return options;
}

function createInitialState() {
  return {
    version: 1,
    updatedAt: null,
    activePhase: null,
    phases: {},
  };
}

function buildPhaseRuntimeState(repoRoot, config, phase, existing = {}) {
  const nn = phaseKey(phase.number);

  return {
    number: phase.number,
    slug: phase.slug,
    name: phase.name,
    status: existing.status ?? "pending",
    branch: existing.branch ?? `phase/${nn}-${phase.slug}`,
    reviewBranch: existing.reviewBranch ?? `review/${nn}-${phase.slug}`,
    phaseWorktree:
      existing.phaseWorktree ??
      path.resolve(repoRoot, replaceTokens(config.phaseWorktreeTemplate, { nn, slug: phase.slug })),
    reviewWorktree:
      existing.reviewWorktree ??
      path.resolve(repoRoot, replaceTokens(config.reviewWorktreeTemplate, { nn, slug: phase.slug })),
    prNumber: existing.prNumber ?? null,
    prUrl: existing.prUrl ?? null,
    reviewCycles: existing.reviewCycles ?? 0,
    phaseResult: existing.phaseResult ?? null,
    reviewHistory: existing.reviewHistory ?? [],
    reconcileHistory: existing.reconcileHistory ?? [],
    mergeCommitSha: existing.mergeCommitSha ?? null,
    latestHeadSha: existing.latestHeadSha ?? null,
    artifactsDir:
      existing.artifactsDir ?? path.join(repoRoot, RUNTIME_DIR, "phases", nn),
    updatedAt: existing.updatedAt ?? null,
    blocker: existing.blocker ?? null,
  };
}

async function saveState(stateFile, state) {
  state.updatedAt = new Date().toISOString();
  await writeJson(stateFile, state);
}

async function loadHarness(repoRoot) {
  const configPath = path.join(repoRoot, "automation", "harness", "config.json");
  const config = await readJson(configPath);

  if (!config) {
    throw new Error(`Harness config not found: ${configPath}`);
  }

  const runtimeRoot = path.join(repoRoot, RUNTIME_DIR);
  const stateFile = path.join(runtimeRoot, "state.json");
  const state = (await readJson(stateFile, createInitialState())) ?? createInitialState();

  return {
    config,
    runtimeRoot,
    stateFile,
    state,
    schemaPaths: {
      phase: path.join(
        repoRoot,
        "automation",
        "harness",
        "schemas",
        "phase-execution.schema.json",
      ),
      review: path.join(
        repoRoot,
        "automation",
        "harness",
        "schemas",
        "review.schema.json",
      ),
      reconcile: path.join(
        repoRoot,
        "automation",
        "harness",
        "schemas",
        "reconcile.schema.json",
      ),
    },
  };
}

async function preflight(repoRoot, runtimeRoot) {
  await ensureDir(runtimeRoot);

  await runCapture("which", ["codex"], { cwd: repoRoot });
  await runCapture("which", ["gh"], { cwd: repoRoot });
  await runCapture("gh", ["auth", "switch", "-u", PHASE_GITHUB_LOGIN], { cwd: repoRoot });
  await runCapture("gh", ["auth", "status"], { cwd: repoRoot });
  await runCapture(path.join(repoRoot, "scripts", "gh-review"), ["auth", "status"], {
    cwd: repoRoot,
  });

  const dirtyLines = await readGitStatus(repoRoot, [".omx", RUNTIME_DIR]);

  if (dirtyLines.length > 0) {
    throw new Error(
      `Harness must start from a clean worktree.\n${dirtyLines.join("\n")}`,
    );
  }
}

async function ensurePhaseGitHubAccount(cwd) {
  await runCapture("gh", ["auth", "switch", "-u", PHASE_GITHUB_LOGIN], { cwd });
}

async function listWorktrees(repoRoot) {
  const result = await runCapture("git", ["worktree", "list", "--porcelain"], {
    cwd: repoRoot,
  });

  const worktrees = [];
  const blocks = result.stdout.split("\n\n").map((block) => block.trim()).filter(Boolean);

  for (const block of blocks) {
    const record = {};

    for (const line of block.split("\n")) {
      const [key, ...rest] = line.split(" ");
      record[key] = rest.join(" ");
    }

    if (record.worktree) {
      worktrees.push({
        path: record.worktree,
        branch: record.branch ? record.branch.replace("refs/heads/", "") : null,
      });
    }
  }

  return worktrees;
}

async function ensureBaseFetched(repoRoot) {
  await runCapture("git", ["fetch", "origin"], { cwd: repoRoot });
}

async function ensureWorktreeDependencies(worktreePath) {
  const nodeModulesPath = path.join(worktreePath, "node_modules");

  if (await pathExists(nodeModulesPath)) {
    return;
  }

  console.log(`[Harness] Installing dependencies in ${worktreePath}`);
  await runCapture("pnpm", ["install", "--frozen-lockfile"], {
    cwd: worktreePath,
  });
}

async function ensurePhaseWorktree(repoRoot, phaseState, config, dryRun) {
  const worktrees = await listWorktrees(repoRoot);
  const existing = worktrees.find((worktree) => path.resolve(worktree.path) === phaseState.phaseWorktree);

  if (existing) {
    return;
  }

  if (await pathExists(phaseState.phaseWorktree)) {
    throw new Error(`Phase worktree path already exists but is not registered: ${phaseState.phaseWorktree}`);
  }

  const branchExists =
    (
      await runCapture(
        "git",
        ["show-ref", "--verify", "--quiet", `refs/heads/${phaseState.branch}`],
        { cwd: repoRoot, allowFailure: true },
      )
    ).code === 0;

  if (dryRun) {
    return;
  }

  if (branchExists) {
    await runCapture("git", ["worktree", "add", phaseState.phaseWorktree, phaseState.branch], {
      cwd: repoRoot,
    });
    return;
  }

  await runCapture(
    "git",
    [
      "worktree",
      "add",
      "-b",
      phaseState.branch,
      phaseState.phaseWorktree,
      `origin/${config.baseBranch}`,
    ],
    { cwd: repoRoot },
  );
}

async function removeWorktree(repoRoot, worktreePath) {
  const worktrees = await listWorktrees(repoRoot);
  const existing = worktrees.find((worktree) => path.resolve(worktree.path) === path.resolve(worktreePath));

  if (existing) {
    await runCapture("git", ["worktree", "remove", "--force", worktreePath], {
      cwd: repoRoot,
      allowFailure: true,
    });
  }

  await removePath(worktreePath);
}

async function deleteLocalBranch(repoRoot, branch) {
  await runCapture("git", ["branch", "-D", branch], {
    cwd: repoRoot,
    allowFailure: true,
  });
}

async function ensureReviewWorktree(repoRoot, phaseState, dryRun) {
  await removeWorktree(repoRoot, phaseState.reviewWorktree);
  await deleteLocalBranch(repoRoot, phaseState.reviewBranch);

  if (dryRun) {
    return;
  }

  await runCapture(
    "git",
    ["worktree", "add", "-b", phaseState.reviewBranch, phaseState.reviewWorktree, phaseState.branch],
    { cwd: repoRoot },
  );
}

function buildPhasePrompt(phase, phaseState) {
  return `
너는 홀리카우 phase/${phaseKey(phase.number)} 구현 세션이다.

반드시 먼저 읽을 것:
- AGENTS.md
- docs/DESIGN.md
- docs/GIT_RULES.md
- docs/DB_SCHEMA.md
- docs/PHASE_HANDOFF.md
- skills/figma-implementation/SKILL.md
- skills/gsd-phase/SKILL.md

현재 phase 정보:
- 번호: ${phaseKey(phase.number)}
- 이름: ${phase.name}
- 브랜치: ${phaseState.branch}
- 작업 폴더: ${phaseState.phaseWorktree}
- 목표: ${phase.goal}

이번 phase의 범위:
${formatList(phase.scope)}

수동 확인 포인트:
${formatList(phase.manualChecks)}

반드시 지킬 것:
- 구현 범위를 벗어난 리팩토링은 하지 않는다.
- 모바일 웹 우선, 375 / 390 / 430 뷰포트를 기준으로 본다.
- 서버/클라이언트 경계를 지키고 DB/비밀정보는 서버에서만 다룬다.
- .omx/ 와 .holrecow-harness/ 는 절대 스테이징하지 않는다.
- 검증은 최소 pnpm lint, pnpm typecheck, pnpm build, pnpm test 까지 실행한다.
- 적절한 한국어 커밋 메시지로 커밋까지 완료한다.
- push 와 PR 생성은 하지 않는다. 하네스가 담당한다.
- 판단이 필요한 회색지대가 나오면 임의로 확장하지 말고 status=blocked 로 끝낸다.

완료 조건:
- 구현과 검증이 끝나고 worktree가 clean 해야 한다.
- 커밋이 생성되어 있어야 한다.

최종 응답은 JSON schema에 맞춰서만 출력한다.
- status: implemented | blocked | failed
- summary: 이번 phase 구현 요약
- change_summary: 핵심 변경점 리스트
- verification: lint/typecheck/build/test 각각 passed|failed|skipped
- manual_checks: 실제로 확인한 포인트
- pr_title: PR 제목 제안
- risks: 남은 리스크
- commit_created: 커밋 생성 여부
- blocker: 막힌 이유 없으면 null
`.trim();
}

function buildReviewPrompt(phase, phaseState) {
  return `
너는 홀리카우 phase/${phaseKey(phase.number)} 리뷰 세션이다.

반드시 먼저 읽을 것:
- AGENTS.md
- docs/DESIGN.md
- docs/GIT_RULES.md
- docs/DB_SCHEMA.md
- docs/PHASE_HANDOFF.md

리뷰 대상:
- phase: ${phaseKey(phase.number)} ${phase.name}
- review 브랜치: ${phaseState.reviewBranch}
- review worktree: ${phaseState.reviewWorktree}
- PR 번호: ${phaseState.prNumber}
- PR URL: ${phaseState.prUrl}

리뷰 초점:
${formatList(phase.reviewFocus)}

리뷰 규칙:
- 코드는 수정하지 않는다.
- 커밋하지 않는다.
- plain gh 대신 GitHub 읽기는 scripts/gh-review 를 우선 사용해도 된다.
- 비교 기준은 반드시 origin/main...${phaseState.reviewBranch} 로 본다.
- node_modules 가 없으면 pnpm install --frozen-lockfile 로 의존성을 먼저 준비한다.
- 문제를 찾을 때는 버그, 회귀, 서버 경계 위반, 누락된 상태, 검증 부족을 우선한다.
- 취향 수준의 의견은 finding으로 만들지 않는다.
- 로컬에서 필요한 lint/typecheck/build/test 검증은 실행 가능하다.
- 최종 출력만 JSON schema로 반환한다. GitHub 리뷰 등록은 하네스가 대신 수행한다.

판정 기준:
- 실질적인 수정 필요 이슈가 있으면 verdict=changes_requested
- 없으면 verdict=approved

최종 응답은 JSON schema에 맞춰서만 출력한다.
- status: reviewed | blocked | failed
- verdict: approved | changes_requested
- summary: 리뷰 총평
- findings: [{ id, severity, title, detail, recommendation, file }]
- verification: lint/typecheck/build/test 각각 passed|failed|skipped
- risks: 남은 리스크
- blocker: 막힌 이유 없으면 null
`.trim();
}

function buildReconcilePrompt(phase, phaseState, reviewResult) {
  return `
너는 홀리카우 phase/${phaseKey(phase.number)} 구현 세션의 리뷰 반영 담당이다.

반드시 먼저 읽을 것:
- AGENTS.md
- docs/DESIGN.md
- docs/GIT_RULES.md
- docs/DB_SCHEMA.md
- docs/PHASE_HANDOFF.md

현재 정보:
- phase: ${phaseKey(phase.number)} ${phase.name}
- 브랜치: ${phaseState.branch}
- 작업 폴더: ${phaseState.phaseWorktree}
- PR 번호: ${phaseState.prNumber}
- PR URL: ${phaseState.prUrl}
- 리뷰 사이클: ${phaseState.reviewCycles}

리뷰 결과:
${JSON.stringify(reviewResult, null, 2)}

리뷰 반영 규칙:
- 리뷰 코멘트를 무조건 수용하지 않는다.
- 납득 가능한 이슈는 수정하고, 납득되지 않거나 범위 밖이면 declined_findings 에 근거를 남긴다.
- .omx/ 와 .holrecow-harness/ 는 절대 스테이징하지 않는다.
- 수정 후 pnpm lint, pnpm typecheck, pnpm build, pnpm test 를 다시 실행한다.
- 코드 수정이 있다면 한국어 커밋 메시지로 커밋한다.
- push 와 PR 댓글 작성은 하네스가 담당한다.
- worktree는 clean 상태로 끝나야 한다.

최종 응답은 JSON schema에 맞춰서만 출력한다.
- status: resolved | blocked | failed
- summary: 이번 리뷰 반영 요약
- accepted_finding_ids: 실제 수정한 finding id 목록
- declined_findings: [{ id, rationale }]
- verification: lint/typecheck/build/test 각각 passed|failed|skipped
- risks: 남은 리스크
- commit_created: 새 커밋 생성 여부
- blocker: 막힌 이유 없으면 null
`.trim();
}

function renderVerificationLines(verification) {
  const normalized = normalizeVerification(verification);

  return [
    `- pnpm lint: ${normalized.lint}`,
    `- pnpm typecheck: ${normalized.typecheck}`,
    `- pnpm build: ${normalized.build}`,
    `- pnpm test: ${normalized.test}`,
  ].join("\n");
}

function renderPrBody(phase, phaseResult) {
  return [
    `## Summary`,
    ``,
    `**Phase ${phaseKey(phase.number)}: ${phase.name}**`,
    `**Goal:** ${phase.goal}`,
    ``,
    phaseResult.summary,
    ``,
    `## Changes`,
    formatList(phaseResult.change_summary),
    ``,
    `## Verification`,
    renderVerificationLines(phaseResult.verification),
    ``,
    `## Manual Checks`,
    formatList(phaseResult.manual_checks),
    ``,
    `## Risks`,
    formatList(phaseResult.risks),
  ].join("\n");
}

function renderReviewBody(phase, phaseState, reviewResult) {
  const findings = reviewResult.findings.length
    ? reviewResult.findings
        .map((finding) => {
          const fileLine = finding.file ? `File: ${finding.file}` : "File: 미지정";
          return `- [${finding.severity}] ${finding.id} ${finding.title}\n  ${finding.detail}\n  Recommendation: ${finding.recommendation}\n  ${fileLine}`;
        })
        .join("\n")
    : "- 없음";

  const machineReadable = {
    marker: `${HARNESS_COMMENT_PREFIX}:REVIEW:V1`,
    phase: phase.number,
    cycle: phaseState.reviewCycles,
    verdict: reviewResult.verdict,
    findings: reviewResult.findings,
  };

  return [
    `## Harness Review Summary`,
    ``,
    reviewResult.summary,
    ``,
    `## Findings`,
    findings,
    ``,
    `## Verification`,
    renderVerificationLines(reviewResult.verification),
    ``,
    `## Risks`,
    formatList(reviewResult.risks),
    ``,
    "```json",
    JSON.stringify(machineReadable, null, 2),
    "```",
  ].join("\n");
}

function renderReconcileComment(phase, phaseState, reconcileResult) {
  const accepted =
    reconcileResult.accepted_finding_ids.length > 0
      ? reconcileResult.accepted_finding_ids.map((id) => `- ${id}`).join("\n")
      : "- 없음";

  const declined =
    reconcileResult.declined_findings.length > 0
      ? reconcileResult.declined_findings
          .map((finding) => `- ${finding.id}: ${finding.rationale}`)
          .join("\n")
      : "- 없음";

  const machineReadable = {
    marker: `${HARNESS_COMMENT_PREFIX}:RECONCILE:V1`,
    phase: phase.number,
    cycle: phaseState.reviewCycles,
    accepted_finding_ids: reconcileResult.accepted_finding_ids,
    declined_findings: reconcileResult.declined_findings,
  };

  return [
    `## Harness Reconcile Summary`,
    ``,
    reconcileResult.summary,
    ``,
    `## Accepted Findings`,
    accepted,
    ``,
    `## Declined Findings`,
    declined,
    ``,
    `## Verification`,
    renderVerificationLines(reconcileResult.verification),
    ``,
    `## Risks`,
    formatList(reconcileResult.risks),
    ``,
    "```json",
    JSON.stringify(machineReadable, null, 2),
    "```",
  ].join("\n");
}

async function runCodexTask({
  repoRoot,
  cwd,
  prompt,
  schemaPath,
  outputPath,
  logPath,
  model,
  extraArgs,
  timeoutMs,
}) {
  const args = ["exec", ...extraArgs];

  if (model) {
    args.push("--model", model);
  }

  args.push("-C", cwd, "--output-schema", schemaPath, "-o", outputPath, "-");

  await runStreaming("codex", args, {
    cwd: repoRoot,
    input: `${prompt}\n`,
    logFile: logPath,
    timeoutMs,
  });

  const payload = await readJson(outputPath);

  if (!payload) {
    throw new Error(`Codex did not write a valid result payload: ${outputPath}`);
  }

  return payload;
}

async function ensureCleanWorktree(cwd) {
  const dirtyLines = await readGitStatus(cwd, [".omx", RUNTIME_DIR]);

  if (dirtyLines.length > 0) {
    throw new Error(`Worktree must be clean after Codex run.\n${dirtyLines.join("\n")}`);
  }
}

async function pushBranch(worktree, branch, dryRun) {
  const args = ["push", "--set-upstream", "origin", branch];
  const retryArgs = ["push", "origin", branch];

  if (dryRun) {
    return;
  }

  await ensurePhaseGitHubAccount(worktree);

  const firstAttempt = await runCapture("git", args, { cwd: worktree, allowFailure: true });

  if (firstAttempt.code === 0) {
    return;
  }

  await runCapture("git", retryArgs, { cwd: worktree });
}

async function resolvePullRequest(worktree, branch) {
  await ensurePhaseGitHubAccount(worktree);
  const result = await runCapture(
    "gh",
    ["pr", "view", branch, "--json", "number,url,state"],
    { cwd: worktree, allowFailure: true },
  );

  if (result.code !== 0 || !result.stdout.trim()) {
    return null;
  }

  return JSON.parse(result.stdout);
}

async function createPullRequest(worktree, branch, phaseResult, config, dryRun, artifactsDir) {
  const existing = await resolvePullRequest(worktree, branch);

  if (existing && existing.state === "OPEN") {
    return {
      number: existing.number,
      url: existing.url,
    };
  }

  if (existing && existing.state === "MERGED") {
    return {
      number: existing.number,
      url: existing.url,
    };
  }

  const bodyPath = path.join(artifactsDir, `pr-body-${timestamp()}.md`);
  const body = renderPrBody(config.phase, phaseResult);
  await writeText(bodyPath, `${body}\n`);

  if (dryRun) {
    return {
      number: 9999,
      url: `https://example.com/${branch}`,
    };
  }

  await ensurePhaseGitHubAccount(worktree);

  await runCapture(
    "gh",
    [
      "pr",
      "create",
      "--base",
      config.baseBranch,
      "--head",
      branch,
      "--title",
      phaseResult.pr_title,
      "--body-file",
      bodyPath,
    ],
    { cwd: worktree },
  );

  const created = await resolvePullRequest(worktree, branch);

  if (!created) {
    throw new Error(`Failed to resolve PR for branch ${branch}`);
  }

  return {
    number: created.number,
    url: created.url,
  };
}

async function postReview(repoRoot, prNumber, reviewBody, verdict, dryRun) {
  const bodyPath = path.join(repoRoot, RUNTIME_DIR, "tmp", `review-${prNumber}-${timestamp()}.md`);
  await writeText(bodyPath, `${reviewBody}\n`);

  if (dryRun) {
    return;
  }

  const reviewArgs = [String(prNumber), "--body-file", bodyPath];

  if (verdict === "approved") {
    reviewArgs.unshift("pr", "review");
    reviewArgs.push("--approve");
  } else {
    reviewArgs.unshift("pr", "review");
    reviewArgs.push("--request-changes");
  }

  await runCapture(path.join(repoRoot, "scripts", "gh-review"), reviewArgs, { cwd: repoRoot });
}

async function postPhaseComment(worktree, prNumber, body, dryRun) {
  const bodyPath = path.join(worktree, RUNTIME_DIR, "tmp", `phase-comment-${prNumber}-${timestamp()}.md`);
  await writeText(bodyPath, `${body}\n`);

  if (dryRun) {
    return;
  }

  await ensurePhaseGitHubAccount(worktree);

  await runCapture(
    "gh",
    ["pr", "comment", String(prNumber), "--body-file", bodyPath],
    { cwd: worktree },
  );
}

async function mergePullRequest(worktree, prNumber, headSha, pollMs, timeoutMs, dryRun) {
  if (dryRun) {
    return {
      state: "MERGED",
      mergedAt: new Date().toISOString(),
      mergeCommit: { oid: "dry-run" },
    };
  }

  await ensurePhaseGitHubAccount(worktree);

  await runCapture(
    "gh",
    [
      "pr",
      "merge",
      String(prNumber),
      "--auto",
      "--merge",
      "--delete-branch",
      "--match-head-commit",
      headSha,
    ],
    { cwd: worktree },
  );

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await runCapture(
      "gh",
      [
        "pr",
        "view",
        String(prNumber),
        "--json",
        "state,mergedAt,mergeCommit,mergeStateStatus,url",
      ],
      { cwd: worktree },
    );
    const payload = JSON.parse(result.stdout);

    if (payload.state === "MERGED" || payload.mergedAt) {
      return payload;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out while waiting for PR #${prNumber} to merge`);
}

async function collectHeadSha(cwd) {
  const result = await runCapture("git", ["rev-parse", "HEAD"], { cwd });
  return result.stdout.trim();
}

async function countCommitsAhead(cwd, baseBranch) {
  const result = await runCapture(
    "git",
    ["rev-list", "--count", `origin/${baseBranch}..HEAD`],
    { cwd },
  );

  return Number(result.stdout.trim());
}

async function runPhaseImplementation(repoRoot, harness, phase, phaseState) {
  const runId = timestamp();
  const artifactDir = path.join(phaseState.artifactsDir, `phase-${runId}`);
  const promptPath = path.join(artifactDir, "prompt.md");
  const outputPath = path.join(artifactDir, "result.json");
  const logPath = path.join(artifactDir, "session.log");
  const prompt = buildPhasePrompt(phase, phaseState);

  await writeText(promptPath, `${prompt}\n`);
  await ensureWorktreeDependencies(phaseState.phaseWorktree);

  const result = await runCodexTask({
    repoRoot,
    cwd: phaseState.phaseWorktree,
    prompt,
    schemaPath: harness.schemaPaths.phase,
    outputPath,
    logPath,
    model: harness.config.codex.model,
    extraArgs: harness.config.codex.execArgs,
    timeoutMs: harness.config.codex.timeoutMs,
  });

  await ensureCleanWorktree(phaseState.phaseWorktree);

  return result;
}

async function runReview(repoRoot, harness, phase, phaseState) {
  const runId = timestamp();
  const artifactDir = path.join(
    phaseState.artifactsDir,
    `review-cycle-${String(phaseState.reviewCycles).padStart(2, "0")}-${runId}`,
  );
  const promptPath = path.join(artifactDir, "prompt.md");
  const outputPath = path.join(artifactDir, "result.json");
  const logPath = path.join(artifactDir, "session.log");
  const prompt = buildReviewPrompt(phase, phaseState);

  await writeText(promptPath, `${prompt}\n`);
  await ensureWorktreeDependencies(phaseState.reviewWorktree);

  const result = await runCodexTask({
    repoRoot,
    cwd: phaseState.reviewWorktree,
    prompt,
    schemaPath: harness.schemaPaths.review,
    outputPath,
    logPath,
    model: harness.config.codex.model,
    extraArgs: harness.config.codex.execArgs,
    timeoutMs: harness.config.codex.timeoutMs,
  });

  await ensureCleanWorktree(phaseState.reviewWorktree);

  return result;
}

async function runReconcile(repoRoot, harness, phase, phaseState, reviewResult) {
  const runId = timestamp();
  const artifactDir = path.join(
    phaseState.artifactsDir,
    `reconcile-cycle-${String(phaseState.reviewCycles).padStart(2, "0")}-${runId}`,
  );
  const promptPath = path.join(artifactDir, "prompt.md");
  const outputPath = path.join(artifactDir, "result.json");
  const logPath = path.join(artifactDir, "session.log");
  const prompt = buildReconcilePrompt(phase, phaseState, reviewResult);

  await writeText(promptPath, `${prompt}\n`);
  await ensureWorktreeDependencies(phaseState.phaseWorktree);

  const result = await runCodexTask({
    repoRoot,
    cwd: phaseState.phaseWorktree,
    prompt,
    schemaPath: harness.schemaPaths.reconcile,
    outputPath,
    logPath,
    model: harness.config.codex.model,
    extraArgs: harness.config.codex.execArgs,
    timeoutMs: harness.config.codex.timeoutMs,
  });

  await ensureCleanWorktree(phaseState.phaseWorktree);

  return result;
}

async function cleanupAfterMerge(repoRoot, phaseState) {
  await removeWorktree(repoRoot, phaseState.reviewWorktree);
  await removeWorktree(repoRoot, phaseState.phaseWorktree);
  await deleteLocalBranch(repoRoot, phaseState.reviewBranch);
  await deleteLocalBranch(repoRoot, phaseState.branch);
}

async function executePhaseLifecycle(repoRoot, harness, state, phase, options) {
  const phaseId = phaseKey(phase.number);
  const phaseState = buildPhaseRuntimeState(
    repoRoot,
    harness.config,
    phase,
    state.phases[phaseId],
  );

  state.activePhase = phase.number;
  state.phases[phaseId] = phaseState;
  await saveState(harness.stateFile, state);

  if (phaseState.prNumber) {
    const existingPr = await runCapture(
      "gh",
      ["pr", "view", String(phaseState.prNumber), "--json", "state,mergedAt,url"],
      { cwd: repoRoot, allowFailure: true },
    );

    if (existingPr.code === 0) {
      const payload = JSON.parse(existingPr.stdout);

      if (payload.state === "MERGED" || payload.mergedAt) {
        phaseState.status = "completed";
        phaseState.prUrl = payload.url;
        await cleanupAfterMerge(repoRoot, phaseState);
        await saveState(harness.stateFile, state);
        return;
      }
    }
  }

  await ensureBaseFetched(repoRoot);
  await ensurePhaseWorktree(repoRoot, phaseState, harness.config, options.dryRun);

  if (!phaseState.prNumber) {
    console.log(`\n[Harness] Running phase ${phaseId}: ${phase.name}`);
    phaseState.status = "implementing";
    phaseState.updatedAt = new Date().toISOString();
    await saveState(harness.stateFile, state);

    const phaseResult = await runPhaseImplementation(repoRoot, harness, phase, phaseState);
    phaseState.phaseResult = phaseResult;
    phaseState.blocker = phaseResult.blocker;
    phaseState.updatedAt = new Date().toISOString();

    if (phaseResult.status !== "implemented") {
      phaseState.status = "failed";
      await saveState(harness.stateFile, state);
      throw new Error(`Phase ${phaseId} stopped: ${phaseResult.blocker ?? phaseResult.summary}`);
    }

    const commitsAhead = await countCommitsAhead(
      phaseState.phaseWorktree,
      harness.config.baseBranch,
    );

    if (commitsAhead < 1) {
      phaseState.status = "failed";
      phaseState.blocker = "Phase implementation finished without any commits ahead of main";
      await saveState(harness.stateFile, state);
      throw new Error(`Phase ${phaseId} did not produce a commit ahead of main`);
    }

    const headSha = await collectHeadSha(phaseState.phaseWorktree);
    phaseState.status = "pushing";
    await saveState(harness.stateFile, state);

    await pushBranch(phaseState.phaseWorktree, phaseState.branch, options.dryRun);

    const pr = await createPullRequest(
      phaseState.phaseWorktree,
      phaseState.branch,
      { ...phaseResult },
      { baseBranch: harness.config.baseBranch, phase },
      options.dryRun,
      phaseState.artifactsDir,
    );

    phaseState.prNumber = pr.number;
    phaseState.prUrl = pr.url;
    phaseState.latestHeadSha = headSha;
    phaseState.status = "reviewing";
    await saveState(harness.stateFile, state);
  }

  while (
    phaseState.status !== "approved" &&
    phaseState.reviewCycles < harness.config.maxReviewCycles
  ) {
    phaseState.reviewCycles += 1;
    phaseState.status = "reviewing";
    await saveState(harness.stateFile, state);

    console.log(
      `\n[Harness] Review cycle ${phaseState.reviewCycles} for phase ${phaseId} PR #${phaseState.prNumber}`,
    );

    await ensureReviewWorktree(repoRoot, phaseState, options.dryRun);

    const reviewResult = await runReview(repoRoot, harness, phase, phaseState);
    phaseState.reviewHistory.push(reviewResult);
    phaseState.blocker = reviewResult.blocker;
    await saveState(harness.stateFile, state);

    if (reviewResult.status !== "reviewed") {
      phaseState.status = "failed";
      await saveState(harness.stateFile, state);
      throw new Error(`Review for phase ${phaseId} stopped: ${reviewResult.blocker ?? reviewResult.summary}`);
    }

    const reviewBody = renderReviewBody(phase, phaseState, reviewResult);
    await postReview(repoRoot, phaseState.prNumber, reviewBody, reviewResult.verdict, options.dryRun);

    if (reviewResult.verdict === "approved") {
      phaseState.status = "approved";
      await saveState(harness.stateFile, state);
      break;
    }

    phaseState.status = "reconciling";
    await saveState(harness.stateFile, state);

    const reconcileResult = await runReconcile(
      repoRoot,
      harness,
      phase,
      phaseState,
      reviewResult,
    );
    phaseState.reconcileHistory.push(reconcileResult);
    phaseState.blocker = reconcileResult.blocker;
    await saveState(harness.stateFile, state);

    if (reconcileResult.status !== "resolved") {
      phaseState.status = "failed";
      await saveState(harness.stateFile, state);
      throw new Error(
        `Reconcile for phase ${phaseId} stopped: ${reconcileResult.blocker ?? reconcileResult.summary}`,
      );
    }

    const responseComment = renderReconcileComment(phase, phaseState, reconcileResult);
    await postPhaseComment(
      phaseState.phaseWorktree,
      phaseState.prNumber,
      responseComment,
      options.dryRun,
    );

    await pushBranch(phaseState.phaseWorktree, phaseState.branch, options.dryRun);
    phaseState.latestHeadSha = await collectHeadSha(phaseState.phaseWorktree);
    await saveState(harness.stateFile, state);
  }

  if (phaseState.status !== "approved") {
    phaseState.status = "failed";
    phaseState.blocker = `Reached max review cycles (${harness.config.maxReviewCycles}) without approval`;
    await saveState(harness.stateFile, state);
    throw new Error(`Phase ${phaseId} exceeded max review cycles`);
  }

  console.log(`\n[Harness] Merging phase ${phaseId} PR #${phaseState.prNumber}`);

  const mergePayload = await mergePullRequest(
    phaseState.phaseWorktree,
    phaseState.prNumber,
    phaseState.latestHeadSha ?? (await collectHeadSha(phaseState.phaseWorktree)),
    options.pollMs ?? harness.config.pollIntervalMs,
    harness.config.mergeTimeoutMs,
    options.dryRun,
  );

  phaseState.status = "completed";
  phaseState.mergeCommitSha = mergePayload?.mergeCommit?.oid ?? null;
  phaseState.blocker = null;
  phaseState.updatedAt = new Date().toISOString();
  await saveState(harness.stateFile, state);

  await cleanupAfterMerge(repoRoot, phaseState);
  await saveState(harness.stateFile, state);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = await resolveRepoRoot(process.cwd());
  const harness = await loadHarness(repoRoot);

  await preflight(repoRoot, harness.runtimeRoot);

  const phases = harness.config.phases.filter((phase) => {
    if (options.from !== null) {
      return phase.number >= options.from;
    }

    return true;
  });

  if (phases.length === 0) {
    throw new Error("No phases matched the requested range");
  }

  for (const phase of phases) {
    await executePhaseLifecycle(repoRoot, harness, harness.state, phase, options);

    if (options.once) {
      break;
    }
  }

  harness.state.activePhase = null;
  await saveState(harness.stateFile, harness.state);

  console.log("\n[Harness] Completed requested phase range.");
}

main().catch((error) => {
  console.error(`\n[Harness] Failed: ${error.message}`);
  process.exitCode = 1;
});
