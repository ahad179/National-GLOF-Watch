/**
 * ============================================================
 * GLOF PORTAL INCIDENTS (COMBINED LAYER AND POPUP LOGIC)
 * Includes: Hisper Incident, Khyber Incident, and Thore Incident
 * ============================================================
 */

// ============================================================
// 1. HISPER INCIDENT
// Coordinates: [74.99042958134855, 36.174946979474434] (Hispar Valley/Glacier)
// Video Asset: data/Hisper/Incident.mp4
// ============================================================

let hisperMarker = null;
let hisperPopup = null;

(function injectHisperStyles() {
    const styleId = 'hisper-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .hisper-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .hisper-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .hisper-blink-marker:hover .hisper-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .hisper-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: hisper-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes hisper-pulsate {
                0% {
                    transform: scale(0.3);
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
                100% {
                    transform: scale(2.8);
                    opacity: 0;
                }
            }
            .hisper-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 10px !important;
                width: 180px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .hisper-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .hisper-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .hisper-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .hisper-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            #hisper-images-widget {
                position: absolute;
                left: 50%;
                bottom: 24px;
                transform: translate(-50%, 20px);
                width: clamp(520px, 45vw, 750px);
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                padding: 10px 14px 14px 14px !important;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                backdrop-filter: blur(12px) !important;
                z-index: 10;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            #hisper-images-widget.is-visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transform: translate(-50%, 0);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            #hisper-images-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.15);
                padding-bottom: 6px;
                margin-bottom: 4px;
            }
            #hisper-images-title {
                font-size: 13px;
                font-weight: 700;
                color: #f87171;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
            }
            #hisper-images-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 20px;
                cursor: pointer;
                line-height: 1;
                padding: 0;
                outline: none;
                transition: color 0.2s;
            }
            #hisper-images-close:hover {
                color: #ffffff;
            }
            #hisper-images-body {
                display: flex;
                gap: 12px;
                width: 100%;
                justify-content: space-between;
            }
            .hisper-img-card {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                background: rgba(0, 0, 0, 0.4);
                padding: 8px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
            }
            .hisper-img-card:hover {
                border-color: rgba(239, 68, 68, 0.5);
                background: rgba(239, 68, 68, 0.05);
                transform: translateY(-2px);
            }
            .hisper-img-card img {
                width: 100%;
                height: auto;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .hisper-img-label {
                font-size: 10.5px;
                color: #cbd5e1;
                text-align: center;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
})();

function toggleHisperIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [74.99042958134855, 36.174946979474434];

    if (isChecked) {
        if (hisperMarker) {
            hisperMarker.remove();
        }
        if (hisperPopup) {
            hisperPopup.remove();
        }

        const el = document.createElement('div');
        el.className = 'hisper-blink-marker';
        el.title = "Hisper Incident Location - Click to toggle video popup";

        const ring = document.createElement('div');
        ring.className = 'hisper-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'hisper-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        hisperPopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'hisper-incident-popup'
        }).setHTML(`
            <div class="hisper-popup-content">
                <div class="hisper-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Hisper Incident</h4>
                </div>
                <div class="hisper-popup-body">
                    <video src="data/Hisper/Incident.mp4" autoplay loop muted playsinline controls style="width: 100%; max-height: 280px; object-fit: contain; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 12px rgba(0,0,0,0.6);"></video>
                    <div style="font-size: 10.5px; margin-top: 6px; color: #cbd5e1; line-height: 1.4;">
                        <p style="margin: 2px 0;"><strong>Location:</strong> Hispar Valley</p>
                        <p style="margin: 2px 0;"><strong>Coordinates:</strong> 36.17495° N, 74.99043° E</p>
                    </div>
                </div>
            </div>
        `);

        hisperMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(hisperPopup)
        .addTo(map1);

        hisperPopup.setLngLat(coordinates).addTo(map1);

        if (typeof showLakeTempChart === 'function') {
            showLakeTempChart('hisper-incident');
        }

        if (typeof showLakeVideoWidget === 'function') {
            showLakeVideoWidget('hisper-incident');
        }

        map1.flyTo({
            center: coordinates,
            zoom: 14.5,
            pitch: 55,
            bearing: 0,
            duration: 2500,
            essential: true
        });

        const imagesWidget = document.getElementById('hisper-images-widget');
        if (imagesWidget) {
            imagesWidget.style.display = 'flex';
            requestAnimationFrame(() => {
                imagesWidget.classList.add('is-visible');
            });
        }
    } else {
        if (hisperMarker) {
            hisperMarker.remove();
            hisperMarker = null;
        }
        if (hisperPopup) {
            hisperPopup.remove();
            hisperPopup = null;
        }
        if (typeof closeLakeTempWidget === 'function' && window.currentActiveLakeName === 'Hisper') {
            closeLakeTempWidget();
        }
        if (typeof closeLakeVideoWidget === 'function' && window.currentActiveLakeName === 'Hisper') {
            closeLakeVideoWidget();
        }
        closeHisperImagesWidget();
    }
}

function closeHisperImagesWidget() {
    const widget = document.getElementById('hisper-images-widget');
    if (widget) {
        widget.classList.remove('is-visible');
        setTimeout(() => {
            if (!widget.classList.contains('is-visible')) {
                widget.style.display = 'none';
            }
        }, 300);
    }
}

