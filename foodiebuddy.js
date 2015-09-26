/** foodiebuddy.js **/

var mapBoundSWLatLng;
var mapBoundNELatLng;
var map;
var markers = [];

/* Function which initializes the map and adds a listener to the 
map to get its bounds when its changed */
function initMap() {
    var mapOptions = {
        center: new google.maps.LatLng(32.75, -97.13), // Default map position
        zoom: 16 // Initial zoom level
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var infoWindow = new google.maps.InfoWindow({
        map: map
    });

    // Get current client location and center map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Your location.');
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
    google.maps.event.addListener(map, "bounds_changed", function() {
        getMapBounds();
    }); // Getting the new bounds when the map position is changed
}

/* Function which is called when the browser does not allow/support geolocation. 
It sets the infowindow to the default map center */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

/* Function which extracts the south-west and north-east latlong from the map bounds */
function getMapBounds() {
    var mapbounds = map.getBounds();
    mapBoundSWLatLng = ((mapbounds.getSouthWest()).toString()).substring(1, 38);
    mapBoundNELatLng = ((mapbounds.getNorthEast()).toString()).substring(1, 38);
}

/* Function which accepts a request URI, builds an XML http request, 
sends the request and handles the response by calling the response handler */
function sendXhr(requestURI, responseHandler) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", requestURI);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onreadystatechange = responseHandler;
    xhr.send(null);
}

/* Function which gets the user entered search query, builds a request URI
along with the lat long points and calls the sendXhr method. It also calls
the deleteMarkers() function */
function sendRequestToSearchRestaurant() {
    // Deleting old markers before sending a new search request
    deleteMarkers();
    searchTerm = encodeURI(document.getElementById("search").value);
    var requestURI = "proxy.php?term=" + searchTerm + "&bounds=" + mapBoundSWLatLng + "|" + mapBoundNELatLng + "&limit=10";
    sendXhr(requestURI, processResponseToRestaurantSearch);
}

/* Function which processes and displays the results of the restaurant search */
function processResponseToRestaurantSearch() {
    var html = "";
    if (this.readyState == 4) {
        var json = JSON.parse(this.responseText);
        try {
            if (json.businesses.length != 0) {
                for (var idx = 0; idx < json.businesses.length; idx++) {
                    var restaurantName = json.businesses[idx].name;
                    var restaurantImage = json.businesses[idx].image_url;
                    var restaurantRating = json.businesses[idx].rating_img_url;
                    var yelpUrl = json.businesses[idx].url;
                    var reviewText = json.businesses[idx].snippet_text;
					var reviewCount = json.businesses[idx].review_count;
                    var small_address = (json.businesses[idx]["location"].address).toString();
                    var city = json.businesses[idx]["location"].city;
                    var state = json.businesses[idx]["location"].state_code;
                    var pin = json.businesses[idx]["location"].postal_code;
                    var full_address = small_address + ", " + city + ", " + state + " " + pin;
                    geoCode(full_address, restaurantName, idx);
                    html += "<table><tr><td rowspan='3'><img class='restaurant' src='" + restaurantImage + "' alt='No Image'></td><td><a href='" + yelpUrl + "'>" + (idx + 1) + ") " + restaurantName + "</a></td></tr><tr><td><img src='" + restaurantRating + "'> "+ reviewCount +" reviews</td></tr><tr><td>Recommended review: <br>	" + reviewText + "</td></tr></table><br>";
                }
                html = "Results for " + searchTerm + " in this location... <br><br>" + html;
            } else {
                html = "No results for " + searchTerm;
            }
        } catch (err) {
            html = "No information for " + searchTerm + " in this location";
        }
    } else {
        html = "Server not responding! Try again later";
    }
    document.getElementById("output").innerHTML = html;
}

/* Function which class the clearMarkers() function and it re-initializes
the markers array */
function deleteMarkers() {
    clearMarkers();
    markers = [];
}

/* Function which Removes the markers from the map, but keeps them in the array. */
function clearMarkers() {
    setAllMap(null);
}

/* Function which sets the map on all markers in the array. */
function setAllMap(map) {
    for (var idx = 0; idx < markers.length; idx++) {
        markers[idx].setMap(map);
    }
}

/* Function to geocode the postal address and add a marker on the map */
function geoCode(full_address, restaurantName, idx) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': full_address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var p = results[0].geometry.location;
            var marker = new google.maps.Marker({
                map: map,
                position: p,
                icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld=' + (idx + 1) + '|F33636|000000',
                title: restaurantName + " | " + full_address
            });
            markers.push(marker);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

/* Function which takes an event as input and triggers the 
search button click if it is the enter key (13) */
function searchKeyPress(e) {
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13) {
        document.getElementById('btnSearch').click();
        return false;
    }
    return true;
}
