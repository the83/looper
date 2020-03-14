import * as React from 'react';
import './App.css';
import Instrument from './Instrument';
import { v4 } from 'uuid';
import { without } from 'lodash';

interface IProps {
}

interface IState {
  bpm: number;
  instruments: string[];
  isPlaying: boolean;
}

function onMIDISuccess(midiAccess: any) {
  console.log(midiAccess);
  const { inputs, outputs } = midiAccess;
}

function onMIDIFailure(midiAccess) {
  console.log('error', midiAccess);
}

let quarterNoteDuration = 500 // milliseconds, 500 = 120bpm
const MAX_BPM = 300;

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      bpm: 120,
      instruments: [],
      isPlaying: false,
    };

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
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

  add() {
    const { instruments } = this.state;
    const id = v4();

    instruments.push(id);

    this.setState({
      instruments,
    });
  }

  remove(id: string) {
    const instruments = without(this.state.instruments, id);

    this.setState({
      instruments,
    });
  }

  renderInstruments() {
    return this.state.instruments.map((id, idx) => (
      <div key={id}>
        <Instrument
          trackNumber={idx + 1}
          bpm={this.state.bpm}
          isPlaying={this.state.isPlaying}
        />
        <div className="buttons">
          <button onClick={() => this.remove(id)}>
            Remove
          </button>
        </div>
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

          <div>
            <button onClick={this.add}>
              Add Instrument
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
