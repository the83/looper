import * as React from 'react';
import './App.css';
import Track from './Track';
import * as classNames from 'classnames';
import autoDetectLaunchpad, { Launchpad } from './launchpad';
import Clock from './clock';
import LaunchpadManager from './LaunchpadManager';
import { times } from 'lodash';

import song from './songs/loopy.json';

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
  page: number,
  launchpad?: LaunchpadManager;
  clocks: Clock[];
}

const MAX_BPM = 300;
const DEFAULT_BPM = 120;

const PLAY_BUTTON_PAD_NUMBER = 19;
const PAGE_UP_PAD_NUMBER = 91;
const PAGE_DOWN_PAD_NUMBER = 92;
const LAUNCHPAD_RED = 5;
const LAUNCHPAD_GREEN = 15;
const LAUNCHPAD_GREY = 1;

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.onClockTick = this.onClockTick.bind(this);
    this.setBpm = this.setBpm.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.onMidiSuccess = this.onMidiSuccess.bind(this);
    this.onPadPress = this.onPadPress.bind(this);
    this.onControlPadPress = this.onControlPadPress.bind(this);
    this.updateLaunchpad = this.updateLaunchpad.bind(this);

    this.state = {
      bpm: DEFAULT_BPM,
      isPlaying: false,
      page: 0,
      clocks: song.tracks.map((trackConfig, idx) => {
        return new Clock(
          this.onClockTick,
          trackConfig,
          DEFAULT_BPM,
          idx,
        );
      }),
    };
  }

  onPadPress({ column, row }) {
    const clock = this.state.clocks[column];
    if (!clock) return;
    clock.setNextPattern(row);
  }

  onControlPadPress(value) {
    if (!this.state.launchpad) return;

    console.log({ value });

    if (value === PLAY_BUTTON_PAD_NUMBER) {
      const isPlaying = this.togglePlay();
      const color = this.state.isPlaying ? 5 : 15;
      this.state.launchpad.ctrlLedOn(value, color, true);
    }

    if (value === PAGE_UP_PAD_NUMBER) {
      this.updatePage(-1);
    }

    if (value === PAGE_DOWN_PAD_NUMBER) {
      this.updatePage(1);
    }
  }

  onMidiSuccess(midiAccess) {
    const launchpad = autoDetectLaunchpad(midiAccess) as Launchpad;

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
  }

  onMidiFailure(msg) {
    console.log('Failed to get MIDI access - ' + msg);
  }

  componentDidMount() {
    navigator.requestMIDIAccess().then(this.onMidiSuccess, this.onMidiFailure);
  }

  setBpm(evt) {
    const bpm = evt.target.value;
    this.setState(
      { bpm },
      () => this.state.clocks.forEach(clock => clock.setBpm(bpm)),
    );
  }

  togglePlay() {
    this.state.clocks.forEach((clock) => {
      if (clock.isPlaying) {
        clock.stop();
      } else {
        clock.start();
      }
    });
    this.setState({ isPlaying: !this.state.isPlaying });
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

  updateLaunchpad(clock) {
    if (!this.state.launchpad) return;

    const { page } = this.state;

    const {
      index,
      pattern,
      nextPattern,
      lastPattern,
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

  onClockTick(clock) {
    this.updateLaunchpad(clock);
    this.setState(this.state); // force re-render
  }

  renderInstruments() {
    return this.state.clocks.map((clock, idx) => (
      <div key={`track-${idx}`}>
        <Track
          config={clock.config}
          index={idx}
          isPlaying={clock.isPlaying}
          lastPattern={clock.lastPattern}
          nextPattern={clock.nextPattern}
          pattern={clock.pattern}
          position={clock.position}
          ticksElapsed={clock.ticksElapsed}
        />
      </div>
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
