import type { SceneId } from './cinematic-content';
export const SEASONS_VISUAL=[
 {id:'autumn',name:'秋',art:'/art/seasons/season-autumn.webp',line:'桂花落在纸边，风有了一点凉意。'},
 {id:'winter',name:'冬',art:'/art/seasons/season-winter.webp',line:'窗沿起雾，杯口还留着热气。'},
 {id:'spring',name:'春',art:'/art/seasons/season-spring.webp',line:'新枝抽芽，潮湿的光慢慢回来。'},
 {id:'summer',name:'夏',art:'/art/seasons/season-summer.webp',line:'树影渐浓，午后的风走得很慢。'},
] as const;
export const seasonForQuarter=(q:number)=>SEASONS_VISUAL[((Math.max(1,q)-1)%4+4)%4];
export type SeasonPlacement={outdoors:boolean;prop:[number,number,number];window:[number,number,number,number];night?:boolean};
const inside=(x=88,y=92,width=15,window:[number,number,number,number]=[62,6,35,56],night=false):SeasonPlacement=>({outdoors:false,prop:[x,y,width],window,night});
const outside=(x=9,y=96,width=13,night=false):SeasonPlacement=>({outdoors:true,prop:[x,y,width],window:[0,0,100,100],night});
// Positions are in painting coordinates so seasonal objects keep their place
// through the same cover/camera transforms as the authored scene.
export const SEASON_PLACEMENTS:Record<SceneId,SeasonPlacement>={
 'bookshop-roof-sound':inside(23.5,65,6.5,[59,6,39,55]),'bookshop-roof-patch':inside(23.5,65,6.5,[59,6,39,55]),'bookshop-quarter-counter':inside(23.5,65,6.5,[59,6,39,55]),
 'bookshop-pledge':inside(63,78,7,[61,3,37,48],true),'attic-kept-letter':inside(48,72,7,[40,3,19,40],true),
 'reading-gathering':inside(52,73,6,[63,2,35,50],true),'proof-solitary':inside(40,70,5,[39,7,20,39],true),
 'bookshop-night':inside(23.5,65,6.5,[59,6,39,55],true),'bookshop-day':inside(23.5,65,6.5,[59,6,39,55]),
 'reading-room':inside(39,54,4,[64,6,34,52]),'attic':inside(27,65,5.5,[39,12,19,36],true),
 'noodle-shop':inside(26,64,4,[39,12,55,39],true),'coldstore':outside(8,98,10),
 'printshop':inside(88,49,4.5,[56,1,42,43]),'bank':inside(32,53.5,4,[72,5,28,44]),'tea-room':inside(28,75,5,[33,15,32,33]),
 'old-street':outside(8,98,14,true),'coastal-train':inside(25,66,4,[4,7,40,52]),
 'station':outside(9,97,10),'roof':outside(9,98,13),'factory':inside(25,70,5,[65,6,33,51]),
 'pottery':inside(29,72,5,[80,4,18,45]),'archive':inside(28,65,5,[77,2,21,47]),'quiet-room':inside(31,66,4,[75,7,23,24]),
 'brokerage':inside(25,65,4,[65,6,33,51]),'district-street':outside(8,97,13),'neighborhood-bank':inside(8,61.5,5.5,[0,0,29,29]),
 'securities-office':inside(41.5,70,4.5,[64,4,34,49]),'winter-roster':inside(25,70,5,[40,3,25,39],true),
 'seawall-evening':outside(9,97,14),'proof-night':inside(28,72,5,[65,4,33,48],true),
 'shared-keys':inside(34,61,4,[65,7,32,55]),'winter-cloakroom':inside(24,76,4,[66,3,31,56]),
 'ferry-spring':outside(9,96,14),'repair-summer':inside(31,75,4,[0,12,30,49]),
 'osmanthus-yard':outside(90,97,15),'proof-morning':inside(38,75,4,[0,3,32,54]),
 'post-winter':inside(29,69,4,[24,3,42,48],true),'noodle-blackout':outside(9,97,14,true),
 'debt-autumn':inside(31,69,4,[0,0,29,57]),
};
export function seasonPropFrame(scene:SceneId,visible={left:0,right:100,top:0,bottom:100}){
 const [x,y,width]=SEASON_PLACEMENTS[scene].prop;
 // Cropping may hide a still life. It must never slide off its painted support.
 const shown=x-width/2>=visible.left&&x+width/2<=visible.right&&y<=visible.bottom&&y-width*1.8>=visible.top;
 return{x,y,width,shown};
}
