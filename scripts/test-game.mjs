import ts from 'typescript';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const output = '.sites-runtime/test-modules';
mkdirSync(output, { recursive: true });
for (const file of ['engine', 'stories', 'cinematic-content', 'visuals', 'presentation', 'epilogues', 'dialogue', 'tutorial', 'people', 'places', 'reading', 'assets.generated', 'assets']) {
  const source = readFileSync(`lib/game/${file}.ts`, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  writeFileSync(`${output}/${file}.mjs`, outputText.replace(/from '(.\/[^']+)'/g, "from '$1.mjs'"));
}
const result=spawnSync(process.execPath,['--test','tests/game.test.mjs','tests/visuals.test.mjs','tests/experience.test.mjs'],{stdio:'inherit'});
process.exit(result.status??1);
