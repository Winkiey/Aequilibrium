export type AudioPreferences={version:1;environment:number;music:number};
export type AudioPreferenceKey='aequilibrium.playtest.audio.v1'|'aequilibrium.audio.v1';
export const audioPreferenceKey=(testMode=false):AudioPreferenceKey=>testMode?'aequilibrium.playtest.audio.v1':'aequilibrium.audio.v1';
const validKey=(key:string)=>key===audioPreferenceKey()||key===audioPreferenceKey(true);
export const defaultAudioPreferences=():AudioPreferences=>({version:1,environment:35,music:42});
export function normalizeAudioPreferences(value:unknown):AudioPreferences{
 const defaults=defaultAudioPreferences();if(!value||typeof value!=='object'||Array.isArray(value)||!('version'in value)||value.version!==1)return defaults;
 const p=value as Partial<AudioPreferences>,valid=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=100;
 return{version:1,environment:valid(p.environment)?p.environment:defaults.environment,music:valid(p.music)?p.music:defaults.music};
}
export function loadAudioPreferences(storage:Pick<Storage,'getItem'>|null,key:AudioPreferenceKey){
 if(!validKey(key))return defaultAudioPreferences();
 try{return normalizeAudioPreferences(JSON.parse(storage?.getItem(key)??'null'));}catch{return defaultAudioPreferences();}
}
export function storeAudioPreferences(storage:Pick<Storage,'setItem'>|null,key:AudioPreferenceKey,p:AudioPreferences){
 if(!storage||!validKey(key))return false;try{storage.setItem(key,JSON.stringify(normalizeAudioPreferences(p)));return true;}catch{return false;}
}
export const readingAudioPanel=(panel:string|null)=>panel!==null&&['library','people','news','market','ledger','letters','trade','borrow','repay','research','shop','report','receipt','settlement','guide'].includes(panel);
