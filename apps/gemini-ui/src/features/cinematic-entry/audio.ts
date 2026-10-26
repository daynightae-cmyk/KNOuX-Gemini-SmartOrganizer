/** Original procedural cue. No media downloads or copyrighted samples.
 * Only call gesture() from trusted UI handlers. Nothing starts on mount. */
export class EntryAudio {
  private context: AudioContext | null = null;
  private generation = 0;
  constructor(private create = () => new AudioContext()) {}
  async gesture(cue: 'unlock' | 'enter'): Promise<boolean> {
    const generation = this.generation;
    try {
      this.context ??= this.create();
      const context = this.context;
      await context.resume();
      if (generation !== this.generation || context.state !== 'running') return false;
      const now = context.currentTime;
      const tone = (frequency: number, offset: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(volume, now + offset + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, now + offset + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + duration + .02);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      };
      if (cue === 'unlock') {
        tone(880, 0, .3, .012); tone(1320, .08, .4, .008);
      } else {
        tone(1500, 0, .045, .025, 'triangle'); // tactile glass tick
        tone(110, .03, .8, .035); // quiet fundamental bloom
        [220, 277.18, 329.63, 440].forEach((f, i) => tone(f, .06 + i * .065, 1.05, .016));
        tone(1760, .24, .6, .006);
      }
      return true;
    } catch { return false; } // audio denial never delays entry
  }
  dispose() {
    this.generation++;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
