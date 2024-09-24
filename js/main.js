var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [44.589411508231045, -89.87867457355331],
        zoom: 7
    });

    //add OSM base tilelayer
    var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });;
    Esri_WorldTopoMap.addTo(map)
    //call getData function
    getData();
};

//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/UW_Colleges.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var geojsonMarkerOptions = {
            radius: 10,
            fillColor: "red",
            color: 'red',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8};
            
            var data = L.geoJson(json, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature(feature,layer){
                     //no property named popupContent; instead, create html string with all properties
                    var popupContent = "";
                    if (feature.properties) {
                        //loop to add feature property names and values to html string
                        for (var property in feature.properties){
                            if (property == 'OBJECTID_1'){
                               //do nothing
                            } else {
                            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
                        }}
                        layer.bindPopup(popupContent);
                    };
                }
            })
            return data.addTo(map)
        })
};


document.addEventListener('DOMContentLoaded',createMap)