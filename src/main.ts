/**
 * src/main.ts — entry router. Atlas is the default view; the live 3D Lab
 * loads only on ?view=lab so the Atlas first paint never pulls in three.js.
 */
async function mountLab(container: HTMLElement): Promise<void> {
  document.title = 'Technique Lab — live WebGPU exhibits';
  // The lab's layout assumes a bounded-height container: its stage is a flex
  // child and the renderer's ResizeObserver takes the canvas size from it.
  // Without an explicit chain of heights the stage grows to the document's
  // scroll height and the canvas is sized to it — observed once at 667x4925,
  // which renders as a blank stage rather than as an error.
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';
  container.style.height = '100%';
  await import('./lab/lab.css');
  const { mountTechniqueLab } = await import('./lab/runtime');
  const handle = await mountTechniqueLab(container);
  // The host owns the renderer and RAF loop; release them when leaving.
  window.addEventListener('pagehide', () => handle.dispose(), { once: true });
}

async function mountAtlasView(container: HTMLElement): Promise<void> {
  document.title = 'Skills Atlas — studied, demonstrated, carried';
  await import('./atlas/atlas.css');
  const { mountAtlas } = await import('./atlas/atlas');
  mountAtlas(container, { baseUrl: import.meta.env.BASE_URL });
}

async function main(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) throw new Error('#app is missing from index.html');
  const view = new URLSearchParams(location.search).get('view');
  try {
    if (view === 'lab') await mountLab(container);
    else await mountAtlasView(container);
  } catch (error) {
    container.textContent = '';
    const message = document.createElement('p');
    message.className = 'atlas-fatal';
    message.textContent =
      error instanceof Error ? `Failed to start: ${error.message}` : 'Failed to start.';
    container.appendChild(message);
  }
}

void main();
