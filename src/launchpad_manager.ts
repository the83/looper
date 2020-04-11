import WebMidi, { Input, Output } from 'webmidi';
import LaunchpadMini, { COLORS } from './launchpad_mini';
import { times } from 'lodash';

const CONTROLS = {
  PLAY: 19,
  PAGE_UP: 91,
  PAGE_DOWN: 92,
  PAGE_LEFT: 93,
  PAGE_RIGHT: 94,
  RESET_PATTERN: 89,
  RESET_ALL: 49,
  SESSION_MODE: 95,
  SONG_SELECT_MODE: 97,
};

export const OFFSET_AXES = Object.freeze({
  Y: 'Y',
  X: 'X',
});

interface ILaunchpadManagerConfig {
  input: Input;
  output: Output;
  togglePlay: Function;
  incrementPage: Function;
  onPadPress: Function;
  resetPattern: Function;
  resetAll: Function;
  setSongSelectMode: Function;
  setSessionMode: Function;
}

const ACTIVE_MODE = COLORS.TEAL;
const INACTIVE_MODE = COLORS.GREY;

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

  private initializeLeds() {
    this.launchpad.ledPulse(CONTROLS.PLAY, COLORS.GREEN);
    this.launchpad.ledOn(CONTROLS.PAGE_UP, INACTIVE_MODE);
    this.launchpad.ledOn(CONTROLS.PAGE_DOWN, INACTIVE_MODE);
    this.launchpad.ledOn(CONTROLS.PAGE_LEFT, INACTIVE_MODE);
    this.launchpad.ledOn(CONTROLS.PAGE_RIGHT, INACTIVE_MODE);
    this.launchpad.ledOn(CONTROLS.RESET_PATTERN, COLORS.YELLOW);
    this.launchpad.ledOn(CONTROLS.RESET_ALL, COLORS.ORANGE);
    this.launchpad.ledOn(CONTROLS.SESSION_MODE, ACTIVE_MODE);
    this.launchpad.ledOn(CONTROLS.SONG_SELECT_MODE, INACTIVE_MODE);
  }

  clearMainGrid() {
    times(8, (i) => {
      const row = i + 1;
      times(8, (x) => {
        const col = x + 1;
        const pad = parseInt(row.toString() + col.toString());
        this.launchpad.ledOff(pad);
      });
    });
  }

  onCtrlPadPress(e) {
    const pad = e[1];

    if (pad === CONTROLS.PLAY) {
      const isPlaying = this.config.togglePlay();
      const color = isPlaying ? COLORS.RED : COLORS.GREEN;
      this.launchpad.ledPulse(pad, color);
    }

    if (pad === CONTROLS.PAGE_UP) {
      this.config.incrementPage(OFFSET_AXES.Y, -1);
    }

    if (pad === CONTROLS.PAGE_DOWN) {
      this.config.incrementPage(OFFSET_AXES.Y, 1);
    }

    if (pad === CONTROLS.PAGE_LEFT) {
      this.config.incrementPage(OFFSET_AXES.X, -1);
    }

    if (pad === CONTROLS.PAGE_RIGHT) {
      this.config.incrementPage(OFFSET_AXES.X, 1);
    }

    if (pad === CONTROLS.RESET_PATTERN) {
      this.config.resetPattern();
    }

    if (pad === CONTROLS.RESET_ALL) {
      this.config.resetAll();
    }

    if (pad === CONTROLS.SESSION_MODE) {
      this.launchpad.ledOn(CONTROLS.SESSION_MODE, ACTIVE_MODE);
      this.launchpad.ledOn(CONTROLS.SONG_SELECT_MODE, INACTIVE_MODE);
      this.config.setSessionMode();
    }

    if (pad === CONTROLS.SONG_SELECT_MODE) {
      this.launchpad.ledOn(CONTROLS.SESSION_MODE, INACTIVE_MODE);
      this.launchpad.ledOn(CONTROLS.SONG_SELECT_MODE, ACTIVE_MODE);
      this.config.setSongSelectMode();
    }
  }

  scrollText(text, color = COLORS.TEAL) {
    this.launchpad.scrollText(text, color);
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

      if (row > patternsAvailable - 1) {
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
            this.launchpad.ledPulse(pad, COLORS.GREEN);
          } else {
            // current step isn't on current page
            this.launchpad.ledOn(pad, COLORS.PURPLE);
          }
        }
      }
    });
  }

  drawCollection(collection: any[], selected: any) {
    collection.forEach((item, idx) => {
      const column = idx % 8 + 1;
      const row = 8 - Math.floor(idx / 8);
      const pad = parseInt(row.toString() + column.toString());
      const color = item === selected ? COLORS.RED : COLORS.PINK;
      this.launchpad.ledOn(pad, color);
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
