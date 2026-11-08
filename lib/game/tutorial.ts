import type { Game } from './engine';

export const LESSONS = [
  'letter', 'dialogue', 'decision', 'ledger', 'news', 'broker', 'company',
  'business', 'revenue', 'cashflow', 'debt', 'amount', 'costs',
  'confirm', 'holding', 'quarter', 'done',
] as const;
export type Lesson = typeof LESSONS[number];
export const TRADE_LESSONS: readonly Lesson[] = ['business','revenue','cashflow','debt','amount','costs','confirm'];
export const LESSON_COPY: Record<Lesson, {title:string; text:string; action?:string}> = {
  letter:{title:'第一步，拆开柜台上的信',text:'发亮的圆圈就在牛皮纸信封上。点它，听听程姨想说什么。',action:'拆开这封信'},
  dialogue:{title:'点一下补全，再点一下继续',text:'字未出完时点一下，先显示全句；读完再点“继续”。也可以按空格。'},
  decision:{title:'选一条你愿意承担的生活',text:'先读费用与约定，再点击其中一个答复。作答后，继续看完它的后续。'},
  ledger:{title:'答复收好了，接着看钱',text:'下一步翻开账本，确认手头现金和未来付款。之后带你亲手完成第一笔买入。',action:'翻开账本'},
  news:{title:'先读消息，再看公司',text:'打开今日报纸，读完后点击“去证券营业室查看资料”。',action:'打开今日报纸'},
  broker:{title:'出门，去证券营业室',text:'老街上有证券营业室和银行。先点击“证券营业室”，再打开桌上的公司资料。',action:'走到老街'},
  company:{title:'打开资料，选一家公司',text:'点开营业室桌上的公司资料，再选“澄川能源”。接下来一起分析，再亲手买入。'},
  business:{title:'先弄清楚，它靠什么赚钱',text:'先读公司介绍。股价只是一份股份的报价，不能代替对生意的了解。',action:'读过了，看营业收入'},
  revenue:{title:'营收：卖出了多少产品与服务',text:'营收衡量生意规模，不等于利润，也不等于现金已经到账。',action:'下一步，看经营现金流'},
  cashflow:{title:'现金流：经营中留下了多少现金',text:'这是日常经营现金流入减去流出的净额。结合营收来看，别把销售额全当成可用的钱。',action:'下一步，看债务'},
  debt:{title:'债务：还需要承担多少偿付压力',text:'负债水平要结合现金流与经营投入一起看。不能只凭一个比例，认定一家公司值得买。',action:'了解了，试一次小额买入'},
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
export function lessonIndex(lesson:Lesson){return LESSONS.indexOf(lesson);}
export function nextLesson(lesson:Lesson):Lesson{return LESSONS[Math.min(LESSONS.length-1,lessonIndex(lesson)+1)];}
export function lessonGroup(lesson:Lesson){return lessonIndex(lesson)<=2?lessonIndex(lesson):lesson==='ledger'?3:lessonIndex(lesson)<=12?4:lesson==='holding'?5:6;}
