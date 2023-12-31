//https://developers.google.com/maps/documentation/javascript/examples/place-details
let user = beUser || null;
let map = null;

var directionsService = null;
var directionsRenderer = null;
const searchResult = {};
const currentRide = {
  ride: null,
};
const currentDriver = {
  ride: null,
};
const currentUser = {
  lat: null,
  lng: null,
};
const bookingInfo = {
  distance: 0,
  fromMarker: null,
  toMarker: null,
};

let driverMarkers = [];
const onMapReady = new Subject();

// check ongoing ride for normal users
if (user && !user.car_id && !user.admin) {
  userCheckOnload();
}
if (user && user.car_id) {
  driverCheckOnLoad();
}

function driverCheckOnLoad() {
  fetch(`${window.location.origin}/driver/currentRide`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        if (!res.ride && user.status == "READY") {
          $("#driver-ready-form").hide();
          $("#driver-waiting").show();
          driverCheckBooking();
        }

        if (res.ride) {
          onMapReady.subscribe(() => {
            setRouteOnMap(
              {
                lat: res.ride.from_address_lat,
                lng: res.ride.from_address_lng,
              },
              {
                lat: res.ride.to_address_lat,
                lng: res.ride.to_address_lng,
              }
            );
          });
        }

        if (res.ride && res.ride.status === "PICKING") {
          $(".ride-from").text(res.ride.from_address);
          $("#driver-picking #customer-name").text(res.ride.name);
          $("#driver-picking #customer-phone").text(res.ride.phone);
          $("#driver-ready-form").hide();
          $("#driver-picking").show();
        }

        if (res.ride && res.ride.status === "RIDING") {
          $("#driver-ready-form").hide();
          $("#driver-riding").show();
        }

        currentDriver.ride = res.ride;
      }
    });
}

function addDriverMarkers(map, drivers = []) {
  try {
    drivers.forEach((driver) => {
      const marker = makeMarker(driver, "Driver");
      marker.setMap(map);
      driverMarkers.push(marker);
    });
  } catch (error) {
    console.log("error", error);
  }
}

function makeMarker(
  position = {
    lat: 0,
    lng: 0,
  },
  title,
  icon = `${window.location.origin}/images/car-icon.png`
) {
  return new google.maps.Marker({
    position,
    icon,
    map,
    title,
  });
}

function clearDriverMarkers() {
  driverMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  driverMarkers = [];
}

function clearFromToMarkers() {
  bookingInfo.fromMarker?.setMap(null);
  bookingInfo.toMarker?.setMap(null);
}

function initMap() {
  if (window.location.href.indexOf("login") > -1) {
    return;
  }
  directionsRenderer = new google.maps.DirectionsRenderer();
  const watchID = navigator.geolocation.watchPosition((position) => {
    currentUser.lat = position.coords.latitude;
    currentUser.lng = position.coords.longitude;
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: { lat: position.coords.latitude, lng: position.coords.longitude },
    });

    onMapReady.next();

    bookingInfo.fromMarker = new google.maps.Marker({
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
    });
    bookingInfo.toMarker = new google.maps.Marker();

    bookingInfo.fromMarker.setMap(map);

    getDrivers();

    // addjustZoom([...driverMarkers, ...fromMarker]);
    navigator.geolocation.clearWatch(watchID);
  });
}

