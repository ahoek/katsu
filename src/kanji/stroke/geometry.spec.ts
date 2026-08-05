import { Point, crossingDepth } from './geometry';

/**
 * The one piece of geometry that is not plain arithmetic: how squarely one line
 * crosses another, which is what tells a stroke drawn through a line from a
 * stroke that stops on it.
 */
describe('crossingDepth', () => {
  const line = (from: Point, to: Point) => [from, to];
  const horizontal = line({ x: 0, y: 50 }, { x: 100, y: 50 });

  it('is zero for lines that do not meet', () => {
    expect(crossingDepth(line({ x: 50, y: 60 }, { x: 50, y: 90 }), horizontal)).toBe(0);
  });

  it('is zero for a line that stops on another', () => {
    expect(crossingDepth(line({ x: 50, y: 50 }, { x: 50, y: 90 }), horizontal)).toBe(0);
  });

  it('measures how far a line reaches to either side', () => {
    expect(crossingDepth(line({ x: 50, y: 30 }, { x: 50, y: 90 }), horizontal)).toBe(20);
    expect(crossingDepth(line({ x: 50, y: 45 }, { x: 50, y: 90 }), horizontal)).toBe(5);
  });

  it('reads the same crossing from either line', () => {
    const vertical = line({ x: 50, y: 30 }, { x: 50, y: 90 });

    expect(crossingDepth(horizontal, vertical)).toBe(20);
  });

  it('is small where a line clips the tip of another', () => {
    // Over the end of the horizontal, which has 2 units left to give.
    const vertical = line({ x: 98, y: 10 }, { x: 98, y: 90 });

    expect(crossingDepth(vertical, horizontal)).toBe(2);
  });
});
