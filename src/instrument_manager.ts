import WebMidi from 'webmidi';
import Instrument from './instrument';
import { filter, sortBy, uniqBy } from 'lodash';

const MIDI_OUTPUT_MANUFACTURER = 'MOTU';

export function detectInstruments(callback) {
  WebMidi.enable((_err) => {
    const filtered = uniqBy(filter(WebMidi.outputs, (output) => (
      output.manufacturer === MIDI_OUTPUT_MANUFACTURER
    )), 'name');

    const sorted = sortBy(filtered, 'name');

    const instruments = sorted.map((output) => {
      // octave offset has been removed for now because it
      // was causing problems when new clocks are created
      return new Instrument(output, null);
    }) as Instrument[];

    callback(instruments);
  }, true);
}
