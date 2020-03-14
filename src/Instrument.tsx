import * as React from 'react';
import Clock from './clock';
import { isEqual } from 'lodash';
import * as classNames from 'classnames'

interface IProps {
  trackNumber: number;
  bpm: number;
  isPlaying: boolean;
}

interface IState {
  clock: Clock;
  sequence: any[]; // TODO: type me
  pattern: number;
  position: number;
  note: any; // TODO: type me
  ticksElapsed: number;
}

const DEFAULT_SEQUENCE = [
  [
    { value: 60, duration: 1, velocity: 100 },
    { value: 62, duration: 2, velocity: 100 },
    { value: 64, duration: 3, velocity: 100 },
    { value: 67, duration: 20, velocity: 100 },
    { value: 69, duration: 8, velocity: 100 },
  ],
  [
    { value: 70, duration: 4, velocity: 100 },
    { value: 75, duration: 3, velocity: 100 },
    { value: 76, duration: 2, velocity: 100 },
    { value: 82, duration: 1, velocity: 100 },
  ],
]

class Instrument extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.updatePattern = this.updatePattern.bind(this);
    this.step = this.step.bind(this);

    this.state = {
      clock: new Clock(this.step, props.bpm),
      sequence: DEFAULT_SEQUENCE,
      pattern: 0,
      position: 0,
      note: null,
      ticksElapsed: 0,
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

    const note = this.state.sequence[pattern][position];
    const ticksRemaining = note.duration - ticksElapsed;

    if (ticksRemaining > 0) {
        return position;
    }

    const next = this.state.sequence[pattern].length === position + 1 ? 0 : position + 1;

    return next;
  }

  step() {
    const {
      pattern,
      position,
      ticksElapsed,
    } = this.state;

    if ((pattern + 1) > this.state.sequence.length) {
      console.log('out of range!');
      return
    }

    const note = this.state.sequence[pattern][position];
    const next = this.getNextStep();

    const nextTicksElapsed = next !== position ? 0 : ticksElapsed + 1;

    this.setState({
      note,
      position: next,
      ticksElapsed: nextTicksElapsed,
    });
  }

  updatePattern(pattern) {
    this.setState({ pattern });
  }

  updateClock() {
    this.state.clock.setDuration(this.props.bpm);

    if (!this.props.isPlaying) {
      this.state.clock.stop();
    } else {
      this.state.clock.start();
    }
  }

  renderNote(note) {
    const {
      pattern,
      position,
      ticksElapsed,
    } = this.state;

    const classes = classNames({
      'active-step': this.state.sequence[pattern][position] === note,
    });

    return (
      <td
        key={note.value}
        colSpan={note.duration}
        className={classes}
      >
        {note.value}
      </td>
    );
  }

  renderNotes() {
    const notes = this.state.sequence[this.state.pattern];

    return notes.map((note) => {
      return this.renderNote(note);
    });
  }

  render() {
    return (
      <div className="instrument">
        <div>
          <h3>Track {this.props.trackNumber}</h3>
        </div>
        <div>
          <table className="sequence">
            <tbody>
              <tr>
                {this.renderNotes()}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Instrument;
