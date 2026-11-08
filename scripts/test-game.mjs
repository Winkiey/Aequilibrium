import ts from 'typescript';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const output = '.sites-runtime/test-modules';
mkdirSync(output, { recursive: true });
for (const file of ['engine', 'stories', 'cinematic-content', 'visuals', 'presentation', 'epilogues', 'dialogue', 'tutorial', 'people', 'places', 'reading', 'assets.generated', 'assets', 'collection']) {
  const source = readFileSync(`lib/game/${file}.ts`, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  writeFileSync(`${output}/${file}.mjs`, outputText.replace(/from '(.\/[^']+)'/g, "from '$1.mjs'"));
}
// Render the real collection markup without a browser. Scene players are not
// mounted here; their animation and click behavior still require browser QA.
const gallery=readFileSync('components/game/StoryboardGallery.tsx','utf8');
const compiled=ts.transpileModule(gallery,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
writeFileSync(`${output}/StoryboardGallery.mjs`,compiled.replace(/from '@\/lib\/game\/([^']+)'/g,"from './$1.mjs'").replace(/from '\.\/(?:CinematicPlayer|EndingPlayer|Stage)'/g,"from './collection-preview-stubs.mjs'"));
writeFileSync(`${output}/collection-preview-stubs.mjs`,'export const CinematicPlayer=()=>null; export const EndingPlayer=()=>null; export const Prop=()=>null;');
const result=spawnSync(process.execPath,['--test','tests/game.test.mjs','tests/visuals.test.mjs','tests/experience.test.mjs','tests/collection.test.mjs'],{stdio:'inherit'});
process.exit(result.status??1);
