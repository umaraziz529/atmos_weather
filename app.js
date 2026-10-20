const $ = id => document.getElementById(id);

const WEATHER = "https://api.open-meteo.com/v1/forecast";
const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";

const codes = {
  0: ["Clear sky", "☀"],
  1: ["Mainly clear", "🌤"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁"],
  45: ["Fog", "🌫"],
  48: ["Fog", "🌫"],
  51: ["Drizzle", "🌦"],
  53: ["Drizzle", "🌦"],
  55: ["Heavy drizzle", "🌧"],
  61: ["Slight rain", "🌦"],
  63: ["Rain", "🌧"],
  65: ["Heavy rain", "🌧"],
  71: ["Snow", "🌨"],
  73: ["Snow", "🌨"],
  75: ["Heavy snow", "❄"],
  80: ["Showers", "🌦"],
  81: ["Showers", "🌧"],
  82: ["Heavy showers", "⛈"],
  95: ["Thunderstorm", "⛈"],
  96: ["Thunderstorm with hail", "⛈"],
  99: ["Thunderstorm with hail", "⛈"]
};

const cond = code => codes[code] || ["Weather conditions", "🌡"];
const status = message => {
  $("status").textContent = message;
};

async function geocode(name) {
  const url = new URL(GEOCODE);
  url.search = new URLSearchParams({
    name,
    count: "1",
    language: "en",
    format: "json"
  });

  const response = await fetch(url);
  if (!response.ok) throw Error("City search failed.");

  const data = await response.json();
  if (!data.results?.length) throw Error("No matching city found.");

  const place = data.results[0];

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    region: place.admin1 || "",
    country: place.country || ""
  };
}

async function weather(place) {
  status("Loading forecast…");

  const url = new URL(WEATHER);
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
    timezone: "auto",
    forecast_days: "7"
  });

  const response = await fetch(url);
  if (!response.ok) throw Error("Weather service unavailable.");

  const data = await response.json();
  const current = data.current;
  const [description, icon] = cond(current.weather_code);

  $("place-name").textContent = [
    place.name,
    place.region,
    place.country
  ].filter(Boolean).join(", ");

  $("current-description").textContent = description;
  $("temperature").textContent = Math.round(current.temperature_2m);
  $("feels-like").textContent =
    `Feels like ${Math.round(current.apparent_temperature)}°C`;

  $("humidity").textContent = `${current.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("uv").textContent = data.daily.uv_index_max[0];
  $("weather-symbol").textContent = icon;

  // Hourly forecast
  const hourlyList = $("hourly-list");
  hourlyList.replaceChildren();

  let start = data.hourly.time.findIndex(time => time >= current.time);
  if (start < 0) start = 0;

  for (
    let i = start;
    i < Math.min(start + 12, data.hourly.time.length);
    i += 2
  ) {
    const [desc, weatherIcon] = cond(data.hourly.weather_code[i]);
    const item = document.createElement("div");
    item.className = "hour-item";

    const time = document.createElement("div");
    time.className = "time";
    time.textContent = new Date(data.hourly.time[i])
      .toLocaleTimeString([], { hour: "numeric" });

    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = weatherIcon;

    const temperature = document.createElement("strong");
    temperature.textContent =
      `${Math.round(data.hourly.temperature_2m[i])}°`;

    const description = document.createElement("div");
    description.className = "time";
    description.textContent = desc;

    item.append(time, symbol, temperature, description);
    hourlyList.append(item);
  }

  // Seven-day forecast
  const dailyList = $("daily-list");
  dailyList.replaceChildren();

  data.daily.time.forEach((day, i) => {
    const [desc, weatherIcon] = cond(data.daily.weather_code[i]);
    const item = document.createElement("div");
    item.className = "day-item";

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = i === 0
      ? "Today"
      : new Date(day + "T12:00:00").toLocaleDateString([], {
          weekday: "long"
        });

    const description = document.createElement("div");
    description.className = "muted";
    description.textContent = desc;

    details.append(name, description);

    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = weatherIcon;

    const range = document.createElement("div");
    range.className = "range";
    range.append(
      document.createTextNode(
        `${Math.round(data.daily.temperature_2m_max[i])}° `
      )
    );

    const low = document.createElement("span");
    low.className = "low";
    low.textContent = `${Math.round(data.daily.temperature_2m_min[i])}°`;

    range.append(low);
    item.append(details, symbol, range);
    dailyList.append(item);
  });

  $("weather-panel").classList.remove("hidden");
  status(`Forecast updated for ${place.name}.`);
}

// Search for a city
$("search-form").addEventListener("submit", async event => {
  event.preventDefault();

  const city = $("city-input").value.trim();
  if (!city) {
    status("Enter a city name.");
    return;
  }

  try {
    await weather(await geocode(city));
  } catch (error) {
    status(error.message || "Could not load weather.");
  }
});

// Detect location and fetch weather without saving coordinates
$("locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    status("Location is not supported by this browser.");
    return;
  }

  status("Requesting browser location…");

  navigator.geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;

      try {
        await weather({
          latitude,
          longitude,
          name: "Your location"
        });
      } catch (error) {
        status(error.message || "Could not load weather.");
      }
    },
    error => {
      status(
        error.code === 1
          ? "Location permission denied. Search for a city instead."
          : "Could not get location. Search for a city instead."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
});

// Load Islamabad weather when the website opens
weather({
  latitude: 33.6844,
  longitude: 73.0479,
  name: "Islamabad",
  region: "Islamabad Capital Territory",
  country: "Pakistan"
}).catch(() => status("Search for a city to get started."));
