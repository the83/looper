import { pick } from 'lodash';
import loopy from './songs/loopy.json';
import piano_phase from './songs/piano_phase.json';
import in_c from './songs/in_c.json';

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
  midiOutput: number;
  rate?: number;
  loop?: boolean;
  octaveOffset?: number;
}

const SONGS = Object.freeze([
  loopy,
  piano_phase,
  in_c,
]);

const WHITELISTED_ATTRIBUTES = Object.freeze([
  'title',
  'bpm',
  'tracks',
]);

export default SONGS.map((song) => {
  return pick(song, WHITELISTED_ATTRIBUTES);
}) as ISong[];
