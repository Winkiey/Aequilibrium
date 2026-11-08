import type {Beat, CastId, FocusObject, SceneId, VisualScript} from './cinematic-content';
import {SCENE_LAYOUTS} from './composition';

/**
 * Authored blocking, independent of finances, save data and random event weights.
 * This is limited scene composition, not a claim of fully animated characters.
 * Actor marks use the painting: x/foot-y from top, height as percent of image H.
 * Object arrangements are semantic; Stage maps them to each painted work surface.
 */
export type ObjectAction = 'still'|'placed'|'offered'|'withdrawn'|'opened'|'turned'|'set-aside';
type Relationship = 'together'|'apart'|'solo'|'formal'|'remote';
type Arrangement = 'shared'|'separated'|'kept'|'offered'|'filed'|'opened'|'away';
export type StageChannel = 'room'|'letter'|'phone';
type BranchDirection = {
  /** Production note only. Never render as a caption or reveal before a choice. */
  intent:string;
  relationship:Relationship;
  arrangement:Arrangement;
  action:ObjectAction;
  companion?:FocusObject;
  channel?:StageChannel;
  cast?:CastId[];
};
type StoryDirection = {outcomes:[BranchDirection,BranchDirection]};
export type ActorMark = {id:CastId;x:number;y:number;height:number;scale:number;pose:0|1|2;active:boolean};
export type ObjectMark = {focus?:FocusObject;x:number;y:number;width:number;rotate:number;action:ObjectAction;
  companion?:{focus:FocusObject;x:number;y:number;width:number;rotate:number}};
export type StageDirection = {
  composition:'environment'|'conversation'|'portrait'|'object'|'decision';
  dialogueSide:'left'|'right'|'center';
  channel:StageChannel;
  actors:ActorMark[];
  cast:CastId[];
  object:ObjectMark;
  showObject:boolean;
  /** Production note only; deliberately absent from player-facing copy. */
  intent:string;
};

const d=(intent:string,relationship:Relationship,arrangement:Arrangement,action:ObjectAction,companion?:FocusObject,channel?:StageChannel,cast?:CastId[]):BranchDirection=>({intent,relationship,arrangement,action,companion,channel,cast});
const pair=(a:BranchDirection,b:BranchDirection):StoryDirection=>({outcomes:[a,b]});

/** Each A/B pair describes what was actually done in its authored response.
 * A is not automatically warm/right and B is not automatically cold/wrong.
 * E.g. s37–s42 use the same neutral light while signed copies leave the table
 * or originals remain visible for verification. No hash-based visual variety.
 */
