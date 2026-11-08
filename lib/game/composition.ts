import type {CastId,FocusObject,SceneId} from './cinematic-content';
type Point=[number,number];
export type ActorSlot={x:number;y:number;height:number};
export type SceneLayout={actors:[ActorSlot,ActorSlot];surface?:{primary:Point;secondary:Point;width:number};painted:Partial<Record<FocusObject,Point>>;framing:'desk'|'center'};
const room=(primary:Point,secondary:Point,width=8,actors:[number,number,number,number,number,number]=[62,91,62,79,90,61],painted:SceneLayout['painted']={},framing:'desk'|'center'='center'):SceneLayout=>({actors:[{x:actors[0],y:actors[1],height:actors[2]},{x:actors[3],y:actors[4],height:actors[5]}],surface:{primary,secondary,width},painted,framing});
const outside=(actors:[number,number,number,number,number,number]=[64,91,61,80,89,59],painted:SceneLayout['painted']={}):SceneLayout=>({actors:[{x:actors[0],y:actors[1],height:actors[2]},{x:actors[3],y:actors[4],height:actors[5]}],painted,framing:'center'});
/** Coordinates measured in the original paintings: y is from TOP, actors stand at y.
 * No per-viewport positions: the same world/camera transform carries art and cast.
 * Outdoor paperwork uses an explicit close-reading insert, never a floor/table fiction.
 */
export const SCENE_LAYOUTS:Record<SceneId,SceneLayout>={
 'bookshop-night':room([20,75],[10,80],8,[62,91,62,78,89,60],{letter:[11.2,77.5],key:[19,75],lamp:[14,48],window:[79,30]},'desk'),
 'bookshop-day':room([20,75],[10,80],8,[62,91,62,78,89,60],{letter:[11,77.5],key:[19,75],lamp:[14,48],window:[79,30]},'desk'),
 'reading-room':room([28,74],[18,80],7,[62,91,62,79,89,60],{book:[12,72],cup:[25,67],lamp:[35,44],window:[79,28]},'desk'),
 attic:room([23,72],[12,80],8,[60,91,62,77,89,60],{book:[12,81],cup:[8,72],lamp:[10,54],window:[48,30]}),
 'bookshop-pledge':room([36,78],[60,82],9,[82,93,55,93,92,54],{contract:[36,78],key:[52,67],ledger:[27,58],lamp:[15,40],window:[79,29]},'desk'),
 'attic-kept-letter':room([43,73],[32,81],8,[80,93,55,92,92,54],{letter:[27,77],book:[34,72],cup:[20,79],lamp:[16,40],window:[50,27]},'desk'),
 'reading-gathering':room([40,78],[51,86],8,[80,93,55,92,92,54],{book:[25,79],cup:[57,78],lamp:[31,52],window:[81,30]},'center'),
 'proof-solitary':room([31,81],[18,86],8,[64,91,61,79,89,59],{book:[31,81],letter:[31,81],lamp:[14,55],cup:[47,71],window:[50,30]},'desk'),
 'noodle-shop':room([9,68],[22,70],5,[62,91,62,79,90,61],{cup:[14,63],lamp:[21,16],window:[67,31]}),
 coldstore:outside([65,90,58,80,89,57],{window:[56,47],lamp:[33,18]}),
 printshop:room([28,79],[17,84],8,[58,91,61,76,89,59],{book:[81,47],cup:[43,42],lamp:[12,17],window:[77,25]}),
 bank:room([22,58],[12,63],6,[62,89,58,80,88,57],{window:[84,29],lamp:[52,16]}),
 'tea-room':room([23,79],[10,76],8,[57,91,62,73,90,61],{letter:[21,78],cup:[18,69],lamp:[10,24],window:[49,34]}),
 'old-street':outside([63,91,61,80,89,59],{window:[18,43],lamp:[33,33]}),
 'coastal-train':room([25,66],[16,68],5,[77,94,62,86,86,50],{window:[16,31],lamp:[79,6]}),
 station:outside([48,91,62,62,89,60],{window:[11,41],lamp:[25,29]}),
 roof:outside([62,91,61,79,89,59],{window:[24,41]}),
 factory:room([21,74],[11,81],8,[59,92,63,76,90,61],{book:[18,75],lamp:[23,51],window:[80,29]}),
 pottery:room([22,76],[12,83],7,[60,91,62,77,89,60],{cup:[12,72],window:[87,27]}),
 archive:room([21,72],[11,79],8,[60,91,61,77,89,59],{ledger:[8,74],lamp:[14,47],window:[87,26]}),
 'quiet-room':room([24,69],[14,74],7,[60,91,61,77,89,59],{letter:[24,66],cup:[15,63],window:[84,20]}),
 brokerage:room([18,70],[10,75],7,[59,91,62,76,89,60],{letter:[17,65],lamp:[12,49],window:[80,30]}),
 'district-street':outside([56,91,61,73,90,60],{window:[83,39]}),
 'neighborhood-bank':room([8,61.5],[14,59],6,[71,87,56,82,89,58],{phone:[8,54],window:[18,23],lamp:[52,13]}),
 'securities-office':room([32,70.5],[19,72],7,[62,89,59,77,87,57],{phone:[11,64],book:[22,68],ledger:[22,68],cup:[32.5,63],window:[79,25]}),
 'winter-roster':room([17,78],[8,84],7,[60,92,63,77,90,61],{cup:[17,69],lamp:[13,52],window:[52,27]}),
 'seawall-evening':outside([63,91,61,80,89,59],{window:[18,34]}),
 'proof-night':room([21,77],[10,82],8,[60,92,63,77,90,61],{book:[18,77],lamp:[20,53],window:[81,30]}),
 'shared-keys':room([25,70],[13,77],7,[61,91,62,78,89,60],{cup:[21,63],book:[12,65],window:[81,30]}),
 'winter-cloakroom':room([20,82],[10,85],6,[61,91,62,77,89,60],{book:[12,77],lamp:[21,17],window:[80,28]}),
 'ferry-spring':outside([62,91,61,78,89,59],{window:[20,29]}),
 'repair-summer':room([27,78],[15,83],7,[62,91,62,79,89,60],{receipt:[32,71],window:[19,31]}),
 'osmanthus-yard':room([18,77],[8,83],7,[60,91,61,77,89,59],{cup:[15,70],window:[18,41]}),
 'proof-morning':room([27,77],[17,82],7,[62,91,62,79,89,60],{book:[26,75],cup:[36,70],window:[15,28]}),
 'post-winter':room([22,78],[10,84],7,[61,91,62,78,89,60],{book:[12,76],lamp:[16,14],window:[52,29]}),
 'noodle-blackout':room([22,64],[12,69],6,[61,91,61,77,89,59],{cup:[15,63],lamp:[25,47],window:[19,30]}),
 'debt-autumn':room([18,78],[9,82],7,[61,91,62,78,89,60],{contract:[18,78],cup:[25,67],window:[15,29]}),
};

