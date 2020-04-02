import * as React from 'react';
import Clock from './clock';
import HorizontalBarChart from './horizontal_bar_chart';
import { sumBy, max, flatten } from 'lodash';
import { INote } from './songs';
import Abcjs from 'react-abcjs';
import $ from 'jquery';

interface IProps {
  clocks: Clock[];
  globalBpm: number;
}

export default class CurrentSequences extends React.Component<IProps, {}> {
  componentDidUpdate() {
    console.log('coming here!');
    this.props.clocks.forEach((clock, idx) => {
      const currentNote = $(`.abcjs-n${clock.position}`).eq(idx);
      currentNote.addClass('active-note');
    });
  }

  maxSequenceLength() {
    const durations = flatten(this.props.clocks.map((clock) => {
      return clock.config.patterns.map((pattern) => {
        return sumBy(pattern, (n: INote) => n.duration);
      });
    }));

    return max(durations);
  }

  maxPatternsLength() {
    const patternLengths = this.props.clocks.map((clock) => {
      return clock.config.patterns.length;
    });

    return max(patternLengths);
  }

  buildAbcNotation = (config, bpm, notes) => {
    const noteStream = notes.map((note) => {
      // rests are indicated by a 'z' in abc notation
      const parsed = note.value === '' ? 'z' : note.value.replace(/\d/, '');
      return `${parsed}${note.duration}`;
    }).join('');

    const result = `L:1/16\n|${noteStream}:|`;
    return result;
  }

  renderSequence = (clock, index) => { const { position, config, pattern } = clock;
    const bpm = this.props.globalBpm * config.rate;
    const notes = config.patterns[pattern];

    const abcNotation = this.buildAbcNotation(config, bpm, notes);

    return (
      <div className="sequence" key={`sequence-${index}`} >
        <div className="track-header">
          <div>
            <h3>{config.name} (midi output {config.midiOutput} - {bpm} bpm)</h3>
          </div>
        </div>
        <div className="notation">
          <Abcjs
            abcNotation={abcNotation}
            parserParams={{
              add_classes: true,
            }}
            engraverParams={{
              scale: 1.2,
            }}
            renderParams={{
            }}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="instruments">
        {this.props.clocks.map(this.renderSequence)}
      </div>
    );
  }
}
