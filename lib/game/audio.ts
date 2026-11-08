export class RoomAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckLevel=1;
  private rain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private seasonIndex=0;
  private music: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private notes = 0;
  private on = false;
  private rainLevel = 0.35;
  private musicLevel = 0.22;
  async start() {
    if (!this.context) {
      const ctx = new AudioContext(); this.context = ctx;
      const master = ctx.createGain();this.master=master;master.gain.value = 0.5*this.duckLevel; master.connect(ctx.destination);
      this.rain = ctx.createGain(); this.rain.gain.value = 0; this.rain.connect(master);
      this.music = ctx.createGain(); this.music.gain.value = 0; this.music.connect(master);
      const buffer = ctx.createBuffer(2, ctx.sampleRate * 5, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const data = buffer.getChannelData(c); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1500; filter.Q.value = 0.4;
      this.filter=filter;this.season(this.seasonIndex);
      noise.connect(filter); filter.connect(this.rain); noise.start();
    }
    await this.context.resume(); this.on = true; this.levels(this.rainLevel, this.musicLevel);
    if (!this.timer) { this.note(); this.timer = setInterval(() => this.note(), 8500); }
  }
  levels(rain: number, music: number) {
    this.rainLevel = rain; this.musicLevel = music;
    if (!this.context || !this.on) return;
    this.rain?.gain.setTargetAtTime(rain * [0.6,0.35,0.46,0.27][this.seasonIndex], this.context.currentTime, 1.2);
    this.music?.gain.setTargetAtTime(music * 0.32, this.context.currentTime, 1.2);
  }
  season(index:number){this.seasonIndex=((index%4)+4)%4;if(this.context&&this.filter){this.filter.frequency.setTargetAtTime([1500,620,1200,2100][this.seasonIndex],this.context.currentTime,2);this.levels(this.rainLevel,this.musicLevel);}}
  duck(level:number){this.duckLevel=Math.max(0,Math.min(1,level));if(this.context)this.master?.gain.setTargetAtTime(.5*this.duckLevel,this.context.currentTime,.4);}
  private note() {
    if (!this.context || !this.music || !this.on) return;
    const ctx = this.context, notes = [196, 293.66, 220, 261.63, 174.61, 261.63, 220, 293.66];
    const freq = notes[this.notes++ % notes.length];
    [freq, freq * 2.001, freq * 3].forEach((f, i) => {
      const osc = ctx.createOscillator(), env = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = f;
      env.gain.setValueAtTime(0, ctx.currentTime); env.gain.linearRampToValueAtTime(0.18 / (i + 1), ctx.currentTime + 0.018);
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7 - i);
      osc.connect(env); env.connect(this.music!); osc.start(); osc.stop(ctx.currentTime + 7.2);
    });
  }
  page() {
    if (!this.context || !this.on) return;
    const ctx = this.context, osc = ctx.createOscillator(), env = ctx.createGain(); osc.type = 'triangle'; osc.frequency.value = 90;
    env.gain.setValueAtTime(0.018, ctx.currentTime); env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.connect(env); env.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.07);
  }
  async pause() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.on = false; await this.context?.suspend(); }
  async close() { await this.pause(); await this.context?.close(); this.context = null; }
}
