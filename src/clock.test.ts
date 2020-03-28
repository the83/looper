import Clock from './clock';
import { times } from 'lodash';

describe('Clock', () => {
  const bpm = 120;
  const index = 4;
  const defaultPatterns = Object.freeze([
    [
      { value: 'C4', duration: 1 },
      { value: 'D4', duration: 2 },
      { value: 'E4', duration: 1 },
    ],
    [{ value: 'F4', duration: 3 }]
  ]);

  function buildClock(patterns = defaultPatterns, loop = true) {
    const config = {
      loop,
      patterns,
      name: 'test',
    };

    const onTick = jest.fn();
    const onNoteChange = jest.fn();

    return new Clock(
      onTick,
      onNoteChange,
      config,
      bpm,
      index,
    );
  }

  describe('tick', () => {
    describe('when loop is true', () => {
      it('loops through the current pattern', () => {
        const clock = buildClock(defaultPatterns);
        times(8, () => clock.testTick());
        expect(clock.onNoteChange.mock.calls).toEqual([
          [4, 'C4', 125],
          [4, 'D4', 250],
          [4, 'E4', 125],
          [4, 'C4', 125],
          [4, 'D4', 250],
          [4, 'E4', 125],
        ]);
      });

      it('can handle single-note patterns', () => {
        const clock = buildClock([[
          { value: 'C4', duration: 1 },
        ]]);

        times(5, () => clock.testTick());
        expect(clock.onTick).toHaveBeenCalledTimes(5);
        expect(clock.onNoteChange.mock.calls).toEqual([
          [4, 'C4', 125],
          [4, 'C4', 125],
          [4, 'C4', 125],
          [4, 'C4', 125],
          [4, 'C4', 125],
        ]);
      });

      it('can move to the next pattern after the current pattern is complete if next pattern is queued', () => {
        const clock = buildClock(defaultPatterns);
        times(1, () => clock.testTick());
        clock.setNextPattern(1, 0);
        times(4, () => clock.testTick());

        expect(clock.onNoteChange.mock.calls).toEqual([
          [4, 'C4', 125],
          [4, 'D4', 250],
          [4, 'E4', 125],
          [4, 'F4', 375],
        ]);
      });
    });

    describe('when loop is false', () => {
      // TODO: fix me
      it('moves to the next pattern automatically', () => {
         const patterns = [
          [
            { value: 'C4', duration: 1 },
            { value: 'D4', duration: 2 },
          ],
          [{ value: 'F4', duration: 1 }],
          [{ value: 'G4', duration: 2 }],
        ];

        const clock = buildClock(patterns, false);
        times(7, () => clock.testTick());
        expect(clock.onNoteChange.mock.calls).toEqual([
          [4, 'C4', 125],
          [4, 'D4', 250],
          [4, 'F4', 125],
          [4, 'G4', 250],
          [4, 'C4', 125],
        ]);
      });
    });
  });

  describe('start/stop', () => {
    it('toggles isPlaying to true and sets a new intervalId', () => {
      const clock = buildClock(defaultPatterns);
      expect(clock.intervalId).toEqual(0);

      clock.start();
      expect(clock.isPlaying).toEqual(true);
      expect(clock.intervalId).not.toEqual(0);

      clock.stop();
      expect(clock.isPlaying).toEqual(false);
    });
  });

  describe('reset', () => {
    it('sets the position to 0 within the current pattern', () => {
      const patterns = [
        [
          { value: 'C1', duration: 1 },
          { value: 'D1', duration: 1 },
          { value: 'E1', duration: 1 },
        ],
        [
          { value: 'F4', duration: 1 },
          { value: 'G4', duration: 1 },
          { value: 'A5', duration: 1 },
          { value: 'B5', duration: 1 },
        ],
      ];

      const clock = buildClock(patterns);
      clock.setNextPattern(1, 0);

      times(2, () => clock.testTick());
      clock.reset();
      times(2, () => clock.testTick());
      expect(clock.onNoteChange.mock.calls).toEqual([
        [4, 'F4', 125],
        [4, 'G4', 125],
        [4, 'F4', 125],
        [4, 'G4', 125],
        [4, 'A5', 125],
      ]);
    });
  });

  describe('resetAll', () => {
    it('sets the pattern and position to 0', () => {
      const patterns = [
        [
          { value: 'C1', duration: 1 },
          { value: 'D1', duration: 1 },
          { value: 'E1', duration: 1 },
        ],
        [
          { value: 'F4', duration: 1 },
          { value: 'G4', duration: 1 },
          { value: 'A5', duration: 1 },
          { value: 'B5', duration: 1 },
        ],
      ];

      const clock = buildClock(patterns);
      clock.setNextPattern(1, 0);

      times(2, () => clock.testTick());
      clock.resetAll();
      times(3, () => clock.testTick());

      expect(clock.onNoteChange.mock.calls).toEqual([
        [4, 'F4', 125],
        [4, 'G4', 125],
        [4, 'C1', 125],
        [4, 'D1', 125],
        [4, 'E1', 125],
        [4, 'C1', 125],
      ]);
    });
  });

  describe('setBpm', () => {
    it('sets the BPM and resets the timer', () => {
      const clock = buildClock(defaultPatterns);
      clock.start();
      const previousInterval = clock.intervalId.toString();
      clock.setBpm(999);
      const newInterval = clock.intervalId.toString();

      expect(clock.bpm).toEqual(999);
      expect(previousInterval).not.toEqual(newInterval)
    });
  });
});
