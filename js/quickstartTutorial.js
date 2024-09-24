//Sets the initial map and defaults the center and zoom threshhold
var map = L.map('map').setView([51.505, -0.09], 13);
//loads a tile layer and sets the maxium zoom level, adds source information
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
//creates a point marker that is able to be clicked, adds to map
var marker = L.marker([51.5, -0.09]).addTo(map);
//creates a circle graphic and various property information
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
//creates a polygon graphic with lat/long of points
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);
//the following add a popup to each graphic and defines its text
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");
//creates a popup that is independant of any object
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    //opens when map opens, like a splsh screen almost
    .openOn(map);
    var popup = L.popup();
    //allows user to click on any point of the map and returns coordinates
    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
    }
    
    map.on('click', onMapClick);