function getDrivers() {
  fetch(`${window.location.origin}/user/getDrivers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        const drivers = res.drivers.map((driver) => {
          return {
            lat: driver.current_lat,
            lng: driver.current_lng,
          };
        });

        clearDriverMarkers();
        addDriverMarkers(map, drivers);
      }
    });
}

function searchPlaces(event) {
  var searchValue = $(event.target).val();

  const request = {
    query: searchValue,
    fields: ["name", "formatted_address", "geometry"],
    locationBias: {
      radius: 6000,
      center: { lat: currentUser.lat, lng: currentUser.lng },
    },
  };

  const service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, function (results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
      // backup plan for demo purpose
      results = [
        {
          formatted_address:
            "103 Nguyễn Thị Minh Khai, phường 6, Quận 3, Thành phố Hồ Chí Minh, Việt Nam",
          geometry: {
            location: {
              lat: () => 10.787172,
              lng: () => 106.746827,
            },
          },
        },
        {
          formatted_address:
            "233 Điện Biên Phủ, phường 6, Quận 3, Thành phố Hồ Chí Minh, Việt Nam",
          geometry: {
            location: {
              lat: () => 10.787088,
              lng: () => 106.698402,
            },
          },
        },
      ];
    }
    // if (status === google.maps.places.PlacesServiceStatus.OK) {
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
    const suggestionList = $(event.target)
      .closest(".search-input")
      .find(".search-suggestion-list");
    suggestionList.html(resultHtml);
    suggestionList.show();
    // }
  });
}

const debounceSearchPlaces = debounce(searchPlaces, 500);

window.initMap = initMap;

function userCheckOnload() {
  fetch(`${window.location.origin}/user/ongoingRide`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        // check if user has an ongoing ride
        if (res.user.isAdmin === true) {
          return;
        }

        if (res.ride) {
          $("#fromLocation").val(res.ride.from_address);
          $("#toLocation").val(res.ride.to_address);
          onMapReady.subscribe(() => {
            setRouteOnMap(
              {
                lat: res.ride.from_address_lat,
                lng: res.ride.from_address_lng,
              },
              {
                lat: res.ride.to_address_lat,
                lng: res.ride.to_address_lng,
              }
            );
          });
          checkBooking(res.ride.id);
        }
      }
    });
}

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

const setRouteOnMap = (fromLatLng, toLatLng, options = {}) => {
  try {
    clearRouteOnMap();
    const localMap = map || window.map;
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer(options);

    // const startLocation = fromTextToLatLng(fromLatLng);
    // const endLocation = fromTextToLatLng(toLatLng);
    const start = new google.maps.LatLng(fromLatLng.lat, fromLatLng.lng);
    const end = new google.maps.LatLng(toLatLng.lat, toLatLng.lng);

    directionsRenderer.setMap(localMap);

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
  } catch (error) {
    console.log("error", error);
  }
};

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
  const marker = isFrom ? bookingInfo.fromMarker : bookingInfo.toMarker;

  if (marker) {
    marker.setPosition({ lat, lng });
  }

  marker.setMap(map);

  addjustZoom([bookingInfo.fromMarker, bookingInfo.toMarker]);
}

function checkPrice(e) {
  e.preventDefault();

  directionsService = new google.maps.DirectionsService();

  const start = bookingInfo.fromMarker.getPosition();
  const end = bookingInfo.toMarker.getPosition();
  directionsRenderer.setMap(map);

  var request = {
    origin: start,
    destination: end,
    travelMode: "DRIVING",
  };

  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      $("#fromLocation").val(result.routes[0].legs[0].start_address);
      const distance = result.routes[0].legs[0].distance.value;
      bookingInfo.distance = distance;

      // calculate price
      // 4 seat: 14k/km
      // 4 seat VIP: 16k/km
      // 7 seat: 17k/km
      // 7 seat VIP: 19k/km
      const price4Seat = Math.ceil((distance * 14) / 1000) * 1000;
      const price4SeatVIP = Math.ceil((distance * 16) / 1000) * 1000;
      const price7Seat = Math.ceil((distance * 17) / 1000) * 1000;
      const price7SeatVIP = Math.ceil((distance * 19) / 1000) * 1000;

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

      clearDriverMarkers();
      clearFromToMarkers();
      directionsRenderer.setDirections(result);
    }
    // backup plan for demo purpose
    else {
      $("#fromLocation").val('103 Nguyễn Thị Minh Khai, phường 6, Quận 3, Thành phố Hồ Chí Minh, Việt Nam');
      const distance = 6460;
      bookingInfo.distance = distance;
      const roundedDistance = Math.ceil(distance / 1000);

      // calculate price
      // 4 seat: 14k/km
      // 4 seat VIP: 16k/km
      // 7 seat: 17k/km
      // 7 seat VIP: 19k/km
      const price4Seat = roundedDistance * 14000;
      const price4SeatVIP = roundedDistance * 16000;
      const price7Seat = roundedDistance * 17000;
      const price7SeatVIP = roundedDistance * 19000;

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

      clearDriverMarkers();
      clearFromToMarkers();
      directionsRenderer.setDirections(result);
    }
  });
}

function mockPrices() {
  // const distance = result.routes[0].legs[0].distance.value;
  // const roundedDistance = Math.ceil(distance / 1000) * 1000;
  const roundedDistance = 5;
  // calculate price
  // 4 seat: 14k/km
  // 4 seat VIP: 16k/km
  // 7 seat: 17k/km
  // 7 seat VIP: 19k/km
  const price4Seat = roundedDistance * 14000;
  const price4SeatVIP = roundedDistance * 16000;
  const price7Seat = roundedDistance * 17000;
  const price7SeatVIP = roundedDistance * 19000;

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
if ($(".booking-view").length > 0) {
  // mockPrices();
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
    from_address_lat: bookingInfo.fromMarker?.getPosition()?.lat() || 10.713502,
    from_address_lng:
      bookingInfo.fromMarker?.getPosition()?.lng() || 106.610019,
    to_address_lat: bookingInfo.toMarker?.getPosition()?.lat() || 10.787088,
    to_address_lng: bookingInfo.toMarker?.getPosition()?.lng() || 106.698402,
    from_address:
      $("#fromLocation").val() ||
      "103 Nguyễn Thị Minh Khai, phường 6, Quận 3, Thành phố Hồ Chí Minh, Việt Nam",
    to_address:
      $("#toLocation").val() ||
      "233 Điện Biên Phủ, phường 6, Quận 3, Thành phố Hồ Chí Minh, Việt Nam",

    note: $("#note").val(),
    amount: selectedRide.attr("data-price"),
    distance: bookingInfo.distance,
    carType: selectedRide.attr("data-taxi-type"),
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
        currentRide.ride = res.ride;
        const rideId = res.ride.id;
        if (user?.isAdmin) {
          $(".admin-last-booking-id").text(rideId);
          $(".admin-booking-success").fadeIn();
          $(".price-section").hide();
          setTimeout(() => {
            $(".admin-booking-success").fadeOut();
          }, 4000);
          clearFromToMarkers();
          return;
        }

        checkBooking(rideId);
        $(".booking-loading").show();
      }
    });
}

function userCheckRide() {
  fetch(`${window.location.origin}/checkRide/${currentRide.ride.id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success && res.driver && res.ride?.status == "PICKING") {
      }
    });
}

