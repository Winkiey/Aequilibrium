import type {StageChannel} from './staging';

export type VoiceTreatment='natural'|'telephone';

/** A phone prop alone is not a call. Follow the authored speaker channel. */
export const voiceTreatmentFor=(channel:StageChannel):VoiceTreatment=>channel==='phone'?'telephone':'natural';

/** Reuse the original decoded clip; only this performance passes the receiver.
 * Two gentle filters, without noise, echo, gain boost or extra media requests.
 * The caller owns source/output; this cleanup owns only the inserted filters.
 */
export function connectVoiceTreatment(ctx:BaseAudioContext,source:AudioNode,output:AudioNode,treatment:VoiceTreatment):()=>void{
 if(treatment==='natural'){source.connect(output);return()=>{};}
 const filters:BiquadFilterNode[]=[];
 const disconnect=()=>{for(const filter of filters)filter.disconnect();};
 try{
  // Web Audio low/highpass Q is in dB; the approved preview uses linear Q=.55.
  const receiverQDb=20*Math.log10(.55);
  const high=ctx.createBiquadFilter();filters.push(high);
  high.type='highpass';high.frequency.value=300;high.Q.value=receiverQDb;
  high.channelCount=1;high.channelCountMode='explicit';
  const low=ctx.createBiquadFilter();filters.push(low);
  low.type='lowpass';low.frequency.value=3500;low.Q.value=receiverQDb;
  source.connect(high);high.connect(low);low.connect(output);
  return disconnect;
 }catch(error){disconnect();throw error;}
}
