/**
 * Hand-authored shots for the playable events. Money, dates, eligibility and
 * settlement stay in stories.ts / engine.ts; these shots never settle a promise.
 * A character may speak through a letter, photograph or phone in the scene.
 */
import { EXPANSION_STORYBOARDS } from './expansion-visuals';
export type CastId = 'cheng' | 'tang' | 'lu' | 'he' | 'zhou' | 'gu' | 'yao' | 'xu' | 'cao' | 'ning';
export type SceneId = 'bookshop-roof-sound' | 'bookshop-roof-patch' | 'bookshop-quarter-counter' | 'bookshop-night' | 'bookshop-day' | 'reading-room' | 'attic' | 'noodle-shop' | 'coldstore' | 'printshop' | 'bank' | 'tea-room' | 'old-street' | 'coastal-train' | 'station' | 'roof' | 'factory' | 'pottery' | 'archive' | 'quiet-room' | 'brokerage' | 'district-street' | 'neighborhood-bank' | 'securities-office' | 'winter-roster' | 'seawall-evening' | 'proof-night' | 'shared-keys' | 'winter-cloakroom' | 'ferry-spring' | 'repair-summer' | 'osmanthus-yard' | 'proof-morning' | 'post-winter' | 'noodle-blackout' | 'debt-autumn' | 'bookshop-pledge' | 'attic-kept-letter' | 'reading-gathering' | 'proof-solitary';
export type FocusObject = 'key' | 'letter' | 'ledger' | 'cup' | 'receipt' | 'book' | 'window' | 'phone' | 'ticket' | 'contract' | 'lamp';
export type Beat = {
  speaker: CastId | 'narrator' | 'self';
  text: string;
  camera?: 'wide' | 'medium' | 'detail';
  pose?: 0 | 1 | 2;
  focus?: FocusObject;
  emotion?: 'quiet' | 'warm' | 'tense';
};
export type VisualScript = {
  scene: SceneId;
  cast: CastId[];
  beats: Beat[];
  /** Complete performances. Recorded option responses are history summaries, not extra lines. */
  outcomes: [Beat[], Beat[]];
  outcomeFocus: [FocusObject, FocusObject];
  interaction: { object: FocusObject; label: string; line: string };
};

// Compact shot notation; every line below is written for its particular event.
const b = (speaker: Beat['speaker'], text: string, camera: Beat['camera'] = 'medium', focus?: FocusObject, pose: Beat['pose'] = 0, emotion: Beat['emotion'] = 'quiet'): Beat => ({ speaker, text, camera, focus, pose, emotion });

