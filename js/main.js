//function to instantiate the Leaflet map
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
    getData();
    map.setMaxBounds(map.getBounds());
};

function calculateMinValue(data){
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
    var minValue = Math.min(...allValues)
    return minValue;
}

function calculateMaxValue(data){
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
    var maxValue = Math.max(...allValues)
    return maxValue;
}
//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 0;
    var maxRadius = 75;
    var minArea = (Math.PI*Math.pow(minRadius,2));
    var maxArea = (Math.PI*Math.pow(maxRadius,2));
    var areaDif = maxArea - minArea

    //Flannery Apperance Compensation formula
    //var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
    
    //interpolated Scaling - Flannery's method does not work for such a large variance of values.
    // I chose the interpolated scale to better symbolize the features
    radius = Math.sqrt(minArea + ((attValue - minValue)/(maxValue-minValue)*areaDif)/Math.PI)
    
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

    //check result
    //console.log(attributes);

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
             var attributes = processData(json);
             //console.log(attributes)
             minValue = calculateMinValue(json);
             maxValue = calculateMaxValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        });
           
};


//function from https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

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
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>Campus: </b> " + feature.properties.NAME + "</p>";
    popupContent += "<p><b>Campus Type: </b> " + feature.properties.Type + "</p>";
    //add formatted attribute to popup content string
    var year = attribute.split("F")[1];
    popupContent += "<p><b>Enrollment in " + year + ": </b> " + numberWithCommas(feature.properties[attribute]) + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data,attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlong){
            return pointToLayer(feature, latlong, attributes);
        }
    }).addTo(map);
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

            //build popup content string starting with city...Example 2.1 line 24
            var popupContent = "<p><b>Campus: </b> " + layer.feature.properties.NAME + "</p>";
            popupContent += "<p><b>Campus Type: </b> " + layer.feature.properties.Type + "</p>";
            //add formatted attribute to popup content string
            var year = attribute.split("F")[1];

            popupContent += "<p><b>Enrollment in " + year + ": </b> " + numberWithCommas(layer.feature.properties[attribute]) + "</p>";
            
            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        } else {
            //console.log(attribute)
        }
    });
};
//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
    //set slider attributes
    document.querySelector(".range-slider").max = 10;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    //below Example 3.6...add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/noun-reverse-3670440.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/noun-forward-3670425.png'>")
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
            //console.log(attributes[index])
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
    //Step 6: get the new index value
    var index = this.value;
    updatePropSymbols(attributes[index]);
    //console.log(attributes[index])
})

};


document.addEventListener('DOMContentLoaded',createMap)