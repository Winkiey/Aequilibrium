// Original miniature scores; order follows the story: autumn first.
export type AudioScene={season:number;rain:boolean;outdoors:boolean;night:boolean};
export type Score={name:string;pace:number;chords:number[][];melody:(number|null)[];air:number;birds:number;insects:number};
export const SEASON_SCORES:readonly Score[]=[
 {name:'秋 · 纸窗',pace:3.2,chords:[[64,67,74],[64,69,72],[65,69,72],[67,71,74]],melody:[76,null,74,71,69,null,67,null,72,71,null,67,69,null,64,null],air:.022,birds:0,insects:0},
 {name:'冬 · 炉边',pace:4,chords:[[65,69,74],[67,71,74],[65,70,74],[64,69,72]],melody:[72,null,null,69,67,null,65,null,74,null,null,69,67,null,null,null],air:.016,birds:0,insects:0},
 {name:'春 · 新枝',pace:2.8,chords:[[64,67,72],[65,69,72],[65,69,74],[67,71,74]],melody:[72,76,null,79,76,null,74,null,69,72,null,76,74,null,72,null],air:.018,birds:.025,insects:0},
 {name:'夏 · 树影',pace:3.6,chords:[[67,71,74],[64,67,72],[64,69,72],[65,69,72]],melody:[71,null,74,null,76,74,null,69,67,null,69,null,64,null,67,null],air:.014,birds:0,insects:.008},
];
export const seasonIndex=(index:number)=>Number.isFinite(index)?((Math.trunc(index)%4)+4)%4:0;
export const noteHz=(midi:number)=>440*2**((midi-69)/12);
export function ambienceFor(scene:AudioScene){
 const score=SEASON_SCORES[seasonIndex(scene.season)],distance=scene.outdoors?1:.38;
 return {air:score.air*distance,rain:scene.rain?(scene.outdoors?.085:.038):0,birds:score.birds*distance*(scene.night?0:1),insects:score.insects*distance*(scene.night?1:.35)};
}
