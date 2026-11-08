/** Original editorial summaries. Only `quote` fields contain verbatim source text. */
export const READING_SOURCES={
 economics:{author:'Steven A. Greenlaw、David Shapiro、Daniel MacDonald',title:'Principles of Economics 3e',year:'2022',kind:'教材',note:'第2、6、16、17章',url:'https://openstax.org/details/books/principles-economics-3e'},
 fisher:{author:'Irving Fisher',title:'The Theory of Interest',year:'1930',kind:'著作',note:'时间偏好与投资机会',url:'https://www.econlib.org/library/YPDBooks/Fisher/fshToI.html'},
 dixit:{author:'Avinash K. Dixit、Robert S. Pindyck',title:'Investment under Uncertainty',year:'1994',kind:'著作',note:'不可逆投资与等待的价值',url:'https://press.princeton.edu/books/hardcover/9780691034102/investment-under-uncertainty'},
 accounting:{author:'Mitchell Franklin、Patty Graybeal、Dixon Cooper',title:'Principles of Accounting, Volume 1: Financial Accounting',year:'2019',kind:'教材',note:'第3、16章与财务分析附录',url:'https://openstax.org/books/principles-financial-accounting/pages/16-summary'},
 thaler:{author:'Richard H. Thaler',title:'Misbehaving: The Making of Behavioral Economics',year:'2015',kind:'著作',note:'结合作者2017年诺贝尔演讲核对心理账户与自我控制',url:'https://wwnorton.com/books/Misbehaving/'},
 kahneman:{author:'Daniel Kahneman',title:'Thinking, Fast and Slow',year:'2011',kind:'著作',note:'判断、参照点与损失；结合作者2002年诺贝尔演讲',url:'https://us.macmillan.com/books/9780374275631/thinkingfastandslow/'},
 keynes:{author:'John Maynard Keynes',title:'The General Theory of Employment, Interest and Money',year:'1936',kind:'著作',note:'第12章：长期预期',url:'https://www.hetwebsite.net/het/texts/keynes/gt/chap12.htm'},
 hayek:{author:'Friedrich A. Hayek',title:'The Use of Knowledge in Society',year:'1945',kind:'论文',note:'American Economic Review 35(4), 519–530',url:'https://www.aeaweb.org/aer/top20/35.4.519-530.pdf'},
 akerlof:{author:'George A. Akerlof',title:'The Market for “Lemons”: Quality Uncertainty and the Market Mechanism',year:'1970',kind:'论文',note:'结合作者回顾文章与2001年诺贝尔演讲',url:'https://www.nobelprize.org/prizes/economic-sciences/2001/akerlof/article/'},
 contracts:{author:'诺贝尔奖经济学委员会（Hart、Holmström研究综述）',title:'Contract Theory',year:'2016',kind:'研究综述',note:'诺贝尔奖委员会关于两位学者合同理论研究的介绍',url:'https://www.nobelprize.org/prizes/economic-sciences/2016/press-release/'},
 ostrom:{author:'Elinor Ostrom',title:'Governing the Commons',year:'1990',kind:'著作',note:'结合2009年诺贝尔演讲中的制度研究',url:'https://www.cambridge.org/core/books/governing-the-commons/7AB7AE11BADA84409C34815CC288CD79/listing'},
 reciprocity:{author:'Ernst Fehr、Simon Gächter',title:'Fairness and Retaliation: The Economics of Reciprocity',year:'2000',kind:'论文',note:'Journal of Economic Perspectives 14(3), 159–181',url:'https://www.aeaweb.org/articles?id=10.1257%2Fjep.14.3.159'},
 zero:{author:'Kristina Shampanier、Nina Mazar、Dan Ariely',title:'Zero as a Special Price: The True Value of Free Products',year:'2007',kind:'论文',note:'Marketing Science 26(6), 742–757',url:'https://pubsonline.informs.org/doi/abs/10.1287/mksc.1060.0254'},
} as const;
export type ReadingChapter={id:string;title:string;subtitle:string;terms:string[];summary:string[];exampleTitle:string;example:string[];question:string;sources:(keyof typeof READING_SOURCES)[];quote?:{text:string;translation:string;source:keyof typeof READING_SOURCES;locator:string}};
export const READING_CHAPTERS:ReadingChapter[]=[
 {id:'choice',title:'同一笔钱，同一个晚上',subtitle:'稀缺、机会成本与边际决策',terms:['机会成本','边际决策','比较优势','人力资本','隐含成本'],summary:[
  '《经济学原理》从有限的预算与时间出发。选择的成本，不只有付出去的钱，还包括因此放弃的最佳可行替代。把所有错过的可能相加，会夸大机会成本；应比较真正能选择的下一种安排。',
  '边际决策问的是：从现在起，多做一点，还会增加什么收益与成本？它不要求为已经发生的投入辩护。比较优势则提醒我们，谁更适合做一件事，应比较各自放弃的机会，而非只看谁绝对做得更快。',
  '培训与休息也会改变未来的选择条件。学习占用今天的时间，可能换来以后的效率；一份“免费”的东西，也可能需要运输、整理和存放。报价为零，并不意味着资源成本为零。'],exampleTitle:'编者例子 · 一晚上的两种用途',example:[
  '假如你今晚可以接到一份确定支付800元的稿件，也可以花同一个晚上参加一次读书会。参加读书会放弃的可行收入是800元，而不是所有想象中可能赚到的钱。',
  '如果没有稿件可接，不能仍把800元当成这次出门的真实机会成本。至于读书会带来的关系、休息和乐趣，需要由你自己衡量。'],question:'下一次作决定时，先写下：我真正放弃的、最好的另一种可行安排是什么？',sources:['economics','zero']},
 {id:'time',title:'今天的一元，和明天的一元',subtitle:'贴现、现在偏差与不可逆承诺',terms:['贴现','资金时间价值','现在偏差','期权价值','延迟维护'],summary:[
  '费雪把利息放在跨期收入的交换中讨论：人们怎样评价现在与未来的消费，也受投资机会影响。贴现是把不同时点的收支放到可比较的尺度上，不是断言未来不重要。',
  '短期急用钱、回款可能落空、需要保留流动性，都可能使人更重视眼前现金；现在偏差则指临近眼前时，偏好可能额外倾向即时满足。两者不能仅凭一次提前收款就混为一谈。',
  '迪克西特与平狄克讨论了不可逆投入下等待的价值：不确定时，保留稍后再决定的机会可能有价值。但等待也可能失去经营收入、工期或维护机会，不能因此推导出永远不投入。'],exampleTitle:'编者例子 · 一张有日期的收据',example:[
  '本季付1800元，或下季付2000元，差额200元是取得延期所付出的隐含成本。相对本季本应付出的1800元，一季约为11.1%；它不是年利率。',
  '如果延后修缮会扩大损坏，还要把额外维修、停业与不便放进比较。只比较两张付款单上的金额，会漏掉这部分跨期成本。'],question:'除了金额，我有没有把到账概率、付款日期和等待的代价一起写下来？',sources:['fisher','dixit','thaler']},
 {id:'liquidity',title:'账面上有，手边却没有',subtitle:'流动性、营运资本与期限错配',terms:['流动性','营运资本','期限错配','被动变现','流动性溢价'],summary:[
  '流动性关心资产能否及时、以较小损失换成可支付的钱。教材把它与预期收益、风险分开考察：一项长期资产可以有价值，却不一定能用来支付明天的账单。',
  '营运资本的常见会计口径是流动资产减流动负债。但库存、预付款和应收款的兑现速度不同，所以一个正数也不能代替逐日或逐季的现金安排。',
  '用很快到期的钱支持很晚回收的投入，会形成期限压力。若不得不在市场低迷时卖出，就可能同时付出折价与交易费用。流动性有价值，也意味着为保留它可能放弃一部分收益。'],exampleTitle:'编者例子 · 明天要付的材料款',example:[
  '你拥有一批标价两万元的书，明天却要付五千元材料款。只有能在期限前卖出并到账的部分，才可以用于这笔付款。',
  '一张下季大概率回收的借据，也不是今天的现金。先列日期，再列可动用金额，比把所有资产合成一个总数更能看清压力。'],question:'如果下一笔收入推迟一季，我是否仍能按约付款？',sources:['economics','accounting']},
 {id:'business',title:'一家公司，有几种不同的数字',subtitle:'营收、利润、现金流与资本开支',terms:['应计利润','经营现金流','资本开支','股利','再投资','规模幻觉'],summary:[
  '会计教材区分收入确认与现金收付：已经提供的服务可能形成收入，但钱仍未收回。收入减去有关成本费用才形成利润；营收本身既不是利润，也不是可支配现金。',
  '现金流量表分别观察经营、投资和筹资活动。经营现金流是日常业务中的净现金流；购建设备常涉及投资活动；借款、还本等属于筹资活动。借来的钱到账，并不等于经营赚到了钱。',
  '企业可以把资金再投入，也可以向股东分配。扩建、开店和签长期合同都需要问：前期付多少，何时回收，还要承担什么义务？更大的规模与更高的分红，单独看都不能证明经营更好。'],exampleTitle:'编者例子 · 一份已经交付的订单',example:[
  '交货十万元、客户下季付款时，可能已经确认收入，却还没有对应现金到账。另一方面，经营现金净额已扣去多类现金流出，不能简单用“营收减经营现金流”算未收货款。',
  '比较不同公司，也要考虑行业、规模与时间。不要拿一家公司的绝对现金流金额，直接判断它一定优于另一家。'],question:'这个好消息改善的是收入、利润、现金到账，还是仅仅扩大了投入？',sources:['accounting','economics']},
 {id:'risk',title:'借来的钱，也有自己的日期',subtitle:'杠杆、融资成本与风险预算',terms:['杠杆','融资成本','风险预算','手续费','成交冲击'],summary:[
  '股票代表企业所有权的一部分；债务则通常带有约定的利息与还本责任。借款进入账户时，现金增加，负债也增加，因此不会仅凭到账就创造同额净财富。',
  '杠杆扩大了由自己承担的资产敞口。当资产价格下跌时，债务不会同步缩小；到期压力还可能使人失去等待的余地。预期回报高于利率，也不代表未来每次都能覆盖成本。',
  '手动交易还包含手续费与成交条件带来的摩擦。频繁换手需要先跨过这些成本。风险预算既要看一次可能亏多少，也要看这次亏损会不会影响必要支出与已经接受的约定。'],exampleTitle:'游戏内的简化合同',example:[
  '本作一笔借款本金两万元，每季利率2%，计息四次。按合同持有到期，四次利息共1600元；这只是本作的定额合同，不是现实中所有贷款的计费方式。',
  '借钱后股票上涨，收益归于持有者；股票下跌，本金与利息仍要按约承担。先想清楚不利情形下怎样付款，再看理想情形能赚多少。'],question:'如果价格先跌、回款又推迟，我是否还能履行这份合同？',sources:['economics','keynes']},
 {id:'mental',title:'钱上的标签，与过去的投入',subtitle:'心理账户、沉没成本与自我控制',terms:['心理账户','沉没成本','承诺升级','自我控制','零价格效应'],summary:[
  '塞勒的研究把一些与理想化理性模型不符的行为放回经济分析。心理账户是一个例子：人们会给同样的钱贴上工资、奖金或投资收益等标签，分别制定花费规则，却可能忽略整体现金状况。',
  '已经无法收回的投入是沉没成本。是否再投入，应比较新增的成本、可行回收与退出条件。继续并不必然错误；关键是理由来自未来信息，还是只想证明此前没有白费。',
  '零价格研究发现，部分实验中的“免费”会额外提高吸引力。这是关于特定选择情境的证据，不能推成所有人面对免费都会失去判断。实际比较时，还要计入整理、运输与占用空间。'],exampleTitle:'编者例子 · 已经修过一次的机器',example:[
  '旧机器此前花了两万元，修好仍需一万二。前两万元若无法回收，就不该仅因“已经花了这么多”而追加。',
  '但若有可靠的新订单、可核对的回款与更便宜的修复方案，继续也可能合理。应比较从此刻开始的几条路径，而非把退出当作对过去的判决。'],question:'如果我今天第一次遇见这个项目，还会愿意付出这笔新增投入吗？',sources:['thaler','zero']},
 {id:'reference',title:'旧买价，为什么一直留在眼前',subtitle:'锚定、参照依赖与损失厌恶',terms:['锚定','损失厌恶','参照依赖','处置效应','社会比较','反事实后悔'],summary:[
  '卡尼曼与特沃斯基的研究显示，风险选择常受参照点影响。同一结果被理解为获得或损失时，人们的选择可能不同；损失厌恶是许多情境中，损失比同量收益更有分量的倾向。',
  '锚定使先看到的数字影响后续判断。旧买价、历史高点和别人的收益，都可能成为参照。但历史报价不会迫使未来价格回到那里，价格低也不是继续下跌的逻辑禁区。',
  '处置效应、错失恐惧与反事实后悔，可以帮助描述一些重复行为，却不能仅凭一次卖出或追加就给人贴标签。需要看当时的信息、约束和多次决策。'],exampleTitle:'编者例子 · 同样的六千元',example:[
  '甲以一万元买入，现在值六千；乙刚刚用六千买入。若从今天起拥有同样的持仓、信息与约束，他们面临的未来收益机会并不会因为各自旧买价不同而自动不同。',
  '实际税费、其他资产、现金需求等仍可能不同，所以这只是用来辨认参照点的比较，不是要求每个人都做同一笔交易。'],question:'我希望价格回去，是因为新事实，还是因为那个数字能让我好受一点？',sources:['kahneman','thaler']},
 {id:'information',title:'消息很多，知道的仍然有限',subtitle:'分散知识、群体判断与选择性展示',terms:['信息成本','羊群行为','确认偏差','幸存者偏差','信息框架','熟悉性偏差'],summary:[
  '哈耶克讨论的知识分散在不同人的具体处境中，不能假定一份完整资料已经集中在某个人手上。熟悉当地经营的人能提供线索，但这并不使任何人自动拥有完整的未来答案。',
  '凯恩斯在长期预期一章中区分了估计企业长期回报，与猜测市场上其他人接下来怎样估值。后者会使参与者不断观察彼此，个人判断也可能受名声与群体惯例约束。',
  '收益截图只展示被挑出来的结果；成功预测名单可能漏掉失败者。确认偏差又使人更容易收集支持旧想法的材料。来源、样本与缺失的信息，和消息本身一样需要核对。'],exampleTitle:'编者例子 · 只有中奖者说话的群聊',example:[
  '群里十张盈利截图，无法告诉你所有参与者的收益分布。还需要知道有多少人没有发图、投入多大、承担了什么风险。',
  '熟人的经验值得听，但不替代现金流、合同和价格的核对。新信息可能有价值，也可能只是同一传闻被重复了很多次。'],question:'我正在核对事实，还是只在搜集同意我的声音？',sources:['hayek','keynes','kahneman'],quote:{text:'it is a problem of the utilization of knowledge not given to anyone in its totality.',translation:'问题在于，如何利用并未完整交到任何一个人手里的知识。',source:'hayek',locator:'第一节，AER 第520页；原文短引，译文为编者译'}},
 {id:'credit',title:'一张借据，写不下所有未知',subtitle:'信息不对称、逆向选择与信用风险',terms:['信息不对称','逆向选择','信用风险','风险边界','不完整合同'],summary:[
  '阿克洛夫的“柠檬市场”研究指出，当交易双方对质量掌握的信息不同，买方的报价与卖方愿意留下来的质量可能相互影响，甚至使好质量难以进入交易。信息不足会改变市场本身。',
  '逆向选择通常关心交易前难以观察的特征怎样影响参与者的筛选；道德风险更常关注交易后难以观察的行为与激励。两者有联系，但不是所有不守约都叫逆向选择。',
  '订单、借据和熟人介绍各有信息价值，却不等于有能力按期回款。合同要写清金额、日期、条件与责任，也仍会留下无法穷尽的状态。核对材料降低不确定性，不能把风险消除。'],exampleTitle:'编者例子 · 接近零利润的第一单',example:[
  '客户承诺以后长期合作，却不把后续订单写进合同。低报价可能吸引真正受预算约束的客户，也可能筛来不断追加工作量的人。',
  '所以要分别核对眼前工作量、支付能力与可执行条件，不能仅因“认识介绍人”就把信用风险归零。担保、出借和提供帮助也应分别确认。'],question:'对方知道、而我还不知道的关键条件是什么？',sources:['akerlof','contracts']},
 {id:'incentives',title:'谁得便利，谁承担后来',subtitle:'代理关系、短期激励与证据责任',terms:['代理问题','道德风险','激励扭曲','会计信号','外部化成本','责任不可逆性'],summary:[
  '合同理论研究激励与信息限制下的安排。代理人替别人办事时，若自己的报酬只跟一项短期指标绑定，就可能忽略难以核实、却影响长期结果的质量与责任。',
  '写下更多指标，并不必然解决问题。难以完整约定的任务，还涉及判断权、控制权以及遇到新情形时由谁决定。一个可见的奖金，不能代表工作价值的全部。',
  '虚构记录会破坏别人据以判断的信息，并可能把成本留给未参与决策的人。了解激励，不能代替对行为本身的责任；对方声称“只是补手续”，也不会改变记录是否真实。'],exampleTitle:'编者例子 · 只奖励按时交付',example:[
  '假如奖励只看是否赶上日期，核对错误和返工便显得像妨碍奖金的成本。但收货人、之后的同事和使用者，仍会承担没有被修复的问题。',
  '更完整的安排需要考虑质量、可追溯记录与谁有权停下交付。这不是把所有风险都转给某个签字人，就能完成的设计。'],question:'这个安排里，拿到即时好处的人与承担延后成本的人，是同一个人吗？',sources:['contracts','reciprocity','accounting']},
 {id:'commons',title:'长桌边，总得有人收拾',subtitle:'公共收益、互惠与自我治理',terms:['公共收益','公共物品','社会资本','互惠','集体行动','私人支付'],summary:[
  '奥斯特罗姆研究真实共同资源的制度，说明合作不能只在市场与国家的二选一中理解。清楚的边界、参与制定规则、监督与处理冲突的办法，都可能影响长期合作。',
  '公共物品与共同池资源需要区分：前者通常强调非竞争与难排他，后者则有资源被使用后减少的竞争性。一张有座位限制的书店长桌，并不因此自动成为严格意义上的纯公共物品。',
  '互惠研究提示，有人愿意回应公平，也会抵制不公平；明确的金钱激励有时会改变自愿合作。但善意不会自动提供场地、时间和清洁劳动，可持续的共同活动仍需要分担。'],exampleTitle:'编者例子 · 不收费的周五晚间',example:[
  '活动不售票，并不代表无人付出。店主提供灯与空间，店员留下收拾，来客可能带书、带茶，或在下一次帮助整理。',
  '如果总由一个人承担，热闹也可能耗尽。把轮值、容量和费用说清楚，不一定破坏关系，有时正是让它持续的方法。'],question:'这件大家受益的事，谁在付钱、出力，谁能参与决定规则？',sources:['ostrom','reciprocity','economics']},
 {id:'life',title:'最后一页，不只有资产总额',subtitle:'效用、闲暇与多维生活',terms:['多维效用','闲暇','劳动供给','关系成本','使用价值','非货币回报'],summary:[
  '效用是经济学描述选择满足程度的一种工具，不等于账户金额，也不能拿两个人的“效用数字”直接比较幸福。时间、休息、关系与自主安排，都可能进入一个人的偏好。',
  '劳动收入与闲暇之间存在取舍，但并不意味着多工作或多休息永远更好。约束不同、身体状态不同、已有承诺不同，同一份报酬的意义也会改变。',
  '使用价值与交换价值有别：一本旧书可能卖不了多少钱，却对读过它的人很重要。承诺还涉及他人的安排。复盘应同时核对账目与发生过的事，而不是用一个结果替整段生活判分。'],exampleTitle:'编者例子 · 没有做成交易的下午',example:[
  '一个下午没有买卖，不能单凭后来涨跌判断它浪费了。它也许用来核对资料、休息，或者与人完成已经答应的安排。',
  '反过来，有温度的理由也不会免除付款责任。把收入、生活和关系放在同一张时间表上，才能更具体地理解取舍。'],question:'如果最终只记一个财富数字，我会遗漏这三年里的哪些重要事情？',sources:['economics','reciprocity','keynes'],quote:{text:'it is better for reputation to fail conventionally than to succeed unconventionally.',translation:'就声誉而言，循常规而失败，胜过不循常规而成功。',source:'keynes',locator:'第12章第五节；原文短引，译文为编者译'}},
];

