/// <reference types="vite/client" />
import {createRoot} from 'react-dom/client';
import '../app/globals.css';
import '../app/cinematic.css';
import '../app/experience.css';
import '../app/film.css';
import '../app/onboarding.css';
import '../app/staging.css';
import '../app/library.css';
import '../app/composition.css';
import '../app/complete.css';
import '../app/mobile.css';
import '../app/folio.css';
import type {} from '../lib/game/public-path';

window.__AEQUILIBRIUM_ASSET_BASE__=import.meta.env.BASE_URL;
const testMode=window.location.pathname.replace(/\/$/,'').endsWith('/playtest');
void import('../components/game/CinematicGame').then(({default:Game})=>{
 const element=document.getElementById('root');
 if(!element)throw new Error('Missing game root');
 createRoot(element).render(<Game testMode={testMode}/>);
}).catch(()=>{
 const element=document.getElementById('root');
 if(element){element.textContent='页面暂时未能载入。请检查网络，然后刷新重试。';element.style.cssText='padding:20vh 10vw;font-family:serif;line-height:2';}
});
