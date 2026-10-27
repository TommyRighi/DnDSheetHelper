import { execFileSync, spawn } from 'node:child_process';

// Local Supabase only. Never run these fixtures against a hosted project.
const config = JSON.parse(execFileSync('supabase', ['status', '--output', 'json', ...(process.env.FABLE_SUPABASE_WORKDIR ? ['--workdir', process.env.FABLE_SUPABASE_WORKDIR] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const url = new URL(config.API_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Cloud tests require local Supabase.');
const env = { ...process.env, VITE_SUPABASE_URL: config.API_URL, VITE_SUPABASE_PUBLISHABLE_KEY: config.PUBLISHABLE_KEY, FABLE_TEST_SUPABASE_URL: config.API_URL, FABLE_TEST_SUPABASE_KEY: config.PUBLISHABLE_KEY };
if (process.argv.includes('--production')) {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { env, stdio: 'inherit' });
  env.FABLE_TEST_PRODUCTION = '1';
}
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'test', 'tests/cloud.spec.js'], {
  stdio: 'inherit', env,
});
child.on('exit', code => process.exit(code ?? 1));
