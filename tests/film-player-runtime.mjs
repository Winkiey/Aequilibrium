// Minimal event-handler harness, not a DOM, browser or audio device emulator.
let cells=[],cursor=0,effects=[];
export function reset(){cells=[];beginRender();}
export function beginRender(){cursor=0;effects=[];}
export function useRef(value){const i=cursor++;return cells[i]??(cells[i]={current:value});}
export function useState(value){const i=cursor++;if(!(i in cells))cells[i]=value;return[cells[i],v=>{cells[i]=typeof v==='function'?v(cells[i]):v;}];}
export function useMemo(make){return make();}
export function useEffect(effect){effects.push(effect);}
export function runEffects(){return effects.map(fn=>fn()).filter(fn=>typeof fn==='function');}
export const jsx=(type,props)=>({type,props}),jsxs=jsx;
export const Fragment='fragment';
export function find(root,predicate){if(!root||typeof root!=='object')return; if(predicate(root))return root;for(const child of [root.props?.children].flat(Infinity)){const found=find(child,predicate);if(found)return found;}}
