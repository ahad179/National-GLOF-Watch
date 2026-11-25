const ibrahim = CONFIG.IBRAHIM_GEOSERVER_BASE_URL;

function getElevationCategory(classRaw, elevVal) {
    const raw = String(classRaw ?? '').trim();
    const str = raw.toLowerCase().replace(/[-_]/g, ' ');

    // 1. Below 3000 / Low Elevation
    if (
        str === 'below 3000' ||
        str === 'under 3000' ||
        str === 'low' ||
        str === 'low elevation' ||
        str.includes('below') ||
        (str.includes('low') && !str.includes('very')) ||
        str === '0'
    ) {
        return { key: 'low', label: 'Low Elevation', color: '#22c55e' };
    }

    // 2. 3000 - 4000 / Medium Elevation
    if (
        str === '3000 4000' ||
        str === 'medium' ||
        str === 'medium elevation' ||
        str.includes('med') ||
        str === '1'
    ) {
        return { key: 'medium', label: 'Medium Elevation', color: '#eab308' };
    }

    // 3. 4000 - 5000 / High Elevation
    if (
        str === '4000 5000' ||
        str === 'high' ||
        str === 'high elevation' ||
        (str.includes('high') && !str.includes('very')) ||
        str === '2'
    ) {
        return { key: 'high', label: 'High Elevation', color: '#f97316' };
    }

    // 4. 5000_above / Very High Elevation
    if (
        str === '5000 above' ||
        str === 'above 5000' ||
        str.includes('very') ||
        str.includes('5000') ||
        str === '3'
    ) {
        return { key: 'veryHigh', label: 'Very High Elevation', color: '#ef4444' };
    }

    // Fallback: Use numeric elevation if elev_class is missing or unmatched
    const elev = parseFloat(elevVal);
    if (!isNaN(elev)) {
        if (elev >= 5000) return { key: 'veryHigh', label: 'Very High Elevation', color: '#ef4444' };
        if (elev >= 4000) return { key: 'high', label: 'High Elevation', color: '#f97316' };
        if (elev >= 3000) return { key: 'medium', label: 'Medium Elevation', color: '#eab308' };
        return { key: 'low', label: 'Low Elevation', color: '#22c55e' };
    }

    return { key: 'high', label: 'High Elevation', color: '#f97316' };
}
window.getElevationCategory = getElevationCategory;

function computeGlacialBasinsVolumeFromFeatures(features) {
    const stats = {
        total: 0,
        low: 0,
        medium: 0,
        high: 0,
        veryHigh: 0,
        totalCount: 0,
        lowCount: 0,
        mediumCount: 0,
        highCount: 0,
        veryHighCount: 0
    };
    if (!Array.isArray(features)) return stats;

    features.forEach(f => {
        const props = f.properties || {};
        
        // Find Volume_MAF property
        const volKey = Object.keys(props).find(k => {
            const lk = k.toLowerCase();
            return lk === 'volume_maf' || lk === 'vol_maf' || lk === 'volume';
        });
        const rawVol = volKey ? props[volKey] : (props.Volume_MAF !== undefined ? props.Volume_MAF : (props.volume_maf || props.Volume || props.volume));
        const vol = parseFloat(rawVol);
        const validVol = (!isNaN(vol) && vol > 0) ? vol : 0;

        // Find elev_class / Category property
        const classKey = Object.keys(props).find(k => {
            const lk = k.toLowerCase();
            return lk === 'elev_class' || lk === 'elev_clas' || lk === 'category' || lk === 'class' || lk === 'elevclass';
        }) || Object.keys(props).find(k => k.toLowerCase().includes('class') || k.toLowerCase().includes('cat'));

        const classRaw = classKey ? props[classKey] : (props.elev_class !== undefined ? props.elev_class : props.Category);
        
        // Find numeric elevation property
        const elevKey = Object.keys(props).find(k => k.toLowerCase().includes('elev'));
        const elevVal = elevKey ? props[elevKey] : props.elevation_;

        const cat = getElevationCategory(classRaw, elevVal);
        const countKey = cat.key + 'Count';

        if (stats[cat.key] !== undefined) {
            stats[cat.key] += validVol;
            stats[countKey] = (stats[countKey] || 0) + 1;
        } else {
            stats.high += validVol;
            stats.highCount = (stats.highCount || 0) + 1;
        }
        stats.total += validVol;
        stats.totalCount += 1;
    });

    return stats;
}
window.computeGlacialBasinsVolumeFromFeatures = computeGlacialBasinsVolumeFromFeatures;

const pakNationalBoundarySource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/Pak_Boundaries/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Pak_Boundaries%3ANational_Boundary&outputFormat=application%2Fjson'
};
const pakProvincialBoundarySource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/Pak_Boundaries/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Pak_Boundaries%3AProvincial_Boundary&outputFormat=application%2Fjson'
};
const pakDistrictBoundarySource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/Pak_Boundaries/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Pak_Boundaries%3ADistrict_Boundary&outputFormat=application%2Fjson'
};

const vulSitesSrc = {
    type: 'geojson',
    data: glof_sites
}
const vulLakesSrc = {
    type: 'geojson',
    data: glof_lakes
}
const incidentSrc = {
    type: 'geojson',
    data: incident_data
}
const glacialLakesInventorySource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AHKH_PK&outputFormat=application%2Fjson'
}
const akahInfrastructureSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AAKAHP_Infrastructure_Data_Final&outputFormat=application%2Fjson'
}
const populatedPlacesSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APopulated-Points-North&outputFormat=application%2Fjson',
    promoteId: 'OBJECTID'
}
const gmrcWapdaSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGMRC_Points&outputFormat=application%2Fjson'
}
const glofIISource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3Astations&outputFormat=application%2Fjson'
}
const glofIIDamagedStationsSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ADamage_Stations&outputFormat=application%2Fjson'
}
const AKAH_STATIONS_XLSX_URL = 'data/WMP%20AWS%20EWS.xlsx';
const UNDP_ALL_SENSORS_CSV_URL = 'data/279_EWS_List_GLOF-II.csv';
const BRI_FF_SENSORS_CSV_URL = 'data/EWS%20Station%20Location%20under%20ECARE%20Project%20in%20GB.csv';
const pdmaKpSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGLOF_vul_Lakes_KP&outputFormat=application%2Fjson'
};
const evk2cnrSource = {
    type: 'geojson',
    data: 'data/geojsons/evk2cnr.geojson'
};
const focus2026Source = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AFOCUS_2026&outputFormat=application%2Fjson'
};
const glacierMajorDamsSource = {
    type: 'geojson',
    data: CONFIG.GCOP_GEOSERVER_BASE_URL + '/gcop/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gcop%3Amajor_dams&outputFormat=application%2Fjson'
};
const glacierMinorDamsSource = {
    type: 'geojson',
    data: CONFIG.GCOP_GEOSERVER_BASE_URL + '/gcop/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gcop%3Aminor_dams&outputFormat=application%2Fjson'
};
const glacierMajorRiversSource = {
    type: 'geojson',
    data: CONFIG.GCOP_GEOSERVER_BASE_URL + '/gcop/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gcop%3Amajor_rivers&outputFormat=application%2Fjson'
};
const glacierMinorRiversSource = {
    type: 'geojson',
    data: CONFIG.GCOP_GEOSERVER_BASE_URL + '/gcop/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gcop%3Aminor_rivers&outputFormat=application%2Fjson'
};
const glacierBasinsPointsSource = {
    type: 'geojson',
    data: glacier_basins_points
};
const GLACIER_WATERSHED_URL = CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AWatershed&outputFormat=application%2Fjson';
const glacierWatershedSource = {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: []
    }
};
const glacierInventorySource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3Aglacier_invent&outputFormat=application%2Fjson'
};
const glacierReserviorsSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AReserviors_Polygon&outputFormat=application%2Fjson'
};
const glacierTerminusSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGlacier_terminus&outputFormat=application%2Fjson'
};
const glacialBasinsSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGlacial_Basins_3&outputFormat=application%2Fjson',
    tolerance: 0
};
const lakesInventory2026Source = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGlacial_Basins_2026&outputFormat=application%2Fjson',
    tolerance: 0
};
const monsoonBasinsSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMonsoon_Basins&outputFormat=application%2Fjson'
};
const glaciersGridSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGlaciers_Grid_5x5&outputFormat=application%2Fjson'
};
const pakistanGridSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APakistan_Grid_5x5&outputFormat=application%2Fjson'
};
const glaciersGrid2kmSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AGlaciers_Grid_2x2&outputFormat=application%2Fjson'
};
const pakistanGrid2kmSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APakistan_Grid_2x2&outputFormat=application%2Fjson'
};

function parseWorkbookNumber(rawValue) {
    const cleaned = String(rawValue ?? '').replace(/[^0-9.+-]/g, '');
    if (!cleaned) {
        return null;
    }

    const parsedValue = Number.parseFloat(cleaned);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildAkahStationsFeatureCollection(rows) {
    if (!Array.isArray(rows) || rows.length < 2) {
        return { type: 'FeatureCollection', features: [] };
    }

    const features = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        if (!Array.isArray(row) || row.length < 5) {
            continue;
        }

        const stationNumber = String(row[0] ?? '').trim();
        const villageName = String(row[1] ?? '').trim();
        const district = String(row[2] ?? '').trim();
        let latitude = parseWorkbookNumber(row[3]);
        let longitude = parseWorkbookNumber(row[4]);
        const type = String(row[5] ?? '').trim();
        const hazard = String(row[6] ?? '').trim();

        if (!villageName || latitude === null || longitude === null) {
            continue;
        }

        if (Math.abs(latitude) > 60 && Math.abs(longitude) < 60) {
            const swappedLatitude = longitude;
            longitude = latitude;
            latitude = swappedLatitude;
        }

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
        }

        features.push({
            type: 'Feature',
            id: stationNumber || `${rowIndex}`,
            properties: {
                'S.#': stationNumber,
                'Village Name': villageName,
                District: district,
                Latitude: latitude,
                Longitude: longitude,
                Type: type,
                Hazard: hazard
            },
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features
    };
}


function parseNumericValue(rawValue) {
    const cleanedValue = String(rawValue ?? '').replace(/[^0-9.+-]/g, '');
    if (!cleanedValue) {
        return null;
    }

    const parsedValue = Number.parseFloat(cleanedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeCsvHeader(rawValue) {
    return String(rawValue || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function buildUndpAllSensorsFeatureCollection(csvText) {
    const lines = String(csvText || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return { type: 'FeatureCollection', features: [] };
    }

    const headers = splitCsvRow(lines[0]).map((header) => header.trim());
    const features = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const fields = splitCsvRow(lines[lineIndex]);

        const stationNumber = String(fields[0] ?? '').trim();
        const code = String(fields[1] ?? '').trim();
        const stationName = String(fields[2] ?? '').trim();
        let latitude = parseNumericValue(fields[3]);
        let longitude = parseNumericValue(fields[4]);
        const elevation = String(fields[5] ?? '').trim();
        const gsmSignal = String(fields[6] ?? '').trim();
        const satellite = String(fields[7] ?? '').trim();
        const province = String(fields[8] ?? '').trim();
        const status = String(fields[9] ?? '').trim();

        if (!stationName || latitude === null || longitude === null) {
            continue;
        }

        if (Math.abs(latitude) > 60 && Math.abs(longitude) < 60) {
            const swappedLatitude = longitude;
            longitude = latitude;
            latitude = swappedLatitude;
        }

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
        }

        features.push({
            type: 'Feature',
            id: stationNumber || `${lineIndex}`,
            properties: {
                'S.NO': stationNumber,
                Code: code,
                StationNames: stationName,
                Lat: latitude,
                Long: longitude,
                Elev: elevation,
                'GSM Signal': gsmSignal,
                Satellite: satellite,
                Province: province,
                Status: status
            },
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features
    };
}

function buildBriFfSensorsFeatureCollection(csvText) {
    const lines = String(csvText || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return { type: 'FeatureCollection', features: [] };
    }

    const headers = splitCsvRow(lines[0]).map((header) => header.trim());
    const headerIndexMap = headers.reduce((lookup, header, index) => {
        lookup[normalizeCsvHeader(header)] = index;
        return lookup;
    }, {});

    const stationNameIndex = headerIndexMap.stationname ?? 0;
    const latitudeIndex = headerIndexMap.latitude ?? 1;
    const longitudeIndex = headerIndexMap.longitude ?? 2;
    const altitudeIndex = headerIndexMap.altitudem ?? 3;
    const stationTypeIndex = headerIndexMap.stationtype ?? 4;

    const features = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const fields = splitCsvRow(lines[lineIndex]);

        const stationName = String(fields[stationNameIndex] ?? '').trim();
        let latitude = parseNumericValue(fields[latitudeIndex]);
        let longitude = parseNumericValue(fields[longitudeIndex]);
        const altitude = String(fields[altitudeIndex] ?? '').trim();
        const stationType = String(fields[stationTypeIndex] ?? '').trim();

        if (!stationName || latitude === null || longitude === null) {
            continue;
        }

        if (Math.abs(latitude) > 60 && Math.abs(longitude) < 60) {
            const swappedLatitude = longitude;
            longitude = latitude;
            latitude = swappedLatitude;
        }

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
        }

        features.push({
            type: 'Feature',
            id: `${lineIndex}-${stationName}`,
            properties: {
                StationName: stationName,
                Latitude: latitude,
                Longitude: longitude,
                Altitude: altitude,
                StationType: stationType
            },
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features
    };
}
const floodSusceptibilityRasterSource = {
    type: 'raster',
    tiles: [
        CONFIG.GEOSERVER_BASE_URL + '/GLOF/wms?service=WMS&version=1.1.0&request=GetMap&layers=GLOF:glof_susceptibility&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true'
    ],
    tileSize: 256
};
const lulcRasterSource = {
    type: 'raster',
    tiles: [
        CONFIG.GEOSERVER_BASE_URL + '/GLOF/wms?service=WMS&version=1.1.0&request=GetMap&layers=GLOF:lulc&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true'
    ],
    tileSize: 256
};
const events2026PointsSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3A2026_events&outputFormat=application%2Fjson'
};
const akahHazardExposureSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AAKAHP_HazardExposure_Final&outputFormat=application%2Fjson'
}
const highTempWarningSrc = {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    title: 'High Temp Warning Area'
                },
                geometry: {
                    type: 'Point',
                    coordinates: [75.33670798647735, 35.86669398878782]
                }
            }
        ]
    }
}
const stationPointsSrc = {
    type: 'geojson',
    data: 'data/geojsons/station_points.geojson'
}
const badswatBoundSource = {
    type: 'geojson',
    data: 'http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3ADistrict_Boundary&outputFormat=application%2Fjson&CQL_FILTER=DISTRICT=%27GHIZER%27'
};
const badswatfaultlineSource = {
    type: 'geojson',
    data: badswat_faultine
};
const badswatGlacierSource = {
    type: 'geojson',
    data: badswat_glaciers
};
const badswat_lakeSource = {
    type: 'geojson',
    data: badswat_lake
};
const badswat_risk_zonationSource = {
    type: 'geojson',
    data: badswat_risk_zonation
};
const ishkomanRiverSource = {
    type: 'geojson',
    data: ishkoman_river
};
const karambarLakeSource = {
    type: 'geojson',
    data: karambar_lake
};

const hiranchiBoundSource = {
    type: 'geojson',
    data: 'http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3ADistrict_Boundary&outputFormat=application%2Fjson&CQL_FILTER=DISTRICT=%27GILGIT%27'
};
const hiranchiGlacierSource = {
    type: 'geojson',
    data: hiranchi_glaciers
};
const hiranchiLakeSource = {
    type: 'geojson',
    data: hiranchi_lake
};
const hiranchiRiskZonationSource = {
    type: 'geojson',
    data: hiranchi_risk_zonation
};

const reshunBoundSource = {
    type: 'geojson',
    data: 'http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3ADistrict_Boundary&outputFormat=application%2Fjson&CQL_FILTER=DISTRICT=%27CHITRAL%27'
};
const reshunGlacierSource = {
    type: 'geojson',
    data: glacier_reshun
};
const chitralRiverSource = {
    type: 'geojson',
    data: chitral_river
}
const faultlineReshunSource = {
    type: 'geojson',
    data: faultline_reshun
}
const nullahReshunSource = {
    type: 'geojson',
    data: nullah_reshun
}
const reshunRiskZonationSource = {
    type: 'geojson',
    data: risk_zonation_reshun
}
const tersetHundurLakeSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3Alakes_THundur&outputFormat=application%2Fjson'
};
const tersetHundurRiverSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ARiver_THundur&outputFormat=application%2Fjson'
};
const tersetHundurRiskHighSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AHigh_THundur&outputFormat=application%2Fjson'
};
const tersetHundurRiskMediumSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMedium_THundur&outputFormat=application%2Fjson'
};
const tersetHundurRiskLowSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALow_THundur&outputFormat=application%2Fjson'
};
const ishokomanRiskHighSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AIshokoman_High&outputFormat=application%2Fjson'
};
const ishokomanRiskMediumSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AIshokoman_Medium&outputFormat=application%2Fjson'
};
const ishokomanRiskLowSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AIshokoman_Low&outputFormat=application%2Fjson'
};
const lushtRiskHighSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALusht_High&outputFormat=application%2Fjson'
};
const lushtRiskMediumSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALusht_Medium&outputFormat=application%2Fjson'
};
const lushtRiskLowSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALusht_Low&outputFormat=application%2Fjson'
};
const ulterRiskHighSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AHigh_Risk_Ultar_Lake&outputFormat=application%2Fjson'
};
const ulterRiskMediumSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMedium_Risk_Ultar_Lake&outputFormat=application%2Fjson'
};
const ulterRiskLowSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALow_Risk_Ultar_Lake&outputFormat=application%2Fjson'
};
const shisperRiskHighSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AShisper_High&outputFormat=application%2Fjson'
};
const shisperRiskMediumSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AShisper_Medium&outputFormat=application%2Fjson'
};
const shisperRiskLowSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AShisper_Low&outputFormat=application%2Fjson'
};
const shisperLakeSource = {
    type: 'geojson',
    data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AShisper_Lake&outputFormat=application%2Fjson'
};
const brep_zonationSource = {
    type: 'geojson',
    data: brep_zonation
}
const darkot_zonationSrc = {
    type: 'geojson',
    data: darkotRz
}
const darkotSchoolsSrc = {
    type: 'geojson',
    data: darkotSchools
}
const darkotBuildingsSrc = {
    type: 'geojson',
    data: darkotBuildings
}
const darkotRiversSrc = {
    type: 'geojson',
    data: darkot_river
}
const darkotGlacierSrc = {
    type: 'geojson',
    data: darkot_glaciers
}
const gulmitLineSrc = {
    type: 'geojson',
    data: 'http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3ADistrict_Boundary&outputFormat=application%2Fjson&CQL_FILTER=DISTRICT=%27HUNZA%20NAGAR%27'
}
const gulmit_zonationSource = {
    type: 'geojson',
    data: gulmitRz
}
const gulmitBuildingsSrc = {
    type: 'geojson',
    data: gulmitBuildings
}
const gulmitRoadsSrc = {
    type: 'geojson',
    data: gulmitRoads
}
const gulmitRiversSrc = {
    type: 'geojson',
    data: gulmitRivers
}
const gulmitSchoolsSrc = {
    type: 'geojson',
    data: gulmitSchools
}
const thalu_zonationSource = {
    type: 'geojson',
    data: thaluRz
}

