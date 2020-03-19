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
  launchpad?: LaunchpadManager;
  clocks: Clock[];
}

const MAX_BPM = 300;
const DEFAULT_BPM = 120;

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.onClockTick = this.onClockTick.bind(this);
    this.setBpm = this.setBpm.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.onMidiSuccess = this.onMidiSuccess.bind(this);
    this.onPadPress = this.onPadPress.bind(this);
    this.updateLaunchpad = this.updateLaunchpad.bind(this);

    this.state = {
      bpm: DEFAULT_BPM,
      isPlaying: false,
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
    clock.setNextPattern(row);
  }

  onMidiSuccess(midiAccess) {
    const launchpad = autoDetectLaunchpad(midiAccess) as Launchpad;

    if (launchpad) {
      const manager = new LaunchpadManager(launchpad, this.onPadPress);
      // clear any previous state on the device
      manager.clear();

      // set up current session

      this.setState({
        launchpad: manager,
      }, () => this.state.clocks.forEach(this.updateLaunchpad));
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

  updateLaunchpad(clock) {
    if (!this.state.launchpad) return;

    const {
      index,
      pattern,
      nextPattern,
      lastPattern,
      config,
    } = clock;

    const offset = Math.floor(pattern / 8) * 8;
    const remaining = config.patterns.length - offset;
    const patternsAvailable = remaining > 8 ? 8 : remaining;

    this.state.launchpad.drawColumn(
      patternsAvailable,
      pattern,
      nextPattern,
      index,
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
