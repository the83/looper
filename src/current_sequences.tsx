import * as React from 'react';
import Clock from './clock';
import HorizontalBarChart from './horizontal_bar_chart';
import { sumBy, max, flatten } from 'lodash';
import { INote } from './songs';

interface IProps {
  clocks: Clock[];
  globalBpm: number;
}

export default class CurrentSequences extends React.Component<IProps, {}> {
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

  renderSequence = (clock, index) => { const { position, config, pattern } = clock;
    const bpm = this.props.globalBpm * config.rate;
    const notes = config.patterns[pattern];
    const currentSequenceData = {
      datasets: notes.map((note, idx) => {
        return {
          data: [note.duration],
          borderWidth: 1,
          backgroundColor: idx === position ? '#969896': '#eaeaea',
          label: `${note.value}-${idx}`,
          borderSkipped: false,
        }
      }),
    };

    const patternData = {
      datasets: config.patterns.map((_pattern, idx) => {
        return {
          data: [1],
          borderWidth: 1,
          backgroundColor: idx === pattern ? '#7aa6da': '#eaeaea',
          label: `pattern-${idx}`,
          borderSkipped: false,
        }
      }),
    };

    return (
      <div className="sequence" key={`sequence-${index}`} >
        <div className="track-header">
          <div>
            <h3>{config.name} ({bpm} bpm)</h3>
          </div>
          <div>
            <h3>{config.patterns[pattern][position].value}</h3>
          </div>
        </div>
        <HorizontalBarChart data={currentSequenceData} maxTicks={this.maxSequenceLength()} />
        <HorizontalBarChart data={patternData} maxTicks={this.maxPatternsLength()} />
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
