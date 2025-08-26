import { spawn } from 'child_process';

function runNodeScript(cmd: string, args: string[] = []): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

(async () => {
  console.log('Running frontmatter/publication validation...');
  const result = await runNodeScript('pnpm', ['run', 'validate:publication']);
  if (result.code !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(result.code);
  }
  console.log('Frontmatter/publication validation passed.');
})();
