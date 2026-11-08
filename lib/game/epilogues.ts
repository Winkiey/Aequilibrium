import type { Beat, CastId, SceneId, VisualScript } from './cinematic-content';
import { ending, type Game } from './engine';
import { shortLines } from './visuals';

type Epilogue = {scene:SceneId;cast:CastId[];beats:Beat[]};
export const EPILOGUES:Record<string,Epilogue>={
 '执念入狱':{scene:'quiet-room',cast:[],beats:[{speaker:'narrator',text:'门外的脚步远了。桌上只有一封已经拆开的信。',camera:'wide'},{speaker:'self',text:'我曾经以为，只要再改一次日期，就能把所有事补上。',camera:'detail',focus:'letter'},{speaker:'narrator',text:'窗上的光慢慢移过桌沿。今天，你终于没有改动它。',camera:'medium'}]},
 '重新开始':{scene:'attic',cast:['he'],beats:[{speaker:'narrator',text:'纸箱没有装满。你把最后一本书平放进去。',camera:'wide'},{speaker:'he',text:'先吃饭吧。明天的事，明天再一件件做。',pose:1,camera:'medium'},{speaker:'self',text:'你点点头，把钥匙收进了衣袋。',camera:'detail',focus:'key'}]},
 '传奇操盘手':{scene:'tea-room',cast:['lu'],beats:[{speaker:'narrator',text:'采访约在周二下午。记者迟到了一刻钟。',camera:'wide'},{speaker:'lu',text:'他们都等着听你说，哪一次买得最漂亮。',pose:1,camera:'medium'},{speaker:'self',text:'你想了很久，先说起一个什么也没有买的下午。',camera:'detail',focus:'cup'}]},
 '激流勇退':{scene:'coastal-train',cast:['he'],beats:[{speaker:'narrator',text:'车开了。手机留在口袋里，没有亮。',camera:'wide'},{speaker:'he',text:'过了这个弯，应该就能看见海。',pose:1,camera:'medium'},{speaker:'self',text:'你把车票夹进书里，向窗边坐近了一点。',camera:'detail',focus:'ticket'}]},
 '守住一盏灯':{scene:'bookshop-day',cast:['cheng','tang'],beats:[{speaker:'narrator',text:'程姨推门进来时，门铃还是从前的声音。',camera:'wide'},{speaker:'cheng',text:'不用给我看账本。我今天只是来坐坐。',pose:1,camera:'medium'},{speaker:'tang',text:'靠窗的位置留着呢。水刚烧好。',pose:1,camera:'detail',focus:'cup'}]},
 '另一种富有':{scene:'reading-room',cast:['tang','zhou'],beats:[{speaker:'narrator',text:'星期五，长桌两侧又添了两把不一样的椅子。',camera:'wide'},{speaker:'zhou',text:'我带了茶叶。下次轮到谁，咱们慢慢排。',pose:1,camera:'medium'},{speaker:'tang',text:'门先别关，还有个人在路上。',pose:1,camera:'detail',focus:'lamp'}]},
 '独自抵达':{scene:'bookshop-night',cast:[],beats:[{speaker:'narrator',text:'你把清好的账目放在桌上，伸手去拿电话。',camera:'wide'},{speaker:'self',text:'号码还在。只是第一句话，想了很久。',camera:'detail',focus:'phone'},{speaker:'narrator',text:'雨停了一会儿。你拿起笔，先写下一个称呼。',camera:'detail',focus:'letter'}]},
 '平淡一生':{scene:'old-street',cast:['he'],beats:[{speaker:'narrator',text:'周末的敲门声，把你从书页里叫了出来。',camera:'wide'},{speaker:'he',text:'菜市场那边新开了家面馆。一起去吗？',pose:1,camera:'medium'},{speaker:'self',text:'你把书反扣在桌上。说，好。',camera:'detail',focus:'book'}]},
};
export function epilogueScript(game:Game,name=ending(game).name,recordedText?:string):VisualScript{
 const e=EPILOGUES[name];if(!e)throw new Error(`缺少结局分镜：${name}`);
 return{...e,beats:[...e.beats,...shortLines(recordedText??(ending(game).name===name?ending(game).text:'这也是澄港的一种后来。')).map(text=>({speaker:'narrator' as const,text,camera:'wide' as const}))],outcomes:[[],[]],outcomeFocus:['letter','book'],interaction:{object:'window',label:'再看一眼窗外',line:'光从窗边移过。你在这里，安静地停留了一会儿。'}};
}
