// Wettervorhersage Beispiel

// Hintergrundlayer Satellitenbild
let startLayer = L.tileLayer.provider("Esri.WorldImagery")

// Blick auf Innsbruck
const map = L.map("map", {
    center: [47.267222, 11.392778],
    zoom: 5,
    layers: [
        startLayer
    ]
});

// Overlays für Wind- und Wettervorhersage
const overlays = {
    "wind": L.featureGroup().addTo(map),
    "weather": L.featureGroup().addTo(map),
};

// Layer control mit Satellitenbild
const layerControl = L.control.layers({
    "Satellitenbild": startLayer
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false
}).addTo(map);

//Datum Formatieren 
let formatDate = function(date) {
    return date.toLocaleDateString("de-AT",{
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }) + " Uhr";
}

// Windvorhersage
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();

    let forecastDate = new Date(jsondata[0].header.refTime)
    forecastDate.setHours(forecastDate.getHours + jsondata[0].header.forecastTime)
    let forecastLabel = formatDate(forecastDate)

    layerControl.addOverlay(overlays.wind, `ECMWF Windvorhersage für ${forecastLabel}`)
    L.velocityLayer({
        data: jsondata,
        lineWidth:2,
        displayOptions: {
            velocityType: "",
            directionString: "Windrichtung",
            speedString: "Windgeschwindigkeit",
            speedUnit: "k/h",
            emptyString: "keine Daten vorhanden",
            position: "bottomright"
        }
    }).addTo(overlays.wind)
};
loadWind("https://geographie.uibk.ac.at/webmapping/ecmwf/data/wind-10u-10v-europe.json");

layerControl.addOverlay(overlays.weather, "Wettervorhersage met.no")

    let marker = L.circleMarker([
        47.267222,
        11.392778
    ]).bindPopup("Wettervorhersage").addTo(overlays.weather)

// Wettervorhersage
async function loadWeather(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    
    marker.setLatLng([
        jsondata.geometry.coordinates[1],
        jsondata.geometry.coordinates[0],
    ])

    let details= jsondata.properties.timeseries[0].data.instant.details;

    let forecastDate = new Date(jsondata.properties.timeseries[0].time)
    let forecastLabel = formatDate(forecastDate)
    
    let popup= `
        <strong>Wettervorhersage für ${forecastLabel}</strong>
        <ul>
        <li>Luftdruck ${details.air_pressure_at_sealevel} (hPa)</li>
        <li>Lufttemperatur ${details.air_tempreture} (°C)</li>
        <li>Wolkenbedeckung ${details.cloud_area_fraction} (%)</li>
        <li>Niederschlag ${details.precipitation_amount} (mm)</li>
        <li>Luftfeuchte ${details.relative_humidity} (%)</li>
        </ul>
    `
    let symbol = jsondata.properties.timeseries[0].data.next_1_hours.summary.symbol_code
    popup+= `<img src="icons/${symbol}.svg" alt="${symbol}" style="width:32px">`
    marker.setPopupContent(popup).openPopup()
    
};
loadWeather("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");

map.on("click", function(evt){
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`
    loadWeather(url)
})