function checkBooking(id) {
  getBooking(id);
  currentRide.checkBookingInterval = setInterval(() => {
    getBooking(id);
  }, 3000);
}

function getBooking(id) {
  fetch(`${window.location.origin}/book/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (
        res.ride?.status == currentRide.ride?.status &&
        res.ride?.id == currentRide.ride?.id &&
        res.ride?.driverId == currentRide.ride?.driverId
      ) {
        return;
      }

      currentRide.ride = res.ride;

      if (res.success && res.driver && res.ride?.status == "PICKING") {
        console.log("found a driver");
        $(".booking-loading").hide();
        $(".booking-area").hide();
        $(".found-driver").show();

        $("#driver-name").html(`${res.driver.name}`);
        $("#driver-phone").html(res.driver.phone);

        if (res.car) {
          $("#car-model").html(res.car.name);
          $("#car-number").html(res.car.licensePlate);
        }

        $(".ride-from").html(res.ride.fromAddress);
        $("#ride-to").html(res.ride.toAddress);
        $("#ride-amount").html(formatCurrency(res.ride.amount));
        $("#ride-payment-method").html(res.ride.paymentMethod);
        $("#ride-note").html(res.ride.note);

        currentRide.driver = res.driver;
        currentRide.ride = res.ride;

        if (!currentRide.driver.currentLocation) {
          return;
        }

        const driverLatLng = {
          lat: currentRide.driver.current_lat,
          lng: currentRide.driver.current_lng,
        };
        clearRouteOnMap();
        setRouteOnMap(
          driverLatLng,
          {
            lat: currentRide.ride.from_address_lat,
            lng: currentRide.ride.from_address_lng,
          },
          { suppressMarkers: true }
        );

        addDriverMarkers(map, [driverLatLng]);
      }

      if (res.success && res.ride?.status == "RIDING") {
        $(".booking-area").hide();
        $(".found-driver").hide();
        $(".user-riding").show();
        setRouteOnMap(
          {
            lat: currentRide.ride.from_address_lat,
            lng: currentRide.ride.from_address_lng,
          },
          {
            lat: currentRide.ride.to_address_lat,
            lng: currentRide.ride.to_address_lng,
          }
        );
      }

      if (res.success && res.ride?.status == "COMPLETED") {
        $(".user-riding").hide();
        $(".user-complete").show();
        clearRouteOnMap();
        clearInterval(currentRide.checkBookingInterval);
      }

      if (res.success && res.ride?.status == "CANCELED") {
        $(".found-driver").hide();
        $(".booking-area").show();
        $(".booking-loading").show();
        setRouteOnMap(
          {
            lat: currentUser.ride.from_address_lat,
            lng: currentUser.ride.from_address_lng,
          },
          {
            lat: currentUser.ride.to_address_lat,
            lng: currentUser.ride.to_address_lng,
          }
        );
      }

      if (res.success && res.ride?.status == "FINDING") {
        if (user?.isAdmin) {
          return;
        }
        $(".booking-loading").show();
        $(".booking-area").show();
        $(".found-driver").hide();
        $("#fromLocation").val(res.ride.from_address);
        $("#toLocation").val(res.ride.to_address);
      }
    });
}
function cancelBooking() {
  console.log("cancelBooking", currentRide.ride.id);
  fetch(`${window.location.origin}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentRide.ride.id }),
  }).then(() => {
    $(".booking-loading").hide();
    $("#fromLocation").val();
    $("#toLocation").val();
    clearRouteOnMap();
    clearInterval(currentRide.checkBookingInterval);
  });
}

