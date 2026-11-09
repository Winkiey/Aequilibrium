import type {Beat} from './cinematic-content';
import {openMarketQuarter,settleCompany,validMarket,type CompanyBusiness,type MarketState} from './market';
export const INITIAL_CASH = 120000;
export const SAVE_KEY = 'aequilibrium.save.v1';
export type Person = 'cheng' | 'tang' | 'lu' | 'he';
export type Disclosure={quarter:number;price:number;revenue:number;cashflow:number;debtRatio:number};
export type Asset = { business?:CompanyBusiness; disclosures?:Disclosure[]; id: string; name: string; industry: string; code: string; description: string; price: number; initial: number; units: number; basis: number; history: number[]; revenue: number; cashflow: number; debtRatio: number; fundamental: number; trueRevenue: number; trueCashflow: number };
export type CashEntry = { quarter: number; amount: number; label: string; category: string };
export type PromiseEntry = { id: string; label: string; due: number; amount: number; status: 'pending' | 'paid' | 'missed' | 'cancelled'; kind: 'payment' | 'receipt'; person?: Person; chance?: number; principal?: number };
export type Transaction = { quarter: number; asset: string; side: 'buy' | 'sell'; amount: number; fee: number; slippage: number; units: number; realized?: number };
export type ChoiceLog = { quarter: number; title: string; choice: string; response: string; principle: string; cash: number; eventId?:string; optionIndex?:0|1; snapshot?:StoryEvent };
export type QuarterLog = { quarter: number; wealth: number; cash: number; investment: number; text: string };
export type Game = { market?:MarketState; version: 1; seed: number; quarter: number; finished: boolean; cash: number; assets: Asset[]; stress: number; confidence: number; fatigue: number; relations: Record<Person, number>; flags: Record<string, number>; promises: PromiseEntry[]; journal: CashEntry[]; transactions: Transaction[]; history: ChoiceLog[]; quarters: QuarterLog[]; used: string[]; mainChoice: number | null; sideId: string | null; sideChoice: number | null; mainSnapshot?: StoryEvent; sideSnapshot?: StoryEvent; chapterSnapshot?:StoryEvent; notices: string[]; regime: number; debt: { principal: number; due: number; rate: number }[]; investmentBuys: number; investmentSells: number; dividends: number; peakProfit: number; drawdown: number; investigation: number };
export type Effects = { cash?: number; stress?: number; confidence?: number; fatigue?: number; relations?: Partial<Record<Person, number>>; flags?: Record<string, number>; promises?: Omit<PromiseEntry, 'id' | 'status'>[]; buy?: { asset: string; budget: number }; sell?: { asset: string; value: number }; closeClaim?: string; extendClaim?: string; cancelPayment?: string; fraud?: number };
export type Option = { label: string; detail: string; response: string; effects: Effects };
export type StoryEvent = { id: string; title: string; sender: string; location: string; category: string; paragraphs: string[]; opening?:Beat[]; options: [Option, Option]; principle: string; atQuarter?:number; when?: (s: Game) => boolean; weight?: (s: Game) => number };
export type StoryKind='main'|'side'|'chapter';
export const CHAPTER_QUARTERS:Record<number,string>={2:'chapter-2',4:'chapter-4',7:'chapter-7',10:'chapter-10'};
export const isMainStory=(id:string)=>id.startsWith('main-')||id.startsWith('chapter-');
export const storyKind=(id:string):StoryKind=>id.startsWith('chapter-')?'chapter':id.startsWith('main-')?'main':'side';
export const ENDING_ALIASES:Record<string,string>={'执念入狱':'铁窗四季','重新开始':'余烬重燃','传奇操盘手':'知止乘潮','守住一盏灯':'泊灯长明','另一种富有':'长桌人间','平淡一生':'寻常岁月'};
export const normalizeEndingName=(name:string)=>Object.prototype.hasOwnProperty.call(ENDING_ALIASES,name)?ENDING_ALIASES[name]:name;
export const pendingChapter=(s:Game)=>!s.finished&&!!CHAPTER_QUARTERS[s.quarter]&&!s.used.includes(CHAPTER_QUARTERS[s.quarter]);

