import './App.css';
import * as React from 'react';
import * as classNames from 'classnames';
import Clock from './clock';
import Instrument from './instrument';
import LaunchpadManager from './launchpad_manager';
import CurrentSequences from './current_sequences';
import { detectInstruments } from './instrument_manager';
import { detectLaunchpad, OFFSET_AXES } from './launchpad_manager';
import songs from './songs';

// TODO: song management

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
  yOffset: number,
  xOffset: number,
  launchpad?: LaunchpadManager;
  clocks: Clock[];
  instruments: Instrument[];
  song: any; // TODO: figure out why TS is complaining about typing
  mode: string;
  trackStatuses: boolean[];
}

const MAX_BPM = 300;
const DEFAULT_BPM = 120;

const MODES = {
  SESSION: 'session',
  SONG_SELECT: 'song_select',
  MUTE: 'mute',
};

// random velocity between 0.85 and 1
function randomVelocity() {
  return (Math.floor(Math.random() * 15) + 85) * 0.01;
}

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    const song = songs[0];

    if (!song) return;
    const bpm = song.bpm || DEFAULT_BPM;

    this.state = {
      song,
      bpm,
      isPlaying: false,
      yOffset: 0,
      xOffset: 0,
      instruments: [],
      mode: MODES.SESSION,
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          this.onNoteChange,
          trackConfig,
          bpm,
          idx,
          false,
        );
      }),
      trackStatuses: song.tracks.map(() => true),
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
      setMuteMode: this.setMuteMode,
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
    const bpm = song.bpm || DEFAULT_BPM;

    this.setState({
      song,
      bpm,
      yOffset: 0,
      xOffset: 0,
      instruments: this.state.instruments,
      trackStatuses: song.tracks.map(() => true),
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          this.onNoteChange,
          trackConfig,
          bpm,
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

  toggleMute = (index) => {
    const { trackStatuses } = this.state;

    if (typeof(trackStatuses[index]) === 'undefined') {
      return;
    }

    trackStatuses[index] = !trackStatuses[index];

    this.setState({
      trackStatuses,
    }, () => {
      // redraw track statuses on launchpad
      this.updateMuteMode();
    });
  }

  onPadPress = ({ column, row }) => {
    const {
      mode,
      clocks,
      yOffset,
      xOffset,
      launchpad,
    } = this.state;

    if (mode === MODES.SONG_SELECT) {
      const index = row * 8 + column;
      this.setSong(index);
      return;
    }

    if (mode === MODES.MUTE) {
      const index = row * 8 + column;
      this.toggleMute(index);
      return;
    }

    const clock = clocks[column + (8 * xOffset)];
    if (!clock) return;

    const offset = 8 * yOffset;
    const nextPattern = row + offset;
    if (nextPattern > clock.patternCount + 1) return;

    // if this pattern is already playing, display the pattern
    // number, so performer has a way of checking how far along
    // they are in the composition
    if (clock.pattern === nextPattern) {
      launchpad && launchpad.scrollText(
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

  setMuteMode = () => {
    this.setState({
      mode: MODES.MUTE,
    }, this.updateMuteMode);
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

    this.updatePage(OFFSET_AXES.Y, 0);
    this.updatePage(OFFSET_AXES.X, 0);
  }

  initializeLaunchpad() {
    if (!this.state.launchpad) return;
    this.state.clocks.forEach((_clock, idx) => {
      this.updateLaunchpad(idx);
    });
  }

  incrementPage = (axis: string, amount: number) => {
    const { yOffset, xOffset } = this.state;

    const selectedOffset = axis === OFFSET_AXES.Y ? yOffset : xOffset;
    const page = selectedOffset + amount;
    if (page < 0) return;
    this.updatePage(axis, page);
  }

  updatePage = (axis, page: number) => {
    const state = axis === OFFSET_AXES.Y ? { yOffset: page } as IState : { xOffset: page } as IState;

    this.setState(
      state,
      () => {
        if (this.state.launchpad) {
          this.state.launchpad.clearMainGrid();
        }

        this.state.clocks.forEach((_clock, idx) => {
          this.updateLaunchpad(idx)
        });
      },
    )
  };

  updateSongSelectMode = () => {
    if (!this.state.launchpad) return;

    this.state.launchpad.clearMainGrid();
    this.state.launchpad.drawCollection(songs, this.state.song);
  }

  updateMuteMode = () => {
    if (!this.state.launchpad) return;

    this.state.launchpad.clearMainGrid();
    this.state.launchpad.drawTrackStatuses(this.state.trackStatuses);
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

    const { yOffset, xOffset } = this.state;
    const xBounds = [xOffset * 8, (xOffset + 1) * 8];

    if (index < xBounds[0] || index >= xBounds[1]) return;

    const clock = this.state.clocks[index];
    if (!clock) return;

    const {
      pattern,
      nextPattern,
      config,
    } = clock;

    const offset = yOffset * 8;
    const remaining = config.patterns.length - offset;
    const patternsAvailable = remaining > 8 ? 8 : remaining;
    const column = index % 8;

    this.state.launchpad.drawColumn(
      patternsAvailable,
      pattern,
      nextPattern,
      column,
      offset,
    );
  }

  onClockTick = (index) => {
    this.updateLaunchpad(index);
    // this.forceUpdate(); // force re-render
  }

  onNoteChange = (clockIndex, midiOutput, value, duration) => {
    // check if track is muted
    if (!this.state.trackStatuses[clockIndex]) return;

    const instrument = this.state.instruments[midiOutput];
    if (!instrument) return;

    const velocity = this.state.song.randomizeVelocity ? randomVelocity() : 1;

    instrument.playNote({
      value,
      duration,
      velocity,
      channel: 1,
    });
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
