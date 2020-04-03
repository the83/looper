import $ from 'jquery';
import * as React from 'react';
import Abcjs from 'react-abcjs';
import Clock from './clock';
import { times } from 'lodash';

window.$ = $;

interface IProps {
  clocks: Clock[];
  globalBpm: number;
}

// TODO: handle naturals based on previously accidental notes
const ABC_ACCIDENTALS = {
  'b': '_',
  '#': '^',
};

export default class CurrentSequences extends React.Component<IProps, {}> {
  componentDidUpdate() {
    this.props.clocks.forEach((clock, idx) => {
      const currentNote = $('.notation').eq(idx).find(`.abcjs-n${clock.position}`);
      currentNote.addClass('active-note');
    });
  }

  buildAbcNote(note) {
    const { value, duration } = note;
    // rests are indicated by a 'z' in abc notation
    if (value === '') return `z${duration}`;

    const noteParts = value.split('');
    const pitch = noteParts[0];

    const accidental = noteParts.length > 2 && noteParts[1];
    const abcAccidental = ABC_ACCIDENTALS[accidental] || '';

    const octave = parseInt(noteParts[noteParts.length - 1]);
    const numberOfOctavesUp = octave - 4;
    const octaveOffsetSymbol = numberOfOctavesUp < 0 ? ',' : '\'';
    const octavesUp = times(Math.abs(numberOfOctavesUp), () => octaveOffsetSymbol).join('');

    return `${abcAccidental}${pitch}${octavesUp}${duration}`;
  }

  buildAbcNotation = (config, pattern, currentNote) => {
    const notes = config.patterns[pattern];

    console.log({ pattern });
    const noteStream = notes.map((note, idx) => {
      const abcNotes = this.buildAbcNote(note);
      return abcNotes;
    }).join('');

    const patternLabel = `(pattern ${pattern + 1} of ${config.patterns.length})`;
    const result = `R:${config.name} ${patternLabel}\nL:1/16\n|${noteStream}:|`;
    console.log(result);

    return result;
  }

  renderSequence = (clock, index) => {
    const { config, pattern } = clock;
    const currentNote = clock.position;
    const abcNotation = this.buildAbcNotation(config, pattern, currentNote);

    return (
      <div className="sequence" key={`sequence-${index}`} >
        <div className="notation">
          <Abcjs
            abcNotation={abcNotation}
            parserParams={{
              add_classes: true,
            }}
            engraverParams={{
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
