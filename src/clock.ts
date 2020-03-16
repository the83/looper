function bpmToDuration(bpm) {
  const quarterNote = 60000 / bpm;
  const sixteenthNote = quarterNote / 4;
  return sixteenthNote;
}

const DEFAULT_RATE = 1;

export default class Clock {
  onTick: Function;
  bpm: number;
  intervalId: number = 0;
  rate: number = 1;

  constructor(onTick: Function, bpm: number, rate?: number) {
    this.onTick = onTick;
    this.bpm = bpm;
    this.rate = rate || DEFAULT_RATE;
  }

  reset() {
    this.start();
  }

  stop() {
    clearInterval(this.intervalId);
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  start() {
    this.stop();
    const duration = bpmToDuration(this.bpm * this.rate);
    this.intervalId = setInterval(this.onTick, duration);
  }
}
