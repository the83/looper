import { pick } from 'lodash';
import loopy from './songs/loopy.json';
import nickel_slots from './songs/nickel_slots.json';
import piano_phase from './songs/piano_phase.json';

export interface ISong {
  title?: string;
  bpm?: number;
  tracks: ITrackConfig[];
}

export interface INote {
  value: string;
  duration: number; // in sixteenths
}

export interface ITrackConfig {
  name: string;
  patterns: INote[][];
  rate?: number;
  loop?: boolean;
  octaveOffset?: number;
}

const SONGS = Object.freeze([
  loopy,
  nickel_slots,
  piano_phase,
]);

const WHITELISTED_ATTRIBUTES = Object.freeze([
  'title',
  'bpm',
  'tracks',
]);

export default SONGS.map((song) => {
  return pick(song, WHITELISTED_ATTRIBUTES);
}) as ISong[];
