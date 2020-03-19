import { keys, pick } from 'lodash';

function bpmToDuration(bpm) {
  const quarterNote = 60000 / bpm;
  const sixteenthNote = quarterNote / 4;
  return sixteenthNote;
}

const DEFAULT_RATE = 1;

interface INote {
  value: number;
  duration: number; // in sixteenths
}

interface ITrackConfig {
  name: string;
  patterns: INote[][];
  rate?: number;
  loop?: boolean;
}

export default class Clock {
  onTick: Function;
  bpm: number;
  intervalId: number = 0;
  rate: number = 1;

  index: number = 0;
  pattern: number = 0;
  position: number = 0;
  ticksElapsed: number = 0;
  nextPattern: number = 0;
  lastPattern: number = 0;
  config: ITrackConfig;
  isPlaying: boolean = false;

  constructor(
    onTick: Function,
    config: ITrackConfig,
    bpm: number,
    index: number,
  ) {
    this.onTick = onTick;
    this.bpm = bpm;
    this.rate = config.rate || DEFAULT_RATE;
    this.config = config;
    this.index = index;
    this.step = this.step.bind(this);
  }

  reset() {
    this.start();
  }

  stop() {
    clearInterval(this.intervalId);
    this.setState({ isPlaying: false });
  }

  setBpm(bpm) {
    const duration = bpmToDuration(bpm * this.rate);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.bpm = bpm;

    if (this.isPlaying) {
      this.intervalId = window.setInterval(this.step, duration);
    }
  }

  setNextPattern(row) {
    // row will be 0-7. Need to add an offset to account for where
    // we are currently in the list of patterns

    const { pattern } = this;
    const offset = Math.floor(pattern / 8) * 8;
    const nextPattern = row + offset
    const patternCount = this.config.patterns.length;

    console.log({ pattern, offset, nextPattern, patternCount });
    if (nextPattern + 1 > patternCount) return;

    this.setState({ nextPattern });
  }

  start() {
    clearInterval(this.intervalId);

    const duration = bpmToDuration(this.bpm * this.rate);

    this.intervalId = window.setInterval(this.step, duration);

    this.setState({
      isPlaying: true,
    });
  }

  get previousAvailablePattern() {
    const { pattern } = this;
    const { patterns } = this.config;
    return pattern - 1 < 0 ? patterns.length - 1 : pattern - 1;
  }

  get nextAvailablePattern() {
    const { pattern } = this;
    const { patterns } = this.config;
    return pattern + 1 > patterns.length - 1 ? 0 : pattern + 1;
  }

  private setState(state) {
    keys(state).forEach((key) => {
      this[key] = state[key];
    });

    this.onTick(this);
  }

  private getNextStep() {
    const {
      pattern,
      position,
      ticksElapsed,
    } = this;

    const note = this.config.patterns[pattern][position];
    const ticksRemaining = note.duration - ticksElapsed;

    if (ticksRemaining > 0) {
        return position;
    }

    const next = (position + 1) >= this.config.patterns[pattern].length ? 0 : position + 1;

    return next;
  }

  private shouldUpdatePattern() {
    const {
      pattern,
      nextPattern,
    } = this;

    const next = this.getNextStep();
    return next === 0 && pattern !== nextPattern;
  }

  private step() {
    const {
      position,
      ticksElapsed,
    } = this;

    const next = this.getNextStep();
    const nextTicksElapsed = next !== position ? 0 : ticksElapsed + 1;
    const pattern = this.shouldUpdatePattern() ? this.nextPattern : this.pattern;
    const lastPattern = position;
    const nextPattern = this.config.loop ? this.nextPattern : this.nextAvailablePattern;

    const state = {
      pattern,
      nextPattern,
      lastPattern,
      position: next,
      ticksElapsed: nextTicksElapsed,
      isPlaying: this.isPlaying,
    };

    this.setState(state);
  }
}