export const STORYBOARDS: Record<string, VisualScript> = {
  ...EXPANSION_STORYBOARDS,
  'main-1': {
    scene: 'bookshop-night', cast: ['cheng'],
    beats: [
      b('narrator', '雨水顺着后窗往下淌，搪瓷盆里传来一下一下的回声。', 'wide', 'window'),
      b('narrator', '柜台上留着牛皮纸信封，程姨的黄铜钥匙压在信封中央。', 'detail', 'key'),
      b('cheng', '租约还有三年，书架、桌子和剩下的书，都可以留下来。', 'medium', 'letter', 0, 'warm'),
      b('cheng', '不着急答复。后窗关不严，下雨的时候，记得垫条毛巾。', 'medium', 'window', 1),
      b('self', '十二万，是六年攒下的钱。我还没想清楚，它要带我去哪。', 'detail', 'ledger'),
      b('narrator', '楼上的稿子还没校完，陆川的新消息又点亮了手机屏幕。', 'detail', 'phone'),
      b('self', '我把钥匙挪开，展开租约。雨声里，纸页显得格外清楚。', 'medium', 'contract', 0, 'tense'),
    ],
    outcomes: [[
      b('self', '好，我来试试。后窗我会找人修。', 'medium', 'letter', 1, 'warm'),
      b('narrator', '你将钥匙收进衣袋，把租约摊平在灯下。', 'detail', 'key'),
      b('self', '明早先和阿棠排好开门的时间，校对的工作也不能耽搁。', 'medium', 'ledger'),
    ], [
      b('self', '我先替你照看。正式接手的事，让我再想一想。', 'medium', 'letter'),
      b('cheng', '好，钥匙先放你那里。想清楚了再告诉我。', 'medium', 'key', 1, 'warm'),
      b('narrator', '你把信折好，压在稿纸下面。租约上还没有签名。', 'detail', 'contract'),
    ]],
    outcomeFocus: ['key', 'letter'],
    interaction: { object: 'letter', label: '拆开信封', line: '你抽出折好的租约，黄铜钥匙在柜台上轻轻一响。' },
  },
  'main-2': {
    scene: 'reading-room', cast: ['tang', 'he'],
    beats: [
      b('narrator', '第一场冷空气钻进后间，阿棠把量尺拉过了旧桌子的边沿。', 'wide', 'window'),
      b('tang', '星期五，腾一张桌子吧。让街坊带自己喜欢的东西来读。', 'medium', 'book', 0, 'warm'),
      b('tang', '不收门票。椅子得添几把，散场以后，也得有人收拾。', 'medium', 'ledger', 1),
      b('narrator', '手机里的加急稿还等着回复，交稿日恰好也是这个星期五。', 'detail', 'phone'),
      b('self', '一笔报酬，或者一个晚上。它们都在等同一双手腾出空来。', 'medium', 'book'),
      b('tang', '桌子朝哪边放？靠窗会冷些，不过那边的光倒是很好。', 'medium', 'window', 2),
    ],
    outcomes: [[
      b('narrator', '四把椅子隔得很开，沈禾先拉近一把，把书翻到折角。', 'wide', 'book'),
      b('tang', '末班车还有一会儿。你刚才说的那一段，能再读一次吗？', 'medium', 'lamp', 1, 'warm'),
    ], [
      b('narrator', '量尺啪地卷回壳里；你上楼开灯，稿纸仍停在早晨那页。', 'detail', 'lamp'),
      b('tang', '那先不搬。我把桌上的东西收好，下次量起来也快。', 'medium', 'book', 2),
    ]],
    outcomeFocus: ['book', 'lamp'],
    interaction: { object: 'book', label: '翻看桌上的书', line: '书页间夹着一张旧公交票，日期已经淡了。' },
  },
  'main-3': {
    scene: 'printshop', cast: ['tang'],
    beats: [
      b('narrator', '印坊里有油墨和热纸的气味，旧机器旁摆着拆下来的零件。', 'wide', 'book'),
      b('tang', '毕业册的单子接到了。修机器要两万，回款得等到明年。', 'medium', 'contract', 0, 'tense'),
      b('narrator', '报价、交货日期排在一起，客户确认栏却空着一枚印章。', 'detail', 'contract'),
      b('tang', '订金到得慢，学校不会跑。我把维修的报价也带过来了。', 'medium', 'receipt', 1),
      b('self', '这台机器印过我校对的第一本书，封面的蓝色总是偏深。', 'detail', 'book'),
      b('narrator', '阿棠把手从机器上放下来，指尖的油墨擦在了围裙边上。', 'medium', 'ledger', 2, 'tense'),
    ],
    outcomes: [[
      b('narrator', '阿棠把借据推到灯下，逐字核对日期，给你留下一份。', 'detail', 'contract'),
      b('tang', '这张你收着。订单里的确认栏，我明天还得去催。', 'medium', 'letter', 1, 'tense'),
    ], [
      b('narrator', '你把确认函和订货单分开，空着的签名处各贴一张纸条。', 'detail', 'contract'),
      b('tang', '这两份得补签。今晚辛苦你了，我带着它们再跑一趟。', 'medium', 'letter', 2),
    ]],
    outcomeFocus: ['contract', 'letter'],
    interaction: { object: 'contract', label: '查看确认栏', line: '签章的位置空着，旁边的交货日期已经写得很满。' },
  },
  'main-4': {
    scene: 'coldstore', cast: ['lu', 'he'],
    beats: [
      b('narrator', '照片里的冷库刚落成，几只纸杯举在蓝色工装之间。', 'wide', 'letter'),
      b('lu', '老同学，这次总该轮到我们了。周末有空，过来看看？', 'medium', 'cup', 1, 'warm'),
      b('narrator', '报纸把营收增长印在首页，回款放慢的说明留在下一页。', 'detail', 'letter'),
      b('lu', '街口卖早点的两口子也买了。你还记得他们那辆小推车吧？', 'medium', 'phone', 2),
      b('he', '屋顶的确认单在这里。付款和盯施工的事，我们得分清楚。', 'medium', 'contract', 0),
      b('narrator', '你又翻回合照。陆川站在最边上，笑得比毕业时还年轻。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '你收好成交记录，把屋顶确认单留在桌面，没有一同收走。', 'detail', 'receipt'),
      b('lu', '给你留了位置。周末来之前说一声，我去路口接你。', 'medium', 'phone', 1, 'warm'),
    ], [
      b('narrator', '新照片从手机里传来，你停了一会儿，把屏幕扣在桌上。', 'detail', 'phone'),
      b('self', '替我向大家问好。周末的安排，我还要先核对一下。', 'medium', 'contract'),
    ]],
    outcomeFocus: ['receipt', 'phone'],
    interaction: { object: 'letter', label: '翻到报纸下一页', line: '照片下面的小字说，客户的回款时间正在延长。' },
  },
  'main-5': {
    scene: 'roof', cast: ['he', 'cao'],
    beats: [
      b('narrator', '梯子靠上墙，师傅踩了踩第一阶，抬头查看雨水留下的印子。', 'wide', 'window'),
      b('cao', '先看好施工单，哪些要揭开，哪些留下，今天都得说清。', 'medium', 'contract', 0),
      b('narrator', '沈禾把接水盆里的水倒掉，又用毛巾擦干盆沿和地板。', 'detail', 'window'),
      b('he', '我就是想，下次来时能在窗边坐坐，安安静静读一会儿。', 'medium', 'book', 1, 'warm'),
      b('self', '我把单据压平。屋顶的事，和窗边这一点愿望，挨得很近。', 'detail', 'contract'),
      b('cao', '商量好就叫我。单上写什么，我就照着什么备材料。', 'medium', 'receipt', 2),
    ],
    outcomes: [[
      b('narrator', '你指明确认单上的项目，沈禾把窗边的书一摞摞搬开。', 'medium', 'contract'),
      b('he', '这几本先放里面吧。留出地方，师傅做事也方便些。', 'medium', 'book', 1, 'warm'),
    ], [
      b('narrator', '你们重新核过安排，沈禾扶着旧桌，慢慢往里面挪了一点。', 'wide', 'window'),
      b('cao', '那就按说好的来。要留着的东西，先盖好，别落灰。', 'medium', 'contract', 2),
    ]],
    outcomeFocus: ['contract', 'window'],
    interaction: { object: 'window', label: '看看雨水痕迹', line: '木框下方颜色深了一截，旧毛巾还拧在窗台上。' },
  },
  'main-6': {
    scene: 'bookshop-day', cast: ['cheng'],
    beats: [
      b('narrator', '邮包里是两个陶碗，一个口沿歪了，另一个釉色比照片暗。', 'detail', 'cup'),
      b('cheng', '头一回烧窑，出来的比想的少一半。歪的也还盛得住东西。', 'medium', 'letter', 1, 'warm'),
      b('narrator', '信纸写到余下的租期，笔迹在保证金那一行稍稍停顿。', 'detail', 'contract'),
      b('cheng', '你喜欢就接着做。不喜欢，也别为了我，把自己一直耗着。', 'medium', 'letter', 0, 'warm'),
      b('self', '我把两个碗并排摆好。歪的那只，放这串钥匙竟然正合适。', 'detail', 'key'),
      b('narrator', '柜台后的日历还有几张，新的约定却已经等在更远的日期上。', 'wide', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你把准备承担的日期抄进日历，程姨的语音还没有说完。', 'detail', 'contract'),
      b('cheng', '窗边那排书怕晒，记得……你看，我说着说着，又啰嗦了。', 'medium', 'phone', 2, 'warm'),
    ], [
      b('narrator', '你写下期满整理的日子，把笔横在日历上，听她回复。', 'detail', 'letter'),
      b('cheng', '到时候一起收拾。哪些书要留，慢慢理，总能理清楚。', 'medium', 'book', 1, 'warm'),
    ]],
    outcomeFocus: ['contract', 'letter'],
    interaction: { object: 'cup', label: '转一转陶碗', line: '歪口沿在光里投下短短一道影，碗底还留着手指印。' },
  },
  'main-7': {
    scene: 'printshop', cast: ['tang'],
    beats: [
      b('narrator', '机器停着，毕业册、菜单和图录的订单铺满了阿棠面前的桌子。', 'wide', 'contract'),
      b('tang', '修好就能开工。还差一万二，你看，交货日期也改过了。', 'medium', 'contract', 1, 'tense'),
      b('narrator', '他的指尖压在客户的批注上，另一行字却被折进纸的背面。', 'detail', 'letter'),
      b('tang', '收旧设备的人下午来过。他问，我什么时候能给个准话。', 'medium', 'ledger', 0, 'tense'),
      b('self', '机器的蓝漆已经磨掉一块。我记得第一本书在这里印出来。', 'detail', 'book'),
      b('narrator', '窗外的摩托响了三次，没能发动；阿棠没有再把纸往前推。', 'medium', 'window', 2, 'tense'),
    ],
    outcomes: [[
      b('narrator', '阿棠另铺一张纸，写到日期时停住，把日历往自己面前移。', 'detail', 'contract'),
      b('tang', '等一下，这一天我得再算一遍。不能为了快，就先写下去。', 'medium', 'ledger', 1, 'tense'),
    ], [
      b('narrator', '订单被一张张收回；阿棠转过压纸的茶杯，让杯把朝向你。', 'detail', 'cup'),
      b('tang', '你喝口水。我把桌面收一收，这些单子不能再混着放了。', 'medium', 'contract', 2),
    ]],
    outcomeFocus: ['contract', 'cup'],
    interaction: { object: 'letter', label: '展开纸背', line: '折痕很深，指腹压过去以后，那行小字才显露出来。' },
  },
  'main-8': {
    scene: 'noodle-shop', cast: ['he'],
    beats: [
      b('narrator', '沈禾把你那碗面的葱挑到一边，又把筷子摆到碗的右手边。', 'wide', 'cup'),
      b('he', '周末去白沙吧，坐沿海慢车，当天就回来，也不用请假。', 'medium', 'ticket', 1, 'warm'),
      b('narrator', '手机亮起来，是陆川转来的一篇长文，标题占满半个屏幕。', 'detail', 'phone'),
      b('he', '两个车次都赶得上。你先吃面，等会儿我们再看看时间。', 'medium', 'ticket', 0),
      b('self', '面汤浮起薄薄一层油。我才发现，筷子一直没有动过。', 'detail', 'cup'),
      b('narrator', '她用手指扶住即将滑走的票价截图，等你把目光移回来。', 'medium', 'phone', 2),
    ],
    outcomes: [[
      b('narrator', '你把手机放进口袋。回程车窗摇晃，她手里还捏着半只橘子。', 'wide', 'window'),
      b('he', '到站叫我一下。剩下的橘子给你，酸的那半我已经吃掉了。', 'medium', 'ticket', 1, 'warm'),
    ], [
      b('narrator', '车次截图从聊天里撤回。沈禾收起手机，把面碗往前挪。', 'detail', 'phone'),
      b('he', '那就下次吧。你这碗还没怎么吃，汤都快凉了。', 'medium', 'cup', 2),
    ]],
    outcomeFocus: ['window', 'phone'],
    interaction: { object: 'phone', label: '看看未读消息', line: '长文后面没有新消息，桌子对面的人还在这里。' },
  },
  'main-9': {
    scene: 'coldstore', cast: ['lu'],
    beats: [
      b('narrator', '港口办公室的复印机快没墨了，报表上的数字浅得像水印。', 'wide', 'letter'),
      b('lu', '扩建还在做，回款的计划又往后挪。最新一版我也夹进去了。', 'medium', 'contract', 0, 'tense'),
      b('lu', '大家都说，等价格回到最早那会儿就卖。最近总有人这样问。', 'medium', 'phone', 1),
      b('narrator', '货车一辆辆开出冷库，账本里的买价、订单和回款各占一栏。', 'detail', 'ledger'),
      b('self', '车确实在走。可正在做生意，和钱什么时候回来，还隔着几页。', 'medium', 'letter'),
      b('narrator', '陆川把摞歪的文件扶正，最初那张报价又露出了一角。', 'detail', 'receipt'),
    ],
    outcomes: [[
      b('narrator', '你把旧报价挪到另一页，给现有订单与债务留出新的位置。', 'detail', 'ledger'),
      b('lu', '这一栏是回款，别跟签单的日期抄到一起。我再给你找原表。', 'medium', 'letter', 2),
    ], [
      b('narrator', '成交记录多出一行。你伸手想划掉旧价格，最后只添了一笔。', 'detail', 'receipt'),
      b('self', '平均成本换了一个数字。刚才那份回款表，还得接着看。', 'medium', 'ledger', 0, 'tense'),
    ]],
    outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: 'ledger', label: '移开旧报价', line: '被压住的那页，列着尚未收齐的款项和对应日期。' },
  },
  'main-10': {
    scene: 'tea-room', cast: ['xu', 'yao'],
    beats: [
      b('narrator', '茶室的帘子遮住银行门口，桌上放着一份重做过的资金流水。', 'wide', 'contract'),
      b('xu', '流水好看些，续贷和转租都好办。大家只是把手续补齐而已。', 'medium', 'cup', 1),
      b('self', '这两笔收入没有发生过。这里的日期，也和原来的单据不同。', 'detail', 'receipt'),
      b('narrator', '对方把茶杯往前推，水面轻轻撞上杯壁，遮住了纸页的一角。', 'detail', 'cup'),
      b('xu', '日期也能调整。你先看看签字的地方，原件不用摆在这儿。', 'medium', 'contract', 2, 'tense'),
      b('self', '原始凭证还在包里。签下去以后，这份纸交出去的就是我的名字。', 'medium', 'letter', 0, 'tense'),
    ],
    outcomes: [[
      b('narrator', '签过字的纸被抽走，杯底留下湿圈；你把包口重新扣紧。', 'detail', 'contract'),
      b('xu', '这一页我收了。原件你自己放好，别和这份混在一起。', 'medium', 'receipt', 1),
    ], [
      b('narrator', '你拿出包里的原件，越过茶室门槛，递到银行柜台里面。', 'medium', 'letter'),
      b('yao', '这两个日期我再核一次。您稍等，资料先不要收起来。', 'medium', 'receipt', 2),
    ]],
    outcomeFocus: ['contract', 'receipt'],
    interaction: { object: 'receipt', label: '核对原始凭证', line: '折起的凭证上，金额与日期都和桌上那份不同。' },
  },
  'main-11': {
    scene: 'old-street', cast: ['tang'],
    beats: [
      b('narrator', '街上有两块新招牌。阿棠蹲在门口，把松动的砖垫平。', 'wide', 'window'),
      b('tang', '明年的营业时间，还要不要改？这块砖先弄好，免得绊着人。', 'medium', 'lamp', 1),
      b('narrator', '报纸上的新项目排得很满，租约却只剩最后一季的日期。', 'detail', 'contract'),
      b('self', '我现在能说清楚，每一次留下，要占去多少现金和多少晚上。', 'medium', 'ledger'),
      b('narrator', '阿棠没有催，坐上台阶，脱下一只鞋，把里面的小石子倒出来。', 'medium', 'book', 2),
      b('tang', '你慢慢想。我先把门口扫了，风一大，纸屑又都跑回来了。', 'wide', 'window', 0),
    ],
    outcomes: [[
      b('narrator', '量尺重新铺在墙边，你们在新书架的位置各做了一个小记号。', 'detail', 'book'),
      b('tang', '这层低一点，拿书方便。柜台边上，也给人留条好走的路。', 'medium', 'ledger', 1, 'warm'),
    ], [
      b('narrator', '交接清单写到窗边时，阿棠把笔停下，用手掌摸了摸桌角。', 'detail', 'contract'),
      b('tang', '这张桌子留到最后搬吧。别的东西，我先一项项记下来。', 'medium', 'window', 2),
    ]],
    outcomeFocus: ['book', 'contract'],
    interaction: { object: 'contract', label: '展开最后一季租约', line: '纸页被翻软了，最后一行日期却仍然清清楚楚。' },
  },
  'main-12': {
    scene: 'bookshop-night', cast: ['cheng', 'tang', 'he'],
    beats: [
      b('narrator', '程姨从南方带回一只圆整的陶碗，在窗边坐了整整一个下午。', 'wide', 'cup'),
      b('cheng', '这次总算烧圆了。你别只拿来装钥匙，盛汤也试一试。', 'medium', 'cup', 1, 'warm'),
      b('narrator', '柜台上的账本仍旧摊开，阿棠和沈禾的影子落在书页旁边。', 'detail', 'ledger'),
      b('cheng', '这几年，过得怎么样？慢慢说，我们又不赶最后一班车。', 'medium', 'letter', 0, 'warm'),
      b('self', '我想了想，要说的事情很多，账本上的数字只能讲其中一部分。', 'medium', 'ledger'),
      b('narrator', '九点整，对街的灯先灭了。店里的人还坐着，没有谁急着起身。', 'wide', 'lamp'),
    ],
    outcomes: [[
      b('narrator', '热饭摆开，程姨用旧碗分汤，沈禾把柜台上的纸往旁边挪。', 'wide', 'cup'),
      b('cheng', '先端稳，烫着呢。阿棠，把那张空椅子也拉过来。', 'medium', 'cup', 2, 'warm'),
    ], [
      b('narrator', '你写完最后一页，合上账本；桌边留下的一碗汤还冒着热气。', 'detail', 'ledger'),
      b('he', '给你留着呢。纸先放远一点，别又把汤洒在账上。', 'medium', 'cup', 1, 'warm'),
    ]],
    outcomeFocus: ['cup', 'ledger'],
    interaction: { object: 'lamp', label: '看一眼街对面的灯', line: '玻璃里映着一张桌子，灯光照到每个人的手边。' },
  },

  s01: {
    scene: 'attic', cast: ['he'],
    beats: [
      b('narrator', '门口的饭盒还温着，沈禾伸手替你接住滑落的稿纸。', 'wide', 'book'),
      b('he', '又吃便利店的饭？我路过菜场，要不要一起买一点？', 'medium', 'cup', 1, 'warm'),
      b('self', '桌上压着加急稿，饭盒的盖子映着台灯的一小块光。', 'detail', 'lamp'),
    ],
    outcomes: [[
      b('narrator', '你把资料挪到窗边，沈禾腾出两块地方摆碗筷。', 'wide', 'window'),
      b('he', '这张纸别碰水。先吃完，碗等会儿我们一起洗。', 'medium', 'cup', 2, 'warm'),
    ], [
      b('narrator', '饭盒洗净后晾在桌角，你重新把稿子推到灯下。', 'detail', 'book'),
      b('self', '明天见面，再多说两句吧。这行字，今晚得校完。', 'medium', 'lamp'),
    ]], outcomeFocus: ['cup', 'lamp'],
    interaction: { object: "book", label: "挪开桌上的稿纸", line: "你把散页归成一摞，饭盒终于有了能放稳的位置。" },
  },
  s02: {
    scene: 'station', cast: ['he'],
    beats: [
      b('narrator', '车次截图发来了，两行出发时间，下面标着今晚截止。', 'detail', 'phone'),
      b('he', '这两个车次都行，你挑一个吧，我把周末空出来。', 'medium', 'ticket', 1, 'warm'),
      b('self', '零工的消息还在上一屏，我在两个聊天窗口之间来回。', 'medium', 'phone'),
    ],
    outcomes: [[
      b('narrator', '海风从车窗缝里钻进来，你拉上背包，把手机留在里面。', 'wide', 'window'),
      b('he', '看那边，过完这段弯，海就能看得完整一点了。', 'medium', 'ticket', 2, 'warm'),
    ], [
      b('narrator', '周末，你在交稿间隙点开照片，指尖停在蓝色海面上。', 'detail', 'phone'),
      b('self', '比我想的还蓝。先回她一句，再把剩下的做完。', 'medium', 'book'),
    ]], outcomeFocus: ['window', 'phone'],
    interaction: { object: "ticket", label: "展开两个出发时间", line: "两行车次停在掌心，优惠的截止时间就在下面。" },
  },
  s03: {
    scene: 'attic', cast: ['he'],
    beats: [
      b('narrator', '旧椅子又沉下一截，你把靠垫折了两次，仍坐不稳。', 'wide', 'book'),
      b('he', '你起来试试，腰能伸直吗？别又说垫一垫就好了。', 'medium', 'lamp', 1),
      b('self', '台灯没有换地方，桌边的高度，却越来越不合适。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '说明纸摊在地上，最后一颗螺丝拧紧，你试着坐了坐。', 'detail', 'receipt'),
      b('he', '先别忙着起身。你刚才一直皱着的眉头，松了点。', 'medium', 'lamp', 2, 'warm'),
    ], [
      b('narrator', '你把旧纸板塞到椅脚下面，坐下时木头又轻响了一声。', 'detail', 'book'),
      b('self', '再往里垫一点吧。稿纸放平了，椅子还得慢慢坐。', 'medium', 'lamp'),
    ]], outcomeFocus: ['receipt', 'book'],
    interaction: { object: "lamp", label: "照照松动的椅脚", line: "你把灯转低，纸板垫片已经从椅脚下面滑出一角。" },
  },
  s04: {
    scene: 'attic', cast: ['he'],
    beats: [
      b('narrator', '抽屉里的电影票露着半角，上面是你说过要早下班的那天。', 'detail', 'ticket'),
      b('he', '今晚还算数吗？我还没出门，怕你那边又有事情。', 'medium', 'phone', 0),
      b('self', '账本摊在眼前，她的消息停在屏幕上，一直没有往下滚。', 'medium', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你合上账本。散场后，两人绕过街角，手里各捧一杯豆浆。', 'wide', 'cup'),
      b('he', '刚才那一幕你看清了吗？我还在想，他为什么没有回头。', 'medium', 'ticket', 1, 'warm'),
    ], [
      b('narrator', '你把下一次的日期圈出来，电影票的照片随后被撤了回去。', 'detail', 'phone'),
      b('he', '票转给同事了。电影还会再放，下回提前告诉我吧。', 'medium', 'ticket', 2),
    ]], outcomeFocus: ['cup', 'ticket'],
    interaction: { object: "ticket", label: "取出抽屉里的票", line: "两张票叠在一起，取出来时，抽屉里只剩一条浅痕。" },
  },
  s05: {
    scene: 'attic', cast: [],
    beats: [
      b('narrator', '台灯旁的钟指向凌晨两点，公告停在已经读过四遍的段落。', 'detail', 'lamp'),
      b('self', '刚才那句说的是什么？我把上一行又重新看了一次。', 'medium', 'book'),
      b('narrator', '夜稿的邀约还亮着，你抬手揉眼睛，纸上的字短暂地散开。', 'detail', 'phone'),
    ],
    outcomes: [[
      b('narrator', '你关掉台灯。再睁眼时，窗外有人推着早点车经过。', 'wide', 'window'),
      b('self', '这段话留到现在，反而看得清楚了。先起来烧点水。', 'medium', 'book'),
    ], [
      b('narrator', '最后一页翻过去，楼下卸货的声音穿过窗帘传进房里。', 'detail', 'book'),
      b('self', '闹钟先关了吧。手还搭在鼠标上，眼睛已经睁不开。', 'medium', 'lamp'),
    ]], outcomeFocus: ['window', 'lamp'],
    interaction: { object: "book", label: "指住读了四遍的段落", line: "指尖停住，你发现上一遍的铅笔记号还在同一行。" },
  },
  s06: {
    scene: 'noodle-shop', cast: ['he'],
    beats: [
      b('narrator', '沈禾翻到收藏很久的菜单照片，又把手机放回桌上。', 'detail', 'phone'),
      b('he', '第一次领工资就想请你来。这次我请，你别抢着结账。', 'medium', 'cup', 1, 'warm'),
      b('self', '她把信封放在手边，点菜时又认真看了一遍价格。', 'medium', 'receipt'),
    ],
    outcomes: [[
      b('narrator', '你把菜单递回她手里，听她终于点下那道想吃的菜。', 'medium', 'cup'),
      b('he', '就这个吧。回去你叫车，我今天只管这张桌子。', 'medium', 'receipt', 2, 'warm'),
    ], [
      b('narrator', '你先去付了账；沈禾伸向信封的手停住，慢慢把它收回。', 'detail', 'receipt'),
      b('self', '本来想请她高兴，怎么又替她作了决定。', 'medium', 'cup', 0),
    ]], outcomeFocus: ['cup', 'receipt'],
    interaction: { object: "phone", label: "看看她收藏的菜单", line: "照片的收藏日期很早，想吃的那道菜被她放大过。" },
  },
  s07: {
    scene: 'reading-room', cast: ['tang'],
    beats: [
      b('narrator', '街口咖啡馆搬空了，阿棠量完长桌，回来比画屋里的空位。', 'wide', 'window'),
      b('tang', '旧划痕多了点，倒是真结实。周五放书、放杯子都够。', 'medium', 'cup', 1, 'warm'),
      b('self', '空位也能放新书架。两种摆法，他都在纸上画了一遍。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '桌子靠墙放稳，阿棠蹲下垫平桌脚，手掌拍了拍桌面。', 'wide', 'book'),
      b('tang', '好了，不晃。划痕就留着吧，书摊开也盖不住几道。', 'medium', 'cup', 2, 'warm'),
    ], [
      b('narrator', '空位留给书架，阿棠把原有的椅子排近，给通道让出地方。', 'wide', 'book'),
      b('tang', '这边先这么摆，拿书的人不用再绕过一整张桌子。', 'medium', 'ledger', 1),
    ]], outcomeFocus: ['cup', 'book'],
    interaction: { object: "ledger", label: "比一比桌子和书架的位置", line: "阿棠把纸转过来，两种摆法都替门口留了通道。" },
  },
  s08: {
    scene: 'old-street', cast: ['zhou'],
    beats: [
      b('narrator', '老周拿来的借据折成小方块，签名那一栏被他反复展开。', 'detail', 'contract'),
      b('zhou', '替亲戚周转一下，借个签名，不会真麻烦到你的。', 'medium', 'letter', 1),
      b('self', '我没有接过笔，先把纸展开，看清每一栏写的是什么。', 'medium', 'contract'),
    ],
    outcomes: [[
      b('narrator', '老周划掉担保人一栏，把你愿意出借的数额重新写进借据。', 'detail', 'contract'),
      b('zhou', '那就把这一笔单写清楚。你看，我这里还有没有漏的？', 'medium', 'letter', 2),
    ], [
      b('narrator', '你把笔放回纸边，给老周写下一个公开的合同咨询地址。', 'detail', 'letter'),
      b('zhou', '我记着。先问清楚也好，亲戚那头我再去说一说。', 'medium', 'contract', 0),
    ]], outcomeFocus: ['contract', 'letter'],
    interaction: { object: "contract", label: "展开签名那一栏", line: "担保人几个字露出来，和出借人分在不同的位置。" },
  },
  s09: {
    scene: 'bookshop-day', cast: ['tang'],
    beats: [
      b('narrator', '六箱旧书堆在门口，最下层的纸箱边沿已经被潮气洇软。', 'wide', 'book'),
      b('tang', '送是白送。得一箱箱筛，发霉的也不能就这样摆上架。', 'medium', 'ledger', 0),
      b('self', '我翻开一本，纸间有细细的灰，页边却写满了工整的注。', 'detail', 'book'),
    ],
    outcomes: [[
      b('narrator', '剩下的两箱半挪到干处，阿棠从中抽出那本有批注的诗集。', 'detail', 'book'),
      b('tang', '这本留着吧。先晾一晾，再把这些小字慢慢看看。', 'medium', 'window', 1, 'warm'),
    ], [
      b('narrator', '你们只搬进列好目录的一箱，余下的箱子重新封好。', 'wide', 'book'),
      b('tang', '我联系能处理的回收站，先别堵着门，让人有路进来。', 'medium', 'phone', 2),
    ]], outcomeFocus: ['book', 'phone'],
    interaction: { object: "book", label: "翻看箱里的一本旧书", line: "几页纸粘在一起，你放轻手，先闻到一丝潮味。" },
  },
  s10: {
    scene: 'old-street', cast: ['zhou'],
    beats: [
      b('narrator', '街口文具摊的单据分成两张，店主把笔搁在中间。', 'detail', 'receipt'),
      b('zhou', '现结便宜两百；下季按原价付也行，你自己挑。', 'medium', 'contract', 1),
      b('self', '纸、笔和封套已经装好，等着决定的只剩付款的日期。', 'wide', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '店主在收据上写下现结，撕下一联，压在那叠封套上。', 'detail', 'receipt'),
      b('zhou', '这张留好。东西清点一遍，回去要用的可别落下。', 'medium', 'book', 2),
    ], [
      b('narrator', '付款日期添到单据下方，你把原件折好，单独放进夹层。', 'detail', 'contract'),
      b('zhou', '到时带这张来，咱们照着它核，省得各记各的。', 'medium', 'receipt', 0),
    ]], outcomeFocus: ['receipt', 'contract'],
    interaction: { object: "receipt", label: "对照两张付款单", line: "物品清单相同，金额和付款日期各写在不同的格子里。" },
  },
  s11: {
    scene: 'bookshop-night', cast: ['tang'],
    beats: [
      b('narrator', '门口有人放慢脚步，看过营业时间，又朝夜校的方向走去。', 'wide', 'lamp'),
      b('tang', '他们下课晚，想进来时总关门。能不能多开一个小时？', 'medium', 'book', 1),
      b('self', '卷帘门的拉杆还握在手里，楼上的灯也等着我去关。', 'detail', 'key'),
    ],
    outcomes: [[
      b('narrator', '九点四十分，门被轻轻推开；阿棠放下抹布，让出一把椅子。', 'wide', 'lamp'),
      b('tang', '可以只坐一会儿。那边有水，书看完放在桌上就好。', 'medium', 'cup', 2, 'warm'),
    ], [
      b('narrator', '门照原来的时间关上，阿棠把夜校课程表贴在柜台后面。', 'detail', 'letter'),
      b('tang', '先留着这张吧。以后想调整，再对着他们下课的点商量。', 'medium', 'lamp', 0),
    ]], outcomeFocus: ['lamp', 'letter'],
    interaction: { object: "lamp", label: "看一眼门外的灯", line: "夜校那边有人走来，玻璃上映着尚未关掉的灯。" },
  },
  s12: {
    scene: 'bookshop-day', cast: ['cheng', 'ning'],
    beats: [
      b('narrator', '熟客捏着一本新书，把五年前记住的价格又说了一遍。', 'medium', 'book'),
      b('ning', '还是这一本，怎么贵了这么多？以前我就在这里买过。', 'medium', 'receipt', 1),
      b('cheng', '进货单在柜台下面，运费也写着，拿给她看看吧。', 'detail', 'ledger', 0),
    ],
    outcomes: [[
      b('narrator', '你翻出进货单，夹进一个书签；熟客把书抱回胸前。', 'detail', 'book'),
      b('ning', '原来运费也变了。下次我把家里那几本旧书带来。', 'medium', 'receipt', 2),
    ], [
      b('narrator', '小票重新打出，熟客折好收进钱包，又指了指刚改的价。', 'detail', 'receipt'),
      b('ning', '下回还照这个吗？那我得先问好，免得又记错。', 'medium', 'book', 1),
    ]], outcomeFocus: ['book', 'receipt'],
    interaction: { object: "ledger", label: "抽出进货单", line: "纸张夹在柜台下面，书价和运费都有各自的一栏。" },
  },
  s13: {
    scene: 'printshop', cast: ['gu'],
    beats: [
      b('narrator', '画册封面刚拍好，原先分给三个人的页数推到了你面前。', 'wide', 'book'),
      b('gu', '展览开幕前得拿到成书。接的话，连续三个晚上都得留下。', 'medium', 'ledger', 0, 'tense'),
      b('self', '我翻了翻样张，最后一叠还很厚，工期表已经贴到墙上。', 'detail', 'contract'),
    ],
    outcomes: [[
      b('narrator', '交稿后，你在早餐铺坐了很久，手边的豆浆渐渐凉下来。', 'medium', 'cup'),
      b('self', '都交出去了。再坐一会儿，腿上那阵沉劲才会过去。', 'detail', 'receipt'),
    ], [
      b('narrator', '顾同事接走稿件，将页码重新清点，你把桌上的笔收进包里。', 'detail', 'book'),
      b('gu', '我来接着做。你早点回，今天这条街还没到开灯的时候。', 'medium', 'lamp', 1, 'warm'),
    ]], outcomeFocus: ['cup', 'book'],
    interaction: { object: "book", label: "掂一掂整本样张", line: "纸叠压住手心，墙上那张交稿表只留着三个晚上。" },
  },
  s14: {
    scene: 'printshop', cast: ['gu'],
    beats: [
      b('narrator', '样书上两组数字对不上，顾同事把付印时间指给你看。', 'detail', 'book'),
      b('gu', '新人说下一版再改。现在返工，奖金那边就来不及报了。', 'medium', 'ledger', 0, 'tense'),
      b('self', '我把两页挨着摊开，差的那一位数字还在纸上。', 'medium', 'book'),
    ],
    outcomes: [[
      b('narrator', '错误在付印前圈出来，桌边多了一杯纸杯装的咖啡。', 'detail', 'cup'),
      b('gu', '新人托我带的。味道可能一般，你先喝点热的。', 'medium', 'book', 1, 'warm'),
    ], [
      b('narrator', '文件按原样发出，你在待办栏里，给那页贴上醒目的标记。', 'detail', 'letter'),
      b('gu', '版本号我记下了。后面若要改，得先找到今天交的这一份。', 'medium', 'book', 2, 'tense'),
    ]], outcomeFocus: ['cup', 'letter'],
    interaction: { object: "book", label: "并排放好两组数字", line: "页码对齐后，差出的那一位仍然清楚地露在纸上。" },
  },
  s15: {
    scene: 'attic', cast: ['ning'],
    beats: [
      b('narrator', '新客户的来信说预算有限，合同写到本单金额就结束了。', 'detail', 'contract'),
      b('ning', '头一单便宜些，往后可以长期合作，咱们先互相试试。', 'medium', 'phone', 1),
      b('self', '我把纸翻到背面，没有找到往后那几单的工作量和价钱。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '稿件比约定多出十页，你数完页码，把手停在回复框上。', 'detail', 'book'),
      b('ning', '这几页也一起看了吧，下次补给你。我先把文件传过来。', 'medium', 'phone', 2),
    ], [
      b('narrator', '正式报价发出后没有回音，你把空出的时段填回日历。', 'detail', 'letter'),
      b('self', '这个晚上还在我这里。先把原先约好的事情做完。', 'medium', 'lamp'),
    ]], outcomeFocus: ['book', 'letter'],
    interaction: { object: "contract", label: "翻到合同最后一行", line: "本单金额之后是签名栏，没有再写以后的价钱。" },
  },
  s16: {
    scene: 'factory', cast: ['gu'],
    beats: [
      b('narrator', '新系统的培训通知贴在楼梯口，材料费下面写着周末日期。', 'wide', 'letter'),
      b('gu', '自愿报名，得自己腾一天。补贴的日期，要看通知下面。', 'medium', 'contract', 1),
      b('self', '我对着熟悉的流程表看了看，报名处的笔还没有收走。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你收好培训材料。第一次用新系统交稿，楼梯只跑了一趟。', 'wide', 'book'),
      b('gu', '这次格式对了。回执留着，后面办手续还得用到。', 'medium', 'receipt', 2, 'warm'),
    ], [
      b('narrator', '你沿旧流程交完稿，遇到陌生格式，把样张拿到同事桌前。', 'detail', 'book'),
      b('gu', '这儿得再转一次。我给你演示，你把步骤记下来。', 'medium', 'letter', 0),
    ]], outcomeFocus: ['receipt', 'book'],
    interaction: { object: "letter", label: "展开培训通知", line: "你把报名日期旁的折角压平，材料费和补贴时间都露出来。" },
  },
  s17: {
    scene: 'factory', cast: ['gu'],
    beats: [
      b('narrator', '财务把两个领取金额写在纸上，用笔尖分别点了点。', 'detail', 'receipt'),
      b('gu', '现在领要少一成，原日期的数也在这儿，签以前看清楚。', 'medium', 'ledger', 0),
      b('self', '月底那张账单放在包里，我摸到它折起的一条硬边。', 'medium', 'letter'),
    ],
    outcomes: [[
      b('narrator', '你在签收单上落笔，财务划过原日期那一栏，交还底联。', 'detail', 'receipt'),
      b('gu', '这次领过，原来的日期就不再发这一笔了，单子收好。', 'medium', 'ledger', 1),
    ], [
      b('narrator', '表格勾回原日期，你把对应的金额写进下一季预算。', 'detail', 'ledger'),
      b('self', '这笔先记在后面。眼前的账单，还得用眼前的钱安排。', 'medium', 'letter'),
    ]], outcomeFocus: ['receipt', 'ledger'],
    interaction: { object: "receipt", label: "指一指两个领取金额", line: "现在少拿一成的数字，与原日期的金额并排写着。" },
  },
  s18: {
    scene: 'attic', cast: ['gu', 'tang'],
    beats: [
      b('narrator', '同事发来夜间兼职的文件，页眉上写着每季的交付安排。', 'detail', 'phone'),
      b('gu', '家里就能做，不过晚饭以后得留出时间，你先看一季？', 'medium', 'contract', 1),
      b('self', '楼下椅子挪动的声音传上来，我把日历翻到晚上的那一格。', 'wide', 'lamp'),
    ],
    outcomes: [[
      b('narrator', '楼上还亮着灯，门锁转了一圈，阿棠把钥匙搁到门边。', 'detail', 'key'),
      b('tang', '下面收好了。你这份做完，记得也起来走一走。', 'medium', 'lamp', 2),
    ], [
      b('narrator', '你把合适的同事介绍过去，傍晚时桌上的碗还冒着热气。', 'wide', 'cup'),
      b('gu', '他已经接上了，谢啦。你也趁热吃，别又放凉。', 'medium', 'phone', 1, 'warm'),
    ]], outcomeFocus: ['key', 'cup'],
    interaction: { object: "contract", label: "看看晚间交付安排", line: "文件的工作时段正好盖住日历里原先空着的几格。" },
  },
  s19: {
    scene: 'coldstore', cast: ['lu'],
    beats: [
      b('narrator', '新厂房的灯一排排亮起，货架还空着，脚步声传出去很远。', 'wide', 'lamp'),
      b('lu', '第一批货还没到，电费已经走了。照片里看不出这么空。', 'medium', 'letter', 0),
      b('self', '他在门边停下，我把扩建报道和投产日期放到一处。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你将投产和实际回款写成相邻两栏，在空格里留下问号。', 'detail', 'ledger'),
      b('lu', '现有资料就这些。有的日期还没到，先别填成已经发生。', 'medium', 'letter', 2),
    ], [
      b('narrator', '成交记录添进账本，陆川还在指着新冷库介绍里面的分区。', 'detail', 'receipt'),
      b('self', '新库我看到了。客户实际什么时候付款，这里能查到吗？', 'medium', 'ledger'),
    ]], outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: "lamp", label: "看一排亮着的冷库灯", line: "灯光一路照进空货架，里面没有货箱挡住你的视线。" },
  },
  s20: {
    scene: 'archive', cast: [],
    beats: [
      b('narrator', '能源公司的检修计划摊在桌上，设备更新占去好几页。', 'detail', 'book'),
      b('self', '盈利没有大的变化，可要换的设备，仍然得用现金去买。', 'medium', 'ledger'),
      b('narrator', '你把分红安排翻到旁边，两个日期落在同一盏台灯下面。', 'detail', 'lamp'),
    ],
    outcomes: [[
      b('narrator', '你收好小额成交记录，把设备检修也写到分红日期旁边。', 'detail', 'receipt'),
      b('self', '这两项一起看。账户里多了持仓，检修的安排也还在。', 'medium', 'ledger'),
    ], [
      b('narrator', '检修计划放回资料夹，公告日期被圈出，成交页仍是空白。', 'detail', 'letter'),
      b('self', '下次披露时再翻出来。今天先把这些纸按顺序收好。', 'medium', 'book'),
    ]], outcomeFocus: ['receipt', 'letter'],
    interaction: { object: "book", label: "翻开设备检修表", line: "设备名称之后写着检修时间，没有随着盈利数字一同消失。" },
  },
  s21: {
    scene: 'old-street', cast: ['tang'],
    beats: [
      b('narrator', '百货店的新招牌才挂好，旁边的招聘纸被风掀起了一个角。', 'wide', 'window'),
      b('tang', '一下又开了三家，可老店门口的队，还是原来那么长。', 'medium', 'letter', 1),
      b('self', '我翻开报道，所有门店的收入合在一行，字印得很大。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你把新店与旧店的数字分别抄好，纸上渐渐排成两列。', 'detail', 'ledger'),
      b('tang', '分开才看得出来。刚才那张总表，我还以为每家都变好了。', 'medium', 'book', 2),
    ], [
      b('narrator', '新持仓记进账户。经过店门时，招聘的纸又被吹得翻过去。', 'wide', 'receipt'),
      b('self', '名字和门脸都熟悉了。柜台后面的数字，还得慢慢看。', 'medium', 'letter'),
    ]], outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: "letter", label: "看看新贴的招聘纸", line: "纸张下沿被风卷起，隔着玻璃还能看到老店的柜台。" },
  },
  s22: {
    scene: 'archive', cast: ['ning'],
    beats: [
      b('narrator', '验收单上的印章很清楚，后面却夹着尚未签完的付款流程。', 'detail', 'contract'),
      b('ning', '器材已经通过验收，客户满意。付款还要照流程往下走。', 'medium', 'letter', 0),
      b('self', '我翻过完成交付的报道，流程表上还有几处空白。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你给完成交付画一道线，在旁边用小字写下尚未到账。', 'detail', 'letter'),
      b('self', '这句话和那枚印章都是真的，付款也还在排队。', 'medium', 'contract'),
    ], [
      b('narrator', '股份买入后，你把验收单收进夹层，另标出预计付款日期。', 'detail', 'receipt'),
      b('ning', '流程表也一起留下吧。已签完的和还没签的，别弄混了。', 'medium', 'contract', 2),
    ]], outcomeFocus: ['letter', 'receipt'],
    interaction: { object: "contract", label: "翻到验收单背面", line: "付款流程夹在后面，几处等待签字的格子仍是空白。" },
  },
  s23: {
    scene: 'archive', cast: ['lu'],
    beats: [
      b('narrator', '通信公司的十年合同占了一整页，建设成本却缩在半段小字里。', 'detail', 'contract'),
      b('lu', '总金额挺大，大家都在转这份公告。你也拿去看看。', 'medium', 'phone', 1),
      b('self', '十年两个字很短，里面却有十年的支出和不同的付款时间。', 'medium', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你把总金额拆成十行，最初两行的支出比收入多出一截。', 'detail', 'ledger'),
      b('self', '先把每一年的安排看清，再把纸上的十行加起来。', 'medium', 'contract'),
    ], [
      b('narrator', '成交单压在公告后面，合同总额仍醒目地留在第一行。', 'detail', 'receipt'),
      b('lu', '后面的建设安排也留着。我转来那张图，没把小字截全。', 'medium', 'letter', 2),
    ]], outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: "contract", label: "展开十年付款安排", line: "折起的附页摊满桌面，建设成本先落在最前面的几年。" },
  },
  s24: {
    scene: 'old-street', cast: ['zhou'],
    beats: [
      b('narrator', '老周指着公告上的地块图，手指绕过一片厂房的轮廓。', 'detail', 'letter'),
      b('zhou', '土地是有不少，可银行这回条件紧，还在谈续期呢。', 'medium', 'contract', 0),
      b('self', '报价那栏很低，旁边的续贷结果却还没有落下来。', 'medium', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '你合上地块估价页，把可用现金那一栏保留原样。', 'detail', 'ledger'),
      b('zhou', '那就等银行的答复。我也再看看，别把估价当现钱用了。', 'medium', 'letter', 2),
    ], [
      b('narrator', '低价股份记入账户，你把续贷公告夹在成交单的前面。', 'detail', 'receipt'),
      b('self', '土地还在那里。关于银行的答复，这一格暂时得空着。', 'medium', 'contract'),
    ]], outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: "letter", label: "翻到续贷说明", line: "地块图后面，银行续期的结果还写着正在协商。" },
  },
  s25: {
    scene: 'attic', cast: ['lu'],
    beats: [
      b('narrator', '群里的收益截图接连弹出，屏幕被鲜亮的数字铺满了。', 'detail', 'phone'),
      b('lu', '好久不说话的同学也来问了：你是不是还在等？', 'medium', 'phone', 1),
      b('self', '我把一张截图放大，图里没有买入以前的那一段。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '群消息的提醒关掉，照片仍留在相册，桌上翻开的是公告。', 'detail', 'book'),
      b('self', '等读完这几页再说。刚才的合照，倒可以留着。', 'medium', 'letter'),
    ], [
      b('narrator', '你也截了成交后的屏幕，点开群聊，又把图片存回相册。', 'detail', 'phone'),
      b('self', '先留在这里吧。这张图，眼下只记下了一次买入。', 'medium', 'receipt'),
    ]], outcomeFocus: ['book', 'phone'],
    interaction: { object: "phone", label: "放大一张群聊截图", line: "图片从一段鲜亮的涨幅开始，更早的记录没有放进来。" },
  },
  s26: {
    scene: 'attic', cast: [],
    beats: [
      b('narrator', '涨幅榜出现了看过的公司，你把计算器里的数字又按了一遍。', 'detail', 'phone'),
      b('self', '要是当时买了……我把这句话写到一半，又回头去看报价。', 'medium', 'ledger'),
      b('narrator', '账本摊着，那笔从未发生的交易，在页边占了一大块地方。', 'detail', 'book'),
    ],
    outcomes: [[
      b('narrator', '你擦掉页边的假设，把实际成交记录重新排到这一页。', 'detail', 'ledger'),
      b('self', '这一行没有成交单。空出来以后，倒能看清我真的做过什么。', 'medium', 'receipt'),
    ], [
      b('narrator', '买入提示出现，你清空计算器，把假设收益换成本次实际成本。', 'detail', 'phone'),
      b('self', '这一次有记录了。刚才没赶上的那段，还是不能记进来。', 'medium', 'ledger'),
    ]], outcomeFocus: ['ledger', 'phone'],
    interaction: { object: "ledger", label: "找那笔假设的成交单", line: "你往前翻了几页，找不到能对应这行假设收益的凭证。" },
  },
  s27: {
    scene: 'attic', cast: ['xu'],
    beats: [
      b('narrator', '陌生消息附着几张旧预测，每张截图都从应验的那一天开始。', 'detail', 'phone'),
      b('xu', '前面这几次你都看到了，下一轮名单要付费，今晚可以加入。', 'medium', 'letter', 1),
      b('self', '我问有没有没猜中的记录，回复却换成了一张付款二维码。', 'detail', 'phone'),
    ],
    outcomes: [[
      b('narrator', '名单传来，你把几个眼熟的名字，与桌上的旧报纸放在一起。', 'detail', 'letter'),
      b('self', '这几个已经见报了。名单到了，纸上仍没有它们之后的答案。', 'medium', 'book'),
    ], [
      b('narrator', '又一份名单进了聊天框，你没有点付款，把公开报道存好。', 'detail', 'phone'),
      b('self', '旧预测留在记录里。没有日期以前的部分，就先不往后接。', 'medium', 'letter'),
    ]], outcomeFocus: ['letter', 'phone'],
    interaction: { object: "phone", label: "看看截图的日期边缘", line: "图片裁切得很齐，早于应验日期的那一段都不在画面里。" },
  },
  s28: {
    scene: 'old-street', cast: ['zhou'],
    beats: [
      b('narrator', '街角几个人挤在遮阳棚下，说完同一句话，又互相看了看。', 'wide', 'phone'),
      b('zhou', '他们说跌到这个价，已经不会再跌。你看，大家都这么想。', 'medium', 'ledger', 1),
      b('self', '我看向手机，报价旁边没有哪一行写着这里就是最低处。', 'detail', 'phone'),
    ],
    outcomes: [[
      b('narrator', '你把手机揣回去，老周抬头看看天，棚边滴下两滴水。', 'wide', 'window'),
      b('zhou', '这天像还得下。你先走吧，我去把外面的东西搬进来。', 'medium', 'cup', 2),
    ], [
      b('narrator', '买入提示弹出，几个人还在讨论底部，你把手里的零钱数齐。', 'detail', 'phone'),
      b('self', '这一笔已经记好了。回去买菜的零钱，还得单独放。', 'medium', 'receipt'),
    ]], outcomeFocus: ['window', 'phone'],
    interaction: { object: "phone", label: "再看一眼当前报价", line: "屏幕刷新了一次，街角的几个人还在重复刚才那句话。" },
  },
  s29: {
    scene: 'tea-room', cast: ['lu'],
    beats: [
      b('narrator', '交流会的入场说明折在信里，推荐人一栏写着陆川的名字。', 'detail', 'ticket'),
      b('lu', '我能带你进去，票和会费得自己付。想来就跟我说。', 'medium', 'letter', 1, 'warm'),
      b('self', '说明背面列着几场发言，没有写这一晚究竟能听到什么。', 'detail', 'book'),
    ],
    outcomes: [[
      b('narrator', '会场名片在杯子旁摞了一小叠，你把递来的签字页推回去。', 'detail', 'cup'),
      b('lu', '先听完也行，别急。散场以后我们从后门走，人少点。', 'medium', 'ticket', 2),
    ], [
      b('narrator', '公开材料寄到，晚饭后的灯光照着没有掌声的几页纸。', 'detail', 'letter'),
      b('lu', '能公开的都在这里了。你慢慢读，漏的页再告诉我。', 'medium', 'phone', 0),
    ]], outcomeFocus: ['cup', 'letter'],
    interaction: { object: "ticket", label: "展开入场说明", line: "推荐人的名字写好了，门票和会费则列在你要支付的一栏。" },
  },
  s30: {
    scene: 'archive', cast: [],
    beats: [
      b('narrator', '朋友只转来公告标题，订单增长的字样在屏幕上很醒目。', 'detail', 'phone'),
      b('self', '正文后面还有附注，写着其中一部分订单仍然可以取消。', 'medium', 'contract'),
      b('narrator', '你将页面拉到底，那段小字在空白边缘占了很窄的一条。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '你复制完整链接，连同容易漏看的那段原文，一起发回去。', 'detail', 'phone'),
      b('self', '标题没有放下的内容也在这里。先把这一段留全。', 'medium', 'letter'),
    ], [
      b('narrator', '成交后，你才把附注全部展开，取消条款比想的还要长。', 'detail', 'contract'),
      b('self', '页面还没到底。手先离开交易按钮，把后面接着读完。', 'medium', 'phone'),
    ]], outcomeFocus: ['letter', 'contract'],
    interaction: { object: "letter", label: "拉开公告附注", line: "你往下滑了几次，标题之外的取消条款渐渐铺满屏幕。" },
  },
  s31: {
    scene: 'bank', cast: ['yao'],
    beats: [
      b('narrator', '柜员把两个总额写在纸上，将付款日期分别圈了出来。', 'detail', 'receipt'),
      b('yao', '可以现在结清，也能拆到下一季。您看，合计在这两行。', 'medium', 'contract', 1),
      b('self', '我把纸挪近一点，下一季的日历页还压在文件夹里。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '凭证打出，你在已付栏里勾了一下，把日期也抄到旁边。', 'detail', 'receipt'),
      b('yao', '这联您收好。回去对账时，照上面的实际金额核就行。', 'medium', 'ledger', 2),
    ], [
      b('narrator', '你前后翻过两页日历，把下一季多出来的账单记在日期下。', 'detail', 'contract'),
      b('yao', '付款总额也请抄完整。到那一天，要付的是下面这一行。', 'medium', 'receipt', 0),
    ]], outcomeFocus: ['receipt', 'contract'],
    interaction: { object: "receipt", label: "对齐两个付款总额", line: "柜员把纸转向你，两个总额旁边各有一个不同的日期。" },
  },
  s32: {
    scene: 'old-street', cast: ['zhou'],
    beats: [
      b('narrator', '老周收到回款后找到你，拿出一张写过两个结算数的便条。', 'medium', 'letter'),
      b('zhou', '现在拿就少一点；要全额，还得再等一季，你来定。', 'medium', 'ledger', 1),
      b('self', '他把便条摊在两人中间，手指从今天移到下一季的日期。', 'detail', 'contract'),
    ],
    outcomes: [[
      b('narrator', '老周把现金数齐，等你清点完，才把剩下的纸收回包里。', 'detail', 'receipt'),
      b('zhou', '你再过一遍，别急。数对了，这一次咱们就结在今天。', 'medium', 'ledger', 2),
    ], [
      b('narrator', '结算日重新确认，你把便条夹回文件夹，没有在现金栏落笔。', 'detail', 'letter'),
      b('self', '先留在待结算这里。到账以前，这一笔还不能拿去付款。', 'medium', 'ledger'),
    ]], outcomeFocus: ['receipt', 'letter'],
    interaction: { object: "letter", label: "展开结算便条", line: "今天与下一季的两个金额，都写在同一张便条上。" },
  },
  s33: {
    scene: 'attic', cast: ['zhou'],
    beats: [
      b('narrator', '房东递来的单据上，预付优惠下面另写着中途搬走不退。', 'detail', 'contract'),
      b('zhou', '多预付一季能便宜两百。要是搬走，这笔就不退了。', 'medium', 'receipt', 0),
      b('self', '我看看窗边已经摆好的东西，又把视线移回付款日期。', 'wide', 'window'),
    ],
    outcomes: [[
      b('narrator', '你将标着不可退的收据夹进租约，手指压平新添的一道折痕。', 'detail', 'receipt'),
      b('zhou', '下季抵扣就按这张来。你留原件，我这边也记一份。', 'medium', 'contract', 1),
    ], [
      b('narrator', '房东仍在原来的日期旁写下金额，你把预付那张纸放回去。', 'detail', 'contract'),
      b('self', '按原来的节奏付。这笔现钱，先在账上留一阵。', 'medium', 'ledger'),
    ]], outcomeFocus: ['receipt', 'ledger'],
    interaction: { object: "contract", label: "看看不可退的那一行", line: "你把折起的下沿压平，中途搬走不退的字样露了出来。" },
  },
  s34: {
    scene: 'bookshop-day', cast: ['tang'],
    beats: [
      b('narrator', '货箱堆到门边，送货师傅在楼下等回单，车门一直没有关。', 'wide', 'receipt'),
      b('tang', '供货商把日子提前了，熟客订金要下季才到，差这一段。', 'medium', 'ledger', 0, 'tense'),
      b('self', '我看着原本留给房租的钱，又对了一遍手上的进货清单。', 'detail', 'contract'),
    ],
    outcomes: [[
      b('narrator', '阿棠另翻一页记这笔往来，没有把它加进当日营业额。', 'detail', 'ledger'),
      b('tang', '借的是这笔，我单独记。订金那边，也得再去确认日期。', 'medium', 'contract', 1),
    ], [
      b('narrator', '清单划掉两行，阿棠背过身打电话，把书名重新说了一遍。', 'detail', 'phone'),
      b('tang', '这几本得晚几天来取。我先通知等书的人，别让他们白跑。', 'medium', 'book', 2),
    ]], outcomeFocus: ['ledger', 'phone'],
    interaction: { object: "receipt", label: "核对送货回单", line: "送货日期已经到了，清单后面的订金日期却还在下一季。" },
  },
  s35: {
    scene: 'tea-room', cast: ['lu'],
    beats: [
      b('narrator', '陆川把一页行情递过来，杯子还没放稳，已经提到了本金。', 'detail', 'phone'),
      b('lu', '要不要借一笔一起买？机会就在这里，但报价没有保证。', 'medium', 'ledger', 1),
      b('self', '我把自己的可用数额写在纸角，手指停在那个数的后面。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '你把小额成交记录收好，没有在刚才的数额后再加一位。', 'detail', 'receipt'),
      b('self', '我就用这些。借款的事先不接，我得看得过来自己的账。', 'medium', 'ledger'),
    ], [
      b('narrator', '你把行情页推回去，陆川没有再递过来，手指转了转杯把。', 'detail', 'cup'),
      b('lu', '好，各人按各人的安排来。对了，那家面馆又换招牌了。', 'medium', 'window', 2, 'warm'),
    ]], outcomeFocus: ['receipt', 'cup'],
    interaction: { object: "ledger", label: "写下能承担的数额", line: "你在纸角写下一个数，把笔停住，没有继续往后添。" },
  },
  s36: {
    scene: 'attic', cast: [],
    beats: [
      b('narrator', '账单沿着桌边摆成一排，手机里的持仓页面还没有关。', 'wide', 'ledger'),
      b('self', '如果今天全换成现金，到底有多少？我第一次这样挨个算。', 'medium', 'phone'),
      b('narrator', '每张单据都写着日期，其中两张压在一起，露出相同的月份。', 'detail', 'receipt'),
    ],
    outcomes: [[
      b('narrator', '你按实际到期日重排单据，有两笔付款移开，不再挤在同一月。', 'detail', 'ledger'),
      b('self', '这张在后面，先不要跟这张一起算。今天能把顺序列清。', 'medium', 'receipt'),
    ], [
      b('narrator', '卖出记录落定，你把眼下能够支付的账单挪到桌子的另一边。', 'detail', 'receipt'),
      b('self', '持仓少了一点，现钱多了一点。哪张先到期，还得照着来。', 'medium', 'ledger'),
    ]], outcomeFocus: ['ledger', 'receipt'],
    interaction: { object: "receipt", label: "把账单按日期摊开", line: "被压在下面的单据挪出来，真正到期的先后渐渐分开。" },
  },
  s37: {
    scene: 'archive', cast: ['ning'],
    beats: [
      b('narrator', '客户指着收据上的空栏，另把一个更高的金额写在草稿上。', 'detail', 'receipt'),
      b('ning', '按这个数开，我多付你一笔。实际的支出，你已经知道了。', 'medium', 'contract', 1, 'tense'),
      b('self', '多出来的那段没有发生。我手里的底联，也会留下同一个数。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '客户拍下高开的收据，你撕下底联，看见相同金额压在掌边。', 'detail', 'receipt'),
      b('ning', '照片我存好了。这张我带走，留给你的那联别弄丢。', 'medium', 'phone', 2),
    ], [
      b('narrator', '你照实写好金额，客户划去旧草稿，把两张纸夹回资料袋。', 'detail', 'receipt'),
      b('ning', '那就按实际数。这份重开，我把前面那张一起收起来。', 'medium', 'contract', 0),
    ]], outcomeFocus: ['receipt', 'contract'],
    interaction: { object: "receipt", label: "对照实际支出", line: "底联上的空格等着落笔，真实支出单就放在它旁边。" },
  },
  s38: {
    scene: 'tea-room', cast: ['xu'],
    beats: [
      b('narrator', '确认单的姓名栏已经印好，熟人把笔递到你空着的手边。', 'detail', 'contract'),
      b('xu', '人今天不在，你替他写一下。原件不会有人专门来查的。', 'medium', 'letter', 1),
      b('self', '授权书并不存在。我翻过文件袋，里面只有这张确认单。', 'detail', 'contract'),
    ],
    outcomes: [[
      b('narrator', '别人的名字从笔尖落下，纸很薄，背面也透出同一行笔迹。', 'detail', 'contract'),
      b('xu', '我把这一份带走。笔给我吧，后面的材料我来装。', 'medium', 'letter', 2),
    ], [
      b('narrator', '你把笔帽扣回去，确认单留下；过了两天，本人带着证件到场。', 'detail', 'contract'),
      b('self', '请先核一下证件。这次姓名栏，留给应该签字的人自己写。', 'medium', 'receipt'),
    ]], outcomeFocus: ['contract', 'receipt'],
    interaction: { object: "contract", label: "查看签名与授权位置", line: "文件袋翻到底，也没有找到允许你代签的授权书。" },
  },
  s39: {
    scene: 'archive', cast: ['ning'],
    beats: [
      b('narrator', '你把原始凭证对着灯看，交易记录与客户的说法并不相符。', 'detail', 'receipt'),
      b('ning', '这份是唯一的原件吧？销毁就行，我会另付一笔费用。', 'medium', 'phone', 1, 'tense'),
      b('self', '她的消息还留在屏幕上。纸上的日期和金额，一个都没有变。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '你把原件送进碎纸机，细纸条落下，手机却又亮起转账通知。', 'detail', 'receipt'),
      b('ning', '费用已经转过去了。那张原件，你这边已经处理掉了吧？', 'medium', 'phone', 2, 'tense'),
    ], [
      b('narrator', '原件装进档案盒，你把盒扣合上，把文件位置记进目录。', 'detail', 'letter'),
      b('self', '费用不收。后续往来请写清楚，我会和这份原件一起保存。', 'medium', 'ledger'),
    ]], outcomeFocus: ['phone', 'letter'],
    interaction: { object: 'receipt', label: '核对唯一原件', line: '纸面透着台灯的暖光，交易日期与金额都没有涂改。' },
  },
  s40: {
    scene: 'archive', cast: ['xu'],
    beats: [
      b('narrator', '来客把证明摆正，材料上写着通过，实际的验收却没有完成。', 'detail', 'contract'),
      b('xu', '盖个章，费用就按说好的来。证明的内容我已经替你填好了。', 'medium', 'receipt', 1, 'tense'),
      b('self', '我看过项目记录。空着没做完的那几项，并不会因为纸变少。', 'detail', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '不实证明被复印、装袋，来客在封面贴上了你的联系方式。', 'detail', 'contract'),
      b('xu', '复印件也带上。后面有人问材料，就能照着这个联系你。', 'medium', 'phone', 2),
    ], [
      b('narrator', '你把未完成的项目逐项列好，压在那份写着通过的证明上。', 'detail', 'letter'),
      b('xu', '清单我收着。那我去联系负责验收的人，再把缺项问清楚。', 'medium', 'contract', 0),
    ]], outcomeFocus: ['contract', 'letter'],
    interaction: { object: "ledger", label: "翻看未完成的项目", line: "记录里还有缺项，旁边的证明却已经写着通过验收。" },
  },
  s41: {
    scene: 'archive', cast: [],
    beats: [
      b('narrator', '核查来电询问账目的日期，桌边的原始材料还没按顺序摆好。', 'detail', 'phone'),
      b('self', '电话里没有评价，也没有给我结果，只说要把原件带齐。', 'medium', 'letter'),
      b('narrator', '你翻开文件袋，几张早先的底联从夹层里慢慢滑了出来。', 'detail', 'receipt'),
    ],
    outcomes: [[
      b('narrator', '材料按日期装好，你逐项勾过目录，给自己另留一份完整副本。', 'detail', 'letter'),
      b('self', '哪些有原件，哪些还要补，都列在这里。先把材料带齐。', 'medium', 'contract'),
    ], [
      b('narrator', '咨询结束，桌上多了一张材料清单，你把它放回原文件袋。', 'detail', 'receipt'),
      b('self', '这些原件一份也没减少。问清楚以后，还是得逐一整理。', 'medium', 'letter'),
    ]], outcomeFocus: ['letter', 'receipt'],
    interaction: { object: 'phone', label: '记下来电要求', line: '你把音量调低，逐项抄下需要携带的材料。' },
  },
  s42: {
    scene: 'tea-room', cast: ['xu'],
    beats: [
      b('narrator', '中介将一笔借款挪进收入栏，报表右下角的总额立刻变大。', 'detail', 'ledger'),
      b('xu', '这样好看许多。钱反正进过账，你签一下，协作费另给。', 'medium', 'contract', 1),
      b('self', '本金要还，到期日期也没动。刚才那笔钱，并没有变成营业收入。', 'detail', 'receipt'),
    ],
    outcomes: [[
      b('narrator', '你在虚假报表上签名，借款合同仍压在另一边，没有改过一字。', 'detail', 'contract'),
      b('xu', '这页我带走。还款的合同你留着，那是另外一份。', 'medium', 'ledger', 2),
    ], [
      b('narrator', '报表重做，借款移回原栏，营业收入的总额跟着降下来。', 'detail', 'ledger'),
      b('self', '收入放这里，本金和到期日在那里。两笔都得看得见。', 'medium', 'contract'),
    ]], outcomeFocus: ['contract', 'ledger'],
    interaction: { object: 'ledger', label: '对照借款原栏', line: '新总额旁边，合同里的应还本金仍是原来的数字。' },
  },
  s43: {
    scene: 'bookshop-day', cast: ['cheng'],
    beats: [
      b('narrator', '旧目录夹着一张便条，程姨年轻时的字比现在更细、更密。', 'detail', 'letter'),
      b('cheng', '这一箱不挣钱，留给附近学校。旁边那几箱别混进来。', 'medium', 'book', 0, 'warm'),
      b('self', '我沿着书名找过去，箱子还在里面，纸绳已经松了一圈。', 'wide', 'ledger'),
    ],
    outcomes: [[
      b('narrator', '装好的书送出门，老师在签收处落笔，又翻开其中一本。', 'detail', 'receipt'),
      b('self', '有几本正好是学生在找的。回去以后，得把这话告诉程姨。', 'medium', 'letter'),
    ], [
      b('narrator', '库存逐项写清，路过的老师停下来，从目录上抄走几个书名。', 'detail', 'ledger'),
      b('self', '先把它们在哪里写准确。那张旧便条，我也一并夹好。', 'medium', 'book'),
    ]], outcomeFocus: ['receipt', 'ledger'],
    interaction: { object: 'letter', label: '抽出目录便条', line: '便条背面还有搬箱子的记号，墨水已经褪成浅灰。' },
  },
  s44: {
    scene: 'reading-room', cast: ['tang', 'ning'],
    beats: [
      b('narrator', '买书的人把绝版诗集放到柜台，书签仍夹在常被翻开的那页。', 'detail', 'book'),
      b('ning', '这个价可以吗？找了很久，今天总算在这里看到一本。', 'medium', 'receipt', 1),
      b('tang', '周五常有人来读它。书要是卖了，桌上这一格就空了。', 'medium', 'book', 0),
    ],
    outcomes: [[
      b('narrator', '你把诗集放回原位，阿棠轻轻理平书签，没有抽掉它。', 'detail', 'book'),
      b('tang', '就停在这里吧，下个人来读，还能接上上一回那几行。', 'medium', 'lamp', 2, 'warm'),
    ], [
      b('narrator', '扫描目录留在电脑里，买书的人包好诗集，又翻开书签那页。', 'detail', 'receipt'),
      b('ning', '这一页我也喜欢。我再看一眼，纸就不用重新包了。', 'medium', 'book', 1, 'warm'),
    ]], outcomeFocus: ['book', 'receipt'],
    interaction: { object: 'book', label: '翻到书签那一页', line: '纸页比别处松一些，页角留着不同人翻过的痕迹。' },
  },
  s45: {
    scene: 'attic', cast: ['cheng'],
    beats: [
      b('narrator', '程姨从南方发来钥匙扣的照片，问起你手里的备用钥匙。', 'detail', 'phone'),
      b('cheng', '钥匙还在吧？这只套着不硌手，我看着大小正好。', 'medium', 'key', 1, 'warm'),
      b('self', '钥匙躺在桌角。我已经很久没认真给她写这一季的事了。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '信写过两张纸，账目的事留到最后，你把信封慢慢封好。', 'detail', 'letter'),
      b('self', '窗边添了什么，最近谁常来，都写进去了，别漏掉邮票。', 'medium', 'key'),
    ], [
      b('narrator', '你拍下备用钥匙发过去，程姨紧接着传来几个钥匙扣的颜色。', 'detail', 'phone'),
      b('cheng', '还在就好。颜色你选一个，我再拿近些拍给你看。', 'medium', 'key', 2, 'warm'),
    ]], outcomeFocus: ['letter', 'phone'],
    interaction: { object: 'key', label: '找出备用钥匙', line: '备用的齿口磨得少些，你在灯下拍了一张清楚的照片。' },
  },
  s46: {
    scene: 'attic', cast: [],
    beats: [
      b('narrator', '一页账里挤着借款、工资和卖股收款，总额写得格外大。', 'detail', 'ledger'),
      b('self', '钱都进过账户，可它们不是同一回事。我翻开每笔对应的单子。', 'medium', 'receipt'),
      b('narrator', '零工的交稿提醒响起，那页账本被你用手掌压在桌上。', 'detail', 'phone'),
    ],
    outcomes: [[
      b('narrator', '三种收款分别列开，数字的合计没有变化，纸上却多出几行空隙。', 'detail', 'ledger'),
      b('self', '这笔需要还，这笔是工资。这一笔，是把原来的持仓卖掉。', 'medium', 'receipt'),
    ], [
      b('narrator', '稿件按时发出，你给混在一起的账页夹上便条，才合起本子。', 'detail', 'book'),
      b('self', '先标在这里。下次要分开整理，不能又只抄一个大总数。', 'medium', 'ledger'),
    ]], outcomeFocus: ['ledger', 'book'],
    interaction: { object: 'ledger', label: '摊开三种收款', line: '借据、工资条和成交单并排放着，抬头各不相同。' },
  },
  s47: {
    scene: 'pottery', cast: ['cheng'],
    beats: [
      b('narrator', '照片里的陶碗口沿歪得很厉害，旁边堆着程姨新买的材料。', 'detail', 'cup'),
      b('cheng', '再练练，还是换种釉呢？材料买了不少，总觉得该接着做。', 'medium', 'phone', 0),
      b('self', '我把照片放大，碗边那道起伏里，能看见她留下的手指印。', 'detail', 'cup'),
    ],
    outcomes: [[
      b('narrator', '你陪她列出下一炉要用的东西，程姨把一排空坯移开几只。', 'wide', 'ledger'),
      b('cheng', '那就少烧几个，先把温度试出来。没必要一回都送进去。', 'medium', 'cup', 1, 'warm'),
    ], [
      b('narrator', '赠与的款项发出，程姨把新釉的小袋子拍了张照，传回来。', 'detail', 'phone'),
      b('cheng', '拿这个再试一炉，出来什么样都拍给你看，歪的也不藏。', 'medium', 'cup', 2, 'warm'),
    ]], outcomeFocus: ['ledger', 'phone'],
    interaction: { object: 'cup', label: '看看碗口的起伏', line: '釉在凹处积深了，照片里的手指仍扶着碗底。' },
  },
  s48: {
    scene: 'noodle-shop', cast: ['lu'],
    beats: [
      b('narrator', '聚会的杯子碰了一圈，买房和换工作的话题终于转到你这里。', 'wide', 'cup'),
      b('lu', '书店最近怎么样？大家都在问，做下来，究竟赚不赚钱？', 'medium', 'ledger', 1),
      b('self', '我握着杯子想了一会儿，脑子里同时浮出数字和一张旧桌子。', 'detail', 'cup'),
    ],
    outcomes: [[
      b('narrator', '你讲起周五来读书的学生，陆川放下筷子，听到你讲完。', 'medium', 'book'),
      b('lu', '后来他挑的是哪一本？你刚才说他站了很久，我还以为没进门。', 'medium', 'cup', 2, 'warm'),
    ], [
      b('narrator', '你报出最好的账面数字，几个人点头，话题随后转到别处。', 'detail', 'ledger'),
      b('self', '回家想写的那件小事，还留在草稿里。今晚没找到接着说的空。', 'medium', 'phone'),
    ]], outcomeFocus: ['book', 'ledger'],
    interaction: { object: 'cup', label: '放下手里的杯子', line: '杯底碰桌的声音很轻，大家正等你接着说。' },
  },
  s49: {
    scene: 'bookshop-day', cast: ['tang', 'cao'],
    beats: [
      b('narrator', '后窗又渗进水，阿棠把最靠外的几本书抽出来，页边已经潮了。', 'detail', 'window'),
      b('cao', '外面的瓦熬过几场雨，里面这根木梁，这次得处理。', 'medium', 'contract', 0),
      b('self', '我伸手摸摸书角，窗台下那只旧盆又被翻了出来。', 'wide', 'book'),
    ],
    outcomes: [[
      b('narrator', '木梁修后，窗边的书排开晒了一下午，阿棠把书脊逐本扶正。', 'wide', 'book'),
      b('tang', '先别急着放回去。最里头这两本，再摊一会儿。', 'medium', 'window', 1),
    ], [
      b('narrator', '书先搬到里面，阿棠把空盆放回窗下，手掌探了一下盆沿。', 'detail', 'window'),
      b('tang', '下次下雨再来看。这个位置先别摆书，木梁的事也记着。', 'medium', 'ledger', 2, 'tense'),
    ]], outcomeFocus: ['book', 'window'],
    interaction: { object: 'window', label: '查看渗水的木梁', line: '指尖碰到一处湿木，水沿着旧纹路慢慢往下走。' },
  },
  s50: {
    scene: 'attic', cast: [],
    beats: [
      b('narrator', '借款到账以后，现金栏宽裕了许多，合同却还摊在原处。', 'detail', 'ledger'),
      b('self', '本金之外，每季要付息。我沿着条款，重新读到最后一行。', 'medium', 'contract'),
      b('narrator', '日历和行情页面同时开着，你的手在两者中间停了一会儿。', 'wide', 'phone'),
    ],
    outcomes: [[
      b('narrator', '你把到期日抄上日历，在还本日期前面，刻意留出一页空白。', 'detail', 'contract'),
      b('self', '这一页用来排资金。今天账上的这笔钱，有一天还得归还。', 'medium', 'ledger'),
    ], [
      b('narrator', '能源公司的持仓新增一笔，你把成交单与借款合同并排放好。', 'detail', 'receipt'),
      b('self', '两份记录都在这里。买入完成，合同上的计息安排也照常走。', 'medium', 'contract'),
    ]], outcomeFocus: ['contract', 'receipt'],
    interaction: { object: 'contract', label: '翻到计息条款', line: '你顺着本金、利率和到期日期，各画了一道短线。' },
  },
  s51: {
    scene: 'archive', cast: [],
    beats: [
      b('narrator', '持仓页面翻过几遍，你记得所有买价，却想不起最近一季收入。', 'detail', 'phone'),
      b('self', '每一笔是什么时候买的，我都说得出。最近的报表放哪儿了？', 'medium', 'ledger'),
      b('narrator', '资料夹里露出旧报价，最新公告还夹在后面，没有展开。', 'detail', 'letter'),
    ],
    outcomes: [[
      b('narrator', '旧价格被另一张纸盖住，你把公开报表拉到灯下，从收入栏读起。', 'detail', 'ledger'),
      b('self', '这一页先看完。熟悉的买价放在后面，暂时不用它来填答案。', 'medium', 'book'),
    ], [
      b('narrator', '你合上资料夹，旧买价仍圈在纸上，又添了一遍下次公告日期。', 'detail', 'letter'),
      b('self', '先等一等吧。日期是写下来了，那份报表还在夹层里。', 'medium', 'phone'),
    ]], outcomeFocus: ['ledger', 'letter'],
    interaction: { object: 'letter', label: '抽出最新公告', line: '压在底下的纸页比旧报价平整，页码还没有折过。' },
  },
  s52: {
    scene: 'bookshop-day', cast: ['tang'],
    beats: [
      b('narrator', '阿棠写好两张营业时间，一张留着晚九点，一张空出周日午后。', 'detail', 'letter'),
      b('tang', '这半天留给各自的生活，或者周五多开一晚。笔在这里。', 'medium', 'lamp', 1),
      b('self', '我把两张纸挨在门上比了比，玻璃外面，正好是午后的街道。', 'wide', 'window'),
    ],
    outcomes: [[
      b('narrator', '周日午后，门锁轻轻扣上；你走到街上，亮光照得人眯起眼睛。', 'wide', 'key'),
      b('tang', '原来这个点外面这么亮。那我也先走了，回来再见。', 'medium', 'window', 2, 'warm'),
    ], [
      b('narrator', '周五的最后一位客人离开，你和阿棠把散在桌上的杯子收成一排。', 'detail', 'cup'),
      b('tang', '这只还热着，小心点。我去关里面的灯，门口那盏留给你。', 'medium', 'lamp', 0, 'warm'),
    ]], outcomeFocus: ['key', 'cup'],
    interaction: { object: 'letter', label: '比一比两张时间表', line: '两张纸只差几个字，门里门外的时间却因此换了位置。' },
  },
};
