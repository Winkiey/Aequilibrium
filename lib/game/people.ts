import type {CastId} from './cinematic-content';
import {STORYBOARDS} from './cinematic-content';
import type {Game,ChoiceLog,StoryEvent} from './engine';
import type {Encounter} from './presentation';
import {CHAPTER_EVENTS,SIDE_EVENTS} from './stories';

export const PEOPLE:Record<CastId,{introduction:string;details:string[]}>={
 cheng:{introduction:'把泊灯书屋的钥匙交到你手里的人。她正在南方学做陶器，仍惦记着书架和那扇关不严的后窗。',details:['做事细致，会把生活里的小事另写一行。','她给你留下选择的时间，也在等待一个明确的答复。']},
 tang:{introduction:'熟悉店里每一张桌子和每一排书架。白天照看书屋，也在街尾印坊帮忙，手指常沾着一点蓝墨。',details:['想给街坊留一张可以坐下读书的桌子。','旧机器、订单和答应别人的交货日，都是他正在操心的事。']},
 lu:{introduction:'在港口工作的旧友。穿蓝色工装，消息来得快，也常把新港区的照片寄给你。',details:['说起熟人和新项目时，语气总会热一些。','你们既谈投资，也会聊起街角换了招牌的面馆。']},
 he:{introduction:'你的妹妹。会带饭盒过来，也会把一张车次截图留在聊天里。她希望有些周末可以一起度过。',details:['喜欢靠窗的位置，随身带着帆布包。','会做具体的安排，也在意你是否记得已经答应的事。']},
 zhou:{introduction:'住在老街的周伯，街坊也叫他老周。人情往来与一张借据，有时会一起来到你的门口。',details:['熟悉街上的人，也习惯替亲戚朋友搭个话。','涉及钱与签名时，你仍需要把日期和责任问清楚。']},
 gu:{introduction:'印刷厂的小顾。工作里要面对交付日期、奖金和那些不容易被看见的疏漏。',details:['常在样书、校样与交货单之间往返。','你们的往来会留下关于核对、返工和边界的记录。']},
 yao:{introduction:'在沿海银行办理业务的姚宁。她会核对日期，也会把需要补齐的材料重新列给你。',details:['柜台上的程序有时繁琐，但签名背后的责任不会因此消失。','和她有关的凭证与答复，都可以在这里回看。']},
 xu:{introduction:'替人联络账务与手续的许闻。茶室里的建议听起来省事，具体条件却需要逐句问清。',details:['会解释一份材料怎样写得更顺利。','在提供方便的人与最终签字的人之间，责任可能并不相同。']},
 cao:{introduction:'修屋顶的曹师傅。带梯子来，会先问清楚是整修还是局部补瓦，再把改项写进单据。',details:['材料、工期和付款日，都有具体的安排。','他说的维护问题，往往要等下一场雨才能看清。']},
 ning:{introduction:'与印刷和稿件往来的顾宁。报价、工作量与下一次合作，是你们谈话中常常出现的词。',details:['长期合作的承诺，需要和眼前这份合同一起看。','你怎样答复，会成为之后往来的起点。']},
};
const MAIN_TITLES=['雨夜续租','星期五的空椅子','没有盖章的订单','他们都已经上车','瓦匠来的那一天','南方寄来的陶碗','机器停下来的下午','没有谈行情的晚饭','一份不太好看的报表','有人愿意替你改日期','最后一个营业的夏天之前','把灯留到九点'];
export function historyEventId(h:ChoiceLog){return h.eventId??h.snapshot?.id??(h.title===MAIN_TITLES[h.quarter-1]||h.title==='再借我一个春天'?`main-${h.quarter}`:[...CHAPTER_EVENTS,...SIDE_EVENTS].find(e=>e.title===h.title)?.id);}
export function encounterPeople(people:Partial<Record<CastId,Encounter>>={},event:Pick<StoryEvent,'id'>,quarter:number){
 const next={...people};for(const id of STORYBOARDS[event.id]?.cast??[]){const previous=next[id];next[id]={quarter:previous?.quarter??quarter,events:[...new Set([...(previous?.events??[]),event.id])]};}return next;
}
export function recoverPeople(game:Game,people:Partial<Record<CastId,Encounter>>={}){let next=people;for(const h of game.history){const id=historyEventId(h);if(id)next=encounterPeople(next,{id},h.quarter);}return next;}
export function characterHistory(game:Game,id:CastId){return game.history.filter(h=>{const event=historyEventId(h);return event&&STORYBOARDS[event]?.cast.includes(id);});}
