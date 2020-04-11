import './App.css';
import * as React from 'react';
import * as classNames from 'classnames';
import Clock from './clock';
import Instrument from './instrument';
import LaunchpadManager from './launchpad_manager';
import CurrentSequences from './current_sequences';
import { detectInstruments } from './instrument_manager';
import { detectLaunchpad } from './launchpad_manager';
import songs from './songs';

// TODO: song management

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
  page: number,
  launchpad?: LaunchpadManager;
  clocks: Clock[];
  instruments: Instrument[];
  song: any; // TODO: figure out why TS is complaining about typing
  mode: string;
}

const MAX_BPM = 300;
const DEFAULT_BPM = 120;

const MODES = {
  SESSION: 'session',
  SONG_SELECT: 'song_select',
};

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    const song = songs[0];

    if (!song) return;

    this.state = {
      song,
      bpm: song.bpm || DEFAULT_BPM,
      isPlaying: false,
      page: 0,
      instruments: [],
      mode: MODES.SESSION,
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          this.onNoteChange,
          trackConfig,
          DEFAULT_BPM,
          idx,
          false,
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
      setSessionMode: this.setSessionMode,
      setSongSelectMode: this.setSongSelectMode,
    }, (launchpad) => {
      this.setState({ launchpad }, () => {
        this.initializeLaunchpad();
      })
    });

    detectInstruments((instruments) => {
      this.setState({ instruments });
    });
  }

  onMidiFailure(msg) {
    console.log('Failed to get MIDI access - ' + msg);
  }

  setSong = (index) => {
    const song = songs[index];
    if (!song) return;

    // previous clocks need to be cleared, otherwise they will
    // continue to trigger notes
    this.state.clocks.forEach(clock => clock.clear());

    this.setState({
      song,
      bpm: song.bpm || DEFAULT_BPM,
      // isPlaying: false,
      page: 0,
      instruments: this.state.instruments,
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          this.onNoteChange,
          trackConfig,
          DEFAULT_BPM,
          idx,
          this.state.isPlaying,
        );
      }),
    }, () => {
      // redraw song selection grid on launchpad
      this.state.launchpad && this.state.launchpad.scrollText(song.title);
      this.setSongSelectMode();
    });
  }

  onPadPress = ({ column, row }) => {
    if (this.state.mode === MODES.SONG_SELECT) {
      const index = row * 8 + column;
      this.setSong(index);
      return;
    }

    const clock = this.state.clocks[column];
    if (!clock) return;

    const offset = 8 * this.state.page;
    const nextPattern = row + offset;
    if (nextPattern > clock.patternCount + 1) return;

    // if this pattern is already playing, display the pattern
    // number, so performer has a way of checking how far along
    // they are in the composition
    if (clock.pattern === nextPattern) {
      this.state.launchpad && this.state.launchpad.scrollText(
        (nextPattern + 1).toString(),
      );
    }

    clock.setNextPattern(nextPattern);
  }

  setBpm = (evt) => {
    const bpm = evt.target.value;
    this.setState(
      { bpm },
      () => this.state.clocks.forEach(clock => clock.setBpm(bpm)),
    );
  }

  setSongSelectMode = () => {
    this.setState({
      mode: MODES.SONG_SELECT,
    }, this.updateSongSelectMode);
  }

  setSessionMode = () => {
    this.setState({
      mode: MODES.SESSION,
    }, this.updateSessionMode);
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

  updateSongSelectMode = () => {
    if (!this.state.launchpad) return;

    this.state.launchpad.clearMainGrid();
    this.state.launchpad.drawCollection(songs, this.state.song);
  }

  updateSessionMode = () => {
    if (!this.state.launchpad) return;

    this.state.launchpad.clearMainGrid();
    this.state.clocks.forEach((_clock, idx) => {
      this.updateLaunchpad(idx);
    });
  }

  updateLaunchpad = (index) => {
    if (!this.state.launchpad) return;
    if (this.state.mode !== MODES.SESSION) return;

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
          <h1>
            "{this.state.song.title}"
          </h1>

          <div>
            <label className="bpm">
              BPM
            </label>
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
              {this.state.bpm}
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
