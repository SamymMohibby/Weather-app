function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
async function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Fetch city name based on latitude and longitude
    const cityName = await getCityName(lat, lon);

    // Fetch weather data for the user's current location
    fetchOneCallWeather(lat, lon, cityName);
}


function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

window.onload = getLocation;

async function getCityName(lat, lon) {
    const apiKey = 'e18e840785e3e41375da52ea2446649a';  
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.name;  
    } catch (error) {
        console.error("Error fetching city name:", error);
        return "Unknown Location";  
    }
}



function displayWeatherData(data, cityName) {
    const weatherDetails = document.getElementById('weatherDetails');

    // Extract temp
    let currentTemp = data.current.temp;
    let feelsLike = data.current.feels_like;

    // Convert to k
    if (selectedUnit === 'kelvin') {
        currentTemp = currentTemp;
        feelsLike = feelsLike;
    }

   
    const unitSymbol = selectedUnit === 'metric' ? '°C' : selectedUnit === 'imperial' ? '°F' : 'K';

    // Display the temperature and other details, with the city name etc. https://www.youtube.com/watch?v=krUdJ87uxXc&t=2195s a good guide for this part. It seemed challenging for me.
    weatherDetails.innerHTML = `
    <div id="currentWeather">
        <h2>${cityName}</h2> <!-- Display the city name instead of timezone -->
        <div class="temperature-container">
            <img src="${getCustomIcon(data.current.weather[0].main)}" alt="${data.current.weather[0].main} icon" class="weather-icon">
            <span class="temperature">${currentTemp.toFixed(2)}</span><span class="unit">${unitSymbol}</span>
        </div>
        <p class="weather-description">${data.current.weather[0].main}</p>
        <p>Feels like: ${feelsLike.toFixed(2)}${unitSymbol}</p>
        <div class="weather-stats-container">
            <div class="weather-stat">
                <img src="assets/windspeed.png" alt="Wind speed icon" class="stat-icon">
                <p>${data.current.wind_speed} m/s</p>
            </div>
            <div class="weather-stat">
                <img src="assets/humidity.png" alt="Humidity icon" class="stat-icon">
                <p>${data.current.humidity}%</p>
            </div>
        </div>
    </div>
    `;
}


document.getElementById('searchBtn').addEventListener('click', function() {
    const location = document.getElementById('locationInput').value;
    if (location) {
        fetchWeatherByLocation(location);
    } else {
        alert('Please enter a location');
    }
});

function fetchWeatherByLocation(location) {
    const apiKey = 'e18e840785e3e41375da52ea2446649a';  
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                const cityName = data.name;

                fetchOneCallWeather(lat, lon, cityName); 
            } else {
                alert('Location not found. Please try again.');
            }
        })
        .catch(error => console.log("Error fetching weather data:", error));
}


