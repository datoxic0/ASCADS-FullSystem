const CACHE_NAME = 'engigraph-pro-v9';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/style-base.css',
    '/style-ribbon.css',
    '/style-sidebar.css',
    '/style-canvas.css',
    '/style-modals.css',
    '/style-status.css',
    '/style-responsive.css',
    '/app.js',
    '/ui.js',
    '/geometry.js',
    '/view.js',
    '/tools.js',
    '/history.js',
    '/ai.js',
    '/engine-circuit.js',
    '/engine-circuit-utils.js',
    '/engine-circuit-solver.js',
    '/engine-geometry-math.js',
    '/engine-geometry-snap.js',
    '/engine-geometry-cad.js',
    '/engine-theme.js',
    '/engine-shortcuts.js',
    '/engine-persistence.js',
    '/engine-commands.js',
    '/engine-validation.js',
    '/engine-simulation-flow.js',
    '/engine-simulation-acoustic.js',
    '/engine-simulation-noise.js',
    '/tool-drawing.js',
    '/tool-drawing-shapes.js',
    '/tool-drawing-instruments.js',
    '/tool-drawing-handles.js',
    '/tool-modelling.js',
    '/tool-modelling-geometric.js',
    '/tool-modelling-mesh.js',
    '/tool-modelling-parametrics.js',
    '/tool-modelling-manufacturing.js',
    '/tool-annotations.js',
    '/tool-components.js',
    '/tool-parts-factory.js',
    '/tool-events.js',
    '/tool-selection.js',
    '/ui-ribbon.js',
    '/ui-ribbon-sections.js',
    '/ui-ribbon-templates-core.js',
    '/ui-ribbon-templates-engineering.js',
    '/ui-ribbon-templates-mechatronic.js',
    '/ui-layers.js',
    '/ui-properties.js',
    '/ui-properties-templates.js',
    '/ui-properties-handlers.js',
    '/ui-modals.js',
    '/ui-modals-templates.js',
    '/ui-documentation-content.js',
    '/ui-templates.js',
    '/ui-io.js',
    '/ui-reports.js',
    '/ui-simulation.js',
    '/vectorizer.js',
    '/EngiGraphLogo.png',
    '/favicon.ico',
    'https://esm.sh/lucide',
    'https://esm.sh/paper'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => caches.delete(key)));
    }).then(() => {
      self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (e) => {
    // Pass-through
});