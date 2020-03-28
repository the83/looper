import WebMidi, { Input, Output } from 'webmidi';
import LaunchpadMini, { COLORS } from './launchpad_mini';
import { times } from 'lodash';

const PLAY_BUTTON_PAD_NUMBER = 19;
const PAGE_UP_PAD_NUMBER = 91;
const PAGE_DOWN_PAD_NUMBER = 92;

interface ILaunchpadManagerConfig {
  input: Input;
  output: Output;
  togglePlay: Function;
  updatePage: Function;
  onPadPress: Function;
}

export default class LaunchpadManager {
  launchpad
  config: ILaunchpadManagerConfig

  constructor(config: ILaunchpadManagerConfig) {
    this.config = config;

    this.launchpad = new LaunchpadMini({
      input: config.input,
      output: config.output,
      onPadPress: this.onPadPress.bind(this),
      onCtrlPadPress: this.onCtrlPadPress.bind(this),
    });

    this.initializeLeds();
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

  initializeLeds() {
    this.launchpad.ledPulse(PLAY_BUTTON_PAD_NUMBER, COLORS.GREEN);
    this.launchpad.ledOn(PAGE_UP_PAD_NUMBER, COLORS.GREY);
    this.launchpad.ledOn(PAGE_DOWN_PAD_NUMBER, COLORS.GREY);
  }

  onCtrlPadPress(e) {
    const pad = e[1];

    if (pad === PLAY_BUTTON_PAD_NUMBER) {
      const isPlaying = this.config.togglePlay();
      const color = isPlaying ? COLORS.RED : COLORS.GREEN;
      this.launchpad.ledPulse(pad, color);
    }

    if (pad === PAGE_UP_PAD_NUMBER) {
      this.config.updatePage(-1);
    }

    if (pad === PAGE_DOWN_PAD_NUMBER) {
      this.config.updatePage(1);
    }
  }

  onPadPress(e) {
    const parsed = this.parsePadNumber(e[1]);
    return this.config.onPadPress(parsed);
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
          if (pad === nextPad && nextPad !== currentPad) {
            this.launchpad.ledPulse(pad, COLORS.PURPLE);
          } else {
            this.launchpad.ledOn(pad, COLORS.PURPLE);
          }
        }

        else if (pad === currentPad) {
          if (pattern >= offset && pattern < offset + 8) {
            this.launchpad.ledPulse(nextPad, COLORS.RED);
          } else {
            // current step isn't on current page
            this.launchpad.ledOn(pad, COLORS.PURPLE);
          }
        }
      }
    });
  }
}

export function detectLaunchpad(config, callback) {
  WebMidi.enable((_err) => {
    const input = WebMidi.getInputByName('Launchpad Mini MK3 LPMiniMK3 MIDI Out');
    const output = WebMidi.getOutputByName('Launchpad Mini MK3 LPMiniMK3 MIDI In');
    if (input && output) {
      callback(
        new LaunchpadManager({
          input,
          output,
          ...config,
        })
      );
    } else {
      console.log('Could not detect Launchpad!');
    }
  }, true);
}
