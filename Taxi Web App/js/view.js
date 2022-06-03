/*
 * Purpose : Provide the necessary javascript for the HTML file "view.html"
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 18th of May 2021
*/

"use strict";

const MAPBOX_TOKEN = "pk.eyJ1IjoidGVhbTAzOCIsImEiOiJja25xMzluaDIwN3BuMnZtdmRpdzQyemowIn0.61SXSonaGzHAkWZfBDEPww" // token for mapbox api
const DEFAULT_ADDRESS = [145.2265143113404, -37.86932655978508]; // random address to set as default
const DEFAULT_ZOOM = 14; // appropriate default zoom level
const PAN_ZOOM = 17; // zooming to a selected location
const ROUTES_LOAD = 5000; // ms to load the routes so that map is already loaded

mapboxgl.accessToken = MAPBOX_TOKEN;
let map = new mapboxgl.Map({
    container: 'map',
    center: DEFAULT_ADDRESS, // starting in random spot
    zoom: DEFAULT_ZOOM, // default zoom
    style: 'mapbox://styles/mapbox/streets-v9'
});
map.addControl(new mapboxgl.NavigationControl(), "top-left"); // adds zooming buttons

// This function runs when the page loads to show all relvant informated
window.onload = function () {
    let bookingOfInterest = bookingArray[getLocalStorageData(BOOKING_NUMBER)];

    setTimeout(() => { displayMap(bookingOfInterest) }, ROUTES_LOAD); // function to display the map
    displayView(bookingOfInterest); // function here to display info from booking

    document.getElementById("changeTaxi").addEventListener("click", revealOptions);
    document.getElementById("changeOptions").addEventListener("change", revealConfirm);
    document.getElementById("confirmChange").addEventListener("click", changeTaxiType); // adding functionality to buttons

    liveClock();
    setInterval(liveClock, 1000); // displaying the clock and setting interval for 1s
}

// This function is used to display the information of the booking to the user
// It takes data as a parameter and has no return value
function displayView(data) {
    let viewDetails = document.getElementById("viewDetails");
    let routes = data.tripDetails.routes;
    // relevant data is stored
    let locations = [];
    for (let i = 0; i < routes.length; i++) {
        if (i === routes.length - 1) {
            locations.push(routes[i].formattedStart);
            locations.push(routes[i].formattedEnd);
        }
        else {
            locations.push(routes[i].formattedStart);
        } // adding all individual locations so that they can be displayed
    }
    let locationOutput = "";
    for (let i = 0; i < locations.length; i++) {
        locationOutput += `<i class="material-icons" style="color:grey;">local_taxi</i> ${locations[i]} <br>`;
    } // each location is added to the output
    let bookingDetails = "";
    bookingDetails += ` 
           <h5 style="text-align:center;">Booking Details</h5>
           <div id="userName" style="padding: 5px;">
               <label for="userName"><b>Date/Time:</b> ${reformatDate(data.time)}</label>
           </div>
           <div id="taxiData" style="padding: 5px;">
               <label for="taxiData">
                    <b>Taxi Type :</b> ${data.taxiData.type}
                    <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" id="changeTaxi">Change</button>
                    <select id="changeOptions" style="visibility: hidden;">
                        <option value="empty"></option>
                        <option value="Sedan">Sedan</option>
                        <option value="Van">Van</option>
                        <option value="SUV">SUV</option>
                        <option value="Minibus">Minibus</option>
                    </select>       
                    <span id="errorMessage" style="color: red; font-size: small;"></span> 
                    <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--accent" id="confirmChange" style="visibility: hidden;">
                        <i class="material-icons">done</i>
                    </button>
                    <br> 
                    <b>Rego :</b> ${data.taxiData.rego}
               </label>
           </div>
           <div id="routeSummary" style="padding: 5px;">
               <label for="routeSummary"><b>Route Summary</b></label>
               <br>
               <div id="routeSummarySpan" style="overflow-y: scroll; height: 150px;">${locationOutput}</div>
           </div>
           <div id="stops" style="padding: 5px;">
               <label for="stops"><b>Number of Stops:</b> ${data.numberOfStops}</label>
           </div>
           <div id="distance" style="padding: 5px;">
               <label for="distance"><b>Distance:</b> ${(data.tripDetails.totalDistance).toFixed(2)}km </label>
           </div>
           <div id="fare" style="padding: 5px;">
               <label for="fare"><b>Fare:</b> $${data.cost.toFixed(2)}</label>
           </div>
           <div id="duration" style="padding: 5px;">
               <label for="duration"><b>Duration:</b> ${data.duration}mins</label>
           </div>`; // showing all relevant information
    if (getLocalStorageData(PAST_OR_FUTURE) === FUTURE_NUMBER) {
        bookingDetails += `
            <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" id=cancelBooking
                onclick="cancelBooking()">Cancel Booking 
            </button>
            <br>`; // only if the booking is in the future can the user have an option to cancel the booking
    }
    viewDetails.innerHTML = bookingDetails; // all info is appended
}