let akahHazardOutlineAnimationInterval = null;
let populatedPlacesHoverMarker = null;
let populatedPlacesHoverMarkerVisible = false;
let populatedPlacesHoverEventsBound = false;
let populatedPlacesHoverZoomEventBound = false;
let populatedPlacesHoveredFeatureId = null;

const populatedPlacesIconNativeSizePx = 640;

function getPopulatedPlacesIconScale(zoom) {
    if (zoom <= 6) {
        return 0.07;
    }
    if (zoom <= 10) {
        return 0.07 + ((zoom - 6) * (0.1 - 0.07)) / 4;
    }
    if (zoom <= 13) {
        return 0.1 + ((zoom - 10) * (0.12 - 0.1)) / 3;
    }
    return 0.12;
}

function updatePopulatedPlacesHoverMarkerSize() {
    if (!populatedPlacesHoverMarker) {
        return;
    }

    const markerElement = populatedPlacesHoverMarker.getElement();
    if (!markerElement) {
        return;
    }

    const iconScale = getPopulatedPlacesIconScale(map1.getZoom());
    const iconSizePx = Math.max(16, Math.round(populatedPlacesIconNativeSizePx * iconScale));
    markerElement.style.width = `${iconSizePx}px`;
    markerElement.style.height = `${iconSizePx}px`;
}

function clearPopulatedPlacesFeatureHoverState() {
    if (populatedPlacesHoveredFeatureId === null) {
        return;
    }

    if (map1.getSource('populatedPlaces')) {
        map1.setFeatureState(
            { source: 'populatedPlaces', id: populatedPlacesHoveredFeatureId },
            { hover: false }
        );
    }

    populatedPlacesHoveredFeatureId = null;
}

function setPopulatedPlacesFeatureHoverState(feature) {
    if (!feature || feature.id === undefined || feature.id === null || !map1.getSource('populatedPlaces')) {
        return;
    }

    if (populatedPlacesHoveredFeatureId !== null && populatedPlacesHoveredFeatureId !== feature.id) {
        map1.setFeatureState(
            { source: 'populatedPlaces', id: populatedPlacesHoveredFeatureId },
            { hover: false }
        );
    }

    if (populatedPlacesHoveredFeatureId !== feature.id) {
        map1.setFeatureState(
            { source: 'populatedPlaces', id: feature.id },
            { hover: true }
        );
        populatedPlacesHoveredFeatureId = feature.id;
    }
}

function startAkahHazardOutlineAnimation() {
    const outlineLayerIds = [
        'akah-hzd-ava-outline-layer',
        'akah-hzd-dbf-outline-layer',
        'akah-hzd-bnk-outline-layer',
        'akah-hzd-fld-outline-layer',
        'akah-hzd-lds-outline-layer',
        'akah-hzd-rkf-outline-layer',
        'akah-hzd-ufl-outline-layer'
    ];

    const dashArraySequence = [
        [0, 2, 3],
        [0.5, 2, 2.5],
        [1, 2, 2],
        [1.5, 2, 1.5],
        [2, 2, 1],
        [2.5, 2, 0.5],
        [3, 2, 0],
        [0, 0.5, 3, 2.5],
        [0, 1, 3, 2],
        [0, 1.5, 3, 1.5],
        [0, 2, 3, 1],
        [0, 2.5, 3, 0.5]
    ];

    if (akahHazardOutlineAnimationInterval !== null) {
        clearInterval(akahHazardOutlineAnimationInterval);
    }

    let dashIndex = 0;
    akahHazardOutlineAnimationInterval = setInterval(() => {
        const dashArray = dashArraySequence[dashIndex];
        outlineLayerIds.forEach((layerId) => {
            if (map1.getLayer(layerId)) {
                map1.setPaintProperty(layerId, 'line-dasharray', dashArray);
            }
        });
        dashIndex = (dashIndex + 1) % dashArraySequence.length;
    }, 150);
}

function showPopulatedPlacesHoverAnimationMarker(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return;
    }

    if (!populatedPlacesHoverMarker) {
        const markerImage = document.createElement('img');
        markerImage.src = 'data/location.gif';
        markerImage.alt = 'Populated Place';
        markerImage.style.pointerEvents = 'none';
        markerImage.style.userSelect = 'none';

        populatedPlacesHoverMarker = new mapboxgl.Marker({
            element: markerImage,
            anchor: 'bottom'
        });
    }

    updatePopulatedPlacesHoverMarkerSize();

    populatedPlacesHoverMarker.setLngLat(coordinates);

    if (!populatedPlacesHoverMarkerVisible) {
        populatedPlacesHoverMarker.addTo(map1);
        populatedPlacesHoverMarkerVisible = true;
    }
}

function hidePopulatedPlacesHoverAnimationMarker() {
    clearPopulatedPlacesFeatureHoverState();

    if (populatedPlacesHoverMarker && populatedPlacesHoverMarkerVisible) {
        populatedPlacesHoverMarker.remove();
        populatedPlacesHoverMarkerVisible = false;
    }
}

function bindPopulatedPlacesHoverAnimationEvents() {
    if (populatedPlacesHoverEventsBound) {
        return;
    }

    map1.on('mouseenter', 'populated-places-points-layer', (e) => {
        map1.getCanvas().style.cursor = 'pointer';
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        setPopulatedPlacesFeatureHoverState(feature);
        const coordinates = feature && feature.geometry && feature.geometry.coordinates
            ? feature.geometry.coordinates.slice()
            : null;
        if (coordinates) {
            showPopulatedPlacesHoverAnimationMarker(coordinates);
        }
    });

    map1.on('mousemove', 'populated-places-points-layer', (e) => {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        setPopulatedPlacesFeatureHoverState(feature);
        const coordinates = feature && feature.geometry && feature.geometry.coordinates
            ? feature.geometry.coordinates.slice()
            : null;
        if (coordinates) {
            showPopulatedPlacesHoverAnimationMarker(coordinates);
        }
    });

    map1.on('mouseleave', 'populated-places-points-layer', () => {
        map1.getCanvas().style.cursor = '';
        hidePopulatedPlacesHoverAnimationMarker();
    });

    if (!populatedPlacesHoverZoomEventBound) {
        map1.on('zoom', () => {
            if (populatedPlacesHoverMarkerVisible) {
                updatePopulatedPlacesHoverMarkerSize();
            }
        });
        populatedPlacesHoverZoomEventBound = true;
    }

    populatedPlacesHoverEventsBound = true;
}

