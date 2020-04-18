import { pick } from 'lodash';
import loopy from './songs/loopy.json';
import loopy2 from './songs/loopy2.json';
import piano_phase from './songs/piano_phase.json';
import in_c from './songs/in_c.json';
import dadgad from './songs/dadgad.json';

export interface ISong {
  title?: string;
  bpm?: number;
  tracks: ITrackConfig[];
}

export interface INote {
  value: string;
  duration: number; // in sixteenths
}

export const MPC_INSTRUMENT_TYPE = 'MPC';

export interface ITrackConfig {
  name: string;
  patterns: INote[][];
  midiOutput: number;
  rate?: number;
  loop?: boolean;
  octaveOffset?: number;
  midiChannel: number;
  instrumentType?: string;
  pad?: string;
}

const SONGS = Object.freeze([
  dadgad,
  loopy2,
  in_c,
  piano_phase,
  loopy,
]);

const WHITELISTED_ATTRIBUTES = Object.freeze([
  'title',
  'bpm',
  'tracks',
]);

export default SONGS.map((song) => {
  return pick(song, WHITELISTED_ATTRIBUTES);
}) as ISong[];
