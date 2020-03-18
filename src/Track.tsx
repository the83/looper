import * as React from 'react';
import Clock from './clock';
import { isEqual, sumBy } from 'lodash';
import { HorizontalBar } from 'react-chartjs-2';
import * as classNames from 'classnames';
import { Launchpad } from 'web-midi-launchpad/src/launchpad.js';

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

interface IProps {
  bpm: number;
  isPlaying: boolean;
  config: ITrackConfig;
  launchpad: Launchpad;
  index: number;
}

interface IState {
  clock: Clock;
  pattern: number;
  position: number;
  ticksElapsed: number;
  nextPattern: number;
  lastPattern?: number;
}

const NOTE_NAMES = Object.freeze([
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
]);

class Track extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.step = this.step.bind(this);
    this.setNextPattern = this.setNextPattern.bind(this);

    this.state = {
      clock: new Clock(this.step, props.bpm, props.config.rate),
      pattern: 0,
      position: 0,
      ticksElapsed: 0,
      nextPattern: 0,
    };
  }

  componentDidUpdate(prevProps) {
    if (isEqual(prevProps, this.props)) return;

    this.updateClock();
  }

  componentWillUnmount() {
    this.state.clock.stop();
  }

  getNextStep() {
    const {
      pattern,
      position,
      ticksElapsed,
    } = this.state;

    const note = this.props.config.patterns[pattern][position];
    const ticksRemaining = note.duration - ticksElapsed;

    if (ticksRemaining > 0) {
        return position;
    }

    const next = (position + 1) >= this.props.config.patterns[pattern].length ? 0 : position + 1;

    return next;
  }

  shouldUpdatePattern() {
    const {
      pattern,
      nextPattern,
    } = this.state;

    const next = this.getNextStep();
    return next === 0 && pattern !== nextPattern;
  }

  getPad(pattern) {
    if (pattern === undefined) return null;
    const { index } = this.props;
    const column = index + 1;
    const row = 8 - (pattern % 8);
    return parseInt(row.toString() + column.toString());
  }

  drawLaunchpad() {
    const {
      pattern,
      nextPattern,
      lastPattern,
    } = this.state;

    const { launchpad } = this.props;
    const currentPad = this.getPad(pattern);
    const nextPad = this.getPad(nextPattern);
    const lastPad = this.getPad(lastPattern);

    if (currentPad !== nextPad) {
      launchpad.ledOn(nextPad, 51, true); // green
    }

    if (currentPad !== lastPad) {
      launchpad.ledOff(lastPad);
    }

    // needs to go last
    launchpad.ledOn(currentPad, 6, true); // red

    console.log({ currentPad, nextPad, lastPad });
  }

  step() {
    const {
      position,
      ticksElapsed,
    } = this.state;

    const next = this.getNextStep();
    const nextTicksElapsed = next !== position ? 0 : ticksElapsed + 1;
    const pattern = this.shouldUpdatePattern() ? this.nextPattern : this.state.pattern;
    const lastPattern = position;
    const nextPattern = this.props.config.loop ? this.state.nextPattern : this.nextPattern;

    this.setState({
      pattern,
      nextPattern,
      lastPattern,
      position: next,
      ticksElapsed: nextTicksElapsed,
    }, () => this.drawLaunchpad());
  }

  updateClock() {
    this.state.clock.setBpm(this.props.bpm);

    if (!this.props.isPlaying) {
      this.state.clock.stop();
    } else {
      this.state.clock.start();
    }
  }

  setNextPattern(nextPattern) {
    this.setState({ nextPattern });
  }

  get chartId() {
    return `chart-${this.props.config.name}`;
  }

  get nextPattern() {
    if (!this.props.config.loop) {
      return this.nextAvailablePattern;
    }

    return this.state.nextPattern;
  }

  get previousAvailablePattern() {
    const { pattern } = this.state;
    const { patterns } = this.props.config;
    return pattern - 1 < 0 ? patterns.length - 1 : pattern - 1;
  }

  get nextAvailablePattern() {
    const { pattern } = this.state;
    const { patterns } = this.props.config;
    return pattern + 1 > patterns.length - 1 ? 0 : pattern + 1;
  }

  get currentNote() {
    const { pattern, position } = this.state;
    const currentNote = this.props.config.patterns[pattern][position].value;
    const octave = Math.ceil(currentNote / 12);
    const noteIndex = (currentNote % 12);
    const noteName = NOTE_NAMES[noteIndex];

    return `${noteName}${octave}`;
  }

  renderSequence(pattern) {
    const { position } = this.state;
    const notes = this.props.config.patterns[pattern];
    const totalDuration = sumBy(notes, (n) => n.duration);
    const data = {
      datasets: notes.map((note, idx) => {
        return {
          data: [note.duration],
          borderWidth: 1,
          backgroundColor: idx === position ? '#969896': '#eaeaea',
          label: `${note.value}-${idx}`,
          borderSkipped: false,
        }
      }),
    };

    const options = {
      animation: false,
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [{
          stacked: true,
          display: false,
          ticks: {
            max: totalDuration,
            mirror: true,
          },
        }],
        yAxes: [{
          stacked: true,
          display: false,
          ticks: {
            mirror: true,
          },
        }],
      },
    };

    return (
      <HorizontalBar
        height={10}
        data={data}
        options={options}
      />
    );
  }

  renderSequenceList() {
    const patternCount = this.props.config.patterns.length;

    const data = {
      datasets: this.props.config.patterns.map((_pattern, idx) => {
        return {
          data: [1],
          borderWidth: 1,
          backgroundColor: idx === this.state.pattern ? '#7aa6da': '#eaeaea',
          label: `pattern-${idx}`,
          borderSkipped: false,
        }
      }),
    };

    const options = {
      animation: false,
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [{
          stacked: true,
          display: false,
          ticks: {
            max: patternCount,
            mirror: true,
          },
        }],
        yAxes: [{
          stacked: true,
          display: false,
          ticks: {
            mirror: true,
          },
        }],
      },
    };

    return (
      <HorizontalBar
        height={10}
        data={data}
        options={options}
      />
    );
  }


  renderHeader() {
    return (
      <div className="track-header">
        <div>
          <h1>{this.props.config.name}</h1>
        </div>
        <div>
          <h1>{this.currentNote}</h1>
        </div>
        <div>
          <button
            className="track-button"
            onClick={() => this.setNextPattern(this.previousAvailablePattern)}
          >
            previous
          </button>
          <button
            className="track-button"
            onClick={() => this.setNextPattern(this.nextAvailablePattern)}
          >
            next
          </button>
        </div>
      </div>
    );
  }

  render() {
    const classes = classNames({
      'track': true,
      'loading-pulse': this.props.config.loop && this.state.pattern !== this.state.nextPattern,
    });

    return (
      <div className={classes}>
        {this.renderHeader()}
        <div>
          {this.renderSequence(this.state.pattern)}
          {this.renderSequenceList()}
        </div>
      </div>
    );
  }
}

export default Track;
