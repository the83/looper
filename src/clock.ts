import {
  keys,
  sumBy,
  dropRight,
} from 'lodash';

import { ITrackConfig, MPC_INSTRUMENT_TYPE } from './songs';

import mpc_mapping from './mpc_mapping.json';

function bpmToDuration(bpm) {
  const quarterNote = 60000 / bpm;
  const sixteenthNote = quarterNote / 4;
  return sixteenthNote;
}

function getMpcNote(pad, value) {
  const programPad = `${pad}${value}`;
  return mpc_mapping[programPad];
}

const DEFAULT_RATE = 1;

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
    isPlaying: boolean,
  ) {
    this.onTick = onTick;
    this.bpm = bpm;
    this.rate = config.rate || DEFAULT_RATE;
    this.config = config;
    this.index = index;
    this.onNoteChange = onNoteChange;
    this.isPlaying = isPlaying;

    if (this.isPlaying) {
      this.start();
    }
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

  clear() {
    clearInterval(this.intervalId);
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

  setNextPattern(nextPattern) {
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

  public get patternCount() {
    return this.config.patterns.length;
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

  private tick = (stateOverride: IStateOverride = {}) => {
    const state = {
      ...this.getNextState(),
      ...stateOverride,
    };

    if (this.noteChangeIndexes().indexOf(this.ticksElapsed) >= 0) {
      const {
        midiOutput,
        patterns,
        instrumentType,
        pad,
        midiChannel,
      } = this.config;

      const note = patterns[state.pattern][state.position];
      const tickDuration = bpmToDuration(this.bpm * this.rate);

      let noteValue = note.value;

      if (instrumentType === MPC_INSTRUMENT_TYPE) {
        noteValue = getMpcNote(pad, note.value);
      }

      this.onNoteChange(
        // config is 1-indexed but instruments are 0-indexed
        this.index,
        midiOutput - 1,
        noteValue,
        note.duration * tickDuration,
        midiChannel || 1,
      );
    }

    this.setState(state);
  }

  // only use this for tests
  public testTick() {
    this.tick();
  }
}
