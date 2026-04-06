#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { phaseKey, readJson, resolveRepoRoot } from "./lib.mjs";

async function main() {
  const repoRoot = await resolveRepoRoot(process.cwd());
  const config = await readJson(path.join(repoRoot, "automation", "harness", "config.json"));
  const state =
    (await readJson(path.join(repoRoot, ".holrecow-harness", "state.json"), {
      phases: {},
      activePhase: null,
    })) ?? { phases: {}, activePhase: null };

  console.log(`Harness active phase: ${state.activePhase ?? "none"}`);
  console.log("");

  for (const phase of config.phases) {
    const key = phaseKey(phase.number);
    const phaseState = state.phases[key];

    console.log(
      `${key} ${phase.name} :: ${phaseState?.status ?? "pending"} :: PR ${
        phaseState?.prNumber ?? "-"
      } :: review cycles ${phaseState?.reviewCycles ?? 0}`,
    );

    if (phaseState?.blocker) {
      console.log(`  blocker: ${phaseState.blocker}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
