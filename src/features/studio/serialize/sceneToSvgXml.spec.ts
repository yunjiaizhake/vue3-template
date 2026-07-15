import { describe, expect, it } from 'vitest';
import { createShape } from '../model/geometry';
import { sceneToSvgXml } from './sceneToSvgXml';

describe('sceneToSvgXml', () => {
  it('exports an empty canvas frame', () => {
    const xml = sceneToSvgXml([]);
    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(xml).toContain('viewBox="0 0 960 640"');
    expect(xml).toContain('id="paper"');
  });

  it('includes a rect shape', () => {
    const shape = createShape('rect', 100, 100, 's1');
    const xml = sceneToSvgXml([shape]);
    expect(xml).toContain('<rect');
    expect(xml).toContain(`id="s1"`);
  });

  it('includes polygon for triangle', () => {
    const shape = createShape('triangle', 200, 200, 't1');
    const xml = sceneToSvgXml([shape]);
    expect(xml).toContain('<polygon');
    expect(xml).toContain('id="t1"');
  });
});
