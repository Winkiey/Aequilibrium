import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd();
await build({configFile:resolve(root,'vite.pages.config.ts')});
await mkdir(resolve(root,'dist-pages'),{recursive:true});
await writeFile(resolve(root,'dist-pages/.nojekyll'),'');
console.log('Static game ready: dist-pages/index.html and dist-pages/playtest/index.html');
