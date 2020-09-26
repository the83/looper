import WebMidi, { Output } from 'webmidi';

export const DEFAULT_MIDI_CHANNEL = 1;
const DEFAULT_VELOCITY = 1;

interface INote {
  value: string;
  duration: number;
  velocity?: number;
  channel?: number;
}

export default class Instrument {
  private midiOutput: Output
  private octaveOffset: number

  constructor(midiOutput, octaveOffset) {
    this.midiOutput = midiOutput;
    this.octaveOffset = octaveOffset || 0;
  }

  playNote(note: INote) {
    if (!note.value) return;

    const noteNumber = WebMidi.guessNoteNumber(note.value);
    const noteWithOffset = noteNumber + (this.octaveOffset * 12)
    const noteToPlay = noteWithOffset > 0 && noteWithOffset < 127 ? noteWithOffset : note.value;

    this.midiOutput.playNote(
      noteToPlay,
      note.channel || DEFAULT_MIDI_CHANNEL,
      {
        duration: note.duration,
        velocity: note.velocity || DEFAULT_VELOCITY,
      },
    );
  }
}
