import { keys, pick } from 'lodash';

function bpmToDuration(bpm) {
  const quarterNote = 60000 / bpm;
  const sixteenthNote = quarterNote / 4;
  return sixteenthNote;
}

const DEFAULT_RATE = 1;

interface INote {
  value: string;
  duration: number; // in sixteenths
}

export interface ITrackConfig {
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
  onNoteChange: Function;

  constructor(
    onTick: Function,
    onNoteChange: Function,
    config: ITrackConfig,
    bpm: number,
    index: number,
  ) {
    this.onTick = onTick;
    this.bpm = bpm;
    this.rate = config.rate || DEFAULT_RATE;
    this.config = config;
    this.index = index;
    this.onNoteChange = onNoteChange;
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

  setNextPattern(row, offset) {
    // row will be 0-7. Need to add an offset to account for where
    // we are currently in the list of patterns

    const { pattern } = this;
    const nextPattern = row + offset
    const patternCount = this.config.patterns.length;
    if (nextPattern + 1 > patternCount) return;

    this.setState({ nextPattern });
  }

  start() {
    const {
      intervalId,
      bpm,
      rate,
      step,
      pattern,
      position,
    } = this;

    clearInterval(intervalId);
    const tickDuration = bpmToDuration(bpm * rate);
    this.intervalId = window.setInterval(step, tickDuration);

    this.setState({ isPlaying: true });

    // play first note if on first note but previously stopped
    if (position === 0) {
      const note = this.config.patterns[pattern][position];

      this.onNoteChange(
        this.index,
        note.value,
        note.duration * tickDuration,
      );
    }
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

  private getNextTicksElapsed() {
    const {
      pattern,
      position,
      ticksElapsed,
      config,
    } = this;

    const ticksInPattern = config.patterns[pattern][position].duration;
    const next = ticksElapsed + 1;
    if (next > ticksInPattern) return 0;
    return next;
  }

  private endOfSingleNotePattern() {
    const {
      config,
      pattern,
    } = this;

    if (config.patterns[pattern].length > 1) return false;
    return this.getNextTicksElapsed() == 0;
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
      bpm,
      rate,
      config,
    } = this;

    const next = this.getNextStep();
    const nextTicksElapsed = this.getNextTicksElapsed();
    const pattern = this.shouldUpdatePattern() ? this.nextPattern : this.pattern;
    const lastPattern = position;
    const nextPattern = this.config.loop ? this.nextPattern : this.nextAvailablePattern;

    if (position !== next || this.endOfSingleNotePattern()) {
      const note = config.patterns[pattern][next];
      const tickDuration = bpmToDuration(bpm * rate);

      this.onNoteChange(
        this.index,
        note.value,
        note.duration * tickDuration,
      );
    }

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
