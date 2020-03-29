import WebMidi, { Output } from 'webmidi';
import Instrument from './instrument';
import { compact } from 'lodash';

const MIDI_OUTPUT_MANUFACTURER = 'MOTU';

export function detectInstruments(clocks, callback) {
  WebMidi.enable((_err) => {
    const midiOutputs = compact(WebMidi.outputs.filter((output: Output) => {
      return output.manufacturer === MIDI_OUTPUT_MANUFACTURER;
    }));

    const instruments = midiOutputs.map((output, idx) => {
      const clock = clocks[idx];
      if (!clock) return null;

      const octaveOffset = clock.config.octaveOffset;
      return new Instrument(output, octaveOffset);
    }) as Instrument[];

    callback(instruments);
  }, true);
}
