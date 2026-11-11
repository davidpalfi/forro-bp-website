// Used by the GitHub workflow: runs the normal build, and copies any [content-warning] lines
// into the run's summary page so a non-technical person can see them without reading logs.
// Exit code is the build's own, so a failed build still fails the run (and nothing is deployed).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const r = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: process.platform === 'win32' });
const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
process.stdout.write(out);

const warnings = out.split('\n').filter((l) => l.includes('[content-warning]'));
const summary = [
  r.status === 0 ? '## Build passed' : '## Build FAILED',
  '',
  warnings.length
    ? `${warnings.length} item(s) were skipped or fixed automatically. Check them:\n\n${warnings.map((w) => `- ${w.trim()}`).join('\n')}`
    : 'No content warnings.',
  '',
].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exit(r.status ?? 1);
