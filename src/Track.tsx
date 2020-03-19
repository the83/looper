import * as React from 'react';
import Clock from './clock';
import { sumBy } from 'lodash';
import { HorizontalBar } from 'react-chartjs-2';
import * as classNames from 'classnames';

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
  config: ITrackConfig;
  index: number;
  isPlaying: boolean;
  lastPattern?: number;
  nextPattern: number;
  pattern: number;
  position: number;
  ticksElapsed: number;
}

interface IState {
  clock: Clock;
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
  get currentNote() {
    const { pattern, position, config } = this.props;
    const currentNote = config.patterns[pattern][position].value;
    const octave = Math.ceil(currentNote / 12);
    const noteIndex = (currentNote % 12);
    const noteName = NOTE_NAMES[noteIndex];

    return `${noteName}${octave}`;
  }

  renderSequence(pattern) {
    const { position, config } = this.props;
    const notes = config.patterns[pattern];
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
          backgroundColor: idx === this.props.pattern ? '#7aa6da': '#eaeaea',
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
          >
            previous
          </button>
          <button
            className="track-button"
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
      'loading-pulse': this.props.config.loop && this.props.pattern !== this.props.nextPattern,
    });

    return (
      <div className={classes}>
        {this.renderHeader()}
        <div>
          {this.renderSequence(this.props.pattern)}
          {this.renderSequenceList()}
        </div>
      </div>
    );
  }
}

export default Track;
