const debounce = (func, delay) => {
  let debounceTimer;
  return function (event) {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
};

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

function fromTextToLatLng(text) {
  const [lat, lng] = text.split(",");
  return {
    lat: Number(lat),
    lng: Number(lng),
  };
}

class Subject {
    callbacks = [];
    constructor() {}

    subscribe(callback) {
        this.callbacks.push(callback);
    }

    next(data) {
      this.callbacks.forEach((callback) => {
        callback(data);
      });
    }
}