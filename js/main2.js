var map;
function createMap(){
    //create the map
    map = L.map('map', {
        center: [44.589411508231045, -89.87867457355331],
        zoom: 7
    });

    //add OSM base tilelayer
    var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        //attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });;
    Esri_WorldTopoMap.addTo(map)
    //call getData function
    map.setMaxBounds(map.getBounds());
};

$.getJSON('data/UW_Colleges.geojson')    
	.done(function(data) {
		var info = processData(data);
        //console.log(info)
        createPropSymbols(info.timestamps, data);
     	})
.fail(function() { alert('There has been a problem loading the data.')});

function processData(data) {
	var timestamps = [];
	var min = Infinity; 
	var max = -Infinity;
	for (var feature in data.features) {
		var properties = data.features[feature].properties; 
		for (var attribute in properties) { 
			if ( attribute != 'OBJECTID_1' &&
			  attribute != 'NAME' &&
			  attribute != 'LAT' &&
			  attribute != 'LON' &&
              attribute != 'Type') {
					
				if ( $.inArray(attribute,timestamps) === -1) {
					timestamps.push(attribute);		
				}
				if (properties[attribute] < min) {	
					min = properties[attribute];
				}
		
				if (properties[attribute] > max) { 
					max = properties[attribute]; 
				}
			}
		}
	}
	return {
		timestamps : timestamps,
		min : min,
		max : max
    }
}

function createPropSymbols(timestamps, data) {
	campus = L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, { 
        				fillColor: '#708598',
        				color: '#537898',
            			weight: 1, 
            			fillOpacity: 0.6 
            			}).on({
            
            				mouseover: function(e) {
            						this.openPopup();
                					this.setStyle({color: 'yellow'});
                				},
                			mouseout: function(e) {
            						this.closePopup();
            						this.setStyle({color: '#537898'});
            							
            					}
            			    });
        },
    }).addTo(map);
    updatePropSymbols(timestamps[0]);               
};

function updatePropSymbols(timestamp) {
	
	campus.eachLayer(function(layer) {

		var props = layer.feature.properties;
		var radius = calcPropRadius(props[timestamp]);
        //console.log(props[timestamp])
		var popupContent = '<b>' + String(props.NAME) + 
				' </b><br><p><b> Enrollment: ' + props[timestamp]
				' was </b></p>' ;
		layer.setRadius(radius);
		layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });
	});
}

function calcPropRadius(attributeValue) {
    var minRadius = 1;
    var maxRadius = 75;
    var minArea = (Math.PI*Math.pow(minRadius,2));
    var maxArea = (Math.PI*Math.pow(maxRadius,2));
    var areaDif = maxArea - minArea
    //console.log(attributeValue)
    radius = Math.sqrt(minArea + ((attributeValue - Math.min(attributeValue))/(Math.max(attributeValue)-Math.min(attributeValue))*areaDif)/Math.PI)
    //console.log(radius)
    return radius;			
}

document.addEventListener('DOMContentLoaded',createMap)