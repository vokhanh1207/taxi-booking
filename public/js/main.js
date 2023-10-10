
//https://developers.google.com/maps/documentation/javascript/examples/place-details
let map = null;
let fromMarker = null;
let toMarker = null;

var directionsService = null;
var directionsRenderer = null;
const searchResult = {};
const currentRide = {};
const currentDriver = {};

let drivers = [
  {
    id: 1,
    lat: 10.795204,
    lng: 106.675553,
  },
  {
    id: 2,
    lat: 10.757768,
    lng: 106.684565,
  },
  {
    id: 3,
    lat: 10.769572,
    lng: 106.612639,
  },
  {
    id: 4,
    lat: 10.787172,
    lng: 106.746827,
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
  if (window.location.href.indexOf("login") > -1) {
    return;
  }
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
    toMarker = new google.maps.Marker();

    fromMarker.setMap(map);

    addDriverMarkers(map, drivers);

    // addjustZoom([...driverMarkers, ...fromMarker]);
    navigator.geolocation.clearWatch(watchID);
  });
}

function searchPlaces(event) {
  var searchValue = $(event.target).val();

  const request = {
    query: searchValue,
    fields: ["name", "formatted_address", "geometry"],
  };

  const service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let resultHtml = "";
      for (var i = 0; i < results.length; i++) {
        searchResult[i] = results[i];
        const address = results[i].formatted_address;
        const long = results[i].geometry.location.lng();
        const lat = results[i].geometry.location.lat();
        console.log("results[i]", results[i])

        resultHtml +=
          `<div class="result-item" location-temp-id=${i} log="${long}" lat="${lat}" onclick="onclickSearch(event)">` +
          address +
          `</div>`;
      }
      const suggestionList = $(event.target)
        .closest(".search-input")
        .find(".search-suggestion-list");
      suggestionList.html(resultHtml);
      suggestionList.show();
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
    if (!markers[i].getPosition()) return;
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

function setRouteOnMap(fromLatLng = '', toLatLng = '') {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  console.log('directionsRenderer', directionsRenderer)
  const startArr = fromLatLng.split(',');
  const endArr = toLatLng.split(',');
  const start = new google.maps.LatLng(
    Number(startArr[0]), 
    Number(startArr[1])
  );
  const end = new google.maps.LatLng(
    Number(endArr[0]),
    Number(endArr[1])
  );
  console.log('start', 
  Number(startArr[0]), 
  Number(startArr[1]))
  console.log('end', end)
  directionsRenderer.setMap(map);

  var request = {
    origin: start,
    destination: end,
    travelMode: "DRIVING",
  };

  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      directionsRenderer.setDirections(result);
    }
  });
}

function onclickSearch(e) {
  const lat = Number($(e.target).attr("lat")) || 10.787172;
  const lng = Number($(e.target).attr("log")) || 106.746827;
  const tempId = $(e.target).attr("location-temp-id");
  const location = searchResult[tempId];

  directionsRenderer.set("directions", null);

  // set value for input
  const searchEl = $(e.target).closest(".search-input");
  searchEl.find("input").val(location.formatted_address);
  $(e.target).closest(".search-suggestion-list").hide();

  const isFrom = searchEl.hasClass("from-location-box");
  const marker = isFrom ? fromMarker : toMarker;

  if (marker) {
    marker.setPosition({ lat, lng });
  }

  marker.setMap(map);

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
      // 4 seat: 14k/km
      // 4 seat VIP: 16k/km
      // 7 seat: 17k/km
      // 7 seat VIP: 19k/km
      const price4Seat = roundedDistance * 14;
      const price4SeatVIP = roundedDistance * 16;
      const price7Seat = roundedDistance * 17;
      const price7SeatVIP = roundedDistance * 19;

      $("#price-4-seat").html(formatCurrency(price4Seat)).closest(".row").attr("data-price", price4Seat);;
      $("#price-4-seat-vip").html(formatCurrency(price4SeatVIP)).closest(".row").attr("data-price", price4SeatVIP);;
      $("#price-7-seat").html(formatCurrency(price7Seat)).closest(".row").attr("data-price", price7Seat);;
      $("#price-7-seat-vip").html(formatCurrency(price7SeatVIP)).closest(".row").attr("data-price", price7SeatVIP);;

      $("#price-section").show();

      clearDriverMarkers();
      directionsRenderer.setDirections(result);
    }
  });
}

