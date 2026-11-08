import type { Beat, CastId } from './cinematic-content';

const OPEN:Record<string,string>={'「':'」','“':'”','『':'』','（':'）'};
const CLOSE=new Set(Object.values(OPEN));

/** Split at a sentence/clause boundary, never between a quote and its closing mark. */
export function shortLines(text:string,max=44):string[]{
  const sentences:string[]=[];let current='',stack:string[]=[];
  for(const ch of Array.from(text.trim())){
    current+=ch;
    if(OPEN[ch])stack.push(OPEN[ch]);else if(stack.at(-1)===ch)stack.pop();
    if(!stack.length&&(/[。！？；]/u.test(ch)||(CLOSE.has(ch)&&/[。！？；][」”』）]$/u.test(current)))){
      sentences.push(current.trim());current='';
    }
  }
  if(current.trim())sentences.push(current.trim());
  return sentences.flatMap(sentence=>{
    if(Array.from(sentence).length<=max)return [sentence];
    const parts:string[]=[];let line='',quoteDepth=0;
    for(const ch of Array.from(sentence)){
      line+=ch;if(OPEN[ch])quoteDepth++;else if(CLOSE.has(ch))quoteDepth=Math.max(0,quoteDepth-1);
      if(!quoteDepth&&/[，；]/u.test(ch)&&Array.from(line).length>=Math.floor(max*.55)){parts.push(line);line='';}
    }
    if(line){if(parts.length&&Array.from(line).length<6)parts[parts.length-1]+=line;else parts.push(line);}
    return parts;
  }).filter(Boolean);
}

const PEOPLE:[string,CastId][]=[['程姨','cheng'],['阿棠','tang'],['陆川','lu'],['沈禾','he'],['老周','zhou'],['周伯','zhou'],['小顾','gu'],['姚宁','yao'],['许闻','xu'],['曹师傅','cao'],['顾宁','ning']];
export function responseDialogue(text:string,sender:string,cast:CastId[]):Beat[]{
  const result:Beat[]=[];let cursor=0;
  const narration=(s:string)=>result.push(...shortLines(s).map(text=>({speaker:'narrator' as const,text})));
  for(const match of text.matchAll(/[「“]([^」”]+)[」”]/gu)){
    const prefix=text.slice(cursor,match.index),speech=match[1];
    const attribution=prefix.match(/([^。！？]*?(?:回道|写道|问道|说道|回了消息|发来消息|说|问|答复|回复))[：:]\s*$/u);
    if(!attribution||speech.length<3)continue; // A quoted word such as 「好」 stays inside its narration.
    narration(prefix.slice(0,attribution.index));
    const who=attribution[1];
    const named=[...PEOPLE].reverse().find(([name])=>who.includes(name))?.[1];
    const speaker:Beat['speaker']=who.startsWith('你')?'self':named??PEOPLE.find(([name])=>sender.includes(name))?.[1]??(cast.length===1?cast[0]:'narrator');
    result.push(...shortLines(speech).map(text=>({speaker,text})));
    cursor=match.index!+match[0].length;
  }
  narration(text.slice(cursor));return result;
}