function driverSkipRide() {
  clearInterval(currentDriver.rideAcceptInterval);

  fetch(`${window.location.origin}/driver/skipRide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentDriver.ride.id }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        driverCheckBooking();
      }
    });
}
function ready(e) {
  e.preventDefault();

  const watchID = navigator.geolocation.watchPosition((location) => {
    fetch(`${window.location.origin}/driver/ready`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_lat: location.coords.latitude,
        current_lng: location.coords.longitude,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          $("#driver-ready-form").hide();
          $("#driver-waiting").show();
          driverCheckBooking();
        }
      });

    navigator.geolocation.clearWatch(watchID);
  });
}

function openFoundRideModel() {
  // $("#driver-waiting").hide();
  clearInterval(currentDriver.checkBookingInterval);
  $(".ride-from").html(currentDriver.ride.from_address);
  $("#ride-to").html(currentDriver.ride.to_address);
  $("#ride-distance").html(
    Math.ceil(currentDriver.ride.distance / 100) / 10 + " KM"
  );
  $("#ride-amount").html(formatCurrency(currentDriver.ride.amount));
  $("#payment-method").html(currentDriver.ride.paymentMethod);
  $("#ride-note").html(currentDriver.ride.note);

  const newRideModal = new bootstrap.Modal("#new-ride-found", {});
  newRideModal.show();

  let countdown = 14;
  currentDriver.rideAcceptInterval = setInterval(function () {
    $("#countdown-number").text(countdown);
    if (countdown === 0) {
      newRideModal.hide();
      // send a request to server to cancel ride
      driverSkipRide();
      clearInterval(currentDriver.rideAcceptInterval);
    }

    countdown = --countdown;
  }, 1000);
}
function driverCheckBooking() {
  fetchDriverCheckBooking();
  currentDriver.checkBookingInterval = setInterval(() => {
    fetchDriverCheckBooking();
  }, 3000);
}

function fetchDriverCheckBooking() {
  fetch(`${window.location.origin}/driver/checkBooking`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        if (currentDriver.ride?.id === res.ride.id) {
          return;
        }
        currentDriver.ride = res.ride;
        openFoundRideModel();
      }
    });
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
        currentDriver.ride = null;
        $("#driver-ready-form").show();
        $("#driver-waiting").hide();
        clearInterval(currentDriver.checkBookingInterval);
      }
    });
}

function driverCancelRide() {
  fetch(`${window.location.origin}/driver/cancelRide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentDriver.ride.id }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        $("#driver-ready-form").show();
        $("#driver-picking").hide();
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
        const driverLatLng = {
          lat: user.current_lat,
          lng: user.current_lng,
        };

        clearDriverMarkers();
        clearFromToMarkers();
        clearInterval(currentDriver.checkBookingInterval);
        clearInterval(currentDriver.rideAcceptInterval);
        setRouteOnMap(driverLatLng, {
          lat: currentDriver.ride.from_address_lat,
          lng: currentDriver.ride.from_address_lng,
        });
        addDriverMarkers(map, [driverLatLng]);
        $("#driver-waiting").hide();
        $("#driver-picking #customer-name").text(currentDriver.ride.name);
        $("#driver-picking #customer-phone").text(currentDriver.ride.phone);
        $("#driver-picking").show();
      }
    });
}

function driverConfirmPicking() {
  fetch(`${window.location.origin}/driver/confirmPicking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rideId: currentDriver.ride.id }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        $("#driver-picking").hide();
        $("#driver-riding").show();

        clearDriverMarkers();
        clearFromToMarkers();
        setRouteOnMap(
          {
            lat: currentDriver.ride.from_address_lat,
            lng: currentDriver.ride.from_address_lng,
          },
          {
            lat: currentDriver.ride.to_address_lat,
            lng: currentDriver.ride.to_address_lng,
          },
          { suppressMarkers: true }
        );
        addDriverMarkers(map, [
          {
            lat: currentDriver.ride.from_address_lat,
            lng: currentDriver.ride.from_address_lng,
          },
        ]);
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
        $("#driver-riding").hide();
        $("#driver-complete").show();
        $("#complete-amount").text(formatCurrency(currentDriver.ride.amount));

        clearRouteOnMap();
      }
    });
}

function clearRouteOnMap() {
  try {
    directionsRenderer.set("directions", null);
  } catch (error) {
    console.log("error", error);
  }
}
function driverCompleteRideAndBack() {
  driverCheckBooking();
  $("#driver-waiting").show();
  $("#driver-complete").hide();

  clearRouteOnMap();
  currentDriver.ride = null;
}

function showPageLoading() {
  $(".page-loading").show();
}

function hidePageLoading() {
  $(".page-loading").hide();
}