export const ACTOR_FEET:Record<CastId,readonly Point[]>={
 cheng:[[270.6,1005],[258.2,1004],[243.9,1004]],tang:[[258.7,1007],[257,1005],[259.8,1007]],
 lu:[[290.8,1005],[258.3,1007],[231,1005]],he:[[269.3,1008],[249.1,1007],[246.9,1006]],
 zhou:[[273.7,992],[247.7,991],[233.8,992]],gu:[[270.2,992],[241.1,992],[242.2,992]],
 yao:[[276.5,1003],[259.7,1003],[247.6,1003]],xu:[[281.6,987],[253.8,987],[246.6,987]],
 cao:[[281.2,984],[253.1,985],[251,984]],ning:[[285.5,993],[252.4,993],[233.2,994]],
};
export function actorSpriteOffset(id:CastId,pose:number){const [x,y]=ACTOR_FEET[id][Math.max(0,Math.min(2,pose))];return{left:(256-x)/512*100,top:(1024-y)/1024*100};}
const MATERIAL_SIZES:Record<FocusObject,number>={key:2.8,letter:6.5,ledger:8,cup:3.2,receipt:4,book:7,window:0,phone:3.2,ticket:4.3,contract:8.5,lamp:5};
export function materialPlacement(scene:SceneId,focus:FocusObject,companion=false,offset=0){
 const layout=SCENE_LAYOUTS[scene],p=layout.surface;
 if(!p)return null;
 const point=companion?p.secondary:p.primary;
 return{x:point[0]+offset,y:point[1],width:MATERIAL_SIZES[focus]*p.width/8,flat:focus==='cup'||focus==='lamp'?1:.56};
}
export function sceneFocusPoint(scene:SceneId,focus:FocusObject):Point{
 return SCENE_LAYOUTS[scene].painted[focus]??(materialPlacement(scene,focus)?[materialPlacement(scene,focus)!.x,materialPlacement(scene,focus)!.y]:[50,48]);
}
export function materialIsPainted(scene:SceneId,focus:FocusObject){return !!SCENE_LAYOUTS[scene].painted[focus]||focus==='window'||focus==='lamp';}
