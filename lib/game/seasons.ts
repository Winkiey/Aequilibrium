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
 'bookshop-pledge':inside(63,78,10,[61,3,37,48],true),'attic-kept-letter':inside(48,72,10,[40,3,19,40],true),
 'reading-gathering':inside(53,65,10,[63,2,35,50],true),'proof-solitary':inside(24,72,10,[39,7,20,39],true),
 'bookshop-night':inside(30,70,10,[59,6,39,55],true),'bookshop-day':inside(30,70,10),
 'reading-room':inside(29,67,11),'attic':inside(27,72,11,[59,6,38,54],true),
 'noodle-shop':inside(24,70,11,[61,5,38,62],true),'coldstore':inside(12,75,10,[4,8,29,55]),
 'printshop':inside(24,74,11),'bank':inside(20,70,11),'tea-room':inside(24,70,11),
 'old-street':outside(8,98,14,true),'coastal-train':inside(12,74,10,[45,8,53,52]),
 'station':inside(18,75,11,[55,4,43,64]),'roof':outside(9,98,13),'factory':inside(24,74,11),
 'pottery':inside(25,72,11),'archive':inside(22,73,11),'quiet-room':inside(23,73,10,[65,10,30,45]),
 'brokerage':inside(18,70,11),'district-street':outside(8,97,13),'neighborhood-bank':inside(18,64,11),
 'securities-office':inside(18,72,11),'winter-roster':inside(13,70,11,[55,5,43,56],true),
 'seawall-evening':outside(9,97,14),'proof-night':inside(15,73,11,[65,7,33,53],true),
 'shared-keys':inside(18,65,11),'winter-cloakroom':inside(15,78,11,[38,7,59,52]),
 'ferry-spring':outside(9,96,14),'repair-summer':inside(16,78,11,[55,3,42,62]),
 'osmanthus-yard':outside(90,97,15),'proof-morning':inside(15,75,11),
 'post-winter':inside(18,76,11,[61,7,36,58],true),'noodle-blackout':outside(9,97,14,true),
 'debt-autumn':inside(15,75,11),
};
export function seasonPropFrame(scene:SceneId,visible={left:0,right:100,top:0,bottom:100}){
 const [px,py,originalWidth]=SEASON_PLACEMENTS[scene].prop,width=Math.min(originalWidth,(visible.right-visible.left)*.24);
 return{x:Math.max(visible.left+width/2+5,Math.min(px,visible.right-width/2-5)),y:Math.min(py,visible.bottom-2),width};
}