export const STORY_DIRECTIONS:Record<string,StoryDirection>={
 'main-1':pair(d('钥匙与展开的租约一起留下，准备承担书屋','remote','shared','placed','contract','letter'),d('折好的来信单独留在校样旁','solo','kept','set-aside','book','letter')),
 'main-2':pair(d('椅子拉近，书摊开给同桌的人','together','shared','opened','cup'),d('人上楼，灯下留下尚未校完的一页','solo','kept','placed','book','phone')),
 'main-3':pair(d('借据推向灯下，一份留给出借人','formal','offered','offered','letter'),d('确认函和订单分开，留出补签位置','formal','separated','opened','letter')),
 'main-4':pair(d('成交单收好，施工确认仍摊在桌上','remote','separated','placed','contract','phone'),d('照片扣下，先核对自己的周末安排','solo','away','turned','contract','phone')),
 'main-5':pair(d('确认项目后搬开窗边的书','together','shared','opened','book'),d('重新安排工作范围，旧物先盖好','formal','kept','set-aside','contract')),
 'main-6':pair(d('日历展开，准备承担的日期逐项写下','remote','opened','opened','phone','phone'),d('期满整理日单独留下，笔横在纸边','remote','filed','placed','book','phone')),
 'main-7':pair(d('再铺一张借据，日期还需要重算','formal','opened','opened','ledger'),d('订单收回，茶杯让到对面的人手边','together','offered','turned','contract')),
 'main-8':pair(d('手机收起，两人在车窗旁度过回程','together','shared','set-aside','ticket'),d('截图撤回，手机留在冷下来的饭旁','remote','away','withdrawn','cup','phone')),
 'main-9':pair(d('旧报价挪开，回款与债务获得各自位置','formal','separated','set-aside','letter'),d('新成交行仍紧挨旧价格','solo','filed','placed','ledger')),
 'main-10':pair(d('签过的文件被带走，原件留在包内','formal','away','withdrawn','receipt',undefined,['xu']),d('原始凭证递向柜台逐项核对','formal','offered','offered','letter',undefined,['yao'])),
 'main-11':pair(d('墙边标出书架位置，量尺重新铺开','together','opened','opened','ledger'),d('交接清单与最后搬的桌子分开登记','apart','separated','placed','contract')),
 'main-12':pair(d('饭桌留出空椅，账目先挪到旁边','together','shared','offered','cup'),d('最后一页合好，汤仍单独留在手边','together','kept','placed','cup')),
 s01:pair(d('稿纸移到窗边，桌面让给一起吃饭的人','together','shared','set-aside','cup'),d('饭盒晾在一旁，稿纸重新移回灯下','solo','separated','placed','lamp')),
 s02:pair(d('手机收入包内，让出真实的车窗风景','together','shared','set-aside','ticket'),d('交稿间隙独自看对方寄来的照片','solo','kept','opened','book','phone')),
 s03:pair(d('说明纸展开，装好椅子后先坐一会儿','together','opened','opened','receipt'),d('纸板留在椅脚，校样仍需放平','solo','kept','placed','book')),
 s04:pair(d('账本合起，两杯豆浆一起带出街口','together','shared','offered','cup'),d('下一次日期被圈出，票的照片收回','remote','filed','withdrawn','ticket','phone')),
 s05:pair(d('工作灯关下，先让这一晚结束','solo','away','set-aside','lamp'),d('最后一页翻完，闹钟和稿纸留在手边','solo','opened','opened','phone')),
 s06:pair(d('菜单递回对面，接受对方这一餐的安排','together','offered','offered','cup'),d('自己先结账，伸来的信封重新收回','apart','kept','withdrawn','receipt')),
 s07:pair(d('旧桌放稳，让人可以围坐','together','shared','placed','book'),d('空位留给书架，原椅排近给通道让路','together','separated','set-aside','book')),
 s08:pair(d('担保栏划去，实际借出金额单独写清','formal','separated','opened','contract'),d('笔放回纸边，把公开咨询地址递出','formal','offered','offered','letter')),
 s09:pair(d('潮书在干处排开，批注诗集单独留下','together','opened','opened','book'),d('只留下目录内一箱，余箱重新封好','formal','kept','set-aside','ledger')),
 s10:pair(d('现结收据递出，一联压住封套','formal','offered','offered','letter'),d('带付款日期的原件折好单独保存','formal','filed','placed','contract')),
 s11:pair(d('夜里让出一把椅子，水与书一起留下','together','shared','offered','cup'),d('按时关门，课程表留到以后再商量','apart','kept','placed','letter')),
 s12:pair(d('进货单翻开，向熟客说明运费变化','together','opened','opened','receipt'),d('小票重打，新的价格单独留下','formal','filed','placed','ledger')),
 s13:pair(d('交稿后一个人守着渐凉的豆浆','solo','kept','placed','cup'),d('同事接过稿件，自己的笔收进包','together','offered','offered','book')),
 s14:pair(d('错误在付印前圈出，一杯热咖啡递来','together','shared','offered','cup'),d('文件照原样发出，版本记号留在待办中','solo','filed','placed','receipt')),
 s15:pair(d('额外十页铺开，回复框还等着答复','remote','opened','opened','book','phone'),d('报价单发出，空出的时段留回日历','solo','filed','set-aside','contract','phone')),
 s16:pair(d('培训资料收好，新系统回执单独保存','formal','filed','placed','receipt'),d('陌生格式摊到同事桌前一起演示','together','shared','opened','book')),
 s17:pair(d('提前签领，旧日期划去，底联交还','formal','offered','offered','receipt'),d('保留原日期，把未来金额留给未来预算','formal','separated','placed','ledger')),
 s18:pair(d('楼下钥匙放稳，楼上的加急稿仍亮着','solo','separated','placed','lamp'),d('稿件交给合适的同事，桌边可以趁热吃饭','together','offered','offered','cup')),
 s19:pair(d('投产和回款分别列栏，空处保留问号','formal','separated','opened','contract'),d('成交记录添入，仍向冷库追问付款日期','formal','filed','placed','receipt')),
 s20:pair(d('成交单与设备检修安排并排保存','formal','shared','placed','contract'),d('检修计划放回夹内，公告日单独标出','solo','filed','set-aside','letter')),
 s21:pair(d('新旧门店经营数字分成两列','solo','separated','opened','ledger'),d('持仓记录已写入，熟悉门脸留在窗外','solo','kept','placed','receipt')),
 s22:pair(d('交付线与未到账说明保持相邻但分明','formal','separated','opened','receipt'),d('成交后另夹验收单，标明预计付款时间','formal','filed','placed','contract')),
 s23:pair(d('总额拆成年份，开支与收入逐年排开','solo','opened','opened','ledger'),d('成交单压在总额公告后，小字仍需保留','solo','filed','placed','contract')),
 s24:pair(d('估价页合起，可用现金一栏保持原样','solo','kept','set-aside','ledger'),d('低价股份记入，银行续贷答复仍空着','formal','separated','placed','letter')),
 s25:pair(d('群聊提醒关闭，公开公告取代合照居中','solo','opened','opened','letter'),d('截下成交屏幕，又把图片收回相册','solo','kept','set-aside','receipt')),
 s26:pair(d('擦去纸上假设，把真实成交重新排好','solo','separated','opened','ledger'),d('新成交成本取代计算器里的假设收益','solo','filed','placed','receipt')),
 s27:pair(d('预测名单与旧报纸对照，不添新的答案','remote','shared','opened','letter','phone'),d('付款没有发生，公开报道单独存好','solo','kept','set-aside','receipt','phone')),
 s28:pair(d('手机揣回衣袋，先把雨前的东西搬进来','together','away','set-aside','window'),d('买入已经记好，买菜的零钱另外数齐','formal','separated','placed','receipt')),
 s29:pair(d('会场签字页推回，名片留在杯边','formal','away','withdrawn','cup'),d('安静灯下独自翻开全部公开材料','solo','opened','opened','lamp')),
 s30:pair(d('完整原文连同链接一起传回','remote','opened','opened','phone','phone'),d('成交后才把取消条款全部展开','solo','separated','opened','receipt')),
 s31:pair(d('凭证在已付栏勾过，日期抄在旁边','formal','filed','placed','receipt'),d('两页日历展开，付款总额写在未来日期下','formal','opened','opened','ledger')),
 s32:pair(d('现金当面点齐，这次结算落在今天','together','offered','offered','receipt'),d('便条留待结算，现金栏暂不落笔','formal','kept','placed','ledger')),
 s33:pair(d('不可退收据夹进租约，新折痕压平','formal','filed','placed','contract'),d('预付纸放回，现钱先留在原有账上','formal','separated','set-aside','ledger')),
 s34:pair(d('借款另翻一页，不混入营业额','together','separated','opened','ledger'),d('清单划去两行，电话通知等待的读者','remote','filed','turned','phone','phone')),
 s35:pair(d('只收好小额成交，不追加借款','formal','kept','placed','contract'),d('行情页退回，杯把轻轻转向别处','together','away','turned','cup')),
 s36:pair(d('单据按到期日排开，两笔付款移出同一月','formal','separated','opened','contract'),d('卖出后把可以支付的账单放到另一边','formal','offered','placed','receipt')),
 s37:pair(d('高开收据底联被撕下，一份已被拍走','formal','away','withdrawn','receipt'),d('照实重开，旧草稿划去与新单并排保存','formal','separated','opened','contract')),
 s38:pair(d('代签的薄纸被带走，后续材料装在另一处','formal','away','withdrawn','contract'),d('笔帽扣好，证件与待本人签字栏一起留下','formal','separated','placed','receipt')),
 s39:pair(d('原件被处理，转账通知仍留在屏幕上','remote','away','withdrawn','phone','phone'),d('原件完整进盒，往来记录随目录保存','formal','filed','placed','letter')),
 s40:pair(d('不实证明被复印装袋，联系信息随文件带走','formal','away','withdrawn','letter'),d('未完成项目清单压在证明上等待核实','formal','separated','opened','contract')),
 s41:pair(d('材料按日期排齐，另留一套完整副本','formal','opened','opened','letter'),d('咨询清单放回原文件袋，原件保持完整','formal','filed','placed','contract')),
 s42:pair(d('签名报表被带走，借款合同并未改变','formal','away','withdrawn','contract'),d('收入与借款各归原栏，利息日期保持可见','formal','separated','opened','contract')),
 s43:pair(d('书送出门，签收处仍能翻开书页','together','offered','offered','receipt'),d('库存目录摊开，书名与旧便条一起保存','formal','opened','opened','letter')),
 s44:pair(d('诗集放回原位，书签留给下一个人','together','kept','placed','book'),d('扫描目录留下，包好的诗集又翻开一页','together','offered','opened','receipt')),
 s45:pair(d('两页家常信慢慢封好，账目的事放到最后','remote','kept','placed','letter','letter'),d('备用钥匙的照片与钥匙扣颜色相继传来','remote','shared','turned','phone','phone')),
 s46:pair(d('三类收款分列，彼此之间留下空隙','solo','separated','opened','ledger'),d('混在一起的账页先夹便条，再合上本子','solo','filed','set-aside','book')),
 s47:pair(d('下一炉清单列好，一排空坯先移开几只','remote','separated','set-aside','cup','phone'),d('赠款发出，新釉照片从远方传来','remote','offered','offered','phone','phone')),
 s48:pair(d('陆川放下筷子，听完读书学生的故事','together','shared','placed','cup'),d('好看的数字说完，没出口的小事仍在草稿中','apart','kept','set-aside','letter')),
 s49:pair(d('修梁后把潮书逐本排开晾晒','together','opened','opened','book'),d('书先移入内间，接水盆仍留在窗下','apart','separated','set-aside','window')),
 s50:pair(d('还本日期前留白，资金安排先于投入','formal','opened','opened','contract'),d('成交单与借款合同并排，计息不会暂停','formal','shared','placed','receipt')),
 s51:pair(d('旧买价盖住，让经营报表来到灯下','solo','opened','opened','ledger'),d('资料夹合起，旧买价和下次日期仍圈在一起','solo','kept','set-aside','receipt')),
 s52:pair(d('午后门锁扣下，把一个下午还给街道','solo','away','withdrawn','key'),d('最后客人离开，与阿棠把杯子排成一行','together','shared','placed','lamp')),
 'chapter-2':pair(d('笔停在周六排班栏，来吃饭的日子定下来','together','shared','placed','cup'),d('代班费与稿费各占一行，邀约留待再约','apart','separated','opened','ledger')),
 'chapter-4':pair(d('坐回长凳，共同看海灯亮起','together','shared','placed','cup'),d('合同摊在膝上，只写能确认的日期','formal','opened','opened','contract')),
 'chapter-7':pair(d('新样逐页铺开，旧样单独夹在旁边','together','separated','opened','book'),d('修改与交付分开登记，再版清单留下签名','formal','filed','placed','receipt')),
 'chapter-10':pair(d('两把钥匙交出，自己的轮班也加入同一张表','together','offered','offered','key'),d('开放时间与管理费留在各自的栏位','formal','separated','opened','ledger')),
 s53:pair(d('约定日期存进手机，车票与衣服都可暂放','together','shared','placed','ticket'),d('检票灯亮起，车票收好准备回家','apart','kept','set-aside','ticket')),
 s54:pair(d('票根收入口袋，缆绳收起后一起渡河','together','shared','placed','ticket'),d('渡船离开，独自留在候船亭打开委托','solo','opened','opened','book')),
 s55:pair(d('修理单留给旧件，备用物品先递给你','formal','offered','offered','receipt'),d('回收标签与新物品的单据分开保存','formal','separated','placed','contract')),
 s56:pair(d('借用日期和清扫责任写在同一张约定上','together','shared','opened','contract'),d('两架书先盘点排齐，院子留出通道','together','separated','placed','book')),
 s57:pair(d('署名空行重新量好，修改记录摊开确认','formal','opened','opened','book'),d('原版装箱，修改记录另外留存','apart','filed','set-aside','receipt')),
 s58:pair(d('邮票贴好，信里给回来的日子留下位置','remote','kept','placed','letter','letter'),d('花盆照片及时传来，不催促下一封回复','remote','offered','offered','phone','phone')),
 s59:pair(d('菜箱与时间逐项记好，清单交给下一班人','together','offered','offered','ledger'),d('价格由老板确认，司机电话单独抄出','formal','filed','placed','phone')),
 s60:pair(d('原日期圈起，修订另外附纸不覆盖原件','formal','separated','opened','contract'),d('草稿按日期排齐，原件交还本人分别签收','formal','offered','offered','receipt')),
};

