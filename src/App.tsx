import './App.css';
import * as React from 'react';
import * as classNames from 'classnames';
import Clock from './clock';
import Instrument from './instrument';
import LaunchpadManager from './launchpad_manager';
import CurrentSequences from './current_sequences';
import { omit } from 'lodash';
import { detectInstruments } from './instrument_manager';
import { detectLaunchpad } from './launchpad_manager';

// TODO: song management
import loopy from './songs/loopy.json';

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
  page: number,
  launchpad?: LaunchpadManager;
  clocks: Clock[];
  instruments: Instrument[];
}

const MAX_BPM = 300;
const DEFAULT_BPM = 120;

const song = omit(loopy, ['defaults']);

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      bpm: song.bpm || DEFAULT_BPM,
      isPlaying: false,
      page: 0,
      instruments: [],
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          this.onNoteChange,
          trackConfig,
          DEFAULT_BPM,
          idx,
        );
      }),
    };
  }

  componentDidMount() {
    navigator.requestMIDIAccess().then(this.onMidiSuccess, this.onMidiFailure);
  }

  onMidiSuccess = (access) => {
    detectLaunchpad({
      togglePlay: this.togglePlay,
      resetPattern: this.resetPattern,
      resetAll: this.resetAll,
      incrementPage: this.incrementPage,
      onPadPress: this.onPadPress,
    }, (launchpad) => {
      this.setState({ launchpad }, () => {
        this.initializeLaunchpad();
      })
    });

    detectInstruments(this.state.clocks, (instruments) => {
      this.setState({ instruments });
    });
  }

  onMidiFailure(msg) {
    console.log('Failed to get MIDI access - ' + msg);
  }

  onPadPress = ({ column, row }) => {
    const clock = this.state.clocks[column];
    if (!clock) return;

    const offset = 8 * this.state.page;
    clock.setNextPattern(row, offset);
  }

  setBpm = (evt) => {
    const bpm = evt.target.value;
    this.setState(
      { bpm },
      () => this.state.clocks.forEach(clock => clock.setBpm(bpm)),
    );
  }

  togglePlay = () => {
    this.state.clocks.forEach((clock) => {
      if (clock.isPlaying) {
        clock.stop();
      } else {
        clock.start();
      }
    });

    const isPlaying = !this.state.isPlaying
    this.setState({ isPlaying });
    return isPlaying;
  }

  resetPattern = () => {
    this.state.clocks.forEach((clock) => {
      clock.reset();
    });
  }

  resetAll = () => {
    this.state.clocks.forEach((clock) => {
      clock.resetAll();
    });

    this.updatePage(0);
  }

  initializeLaunchpad() {
    if (!this.state.launchpad) return;
    this.state.clocks.forEach((_clock, idx) => {
      this.updateLaunchpad(idx);
    });
  }

  incrementPage = (number) => {
    const page = this.state.page + number;
    if (page < 0) return;
    this.updatePage(page);
  }

  updatePage = (page) => {
    this.setState({
      page,
    }, () => this.state.clocks.forEach((_clock, idx) => {
      this.updateLaunchpad(idx)
    }))
  };

  updateLaunchpad = (index) => {
    if (!this.state.launchpad) return;

    const { page } = this.state;
    const clock = this.state.clocks[index];
    if (!clock) return;

    const {
      pattern,
      nextPattern,
      config,
    } = clock;

    const offset = page * 8;
    const remaining = config.patterns.length - offset;
    const patternsAvailable = remaining > 8 ? 8 : remaining;

    this.state.launchpad.drawColumn(
      patternsAvailable,
      pattern,
      nextPattern,
      index,
      offset,
    );
  }

  onClockTick = (index) => {
    this.updateLaunchpad(index);
    this.forceUpdate(); // force re-render
  }

  onNoteChange = (index, note, duration) => {
    const instrument = this.state.instruments[index];
    if (!instrument) return;
    instrument.playNote(note, duration, 1);
  }

  render() {
    const playButtonClasses = classNames({
      'play-button': true,
      'stop-button': this.state.isPlaying,
    });

    return (
      <div>
        <div className="menu">
          <div>
            <input
              type="range"
              min="0"
              max={MAX_BPM}
              value={this.state.bpm}
              className="slider"
              onChange={this.setBpm}
              id="tempo"
              name="tempo"
            />
            <label className="bpm">
              {this.state.bpm} MASTER BPM
            </label>
          </div>

          <div>
            <button
              className={playButtonClasses}
              onClick={this.togglePlay}
            >
              {this.state.isPlaying ? 'Stop' : 'Play'}
            </button>
          </div>
        </div>

        <div className="sequences">
          <CurrentSequences
            globalBpm={this.state.bpm}
            clocks={this.state.clocks}
          />
        </div>
      </div>
    );
  }
}


export default App;
