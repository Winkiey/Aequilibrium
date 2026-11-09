import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {resolve,sep} from 'node:path';

const project=fileURLToPath(new URL('.',import.meta.url));
const output=resolve(project,'dist-pages');
if(!output.startsWith(resolve(project)+sep))throw new Error('Pages output must stay inside the project');
const base=process.env.PAGES_BASE_PATH??'/Aequilibrium/';
if(!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base)||base.split('/').includes('..'))throw new Error('Invalid Pages base path');

export default defineConfig({
 root:resolve(project,'pages'),
 publicDir:resolve(project,'public'),
 base,
 resolve:{alias:{'@':project}},
 plugins:[{
  name:'pages-font-entry',enforce:'pre',
  transform(code,id){
   if(id.replaceAll('\\','/').endsWith('/app/globals.css')){
    // The static HTML links this public font CSS with the correct Pages prefix.
    return code.replace(/@import\s+url\(['"]\/fonts\/fonts\.css['"]\);?/,'');
   }
  },
 },react()],
 build:{outDir:output,emptyOutDir:true,sourcemap:false,rolldownOptions:{input:{
  game:resolve(project,'pages/index.html'),playtest:resolve(project,'pages/playtest/index.html'),updater:resolve(project,'pages/update/index.html'),
 }}},
});
