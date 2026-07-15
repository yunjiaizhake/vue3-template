import type { SceneShape } from '../model/types';
import { sceneToSvgXml } from './sceneToSvgXml';

export function downloadScene(
  shapes: SceneShape[],
  extension: 'svg' | 'xml' = 'svg',
): void {
  const xml = sceneToSvgXml(shapes);
  const mime =
    extension === 'svg'
      ? 'image/svg+xml;charset=utf-8'
      : 'application/xml;charset=utf-8';
  const blob = new Blob([xml], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `plotter-scene.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
