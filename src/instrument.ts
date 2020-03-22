import WebMidi, { Output } from 'webmidi';

const MIDI_PORT = 1;

export default class Instrument {
  private midiOutput: Output
  private octaveOffset: number

  constructor(midiOutput, octaveOffset) {
    this.midiOutput = midiOutput;
    this.octaveOffset = octaveOffset || 0;
  }

  playNote(note: string, duration: number, velocity: number = 1) {
    if (!note) return;

    const noteNumber = WebMidi.guessNoteNumber(note);
    const noteWithOffset = noteNumber + (this.octaveOffset * 12)
    const noteToPlay = noteWithOffset > 0 && noteWithOffset < 127 ? noteWithOffset : note;

    this.midiOutput.playNote(noteToPlay, MIDI_PORT, { duration, velocity: 1 });
  }
}
