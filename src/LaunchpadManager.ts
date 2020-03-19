import { Launchpad } from 'web-midi-launchpad/src/launchpad.js';
import { times } from 'lodash';

export default class LaunchpadManager {
  launchpad: Launchpad
  onPadPress: Function
  onControlPadPress: Function

  constructor(launchpad, onPadPress, onControlPadPress) {
    this.launchpad = launchpad;
    this.onPadPress = onPadPress;
    this.onControlPadPress = onControlPadPress;
    this.launchpad.onPadPress(this.handlePadPress.bind(this));
    this.launchpad.onControlPadPress(this.handleControlPadPress.bind(this));
  }

  private getPad(pattern, index) {
    if (pattern === undefined) return null;
    const column = index + 1;
    const row = 8 - (pattern % 8);
    return parseInt(row.toString() + column.toString());
  }

  private parsePadNumber(padNumber) {
    const parsed = padNumber.toString().split('').map(i => parseInt(i));
    const column = parsed[1] - 1;
    const row = 8 - parsed[0];
    return { column, row };
  }

  handlePadPress(padNumber) {
    const parsed = this.parsePadNumber(padNumber);
    this.onPadPress(parsed);
  }

  handleControlPadPress(padNumber) {
    this.onControlPadPress(padNumber);
  }

  clear() {
    this.launchpad.clear();
  }

  ctrlLedOn(note, color, pulse = false) {
    this.launchpad.ctrlLedOn(note, color, pulse);
	}

	ctrlLedOff(note) {
    this.launchpad.ctrlLedOff(note);
	}

  drawColumn(
    patternsAvailable,
    pattern,
    nextPattern,
    index,
    offset,
  ) {
    const currentPad = this.getPad(pattern, index);
    const nextPad = this.getPad(nextPattern, index);

    times(8, (row) => {
      const pad = this.getPad(row, index);
      if (row + 1 > patternsAvailable) {
        this.launchpad.ledOff(pad);
      } else {
        if (pad !== currentPad) {
          const flash = (pad === nextPad) && (nextPad !== currentPad);
          this.launchpad.ledOn(pad, 51, flash);
        }

        else if (pad === currentPad) {
          if (pattern >= offset && pattern < offset + 8) {
            this.launchpad.ledOn(nextPad, 6, true);
          } else {
            // current step isn't on current page
            this.launchpad.ledOn(pad, 51);
          }
        }
      }
    });
  }
}
