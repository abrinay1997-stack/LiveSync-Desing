import { describe, test, expect } from 'vitest';
import { validateConnection, isPortCompatible } from '../signalFlow';
import { PortDefinition } from '../../../types';

const makePort = (
  type: PortDefinition['type'],
  direction: PortDefinition['direction'],
  id = 'p1'
): PortDefinition => ({
  id,
  name: `Port ${id}`,
  type,
  direction,
});

describe('validateConnection', () => {
  test('compatible connector types (speakon to speakon) should be valid', () => {
    const source = makePort('speakon', 'out');
    const target = makePort('speakon', 'in');
    const result = validateConnection(source, target);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('incompatible connector types (xlr to speakon) should fail', () => {
    const source = makePort('xlr', 'out');
    const target = makePort('speakon', 'in');
    const result = validateConnection(source, target);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Incompatible connector types');
  });

  test('OUT -> IN is valid', () => {
    const source = makePort('xlr', 'out');
    const target = makePort('xlr', 'in');
    expect(validateConnection(source, target).valid).toBe(true);
  });

  test('IN -> IN is invalid', () => {
    const source = makePort('xlr', 'in');
    const target = makePort('xlr', 'in');
    const result = validateConnection(source, target);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Input to Input');
  });

  test('OUT -> OUT is invalid', () => {
    const source = makePort('speakon', 'out');
    const target = makePort('speakon', 'out');
    const result = validateConnection(source, target);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Output to Output');
  });

  test('BI -> IN is valid', () => {
    const source = makePort('ethercon', 'bi');
    const target = makePort('ethercon', 'in');
    expect(validateConnection(source, target).valid).toBe(true);
  });

  test('BI -> OUT is valid', () => {
    const source = makePort('ethercon', 'bi');
    const target = makePort('ethercon', 'out');
    expect(validateConnection(source, target).valid).toBe(true);
  });

  test('BI -> BI is valid', () => {
    const source = makePort('ethercon', 'bi');
    const target = makePort('ethercon', 'bi');
    expect(validateConnection(source, target).valid).toBe(true);
  });
});

describe('isPortCompatible', () => {
  test('power cable with powercon port returns true', () => {
    const port = makePort('powercon', 'in');
    expect(isPortCompatible(port, 'power')).toBe(true);
  });

  test('signal cable with xlr port returns true', () => {
    const port = makePort('xlr', 'out');
    expect(isPortCompatible(port, 'signal')).toBe(true);
  });

  test('signal cable with speakon port returns true', () => {
    const port = makePort('speakon', 'in');
    expect(isPortCompatible(port, 'signal')).toBe(true);
  });

  test('network cable with ethercon port returns true', () => {
    const port = makePort('ethercon', 'bi');
    expect(isPortCompatible(port, 'network')).toBe(true);
  });

  test('power cable with xlr port returns false', () => {
    const port = makePort('xlr', 'out');
    expect(isPortCompatible(port, 'power')).toBe(false);
  });

  test('network cable with speakon port returns false', () => {
    const port = makePort('speakon', 'in');
    expect(isPortCompatible(port, 'network')).toBe(false);
  });

  test('signal cable with powercon port returns false', () => {
    const port = makePort('powercon', 'in');
    expect(isPortCompatible(port, 'signal')).toBe(false);
  });
});
