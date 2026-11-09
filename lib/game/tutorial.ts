import type { Game } from './engine';

export const LESSONS = [
  'letter', 'dialogue', 'decision', 'aftermath', 'ledger', 'news', 'broker', 'company',
  'business', 'revenue', 'cashflow', 'debt', 'compare', 'scenario', 'amount', 'costs',
  'confirm', 'holding', 'quarter', 'done',
] as const;
export type Lesson = typeof LESSONS[number];
export const TRADE_LESSONS: readonly Lesson[] = ['business','revenue','cashflow','debt','compare','scenario','amount','costs','confirm'];
export const LESSON_COPY: Record<Lesson, {title:string; text:string; action?:string}> = {
  letter:{title:'第一步，拆开柜台上的信',text:'发亮的圆圈就在牛皮纸信封上。点它，听听程姨想说什么。',action:'拆开这封信'},
  dialogue:{title:'点一下补全，再点一下继续',text:'字未出完时点一下，先显示全句；读完再点“继续”。也可以按空格。'},
  decision:{title:'选一条你愿意承担的生活',text:'先读费用与约定，再点击其中一个答复。作答后，继续看完它的后续。'},
  aftermath:{title:'看看这封答复留下了什么',text:'选择已经记下。继续看完这一条后续，再回书屋核对现金。退出对话也能从这里接着读。',action:'接着看选择之后'},
  ledger:{title:'答复收好了，接着看钱',text:'下一步翻开账本，确认手头现金和未来付款。之后带你亲手完成第一笔买入。',action:'翻开账本'},
  news:{title:'先读消息，再看公司',text:'打开本季报纸，读完后点击“去证券营业室查看资料”。',action:'打开本季报纸'},
  broker:{title:'出门，去证券营业室',text:'老街上有证券营业室和银行。先点击“证券营业室”，再打开桌上的公司资料。',action:'走到老街'},
  company:{title:'选一家公司，一起读它的资料',text:'可以从标出的澄川能源开始，也可以换一家。标记只表示教学入口，不代表它会涨。',action:'打开公司资料'},
  business:{title:'先弄清楚，它靠什么赚钱',text:'先读公司介绍。股价只是一份股份的报价，不能代替对生意的了解。',action:'读过了，看营业收入'},
  revenue:{title:'营收：卖出了多少产品与服务',text:'营收衡量生意规模，不等于利润，也不等于现金已经到账。',action:'下一步，看经营现金流'},
  cashflow:{title:'现金流：经营中留下了多少现金',text:'这是日常经营现金流入减去流出的净额。结合营收来看，别把销售额全当成可用的钱。',action:'下一步，看债务'},
  debt:{title:'债务：还需要承担多少偿付压力',text:'负债水平要结合现金流与经营投入一起看。不能只凭一个比例，认定一家公司值得买。',action:'了解了，试一次小额买入'},
  compare:{title:'把判断说清楚，再和另一家公司比一比',text:'看生意怎样回款、承担什么债务，再写下继续关注的理由。单股报价低，不能说明便宜。',action:'带着这个判断，演算一次盈亏'},
  scenario:{title:'先试三种结果，再动用自己的钱',text:'点选价格不变、上涨、下跌，看看卖出净到账。你会发现：价格不动也有成本，涨过买价也未必已经赚钱。',action:'看懂了，选择实际投入金额'},
  amount:{title:'亲手选一个投入金额',text:'点击“3,000”练习小额买入。它是包含手续费的总预算；先给生活和已答应的付款留出现金。'},
  costs:{title:'下单前，把三项数字核对清楚',text:'手续费会减少实际买到的份额，成交冲击也有成本。再看看交易后现金，确认仍能应付生活。',action:'我已核对，准备确认'},
  confirm:{title:'现在，点击“确认买入”',text:'确认后才真正成交。练习使用本局资金，不保证盈利；随时可以跳过教学自行安排。'},
  holding:{title:'第一笔买入，已经记下',text:'账本里现在有了持仓，现金也已扣减。买入不会推进时间，价格要到结束本季才变化。',action:'看清了，回书屋结束本季'},
  quarter:{title:'最后一步，让这一季过去',text:'你已经完成答复、分析和第一笔买入。点击“结束这一季”，再确认一次，才会结算。',action:'查看季末安排'},
  done:{title:'可以按自己的节奏继续了',text:'之后可以比较其他公司、买卖或保留现金。报纸与账本随时可以重读。'},
};

/** Old saves keep their explicit skip/completion; closing a page never completes a lesson. */
export function initialLesson(game:Game,legacyStep:number):Lesson {
  if(game.quarter>1||game.finished||legacyStep===6)return 'done';
  if(game.mainChoice===null)return legacyStep===2?'decision':legacyStep===1?'dialogue':'letter';
  if(game.transactions.some(t=>t.side==='buy'))return 'holding';
  return legacyStep>=4?'news':'ledger';
}
export function validLesson(value:unknown):value is Lesson{return LESSONS.includes(value as Lesson);}
/** Facts correct stale steps, while an explicit decision to explore is kept. */
export function reconcileLesson(game:Game,stored:Lesson|undefined,legacyStep:number,reading?:{eventId:string;phase:string}|null):Lesson {
 if(game.finished||game.quarter>1||stored==='done'||(!stored&&legacyStep===6))return 'done';
 const current=stored??initialLesson(game,legacyStep);
 if(game.mainChoice===null)return ['letter','dialogue','decision'].includes(current)?current:'letter';
 if(reading?.eventId==='main-1'&&['letter','dialogue','decision','aftermath'].includes(current))return 'aftermath';
 const bought=game.transactions.some(t=>t.side==='buy'&&t.amount>0);
 if(bought)return current==='quarter'?'quarter':'holding';
 if(['letter','dialogue','decision','aftermath','holding','quarter'].includes(current))return 'ledger';
 return current;
}
export function lessonDestination(lesson:Lesson,place:string):'story'|'ledger'|'news'|'street'|'broker'|'market'|'trade'|'end'|null {
 if(['letter','dialogue','decision','aftermath'].includes(lesson))return 'story';
 if(lesson==='ledger'||lesson==='holding')return 'ledger';
 if(lesson==='news')return 'news';
 if(lesson==='broker')return place==='broker'?'market':place==='street'?'broker':'street';
 if(lesson==='company')return 'market';
 if(TRADE_LESSONS.includes(lesson))return 'trade';
 return lesson==='quarter'?'end':null;
}
export function lessonMilestone(lesson:Lesson){
 const index=lessonIndex(lesson);
 const boundaries=[lessonIndex('aftermath'),lessonIndex('ledger'),lessonIndex('company'),lessonIndex('debt'),lessonIndex('confirm'),lessonIndex('done')];
 const group=Math.max(0,boundaries.findIndex(end=>index<=end));
 return {index:group,total:6,label:['一封来信','手头的钱','走到营业室','读懂一家公司','核对并买入','找到你的持仓'][group]};
}
export function suggestedLessonAmount(game:Game){return Math.min(3000,Math.max(0,Math.floor(game.cash/100)*100));}
export function lessonIndex(lesson:Lesson){return LESSONS.indexOf(lesson);}
export function nextLesson(lesson:Lesson):Lesson{return LESSONS[Math.min(LESSONS.length-1,lessonIndex(lesson)+1)];}
export function lessonGroup(lesson:Lesson){return lessonIndex(lesson)<=2?lessonIndex(lesson):lesson==='ledger'?3:lessonIndex(lesson)<=12?4:lesson==='holding'?5:6;}