window.hidePopulatedPlacesHoverAnimationMarker = hidePopulatedPlacesHoverAnimationMarker;
//____________________________________________________________________________________________________________________________________________________________________________________
map1.loadImage('https://i.ibb.co/20MBc92N/glacier-icon.png', function (error, image) {
    if (error) throw error;

    // Add the image to Mapbox
    if (!map1.hasImage('glofIcon')) {
        map1.addImage('glofIcon', image);
    }
});
//____________________________________________________________________________________________________________________________________________________________________________________
map1.on('style.load', () => {
    hidePopulatedPlacesHoverAnimationMarker();

    map1.addSource('pakNationalBoundary', pakNationalBoundarySource);
    map1.addSource('pakProvincialBoundary', pakProvincialBoundarySource);
    map1.addSource('pakDistrictBoundary', pakDistrictBoundarySource);
    map1.addSource('vulSites', vulSitesSrc);
    map1.addSource('vulLakes', vulLakesSrc);
    map1.addSource('incident', incidentSrc);
    map1.addSource('glacialLakesInventory', glacialLakesInventorySource);
    map1.addSource('akahInfrastructure', akahInfrastructureSource);
    map1.addSource('populatedPlaces', populatedPlacesSource);
    map1.addSource('gmrcWapdaPoints', gmrcWapdaSource);
    map1.addSource('glofIIStations', glofIISource);
    map1.addSource('glofIIDamagedStations', glofIIDamagedStationsSource);
    map1.addSource('focus2026Points', focus2026Source);
    map1.addSource('glacierMajorDams', glacierMajorDamsSource);
    map1.addSource('glacierMinorDams', glacierMinorDamsSource);
    map1.addSource('glacierMajorRivers', glacierMajorRiversSource);
    map1.addSource('glacierMinorRivers', glacierMinorRiversSource);
    map1.addSource('glacierBasinsPoints', glacierBasinsPointsSource);
    map1.addSource('glacierWatershed', glacierWatershedSource);
    map1.addSource('glacierInventory', glacierInventorySource);
    map1.addSource('glacierReserviors', glacierReserviorsSource);
    map1.addSource('glacierTerminus', glacierTerminusSource);
    map1.addSource('glacialBasins', glacialBasinsSource);
    map1.addSource('lakesInventory2026', lakesInventory2026Source);
    map1.addSource('events2026Points', events2026PointsSource);
    if (!map1.getSource('monsoonBasins')) {
        map1.addSource('monsoonBasins', monsoonBasinsSource);
    }
    if (!map1.getSource('glaciersGrid')) {
        map1.addSource('glaciersGrid', glaciersGridSource);
    }
    if (!map1.getSource('pakistanGrid')) {
        map1.addSource('pakistanGrid', pakistanGridSource);
    }
    if (!map1.getSource('glaciersGrid2km')) {
        map1.addSource('glaciersGrid2km', glaciersGrid2kmSource);
    }
    if (!map1.getSource('pakistanGrid2km')) {
        map1.addSource('pakistanGrid2km', pakistanGrid2kmSource);
    }
    if (!map1.getSource('Ongoing')) {
        map1.addSource('Ongoing', {
            type: 'geojson',
            data: ibrahim + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AOngoing&outputFormat=application/json'
        });
    }
    if (!map1.getSource('Future')) {
        map1.addSource('Future', {
            type: 'vector',
            scheme: 'tms',
            tiles: [
                ibrahim + '/gwc/service/tms/1.0.0/GLOF:Fut@EPSG:900913@pbf/{z}/{x}/{y}.pbf'
            ]
        });
    }
    if (!map1.getSource('Streams')) {
        map1.addSource('Streams', {
            type: 'vector',
            scheme: 'tms',
            tiles: [
                ibrahim + '/gwc/service/tms/1.0.0/GLOF:Export_Output_4@EPSG:900913@pbf/{z}/{x}/{y}.pbf'
            ]
        });
    }
    map1.addSource('akahStations', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });
    map1.addSource('undpAllSensors', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });
    map1.addSource('briFfSensors', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // Initialize a global counts map so the legend can show point counts.
    window.layerFeatureCounts = window.layerFeatureCounts || {};

    // Fetch counts for remote WFS/GeoJSON sources (when accessible) and update counts.
    (async function fetchInitialCounts() {
        try {
            // GMRC, WAPDA
            try {
                const resp = await fetch(gmrcWapdaSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['gmrc-wapda-points-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch GMRC/WAPDA source for counts.', err);
            }

            // GLOF II stations
            try {
                const resp = await fetch(glofIISource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glof-ii-stations-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch GLOF II stations source for counts.', err);
            }

            // GLOF II damaged stations
            try {
                const resp = await fetch(glofIIDamagedStationsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glof-ii-damaged-stations-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch GLOF II damaged stations source for counts.', err);
            }

            // PDMA, KP
            try {
                const resp = await fetch(pdmaKpSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['pdma-kp-points-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch PDMA, KP source for counts.', err);
            }

            // EvK2CNR
            try {
                const resp = await fetch(evk2cnrSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['evk2cnr-points-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch EvK2CNR source for counts.', err);
            }

            // FOCUS 2026
            try {
                const resp = await fetch(focus2026Source.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['focus-2026-points-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch FOCUS 2026 source for counts.', err);
            }

            // Monsoon Basins
            try {
                const resp = await fetch(monsoonBasinsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    if (Array.isArray(json.features)) {
                        const p1 = json.features.filter(f => {
                            const p = f.properties && f.properties.Priority;
                            return p !== undefined && Math.round(parseFloat(p)) === 1;
                        });
                        const p2 = json.features.filter(f => {
                            const p = f.properties && f.properties.Priority;
                            return p !== undefined && Math.round(parseFloat(p)) === 2;
                        });
                        window.layerFeatureCounts['monsoon-priority-1-layer'] = p1.length;
                        window.layerFeatureCounts['monsoon-priority-2-layer'] = p2.length;
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch Monsoon Basins source for counts.', err);
            }

            // Glaciers Grid
            try {
                const resp = await fetch(glaciersGridSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glaciers-grid-fill'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Glaciers Grid source for counts.', err);
            }

            // Major Dams
            try {
                const resp = await fetch(glacierMajorDamsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-major-dams-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Major Dams source for counts.', err);
            }

            // Minor Dams
            try {
                const resp = await fetch(glacierMinorDamsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-minor-dams-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Minor Dams source for counts.', err);
            }

            // Major Rivers
            try {
                const resp = await fetch(glacierMajorRiversSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-major-rivers-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Major Rivers source for counts.', err);
            }

            // Minor Rivers
            try {
                const resp = await fetch(glacierMinorRiversSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-minor-rivers-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Minor Rivers source for counts.', err);
            }

            // Watershed
            try {
                const resp = await fetch(GLACIER_WATERSHED_URL);
                if (resp.ok) {
                    const json = await resp.json();
                    const colors = [
                        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
                        '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
                        '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#14b8a6', '#0d9488'
                    ];
                    if (Array.isArray(json.features)) {
                        json.features.forEach((feature, idx) => {
                            feature.properties = feature.properties || {};
                            feature.properties.watershed_color = colors[idx % colors.length];
                        });
                        const source = map1.getSource('glacierWatershed');
                        if (source && typeof source.setData === 'function') {
                            source.setData(json);
                        }
                    }
                    window.layerFeatureCounts['glacier-watershed-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Watershed source for counts.', err);
            }

            // Glacier Inventory
            try {
                const resp = await fetch(glacierInventorySource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-inventory-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Glacier Inventory source for counts.', err);
            }

            // Reserviors
            try {
                const resp = await fetch(glacierReserviorsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-reserviors-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Reserviors source for counts.', err);
            }

            // Glacier Terminus
            try {
                const resp = await fetch(glacierTerminusSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacier-terminus-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Glacier Terminus source for counts.', err);
            }

            // Glacial Basins (2025)
            try {
                const resp = await fetch(glacialBasinsSource.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['glacial-basins-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                    if (Array.isArray(json.features)) {
                        window.glacialBasinsGeojsonCache = json;
                        window.glacialBasinsVolumeData = computeGlacialBasinsVolumeFromFeatures(json.features);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch Glacial Basins source for counts.', err);
            }

            // Lakes Inventory 2026
            try {
                const resp = await fetch(lakesInventory2026Source.data);
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['lakes-inventory-2026-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                    if (Array.isArray(json.features)) {
                        window.lakesInventory2026GeojsonCache = json;
                        window.lakesInventory2026VolumeData = computeGlacialBasinsVolumeFromFeatures(json.features);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch Lakes Inventory 2026 source for counts.', err);
            }

            // Melting Glaciers Count
            try {
                const resp = await fetch(CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMelting_Glaciers_Updated&outputFormat=application%2Fjson');
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['vulnerable-melting-glaciers-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Melting Glaciers source for counts.', err);
            }

            // Vulnerable Melting Points Count
            try {
                const resp = await fetch(CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AVul_Melt_Zones&outputFormat=application%2Fjson');
                if (resp.ok) {
                    const json = await resp.json();
                    window.layerFeatureCounts['vulnerable-melting-points-layer'] = Array.isArray(json.features) ? json.features.length : 0;
                }
            } catch (err) {
                console.warn('Failed to fetch Vulnerable Melting Points source for counts.', err);
            }

            // Refresh legend now that initial counts may be available
            if (typeof refreshActiveLayersLegend === 'function') {
                refreshActiveLayersLegend();
            }
        } catch (error) {
            console.error('Error while fetching initial layer counts.', error);
        }
    })();

    // Add source for Melting Glaciers
    map1.addSource('vulnerableMeltingGlaciers', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMelting_Glaciers_Updated&outputFormat=application%2Fjson'
    });
    // Add source for Vulnerable Melting Points
    map1.addSource('vulnerableMeltingPoints', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AVul_Melt_Zones&outputFormat=application%2Fjson'
    });
    map1.addSource('floodSusceptibilityRaster', floodSusceptibilityRasterSource);
    if (!map1.getSource('lulcRaster')) {
        map1.addSource('lulcRaster', lulcRasterSource);
    }
    map1.addSource('akahHazardExposure', akahHazardExposureSource);
    map1.addSource('highTempWarning', highTempWarningSrc);
    map1.addSource('stationPoints', stationPointsSrc);
    map1.addSource('pdmaKpPoints', pdmaKpSource);
    map1.addSource('evk2cnrPoints', evk2cnrSource);
    map1.addSource('badswatBound', badswatBoundSource);
    map1.addSource('badswatfaultline', badswatfaultlineSource);
    map1.addSource('badswatGlacier', badswatGlacierSource);
    map1.addSource('badswatLake', badswat_lakeSource);
    map1.addSource('ishkomanRiver', ishkomanRiverSource);
    map1.addSource('karambarLake', karambarLakeSource);
    map1.addSource('badswatRiskZonation', badswat_risk_zonationSource);
    map1.addSource('hiranchiBounds', hiranchiBoundSource);
    map1.addSource('hiranchiGlaciers', hiranchiGlacierSource);
    map1.addSource('hiranchiLake', hiranchiLakeSource);
    map1.addSource('hiranchiRiskZonation', hiranchiRiskZonationSource);
    map1.addSource('reshunBound', reshunBoundSource);
    map1.addSource('reshunGlacier', reshunGlacierSource);
    map1.addSource('chitralRiverSource', chitralRiverSource);
    map1.addSource('faultlineReshunSource', faultlineReshunSource);
    map1.addSource('nullahReshunSource', nullahReshunSource);
    map1.addSource('reshunRiskZonationSource', reshunRiskZonationSource);
    map1.addSource('tersetHundurLake', tersetHundurLakeSource);
    map1.addSource('tersetHundurRiver', tersetHundurRiverSource);
    map1.addSource('tersetHundurRiskHigh', tersetHundurRiskHighSource);
    map1.addSource('tersetHundurRiskMedium', tersetHundurRiskMediumSource);
    map1.addSource('tersetHundurRiskLow', tersetHundurRiskLowSource);
    map1.addSource('ishokomanRiskHigh', ishokomanRiskHighSource);
    map1.addSource('ishokomanRiskMedium', ishokomanRiskMediumSource);
    map1.addSource('ishokomanRiskLow', ishokomanRiskLowSource);
    map1.addSource('lushtRiskHigh', lushtRiskHighSource);
    map1.addSource('lushtRiskMedium', lushtRiskMediumSource);
    map1.addSource('lushtRiskLow', lushtRiskLowSource);
    map1.addSource('ulterRiskHigh', ulterRiskHighSource);
    map1.addSource('ulterRiskMedium', ulterRiskMediumSource);
    map1.addSource('ulterRiskLow', ulterRiskLowSource);
    map1.addSource('shisperRiskHigh', shisperRiskHighSource);
    map1.addSource('shisperRiskMedium', shisperRiskMediumSource);
    map1.addSource('shisperRiskLow', shisperRiskLowSource);
    map1.addSource('shisperLake', shisperLakeSource);
    map1.addSource('brepZonation', brep_zonationSource);
    map1.addSource('darkotRz', darkot_zonationSrc);
    map1.addSource('darkotSchools', darkotSchoolsSrc);
    map1.addSource('darkotBuildings', darkotBuildingsSrc);
    map1.addSource('darkotRivers', darkotRiversSrc);
    map1.addSource('darkotGlacier', darkotGlacierSrc);
    map1.addSource('gulmitLine', gulmitLineSrc);
    map1.addSource('gulmitRz', gulmit_zonationSource);
    map1.addSource('gulmitBuildings', gulmitBuildingsSrc);
    map1.addSource('gulmitRoads', gulmitRoadsSrc);
    map1.addSource('gulmitRivers', gulmitRiversSrc);
    map1.addSource('gulmitSchools', gulmitSchoolsSrc);
    map1.addSource('thaluRz', thalu_zonationSource);


    //_________________________________________________________________________________________________
    map1.addLayer({
        id: 'national-boundary-layer',
        type: 'line',
        source: 'pakNationalBoundary',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000000',
            'line-width': 3.2,
            'line-opacity': 0.95
        }
    });
    map1.addLayer({
        id: 'provincial-boundary-layer',
        type: 'line',
        source: 'pakProvincialBoundary',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000000',
            'line-width': 2.2,
            'line-opacity': 0.95
        }
    });
    map1.addLayer({
        id: 'district-boundary-layer',
        type: 'line',
        source: 'pakDistrictBoundary',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000000',
            'line-width': 1.5,
            'line-opacity': 0.9
        }
    });
    map1.addLayer({
        id: 'district-boundary-label-layer',
        type: 'symbol',
        source: 'pakDistrictBoundary',
        minzoom: 7.5,
        layout: {
            'visibility': 'none',
            'symbol-placement': 'point',
            'text-field': [
                'coalesce',
                ['get', 'Districts'],
                ['get', 'districts'],
                ['get', 'DISTRICT'],
                ['get', 'District'],
                ['get', 'district'],
                ['get', 'DIST_NAME'],
                ['get', 'DISTRICT_N'],
                ['get', 'NAME_2'],
                ['get', 'NAME'],
                ''
            ],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7.5, 10,
                10, 13,
                12, 15
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#f8fafc',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.4
        }
    });

    const akahHazardTypeStyles = [
        { code: 'ava', fillId: 'akah-hzd-ava-layer', outlineId: 'akah-hzd-ava-outline-layer', color: '#e31a1c' },
        { code: 'dbf', fillId: 'akah-hzd-dbf-layer', outlineId: 'akah-hzd-dbf-outline-layer', color: '#ff7f00' },
        { code: 'bnk', fillId: 'akah-hzd-bnk-layer', outlineId: 'akah-hzd-bnk-outline-layer', color: '#ffd92f' },
        { code: 'fld', fillId: 'akah-hzd-fld-layer', outlineId: 'akah-hzd-fld-outline-layer', color: '#1f78b4' },
        { code: 'lds', fillId: 'akah-hzd-lds-layer', outlineId: 'akah-hzd-lds-outline-layer', color: '#6a3d9a' },
        { code: 'rkf', fillId: 'akah-hzd-rkf-layer', outlineId: 'akah-hzd-rkf-outline-layer', color: '#33a02c' },
        { code: 'ufl', fillId: 'akah-hzd-ufl-layer', outlineId: 'akah-hzd-ufl-outline-layer', color: '#00bcd4' }
    ];

    akahHazardTypeStyles.forEach((hazardType) => {
        map1.addLayer({
            id: hazardType.fillId,
            type: 'fill',
            source: 'akahHazardExposure',
            layout: {
                'visibility': 'none'
            },
            filter: [
                'match',
                ['get', 'hzd_type'],
                [hazardType.code, hazardType.code.toUpperCase()],
                true,
                false
            ],
            paint: {
                'fill-color': hazardType.color,
                'fill-opacity': 0.5
            }
        });

        map1.addLayer({
            id: hazardType.outlineId,
            type: 'line',
            source: 'akahHazardExposure',
            layout: {
                'visibility': 'none',
                'line-cap': 'round',
                'line-join': 'round'
            },
            filter: [
                'match',
                ['get', 'hzd_type'],
                [hazardType.code, hazardType.code.toUpperCase()],
                true,
                false
            ],
            paint: {
                'line-color': hazardType.color,
                'line-width': 2,
                'line-opacity': 1,
                'line-dasharray': [0, 2, 3]
            }
        });
    });

    startAkahHazardOutlineAnimation();

    //__________________________________________________________________________________________________
    //GlofSites 
    map1.addLayer({
        'id': 'vulSites',
        'type': 'symbol',
        'source': 'vulSites',
        'layout': {
            'visibility': 'none',
            'icon-image': 'lake-pin-purple',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.24,
                8, 0.42,
                12, 0.58
            ],
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom'
        }
    });
    // Add a click event to show a popup
    map1.on('click', 'vulSites', function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice(); // Get coordinates
        const glacierName = e.features[0].properties["Name"] || 'No information available'; // Fetch "Name" property

        // Create and show the popup
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong><u>Glacier Name:</u></strong> ${glacierName}`)
            .addTo(map1);
    });
    map1.on('mouseenter', 'vulSites', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'vulSites', function () {
        map1.getCanvas().style.cursor = '';
    });


    map1.addLayer({
        'id': 'vulLakes',
        'type': 'circle',
        'source': 'vulLakes',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'circle-color': 'transparent', // Make the circle itself transparent
            'circle-radius': 14,
            'circle-stroke-color': 'red', // Outline color
            'circle-stroke-width': 3, // Stroke thickness
        }
    });
    map1.on('click', 'vulLakes', function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice(); // Extract coordinates
        const properties = e.features[0].properties; // Extract all properties

        // Construct the popup HTML
        const popupContent = `
            <strong><u>Lake Name:</u></strong> ${properties.Lake_Name} <br>
            <strong><u>Elevation:</u></strong> ${properties.Elevation_} m <br>
            <strong><u>Aspect:</u></strong> ${properties.Aspect} <br>
            <strong><u>District:</u></strong> ${properties.Districts} <br>
            <strong><u>Area at Risk:</u></strong> ${properties.Areas_at_R} <br>
            <strong><u>Observed Level:</u></strong> ${properties.Observed_L} <br>
        `;

        // Create and show the popup
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map1);
    });
    // Change cursor to pointer when hovering over the lake circles
    map1.on('mouseenter', 'vulLakes', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'vulLakes', function () {
        map1.getCanvas().style.cursor = '';
    });
    const blinkingInterval = makeLayerBlink(map1, 'vulLakes', 500);

    (function addInventoryHatchPattern() {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Diagonal hatch strokes for clear polygon interior identification.
        ctx.strokeStyle = 'rgba(8, 145, 178, 0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 12);
        ctx.lineTo(4, 4);
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 0);
        ctx.moveTo(12, 20);
        ctx.lineTo(20, 12);
        ctx.stroke();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(ctx.getImageData(0, 0, size, size).data)
        };

        if (!map1.hasImage('inventory-hatch-pattern')) {
            map1.addImage('inventory-hatch-pattern', image);
        }
    })();

    map1.addLayer({
        id: 'glacial-lakes-inventory-fill',
        type: 'fill',
        source: 'glacialLakesInventory',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-pattern': 'inventory-hatch-pattern',
            'fill-opacity': 1
        }
    });
    map1.addLayer({
        id: 'glacial-lakes-inventory-outline',
        type: 'line',
        source: 'glacialLakesInventory',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#67e8f9',
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                4, 2,
                8, 2.7,
                12, 3.4
            ],
            'line-opacity': 1
        }
    });

    // Center markers make very small polygons visible at low zoom.
    (function addInventoryCenterDot() {
        const size = 42;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const center = size / 2;
        const radius = 6.2;

        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = 'rgba(12, 74, 110, 0.95)';
        ctx.stroke();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(ctx.getImageData(0, 0, size, size).data)
        };

        if (!map1.hasImage('inventory-center-dot')) {
            map1.addImage('inventory-center-dot', image);
        }
    })();

    map1.addLayer({
        id: 'glacial-lakes-inventory-centers',
        type: 'symbol',
        source: 'glacialLakesInventory',
        layout: {
            'visibility': 'none',
            'icon-image': 'inventory-center-dot',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.9,
                8, 0.6,
                12, 0.4
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
        }
    });

    map1.addLayer({
        id: 'akah-infrastructure-layer',
        type: 'circle',
        source: 'akahInfrastructure',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#ff1f1f',
            'circle-radius': 2.8,
            'circle-opacity': 0.95,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.6
        }
    });

    const addPopulatedPlacesPointLayer = (useGifIcon) => {
        if (map1.getLayer('populated-places-points-layer')) {
            return;
        }

        const beforeLayerId = map1.getLayer('populated-places-name-label-layer')
            ? 'populated-places-name-label-layer'
            : undefined;

        if (useGifIcon) {
            map1.addLayer({
                id: 'populated-places-points-layer',
                type: 'symbol',
                source: 'populatedPlaces',
                layout: {
                    'visibility': 'none',
                    'icon-image': 'populated-places-static-icon',
                    'icon-size': [
                        'interpolate', ['linear'], ['zoom'],
                        6, 0.07,
                        10, 0.1,
                        13, 0.12
                    ],
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        0,
                        1
                    ]
                }
            }, beforeLayerId);
            return;
        }

        // Fallback if GIF cannot be loaded by the browser/runtime.
        map1.addLayer({
            id: 'populated-places-points-layer',
            type: 'circle',
            source: 'populatedPlaces',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'circle-color': '#f8fafc',
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    6, 2,
                    10, 3,
                    13, 4.2
                ],
                'circle-stroke-color': '#0f172a',
                'circle-stroke-width': 1,
                'circle-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0,
                    0.95
                ]
            }
        }, beforeLayerId);
    };

    map1.loadImage('data/location.gif', function (error, image) {
        if (!error && image) {
            if (!map1.hasImage('populated-places-static-icon')) {
                map1.addImage('populated-places-static-icon', image);
            }
            addPopulatedPlacesPointLayer(true);
            bindPopulatedPlacesHoverAnimationEvents();
            return;
        }

        console.warn('Could not load location.gif for populated places static icon. Falling back to circle markers.');
        addPopulatedPlacesPointLayer(false);
        bindPopulatedPlacesHoverAnimationEvents();
    });

    map1.addLayer({
        id: 'populated-places-name-label-layer',
        type: 'symbol',
        source: 'populatedPlaces',
        minzoom: 7,
        layout: {
            'visibility': 'none',
            'text-field': [
                'coalesce',
                ['get', 'name'],
                ['get', 'Name'],
                ['get', 'NAME'],
                'N/A'
            ],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 10,
                10, 12,
                13, 14
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1],
            'text-anchor': 'top',
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.2
        }
    });

    map1.addLayer({
        id: 'populated-places-population-label-layer',
        type: 'symbol',
        source: 'populatedPlaces',
        minzoom: 10,
        layout: {
            'visibility': 'none',
            'text-field': [
                'concat',
                'Population: ',
                ['to-string', ['coalesce', ['get', 'population'], ['get', 'Population'], ['get', 'POPULATION']]]
            ],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                10, 10,
                13, 12
            ],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-offset': [0, 2.1],
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-ignore-placement': true
        },
        filter: [
            'all',
            ['any', ['has', 'population'], ['has', 'Population'], ['has', 'POPULATION']],
            ['match',
                ['downcase', ['to-string', ['coalesce', ['get', 'population'], ['get', 'Population'], ['get', 'POPULATION'], '']]],
                ['', 'null', 'n/a', 'na', '-', '--', 'none', 'unknown', 'nil'],
                false,
                true
            ]
        ],
        paint: {
            'text-color': '#ffff00',
            'text-halo-color': '#1f2937',
            'text-halo-width': 1
        }
    });

    map1.addLayer({
        id: 'flood-susceptibility-layer',
        type: 'raster',
        source: 'floodSusceptibilityRaster',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'raster-opacity': 0.75
        }
    }, 'national-boundary-layer');
    //_____________________________________________________________________________________________________________________________________________________________
    // Add the incident layer
    map1.addLayer({
        'id': 'incident',
        'type': 'circle',
        'source': 'incident',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'circle-color': '#ff0000', // Red color for incident
            'circle-radius': 15,
            'circle-stroke-color': '#000000', // Black outline for better contrast
            'circle-stroke-width': 4,
            'circle-opacity': 0.9
        }
    });

    // Add click event for incident layer
    map1.on('click', 'incident', function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = `
            <strong><u>Incident Location</u></strong><br>
            <strong>Name:</strong> ${properties.name || 'Incident Point'}<br>
            <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
        `;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map1);
    });

    // Change cursor to pointer when hovering over incident point
    map1.on('mouseenter', 'incident', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'incident', function () {
        map1.getCanvas().style.cursor = '';
    });

    map1.addLayer({
        id: 'high-temp-warning-area',
        type: 'circle',
        source: 'highTempWarning',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': 'rgba(255, 0, 47, 0.12)',
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 16,
                10, 36,
                13, 70
            ],
            'circle-stroke-color': '#ff0037',
            'circle-stroke-width': 3,
            'circle-stroke-opacity': 0.95
        }
    });

    map1.on('click', 'high-temp-warning-area', function () {
        showHighTempWarningPopup();
    });
    map1.on('mouseenter', 'high-temp-warning-area', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'high-temp-warning-area', function () {
        map1.getCanvas().style.cursor = '';
    });

    map1.addLayer({
        id: 'station-points-layer',
        type: 'circle',
        source: 'stationPoints',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#f97316',
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                5, 3,
                8, 5,
                12, 7
            ],
            'circle-stroke-color': '#f8fafc',
            'circle-stroke-width': 1.6,
            'circle-opacity': 0.98,
            'circle-blur': 0.12,
            'circle-emissive-strength': 0.9
        }
    });

    map1.addLayer({
        id: 'station-points-animated-halo-layer',
        type: 'circle',
        source: 'stationPoints',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#00b6ff',
            'circle-radius': 12,
            'circle-opacity': 0.56,
            'circle-blur': 0.82,
            'circle-emissive-strength': 1,
            'circle-radius-transition': {
                duration: 220,
                delay: 0
            },
            'circle-color-transition': {
                duration: 220,
                delay: 0
            },
            'circle-opacity-transition': {
                duration: 220,
                delay: 0
            },
            'circle-blur-transition': {
                duration: 220,
                delay: 0
            }
        }
    });

    map1.addLayer({
        id: 'station-points-animated-layer',
        type: 'circle',
        source: 'stationPoints',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#00b6ff',
            'circle-radius': 6.2,
            'circle-stroke-color': '#f8fafc',
            'circle-stroke-width': 1.9,
            'circle-opacity': 1,
            'circle-blur': 0.12,
            'circle-emissive-strength': 1,
            'circle-radius-transition': {
                duration: 220,
                delay: 0
            },
            'circle-color-transition': {
                duration: 220,
                delay: 0
            },
            'circle-blur-transition': {
                duration: 220,
                delay: 0
            }
        }
    });

    map1.addLayer({
        id: 'station-points-label-layer',
        type: 'symbol',
        source: 'stationPoints',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'name'], 'Station'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                6, 10,
                10, 12,
                13, 14
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.15],
            'text-anchor': 'top',
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.2
        }
    });

    const ensureGmrcWapdaIcon = () => {
        if (map1.hasImage('gmrc-wapda-icon')) {
            return;
        }

        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const center = size / 2;
        const outerRadius = 16;

        context.beginPath();
        context.moveTo(center, size - 4);
        context.bezierCurveTo(center - 12, 32, 10, 18, center, 7);
        context.bezierCurveTo(size - 10, 18, center + 12, 32, center, size - 4);
        context.closePath();
        context.fillStyle = '#0284c7';
        context.fill();

        context.beginPath();
        context.arc(center, 20, outerRadius, 0, Math.PI * 2);
        context.fillStyle = '#0f172a';
        context.fill();

        context.beginPath();
        context.arc(center, 20, outerRadius - 3, 0, Math.PI * 2);
        context.fillStyle = '#0ea5e9';
        context.fill();

        context.beginPath();
        context.moveTo(center - 8, 24);
        context.lineTo(center - 1, 15);
        context.lineTo(center + 6, 24);
        context.closePath();
        context.fillStyle = '#ffffff';
        context.fill();

        context.beginPath();
        context.moveTo(center - 4, 24);
        context.lineTo(center + 1, 18);
        context.lineTo(center + 5, 24);
        context.closePath();
        context.fillStyle = '#dbeafe';
        context.fill();

        context.beginPath();
        context.arc(center, 20, 3.1, 0, Math.PI * 2);
        context.fillStyle = '#f8fafc';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('gmrc-wapda-icon', image);
    };

    ensureGmrcWapdaIcon();

    map1.addLayer({
        id: 'gmrc-wapda-points-layer',
        type: 'circle', // 'symbol'
        source: 'gmrcWapdaPoints',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'gmrc-wapda-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.72,
                8, 0.92,
                12, 1.1
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['coalesce', ['get', 'Name'], 'GMRC, WAPDA'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                5, 10,
                9, 11,
                12, 13
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
            'text-ignore-placement': false */
        },
        paint: {
            'circle-color': '#0284c7',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
            /* 'text-color': '#ffffff',
            'text-halo-color': '#082f49',
            'text-halo-width': 1.3 */
        }
    });

    map1.on('click', 'gmrc-wapda-points-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;
        const pointName = properties.Name || 'GMRC, WAPDA Point';

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>GMRC, WAPDA</u></strong><br>
                <strong>Name:</strong> ${pointName}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'gmrc-wapda-points-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'gmrc-wapda-points-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    map1.addLayer({
        id: 'pdma-kp-points-layer',
        type: 'circle',
        source: 'pdmaKpPoints',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#0ea5e9',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
        }
    });

    map1.on('click', 'pdma-kp-points-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;
        const pointName = properties.Name || properties.name || properties.lake_name || 'PDMA, KP Point';

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>PDMA, KP</u></strong><br>
                <strong>Name:</strong> ${pointName}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'pdma-kp-points-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'pdma-kp-points-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    map1.addLayer({
        id: 'evk2cnr-points-layer',
        type: 'circle',
        source: 'evk2cnrPoints',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#16a34a',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
        }
    });

    map1.on('click', 'evk2cnr-points-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;
        const pointName = properties.Name || 'EvK2CNR Point';
        const group = properties.Group || 'EvK2CNR AWS';
        const elevation = properties.Elevation || 'Unknown';

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>${group}</u></strong><br>
                <strong>Name:</strong> ${pointName}<br>
                <strong>Elevation:</strong> ${elevation}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'evk2cnr-points-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'evk2cnr-points-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const ensureGlofIIDestinationIcon = () => {
        if (map1.hasImage('glof-ii-destination-icon')) {
            return;
        }

        const size = 50;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = 20;

        context.beginPath();
        context.moveTo(centerX, size - 4);
        context.bezierCurveTo(centerX - 13, 33, 11, 19, centerX, 7);
        context.bezierCurveTo(size - 11, 19, centerX + 13, 33, centerX, size - 4);
        context.closePath();
        context.fillStyle = '#facc15';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 15.5, 0, Math.PI * 2);
        context.fillStyle = '#3f3f46';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 12, 0, Math.PI * 2);
        context.fillStyle = '#fde047';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
        context.fillStyle = '#f8fafc';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 3.1, 0, Math.PI * 2);
        context.fillStyle = '#ca8a04';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('glof-ii-destination-icon', image);
    };

    ensureGlofIIDestinationIcon();

    map1.addLayer({
        id: 'glof-ii-stations-layer',
        type: 'circle', // 'symbol'
        source: 'glofIIStations',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'glof-ii-destination-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.72,
                8, 0.92,
                12, 1.08
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['coalesce', ['get', 'StationNam'], ['get', 'Name'], 'GLOF II'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                5, 10,
                9, 11,
                12, 13
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
            'text-ignore-placement': false */
        },
        paint: {
            'circle-color': '#facc15',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
            /* 'text-color': '#ffffff',
            'text-halo-color': '#713f12',
            'text-halo-width': 1.25 */
        }
    });

    map1.on('click', 'glof-ii-stations-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;
        const stationName = properties.StationNam || properties.Name || 'GLOF II Station';

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>GLOF II Station</u></strong><br>
                <strong>Name:</strong> ${stationName}<br>
                <strong>Code:</strong> ${properties.Code || '--'}<br>
                <strong>Status:</strong> ${properties.Status || '--'}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'glof-ii-stations-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'glof-ii-stations-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const ensureGlofIIDamagedStationsIcon = () => {
        if (map1.hasImage('glof-ii-damaged-warning-icon')) {
            return;
        }

        const size = 52;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = 21;

        context.beginPath();
        context.moveTo(centerX, size - 4);
        context.bezierCurveTo(centerX - 13, 34, 11, 20, centerX, 7);
        context.bezierCurveTo(size - 11, 20, centerX + 13, 34, centerX, size - 4);
        context.closePath();
        context.fillStyle = '#f59e0b';
        context.fill();

        context.beginPath();
        context.moveTo(centerX, 7);
        context.lineTo(centerX - 15, 33);
        context.lineTo(centerX + 15, 33);
        context.closePath();
        context.fillStyle = '#facc15';
        context.fill();
        context.strokeStyle = '#7c2d12';
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        context.moveTo(centerX, 16);
        context.lineTo(centerX, 25);
        context.strokeStyle = '#7c2d12';
        context.lineWidth = 3.4;
        context.lineCap = 'round';
        context.stroke();

        context.beginPath();
        context.arc(centerX, 29, 1.9, 0, Math.PI * 2);
        context.fillStyle = '#7c2d12';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('glof-ii-damaged-warning-icon', image);
    };

    ensureGlofIIDamagedStationsIcon();

    map1.addLayer({
        id: 'glof-ii-damaged-stations-layer',
        type: 'circle', // 'symbol'
        source: 'glofIIDamagedStations',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'glof-ii-damaged-warning-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.75,
                8, 0.95,
                12, 1.1
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['coalesce', ['get', 'StationNam'], ['get', 'Name'], 'GLOF II Damaged Station'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                5, 10,
                9, 11,
                12, 13
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
            'text-ignore-placement': false */
        },
        paint: {
            'circle-color': '#f59e0b',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
            /* 'text-color': '#ffffff',
            'text-halo-color': '#7c2d12',
            'text-halo-width': 1.25 */
        }
    });

    map1.on('click', 'glof-ii-damaged-stations-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;
        const stationName = properties.StationNam || properties.Name || 'GLOF II Damaged Station';

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>GLOF II Damaged Stations</u></strong><br>
                <strong>Name:</strong> ${stationName}<br>
                <strong>Damage:</strong> ${properties.Column1 || '--'}<br>
                <strong>Condition:</strong> ${properties.Column2 || '--'}<br>
                <strong>Work Required:</strong> ${properties.Column_3 || '--'}<br>
                <strong>Province:</strong> ${properties.Province || '--'}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'glof-ii-damaged-stations-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'glof-ii-damaged-stations-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const ensureAkahStationsIcon = () => {
        if (map1.hasImage('akah-stations-destination-icon')) {
            map1.removeImage('akah-stations-destination-icon');
        }

        const size = 50;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = 20;

        context.beginPath();
        context.moveTo(centerX, size - 4);
        context.bezierCurveTo(centerX - 13, 33, 11, 19, centerX, 7);
        context.bezierCurveTo(size - 11, 19, centerX + 13, 33, centerX, size - 4);
        context.closePath();
        context.fillStyle = '#16a34a';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 15.5, 0, Math.PI * 2);
        context.fillStyle = '#14532d';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 12, 0, Math.PI * 2);
        context.fillStyle = '#22c55e';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
        context.fillStyle = '#f8fafc';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 3.1, 0, Math.PI * 2);
        context.fillStyle = '#166534';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('akah-stations-destination-icon', image);
    };

    ensureAkahStationsIcon();

    map1.addLayer({
        id: 'akah-stations-layer',
        type: 'circle', // 'symbol'
        source: 'akahStations',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'akah-stations-destination-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.72,
                8, 0.92,
                12, 1.08
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true */
        },
        paint: {
            'circle-color': '#16a34a',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
        }
    });

    map1.on('click', 'akah-stations-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>FOCUS</u></strong><br>
                <strong>Village:</strong> ${properties['Village Name'] || '--'}<br>
                <strong>District:</strong> ${properties.District || '--'}<br>
                <strong>Type:</strong> ${properties.Type || '--'}<br>
                <strong>Hazard:</strong> ${properties.Hazard || '--'}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'akah-stations-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'akah-stations-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const loadAkahStationsWorkbook = async () => {
        try {
            if (typeof XLSX === 'undefined') {
                throw new Error('XLSX library is not available.');
            }

            const response = await fetch(AKAH_STATIONS_XLSX_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch workbook: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames[0] : null;

            if (!sheetName || !workbook.Sheets[sheetName]) {
                throw new Error('Workbook sheet not found.');
            }

            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1,
                defval: '',
                raw: false
            });

            const source = map1.getSource('akahStations');
            if (source && typeof source.setData === 'function') {
                const fc = buildAkahStationsFeatureCollection(rows);
                source.setData(fc);
                try {
                    window.layerFeatureCounts = window.layerFeatureCounts || {};
                    window.layerFeatureCounts['akah-stations-layer'] = Array.isArray(fc.features) ? fc.features.length : 0;
                } catch (e) {
                    // ignore
                }
                if (typeof refreshActiveLayersLegend === 'function') refreshActiveLayersLegend();
            }
        } catch (error) {
            console.error('Failed to load AKAH Stations workbook.', error);
        }
    };

    loadAkahStationsWorkbook();

    map1.addLayer({
        id: 'focus-2026-points-layer',
        type: 'circle',
        source: 'focus2026Points',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'circle-color': '#ff7200',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
        }
    });

    map1.on('click', 'focus-2026-points-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;

        if (!coordinates) {
            return;
        }

        const name = properties.Name || properties.name || properties.NAME || properties.StationName || properties.stationname || '';
        const village = properties['Village Name'] || properties.village || properties.Village || '';
        const district = properties.District || properties.district || properties.DISTRICT || '';
        const type = properties.Type || properties.type || properties.TYPE || '';
        const hazard = properties.Hazard || properties.hazard || properties.HAZARD || '';

        let popupContent = `<strong><u>FOCUS 2026</u></strong><br>`;
        if (name) popupContent += `<strong>Name:</strong> ${name}<br>`;
        if (village) popupContent += `<strong>Village:</strong> ${village}<br>`;
        if (district) popupContent += `<strong>District:</strong> ${district}<br>`;
        if (type) popupContent += `<strong>Type:</strong> ${type}<br>`;
        if (hazard) popupContent += `<strong>Hazard:</strong> ${hazard}<br>`;
        popupContent += `<strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'focus-2026-points-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'focus-2026-points-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const ensureUndpAllSensorsIcon = () => {
        if (map1.hasImage('undp-all-sensors-destination-icon')) {
            map1.removeImage('undp-all-sensors-destination-icon');
        }

        const size = 50;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = 20;

        context.beginPath();
        context.moveTo(centerX, size - 4);
        context.bezierCurveTo(centerX - 13, 33, 11, 19, centerX, 7);
        context.bezierCurveTo(size - 11, 19, centerX + 13, 33, centerX, size - 4);
        context.closePath();
        context.fillStyle = '#f97316';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 15.5, 0, Math.PI * 2);
        context.fillStyle = '#7c2d12';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 12, 0, Math.PI * 2);
        context.fillStyle = '#fb923c';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
        context.fillStyle = '#f8fafc';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 3.1, 0, Math.PI * 2);
        context.fillStyle = '#9a3412';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('undp-all-sensors-destination-icon', image);
    };

    ensureUndpAllSensorsIcon();

    map1.addLayer({
        id: 'undp-all-sensors-layer',
        type: 'circle', // 'symbol'
        source: 'undpAllSensors',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'undp-all-sensors-destination-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.72,
                8, 0.92,
                12, 1.08
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['coalesce', ['get', 'StationNames'], 'UNDP All sensors'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                5, 10,
                9, 11,
                12, 13
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
            'text-ignore-placement': false */
        },
        paint: {
            'circle-color': '#f97316',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
            /* 'text-color': '#ffffff',
            'text-halo-color': '#7c2d12',
            'text-halo-width': 1.25 */
        }
    });

    map1.on('click', 'undp-all-sensors-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>UNDP All sensors</u></strong><br>
                <strong>Station:</strong> ${properties.StationNames || '--'}<br>
                <strong>Code:</strong> ${properties.Code || '--'}<br>
                <strong>Type:</strong> ${properties.Type || '--'}<br>
                <strong>Hazard:</strong> ${properties.Hazard || '--'}<br>
                <strong>Status:</strong> ${properties.Status || '--'}<br>
                <strong>Province:</strong> ${properties.Province || '--'}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'undp-all-sensors-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'undp-all-sensors-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    // -- PMD SENSORS CATEGORIZED --
    const pmdTypes = [
        { code: 'ARG', color: '#ca8a04', name: 'ARG' },
        { code: 'AWS', color: '#e11d48', name: 'AWS' },
        { code: 'WL-R', color: '#2563eb', name: 'WL-R' },
        { code: 'WL-L', color: '#0d9488', name: 'WL-L' },
        { code: 'WP', color: '#9333ea', name: 'WP' },
        { code: 'DG', color: '#ea580c', name: 'DG' }
    ];

    pmdTypes.forEach(pt => {
        const layerId = `pmd-sensors-${pt.code}-layer`;
        map1.addLayer({
            id: layerId,
            type: 'circle',
            source: 'undpAllSensors',
            filter: ['==', ['get', 'Code'], pt.code],
            layout: { 'visibility': 'none' },
            paint: {
                'circle-color': pt.color,
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1
            }
        });

        map1.on('click', layerId, function (e) {
            const feature = e && e.features && e.features[0] ? e.features[0] : null;
            if (!feature) return;

            const properties = feature.properties || {};
            const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
                ? feature.geometry.coordinates.slice()
                : null;

            if (!coordinates) return;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <strong><u>${pt.name}</u></strong><br>
                    <strong>Station:</strong> ${properties.StationNames || '--'}<br>
                    <strong>Code:</strong> ${properties.Code || '--'}<br>
                    <strong>Status:</strong> ${properties.Status || '--'}<br>
                    <strong>Province:</strong> ${properties.Province || '--'}<br>
                    <strong>Elevation:</strong> ${properties.Elev || '--'}<br>
                    <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
                `)
                .addTo(map1);
        });

        map1.on('mouseenter', layerId, function () { map1.getCanvas().style.cursor = 'pointer'; });
        map1.on('mouseleave', layerId, function () { map1.getCanvas().style.cursor = ''; });
    });

    const loadUndpAllSensorsCsv = async () => {
        try {
            const response = await fetch(UNDP_ALL_SENSORS_CSV_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status}`);
            }

            const csvText = await response.text();
            const source = map1.getSource('undpAllSensors');
            if (source && typeof source.setData === 'function') {
                const fc = buildUndpAllSensorsFeatureCollection(csvText);
                source.setData(fc);
                try {
                    window.layerFeatureCounts = window.layerFeatureCounts || {};
                    window.layerFeatureCounts['undp-all-sensors-layer'] = Array.isArray(fc.features) ? fc.features.length : 0;

                    // PMD Sensor counts
                    pmdTypes.forEach(pt => {
                        window.layerFeatureCounts[`pmd-sensors-${pt.code}-layer`] = Array.isArray(fc.features) ?
                            fc.features.filter(f => f.properties.Code === pt.code).length : 0;
                    });
                } catch (e) { }
                if (typeof refreshActiveLayersLegend === 'function') refreshActiveLayersLegend();
            }
        } catch (error) {
            console.error('Failed to load UNDP All sensors CSV.', error);
        }
    };

    loadUndpAllSensorsCsv();

    const ensureBriFfSensorsIcon = () => {
        if (map1.hasImage('bri-ff-sensors-destination-icon')) {
            map1.removeImage('bri-ff-sensors-destination-icon');
        }

        const size = 50;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = 20;

        context.beginPath();
        context.moveTo(centerX, size - 4);
        context.bezierCurveTo(centerX - 13, 33, 11, 19, centerX, 7);
        context.bezierCurveTo(size - 11, 19, centerX + 13, 33, centerX, size - 4);
        context.closePath();
        context.fillStyle = '#ef4444';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 15.5, 0, Math.PI * 2);
        context.fillStyle = '#7f1d1d';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 12, 0, Math.PI * 2);
        context.fillStyle = '#f87171';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
        context.fillStyle = '#f8fafc';
        context.fill();

        context.beginPath();
        context.arc(centerX, centerY, 3.1, 0, Math.PI * 2);
        context.fillStyle = '#991b1b';
        context.fill();

        const image = {
            width: size,
            height: size,
            data: new Uint8Array(context.getImageData(0, 0, size, size).data)
        };

        map1.addImage('bri-ff-sensors-destination-icon', image);
    };

    ensureBriFfSensorsIcon();

    map1.addLayer({
        id: 'bri-ff-sensors-layer',
        type: 'circle', // 'symbol'
        source: 'briFfSensors',
        layout: {
            'visibility': 'none',
            /* 'icon-image': 'bri-ff-sensors-destination-icon',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.72,
                8, 0.92,
                12, 1.08
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['coalesce', ['get', 'StationName'], 'BRI_FF Sensor'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                5, 10,
                9, 11,
                12, 13
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
            'text-ignore-placement': false */
        },
        paint: {
            'circle-color': '#ef4444',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
            /* 'text-color': '#ffffff',
            'text-halo-color': '#7f1d1d',
            'text-halo-width': 1.25 */
        }
    });

    map1.on('click', 'bri-ff-sensors-layer', function (e) {
        const feature = e && e.features && e.features[0] ? e.features[0] : null;
        if (!feature) {
            return;
        }

        const properties = feature.properties || {};
        const coordinates = feature.geometry && Array.isArray(feature.geometry.coordinates)
            ? feature.geometry.coordinates.slice()
            : null;

        if (!coordinates) {
            return;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>BRI_FF Sensors</u></strong><br>
                <strong>Station:</strong> ${properties.StationName || '--'}<br>
                <strong>Type:</strong> ${properties.StationType || '--'}<br>
                <strong>Altitude (m):</strong> ${properties.Altitude || '--'}<br>
                <strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}
            `)
            .addTo(map1);
    });

    map1.on('mouseenter', 'bri-ff-sensors-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'bri-ff-sensors-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    const loadBriFfSensorsCsv = async () => {
        try {
            const response = await fetch(BRI_FF_SENSORS_CSV_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status}`);
            }

            const csvText = await response.text();
            const source = map1.getSource('briFfSensors');
            if (source && typeof source.setData === 'function') {
                const fc = buildBriFfSensorsFeatureCollection(csvText);
                source.setData(fc);
                try {
                    window.layerFeatureCounts = window.layerFeatureCounts || {};
                    window.layerFeatureCounts['bri-ff-sensors-layer'] = Array.isArray(fc.features) ? fc.features.length : 0;
                } catch (e) { }
                if (typeof refreshActiveLayersLegend === 'function') refreshActiveLayersLegend();
            }
        } catch (error) {
            console.error('Failed to load BRI_FF sensors CSV.', error);
        }
    };

    loadBriFfSensorsCsv();

    if (!map1.__stationPointInteractionsBound) {
        const handleStationPointClick = function (e) {
            const feature = e && e.features && e.features[0] ? e.features[0] : null;
            if (!feature) {
                return;
            }

            const properties = feature.properties || {};
            const stationName = properties.name || properties.Name || 'Station';
            const coordinates = feature.geometry && feature.geometry.coordinates
                ? feature.geometry.coordinates.slice()
                : null;

            if (coordinates) {
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<strong><u>Station:</u></strong> ${stationName}`)
                    .addTo(map1);
            }

            if (typeof window.handleStationPointSelection === 'function') {
                window.handleStationPointSelection(stationName);
            }
        };

        map1.on('click', 'station-points-layer', handleStationPointClick);
        map1.on('click', 'station-points-animated-layer', handleStationPointClick);
        map1.on('click', 'station-points-label-layer', handleStationPointClick);

        map1.on('mouseenter', 'station-points-layer', function () {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseenter', 'station-points-animated-layer', function () {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseenter', 'station-points-label-layer', function () {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseleave', 'station-points-layer', function () {
            map1.getCanvas().style.cursor = '';
        });
        map1.on('mouseleave', 'station-points-animated-layer', function () {
            map1.getCanvas().style.cursor = '';
        });
        map1.on('mouseleave', 'station-points-label-layer', function () {
            map1.getCanvas().style.cursor = '';
        });

        map1.__stationPointInteractionsBound = true;
    }

    //_____________________________________________________________________________________________________________________________________________________________
    // Add the boundary line layer (initially hidden)
    map1.addLayer({
        id: 'badswat-line',
        type: 'line',
        source: 'badswatBound',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': '#088', // Change to any color
            'line-width': 6, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'hiranchi-line',
        type: 'line',
        source: 'hiranchiBounds',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': '#088', // Change to any color
            'line-width': 6, // Adjust thickness
        }
    });
    //__________________________________________________________________________________________________
    //Badswat Layers
    map1.addLayer({
        id: 'badswat-glacier-layer',
        type: 'fill',
        source: 'badswatGlacier',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#ADD8E6', // Light blue
            'fill-opacity': 0.6
        }
    });
    map1.addLayer({
        id: 'badswat-glacier-line',
        type: 'line',
        source: 'badswatGlacier',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': 'black', // Change to any color
            'line-width': 3, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'badswat-risk-layer',
        type: 'fill',
        source: 'badswatRiskZonation',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'ZONATION'], // Attribute to match
                'Low', '#00990f',     // Green for low risk
                'Medium', '#f0e02e',  // Yellow for medium risk
                'High', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'badswat-faultine-layer',
        type: 'line',
        source: 'badswatfaultline',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'line-color': 'black',
            'line-width': 3,
        }
    });
    map1.addLayer({
        id: 'badswat-lake-layer',
        type: 'fill',
        source: 'badswatLake',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#02decf', // Blue
            'fill-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'ishkoman-river-layer',
        type: 'line',
        source: 'ishkomanRiver',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'line-color': '#0000FF', // Blue
            'line-width': 4,
            'line-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'karambar-lake-layer',
        type: 'fill',
        source: 'karambarLake',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#02decf', // Dodger blue
            'fill-opacity': 0.8
        }
    });
    //__________________________________________________________________________________________________
    //Pindoru Chaat Sources
    map1.addSource('pindoru-lake-src', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APindoru_Chaat_Lake&outputFormat=application%2Fjson'
    });
    map1.addSource('pindoru-rz-high-src', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APindoru_Chaat_High_Risk&outputFormat=application%2Fjson'
    });
    map1.addSource('pindoru-rz-medium-src', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APindoru_Chaat_Medium_Risk&outputFormat=application%2Fjson'
    });
    map1.addSource('pindoru-rz-low-src', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3APindoru_Chaat_Low_Risk&outputFormat=application%2Fjson'
    });
    //__________________________________________________________________________________________________
    //Pindoru Chaat Layers
    map1.addLayer({
        id: 'pindoru-lake-fill',
        type: 'fill',
        source: 'pindoru-lake-src',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#1e88e5', 'fill-opacity': 0.6 }
    });
    map1.addLayer({
        id: 'pindoru-lake-outline',
        type: 'line',
        source: 'pindoru-lake-src',
        layout: { 'visibility': 'none' },
        paint: { 'line-color': '#90caf9', 'line-width': 2 }
    });
    // Risk Zonation — Low (bottom), Medium, High (top)
    map1.addLayer({
        id: 'pindoru-rz-low',
        type: 'fill',
        source: 'pindoru-rz-low-src',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#00990f', 'fill-opacity': 0.7 }
    });
    map1.addLayer({
        id: 'pindoru-rz-medium',
        type: 'fill',
        source: 'pindoru-rz-medium-src',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#f0e02e', 'fill-opacity': 0.7 }
    });
    map1.addLayer({
        id: 'pindoru-rz-high',
        type: 'fill',
        source: 'pindoru-rz-high-src',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#7d0800', 'fill-opacity': 0.7 }
    });
    //__________________________________________________________________________________________________
    //Hiranchi Layers
    map1.addLayer({
        id: 'hiranchi-glacier-layer',
        type: 'fill',
        source: 'hiranchiGlaciers',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#ADD8E6', // Light blue
            'fill-opacity': 0.6
        }
    });
    map1.addLayer({
        id: 'hiranchi-risk-layer',
        type: 'fill',
        source: 'hiranchiRiskZonation',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'ZONATION'], // Attribute to match
                'Low', '#00990f',     // Green for low risk
                'Medium', '#f0e02e',  // Yellow for medium risk
                'High', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'hiranchi-glacier-line',
        type: 'line',
        source: 'hiranchiGlaciers',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': 'black', // Change to any color
            'line-width': 3, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'hiranchi-lake-layer',
        type: 'fill',
        source: 'hiranchiLake',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#02decf', // Blue
            'fill-opacity': 0.8
        }
    });
    //__________________________________________________________________________________________________
    //Reshun Layers
    map1.addLayer({
        id: 'reshun-line',
        type: 'line',
        source: 'reshunBound',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': '#088', // Change to any color
            'line-width': 6, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'reshun-glacier-layer',
        type: 'fill',
        source: 'reshunGlacier',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#ADD8E6', // Light blue
            'fill-opacity': 0.6
        }
    });
    map1.addLayer({
        id: 'reshun-glacier-line',
        type: 'line',
        source: 'reshunGlacier',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': 'black', // Change to any color
            'line-width': 3, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'chitral-river-layer',
        type: 'fill',
        source: 'chitralRiverSource',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#0000FF', // Blue
            'fill-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'reshun-faultline-layer',
        type: 'line',
        source: 'faultlineReshunSource',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'line-color': 'black',
            'line-width': 3,
        }
    });
    map1.addLayer({
        id: 'reshun-nullah-layer',
        type: 'fill',
        source: 'nullahReshunSource',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#02decf', // Blue
            'fill-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'reshun-risk-layer',
        type: 'fill',
        source: 'reshunRiskZonationSource',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'RISK'], // Attribute to match
                'LOW', '#00990f',     // Green for low risk
                'MEDIUM', '#f0e02e',  // Yellow for medium risk
                'HIGH', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    //__________________________________________________________________________________________________
    //Terset Hundur Layers
    map1.addLayer({
        id: 'terset-hundur-lake-layer',
        type: 'fill',
        source: 'tersetHundurLake',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#02decf',
            'fill-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'terset-hundur-river-layer',
        type: 'line',
        source: 'tersetHundurRiver',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#0000FF',
            'line-width': 3,
            'line-opacity': 0.85
        }
    });
    map1.addLayer({
        id: 'terset-hundur-risk-low-layer',
        type: 'fill',
        source: 'tersetHundurRiskLow',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#00990f',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'terset-hundur-risk-medium-layer',
        type: 'fill',
        source: 'tersetHundurRiskMedium',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#f0e02e',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'terset-hundur-risk-high-layer',
        type: 'fill',
        source: 'tersetHundurRiskHigh',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#7d0800',
            'fill-opacity': 0.7
        }
    });
    //__________________________________________________________________________________________________
    //Ishokoman Risk Layers
    map1.addLayer({
        id: 'ishokoman-risk-low-layer',
        type: 'fill',
        source: 'ishokomanRiskLow',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#00990f',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'ishokoman-risk-medium-layer',
        type: 'fill',
        source: 'ishokomanRiskMedium',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#f0e02e',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'ishokoman-risk-high-layer',
        type: 'fill',
        source: 'ishokomanRiskHigh',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#7d0800',
            'fill-opacity': 0.7
        }
    });
    //__________________________________________________________________________________________________
    //Lusht Risk Layers
    map1.addLayer({
        id: 'lusht-risk-low-layer',
        type: 'fill',
        source: 'lushtRiskLow',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#00990f',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'lusht-risk-medium-layer',
        type: 'fill',
        source: 'lushtRiskMedium',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#f0e02e',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'lusht-risk-high-layer',
        type: 'fill',
        source: 'lushtRiskHigh',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#7d0800',
            'fill-opacity': 0.7
        }
    });
    //__________________________________________________________________________________________________
    //Ulter Risk Layers
    map1.addLayer({
        id: 'ulter-risk-low-layer',
        type: 'fill',
        source: 'ulterRiskLow',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#00990f',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'ulter-risk-medium-layer',
        type: 'fill',
        source: 'ulterRiskMedium',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#f0e02e',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'ulter-risk-high-layer',
        type: 'fill',
        source: 'ulterRiskHigh',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#7d0800',
            'fill-opacity': 0.7
        }
    });

    //__________________________________________________________________________________________________
    //Shisper Risk Layers
    map1.addLayer({
        id: 'shisper-lake-layer',
        type: 'fill',
        source: 'shisperLake',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#02decf',
            'fill-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'shisper-risk-low-layer',
        type: 'fill',
        source: 'shisperRiskLow',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#00990f',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'shisper-risk-medium-layer',
        type: 'fill',
        source: 'shisperRiskMedium',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#f0e02e',
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'shisper-risk-high-layer',
        type: 'fill',
        source: 'shisperRiskHigh',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': '#7d0800',
            'fill-opacity': 0.7
        }
    });
    //__________________________________________________________________________________________________
    //BREP
    map1.addLayer({
        id: 'brep-zonation-layer',
        type: 'fill',
        source: 'brepZonation',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['downcase', ['to-string', ['coalesce', ['get', 'Zonation'], ['get', 'zonation'], ['get', 'RISK'], ['get', 'risk'], '']]],
                'low', '#00990f',     // Green for low risk
                'medium', '#f0e02e',  // Yellow for medium risk
                'high', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    //Darkot
    map1.addLayer({
        id: 'darkot-zonation-layer',
        type: 'fill',
        source: 'darkotRz',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'zonation'], // Attribute to match
                'Low', '#00990f',     // Green for low risk
                'Medium', '#f0e02e',  // Yellow for medium risk
                'High', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'darkot-buildings-layer',
        type: 'fill',
        source: 'darkotBuildings',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': 'grey',
            'fill-opacity': 0.8,
            'fill-outline-color': 'black' // Add this line for the outline
        }
    });
    map1.addLayer({
        id: 'darkot-roads-layer',
        type: 'line',
        source: 'darkotRivers',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000000',
            'line-width': 2
        }
    });
    map1.addLayer({
        id: 'darkot-rivers-layer',
        type: 'line',
        source: 'darkotRivers',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#0000FF',
            'line-width': 2
        }
    });
    map1.loadImage('https://i.ibb.co/5g8k2HMX/school.png', (error, image) => {
        if (error) throw error;

        // Add the image to the map with a unique name
        map1.addImage('school-icon', image);

        map1.addLayer({
            id: 'darkot-schools-layer',
            type: 'symbol',  // Use 'symbol' for custom icons
            source: 'darkotSchools',
            layout: {
                'icon-image': 'school-icon',  // Reference the icon by name
                'icon-size': 0.05  // Adjust size as needed
            }
        });
        map1.setLayoutProperty('darkot-schools-layer', 'visibility', 'none');
    });
    map1.addLayer({
        id: 'darkot-glacier-layer',
        type: 'fill',
        source: 'darkotGlacier',
        layout: {
            'visibility': 'none' // ❌ Hidden by default
        },
        paint: {
            'fill-color': '#ADD8E6', // Light blue
            'fill-opacity': 0.6
        }
    });
    //__________________________________________________________________________________________________
    //Gulmit
    map1.addLayer({
        id: 'gulmit-line-layer',
        type: 'line',
        source: 'gulmitLine',
        layout: {
            'visibility': 'none' // Hidden by default
        },
        paint: {
            'line-color': '#088', // Change to any color
            'line-width': 6, // Adjust thickness
        }
    });
    map1.addLayer({
        id: 'gulmit-zonation-layer',
        type: 'fill',
        source: 'gulmitRz',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'Name'], // Attribute to match
                'Low', '#00990f',     // Green for low risk
                'Medium', '#f0e02e',  // Yellow for medium risk
                'High', '#7d0800',    // Red for high risk
                '#000000'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }
    });
    map1.addLayer({
        id: 'gulmit-buildings-layer',
        type: 'fill',
        source: 'gulmitBuildings',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': 'grey',
            'fill-opacity': 0.8,
            'fill-outline-color': 'black' // Add this line for the outline
        }
    });

    map1.addLayer({
        id: 'gulmit-roads-layer',
        type: 'line',
        source: 'gulmitRoads',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000000',
            'line-width': 2
        }
    });
    map1.addLayer({
        id: 'gulmit-rivers-layer',
        type: 'line',
        source: 'gulmitRivers',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'line-color': '#0000FF',
            'line-width': 2
        }
    });
    map1.loadImage('https://i.ibb.co/5g8k2HMX/school.png', (error, image) => {
        if (error) throw error;

        // Add the image to the map with a unique name
        map1.addImage('school-icon', image);

        map1.addLayer({
            id: 'gulmit-schools-layer',
            type: 'symbol',  // Use 'symbol' for custom icons
            source: 'gulmitSchools',
            layout: {
                'icon-image': 'school-icon',  // Reference the icon by name
                'icon-size': 0.05  // Adjust size as needed
            }
        });
        map1.setLayoutProperty('gulmit-schools-layer', 'visibility', 'none');
    });

    //__________________________________________________________________________________________________
    //Thalu
    map1.addLayer({
        id: 'thalu-zonation-layer',
        type: 'fill',
        source: 'thaluRz',
        layout: {
            'visibility': 'none'
        },
        paint: {
            'fill-color': [
                'match',
                ['get', 'Name'], // Attribute to match
                'Low', '#00990f',     // Green for low risk
                'Medium', '#f0e02e',  // Yellow for medium risk
                'High', '#7d0800',    // Red for high risk
                '#f0e02e'             // Default color (black) if no match
            ],
            'fill-opacity': 0.7
        }

    });

    const ensureLakeSymbologyIcons = function ensureLakeSymbologyIcons() {
        const size = 80;

        const pinCanvas = document.createElement('canvas');
        pinCanvas.width = size;
        pinCanvas.height = size;
        const pinCtx = pinCanvas.getContext('2d');

        // Pin icon (old Vulnerable Lakes 2026 style)
        pinCtx.shadowColor = 'rgba(0,0,0,0.45)';
        pinCtx.shadowBlur = 6;
        pinCtx.shadowOffsetY = 3;
        const cx = size / 2;
        const topY = 4;
        const r = size * 0.32;
        const pinBottom = size - 6;
        pinCtx.beginPath();
        pinCtx.arc(cx, topY + r, r, Math.PI, 0);
        pinCtx.bezierCurveTo(cx + r, topY + r * 2.1, cx + r * 0.5, pinBottom * 0.75, cx, pinBottom);
        pinCtx.bezierCurveTo(cx - r * 0.5, pinBottom * 0.75, cx - r, topY + r * 2.1, cx - r, topY + r);
        pinCtx.closePath();

        const pinGradient = pinCtx.createRadialGradient(cx - r * 0.25, topY + r * 0.6, 1, cx, topY + r, r);
        pinGradient.addColorStop(0, '#ff4444');
        pinGradient.addColorStop(1, '#c0000a');
        pinCtx.fillStyle = pinGradient;
        pinCtx.fill();
        pinCtx.shadowBlur = 0;
        pinCtx.shadowOffsetY = 0;
        pinCtx.strokeStyle = '#7b0000';
        pinCtx.lineWidth = 2;
        pinCtx.stroke();
        pinCtx.beginPath();
        pinCtx.arc(cx, topY + r, r * 0.42, 0, Math.PI * 2);
        pinCtx.fillStyle = 'white';
        pinCtx.fill();

        // Ring icon (Vulnerable Lakes 2025-like style)
        const ringCanvas = document.createElement('canvas');
        ringCanvas.width = size;
        ringCanvas.height = size;
        const ringCtx = ringCanvas.getContext('2d');
        ringCtx.beginPath();
        ringCtx.arc(size / 2, size / 2, size * 0.31, 0, Math.PI * 2);
        ringCtx.strokeStyle = '#ff1f1f';
        ringCtx.lineWidth = 9;
        ringCtx.stroke();

        const pinImage = {
            width: size,
            height: size,
            data: new Uint8Array(pinCtx.getImageData(0, 0, size, size).data)
        };
        const ringImage = {
            width: size,
            height: size,
            data: new Uint8Array(ringCtx.getImageData(0, 0, size, size).data)
        };

        // Purple pin canvas icon for Vulnerable Sites 2025
        const purplePinCanvas = document.createElement('canvas');
        purplePinCanvas.width = size;
        purplePinCanvas.height = size;
        const purplePinCtx = purplePinCanvas.getContext('2d');
        purplePinCtx.shadowColor = 'rgba(0,0,0,0.45)';
        purplePinCtx.shadowBlur = 6;
        purplePinCtx.shadowOffsetY = 3;
        purplePinCtx.beginPath();
        purplePinCtx.arc(cx, topY + r, r, Math.PI, 0);
        purplePinCtx.bezierCurveTo(cx + r, topY + r * 2.1, cx + r * 0.5, pinBottom * 0.75, cx, pinBottom);
        purplePinCtx.bezierCurveTo(cx - r * 0.5, pinBottom * 0.75, cx - r, topY + r * 2.1, cx - r, topY + r);
        purplePinCtx.closePath();

        const purplePinGradient = purplePinCtx.createRadialGradient(cx - r * 0.25, topY + r * 0.6, 1, cx, topY + r, r);
        purplePinGradient.addColorStop(0, '#d279ff');
        purplePinGradient.addColorStop(1, '#aa00ff');
        purplePinCtx.fillStyle = purplePinGradient;
        purplePinCtx.fill();
        purplePinCtx.shadowBlur = 0;
        purplePinCtx.shadowOffsetY = 0;
        purplePinCtx.strokeStyle = '#4a0070';
        purplePinCtx.lineWidth = 2;
        purplePinCtx.stroke();
        purplePinCtx.beginPath();
        purplePinCtx.arc(cx, topY + r, r * 0.42, 0, Math.PI * 2);
        purplePinCtx.fillStyle = 'white';
        purplePinCtx.fill();

        const purplePinImage = {
            width: size,
            height: size,
            data: new Uint8Array(purplePinCtx.getImageData(0, 0, size, size).data)
        };

        // Orange pin icon for 2026 events
        const eventPinCanvas = document.createElement('canvas');
        eventPinCanvas.width = size;
        eventPinCanvas.height = size;
        const eventPinCtx = eventPinCanvas.getContext('2d');
        eventPinCtx.shadowColor = 'rgba(0,0,0,0.45)';
        eventPinCtx.shadowBlur = 6;
        eventPinCtx.shadowOffsetY = 3;
        eventPinCtx.beginPath();
        eventPinCtx.arc(cx, topY + r, r, Math.PI, 0);
        eventPinCtx.bezierCurveTo(cx + r, topY + r * 2.1, cx + r * 0.5, pinBottom * 0.75, cx, pinBottom);
        eventPinCtx.bezierCurveTo(cx - r * 0.5, pinBottom * 0.75, cx - r, topY + r * 2.1, cx - r, topY + r);
        eventPinCtx.closePath();

        const eventPinGradient = eventPinCtx.createRadialGradient(cx - r * 0.25, topY + r * 0.6, 1, cx, topY + r, r);
        eventPinGradient.addColorStop(0, '#ffd166');
        eventPinGradient.addColorStop(1, '#e87500');
        eventPinCtx.fillStyle = eventPinGradient;
        eventPinCtx.fill();
        eventPinCtx.shadowBlur = 0;
        eventPinCtx.shadowOffsetY = 0;
        eventPinCtx.strokeStyle = '#9a4d00';
        eventPinCtx.lineWidth = 2;
        eventPinCtx.stroke();
        eventPinCtx.beginPath();
        eventPinCtx.arc(cx, topY + r, r * 0.42, 0, Math.PI * 2);
        eventPinCtx.fillStyle = 'white';
        eventPinCtx.fill();

        const eventPinImage = {
            width: size,
            height: size,
            data: new Uint8Array(eventPinCtx.getImageData(0, 0, size, size).data)
        };

        if (!map1.hasImage('lake-pin')) map1.addImage('lake-pin', pinImage);
        if (!map1.hasImage('lake-ring')) map1.addImage('lake-ring', ringImage);
        if (!map1.hasImage('lake-pin-purple')) map1.addImage('lake-pin-purple', purplePinImage);
        if (!map1.hasImage('event-pin')) map1.addImage('event-pin', eventPinImage);
    };

    ensureLakeSymbologyIcons();

    //__________________________________________________________________________________________________
    // Vulnerable Sites 2026 — use old Vulnerable Lakes 2026 pin style
    map1.addSource('vul-sites-2026', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALakes_glof_2&outputFormat=application%2Fjson'
    });
    map1.addLayer({
        id: 'vul-sites-2026-layer',
        type: 'symbol',
        source: 'vul-sites-2026',
        layout: {
            'visibility': 'none',
            'icon-image': 'lake-pin',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.24,
                8, 0.42,
                12, 0.58
            ],
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom'
        }
    });
    map1.addLayer({
        id: 'events-2026-marker-layer',
        type: 'symbol',
        source: 'events2026Points',
        layout: {
            'visibility': 'none',
            'icon-image': 'event-pin',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.24,
                8, 0.42,
                12, 0.58
            ],
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom'
        }
    });
    map1.on('click', 'events-2026-marker-layer', function (e) {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const coordinates = feature.geometry.coordinates.slice();
        const properties = feature.properties || {};
        const name = properties.Name || '--';
        const status = properties.Status || '--';

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <strong><u>Name:</u></strong> ${name}<br>
                <strong><u>Status:</u></strong> ${status}
            `)
            .addTo(map1);
    });
    map1.on('mouseenter', 'events-2026-marker-layer', function () {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'events-2026-marker-layer', function () {
        map1.getCanvas().style.cursor = '';
    });

    //__________________________________________________________________________________________________
    // Vulnerable Lakes 2026 — Glacial lake polygons from GeoServer WFS
    map1.addSource('glof-lakes', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3Aglacial_lakes&outputFormat=application%2Fjson'
    });
    map1.addLayer({
        id: 'glof-lakes-fill',
        type: 'fill',
        source: 'glof-lakes',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#0e7ab5', 'fill-opacity': 0.55 }
    });
    map1.addLayer({
        id: 'glof-lakes-outline',
        type: 'line',
        source: 'glof-lakes',
        layout: { 'visibility': 'none' },
        paint: { 'line-color': '#00e5ff', 'line-width': 3, 'line-opacity': 1 }
    });
    // Vulnerable Lakes 2026 — show as ring points like Vulnerable Lakes 2025
    map1.addLayer({
        id: 'glof-lakes-centroid',
        type: 'symbol',
        source: 'glof-lakes',
        layout: {
            'visibility': 'none',
            'icon-image': 'lake-ring',
            'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                4, 0.22,
                8, 0.34,
                12, 0.46
            ],
            'icon-allow-overlap': true,
            'icon-anchor': 'center'
        },
        paint: {
            'icon-opacity': 1
        }
    });

    //__________________________________________________________________________________________________
    // Melting Glaciers — polygon layer
    map1.addLayer({
        id: 'vulnerable-melting-glaciers-layer',
        type: 'fill',
        source: 'vulnerableMeltingGlaciers',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': [
                'match',
                ['get', 'Class'],
                'Very High', '#ef4444',
                'High', '#f97316',
                'Medium', '#eab308',
                'Low', '#22c55e',
                '#94a3b8'
            ],
            'fill-opacity': 0.65
        }
    });
    map1.addLayer({
        id: 'vulnerable-melting-glaciers-outline',
        type: 'line',
        source: 'vulnerableMeltingGlaciers',
        layout: { 'visibility': 'none' },
        paint: {
            'line-color': [
                'match',
                ['get', 'Class'],
                'Very High', '#b91c1c',
                'High', '#c2410c',
                'Medium', '#a16207',
                'Low', '#15803d',
                '#475569'
            ],
            'line-width': 1.5,
            'line-opacity': 0.9
        }
    });

    //__________________________________________________________________________________________________
    // Vulnerable Melting Points — polygon layers
    map1.addLayer({
        id: 'vulnerable-melting-points-layer',
        type: 'fill',
        source: 'vulnerableMeltingPoints',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#ff3d00', 'fill-opacity': 0.60 }
    });
    map1.addLayer({
        id: 'vulnerable-melting-points-outline',
        type: 'line',
        source: 'vulnerableMeltingPoints',
        layout: { 'visibility': 'none' },
        paint: { 'line-color': '#d50000', 'line-width': 2.5, 'line-opacity': 1 }
    });
    // Vulnerable Melting Points — point circle layer
    map1.addLayer({
        id: 'vulnerable-melting-points-circle',
        type: 'circle',
        source: 'vulnerableMeltingPoints',
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#ff3d00',
            'circle-radius': 7,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.85
        }
    });

    //__________________________________________________________________________________________________
    // Chatiboi Lake — polygon from GeoServer WFS
    map1.addSource('chatiboi-lake', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AChatiboi_Lake&maxFeatures=50&outputFormat=application%2Fjson'
    });
    map1.addLayer({
        id: 'chatiboi-lake-fill',
        type: 'fill',
        source: 'chatiboi-lake',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#1e88e5', 'fill-opacity': 0.6 }
    });
    map1.addLayer({
        id: 'chatiboi-lake-outline',
        type: 'line',
        source: 'chatiboi-lake',
        layout: { 'visibility': 'none' },
        paint: { 'line-color': '#90caf9', 'line-width': 2, 'line-opacity': 1 }
    });

    map1.addSource('chatiboi-runoff', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AChatiboi_Run_Off&outputFormat=application%2Fjson'
    });
    map1.addLayer({
        id: 'chatiboi-runoff-layer',
        type: 'line',
        source: 'chatiboi-runoff',
        layout: { 'visibility': 'none' },
        paint: {
            'line-color': '#38bdf8',
            'line-width': 3,
            'line-opacity': 0.95
        }
    });

    map1.addSource('chatiboi-risk-high', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AHigh_Risk_Chatiboi&outputFormat=application%2Fjson'
    });
    map1.addSource('chatiboi-risk-medium', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3AMedium_Risk_Zonation&outputFormat=application%2Fjson'
    });
    map1.addSource('chatiboi-risk-low', {
        type: 'geojson',
        data: CONFIG.GEOSERVER_BASE_URL + '/GLOF/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GLOF%3ALow_Risk_Chatiboi&outputFormat=application%2Fjson'
    });

    map1.addLayer({
        id: 'chatiboi-risk-low-layer',
        type: 'fill',
        source: 'chatiboi-risk-low',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#00990f', 'fill-opacity': 0.7 }
    });
    map1.addLayer({
        id: 'chatiboi-risk-medium-layer',
        type: 'fill',
        source: 'chatiboi-risk-medium',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#f0e02e', 'fill-opacity': 0.7 }
    });
    map1.addLayer({
        id: 'chatiboi-risk-high-layer',
        type: 'fill',
        source: 'chatiboi-risk-high',
        layout: { 'visibility': 'none' },
        paint: { 'fill-color': '#7d0800', 'fill-opacity': 0.7 }
    });

    map1.moveLayer('chatiboi-lake-fill');
    map1.moveLayer('chatiboi-lake-outline');
    map1.moveLayer('chatiboi-runoff-layer');

    //__________________________________________________________________________________________________
    // Land Surface Temperature (LST) — 12 Monthly WMS Raster Layers
    // All 12 layers are added upfront (hidden). Show/hide only; no reload after first fetch.
    const lstMonths = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    for (let month = 1; month <= 12; month++) {
        map1.addSource(`lst-month-${month}`, {
            type: 'raster',
            tiles: [
                `${CONFIG.GEOSERVER_BASE_URL}/LST/wms?service=WMS&version=1.1.0&request=GetMap&layers=LST:LST_Pakistan_2025_Month_${month}&bbox={bbox-epsg-3857}&width=768&height=558&srs=EPSG:3857&styles=&format=image/png&transparent=true`
            ],
            tileSize: 256
        });
        map1.addLayer({
            id: `lst-month-${month}`,
            type: 'raster',
            source: `lst-month-${month}`,
            layout: { 'visibility': 'none' },
            paint: { 'raster-opacity': 1.0 }
        }, 'national-boundary-layer');
    }

    // ==========================================================================
    // GLACIER CONTRIBUTION LAYERS & LABELS INITIALIZATION
    // ==========================================================================

    // Major Dams
    map1.addLayer({
        id: 'glacier-major-dams-layer',
        type: 'circle',
        source: 'glacierMajorDams',
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#e11d48',
            'circle-radius': 6.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.2
        }
    });
    map1.addLayer({
        id: 'glacier-major-dams-label-layer',
        type: 'symbol',
        source: 'glacierMajorDams',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'dam_name'], ['get', 'Dam_Name'], ''],
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.4
        }
    });

    // Minor Dams
    map1.addLayer({
        id: 'glacier-minor-dams-layer',
        type: 'circle',
        source: 'glacierMinorDams',
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#f59e0b',
            'circle-radius': 4.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.0
        }
    });
    map1.addLayer({
        id: 'glacier-minor-dams-label-layer',
        type: 'symbol',
        source: 'glacierMinorDams',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'dam_name'], ['get', 'Dam_Name'], ''],
            'text-size': 12,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-offset': [0, 1.1],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.2
        }
    });

    // Major Rivers
    map1.addLayer({
        id: 'glacier-major-rivers-layer',
        type: 'line',
        source: 'glacierMajorRivers',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#2563eb',
            'line-width': 3.5,
            'line-opacity': 0.85
        }
    });
    map1.addLayer({
        id: 'glacier-major-rivers-label-layer',
        type: 'symbol',
        source: 'glacierMajorRivers',
        layout: {
            'visibility': 'none',
            'symbol-placement': 'line',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'river_name'], ['get', 'River_Name'], ''],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-keep-upright': true
        },
        paint: {
            'text-color': '#93c5fd',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.4
        }
    });

    // Minor Rivers
    map1.addLayer({
        id: 'glacier-minor-rivers-layer',
        type: 'line',
        source: 'glacierMinorRivers',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#60a5fa',
            'line-width': 1.8,
            'line-opacity': 0.75
        }
    });
    map1.addLayer({
        id: 'glacier-minor-rivers-label-layer',
        type: 'symbol',
        source: 'glacierMinorRivers',
        layout: {
            'visibility': 'none',
            'symbol-placement': 'line',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'river_name'], ['get', 'River_Name'], ''],
            'text-size': 12,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-keep-upright': true
        },
        paint: {
            'text-color': '#93c5fd',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.2
        }
    });

    // Watershed
    map1.addLayer({
        id: 'glacier-watershed-layer',
        type: 'fill',
        source: 'glacierWatershed',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': ['coalesce', ['get', 'watershed_color'], '#10b981'],
            'fill-opacity': 0.35
        }
    });
    map1.addLayer({
        id: 'glacier-watershed-outline-layer',
        type: 'line',
        source: 'glacierWatershed',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#1e293b',
            'line-width': 1.5,
            'line-opacity': 0.8
        }
    });
    map1.addLayer({
        id: 'glacier-watershed-label-layer',
        type: 'symbol',
        source: 'glacierWatershed',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'ws_name'], ['get', 'WS_Name'], ''],
            'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.6
        }
    });

    // Glacier Inventory
    map1.addLayer({
        id: 'glacier-inventory-layer',
        type: 'fill',
        source: 'glacierInventory',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': '#00f0ff',
            'fill-opacity': 0.45
        }
    });
    map1.addLayer({
        id: 'glacier-inventory-outline-layer',
        type: 'line',
        source: 'glacierInventory',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#0284c7',
            'line-width': 1.5,
            'line-opacity': 0.85
        }
    });
    map1.addLayer({
        id: 'glacier-inventory-label-layer',
        type: 'symbol',
        source: 'glacierInventory',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'Glac_Name'], ['get', 'glac_name'], ''],
            'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#e0f2fe',
            'text-halo-color': '#0284c7',
            'text-halo-width': 1.5
        }
    });
    // Reserviors
    map1.addLayer({
        id: 'glacier-reserviors-layer',
        type: 'fill',
        source: 'glacierReserviors',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': '#2563eb',
            'fill-opacity': 0.4
        }
    });
    map1.addLayer({
        id: 'glacier-reserviors-outline-layer',
        type: 'line',
        source: 'glacierReserviors',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#1d4ed8',
            'line-width': 1.5,
            'line-opacity': 0.85
        }
    });
    map1.addLayer({
        id: 'glacier-reserviors-label-layer',
        type: 'symbol',
        source: 'glacierReserviors',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'Res_Name'], ['get', 'res_name'], ''],
            'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#1d4ed8',
            'text-halo-width': 1.5
        }
    });

    // Glacier Terminus
    map1.addLayer({
        id: 'glacier-terminus-layer',
        type: 'circle',
        source: 'glacierTerminus',
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#06b6d4',
            'circle-radius': 5.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.2
        }
    });
    map1.addLayer({
        id: 'glacier-terminus-label-layer',
        type: 'symbol',
        source: 'glacierTerminus',
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'Glac_Name'], ['get', 'glac_name'], ''],
            'text-size': 12,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-offset': [0, 1.1],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.2
        }
    });

    // Glacial Basins
    map1.addLayer({
        id: 'glacial-basins-layer',
        type: 'fill',
        source: 'glacialBasins',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': [
                'case',
                ['==', ['to-string', ['get', 'elev_class']], '5000_above'], '#ef4444',
                ['==', ['to-string', ['get', 'elev_class']], '4000_5000'], '#f97316',
                ['==', ['to-string', ['get', 'elev_class']], '3000_4000'], '#eab308',
                ['==', ['to-string', ['get', 'elev_class']], 'below_3000'], '#22c55e',
                '#38bdf8'
            ],
            'fill-opacity': 0.6
        }
    });
    map1.addLayer({
        id: 'glacial-basins-outline-layer',
        type: 'line',
        source: 'glacialBasins',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': [
                'case',
                ['==', ['to-string', ['get', 'elev_class']], '5000_above'], '#991b1b',
                ['==', ['to-string', ['get', 'elev_class']], '4000_5000'], '#9a3412',
                ['==', ['to-string', ['get', 'elev_class']], '3000_4000'], '#854d0e',
                ['==', ['to-string', ['get', 'elev_class']], 'below_3000'], '#166534',
                '#0284c7'
            ],
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                4, 4.5,
                8, 6.0,
                12, 7.5
            ],
            'line-opacity': 1.0
        }
    });
    map1.addLayer({
        id: 'glacial-basins-label-layer',
        type: 'symbol',
        source: 'glacialBasins',
        minzoom: 8,
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'Basin_Name'], ['get', 'basin_name'], ['get', 'Basin_name'], ['get', 'Basin'], ['get', 'basin'], ''],
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0369a1',
            'text-halo-width': 1.5
        }
    });

    // Lakes Inventory 2026
    map1.addLayer({
        id: 'lakes-inventory-2026-layer',
        type: 'fill',
        source: 'lakesInventory2026',
        layout: { 'visibility': 'none' },
        paint: {
            'fill-color': [
                'case',
                ['==', ['to-string', ['get', 'elev_class']], 'Very High'], '#ef4444',
                ['==', ['to-string', ['get', 'elev_class']], '5000_above'], '#ef4444',
                ['==', ['to-string', ['get', 'elev_class']], 'High'], '#f97316',
                ['==', ['to-string', ['get', 'elev_class']], '4000_5000'], '#f97316',
                ['==', ['to-string', ['get', 'elev_class']], 'Medium'], '#eab308',
                ['==', ['to-string', ['get', 'elev_class']], '3000_4000'], '#eab308',
                ['==', ['to-string', ['get', 'elev_class']], 'Low'], '#22c55e',
                ['==', ['to-string', ['get', 'elev_class']], 'below_3000'], '#22c55e',
                '#38bdf8'
            ],
            'fill-opacity': 0.6
        }
    });
    map1.addLayer({
        id: 'lakes-inventory-2026-outline-layer',
        type: 'line',
        source: 'lakesInventory2026',
        layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': [
                'case',
                ['==', ['to-string', ['get', 'elev_class']], 'Very High'], '#991b1b',
                ['==', ['to-string', ['get', 'elev_class']], '5000_above'], '#991b1b',
                ['==', ['to-string', ['get', 'elev_class']], 'High'], '#9a3412',
                ['==', ['to-string', ['get', 'elev_class']], '4000_5000'], '#9a3412',
                ['==', ['to-string', ['get', 'elev_class']], 'Medium'], '#854d0e',
                ['==', ['to-string', ['get', 'elev_class']], '3000_4000'], '#854d0e',
                ['==', ['to-string', ['get', 'elev_class']], 'Low'], '#166534',
                ['==', ['to-string', ['get', 'elev_class']], 'below_3000'], '#166534',
                '#0284c7'
            ],
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                4, 4.5,
                8, 6.0,
                12, 7.5
            ],
            'line-opacity': 1.0
        }
    });
    map1.addLayer({
        id: 'lakes-inventory-2026-label-layer',
        type: 'symbol',
        source: 'lakesInventory2026',
        minzoom: 8,
        layout: {
            'visibility': 'none',
            'text-field': ['coalesce', ['get', 'Name'], ['get', 'name'], ['get', 'NAME'], ['get', 'Basin_Name'], ['get', 'basin_name'], ['get', 'Basin_name'], ['get', 'Basin'], ['get', 'basin'], ''],
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0369a1',
            'text-halo-width': 1.5
        }
    });

    // LULC Raster Layer
    if (!map1.getLayer('lulc-layer')) {
        map1.addLayer({
            id: 'lulc-layer',
            type: 'raster',
            source: 'lulcRaster',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'raster-opacity': 0.85
            }
        });
    }

    // Monsoon Basins Priority 1 and 2 Layers
    if (!map1.getLayer('monsoon-priority-1-layer')) {
        map1.addLayer({
            id: 'monsoon-priority-1-layer',
            type: 'circle',
            source: 'monsoonBasins',
            filter: ['==', ['to-number', ['get', 'Priority']], 1],
            layout: {
                'visibility': 'none'
            },
            paint: {
                'circle-color': '#ef4444',
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1.2
            }
        });
    }

    if (!map1.getLayer('monsoon-priority-2-layer')) {
        map1.addLayer({
            id: 'monsoon-priority-2-layer',
            type: 'circle',
            source: 'monsoonBasins',
            filter: ['==', ['to-number', ['get', 'Priority']], 2],
            layout: {
                'visibility': 'none'
            },
            paint: {
                'circle-color': '#f97316',
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1.2
            }
        });
    }

    // Glacier Basins Points (Batura, Chatiboi, Hisper) — very prominent pulsing markers
    const glacierBasinPoints = [
        { basin: 'Batura', layerId: 'glacier-basin-batura-layer', haloId: 'glacier-basin-batura-halo-layer', labelId: 'glacier-basin-batura-label-layer', color: '#22c55e' },
        { basin: 'Chatiboi', layerId: 'glacier-basin-chatiboi-layer', haloId: 'glacier-basin-chatiboi-halo-layer', labelId: 'glacier-basin-chatiboi-label-layer', color: '#38bdf8' },
        { basin: 'hisper', layerId: 'glacier-basin-hisper-layer', haloId: 'glacier-basin-hisper-halo-layer', labelId: 'glacier-basin-hisper-label-layer', color: '#facc15' }
    ];
    window.glacierBasinHaloLayerIds = glacierBasinPoints.map(cfg => cfg.haloId);
    glacierBasinPoints.forEach(cfg => {
        // Outer pulsing glow halo (animated below, sits beneath the solid dot)
        if (!map1.getLayer(cfg.haloId)) {
            map1.addLayer({
                id: cfg.haloId,
                type: 'circle',
                source: 'glacierBasinsPoints',
                filter: ['==', ['get', 'Basin'], cfg.basin],
                layout: {
                    'visibility': 'none'
                },
                paint: {
                    'circle-color': cfg.color,
                    'circle-radius': 10,
                    'circle-opacity': 0.45,
                    'circle-blur': 0.35
                }
            });
        }
        if (!map1.getLayer(cfg.layerId)) {
            map1.addLayer({
                id: cfg.layerId,
                type: 'circle',
                source: 'glacierBasinsPoints',
                filter: ['==', ['get', 'Basin'], cfg.basin],
                layout: {
                    'visibility': 'none'
                },
                paint: {
                    'circle-color': cfg.color,
                    'circle-radius': 11,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2.5
                }
            });
        }
        if (!map1.getLayer(cfg.labelId)) {
            map1.addLayer({
                id: cfg.labelId,
                type: 'symbol',
                source: 'glacierBasinsPoints',
                filter: ['==', ['get', 'Basin'], cfg.basin],
                layout: {
                    'visibility': 'none',
                    'text-field': ['coalesce', ['get', 'Name'], ''],
                    'text-size': 16,
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 1.6],
                    'text-anchor': 'top'
                },
                paint: {
                    'text-color': '#ffffff',
                    'text-halo-color': '#0f172a',
                    'text-halo-width': 2
                }
            });
        }
    });

    // Animate the halo layers into a continuous pulse to keep the basin points very prominent
    if (!window.glacierBasinPulseStarted) {
        window.glacierBasinPulseStarted = true;
        (function pulseGlacierBasinHalos(timestamp) {
            const period = 1400; // ms per pulse cycle
            const t = (Math.sin((2 * Math.PI * (timestamp || 0)) / period) + 1) / 2; // 0..1
            const radius = 10 + t * 10; // 10 -> 20
            const opacity = 0.55 - t * 0.4; // 0.55 -> 0.15
            (window.glacierBasinHaloLayerIds || []).forEach(id => {
                if (map1.getLayer(id)) {
                    map1.setPaintProperty(id, 'circle-radius', radius);
                    map1.setPaintProperty(id, 'circle-opacity', opacity);
                }
            });
            requestAnimationFrame(pulseGlacierBasinHalos);
        })(0);
    }

    // Glaciers Grid (Glacier Code) Layers
    if (!map1.getLayer('glaciers-grid-fill')) {
        map1.addLayer({
            id: 'glaciers-grid-fill',
            type: 'fill',
            source: 'glaciersGrid',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'fill-color': '#2563eb',
                'fill-opacity': 0.45
            }
        });
    }

    if (!map1.getLayer('glaciers-grid-highlight')) {
        map1.addLayer({
            id: 'glaciers-grid-highlight',
            type: 'line',
            source: 'glaciersGrid',
            filter: ['==', ['coalesce', ['get', 'Code'], ['get', 'code'], ''], ''],
            layout: {
                'visibility': 'none',
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ffff00',
                'line-width': 3.5,
                'line-opacity': 0.95
            }
        });
    }

    if (!map1.getLayer('glaciers-grid-label')) {
        map1.addLayer({
            id: 'glaciers-grid-label',
            type: 'symbol',
            source: 'glaciersGrid',
            layout: {
                'visibility': 'none',
                'text-field': ['coalesce', ['get', 'Code'], ['get', 'code'], ''],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    6, 12,
                    10, 15,
                    14, 18
                ],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': false
            },
            paint: {
                'text-color': '#facc15',
                'text-halo-color': '#0f172a',
                'text-halo-width': 2.0
            }
        });
    }

    // Pakistan Grid Layers (loaded with transparent fill and outline)
    if (!map1.getLayer('pakistan-grid-layer')) {
        map1.addLayer({
            id: 'pakistan-grid-layer',
            type: 'fill',
            source: 'pakistanGrid',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'fill-color': '#000000',
                'fill-opacity': 0
            }
        });
    }

    if (!map1.getLayer('pakistan-grid-outline')) {
        map1.addLayer({
            id: 'pakistan-grid-outline',
            type: 'line',
            source: 'pakistanGrid',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'line-color': '#000000',
                'line-width': 0,
                'line-opacity': 0
            }
        });
    }

    // Glacier Grid 2km Layers
    if (!map1.getLayer('glaciers-grid-2km-fill')) {
        map1.addLayer({
            id: 'glaciers-grid-2km-fill',
            type: 'fill',
            source: 'glaciersGrid2km',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'fill-color': '#2563eb',
                'fill-opacity': 0.45
            }
        });
    }

    if (!map1.getLayer('glaciers-grid-2km-highlight')) {
        map1.addLayer({
            id: 'glaciers-grid-2km-highlight',
            type: 'line',
            source: 'glaciersGrid2km',
            filter: ['==', ['coalesce', ['get', 'Code'], ['get', 'code'], ''], ''],
            layout: {
                'visibility': 'none',
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ffff00',
                'line-width': 3.5,
                'line-opacity': 0.95
            }
        });
    }

    if (!map1.getLayer('glaciers-grid-2km-label')) {
        map1.addLayer({
            id: 'glaciers-grid-2km-label',
            type: 'symbol',
            source: 'glaciersGrid2km',
            layout: {
                'visibility': 'none',
                'text-field': ['coalesce', ['get', 'Code'], ['get', 'code'], ''],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    6, 11,
                    10, 14,
                    14, 17
                ],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': false
            },
            paint: {
                'text-color': '#facc15',
                'text-halo-color': '#0f172a',
                'text-halo-width': 2.0
            }
        });
    }

    if (!map1.getLayer('pakistan-grid-2km-layer')) {
        map1.addLayer({
            id: 'pakistan-grid-2km-layer',
            type: 'fill',
            source: 'pakistanGrid2km',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'fill-color': '#000000',
                'fill-opacity': 0
            }
        });
    }

    if (!map1.getLayer('pakistan-grid-2km-outline')) {
        map1.addLayer({
            id: 'pakistan-grid-2km-outline',
            type: 'line',
            source: 'pakistanGrid2km',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'line-color': '#000000',
                'line-width': 0,
                'line-opacity': 0
            }
        });
    }

    // Setup interactive popups and hover cursor logic
    const setupGlacierLayerPopup = (layerId, title, fieldsMap) => {
        map1.on('click', layerId, (e) => {
            const feature = e && e.features && e.features[0] ? e.features[0] : null;
            if (!feature) return;

            const properties = feature.properties || {};
            const coordinates = e.lngLat;

            let htmlContent = `<strong><u>${title}</u></strong><br>`;
            fieldsMap.forEach((fieldKey) => {
                const label = fieldKey.label;
                const value = properties[fieldKey.key] || properties[fieldKey.key.toLowerCase()] || properties[fieldKey.key.toUpperCase()];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    htmlContent += `<strong>${label}:</strong> ${value}<br>`;
                }
            });

            if (feature.geometry && feature.geometry.type === 'Point') {
                const coords = feature.geometry.coordinates;
                htmlContent += `<strong>Coordinates:</strong> ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
            } else {
                htmlContent += `<strong>Clicked At:</strong> ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(htmlContent)
                .addTo(map1);
        });

        map1.on('mouseenter', layerId, () => {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseleave', layerId, () => {
            map1.getCanvas().style.cursor = '';
        });
    };

    setupGlacierLayerPopup('glacier-major-dams-layer', 'Major Dam', [
        { key: 'Name', label: 'Name' },
        { key: 'District', label: 'District' },
        { key: 'Province', label: 'Province' }
    ]);
    setupGlacierLayerPopup('glacier-minor-dams-layer', 'Minor Dam', [
        { key: 'Name', label: 'Name' },
        { key: 'District', label: 'District' },
        { key: 'Province', label: 'Province' }
    ]);
    setupGlacierLayerPopup('glacier-major-rivers-layer', 'Major River', [
        { key: 'Name', label: 'Name' },
        { key: 'Type', label: 'Type' },
        { key: 'River', label: 'River' }
    ]);
    setupGlacierLayerPopup('glacier-minor-rivers-layer', 'Minor River', [
        { key: 'Name', label: 'Name' },
        { key: 'Type', label: 'Type' },
        { key: 'River', label: 'River' }
    ]);
    setupGlacierLayerPopup('glacier-watershed-layer', 'Watershed', [
        { key: 'Name', label: 'Name' },
        { key: 'Area_sqkm', label: 'Area (sq km)' },
        { key: 'District', label: 'District' }
    ]);
    setupGlacierLayerPopup('glacier-inventory-layer', 'Glacier', [
        { key: 'Name', label: 'Name' },
        { key: 'Area', label: 'Area' },
        { key: 'Class', label: 'Classification' },
        { key: 'Glac_Name', label: 'Glacier Name' }
    ]);
    setupGlacierLayerPopup('glacier-reserviors-layer', 'Reservior', [
        { key: 'Name', label: 'Name' },
        { key: 'Res_Name', label: 'Reservior Name' },
        { key: 'Area', label: 'Area' },
        { key: 'District', label: 'District' }
    ]);
    setupGlacierLayerPopup('glacier-terminus-layer', 'Glacier Terminus', [
        { key: 'Name', label: 'Name' },
        { key: 'Glac_Name', label: 'Glacier Name' },
        { key: 'District', label: 'District' },
        { key: 'Province', label: 'Province' }
    ]);
    setupGlacierLayerPopup('glacier-basin-batura-layer', 'Glacier Basin', [
        { key: 'Name', label: 'Name' }
    ]);
    setupGlacierLayerPopup('glacier-basin-chatiboi-layer', 'Glacier Basin', [
        { key: 'Name', label: 'Name' },
        { key: 'District', label: 'District' },
        { key: 'Elevation_m', label: 'Elevation (m)' },
        { key: 'Area_2025_m2', label: 'Area 2025 (m²)' },
        { key: 'Area_Change_m2', label: 'Area Change (m²)' }
    ]);
    setupGlacierLayerPopup('glacier-basin-hisper-layer', 'Glacier Basin', [
        { key: 'Name', label: 'Name' }
    ]);

    function renderLakesInventoryPopupHtml(title, properties, coordinates) {
        const elevKey = Object.keys(properties).find(k => k.toLowerCase() === 'elevation_' || k.toLowerCase() === 'elevation');
        const elevVal = elevKey ? properties[elevKey] : (properties.elevation_ !== undefined ? properties.elevation_ : properties.elevation);

        const areaKey = Object.keys(properties).find(k => k.toLowerCase() === 'area_m2' || k.toLowerCase() === 'area' || k.toLowerCase() === 'area_sqkm');
        const areaVal = areaKey ? properties[areaKey] : (properties.Area_m2 !== undefined ? properties.Area_m2 : (properties.area_m2 || properties.area_sqkm));

        const classKey = Object.keys(properties).find(k => k.toLowerCase() === 'elev_class' || k.toLowerCase() === 'category');
        const classRaw = classKey ? properties[classKey] : (properties.elev_class !== undefined ? properties.elev_class : properties.Category);

        const volM3Key = Object.keys(properties).find(k => k.toLowerCase() === 'volume_m3' || k.toLowerCase() === 'vol_m3' || k.toLowerCase() === 'volume');
        const volM3Val = volM3Key ? properties[volM3Key] : (properties.Volume_m3 !== undefined ? properties.Volume_m3 : properties.volume_m3);

        const volMafKey = Object.keys(properties).find(k => k.toLowerCase() === 'volume_maf' || k.toLowerCase() === 'vol_maf');
        const volMafVal = volMafKey ? properties[volMafKey] : (properties.Volume_MAF !== undefined ? properties.Volume_MAF : properties.volume_maf);

        const formatDec4 = (val) => {
            if (val === undefined || val === null || String(val).trim() === '') return null;
            const num = parseFloat(val);
            if (isNaN(num)) return String(val);
            return Number.isInteger(num) ? String(num) : num.toFixed(4);
        };

        const cat = getElevationCategory(classRaw, elevVal);
        const catText = cat.label;
        const catBadgeColor = cat.color;

        let htmlContent = `<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; padding: 2px;">
            <strong style="font-size:17px; font-weight:700; color:#38bdf8; border-bottom:1px solid rgba(56,189,248,0.3); display:block; padding-bottom:6px; margin-bottom:10px; letter-spacing:0.4px;">${title}</strong>
            <table style="width:100%; border-collapse:collapse; line-height:1.5;">`;

        const displayElev = formatDec4(elevVal);
        if (displayElev !== null) {
            htmlContent += `<tr>
                <td style="font-weight:600; padding:6px 14px 6px 0; color:#94a3b8; border-bottom:1px dashed rgba(255,255,255,0.1); white-space:nowrap; font-size:14px; text-align:left; vertical-align:middle;">Elevation:</td>
                <td style="padding:6px 0; color:#f8fafc; font-weight:700; border-bottom:1px dashed rgba(255,255,255,0.1); font-size:14px; text-align:right; vertical-align:middle; white-space:nowrap;">${displayElev}</td>
            </tr>`;
        }

        const displayArea = formatDec4(areaVal);
        if (displayArea !== null) {
            htmlContent += `<tr>
                <td style="font-weight:600; padding:6px 14px 6px 0; color:#94a3b8; border-bottom:1px dashed rgba(255,255,255,0.1); white-space:nowrap; font-size:14px; text-align:left; vertical-align:middle;">Area (m<sup>2</sup>):</td>
                <td style="padding:6px 0; color:#f8fafc; font-weight:700; border-bottom:1px dashed rgba(255,255,255,0.1); font-size:14px; text-align:right; vertical-align:middle; white-space:nowrap;">${displayArea}</td>
            </tr>`;
        }

        htmlContent += `<tr>
            <td style="font-weight:600; padding:6px 14px 6px 0; color:#94a3b8; border-bottom:1px dashed rgba(255,255,255,0.1); white-space:nowrap; font-size:14px; text-align:left; vertical-align:middle;">Category:</td>
            <td style="padding:6px 0; border-bottom:1px dashed rgba(255,255,255,0.1); text-align:right; vertical-align:middle; white-space:nowrap;">
                <span style="display:inline-block; padding:4px 10px; border-radius:4px; background-color:${catBadgeColor}; color:#ffffff; font-weight:700; font-size:12px; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.3);">${catText}</span>
            </td>
        </tr>`;

        const displayVolM3 = formatDec4(volM3Val);
        if (displayVolM3 !== null) {
            htmlContent += `<tr>
                <td style="font-weight:600; padding:6px 14px 6px 0; color:#94a3b8; border-bottom:1px dashed rgba(255,255,255,0.1); white-space:nowrap; font-size:14px; text-align:left; vertical-align:middle;">Volume (m<sup>3</sup>):</td>
                <td style="padding:6px 0; color:#f8fafc; font-weight:700; border-bottom:1px dashed rgba(255,255,255,0.1); font-size:14px; text-align:right; vertical-align:middle; white-space:nowrap;">${displayVolM3}</td>
            </tr>`;
        }

        const displayVolMaf = formatDec4(volMafVal);
        if (displayVolMaf !== null) {
            htmlContent += `<tr>
                <td style="font-weight:600; padding:6px 14px 6px 0; color:#94a3b8; border-bottom:1px dashed rgba(255,255,255,0.1); white-space:nowrap; font-size:14px; text-align:left; vertical-align:middle;">Volume (MAF):</td>
                <td style="padding:6px 0; color:#f8fafc; font-weight:700; border-bottom:1px dashed rgba(255,255,255,0.1); font-size:14px; text-align:right; vertical-align:middle; white-space:nowrap;">${displayVolMaf}</td>
            </tr>`;
        }

        htmlContent += `</table>
            <div style="font-size:11px; color:#64748b; margin-top:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; font-weight:500; text-align:center;">
                Clicked At: ${coordinates.lat.toFixed(5)}°N, ${coordinates.lng.toFixed(5)}°E
            </div>
        </div>`;

        return htmlContent;
    }

    map1.on('click', 'glacial-basins-layer', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const htmlContent = renderLakesInventoryPopupHtml('Lakes Inventory 2025', feature.properties || {}, e.lngLat);

        new mapboxgl.Popup({ className: 'glacial-basins-popup' })
            .setLngLat(e.lngLat)
            .setHTML(htmlContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'glacial-basins-layer', () => { map1.getCanvas().style.cursor = 'pointer'; });
    map1.on('mouseleave', 'glacial-basins-layer', () => { map1.getCanvas().style.cursor = ''; });

    map1.on('click', 'lakes-inventory-2026-layer', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const htmlContent = renderLakesInventoryPopupHtml('Lakes Inventory 2026', feature.properties || {}, e.lngLat);

        new mapboxgl.Popup({ className: 'lakes-inventory-2026-popup' })
            .setLngLat(e.lngLat)
            .setHTML(htmlContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'lakes-inventory-2026-layer', () => { map1.getCanvas().style.cursor = 'pointer'; });
    map1.on('mouseleave', 'lakes-inventory-2026-layer', () => { map1.getCanvas().style.cursor = ''; });

    function renderMeltingGlacierPopupHtml(properties, coordinates) {
        const rgiId = properties.RGIId || 'Melting Glacier';
        const rawClass = (properties.Class || properties.class || 'N/A').trim();

        let badgeBg = '#94a3b8';
        const classLower = rawClass.toLowerCase();
        if (classLower === 'very high') {
            badgeBg = '#ef4444';
        } else if (classLower === 'high') {
            badgeBg = '#f97316';
        } else if (classLower === 'medium') {
            badgeBg = '#eab308';
        } else if (classLower === 'low') {
            badgeBg = '#22c55e';
        }

        const formatUpTo3Decimals = (val) => {
            if (val === undefined || val === null || String(val).trim() === '') return 'N/A';
            const num = Number(val);
            if (isNaN(num)) return String(val);
            if (num === 0) return '0';

            const rounded = Math.round(num * 1000) / 1000;
            return (Object.is(rounded, -0) ? 0 : rounded).toString();
        };

        const areaStr = formatUpTo3Decimals(properties.Area_km2 !== undefined ? properties.Area_km2 : properties.area_km2);
        const massStr = formatUpTo3Decimals(properties.mass_gt !== undefined ? properties.mass_gt : properties.Mass_gt);
        const mweStr = formatUpTo3Decimals(properties.mwe !== undefined ? properties.mwe : properties.MWE);

        return `<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; padding: 0; box-sizing: border-box; width: 100%;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(56,189,248,0.3); padding-bottom: 8px; margin-bottom: 10px; padding-right: 22px;">
                <strong style="font-size: 15px; font-weight: 700; color: #38bdf8; letter-spacing: 0.3px;">${rgiId}</strong>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background-color: ${badgeBg}; color: #ffffff; font-weight: 700; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${rawClass}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; line-height: 1.4; table-layout: auto;">
                <tr>
                    <td style="font-weight: 600; padding: 5px 12px 5px 0; color: #94a3b8; border-bottom: 1px dashed rgba(255,255,255,0.1); white-space: nowrap; font-size: 13px; text-align: left; vertical-align: middle;">Class:</td>
                    <td style="padding: 5px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 13px; text-align: right; vertical-align: middle; white-space: nowrap;">
                        <span style="display: inline-block; padding: 1px 7px; border-radius: 3px; background: rgba(255,255,255,0.06); color: ${badgeBg}; font-weight: 700; font-size: 12px; border: 1px solid ${badgeBg};">${rawClass}</span>
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 5px 12px 5px 0; color: #94a3b8; border-bottom: 1px dashed rgba(255,255,255,0.1); white-space: nowrap; font-size: 13px; text-align: left; vertical-align: middle;">Area:</td>
                    <td style="padding: 5px 0; color: #f8fafc; font-weight: 700; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 13px; text-align: right; vertical-align: middle; white-space: nowrap;">${areaStr} km<sup>2</sup></td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 5px 12px 5px 0; color: #94a3b8; border-bottom: 1px dashed rgba(255,255,255,0.1); white-space: nowrap; font-size: 13px; text-align: left; vertical-align: middle;">Mass Change:</td>
                    <td style="padding: 5px 0; color: #f8fafc; font-weight: 700; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 13px; text-align: right; vertical-align: middle; white-space: nowrap;">${massStr} gt / 5 years</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 5px 12px 5px 0; color: #94a3b8; border-bottom: 1px dashed rgba(255,255,255,0.1); white-space: nowrap; font-size: 13px; text-align: left; vertical-align: middle;">Metres Water Equivalent:</td>
                    <td style="padding: 5px 0; color: #f8fafc; font-weight: 700; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 13px; text-align: right; vertical-align: middle; white-space: nowrap;">${mweStr} m / 5 years</td>
                </tr>
            </table>
            ${coordinates ? `
            <div style="font-size: 11px; color: #64748b; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; font-weight: 500; text-align: center;">
                Clicked At: ${coordinates.lat.toFixed(5)}°N, ${coordinates.lng.toFixed(5)}°E
            </div>` : ''}
        </div>`;
    }

    map1.on('click', 'vulnerable-melting-glaciers-layer', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const htmlContent = renderMeltingGlacierPopupHtml(feature.properties || {}, e.lngLat);

        new mapboxgl.Popup({ className: 'melting-glaciers-popup', maxWidth: '380px' })
            .setLngLat(e.lngLat)
            .setHTML(htmlContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'vulnerable-melting-glaciers-layer', () => { map1.getCanvas().style.cursor = 'pointer'; });
    map1.on('mouseleave', 'vulnerable-melting-glaciers-layer', () => { map1.getCanvas().style.cursor = ''; });

    setupGlacierLayerPopup('monsoon-priority-1-layer', 'Monsoon Basin', [
        { key: 'Priority', label: 'Priority' },
        { key: 'ADM2_EN', label: 'District' },
        { key: 'ADM3_EN', label: 'Tehsil' },
        { key: 'Lattitude', label: 'Latitude' },
        { key: 'Longitude', label: 'Longitude' }
    ]);

    setupGlacierLayerPopup('monsoon-priority-2-layer', 'Monsoon Basin', [
        { key: 'Priority', label: 'Priority' },
        { key: 'ADM2_EN', label: 'District' },
        { key: 'ADM3_EN', label: 'Tehsil' },
        { key: 'Lattitude', label: 'Latitude' },
        { key: 'Longitude', label: 'Longitude' }
    ]);

    map1.on('click', 'glaciers-grid-fill', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const properties = feature.properties || {};
        const code = properties.Code || properties.code || 'N/A';
        const areaVal = properties.Area_km2 || properties.area_km2 || 'N/A';
        const area = typeof areaVal === 'number' ? areaVal.toFixed(4) : areaVal;

        // Selection highlight outline
        if (map1.getLayer('glaciers-grid-highlight')) {
            map1.setFilter('glaciers-grid-highlight', ['==', ['coalesce', ['get', 'Code'], ['get', 'code'], ''], code]);
        }

        // Query transparent Pakistan Grid at coordinates
        const pakGridFeatures = map1.queryRenderedFeatures(e.point, {
            layers: ['pakistan-grid-layer']
        });

        let province = 'N/A';
        let district = 'N/A';

        if (pakGridFeatures && pakGridFeatures.length > 0) {
            const pakProps = pakGridFeatures[0].properties || {};
            province = pakProps.Province || pakProps.province || 'N/A';
            district = pakProps.District || pakProps.district || 'N/A';
        }

        // Build popup HTML
        let htmlContent = `<strong><u>Glacier Grid</u></strong><br>`;
        htmlContent += `<strong>Code:</strong> ${code}<br>`;
        if (area !== 'N/A') htmlContent += `<strong>Area (sq km):</strong> ${area}<br>`;
        if (province !== 'N/A') htmlContent += `<strong>Province:</strong> ${province}<br>`;
        if (district !== 'N/A') htmlContent += `<strong>District:</strong> ${district}<br>`;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(htmlContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'glaciers-grid-fill', () => {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'glaciers-grid-fill', () => {
        map1.getCanvas().style.cursor = '';
    });

    map1.on('click', 'glaciers-grid-2km-fill', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const properties = feature.properties || {};
        const code = properties.Code || properties.code || 'N/A';
        const areaVal = properties.Area_km2 || properties.area_km2 || 'N/A';
        const area = typeof areaVal === 'number' ? areaVal.toFixed(4) : areaVal;

        // Selection highlight outline
        if (map1.getLayer('glaciers-grid-2km-highlight')) {
            map1.setFilter('glaciers-grid-2km-highlight', ['==', ['coalesce', ['get', 'Code'], ['get', 'code'], ''], code]);
        }

        // Query transparent Pakistan Grid 2km at coordinates
        const pakGridFeatures = map1.queryRenderedFeatures(e.point, {
            layers: ['pakistan-grid-2km-layer']
        });

        let province = 'N/A';
        let district = 'N/A';

        if (pakGridFeatures && pakGridFeatures.length > 0) {
            const pakProps = pakGridFeatures[0].properties || {};
            province = pakProps.Province || pakProps.province || 'N/A';
            district = pakProps.District || pakProps.district || 'N/A';
        }

        // Build popup HTML
        let htmlContent = `<strong><u>Glacier Grid 2km</u></strong><br>`;
        htmlContent += `<strong>Code:</strong> ${code}<br>`;
        if (area !== 'N/A') htmlContent += `<strong>Area (sq km):</strong> ${area}<br>`;
        if (province !== 'N/A') htmlContent += `<strong>Province:</strong> ${province}<br>`;
        if (district !== 'N/A') htmlContent += `<strong>District:</strong> ${district}<br>`;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(htmlContent)
            .addTo(map1);
    });

    map1.on('mouseenter', 'glaciers-grid-2km-fill', () => {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', 'glaciers-grid-2km-fill', () => {
        map1.getCanvas().style.cursor = '';
    });

    // Ongoing and Future Dams layer additions (Circle Layers)
    if (!map1.getLayer("Future")) {
        map1.addLayer({
            id: "Future",
            type: "circle",
            source: "Future",
            "source-layer": "Fut",
            layout: {
                visibility: "none"
            },
            paint: {
                'circle-color': '#10b981', // Emerald green
                'circle-radius': 6.5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1.2
            }
        });
    }

    if (!map1.getLayer("Ongoing")) {
        map1.addLayer({
            id: "Ongoing",
            type: "circle",
            source: "Ongoing",
            layout: {
                visibility: "none"
            },
            paint: {
                'circle-color': '#0ea5e9', // Sky blue
                'circle-radius': 6.5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1.2
            }
        });
    }

    if (!map1.getLayer("Streams")) {
        map1.addLayer({
            id: "Streams",
            type: "line",
            source: "Streams",
            "source-layer": "Export_Output_4",
            layout: {
                visibility: "none",
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                'line-color': '#0ea5e9',
                'line-width': 1.6
            }
        });
    }

    setupGlacierLayerPopup('Streams', 'Stream', [
        { key: 'Name', label: 'Name' },
        { key: 'Segment_id', label: 'Segment ID' }
    ]);

    // Interactive popups for the dams status layers
    ['Future', 'Ready_for_Construction', 'Ongoing', 'Under_construction'].forEach(layerId => {
        map1.on('click', layerId, function (e) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            const projectNa = properties.Project_Na || properties.project_na || properties.Name || properties.name || 'N/A';
            const statusLabel = layerId.replace(/_/g, ' ');

            let htmlContent = `<strong><u>${statusLabel} Dam</u></strong><br>`;
            htmlContent += `<strong>Project Name:</strong> ${projectNa}<br>`;

            const district = properties.District || properties.district || properties.DISTRICT;
            if (district) htmlContent += `<strong>District:</strong> ${district}<br>`;

            const province = properties.Province || properties.province || properties.PROVINCE;
            if (province) htmlContent += `<strong>Province:</strong> ${province}<br>`;

            const liveStora = properties.Live_Stora || properties.live_stora || properties.LIVE_STORA;
            if (liveStora) htmlContent += `<strong>Live Storage:</strong> ${liveStora}<br>`;

            const grossStor = properties.Gross_Stor || properties.gross_stor || properties.GROSS_STOR;
            if (grossStor) htmlContent += `<strong>Gross Storage:</strong> ${grossStor}<br>`;

            htmlContent += `<strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(htmlContent)
                .addTo(map1);
        });

        map1.on('mouseenter', layerId, () => {
            map1.getCanvas().style.cursor = 'pointer';
        });

        map1.on('mouseleave', layerId, () => {
            map1.getCanvas().style.cursor = '';
        });
    });

    // Keep all risk/zonation fills behind rivers, lakes and other thematic overlays.
    // This runs on each style load, so ordering is preserved after basemap switches too.
    function moveRiskLayersBehindOverlays() {
        const referenceLayerId = 'vulSites';
        if (!map1.getLayer(referenceLayerId)) {
            return;
        }

        const riskLayerIds = map1.getStyle().layers
            .map((layer) => layer.id)
            .filter((id) => id.includes('risk') || id.includes('zonation') || id.includes('-rz-'));

        riskLayerIds.forEach((layerId) => {
            if (layerId !== referenceLayerId && map1.getLayer(layerId)) {
                map1.moveLayer(layerId, referenceLayerId);
            }
        });
    }

    moveRiskLayersBehindOverlays();

});
//____________________________________________________________________________________________________________________________________________________________________________________

map1.on('click', function (e) {
    console.log('Clicked coordinates:', e.lngLat);
});
addPopup('gulmit-buildings-layer', (props) => `
    <strong><u>Buildings</u></strong><br>
    Confidence: ${props.confidence || 'Unknown'}
`);
addPopup('gulmit-schools-layer', (props) => `
    <strong><u>Schools</u></strong><br>
    Name: ${props.Name || 'Unknown'}<br>
    Enrollment: ${props.Enrolmnt || 'Unknown'}<br>
    Teachers: ${props.Teachers || 'Unknown'}`);

const getLakeField = (props, keys, fallback = 'N/A') => {
    for (const key of keys) {
        const value = props?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return value;
        }
    }
    return fallback;
};

const buildGlofLakesPopup = (props) => {
    const district = getLakeField(props, ['District', 'Districts', 'district']);
    const name = getLakeField(props, ['Name', 'Lake_Name', 'name']);
    const elevation = getLakeField(props, ['Elevation', 'Elevation_', 'Elevation_m', 'Elevation (m)', 'elevation']);
    const aspect = getLakeField(props, ['Aspect', 'Aspect_', 'aspect']);
    const slope = getLakeField(props, ['Slope', 'Slope_', 'slope']);
    const riskAreas = getLakeField(props, ['Risk_Areas', 'RiskAreas', 'Risk Areas', 'Areas_at_R', 'Areas_at_Risk', 'Area_at_Risk', 'Areas at Risk']);

    return `
        <strong><u>District:</u></strong> ${district}<br>
        <strong><u>Name:</u></strong> ${name}<br>
        <strong><u>Elevation:</u></strong> ${elevation}<br>
        <strong><u>Aspect:</u></strong> ${aspect}<br>
        <strong><u>Slope:</u></strong> ${slope}<br>
        <strong><u>Risk Areas:</u></strong> ${riskAreas}
    `;
};

addPopup('glof-lakes-fill', buildGlofLakesPopup);
addPopup('glof-lakes-outline', buildGlofLakesPopup);
addPopup('glof-lakes-centroid', buildGlofLakesPopup);

addPopup('vulnerable-melting-points-layer', (props) => `
    <strong><u>Vulnerable Melting Zone</u></strong><br>
    Name: ${props.Name || props.name || props.ZONE || props.zone || 'Melt Point'}
`);
addPopup('vulnerable-melting-points-circle', (props) => `
    <strong><u>Vulnerable Melting Point</u></strong><br>
    Name: ${props.Name || props.name || props.ZONE || props.zone || 'Melt Point'}
`);
