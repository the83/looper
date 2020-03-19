const STATIC_COLOR = 144;
const PULSING_COLOR = 146;

const STATIC_CONTROL_COLOR = 176;
const PULSING_CONTROL_COLOR = 178;
/**
 * The main launchpad interface.
 */
export class Launchpad {
  // TODO: type me
  inputPort: any
  outputPort: any
  listeners: any

	constructor(inputPort, outputPort) {
		this.inputPort = inputPort;
		this.outputPort = outputPort;

		this.inputPort.onmidimessage = this.handleMidiMessage.bind(this);

		this.listeners = {
			onPadPress: [],
			onPadRelease: [],
			onControlPadPress: [],
			onControlPadRelease: []
		};
	}

	// -- SENDING --
	send(bytes) {
		this.outputPort.send(bytes);
	}

	ledOn(note, color, pulse = false) {
    const colorType = pulse ? PULSING_COLOR : STATIC_COLOR;
		this.send([colorType, note, color]);
	}

	ledOff(note) {
		this.send([0x80, note, 0x00]);
	}

  ctrlLedOn(note, color, pulse = false) {
    const colorType = pulse ? PULSING_CONTROL_COLOR : STATIC_CONTROL_COLOR;
		this.send([colorType, note, color]);
	}

	ctrlLedOff(note) {
		this.send([0x90, note, 0x00]);
	}

	clear() {
    for (let row = 1; row < 10; row++) {
      for (let column = 1; column < 10; column++) {
        const note = parseInt(column.toString() + row.toString());
        this.ledOff(note);
      }
    }
	}

	// -- RECEIVING --
	handleMidiMessage(event) {
		if (event.data.length !== 3) {
			console.log('Unknown message received.', event.data);
		}
		else if (event.data[0] === 0xb0 && event.data[2] === 0x7f) {
			// Control Pad press
			this.listeners.onControlPadPress.forEach(callback => callback(event.data[1]));
		}
		else if (event.data[0] === 0xb0 && event.data[2] === 0x0) {
			// Control Pad release
			this.listeners.onControlPadRelease.forEach(callback => callback(event.data[1]));
		}
		else if (event.data[0] === 0x90 && event.data[2] === 0x7f) {
			this.listeners.onPadPress.forEach(callback => callback(event.data[1]));
		}
		else if (event.data[0] === 0x90 && event.data[2] === 0x0) {
			// Pad release
			this.listeners.onPadRelease.forEach(callback => callback(event.data[1]));
		}
	}

	onPadPress(callback) {
		this.listeners.onPadPress.push(callback);
	}

	onPadRelease(callback) {
		this.listeners.onPadRelease.push(callback);
	}

	onControlPadPress(callback) {
		this.listeners.onControlPadPress.push(callback);
	}

	onControlPadRelease(callback) {
		this.listeners.onControlPadRelease.push(callback);
	}
};

export const autoDetectLaunchpad = (midiAccess, name = 'launchpad') => {
	let launchpadInput = null,
		launchpadOutput = null;

	for (let entry of midiAccess.inputs) {
		const input = entry[1];

		if (input.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
			launchpadInput = input;
		}
	}

	for (let entry of midiAccess.outputs) {
		const output = entry[1];

		if (output.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
			launchpadOutput = output;
		}
	}

	if (launchpadInput !== null && launchpadOutput !== null) {
		return new Launchpad(launchpadInput, launchpadOutput);
	}
};

export default autoDetectLaunchpad;