const COMPANIES = [
  ['harbor', '雾港冷链', '港务 · 物流', 'CG.016', '新港区的冷库正在扩建。生鲜订单增加，客户的账期也在拉长。', 24.8, 3860, 342, 46],
  ['power', '澄川能源', '公用 · 能源', 'CG.028', '城里大多数灯都由它点亮。收入稳定，设备改造需要持续投入。', 16.35, 6240, 820, 38],
  ['retail', '街角百货', '消费 · 零售', 'CG.032', '从一间杂货铺做到十二家门店。老板仍然每天去市场看菜价。', 12.6, 2150, 180, 31],
  ['medical', '白鹭医疗', '制造 · 医疗', 'CG.051', '为社区诊所生产器材。新产品刚通过验收，医院付款仍需要时间。', 38.2, 1480, 98, 42],
  ['signal', '远汐通信', '科技 · 通信', 'CG.067', '承包沿海城市的数据网络。未来写在合同里，成本已经发生。', 45.7, 2780, 112, 56],
  ['urban', '旧城实业', '建设 · 更新', 'CG.083', '旧街改造的主要承建商。土地与厂房很多，能动用的现金很少。', 8.9, 4510, 86, 68],
] as const;
export const REGIMES = ['缓慢复苏', '温和扩张', '热望涌动', '信用收紧'];
export const SEASONS = ['秋', '冬', '春', '夏'];
export const PERSON_NAMES: Record<Person, string> = { cheng: '程姨', tang: '阿棠', lu: '陆川', he: '沈禾' };
export const money = (n: number) => {const rounded=Math.round(n);return (rounded===0?0:rounded).toLocaleString('zh-CN');};
export const quarterName = (q: number) => `第${['一','二','三'][Math.floor((q - 1) / 4)] ?? '三'}年 · ${SEASONS[(q - 1) % 4]}`;
export const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));
export const round = (n: number) => Math.round(n * 100) / 100;
export function random(seed: number, quarter: number, channel: string): number {
  let h = (seed ^ Math.imul(quarter + 1, 0x9e3779b9)) >>> 0;
  for (let i = 0; i < channel.length; i++) { h = Math.imul(h ^ channel.charCodeAt(i), 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function createGame(seed = Math.floor(Math.random() * 2147483647)): Game {
  const game:Game = { version: 1, seed, quarter: 1, finished: false, cash: INITIAL_CASH,
    assets: COMPANIES.map(([id, name, industry, code, description, price, revenue, cashflow, debtRatio]) => ({ id, name, industry, code, description, price, initial: price, units: 0, basis: 0, history: Array.from({length: 12}, (_, i) => round(price * (0.92 + i * 0.006 + (random(seed, i, id) - 0.5) * 0.07))).concat(price), revenue, cashflow, debtRatio, disclosures:[{quarter:0,price,revenue,cashflow,debtRatio}],fundamental: price, trueRevenue: revenue, trueCashflow: cashflow })),
    stress: 24, confidence: 40, fatigue: 12, relations: { cheng: 65, tang: 50, lu: 58, he: 70 }, flags: {}, promises: [], journal: [{quarter: 1, amount: INITIAL_CASH, label: '六年积蓄', category: 'initial'}], transactions: [], history: [], quarters: [], used: [], mainChoice: null, sideId: null, sideChoice: null, notices: [], regime: 0, debt: [], investmentBuys: 0, investmentSells: 0, dividends: 0, peakProfit: 0, drawdown: 0, investigation: 0 };
  openMarketQuarter(game,random);return game;
}
export const positionValue = (a: Asset) => a.units * a.price;
export const debtTotal = (s: Game) => s.debt.reduce((t, d) => t + d.principal, 0);
export const investments = (s: Game) => s.assets.reduce((t, a) => t + positionValue(a), 0);
export const investmentProfit = (s: Game) => investments(s) + s.investmentSells + s.dividends - s.investmentBuys;
export const claimsValue = (s: Game) => s.promises.filter(p => p.kind === 'receipt' && p.status === 'pending').reduce((t, p) => t + (p.principal ?? p.amount) * (p.chance ?? 0.7), 0);
export const netWealth = (s: Game) => s.cash + investments(s) + claimsValue(s) - debtTotal(s);
export function wealthWord(s: Game) { const n = netWealth(s); return n > 180000 ? '颇有余裕' : n > 125000 ? '渐有起色' : n > 95000 ? '尚有余裕' : n > 60000 ? '正在收紧' : n > 25000 ? '捉襟见肘' : '所剩无几'; }
function cash(s: Game, amount: number, label: string, category: string) {
  const value = round(amount); s.cash = round(s.cash + value); s.journal.push({ quarter: s.quarter, amount: value, label, category });
}
function clone(s: Game): Game { return structuredClone(s); }
export function quoteTrade(s: Game, id: string, side: 'buy' | 'sell', amount: number) {
  const a = s.assets.find(a => a.id === id);
  if (!a || !Number.isFinite(amount) || amount <= 0) throw new Error('请填写有效金额。');
  if (s.finished) throw new Error('这一段故事已经结束。');
  if (s.transactions.filter(t => t.quarter === s.quarter && t.amount > 0).length >= 3) throw new Error('本季的三次主动调整已经用完。');
  const slip = 0.001 + Math.min(0.025, Math.pow(amount / 250000, 0.8) * 0.008) + (s.regime === 3 ? 0.009 : 0);
  const execution = a.price * (side === 'buy' ? 1 + slip : 1 - slip);
  const nominal = side === 'buy' ? amount / 1.002 : Math.min(amount, positionValue(a));
  const units = side === 'buy' ? nominal / execution : nominal / a.price;
  const gross = units * execution;
  const fee = round(gross * 0.002);
  const total = side === 'buy' ? round(gross + fee) : round(gross - fee);
  if (side === 'buy' && total > s.cash + 0.001) throw new Error('手头现金不足，请减少金额。');
  if (side === 'sell' && units <= 0.0000001) throw new Error('你还没有持有这家公司的股份。');
  return { units, fee, total, execution, slip, impact: round(Math.abs(execution - a.price) * units) };
}
function executeTrade(s: Game, id: string, side: 'buy' | 'sell', amount: number) {
  const q = quoteTrade(s, id, side, amount); const a = s.assets.find(a => a.id === id)!;
  let realized: number | undefined;
  if (side === 'buy') { a.units += q.units; a.basis += q.total; cash(s, -q.total, `买入 ${a.name}`, 'trade'); s.investmentBuys += q.total; }
  else { const basis = a.basis * Math.min(1, q.units / a.units); realized = round(q.total - basis); a.basis -= basis; a.units = Math.max(0, a.units - q.units); if(a.units < 1e-8) {a.units = 0; a.basis = 0;} cash(s, q.total, `卖出 ${a.name}`, 'trade'); s.investmentSells += q.total; }
  s.transactions.push({ quarter: s.quarter, asset: id, side, amount: q.total, fee: q.fee, slippage: q.impact, units: q.units, realized });
  s.stress = clamp(s.stress + 2); return s;
}
export function trade(state: Game, id: string, side: 'buy' | 'sell', amount: number): Game { return executeTrade(clone(state), id, side, amount); }
export function optionError(s: Game, option: Option): string | null {
  if(s.finished) return '这一段故事已经结束。';
  const e = option.effects;
  try { if(e.buy) quoteTrade(s, e.buy.asset, 'buy', e.buy.budget); if(e.sell) quoteTrade(s, e.sell.asset, 'sell', e.sell.value); } catch(err) { return (err as Error).message; }
  const extra = (e.cash ?? 0) - (e.buy?.budget ?? 0);
  if (extra < 0 && s.cash + extra < -0.001) return `还需要 ¥${money(-extra - s.cash)} 现金。可先回书屋，再去证券营业室卖出持仓，或到银行核对借款安排。`;
  return null;
}
export function choose(state: Game, event: StoryEvent, index: number, kind: StoryKind): Game {
  if(index !== 0 && index !== 1) throw new Error('没有这个选项。');
  if((kind === 'main' && state.mainChoice !== null) || (kind === 'side' && state.sideChoice !== null) || state.used.includes(event.id)) throw new Error('这封信已经回复过了。');
  if(kind==='chapter'&&(state.mainChoice===null||CHAPTER_QUARTERS[state.quarter]!==event.id))throw new Error('请先读完本季来信，再继续这一段故事。');
  const option = event.options[index]; const problem = optionError(state, option); if(problem) throw new Error(problem);
  const s = clone(state), e = option.effects;
  if(e.buy) executeTrade(s, e.buy.asset, 'buy', e.buy.budget);
  if(e.sell) executeTrade(s, e.sell.asset, 'sell', e.sell.value);
  if(e.cash) cash(s, e.cash, event.title, 'event');
  s.stress = clamp(s.stress + (e.stress ?? 0)); s.confidence = clamp(s.confidence + (e.confidence ?? 0)); s.fatigue = clamp(s.fatigue + (e.fatigue ?? 0));
  for(const [key,value] of Object.entries(e.relations ?? {})) s.relations[key as Person] = clamp(s.relations[key as Person] + value);
  for(const [key,value] of Object.entries(e.flags ?? {})) s.flags[key] = (s.flags[key] ?? 0) + value;
  if(e.closeClaim) s.promises.filter(p => p.id.includes(e.closeClaim!) && p.kind === 'receipt' && p.status === 'pending').forEach(p => p.status = 'cancelled');
  if(e.extendClaim) s.promises.filter(p => p.id.includes(e.extendClaim!) && p.kind === 'receipt' && p.status === 'pending').forEach(p => p.status = 'cancelled');
  if(e.cancelPayment) s.promises.filter(p => p.id.includes(e.cancelPayment!) && p.kind === 'payment' && p.status === 'pending').forEach(p => p.status = 'cancelled');
  for(const [i,p] of (e.promises ?? []).entries()) s.promises.push({...p, id: `${event.id}-${i}`, status:'pending'});
  if(e.fraud) s.flags.fraud = (s.flags.fraud ?? 0) + e.fraud;
  s.used.push(event.id); s.history.push({quarter: s.quarter, title: event.title, choice: option.label, response: option.response, principle:event.principle, cash:e.cash ?? 0,eventId:event.id,optionIndex:index as 0|1,snapshot:structuredClone({...event,when:undefined,weight:undefined})});
  if(kind === 'main') s.mainChoice = index; else if(kind==='side') s.sideChoice = index;
  return s;
}
export function borrow(state: Game): Game {
  if(state.finished || state.quarter > 8 || state.debt.length >= 2) throw new Error('目前无法签订这笔借款。');
  const s = clone(state); s.debt.push({principal:20000, due:s.quarter + 3, rate:0.02}); cash(s,20000,'四季定额借款','loan'); s.stress=clamp(s.stress+9); return s;
}
export function repay(state: Game): Game {
  if(state.finished || !state.debt.length) throw new Error('目前没有需要偿还的借款。');
  const s = clone(state); const amount=Math.min(s.cash, debtTotal(s)); if(amount<=0) throw new Error('目前没有可用现金。');
  let left=amount; for(const d of s.debt) {const paid=Math.min(left,d.principal); d.principal=round(d.principal-paid); left=round(left-paid);}
  s.debt=s.debt.filter(d=>d.principal>0); cash(s,-amount,'提前偿还本金','loan'); return s;
}
function liquidateFor(s: Game, required: number) {
  for(const a of [...s.assets].sort((a,b)=>positionValue(b)-positionValue(a))) {
    if(s.cash>=required || a.units<=0) continue;
    const units=Math.min(a.units,(required-s.cash+0.01)/(a.price*0.975*0.998)); const gross=units*a.price*0.975; const fee=round(gross*0.002); const received=round(gross-fee); const basis=a.basis*units/a.units;
    a.units=Math.max(0,a.units-units); a.basis=Math.max(0,a.basis-basis); if(a.units<1e-8){a.units=0;a.basis=0;} cash(s,received,`到期变现 ${a.name}`,'forced');s.investmentSells+=received;
    s.transactions.push({quarter:s.quarter,asset:a.id,side:'sell',amount:received,units,fee,slippage:round(units*a.price*0.025),realized:round(received-basis)});
    s.notices.push(`为支付到期账单，变现了 ${a.name} 的部分持仓。`);
  }
}
export function endQuarter(state: Game): Game {
  if(state.finished || state.mainChoice === null) throw new Error('请先回复本季的来信。');
  if(pendingChapter(state))throw new Error('这一季的故事还没有说完，请先读完主线续章。');
  const s=clone(state);s.notices=[];
  const q=s.quarter;
  if(random(s.seed,q,'cycle')<0.36) s.regime=(s.regime+1)%4;
  const macro=[0.012,0.027,0.038,-0.055][s.regime];
  for(const a of s.assets) {
    const old=a.price;
    if(s.market){settleCompany(a,s.seed,q,s.regime,random);}else{
    const industryShock=random(s.seed,q,a.id+'earn')-0.5;
    a.revenue=round(a.trueRevenue);a.cashflow=round(a.trueCashflow);
    a.trueRevenue=Math.max(100,a.trueRevenue*(1+macro+industryShock*0.12));
    a.trueCashflow=a.trueRevenue*(0.05+random(s.seed,q,a.id+'cash')*0.09)-(s.regime===3?a.debtRatio*3:0);
    a.fundamental*=1+macro*0.6+industryShock*0.045;
    const idio=(random(s.seed,q,a.id+'price')-0.5)*0.14;
    const tail=random(s.seed,q,a.id+'tail')<0.09 ? (random(s.seed,q,a.id+'jump')-0.65)*0.55 : 0;
    const correction=Math.log(a.fundamental/a.price)*0.12;
    const credit=a.id==='urban'||a.id==='signal'?macro*0.5:0;
    const change=Math.exp(clamp(macro+idio+tail+correction+credit,-0.65,0.40));
    a.price=Math.max(0.1,round(a.price*change));a.history.push(a.price);a.debtRatio=round(clamp(a.debtRatio+(s.regime===3?2:-0.4)+industryShock*2,5,95));
    a.disclosures=[...(a.disclosures??[]),{quarter:q,price:a.price,revenue:a.revenue,cashflow:a.cashflow,debtRatio:a.debtRatio}];
    }
    const dividend=round(a.units*old*(a.id==='power'?0.007:0.002));if(dividend>0){cash(s,dividend,`${a.name} 分红`,'dividend');s.dividends+=dividend;}
  }
  cash(s,6500,'校对工作 · 季度结余','salary');cash(s,-5500,'房租、餐食与日常','living');
  if(s.flags.shop) {
    const shopNet=round(-1400+(s.flags.readers??0)*350+(s.flags.catalog??0)*220+random(s.seed,q,'shop')*800+(s.regime===3?-600:0));
    if(shopNet<0) liquidateFor(s,-shopNet);
    const paid=shopNet<0?Math.max(shopNet,-s.cash):shopNet;
    cash(s,paid,'泊灯书屋 · 本季经营','shop');
    if(paid>shopNet){s.debt.push({principal:round(paid-shopNet),due:q+1,rate:0});s.notices.push('本季经营费用尚有欠款，已列入账本，下季到期。');}
  }
  for(const p of s.promises.filter(p=>p.status==='pending'&&p.due===q)) {
    if(p.kind==='payment') {
      if(s.cash>=p.amount){cash(s,-p.amount,p.label,'promise');p.status='paid';s.notices.push(`${p.label}，已经按约付清。`);if(p.person)s.relations[p.person]=clamp(s.relations[p.person]+5);}
      else {p.status='missed';s.stress=clamp(s.stress+12);s.notices.push(`${p.label} 尚缺现金，约定落空了。`);if(p.person)s.relations[p.person]=clamp(s.relations[p.person]-10);}
    } else {
      if(random(s.seed,q,p.id+'recovery')<(p.chance??0.7)){cash(s,p.amount,p.label,'receipt');p.status='paid';s.notices.push(`${p.label}，款项已经收到。`);}
      else {p.status='missed';s.notices.push(`${p.label} 未能收回，风险债权核销。`);s.stress=clamp(s.stress+8);}
    }
  }
  for(const d of s.debt) {
    const interest=round(d.principal*d.rate);liquidateFor(s,interest);const paid=Math.min(s.cash,interest);cash(s,-paid,'借款季度利息','interest');d.principal=round(d.principal+interest-paid);
    if(d.due<=q){liquidateFor(s,d.principal);const principalPaid=Math.min(s.cash,d.principal);cash(s,-principalPaid,'到期偿还本金','loan');d.principal=round(d.principal-principalPaid);if(d.principal>0){s.flags.default=(s.flags.default??0)+1;s.notices.push('到期借款仍有欠款，已记录在账本中。');}}
  }
  s.debt=s.debt.filter(d=>d.principal>0);
  if((s.flags.fraud??0)>0){s.investigation++;s.notices.push(['有关往来账目的核查已经开始。','核查人员要求补交原始凭证。','调查进入正式取证阶段。'][Math.min(2,s.investigation-1)]);}
  const profit=investmentProfit(s);s.peakProfit=Math.max(s.peakProfit,profit);s.drawdown=Math.max(s.drawdown,(s.peakProfit-profit)/(INITIAL_CASH+s.peakProfit));
  s.stress=clamp(s.stress*0.9+(s.cash<15000?8:0));s.fatigue=clamp(s.fatigue*0.88+3);
  const text=s.notices[0]??(s.regime===3?'港口的夜班少了。街上比上季安静一些。':'柜台上的日历，又薄了三张。');
  s.quarters.push({quarter:q,wealth:round(netWealth(s)),cash:s.cash,investment:round(profit),text});
  if(q===12){s.finished=true;}else{s.quarter++;s.mainChoice=null;s.sideChoice=null;s.sideId=null;delete s.mainSnapshot;delete s.sideSnapshot;delete s.chapterSnapshot;const migrated=openMarketQuarter(s,random);if(migrated)s.notices.push('新一期公司经营事项已披露，可在季报核对。已发生的报价、账目和约定均保留。');}
  return s;
}
export function selectSide(s: Game, pool: StoryEvent[]): StoryEvent | null {
  if(s.quarter===1) return null;
  const candidates=pool.filter(e=>!s.used.includes(e.id)&&(!e.when||e.when(s)));
  if(!candidates.length)return null;
  const weights=candidates.map(e=>Math.max(0.1,e.weight?.(s)??1));let point=random(s.seed,s.quarter,'side-event')*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<candidates.length;i++){point-=weights[i];if(point<=0)return candidates[i];}return candidates[0];
}
export function ending(s: Game) {
  const profit=investmentProfit(s), broken=s.promises.filter(p=>p.kind==='payment'&&p.status==='missed').length;
  if((s.flags.fraud??0)>=3&&s.investigation>=3)return{title:'窗外的四季',name:'铁窗四季',text:'调查结束后，你在一间固定的房间里看完了这一年的四季。账本上那些被改动的日期，最终都有了自己的日期。',tone:'dark'};
  if(netWealth(s)<10000||debtTotal(s)>netWealth(s)+20000)return{title:'潮水退去之后',name:'余烬重燃',text:'你把还能带走的东西装进两个纸箱。校对的工作仍在，下个月的房租也有了着落。你开始知道，重新开始也是一件具体的事。',tone:'quiet'};
  if(profit>65000&&s.drawdown<0.18)return{title:'潮汐的名字',name:'知止乘潮',text:'城里的报纸想请你谈谈诀窍。你想起的却是几次没有买入的下午，以及那些终于等到回款的公司。你答应采访，但把时间排在了书店打烊以后。',tone:'light'};
  if(s.flags.retired&&debtTotal(s)===0&&investments(s)<1)return{title:'把时间还给自己',name:'激流勇退',text:'最后一次卖出后，你关掉了报价页面。窗外的街道没有变化。周末，你终于坐上了那班一直说要去坐的沿海慢车。',tone:'light'};
  if((s.flags.proofCraft??0)>=2&&(s.flags.integrity??0)>=2&&broken<=1)return{title:'每一页都有来处',name:'纸上春秋',text:'新书寄到的那天，小顾在署名页上找到了自己的名字，也找到了你的。三年前你只想把稿费攒起来，后来开始在意一本书怎样抵达读者手里。晚春的光照过校样桌，你仍会为交期着急，却不再把那些没有立即收入的夜晚叫作白费。',tone:'light'};
  if((s.flags.mutual??0)>=2&&s.relations.tang>=55&&broken<=1)return{title:'钥匙不只在你手里',name:'同灯共守',text:'冬天的最后一次轮值，是周伯来收杯子。你提前离开时，阿棠没有起身送，只问下周要不要换一班。账单仍按月到来，意见也未必一致，但这间屋子的开门与关门，终于不再只靠一个人。街灯亮起，你知道身后那盏灯会有人照看。',tone:'light'};
  if((s.flags.familyTime??0)>=2&&s.relations.he>=65)return{title:'下一次已经写在日历里',name:'归途有约',text:'沈禾没有再问你什么时候有空。周六那一格已经留了三年，赶不上时，你会提前打电话。你仍做校对，仍偶尔看市场；不同的是，回家不再是所有事情做完以后才发生的事。车站的玻璃又起了雾，你们隔着人群，一眼就认出了对方。',tone:'light'};
  if((s.flags.coast??0)>=2&&debtTotal(s)===0&&s.relations.lu>=60)return{title:'潮汐之外也有下午',name:'潮声入梦',text:'陆川又约你去对岸。没有新项目，也不用赶回来核对报价。你带了一本薄书，到了船上却一直没有翻开。钱的事并没有从生活里消失，只是终于有一些下午，不需要先证明自己值得。海风翻过空白的票背，你把它夹进了还没读完的那一页。',tone:'light'};
  if(s.flags.shop&&s.flags.keepShop&&broken<=1&&s.cash>15000)return{title:'泊灯，仍然亮着',name:'泊灯长明',text:'程姨回来看过一次。她没有检查账本，只在靠窗的位置坐了一下午。阿棠换好了门上的营业时间。你下班经过那条街，已经能从远处认出自己的灯。',tone:'light'};
  if(s.flags.community>=2&&s.relations.tang>60)return{title:'长桌旁边',name:'长桌人间',text:'周五晚上的长桌总有人坐。有人带来新书，有人只来喝一杯水。你仍要为账单盘算，但许多事情，已经可以开口与别人商量。',tone:'light'};
  if(broken>=3||Object.values(s.relations).filter(v=>v<35).length>=2)return{title:'没有回音的信箱',name:'独自抵达',text:'账目终于整理清楚了。你想把结果告诉几个人，却发现很久没有给他们写信。街道依旧热闹，你还需要学着重新走进去。',tone:'quiet'};
  return{title:'普通的一年，又一年',name:'寻常岁月',text:'三年过去，工作、吃饭、回家。你偶尔还会看一眼市场，更多时候是在读一本没读完的书。某个周末，沈禾来敲门，问你要不要出去走走。',tone:'light'};
}
export function validStoryOpening(value:unknown):value is Beat[]{
 return Array.isArray(value)&&value.length>0&&value.length<=40&&value.every(b=>b&&typeof b==='object'&&typeof b.text==='string'&&b.text.length>0&&b.text.length<=500&&['narrator','self','cheng','tang','lu','he','zhou','gu','yao','xu','cao','ning'].includes(b.speaker)&&(b.camera===undefined||['wide','medium','detail'].includes(b.camera))&&(b.pose===undefined||[0,1,2].includes(b.pose))&&(b.focus===undefined||['key','letter','ledger','cup','receipt','book','window','phone','ticket','contract','lamp'].includes(b.focus))&&(b.emotion===undefined||['quiet','warm','tense'].includes(b.emotion)));
}
export function validateSave(value: unknown): value is Game {
  if(!value||typeof value!=='object')return false;const s=value as Game;
  if(s.version!==1||!Number.isInteger(s.seed)||!Number.isInteger(s.quarter)||s.quarter<1||s.quarter>12||typeof s.finished!=='boolean'||!Number.isFinite(s.cash)||s.cash< -0.01)return false;
  if(!Array.isArray(s.assets)||s.assets.length!==6||!Array.isArray(s.journal)||!Array.isArray(s.history)||!Array.isArray(s.promises)||!Array.isArray(s.debt)||!Array.isArray(s.transactions)||!Array.isArray(s.quarters)||!Array.isArray(s.used))return false;
  if(!s.flags||!s.relations||!['stress','confidence','fatigue','investmentBuys','investmentSells','dividends','peakProfit','drawdown','regime','investigation'].every(k=>Number.isFinite(s[k as keyof Game])))return false;
  if(!Number.isInteger(s.regime)||s.regime<0||s.regime>3||!Array.isArray(s.notices)||!s.notices.every(n=>typeof n==='string')||!s.used.every(id=>typeof id==='string'))return false;
  if(!['cheng','tang','lu','he'].every(key=>Number.isFinite(s.relations[key as Person])))return false;
  if(![null,0,1].includes(s.mainChoice)||![null,0,1].includes(s.sideChoice))return false;
  if(!COMPANIES.every((c,i)=>s.assets[i].id===c[0]&&Number.isFinite(s.assets[i].price)&&s.assets[i].price>0&&Number.isFinite(s.assets[i].units)&&s.assets[i].units>=0&&Number.isFinite(s.assets[i].basis)&&s.assets[i].basis>=0&&Array.isArray(s.assets[i].history)&&s.assets[i].history.length>=2&&s.assets[i].history.every(Number.isFinite)))return false;
  if(!s.assets.every(a=>a.disclosures===undefined||(Array.isArray(a.disclosures)&&a.disclosures.length<=13&&a.disclosures.every((d,i,list)=>d&&Number.isInteger(d.quarter)&&d.quarter>=0&&d.quarter<=12&&(i===0||d.quarter>list[i-1].quarter)&&['price','revenue','cashflow','debtRatio'].every(k=>Number.isFinite(d[k as keyof Disclosure]))))))return false;
  if(!validMarket(s))return false;
  if(!s.assets.every(a=>['revenue','cashflow','fundamental','trueRevenue','trueCashflow','debtRatio','initial'].every(key=>Number.isFinite(a[key as keyof Asset]))))return false;
  if(!s.journal.every(e=>Number.isFinite(e.amount)&&typeof e.label==='string'&&typeof e.category==='string')||Math.abs(s.journal.reduce((t,e)=>t+e.amount,0)-s.cash)>0.1)return false;
  if(!s.promises.every(p=>typeof p.id==='string'&&typeof p.label==='string'&&Number.isFinite(p.amount)&&p.amount>=0&&Number.isInteger(p.due)&&['pending','paid','missed','cancelled'].includes(p.status)&&['payment','receipt'].includes(p.kind)))return false;
  if(!s.debt.every(d=>Number.isFinite(d.principal)&&d.principal>=0&&Number.isFinite(d.rate)&&Number.isInteger(d.due)))return false;
  if(!s.history.every(h=>typeof h.title==='string'&&typeof h.choice==='string'&&typeof h.response==='string'&&typeof h.principle==='string'))return false;
  if(!Object.values(s.relations).every(v=>Number.isFinite(v)&&v>=0&&v<=100)||!Object.values(s.flags).every(Number.isFinite))return false;
  for(const e of [s.mainSnapshot,s.sideSnapshot,s.chapterSnapshot]){
    if(!e)continue;
    if(!['id','title','sender','location','category','principle'].every(k=>typeof e[k as keyof StoryEvent]==='string')||!Array.isArray(e.paragraphs)||!e.paragraphs.every(p=>typeof p==='string')||!Array.isArray(e.options)||e.options.length!==2)return false;
    if(!e.options.every(o=>typeof o.label==='string'&&typeof o.detail==='string'&&typeof o.response==='string'&&o.effects&&typeof o.effects==='object'))return false;
    if(e.opening!==undefined&&!validStoryOpening(e.opening))return false;
    if(e.atQuarter!==undefined&&(!Number.isInteger(e.atQuarter)||e.atQuarter<1||e.atQuarter>12))return false;
  }
  return true;
}
