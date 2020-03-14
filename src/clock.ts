export default class Clock {
  onTick: Function;
  duration: number;
  intervalId: number = 0;

  constructor(onTick: Function, duration: number) {
    this.onTick = onTick;
    this.duration = duration;
  }

  reset() {
    this.start();
  }

  stop() {
    clearInterval(this.intervalId);
  }

  setDuration(duration) {
    this.duration = duration;
  }

  start() {
    this.stop();
    this.intervalId = setInterval(this.onTick, this.duration);
  }
}
