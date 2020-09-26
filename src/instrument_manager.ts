import WebMidi from 'webmidi';
import Instrument from './instrument';
import { filter, sortBy, uniqBy } from 'lodash';

const MIDI_OUTPUT_MANUFACTURER = 'MOTU';
const VIRTUAL_DEVICE_MANUFACTURER = 'Apple Inc.';
const DEVICE_WHITELIST = Object.freeze([
  MIDI_OUTPUT_MANUFACTURER,
  VIRTUAL_DEVICE_MANUFACTURER,
]);

export function detectInstruments(callback) {
  WebMidi.enable((_err) => {
    debugger;
    console.log('outputs!', WebMidi.outputs);
    const filtered = uniqBy(filter(WebMidi.outputs, (output) => (
      DEVICE_WHITELIST.indexOf(output.manufacturer) > -1
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
