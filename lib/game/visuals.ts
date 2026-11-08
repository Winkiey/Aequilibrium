import type { Beat, CastId, SceneId, VisualScript } from './cinematic-content';
import { shortLines, responseDialogue } from './dialogue';
export { shortLines } from './dialogue';
import { STORYBOARDS } from './cinematic-content';
import type { Game, StoryEvent } from './engine';

export const CAST:Record<CastId,{name:string;role:string;accent:string;sprite:string}>={
 cheng:{name:'程姨',role:'泊灯书屋的旧主人',accent:'#b4beb0',sprite:'/art/characters/cheng.webp'},
 tang:{name:'阿棠',role:'旧店员 · 印坊学徒',accent:'#a4b8b9',sprite:'/art/characters/tang.webp'},
 lu:{name:'陆川',role:'港口的旧友',accent:'#a7b5c2',sprite:'/art/characters/lu.webp'},
 he:{name:'沈禾',role:'妹妹',accent:'#c7ac90',sprite:'/art/characters/he.webp'},
 zhou:{name:'周伯',role:'街坊',accent:'#b6b29b',sprite:'/art/characters/zhou.webp'},
 gu:{name:'小顾',role:'印刷厂同事',accent:'#acb8af',sprite:'/art/characters/gu.webp'},
 yao:{name:'姚宁',role:'银行柜员',accent:'#a5b4bf',sprite:'/art/characters/yao.webp'},
 xu:{name:'许闻',role:'账务中介',accent:'#b4a999',sprite:'/art/characters/xu.webp'},
 cao:{name:'曹师傅',role:'修屋顶的师傅',accent:'#b7aa8d',sprite:'/art/characters/cao.webp'},
 ning:{name:'顾宁',role:'往来的客户',accent:'#b9a2a4',sprite:'/art/characters/ning.webp'},
};
export const SCENES:Record<SceneId,{name:string;image:string;weather:'rain'|'dust'|'none';origin:[number,number]}>={
 'bookshop-night':{name:'泊灯书屋 · 雨夜',image:'/art/backgrounds/bookshop-night.webp',weather:'rain',origin:[58,49]},
 'bookshop-day':{name:'泊灯书屋 · 午后',image:'/art/backgrounds/bookshop-day.webp',weather:'dust',origin:[54,49]},
 'reading-room':{name:'书店后间 · 长桌',image:'/art/backgrounds/reading-room.webp',weather:'dust',origin:[55,48]},
 attic:{name:'楼上的阁楼',image:'/art/backgrounds/attic.webp',weather:'rain',origin:[50,49]},
 'noodle-shop':{name:'老街面馆',image:'/art/backgrounds/noodle-shop.webp',weather:'rain',origin:[55,51]},
 coldstore:{name:'新港区 · 冷库',image:'/art/backgrounds/coldstore.webp',weather:'none',origin:[55,49]},
 printshop:{name:'街尾印坊',image:'/art/backgrounds/printshop.webp',weather:'dust',origin:[54,50]},
 bank:{name:'沿海银行',image:'/art/backgrounds/bank.webp',weather:'none',origin:[55,49]},
 'tea-room':{name:'银行旁的茶室',image:'/art/backgrounds/tea-room.webp',weather:'dust',origin:[55,49]},
 'old-street':{name:'澄港 · 老街',image:'/art/backgrounds/old-street.webp',weather:'rain',origin:[54,49]},
 'coastal-train':{name:'沿海慢车',image:'/art/backgrounds/coastal-train.webp',weather:'none',origin:[55,50]},
 station:{name:'白沙车站',image:'/art/backgrounds/station.webp',weather:'dust',origin:[54,49]},
 roof:{name:'书店屋檐',image:'/art/backgrounds/roof.webp',weather:'none',origin:[54,50]},
 factory:{name:'印刷厂 · 校对间',image:'/art/backgrounds/factory.webp',weather:'dust',origin:[54,49]},
 pottery:{name:'南方的陶艺间',image:'/art/backgrounds/pottery.webp',weather:'dust',origin:[55,49]},
 archive:{name:'旧档案室',image:'/art/backgrounds/archive.webp',weather:'dust',origin:[55,49]},
 'quiet-room':{name:'固定的房间',image:'/art/backgrounds/quiet-room.webp',weather:'none',origin:[55,49]},
 brokerage:{name:'老街证券营业室',image:'/art/backgrounds/brokerage.webp',weather:'rain',origin:[55,49]},
 'district-street':{name:'老街 · 银行街口',image:'/art/backgrounds/district-street.webp',weather:'none',origin:[50,48]},
 'neighborhood-bank':{name:'沿海银行 · 柜台',image:'/art/backgrounds/neighborhood-bank.webp',weather:'none',origin:[50,50]},
 'securities-office':{name:'老街证券营业室',image:'/art/backgrounds/securities-office.webp',weather:'dust',origin:[50,50]},
};
export type Focus=NonNullable<Beat['focus']>;
export const OBJECTS:Record<Focus,{name:string;cell:number;point:[number,number]}>= {
 key:{name:'黄铜钥匙',cell:0,point:[20,76]},letter:{name:'信封',cell:1,point:[14,76]},ledger:{name:'旧账本',cell:2,point:[26,73]},cup:{name:'陶杯',cell:3,point:[16,62]},receipt:{name:'收据',cell:4,point:[28,71]},book:{name:'旧书',cell:5,point:[22,52]},window:{name:'窗外',cell:6,point:[83,33]},phone:{name:'电话',cell:7,point:[29,69]},ticket:{name:'车票',cell:8,point:[25,72]},contract:{name:'合同',cell:9,point:[23,74]},lamp:{name:'灯',cell:10,point:[13,56]},
};
export const INTRO_CAPTIONS=[
 {start:0,end:5,text:'澄港。一个靠海生活的普通地方。'},
 {start:5,end:10,text:'你在印刷厂校对书稿，攒下了十二万元。'},
 {start:10,end:15,text:'这些年，日子过得很像。'},
 {start:15,end:21,text:'直到那个雨夜，程姨留下了一封信。'},
 {start:21,end:27,text:'还有一把钥匙，和三年尚未决定的生活。'},
 {start:27,end:33,text:'今晚，你又下了一层楼。'},
];
export function getScript(event:StoryEvent):VisualScript {
 const script=STORYBOARDS[event.id];if(!script)throw new Error(`缺少分镜：${event.id}`);return script;
}
export function outcomeBeats(event:StoryEvent,script:VisualScript,index:0|1):Beat[]{
 // The engine's authoritative response carries dynamic financial/story facts.
 return [...script.outcomes[index],...responseDialogue(event.options[index].response,event.sender,script.cast).map(beat=>({...beat,camera:'medium' as const,focus:script.outcomeFocus[index],emotion:index===0?'warm' as const:'quiet' as const}))];
}
export function hubScene(s:Game):SceneId {return s.quarter===1?'bookshop-night':(s.quarter-1)%4===1?'bookshop-night':(s.quarter-1)%4===2?'bookshop-day':'reading-room';}
export const OUTCOME_SCENES:Record<string,[SceneId,SceneId]>={
 'main-1':['bookshop-night','bookshop-night'],'main-2':['reading-room','attic'],'main-3':['printshop','archive'],'main-4':['coldstore','attic'],
 'main-5':['roof','roof'],'main-6':['bookshop-day','pottery'],'main-7':['printshop','old-street'],'main-8':['coastal-train','attic'],
 'main-9':['archive','attic'],'main-10':['tea-room','bank'],'main-11':['reading-room','bookshop-day'],'main-12':['reading-room','bookshop-night'],
 s01:['attic','attic'],s02:['coastal-train','factory'],s03:['attic','attic'],s04:['old-street','attic'],s05:['attic','factory'],s06:['noodle-shop','noodle-shop'],
 s07:['reading-room','bookshop-day'],s08:['old-street','old-street'],s09:['bookshop-day','bookshop-day'],s10:['old-street','old-street'],s11:['bookshop-night','bookshop-night'],s12:['bookshop-day','bookshop-day'],
 s13:['noodle-shop','bookshop-night'],s14:['factory','factory'],s15:['attic','attic'],s16:['factory','factory'],s17:['bank','attic'],s18:['attic','bookshop-night'],
 s19:['coldstore','coldstore'],s20:['attic','attic'],s21:['old-street','old-street'],s22:['bank','attic'],s23:['archive','attic'],s24:['bank','old-street'],
 s25:['attic','attic'],s26:['attic','attic'],s27:['attic','attic'],s28:['old-street','old-street'],s29:['tea-room','attic'],s30:['archive','attic'],
 s31:['bank','attic'],s32:['old-street','old-street'],s33:['attic','attic'],s34:['bookshop-day','bookshop-day'],s35:['coldstore','old-street'],s36:['attic','attic'],
 s37:['factory','factory'],s38:['bank','bank'],s39:['archive','archive'],s40:['bank','archive'],s41:['archive','bank'],s42:['factory','bank'],
 s43:['old-street','bookshop-day'],s44:['reading-room','bookshop-day'],s45:['attic','attic'],s46:['attic','factory'],s47:['pottery','pottery'],s48:['noodle-shop','old-street'],
 s49:['roof','bookshop-day'],s50:['bank','attic'],s51:['archive','attic'],s52:['old-street','reading-room'],
};
export function outcomeScene(id:string,index:0|1,base:SceneId):SceneId{return OUTCOME_SCENES[id]?.[index]??base;}
export function visualSeed(id:string){return Array.from(id).reduce((n,c)=>n+c.codePointAt(0)!,0);}
export const requiredVisuals=()=>({events:Object.keys(STORYBOARDS).length,outcomes:Object.values(STORYBOARDS).reduce((n,s)=>n+s.outcomes.length,0),characters:Object.keys(CAST),locations:Object.keys(SCENES)});
