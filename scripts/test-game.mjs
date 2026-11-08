import ts from 'typescript';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const output = '.sites-runtime/test-modules';
mkdirSync(output, { recursive: true });
for (const file of ['engine', 'stories', 'cinematic-content', 'visuals', 'presentation', 'epilogues', 'dialogue', 'tutorial', 'people', 'places', 'reading', 'assets.generated', 'assets', 'collection', 'expansion', 'expansion-visuals', 'seasons', 'film-scripts', 'films', 'video-assets.generated', 'staging']) {
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
// SSR contracts exercise real lesson and story components, without claiming
// that markup checks are browser clicks. Only the unrelated sparkline is stubbed.
for(const file of ['TradeLessonForm','LessonCoach','CinematicPlayer','Stage','SeasonalLayer','PaperViews']){
 const source=readFileSync(`components/game/${file}.tsx`,'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 writeFileSync(`${output}/${file}.mjs`,js.replace(/from '\.\/([^']+)'/g,"from './$1.mjs'").replace(/from '@\/lib\/game\/([^']+)'/g,"from './$1.mjs'"));
}
writeFileSync(`${output}/FinancialPanels.mjs`,'export const Sparkline=()=>null; export const News=()=>null;');
const report='.sites-runtime/test-results.log';
const result=spawnSync(process.execPath,['--test','--test-reporter=dot','--test-reporter-destination=stdout','--test-reporter=spec',`--test-reporter-destination=${report}`,'tests/game.test.mjs','tests/visuals.test.mjs','tests/experience.test.mjs','tests/collection.test.mjs','tests/expansion.test.mjs','tests/films.test.mjs','tests/onboarding.test.mjs','tests/staging.test.mjs'],{stdio:'inherit'});
const details=readFileSync(report,'utf8');console.log(details.split('\n').filter(line=>/^ℹ (tests|pass|fail|duration)/u.test(line)).join('\n'));
if(result.status!==0)console.error(details.slice(details.indexOf('✖ failing tests:')));
process.exit(result.status??1);
