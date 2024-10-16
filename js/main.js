// Reference Webpage
// https://cartographicperspectives.org/index.php/journal/article/view/cp76-donohue-et-al/1307
// Examples https://geography.wisc.edu/cartography/education/G575/G575SP2019.html  Ice Age tree explorer for filter selection
var map;
var dataStats = {};
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [44.589411508231045, -88.98867457355331],
        zoom: 7
    });

    //add OSM base tilelayer
    var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        //attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });;
    Esri_WorldTopoMap.addTo(map)
    //call getData function
    getData(map);
    map.setMaxBounds(map.getBounds());
};

function calcStats(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each campus
    for(var i of data.features){
        //loop through each year
        for(var year = 2013; year < 2024; year+=1){
              //get enrollment for current year
              var value = i.properties[("F"+ String(year))];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;
    console.log(dataStats)
}

//calculate the radius of each proportional symbol

function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 2;
    var maxRadius = 50;  //increasing this means redoing label css
    var minArea = (Math.PI*Math.pow(minRadius,2));
    var maxArea = (Math.PI*Math.pow(maxRadius,2));
    var areaDif = maxArea - minArea

    //interpolated Scaling - Flannery's method does not work for such a large variance of values.
    // I chose the interpolated scale to better symbolize the features
    
    radius = Math.sqrt(minArea + ((attValue - dataStats.min)/(dataStats.max-dataStats.min)*areaDif)/Math.PI)
    
    return radius;
};

//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("F") > -1){
            attributes.push(attribute);
        };
    };
    //console.log(attributes)
    return attributes;
};
//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/UW_Colleges.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
             //calculate minimum data value
             calcStats(json);
             var attributes = processData(json);
             //console.log(attributes)
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            //createfilterControls()
            var attribute = attributes[0].split('F')[1];
            createLegend(dataStats.min, dataStats.max);

        })
};
//function from https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

//Example 1.2 line 1...PopupContent constructor function
function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("F")[1];
    this.enrollment = this.properties[attribute];
    this.formatted = "<p><b>Campus:</b> " + this.properties.NAME + "</p><p><b>Campus Type: </b>" + this.properties.Type + "</p><p><b>Enrollment in " + this.year + ":</b> " + numberWithCommas(this.enrollment) + "</p>";
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //check
    
    //create marker options
    //branding UW Systems - https://www.wisconsin.edu/brand-style-guide/visual-identity/colors/
    var options = {
        fillColor: "#005777",
        color: "#d44427",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var popupContent = new PopupContent(feature.properties, attribute)

    layer.bindPopup(popupContent.formatted)

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data,attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    var featureLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlong){
            return pointToLayer(feature, latlong, attributes);
        }
    }).addTo(map);
    console.log(featureLayer)
    createSearch(featureLayer)
};
//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popupContent = new PopupContent(props, attribute)
            var year = attribute.split("F")[1];
            console.log(year)
            document.querySelector("span.year").innerHTML = year;
            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent.formatted).update();
            
        } else {
            //console.log(attribute)
        }
    });
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'

        },
        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

        //create range input element (slider)
        container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/noun-reverse-3670440.png"></button>'); 
        container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
        container.querySelector(".range-slider").max = 10;
        container.querySelector(".range-slider").min = 0;
        container.querySelector(".range-slider").value = 0;
        container.querySelector(".range-slider").step = 1;
        container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/noun-forward-3670425.png"></button>');
        //disable any mouse event listeners for the container
        L.DomEvent.disableClickPropagation(container);
        
        return container;
        
        }
    });
    map.addControl(new SequenceControl());

    //Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 10 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 10 : index;
            };
            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            updatePropSymbols(attributes[index]);

        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
    //Step 6: get the new index value
    var index = this.value;
    updatePropSymbols(attributes[index]);
    });
};

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = '<h2 class="temporalLegend"><b>Enrollment in <span class="year">2023</span></b></h2>';

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="180px" height="130px">';
            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];
             //Step 2: loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 110- radius
                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#005777" fill-opacity="0.6" stroke="#d44427" cx="65"/>';

                //evenly space labels
                var textY = i * 40 +30;
                
                //text string            
                svg += '<text id="' + circles[i] + '-text" x="125" y="' + textY + '">' + numberWithCommas(Math.round(dataStats[circles[i]],0)) + '</text>';

            };
            //close svg string
            svg+= "</svg>";
            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);
            
            return container;
        }
    });

    map.addControl(new LegendControl());

};

function createSearch(featureLayer){
    var searchControl = new L.Control.Search({
		layer: featureLayer,
		propertyName: 'NAME',
		marker: false,
		moveToLocation: function(latlng, title, map) {
            console.log(map)
			//map.fitBounds( latlng.layer.getBounds() );
			//var zoom = map.getBoundsZoom(layer.latlng.getBounds());
  			map.setView(latlng, 14); // access the zoom
		}
	});

	searchControl.on('search:locationfound', function(e) {
		
		console.log('search:locationfound', );

		//map.removeLayer(this._markerSearch)

		e.layer.setStyle({fillColor: '#3f0', color: '#0f0'});
		if(e.layer._popup)
			e.layer.openPopup();

	}).on('search:collapsed', function(e) {

		featureLayer.eachLayer(function(layer) {	//restore feature color
			featureLayer.resetStyle(layer);
		});	
	});
	
	map.addControl( searchControl );  //inizialize search control

};

document.addEventListener('DOMContentLoaded',createMap)