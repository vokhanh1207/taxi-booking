const GOOGLE_MAPS_API_KEY = "AIzaSyDt9k62SpyxIG3mVjFpTA50DNdWvgfaz5I";

//https://developers.google.com/maps/documentation/javascript/examples/place-details
let map = null;
let fromMarker = null;
let toMarker = null;

var directionsService = null;
var directionsRenderer = null;
const searchResult = {};

let drivers = [
  {
    id: 1,
    lat: 10.184558,
    lng: 106.154833,
  },
  {
    id: 2,
    lat: 10.176248,
    lng: 106.160628,
  },
  {
    id: 3,
    lat: 10.180003,
    lng: 106.152498,
  },
  {
    id: 4,
    lat: 10.181692,
    lng: 106.159368,
  },
];

let driverMarkers = [];
function formatCurrency(total) {
  var neg = false;
  if (total < 0) {
    neg = true;
    total = Math.abs(total);
  }
  return (
    parseFloat(total, 10)
      .toFixed(1)
      .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")
      .toString() + " VNĐ"
  );
}

function addDriverMarkers(map, drivers = []) {
  drivers.forEach((driver) => {
    const marker = new google.maps.Marker({
      position: {
        lat: driver.lat,
        lng: driver.lng,
      },
      icon: "https://img.icons8.com/color/48/000000/car.png",
    });

    marker.setMap(map);
    driverMarkers.push(marker);
  });
}

function clearDriverMarkers() {
  driverMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  driverMarkers = [];
}

function initMap() {
  directionsRenderer = new google.maps.DirectionsRenderer();
  const watchID = navigator.geolocation.watchPosition((position) => {
    console.log("position", position);
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: { lat: position.coords.latitude, lng: position.coords.longitude },
    });

    fromMarker = new google.maps.Marker({
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
    });

    fromMarker.setMap(map);

    addDriverMarkers(map, drivers);

    addjustZoom(driverMarkers);
    navigator.geolocation.clearWatch(watchID);
  });
}

function searchPlaces(event) {
  var searchValue = $(event.target).val();

  const request = {
    query: searchValue,
    fields: ["name", "formatted_address", "geometry"],
  };

  var service = new google.maps.places.PlacesService(map);

  service.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let resultHtml = "";
      for (var i = 0; i < results.length; i++) {
        searchResult[i] = results[i];
        const address = results[i].formatted_address;
        const long = results[i].geometry.location.lng();
        const lat = results[i].geometry.location.lat();

        resultHtml +=
          `<div class="result-item" location-temp-id=${i} log="${long}" lat="${lat}" onclick="onclickSearch(event)">` +
          address +
          `</div>`;
      }

      document.getElementById("search-suggestion-list").innerHTML = resultHtml;
    }
  });
}

const debounce = (func, delay) => {
  let debounceTimer;
  return function (event) {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
};

const debounceSearchPlaces = debounce(searchPlaces, 500);

window.initMap = initMap;

function addjustZoom(markers = []) {
  var bounds = new google.maps.LatLngBounds();
  for (i = 0; i < markers.length; i++) {
    bounds.extend(markers[i].getPosition());
  }

  //center the map to a specific spot (city)
  // map.setCenter(center);

  //center the map to the geometric center of all markers
  map.setCenter(bounds.getCenter());

  map.fitBounds(bounds);

  //remove one zoom level to ensure no marker is on the edge.
  map.setZoom(map.getZoom());

  // set a minimum zoom
  // if you got only 1 marker or all markers are on the same address map will be zoomed too much.
  if (map.getZoom() > 15) {
    map.setZoom(15);
  }

  //Alternatively this code can be used to set the zoom for just 1 marker and to skip redrawing.
  //Note that this will not cover the case if you have 2 markers on the same address.
  if (markers.length == 1) {
    map.setMaxZoom(15);
    map.fitBounds(bounds);
    map.setMaxZoom(Null);
  }
}

function onclickSearch(e) {
  console.log($(e.target).attr("lat"));

  const lat = Number($(e.target).attr("lat"));
  const lng = Number($(e.target).attr("log"));
  const tempId = $(e.target).attr("location-temp-id");
  const location = searchResult[tempId];

  directionsRenderer.set("directions", null);

  // set value for input
  $("#toLocation").val(location.formatted_address);
  $("#search-suggestion-list").html("");

  if (toMarker) {
    toMarker.setPosition({ lat, lng });
  } else {
    toMarker = new google.maps.Marker({
      position: { lat, lng },
    });
  }

  toMarker.setMap(map);

  addjustZoom([fromMarker, toMarker]);
}

function checkPrice(e) {
  e.preventDefault();

  directionsService = new google.maps.DirectionsService();

  const start = fromMarker.getPosition();
  const end = toMarker.getPosition();
  directionsRenderer.setMap(map);

  var request = {
    origin: start,
    destination: end,
    travelMode: "DRIVING",
  };

  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      const distance = result.routes[0].legs[0].distance.value;
      const roundedDistance = Math.ceil(distance / 1000) * 1000;

      // calculate price
      // 4 seat: 12k/km
      // 4 seat VIP: 14k/km
      // 7 seat: 15k/km
      // 7 seat VIP: 17k/km
      const price4Seat = roundedDistance * 12;
      const price4SeatVIP = roundedDistance * 14;
      const price7Seat = roundedDistance * 15;
      const price7SeatVIP = roundedDistance * 17;

      $("#price-4-seat").html(formatCurrency(price4Seat));
      $("#price-4-seat-vip").html(formatCurrency(price4SeatVIP));
      $("#price-7-seat").html(formatCurrency(price7Seat));
      $("#price-7-seat-vip").html(formatCurrency(price7SeatVIP));

      $("#price-section").show();

      clearDriverMarkers();
      directionsRenderer.setDirections(result);
    }
  });
}

function bookCar(type) {
  $(".booking-loading").show();
}

function cancelBooking() {
  $(".booking-loading").hide();
}
