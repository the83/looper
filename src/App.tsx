import './App.css';
import * as React from 'react';
import * as classNames from 'classnames';
import Clock from './clock';
import Instrument from './instrument';
import LaunchpadManager from './launchpad_manager';
import Track from './Track';
import WebMidi, { Output } from 'webmidi';
import autoDetectLaunchpad, { Launchpad } from './launchpad';
import { compact, omit } from 'lodash';

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

const PLAY_BUTTON_PAD_NUMBER = 19;
const PAGE_UP_PAD_NUMBER = 91;
const PAGE_DOWN_PAD_NUMBER = 92;
const LAUNCHPAD_RED = 5;
const LAUNCHPAD_GREEN = 15;
const LAUNCHPAD_GREY = 1;
const MIDI_OUTPUT_MANUFACTURER = 'MOTU';

const song = omit(loopy, ['defaults']);

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      bpm: DEFAULT_BPM,
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
    const launchpad = autoDetectLaunchpad(access) as Launchpad;

    if (launchpad) {
      const manager = new LaunchpadManager(
        launchpad,
        this.onPadPress,
        this.onControlPadPress,
      );

      this.setState({
        launchpad: manager,
      }, this.initializeLaunchpad);
    }

    WebMidi.enable((_err) => {
      const midiOutputs = WebMidi.outputs.filter((output: Output) => {
        return output.manufacturer === MIDI_OUTPUT_MANUFACTURER;
      });

      const instruments = compact(midiOutputs.map((output, idx) => {
        const clock = this.state.clocks[idx];
        if (!clock) return null;

        const octaveOffset = clock.config.octaveOffset;
        return new Instrument(output, octaveOffset);
      }));

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

  onControlPadPress = (value) => {
    if (!this.state.launchpad) return;

    console.log({ value });

    if (value === PLAY_BUTTON_PAD_NUMBER) {
      const isPlaying = this.togglePlay();
      const color = isPlaying ? LAUNCHPAD_RED : LAUNCHPAD_GREEN;
      this.state.launchpad.ctrlLedOn(value, color, true);
    }

    if (value === PAGE_UP_PAD_NUMBER) {
      this.updatePage(-1);
    }

    if (value === PAGE_DOWN_PAD_NUMBER) {
      this.updatePage(1);
    }
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

  initializeLaunchpad() {
    if (!this.state.launchpad) return;

    this.state.launchpad.clear();
    this.state.launchpad.ctrlLedOn(PLAY_BUTTON_PAD_NUMBER, LAUNCHPAD_GREEN, true);
    this.state.launchpad.ctrlLedOn(PAGE_UP_PAD_NUMBER, LAUNCHPAD_GREY);
    this.state.launchpad.ctrlLedOn(PAGE_DOWN_PAD_NUMBER, LAUNCHPAD_GREY);
    this.state.clocks.forEach(this.updateLaunchpad);
  }

  updatePage(number) {
    const page = this.state.page + number;
    if (page < 0) return;

    this.setState({
      page,
    }, () => this.state.clocks.forEach(clock => this.updateLaunchpad(clock)))
  }

  updateLaunchpad = (clock) => {
    if (!this.state.launchpad) return;

    const { page } = this.state;

    const {
      index,
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

  onClockTick = (clock) => {
    this.updateLaunchpad(clock);
    this.setState(this.state); // force re-render
  }

  onNoteChange = (index, note, duration) => {
    const instrument = this.state.instruments[index];
    instrument.playNote(note, duration, 1);
  }

  renderInstruments() {
    return this.state.clocks.map((clock, idx) => (
      <Track
        config={clock.config}
        index={idx}
        isPlaying={clock.isPlaying}
        lastPattern={clock.lastPattern}
        nextPattern={clock.nextPattern}
        pattern={clock.pattern}
        position={clock.position}
        ticksElapsed={clock.ticksElapsed}
        key={`track-${idx}`}
      />
    ));
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
              {this.state.bpm} BPM
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

        <div className="instruments">
          {this.renderInstruments()}
        </div>
      </div>
    );
  }
}


export default App;