function mockPrices() {
  // const distance = result.routes[0].legs[0].distance.value;
  // const roundedDistance = Math.ceil(distance / 1000) * 1000;
  const roundedDistance = 120000;
  // calculate price
  // 4 seat: 14k/km
  // 4 seat VIP: 16k/km
  // 7 seat: 17k/km
  // 7 seat VIP: 19k/km
  const price4Seat = roundedDistance * 14;
  const price4SeatVIP = roundedDistance * 16;
  const price7Seat = roundedDistance * 17;
  const price7SeatVIP = roundedDistance * 19;

  $("#price-4-seat")
    .html(formatCurrency(price4Seat))
    .closest(".row")
    .attr("data-price", price4Seat);
  $("#price-4-seat-vip")
    .html(formatCurrency(price4SeatVIP))
    .closest(".row")
    .attr("data-price", price4SeatVIP);
  $("#price-7-seat")
    .html(formatCurrency(price7Seat))
    .closest(".row")
    .attr("data-price", price7Seat);
  $("#price-7-seat-vip")
    .html(formatCurrency(price7SeatVIP))
    .closest(".row")
    .attr("data-price", price7SeatVIP);

  $("#price-section").show();
}
if ($('.booking-view').length > 0) {
  mockPrices();
}

function selectRide(e) {
  $("#price-section")
    .find(".row")
    .each((index, row) => {
      $(row).removeClass("selected");
    });
  $(e.target).closest(".row").addClass("selected");
}

function bookCar() {
  const selectedRide = $("#price-section").find(".row.selected");
  const body = {
    fromAddress: $("#fromLocation").val(),
    toAddress: $("#toLocation").val(),
    fromLocation: `${fromMarker?.getPosition()?.lat() || 10.787172}, ${
      fromMarker?.getPosition()?.lng() || 106.746827
    }`,
    toLocation: `${toMarker?.getPosition()?.lat() || 10.795204}, ${
      toMarker?.getPosition()?.lng() || 106.675553
    }`,
    amount: selectedRide.attr("data-price"),
    taxiType: selectedRide.attr("data-taxi-type"),
    note: $("#note").val(),
    paymentMethod: $("#payment-radios").find("input:checked").val(),
  };

  fetch(`${window.location.origin}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        // window.location.href = "/booking";
        currentRide.id = res.rideId;
        checkBooking();
      }
    });

  $(".booking-loading").show();
}

function checkBooking() {
  currentRide.checkBookingInterval = setInterval(() => {
    fetch(`${window.location.origin}/book/${currentRide.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.driver) {
          console.log('found a driver');
          $('.booking-loading').hide();
          $('.booking-area').hide();
          $('.riding-area').show();
          clearInterval(currentRide.checkBookingInterval);
        }
      });
  }, 3000);
}

function cancelBooking() {
  fetch(`${window.location.origin}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentRide.id }),
  }).then(() => {
    $(".booking-loading").hide();
    clearInterval(currentRide.checkBookingInterval);
  });
}

function ready(e) {
  e.preventDefault();

  fetch(`${window.location.origin}/driver/ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
  .then((res) => res.json())
  .then((res) => {
      if (res.success) {
        $("#driver-ready-form").hide();
        $('#driver-waiting').show();
        driverCheckBooking();
      }
  });
}

function setDriverRideInfoView () {
  $("#driver-waiting").hide();
  $("#new-ride-found").show();
  $('#ride-from').html(currentDriver.ride.fromAddress);
  $('#ride-to').html(currentDriver.ride.toAddress);
  $('#ride-amount').html(formatCurrency(currentDriver.ride.amount));
  $('#payment-method').html(currentDriver.ride.paymentMethod);
  $('#ride-note').html(currentDriver.ride.note);
}
function driverCheckBooking() {
  currentDriver.checkBookingInterval = setInterval(() => {
    fetch(`${window.location.origin}/driver/checkBooking`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          if (currentDriver.ride?.id === res.ride.id) { return; }
          currentDriver.ride = res.ride;
          setDriverRideInfoView();
          setRouteOnMap(currentDriver.ride.fromLocation, currentDriver.ride.toLocation);
        }
      });
  }, 3000);
}

function driverCancelWaiting() {
  fetch(`${window.location.origin}/driver/cancelWaiting`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
  .then((res) => res.json())
  .then((res) => {
      if (res.success) {
        $("#driver-ready-form").show();
        $('#driver-waiting').hide();
        clearInterval(currentDriver.checkBookingInterval);
      }
  });
}

function driverAcceptRide() {
  fetch(`${window.location.origin}/driver/acceptRide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentDriver.ride.id }),
  })
  .then((res) => res.json())
  .then((res) => {
      if (res.success) {
        clearInterval(currentDriver.checkBookingInterval);
        $("#accept-ride").hide();
        $('#complete-ride').show();
      }
  });
}

function driverCompleteRide() {
  fetch(`${window.location.origin}/driver/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentDriver.ride.id }),
  })
  .then((res) => res.json())
  .then((res) => {
      if (res.success) {
        window.location.href = "/driver/driver-complete";
      }
  });
}