const ARRANGEMENTS:Record<Arrangement,Omit<ObjectMark,'focus'|'action'|'companion'>&{other:[number,number,number,number]} >={
 shared:{x:48,y:37,width:21,rotate:0,other:[64,44,11,-3]},
 separated:{x:39,y:37,width:19,rotate:-2,other:[66,43,13,3]},
 kept:{x:36,y:42,width:18,rotate:-4,other:[57,47,11,2]},
 offered:{x:56,y:38,width:21,rotate:1,other:[33,45,12,-2]},
 filed:{x:44,y:39,width:19,rotate:0,other:[61,44,11,0]},
 opened:{x:49,y:36,width:24,rotate:0,other:[29,45,11,-2]},
 away:{x:32,y:43,width:17,rotate:-5,other:[62,39,12,0]},
};

const REMOTE_STORIES:Record<string,StageChannel>={'main-1':'letter','main-6':'phone',s45:'letter',s47:'phone',s58:'letter'};
const REMOTE_SPEAKERS:Record<string,CastId[]>={'main-4':['lu']};
const STORY_CAST:Record<string,CastId[]>={'main-10':['xu']};
const DOCUMENT_WORDS=/照片|信纸|邮包|邮袋|语音|消息|屏幕|短信|聊天|转账通知|合照/;

