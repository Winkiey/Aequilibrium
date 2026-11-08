/** Pages supplies a project prefix; the existing Sites app keeps root paths. */
declare global {
 interface Window { __AEQUILIBRIUM_ASSET_BASE__?:string }
}
export function publicPath(path:string):string {
 if(!path.startsWith('/')||path.startsWith('//'))return path;
 const base=typeof window==='undefined'?'/':window.__AEQUILIBRIUM_ASSET_BASE__??'/';
 return base.replace(/\/$/,'')+path;
}