function fetchOneCallWeather(lat, lon, cityName) {
    const apiKey = 'e18e840785e3e41375da52ea2446649a';  
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${selectedUnit}`;

    //this part is for dusplaying the hourly and 7day forecast
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayWeatherData(data, cityName);  
            displayHourlyForecast(data.hourly);  
            displaySevenDayForecast(data.daily);  
            updateBackgroundBasedOnWeather(data);
        })
        .catch(error => console.log("Error fetching One Call weather data:", error));
}

//custom icons from assets folder, credit to: https://www.flaticon.com/free-icons/weather 
function getCustomIcon(weatherCondition) {
    const weatherIcons = {
        'Clear': 'assets/sunny.png',
        'Clouds': 'assets/cloudy.png',
        'Rain': 'assets/rainy.png',
        'Drizzle': 'assets/drizzle.png',
        'Thunderstorm': 'assets/thunderstorm.png',
        'Snow': 'assets/snowy.png',
        'Mist': 'assets/mist.png',
    };

    return weatherIcons[weatherCondition] || 'assets/default.png'; //It ddefaults back to default png(openweathermap) icons
}

function fetchHourlyForecast(lat, lon) {
    const apiKey = 'e18e840785e3e41375da52ea2446649a'; 
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => displayHourlyForecast(data.hourly))
        .catch(error => console.log("Error fetching hourly forecast:", error));
}


function displayHourlyForecast(hourlyData) {
    const weatherDetails = document.getElementById('weatherDetails');
    let forecastHTML = '<h3>Next 24 Hours</h3>';
    forecastHTML += '<div class="hourly-forecast-container">'; 
    const tempUnit = selectedUnit === 'metric' ? '°C' : selectedUnit === 'imperial' ? '°F' : 'K';    
    hourlyData.slice(0, 24).forEach(hour => {
        const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = hour.temp;

        const weatherCondition = hour.weather[0].main;
        
        
        const customIconUrl = getCustomIcon(weatherCondition);

        forecastHTML += `
            <div class="hourly-forecast">
                <p>${time}</p>
                <img src="${customIconUrl}" alt="${weatherCondition} icon">
                <p>${temp}${tempUnit}</p> <!-- Add the unit symbol here -->
            </div>
        `;
    });

    forecastHTML += '</div>'; 

    weatherDetails.innerHTML += forecastHTML; 
}


function displaySevenDayForecast(dailyData) {
    const weatherDetails = document.getElementById('weatherDetails');
    let forecastHTML = '<h3>7-Day Forecast</h3>';
    forecastHTML += '<div class="seven-day-forecast-container">'; 
    
    const tempUnit = selectedUnit === 'metric' ? '°C' : selectedUnit === 'imperial' ? '°F' : 'K';    
    dailyData.slice(0, 7).forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString();
        const maxTemp = day.temp.max;
        const minTemp = day.temp.min;

        // Get the custom icon based on weather condition
        const weatherCondition = day.weather[0].main;
        const customIconUrl = getCustomIcon(weatherCondition); 

        forecastHTML += `
            <div class="daily-forecast">
                <p>${date}</p>
                <img src="${customIconUrl}" alt="${weatherCondition} icon">
                <p>Max: ${maxTemp}${tempUnit}</p> <!-- Add the unit symbol here -->
                <p>Min: ${minTemp}${tempUnit}</p> <!-- Add the unit symbol here -->
            </div>
        `;
    });

    forecastHTML += '</div>'; 

    weatherDetails.innerHTML += forecastHTML;
}
let selectedUnit = 'metric'; // Default is celsius

document.getElementById('unitCelsius').addEventListener('click', function() {
    selectedUnit = 'metric';
    // fetch it with celisus
    reFetchWeather();
});

document.getElementById('unitFahrenheit').addEventListener('click', function() {
    selectedUnit = 'imperial';
    // fetclh with Fahrenheit
    reFetchWeather();
});

document.getElementById('unitKelvin').addEventListener('click', function() {
    selectedUnit = 'kelvin';
    reFetchWeather();
});

function reFetchWeather() {
    const location = document.getElementById('locationInput').value;

    if (location) {
        fetchWeatherByLocation(location); // Refetch weather for searched city
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError); // Refetch for current location
    }
}



function updateBackgroundBasedOnWeather(data) {
    const currentTemp = data.current.temp;  // Ttemp in c or F
    const body = document.body;

    //chatgpt guidede me through this part, it said to use certain thresholds for different weather conditions etc.
    let coldThreshold, hotThreshold;

    if (selectedUnit === 'metric') {
        coldThreshold = 10;  // 10°C for cold
        hotThreshold = 25;   // 25°C for hot
    } else if (selectedUnit === 'imperial') {
        coldThreshold = 50;  // 50°F for cold
        hotThreshold = 77;   // 77°F for hot
    }


    if (currentTemp < coldThreshold) {
        body.style.backgroundColor = '#4a90e2';  // Blueish for cold
    } else if (currentTemp > hotThreshold) {
        body.style.backgroundColor = '#ff6347';  // Reddish for hot
    } else {
        body.style.backgroundColor = '#f4a460';  // Sandy color for moderate
    }
    //used https://imagecolorpicker.com/ for color pickers

}

const favouritesList = document.getElementById('favouritesList');
const saveFavouriteBtn = document.getElementById('saveFavouriteBtn');

let favourites = JSON.parse(localStorage.getItem('favourites')) || [];

function displayFavourites() {
    favouritesList.innerHTML = ''; 
    favourites.forEach((favourite, index) => {
        const li = document.createElement('li');
        
        const a = document.createElement('a');
        a.href = "#";  
        a.textContent = favourite;
        a.addEventListener('click', (e) => {
            e.preventDefault();  
            fetchWeatherByLocation(favourite);  
        });

      
        const removeBtn = document.createElement('button');
        removeBtn.textContent = "Remove";
        removeBtn.style.marginLeft = "10px";
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();  
            removeFavourite(index); 
        });

        li.appendChild(a);  
        li.appendChild(removeBtn);  
        favouritesList.appendChild(li);  
    });
}



saveFavouriteBtn.addEventListener('click', function() {
    const location = document.getElementById('locationInput').value;
    if (location && !favourites.includes(location)) {
        favourites.push(location);
        localStorage.setItem('favourites', JSON.stringify(favourites));
        displayFavourites();
        
    }
});

function removeFavourite(index) {
    favourites.splice(index, 1); 
    localStorage.setItem('favourites', JSON.stringify(favourites));  
    displayFavourites();  
}

window.onload = function() {
    getLocation();
    displayFavourites(); 
};
