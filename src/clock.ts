import {
  keys,
  sumBy,
  dropRight,
} from 'lodash';

function bpmToDuration(bpm) {
  const quarterNote = 60000 / bpm;
  const sixteenthNote = quarterNote / 4;
  return sixteenthNote;
}

const DEFAULT_RATE = 1;

export interface INote {
  value: string;
  duration: number; // in sixteenths
}

export interface ITrackConfig {
  name: string;
  patterns: INote[][];
  rate?: number;
  loop?: boolean;
  octaveOffset?: number;
}

interface IStateOverride {
  position?: number;
  pattern?: number;
  ticksElapsed?: number;
  nextPattern?: number;
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
    this.tick = this.tick.bind(this);
  }

  reset() {
    this.tick({
      position: 0,
      ticksElapsed: 1,
    });
  }

  resetAll() {
    this.tick({
      position: 0,
      ticksElapsed: 1,
      pattern: 0,
      nextPattern: 0,
    });
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
      this.intervalId = window.setInterval(this.tick, duration);
    }
  }

  setNextPattern(row, offset) {
    // TODO: hoist offset logic up into component
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
      tick,
    } = this;

    clearInterval(intervalId);
    const tickDuration = bpmToDuration(bpm * rate);
    this.intervalId = window.setInterval(tick, tickDuration);
    this.setState({ isPlaying: true });
  }

  private nextAvailablePattern(pattern) {
    const next = pattern + 1;
    const nextAvailable = next > this.config.patterns.length - 1 ? 0 : next;
    return nextAvailable;
  }

  private setState(state) {
    keys(state).forEach((key) => {
      this[key] = state[key];
    });

    this.onTick(this.index);
  }

  private getNextStep() {
    const {
      position,
      ticksElapsed,
    } = this;

    const nextNoteIndex = this.noteChangeIndexes().indexOf(ticksElapsed);
    const next = nextNoteIndex >= 0 ? nextNoteIndex : position;

    return next;
  }

  private getNextTicksElapsed(pattern) {
    const {
      ticksElapsed,
      config,
    } = this;

    const ticksInPattern = sumBy(config.patterns[pattern], 'duration') - 1;
    const next = ticksElapsed + 1;
    if (next > ticksInPattern) return 0;
    return next;
  }

  private shouldUpdatePattern() {
    const {
      pattern,
      nextPattern,
      ticksElapsed,
    } = this;

    const next = this.getNextStep();
    return next === 0 && ticksElapsed === 0 && pattern !== nextPattern;
  }

  private noteChangeIndexes() {
    const {
      config,
      pattern,
    } = this;

    const durations = dropRight(config.patterns[pattern]).map(p => p.duration);
    const indexes = [0];

    durations.forEach((d, idx) => {
      indexes.push(d + indexes[idx]);
    });

    return indexes;
  }

  private getNextState() {
    const shouldUpdatePattern = this.shouldUpdatePattern();
    const position = this.getNextStep();
    const pattern = shouldUpdatePattern ? this.nextPattern : this.pattern;
    const nextTicksElapsed = this.getNextTicksElapsed(pattern);
    const nextPattern = this.config.loop ? this.nextPattern : this.nextAvailablePattern(pattern);

    return {
      pattern,
      nextPattern,
      position,
      ticksElapsed: nextTicksElapsed,
    };
  }

  private tick(stateOverride: IStateOverride = {}) {
    const state = {
      ...this.getNextState(),
      ...stateOverride,
    };

    if (this.noteChangeIndexes().indexOf(this.ticksElapsed) >= 0) {
      const note = this.config.patterns[state.pattern][state.position];
      const tickDuration = bpmToDuration(this.bpm * this.rate);

      this.onNoteChange(
        this.index,
        note.value,
        note.duration * tickDuration,
      );
    }

    this.setState(state);
  }

  // only use this for tests
  public testTick() {
    this.tick();
  }
}
