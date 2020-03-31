// launchpad mini mk3 docs: https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Launchpad%20Mini%20-%20Programmers%20Reference%20Manual.pdf
import textToHexArray from './text_to_hex_array';

export const COLORS = Object.freeze({
  BLANK: 0x00,
  GREY: 0x47,
  RED: 0x05,
  ORANGE: 0x54,
  YELLOW: 0x0D,
  BLUE: 0x4F,
  GREEN: 0x15,
  TEAL: 0x4D,
  PURPLE: 0x33,
  PINK: 0x34,
});

const SYSEX_BASE_MESSAGE = Object.freeze([
  0x02,
  0x0D,
]);

const NOVATION_MANUFACTURER_ID = Object.freeze([
  0x00,
  0x20,
  0x29,
]);

const LED_ON_MESSAGE = 0x03;

const TEXT_SCROLL_MESSAGE = Object.freeze([
  0x07, // text scroll
  0x00, // looping off
  0x18, // speed
  0x00, // color in palette mode
]);

const COLOR_MODES = {
  STATIC: 0x00,
  FLASHING: 0x01,
  PULSING: 0x02,
};

export interface ILaunchpadConfig {
  input: any;
  output: any;
  onPadPress?: Function;
  onPadRelease?: Function;
  onCtrlPadPress?: Function;
  onCtrlPadRelease?: Function;
}

export default class LaunchpadMini {
  config: ILaunchpadConfig

  constructor(config: ILaunchpadConfig) {
    this.config = config;
    this.initializeDevice();
  }

  initializeDevice() {
    this.setToProgrammerMode();
    this.addListeners();
    this.clear();
    this.scrollText('looper', COLORS.TEAL);
  }

  clear() {
    for (let pad = 0; pad < 127; pad++) {
      this.ledOff(pad);
    }
  }

  ledOn(pad, color) {
    this.applyColor([COLOR_MODES.STATIC, pad, color]);
  }

  ledPulse(pad, color) {
    this.applyColor([COLOR_MODES.PULSING, pad, color]);
  }

  ledOff(pad) {
    this.applyColor([COLOR_MODES.STATIC, pad, COLORS.BLANK]);
  }

  scrollText(text, color) {
    const hexFromText = textToHexArray(text);
    this.sendSysex([...TEXT_SCROLL_MESSAGE, color, ...hexFromText]);
  }

  private applyColor(message) {
    this.sendSysex([LED_ON_MESSAGE, ...message]);
  }

  private sendSysex(message: number[]) {
    this.config.output.sendSysex(
      NOVATION_MANUFACTURER_ID,
      [...SYSEX_BASE_MESSAGE, ...message],
    );
  }

  private setToProgrammerMode() {
    this.sendSysex([0x00, 0x7F]);
  }

  private addListeners() {
    const {
      input,
      onPadPress,
      onPadRelease,
      onCtrlPadPress,
      onCtrlPadRelease,
    } = this.config;

    input.on('controlchange', 'all', (e) => {
      if (e.data[2] === 127) {
        if (onCtrlPadPress) onCtrlPadPress(e.data);
      }

      if (e.data[2] === 0) {
        if (onCtrlPadRelease) onCtrlPadRelease(e.data);
      }
    });

    this.config.input.on('noteon', 'all', (e) => {
      if (onPadPress) onPadPress(e.data);
    });

    this.config.input.on('noteoff', 'all', (e) => {
      if (onPadRelease) onPadRelease(e.data);
    });
  }
}