function objectAction(beat:Beat):ObjectAction {
 if(/递|推到|推向|交还|送到|交给|让出/.test(beat.text))return'offered';
 if(/收回|撤回|抽走|带走|收进|合上|扣上|盖住|关掉/.test(beat.text))return'withdrawn';
 if(/挪开|移开|放回|放远|旁边|另一边|一旁/.test(beat.text))return'set-aside';
 if(/翻开|展开|摊|另铺|另翻|翻过/.test(beat.text))return'opened';
 if(/转|扣在|朝下/.test(beat.text))return'turned';
 if(/放下|摆|留下|写下|抄|记|压|贴|排/.test(beat.text))return'placed';
 return'still';
}

function actorMarks(cast:CastId[],speaker:Beat['speaker'],pose:Beat['pose'],relationship:Relationship,scene:SceneId):ActorMark[]{
 if(relationship==='solo'||relationship==='remote')return[];
 // Keep people in their established places when the speaker changes.
 const ordered=cast;
 const ids=[...new Set(ordered)].slice(0,2) as CastId[];
 return ids.map((id,i)=>({id,...SCENE_LAYOUTS[scene].actors[i],scale:1,
   pose:id===speaker?(pose??1):(relationship==='apart'?2:0),active:id===speaker}));
}

/** Pure resolver: calling this cannot change an event, settlement or collection. */
export function resolveStaging({eventId,phase,branch=0,beat,index,script,scene=script.scene}:{eventId:string;phase:'story'|'choice'|'outcome';branch?:0|1;beat:Beat;index:number;script:VisualScript;scene?:SceneId}):StageDirection {
 const profile=phase==='outcome'?STORY_DIRECTIONS[eventId]?.outcomes[branch]:undefined;
 const remoteSpeaker=beat.speaker!=='narrator'&&beat.speaker!=='self'&&REMOTE_SPEAKERS[eventId]?.includes(beat.speaker);
 const channel:StageChannel=profile?.channel??REMOTE_STORIES[eventId]??(remoteSpeaker?'phone':'room');
 const focus=beat.focus??(phase==='outcome'?script.outcomeFocus[branch]:undefined);
 const detail=beat.camera==='detail'&&!!focus;
 const documentary=(beat.speaker==='narrator'||beat.speaker==='self')&&DOCUMENT_WORDS.test(beat.text);
 const sceneCast=(profile?.cast??STORY_CAST[eventId]??script.cast).filter(id=>!REMOTE_SPEAKERS[eventId]?.includes(id));
 const baseRelation:Relationship=sceneCast.length>1?'together':'formal';
 const relation=profile?.relationship??baseRelation;
 const absent=channel!=='room'||detail||documentary||relation==='solo'||relation==='remote';
 let actors=absent?[]:actorMarks(sceneCast,beat.speaker,beat.pose,relation,scene);
 let composition:StageDirection['composition']=detail||documentary||channel!=='room'?'object':beat.camera==='wide'?'environment':actors.length>1?'conversation':'portrait';
 const active=actors.find(actor=>actor.active);
 let dialogueSide:StageDirection['dialogueSide']=beat.speaker==='narrator'||beat.speaker==='self'||!active?'center':active.x<50?'right':'left';
 if(phase==='choice'){
  actors=channel==='room'&&relation!=='solo'&&relation!=='remote'?actorMarks(sceneCast,'self',2,relation,scene).map(actor=>({...actor,pose:2,active:false})):[];
  composition='decision';dialogueSide='center';
 }
 const arrangement=profile?.arrangement??(detail?'opened':'filed');
 const {other,...position}=ARRANGEMENTS[arrangement];
 const action=phase==='choice'?'still':profile&&index===0?profile.action:objectAction(beat);
 const companion=phase==='outcome'&&profile?.companion&&profile.companion!==focus?{focus:profile.companion,x:other[0],y:other[1],width:other[2],rotate:other[3]}:undefined;
 const object:ObjectMark={...position,focus,action,companion};
 // Large material inserts only when the line actually directs attention there.
 // NPC dialogue keeps the surface clear instead of spawning a prop every line.
 const showObject=phase!=='choice'&&!!focus&&(detail||documentary||channel!=='room'||((beat.speaker==='self'||beat.speaker==='narrator')&&phase==='outcome'));
 return{composition,dialogueSide,channel,actors,cast:actors.map(a=>a.id),object,showObject,
   intent:profile?.intent??(phase==='choice'?'留出选择所需的空处':channel==='room'?'跟随当前人物与物件':'让来信或远方声音留在纸面')};
}
