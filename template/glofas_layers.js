// Wrap the execution inside a cleanly bound window namespace instead of an immediate guess loop
window.initGloFASModule = function(mapInstance) {
    const layersConfig = [
        { id: 'AccRainEGE', layerName: 'AccRainEGE', toggleId: 'accumulatedPrecip' },
        { id: 'EGE_probRgt50', layerName: 'EGE_probRgt50', toggleId: 'prob50' },
        { id: 'EGE_probRgt150', layerName: 'EGE_probRgt150', toggleId: 'prob150' },
        { id: 'EGE_probRgt300', layerName: 'EGE_probRgt300', toggleId: 'prob300' },
        { id: 'FloodSummary1_30', layerName: 'FloodSummary1_30', toggleId: 'sum1_30' },
        { id: 'FloodSummary1_3', layerName: 'sumAL41EGE', toggleId: 'sum1_3' },
        { id: 'sumAL42EGE', layerName: 'sumAL42EGE', toggleId: 'sum4_10' },
        { id: 'sumAL43EGE', layerName: 'sumAL43EGE', toggleId: 'sum11_30' }
    ];

    function initGlofasLayers() {
        layersConfig.forEach(config => {
            // Safely drop existing layers before generating duplicates
            if (mapInstance.getLayer(config.id)) {
                mapInstance.removeLayer(config.id);
            }
            if (mapInstance.getSource(config.id)) {
                mapInstance.removeSource(config.id);
            }
        });

        layersConfig.forEach(config => {
            // Register WMS Source with corrected bounding box and resolution parameters
            if (!mapInstance.getSource(config.id)) {
                mapInstance.addSource(config.id, {
                    type: 'raster',
                    tiles: [
                        `https://globalfloods-ows.ecmwf.int/glofas-ows/ows.py?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX={bbox-epsg-3857}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${config.layerName}&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE`
                    ],
                    tileSize: 256
                });
            }

            // Inject the layer into the map canvas context
            if (!mapInstance.getLayer(config.id)) {
                const toggleElement = document.getElementById(config.toggleId);
                const isVisible = toggleElement ? (toggleElement.classList.contains('on') || toggleElement.checked) : false;
                
                // Position layer cleanly beneath administrative vector overlays
                const beforeLayer = mapInstance.getLayer('national-boundary-layer') ? 'national-boundary-layer' : undefined;

                mapInstance.addLayer({
                    id: config.id,
                    type: 'raster',
                    source: config.id,
                    layout: {
                        'visibility': isVisible ? 'visible' : 'none'
                    },
                    paint: {
                        'raster-opacity': 0.85 // Slight transparency allows terrain to peak through
                    }
                }, beforeLayer);
            }
        });
    }

    function bindGlofasLayerControls() {
        layersConfig.forEach(t => {
            const containerSwitch = document.getElementById(t.toggleId);
            if (containerSwitch) {
                // Ensure fresh event attachment without duplications
                containerSwitch.replaceWith(containerSwitch.cloneNode(true));
                
                const newSwitch = document.getElementById(t.toggleId);
                newSwitch.addEventListener('click', function(e) {
                    e.stopPropagation();
                    this.classList.toggle('on');
                    // Sync checkbox checked state with 'on' class in case it's a checkbox input
                    if (this.type === 'checkbox') {
                        this.classList.toggle('on', this.checked);
                    }
                    const isVisible = this.classList.contains('on');
                    if (mapInstance.getLayer(t.id)) {
                        mapInstance.setLayoutProperty(t.id, 'visibility', isVisible ? 'visible' : 'none');
                    }
                    if (typeof refreshActiveLayersLegend === 'function') {
                        refreshActiveLayersLegend();
                    }
                });
            }
        });
    }

    mapInstance.on('style.load', initGlofasLayers);
    initGlofasLayers();
    bindGlofasLayerControls();
};
