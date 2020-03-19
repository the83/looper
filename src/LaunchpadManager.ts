import { Launchpad } from 'web-midi-launchpad/src/launchpad.js';
import { times } from 'lodash';

export default class LaunchpadManager {
  launchpad: Launchpad
  onPadPress: Function

  constructor(launchpad, onPadPress) {
    this.launchpad = launchpad;
    this.onPadPress = onPadPress;
    this.launchpad.onPadPress(this.handlePadPress.bind(this));
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

  clear() {
    this.launchpad.clear();
  }

  drawColumn(
    patternsAvailable,
    pattern,
    nextPattern,
    index,
  ) {
    const currentPad = this.getPad(pattern, index);
    const nextPad = this.getPad(nextPattern, index);

    times(patternsAvailable, (potentialPattern) => {
      const pad = this.getPad(potentialPattern, index);
      if (pad !== nextPad) {
        this.launchpad.ledOn(pad, 51, false); // green
      }
    });

    if (currentPad !== nextPad) {
      this.launchpad.ledOn(nextPad, 51, true); // green
    }

    // needs to go last
    this.launchpad.ledOn(currentPad, 6, true); // red
  }
}
