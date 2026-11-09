import type { Game } from './engine';
import { initialLesson, validLesson, type Lesson } from './tutorial';
import type { CastId } from './cinematic-content';
export type Encounter={quarter:number;events:string[]};
export type ReadingProgress={eventId:string;phase:'story'|'choice'|'outcome';index:number;choice:0|1|null;inspected:boolean;outcomeRevision?:2};
export const PRESENTATION_KEY='aequilibrium.presentation.v2';
export type Presentation={version:2;storyRevision?:1|2;seed:number;introSeen:boolean;tutorial:number;speed:number;reducedMotion:boolean;reading:ReadingProgress|null;seenScenes:string[];place?:'hub'|'street'|'broker'|'bank';lesson?:Lesson;lessonAsset?:string;lessonAmount?:number;people?:Partial<Record<CastId,Encounter>>;readingPage?:number};
export function freshPresentation(game:Game):Presentation{const tutorial=game.quarter>1||game.finished?6:game.mainChoice!==null?3:0;return{version:2,storyRevision:2,seed:game.seed,introSeen:game.history.length>0,tutorial,lesson:initialLesson(game,tutorial),speed:30,reducedMotion:false,reading:null,seenScenes:[],people:{},readingPage:0,place:'hub'};}
export function restartPresentation(game:Game,previous:Presentation):Presentation{return{...freshPresentation(game),introSeen:false,speed:previous.speed,reducedMotion:previous.reducedMotion};}
export function validPresentation(value:unknown,game:Game):value is Presentation{
 if(!value||typeof value!=='object')return false;const p=value as Presentation;
 if(p.version!==2||p.seed!==game.seed||typeof p.introSeen!=='boolean'||!Number.isInteger(p.tutorial)||p.tutorial<0||p.tutorial>6||![15,30,50].includes(p.speed)||typeof p.reducedMotion!=='boolean'||!Array.isArray(p.seenScenes)||!p.seenScenes.every(s=>typeof s==='string'))return false;
 if(p.reading!==null&&(!p.reading||typeof p.reading!=='object'||!['story','choice','outcome'].includes(p.reading.phase)||!Number.isInteger(p.reading.index)||p.reading.index<0||typeof p.reading.eventId!=='string'||![null,0,1].includes(p.reading.choice)||typeof p.reading.inspected!=='boolean'))return false;
 if(p.reading?.outcomeRevision!==undefined&&p.reading.outcomeRevision!==2)return false;
 if(p.storyRevision!==undefined&&![1,2].includes(p.storyRevision))return false;
 if(p.place!==undefined&&!['hub','street','broker','bank'].includes(p.place))return false;
 if(p.lesson!==undefined&&!validLesson(p.lesson))return false;
 if(p.lessonAsset!==undefined&&!game.assets.some(a=>a.id===p.lessonAsset))return false;
 if(p.lessonAmount!==undefined&&(!Number.isFinite(p.lessonAmount)||p.lessonAmount<0||p.lessonAmount>1e9))return false;
 if(p.readingPage!==undefined&&(!Number.isInteger(p.readingPage)||p.readingPage<0||p.readingPage>1000))return false;
 if(p.people!==undefined&&(!p.people||typeof p.people!=='object'||!Object.values(p.people).every(e=>e&&Number.isInteger(e.quarter)&&e.quarter>=1&&e.quarter<=12&&Array.isArray(e.events)&&e.events.every(id=>typeof id==='string'))))return false;
 return true;
}
export const TUTORIAL_STEPS=[
 {title:'先看看柜台上的信',text:'程姨把信封留在灯旁。点击发亮的位置，拆开它。',target:'letter'},
 {title:'像对话一样，慢慢往下读',text:'点击画面或按空格继续。字还没显示完时，点一下会显示全句。',target:'dialogue'},
 {title:'这一次，由你来答复',text:'先看清两个选择旁的费用与约定。它们都会留下不同的回声。',target:'decision'},
 {title:'答复以后，翻开账本',text:'找到柜台上的账本，看看还剩多少现金、有哪些未来约定。',target:'ledger'},
 {title:'报纸里，也有街道的另一面',text:'打开本季报纸，再看看公司资料。可以买一小笔，也可以本季先不买。',target:'market'},
 {title:'准备好，就让这一季过去',text:'你已回复来信并看过账目。点击“结束这一季”，收支和市场才会推进。',target:'quarter'},
];
