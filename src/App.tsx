import * as React from 'react';
import './App.css';
import Track from './Track';
import * as classNames from 'classnames';
import autoDetectLaunchpad, { Launchpad } from 'web-midi-launchpad/src/launchpad.js';

import song from './songs/loopy.json';

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
  launchpad: Launchpad;
}

const MAX_BPM = 300;

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      bpm: 120,
      isPlaying: false,
      launchpad: null,
    };

    this.setBpm = this.setBpm.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.onMidiSuccess = this.onMidiSuccess.bind(this);
  }

  onMidiSuccess(midiAccess) {
    const launchpad = autoDetectLaunchpad(midiAccess) as Launchpad;

    // Clear initial launchpad state
    launchpad.clear();
    // launchpad.onPadPress(pad => launchpad.ledOff(pad));
    this.setState({ launchpad });
  }

  onMidiFailure(msg) {
    console.log('Failed to get MIDI access - ' + msg);
  }

  componentDidMount() {
    navigator.requestMIDIAccess().then(this.onMidiSuccess, this.onMidiFailure);
  }

  setBpm(evt) {
    this.setState({ bpm: evt.target.value });
  }

  togglePlay() {
    this.setState({ isPlaying: !this.state.isPlaying });
  }

  renderInstruments() {
    return song['tracks'].map((config, idx) => (
      <div key={`track-${idx}`}>
        <Track
          config={config}
          bpm={this.state.bpm}
          isPlaying={this.state.isPlaying}
          index={idx}
          launchpad={this.state.launchpad}
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