function zoomHisperImage(imgSrc, titleText) {
    const modal = document.getElementById('panelModal');
    const title = document.getElementById('panelModalTitle');
    const body = document.getElementById('panelModalBody');
    if (!modal || !title || !body) return;

    modal.dataset.activePanel = 'hisperImage';
    title.textContent = titleText;
    body.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.85); padding: 16px; box-sizing: border-box;">
            <img src="${imgSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; border: 1.5px solid rgba(239, 68, 68, 0.4); box-shadow: 0 0 30px rgba(0, 0, 0, 0.85);" alt="${titleText}" />
        </div>
    `;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}


// ============================================================
// 2. KHYBER INCIDENT
// Coordinates: [74.78597477331795, 36.58484445652914] (Khyber, Gojal Hunza)
// ============================================================

let khyberMarker = null;
let khyberPopup = null;

(function injectKhyberStyles() {
    const styleId = 'khyber-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .khyber-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .khyber-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .khyber-blink-marker:hover .khyber-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .khyber-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: khyber-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes khyber-pulsate {
                0% {
                    transform: scale(0.3);
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
                100% {
                    transform: scale(2.8);
                    opacity: 0;
                }
            }
            .khyber-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 12px !important;
                width: 200px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .khyber-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .khyber-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .khyber-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .khyber-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);
    }
})();

function toggleKhyberIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [74.78597477331795, 36.58484445652914];

    if (isChecked) {
        if (khyberMarker) {
            khyberMarker.remove();
        }
        if (khyberPopup) {
            khyberPopup.remove();
        }

        const el = document.createElement('div');
        el.className = 'khyber-blink-marker';
        el.title = "Khyber Incident Location - Click to toggle details popup";

        const ring = document.createElement('div');
        ring.className = 'khyber-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'khyber-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        khyberPopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'khyber-incident-popup'
        }).setHTML(`
            <div class="khyber-popup-content">
                <div class="khyber-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Khyber Incident</h4>
                </div>
                <div class="khyber-popup-body" style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                    <div style="padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 14px;"></i>
                        <span style="font-weight: 600; color: #fecaca;">Active Monitoring Alert</span>
                    </div>
                    <p style="margin: 4px 0;"><strong>Location:</strong> Khyber Valley, Gojal Hunza</p>
                    <p style="margin: 4px 0;"><strong>Coordinates:</strong> 36.58484° N, 74.78597° E</p>
                </div>
            </div>
        `);

        khyberMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(khyberPopup)
        .addTo(map1);

        khyberPopup.setLngLat(coordinates).addTo(map1);

        map1.flyTo({
            center: coordinates,
            zoom: 14.5,
            pitch: 55,
            bearing: 0,
            duration: 2500,
            essential: true
        });
    } else {
        if (khyberMarker) {
            khyberMarker.remove();
            khyberMarker = null;
        }
        if (khyberPopup) {
            khyberPopup.remove();
            khyberPopup = null;
        }
    }
}


// ============================================================
// 3. THORE INCIDENT
// Coordinates: [73.85572994889226, 35.480535509722905] (Thore Valley)
// Image Asset: data/Incidents/Thore Incident.jpeg
// ============================================================

let thoreMarker = null;
let thorePopup = null;

(function injectThoreStyles() {
    const styleId = 'thore-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .thore-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .thore-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .thore-blink-marker:hover .thore-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .thore-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: thore-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes thore-pulsate {
                0% {
                    transform: scale(0.3);
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
                100% {
                    transform: scale(2.8);
                    opacity: 0;
                }
            }
            .thore-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 12px !important;
                width: 280px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .thore-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .thore-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .thore-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .thore-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);
    }
})();

function toggleThoreIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [73.85572994889226, 35.480535509722905];

    if (isChecked) {
        if (thoreMarker) {
            thoreMarker.remove();
        }
        if (thorePopup) {
            thorePopup.remove();
        }

        const el = document.createElement('div');
        el.className = 'thore-blink-marker';
        el.title = "Thore Incident Location - Click to toggle details popup";

        const ring = document.createElement('div');
        ring.className = 'thore-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'thore-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        thorePopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'thore-incident-popup'
        }).setHTML(`
            <div class="thore-popup-content">
                <div class="thore-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Thore Incident</h4>
                    <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">26 June, 2026</span>
                </div>
                <div class="thore-popup-body">
                    <img src="data/Incidents/Thore Incident.jpeg" alt="Thore Incident" style="width: 100%; height: auto; max-height: 180px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 12px rgba(0,0,0,0.6); margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                        <p style="margin: 4px 0; color: #cbd5e1;">
                            Flash flood hit Habroom Nallah, Anger Nallah & Shitan Nallah areas of Thore valley. Which caused widespread destruction to houses along with belongings, agricultural land other livihood and a car swet into nallah.
                        </p>
                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                            <p style="margin: 2px 0;"><strong>Coordinates:</strong> 35.48054° N, 73.85573° E</p>
                        </div>
                    </div>
                </div>
            </div>
        `);

        thoreMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(thorePopup)
        .addTo(map1);

        thorePopup.setLngLat(coordinates).addTo(map1);

        map1.flyTo({
            center: coordinates,
            zoom: 14.5,
            pitch: 55,
            bearing: 0,
            duration: 2500,
            essential: true
        });
    } else {
        if (thoreMarker) {
            thoreMarker.remove();
            thoreMarker = null;
        }
        if (thorePopup) {
            thorePopup.remove();
            thorePopup = null;
        }
    }
}