// This function is used to display the routes on the map to the user
// It needs the booking as a parameter
function displayMap(booking) {
    clearInterval(loadingInterval);
    document.getElementById("loadingText").innerText = "";
    let routes = booking.tripDetails.routes; // gets all routes stored in the trip
    let locations = [];
    for (let i = 0; i < routes.length; i++) {
        if (i === routes.length - 1) {
            locations.push(routes[i].startAddress);
            locations.push(routes[i].endAddress);
        }
        else {
            locations.push(routes[i].startAddress);
        } // adding all individual locations so that they can be marked
    }
    map.addLayer({  // adding the line layer
        id: "route",
        type: "line",
        source: {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: locations } }
        },
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#888", "line-width": 6 }
    });
    for (let i = 0; i < locations.length; i++) {
        new mapboxgl.Marker().setLngLat(locations[i]).addTo(map); // adding a marker for each location
    }
    let firtLocationLat = locations[0][0];
    let firstLocationLng = locations[0][1];
    map.panTo([firtLocationLat, firstLocationLng]); // have the first location at the centre of the map
}

// This function is used to cancel a booking if the user clicks the button
// No parameters or return value
function cancelBooking() {
    if (confirm("Are you sure you want to cancel? \nThis action cannot be reversed")) {
        removeBooking(getLocalStorageData(BOOKING_NUMBER));
        alert("Cancellation successful");
        window.location = "viewBooking.html"; // if user confirms the cancellation, the booking is removed and the user in informed
    }
}

// This onclick function allows the user to go back to the viewBooking page
function goBack() {
    window.location = "viewBooking.html";
}

// This section is for the loading aspect of the page where the user is informed that the routes on the map are loading
let loadingInterval = setInterval(loadingRoutes, 500); // interval runs the below function every 0.5s

// This function updates the loading text on the page, no return values or parameters
function loadingRoutes() {
    let loadingRef = document.getElementById("loadingText");
    if (loadingRef.innerText === "Loading routes ...") {
        loadingRef.innerText = "Loading routes ....";
    }
    else if (loadingRef.innerText === "Loading routes ....") {
        loadingRef.innerText = "Loading routes .....";
    }
    else if (loadingRef.innerText === "Loading routes .....") {
        loadingRef.innerText = "Loading routes .";
    }
    else if (loadingRef.innerText === "Loading routes .") {
        loadingRef.innerText = "Loading routes ..";
    }
    else if (loadingRef.innerText === "Loading routes ..") {
        loadingRef.innerText = "Loading routes ...";
    }
    // adds an extra dot to the text unless there is 5 dots already where it resets to one dot
}

// This function is run when the user clicks the change taxi button and reveals the dropdown menu of selectable taxi's
// No returns or parameters needed
function revealOptions() {
    let selectRef = document.getElementById("changeOptions");
    selectRef.style.visibility = "visible";
}

// This function is used to reveal the tick button when a valid taxi type is selected, no parameters or returns
function revealConfirm() {
    let bookingOfInterest = bookingArray[getLocalStorageData(BOOKING_NUMBER)];
    let selectRef = document.getElementById("changeOptions").value;
    let tickButtonRef = document.getElementById("confirmChange");
    if (selectRef !== "empty" && selectRef !== bookingOfInterest.taxiData.type) {
        document.getElementById("errorMessage").innerText = "";
        tickButtonRef.style.visibility = "visible";
    }
    else {
        document.getElementById("errorMessage").innerText = "Cannot be blank or same type";
        tickButtonRef.style.visibility = "hidden";
    } // if the selection isnt the taxi type that is already selected or is blank the tick will remain hidden otherwise it will be visible
}

// This function is used to change the taxi type of a selected booking
// There are no return values or parameters required
function changeTaxiType() {
    if (!confirm("Are you sure you want to change?")) {
        return;
    } // user is first asked to confirm
    let bookingOfInterest = bookingArray[getLocalStorageData(BOOKING_NUMBER)];
    let cost = bookingOfInterest.cost;
    let duration = bookingOfInterest.duration;
    let flag = bookingOfInterest.flag;
    let stops = bookingOfInterest.numberOfStops;
    let time = bookingOfInterest.time;
    let date = time.slice(0, 10);
    let trip = bookingOfInterest.tripDetails;
    // relevant values of the booking are obtained

    let numberHours = Number(time[11] + time[12]);
    let numberMinutes = (Number(time[14] + time[15]));
    let numberTime = numberHours + numberMinutes / MINS_IN_HOUR; // values are converted numerically in order to assign a taxi

    let newType = document.getElementById("changeOptions").value; // get the requested taxi type
    let newTaxiData = allocateTaxi(newType, date, numberTime, duration / MINS_IN_HOUR); // allocate a taxi

    if (newTaxiData.type === "" || newTaxiData.rego === "") {
        alert(`There are no ${newType}s available at this time`);
        return;
    } // if there is no taxis available user is notified

    removeBooking(getLocalStorageData(BOOKING_NUMBER)); // booking is removed
    createBooking(trip, newTaxiData, time, flag, stops, cost, duration); // new booking is added
    updateLocalStorage(BOOKING_NUMBER, bookingArray.length - 1);
    // booking number is updated, where the new number is the length -1 as the new booking will be added to the last index of bookingArray
    alert("Change successful"); // user is informed
    window.location = "view.html"; // page is reloaded
}