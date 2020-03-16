import * as React from 'react';
import './App.css';
import Track from './Track';

import song from './songs/loopy.json';

interface IProps {
}

interface IState {
  bpm: number;
  isPlaying: boolean;
}

function onMIDISuccess(midiAccess: any) {
  const { inputs, outputs } = midiAccess;
  console.log({ inputs, outputs });
}

function onMIDIFailure(midiAccess) {
  console.log('error', midiAccess);
}

const MAX_BPM = 300;

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      bpm: 120,
      isPlaying: false,
    };

    this.setBpm = this.setBpm.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
  }

  componentDidMount() {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
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
        />
      </div>
    ));
  }

  render() {
    return (
      <div>
        <div className="menu">
          <div>
            <label htmlFor="tempo">
              Tempo
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
            <span>
              {this.state.bpm}
            </span>
          </div>

          <div>
            <button onClick={this.togglePlay}>
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