/** Internal coverage index, not shown beside live story choices. */
export const EVENT_READING:Record<string,string[]>={
 'chapter-2':['choice','life'],'chapter-4':['life','credit'],'chapter-7':['incentives','business'],'chapter-10':['commons','incentives'],
 s53:['time','life'],s54:['choice','life'],s55:['mental','choice'],s56:['commons'],s57:['incentives','credit'],s58:['life'],s59:['commons','information'],s60:['information','incentives'],
 'main-1':['choice'],'main-2':['choice','life'],'main-3':['credit','business'],'main-4':['information'],'main-5':['liquidity'],'main-6':['time'],'main-7':['mental'],'main-8':['choice','life'],'main-9':['reference'],'main-10':['incentives'],'main-11':['choice','mental'],'main-12':['life'],
 s01:['choice','life'],s02:['time'],s03:['mental','life'],s04:['time','life'],s05:['choice','life'],s06:['commons','life'],s07:['commons'],s08:['credit'],s09:['mental','choice'],s10:['time'],s11:['choice','life'],s12:['reference'],s13:['choice','life'],s14:['incentives'],s15:['credit'],s16:['choice','time'],s17:['time','liquidity'],s18:['choice'],s19:['business'],s20:['business'],s21:['business','information'],s22:['business'],s23:['business','time'],s24:['liquidity'],s25:['information'],s26:['reference','information'],s27:['information'],s28:['reference'],s29:['commons','credit'],s30:['information'],s31:['time'],s32:['liquidity','credit'],s33:['time','liquidity'],s34:['liquidity'],s35:['risk'],s36:['liquidity'],s37:['incentives'],s38:['incentives'],s39:['incentives'],s40:['credit','incentives'],s41:['credit','incentives'],s42:['business','incentives'],s43:['commons'],s44:['life'],s45:['life','commons'],s46:['mental','business'],s47:['mental'],s48:['reference'],s49:['time'],s50:['risk'],s51:['reference'],s52:['life','choice'],
};
