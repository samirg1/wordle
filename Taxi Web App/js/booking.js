/*
 * Purpose : Provide the necessary javascript for the HTML file "booking.html"
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 18th of May 2021
*/

"use strict";
let locations = []; // storing locations in coordinate form
let dataArray = []; // storing locations in formatted form in order to display to user
let distanceOfRoutes = []; // storing distance of routes
let markersArray = []; // storing map markers	

const MAPBOX_TOKEN = "pk.eyJ1IjoidGVhbTAzOCIsImEiOiJja25xMzluaDIwN3BuMnZtdmRpdzQyemowIn0.61SXSonaGzHAkWZfBDEPww" // token for mapbox api
const DEFAULT_ADDRESS = [145.2265143113404, -37.86932655978508]; // random address to set as default
const DEFAULT_ZOOM = 14; // appropriate default zoom level
const PAN_ZOOM = 17; // zooming to a selected location

/* MAP SETUP */

mapboxgl.accessToken = MAPBOX_TOKEN;
let map = new mapboxgl.Map({ // defining the map on the page
	container: 'map',
	center: DEFAULT_ADDRESS, // random address to start at
	zoom: DEFAULT_ZOOM,
	style: 'mapbox://styles/mapbox/streets-v9'
});
map.addControl(new mapboxgl.NavigationControl(), "top-left"); // adding controls to the map
map.addControl(new mapboxgl.GeolocateControl({
	positionOptions: {
		enableHighAccuracy: false
	},
	trackUserLocation: true
}));
navigator.geolocation.getCurrentPosition(success); // in order to get current location and display
function success(pos) { // this function pans to your location if found
	map.panTo([pos.coords.longitude, pos.coords.latitude]);
}

/* MAP FUNCTIONALITY */

// This function is used to join markers with a line, no parameters or return value
function showLines() {
	let sourceObject = { // defining the object that becomes the source of the new map layer
		type: "geojson",
		data: {
			type: "Feature",
			properties: {},
			geometry: {
				type: "LineString",
				coordinates: []
			}
		}
	};
	for (let i = 0; i < locations.length; i++) { // adding each locations coordinates to the sourceObject
		sourceObject.data.geometry.coordinates.push(locations[i].coordinates);
	}
	removeLayer("route") // removing the current layer (if there is one) and adding a new one with the updated locations
	map.addLayer({
		id: "route",
		type: "line",
		source: sourceObject,
		layout: { "line-join": "round", "line-cap": "round" },
		paint: { "line-color": "#888", "line-width": 6 }
	});
}

// This function is used to check if a layer is defined and removes it if so
// Takes the layer id as a parameter to remove, has no sreturn values
function removeLayer(layerId) {
	let layerCheck = map.getLayer(layerId);
	if (layerCheck !== undefined) {
		map.removeLayer("route");
		map.removeSource("route");
	}
}

// This on click function is run when the user clicks anywhere on the map, it adds a marker and runs relevant functions to determine location, cost and distances (if necessary)
// No return values, parameters are given by the map (e) which stores location
map.on('click', function (e) {
	let lngOfClick = e.lngLat.lng;
	let latOfClick = e.lngLat.lat;
	let coordinatesOfClick = [lngOfClick, latOfClick]; //coords are retrieved and stored
	let marker = new mapboxgl.Marker().setLngLat(coordinatesOfClick).addTo(map);
	markersArray.push(marker); // new marker is added and put into an array so that it can be accessed later

	let url = `https://api.opencagedata.com/geocode/v1/json?q=${latOfClick},${lngOfClick}&key=${GEOCODE_TOKEN}&jsonp=addRoute`;
	webServiceRequest(url); // callback function is run in order to get the formatted address from the coords

	locations.push({ coordinates: [lngOfClick, latOfClick] });
	calculateDistance();
	showLines();
	updateToDoList(); // coords are pushed into array, distance is calculated, path and to do list are updated
});

// This function is used in order to complete forward and reverse geocoding requests
// Requires a URL and has no return value
function webServiceRequest(url) {
	let script = document.createElement('script');
	script.src = url;
	document.body.appendChild(script);
}

/* SEARCH BAR SETUP */

// This function is run when the search button is clicked on the page
// No parameters or return value
function search() {
	let searchText = document.getElementById("searchInput").value; // search text is retrieved
	let url = `https://api.opencagedata.com/geocode/v1/json?q=${searchText}&key=${GEOCODE_TOKEN}&jsonp=getSearchResults`;
	webServiceRequest(url); // geocoding callback uses the data obtained to run the next function (getSearchResults)
}

// This function is called upon when search button is pressed using jsonp
// It requires a data parameter which is provided in the jsonp from geocode, no return value
function getSearchResults(data) {
	let firstLocation = data.results[0]; // to be used to check if there are results at all

	document.getElementById("results").innerHTML = ""; // clears current results

	let resultOutput = "";
	let nonVictorianResults = 0;

	resultOutput += `
		<h6>Search Results : </h6>
		<ul id="searchList" class="mdl-list">`;

	if (firstLocation === undefined) { // if there is no results
		document.getElementById("results").innerText = "No search results found";
		return;
	}

	for (let i = 0; i < data.results.length; i++) { // if there is results
		if (data.results[i].components.country === "Australia" && data.results[i].components.state === "Victoria") {
			resultOutput += `
			<li class="mdl-list_item mdl-list_item--three-line">
				<span class="mdl-list_item-primary-content">
					<i class="material-icons">search</i>
					<span>${data.results[i].formatted}</span>
				</span>
				<span class="mdl-list_item-secondary-content">
					<a class="mdl-list_item-secondary-action" onclick="goToLocation(${data.results[i].geometry.lng},${data.results[i].geometry.lat})">
						<i class="material-icons" title=""Go to location">done</i>
					</a>
				</span>
			</li>`;
		}
		else {
			nonVictorianResults++;
		}
	}
	resultOutput += `
		</ul>`;

	if (nonVictorianResults === data.results.length) { // if there is no results in victoria
		document.getElementById("results").innerText = "No search results found in Victoria";
	}
	else {
		document.getElementById("results").innerHTML = resultOutput;
	}
}

// This function takes coordinates as its parameters and runs when a search result's 'tick' button is clicked
function goToLocation(lng, lat) {
	map.panTo([lng, lat], { zoom: PAN_ZOOM }); // map pans to location
	document.getElementById("results").innerText = ""; // inputs & results are cleared
	document.getElementById("searchInput").value = "";
}

/* TRIP SETUP */

// Assigned to the delete button on each route displayed in order to remove a route
// Requires a routeNumber as a parameter, no return value
function deleteRoute(routeNumber) {
	locations.splice(routeNumber, 1);
	markersArray[routeNumber].remove();
	markersArray.splice(routeNumber, 1);
	dataArray.splice(routeNumber, 1);
	showLines();
	calculateDistance();
	updateRouteStatus();
	updateToDoList();
	makeBookingAvailable(); // every place where the route is stored is updated as well as things like total distance, cost etc.
}

// This function is run through jsonp when geocoding in order to add a route
function addRoute(data) {
	let firstResult = data.results[0]; // to use to test if the result is valid or not
	dataArray.push(firstResult.formatted); // array is updated (if result becomes invalid the array is updated again below)

	if (firstResult.components.country === "Australia" && firstResult.components.state === "Victoria") {
		updateRouteStatus();
		makeBookingAvailable(); // if it is a valid address the place is added and statuses are updated
	}
	else {
		alert("Addresses can only be in Victoria");
		deleteRoute(locations.length - 1); // if location is invalid, error message and route is deleted
	}
}

// This function is used to display to the user the current trip status with all of their routes
// No parameters or return value 
function updateRouteStatus() {
	let firstLocation = dataArray[0]; // first location in order to do validation

	document.getElementById("output").innerHTML = ""; // output is first cleared

	let routeOutput = "";

	routeOutput += `
		<ul class="mdl-list">
			<li class="mdl-list__item mdl-list__item--three-line" style="overflow-y:scroll;">
				<span class="mdl-list_item-primary-content">
					<i class="material-icons mdl-list__item-avatar">local_taxi</i>
					<span>`;
	if (firstLocation === undefined) {
		routeOutput += `Start at ... 
					</span>
				</span>
			</li>`;
	}
	else {
		routeOutput += `Start at ${firstLocation}	
					</span>
				</span>
				<span class="mdl-list_item-secondary-content">
					<a class="mdl-list_item-secondary-action" title="Delete Location" onclick="deleteRoute(0)">
						<i class="material-icons">delete</i>
					</a>
				</span>
			</li>`;
	}

	if (locations.length !== 1) { // if there are more than one location another list is added with the same elements, except they start with Stop at ....
		for (let i = 1; i < dataArray.length; i++) {
			routeOutput += `
			<li class="mdl-list__item mdl-list__item--three-line" style="overflow-y:scroll;">
				<span class="mdl-list_item-primary-content">
					<i class="material-icons mdl-list__item-avatar">local_taxi</i>
					<span>Stop at ${dataArray[i]} (${distanceOfRoutes[i - 1].toFixed(2)}km)</span>
				</span>
				<span class="mdl-list_item-secondary-content">
					<a class="mdl-list_item-secondary-action" title="Delete Location" onclick="deleteRoute(${i})">
						<i class="material-icons">delete</i>
					</a>
				</span>
			</li>`;
		}
	}
	routeOutput += `
		</ul>`;

	document.getElementById("output").innerHTML = routeOutput;

	let sumOfDistances = 0;
	for (let i = 0; i < distanceOfRoutes.length; i++) {
		sumOfDistances += distanceOfRoutes[i]; // calculating the total distance travelled
	}
	if (firstLocation === undefined || locations.length <= 1) {
		document.getElementById("distanceTotal").innerHTML = "";
		document.getElementById("totalCost").innerHTML = "";
		document.getElementById("estimatedTime").innerHTML = ""; // not displaying distance or cost if only one or no locations are selected
	}
	else {
		document.getElementById("distanceTotal").innerHTML = `<b>Total Distance :</b> ${sumOfDistances.toFixed(2)}km <br><b>Total Stops :</b> ${locations.length}`;
		calculateCost();
		document.getElementById("estimatedTime").innerHTML = `<b>Duration :</b> ${Math.ceil(sumOfDistances / AVERAGE_SPEED)}mins`; // displaying results to user
	}
}

/* CALCULATIONS AND TYPES */

// This function uses the radio buttons on the page to determine which taxi type has been selected
// No parameters are needed, the taxi type is returned
function determineTaxiType() {
	let taxiType = "";
	if (document.getElementById("sedanOption").checked === true) {
		taxiType += "Sedan";
	}
	else if (document.getElementById("SUVOption").checked === true) {
		taxiType += "SUV";
	}
	else if (document.getElementById("vanOption").checked === true) {
		taxiType += "Van";
	}
	else if (document.getElementById("minibusOption").checked === true) {
		taxiType += "Minibus";
	} // each radio button is checked to see whether they are 'checked' and if so the value is stored in taxiType and is returned
	return taxiType;
}

// This function is used to calculate the total cost of the trip
// There are no parameters
// Although the values inside are defined in the HTML the value of the cost is also returned to be used if necessary
function calculateCost() {
	if (document.getElementById("timeSlots").value === "") {
		return; // the cost wont display if a time hasnt been selected
	}
	let taxiType = determineTaxiType();
	let flag = document.getElementById("flag").checked; // check if flagged toggle is checked

	let totalDistance = 0;
	for (let i = 0; i < distanceOfRoutes.length; i++) {
		totalDistance += distanceOfRoutes[i]; // find total distance
	}

	let index = 0;
	for (let i = 0; i < TAXI_FARE.length; i++) {
		if (TAXI_FARE[i].name === taxiType) {
			index = i;
			break; // get taxi data of selected taxi
		}
	}

	let totalCost = 0;
	if (flag === false) {
		totalCost += TAXI_FARE[index].fareRate * totalDistance + TAXI_FARE[index].levy;
	}
	else {
		totalCost += TAXI_FARE[index].flag + TAXI_FARE[index].fareRate * totalDistance + TAXI_FARE[index].levy;
	} // total cost is found using the fare structure in taxiData.js

	if (locations.length >= 2) {
		let timeslotRef = document.getElementById("timeSlots").value;
		let timeslotHour = timeslotRef.slice(0, 2);
		let nightRate = 1.2; // accounting for night time rates between 9am (9:00) and 5pm (17:00)
		if (Number(timeslotHour) < 9 || Number(timeslotHour) >= 17) {
			totalCost = nightRate * totalCost;
			document.getElementById("totalCost").innerHTML = `<b>Estimated Fare :</b> $${(totalCost).toFixed(2)} (Inclusive of nightly surcharge)`;
			// cost is increased, a question mark icon is shown to inform user why there was an increase in price
		}
		else {
			document.getElementById("totalCost").innerHTML = `<b>Estimated Fare :</b> $${totalCost.toFixed(2)}`;
		}
	}
	return totalCost; // find cost of trip and define it on the page as well as returning the value for use
}

// This function is used to calculate the distance between two locations that are stored in the variable 'locations'
// There are no parameters or return values
function calculateDistance() {
	distanceOfRoutes = []; // calculating the distance between two locations and adding it to an array of distances
	for (let i = 1; i < locations.length; i++) { // starting at i = 1 as distance can only be calculated if there are two locations
		let distanceBetweenLocations = haversine(locations[i - 1].coordinates, locations[i].coordinates);
		distanceOfRoutes.push(distanceBetweenLocations);
	}
}

/* BOOKING FUNCTIONALITY */

// This function is used to make a booking when the user presses the make booking button
// There are no return values or parameters
function makeBooking() {
	let selectedDate = document.getElementById("dateInput").value;
	let selectedTimeSlot = document.getElementById("timeSlots").value;
	let selectedTaxi = determineTaxiType();
	let selectedFlag = document.getElementById("flag").checked; // values are retrieved

	let numberHours = Number(selectedTimeSlot[0] + selectedTimeSlot[1]);
	let numberMinutes = (Number(selectedTimeSlot[3] + selectedTimeSlot[4]));
	let numberTime = numberHours + numberMinutes / MINS_IN_HOUR; // values are converted numerically in order to assign a taxi

	let confirmMessage = "                                       Booking Details\nYour Stops Are : ";
	for (let i = 0; i < dataArray.length; i++) {
		confirmMessage += `\n - ${dataArray[i]}`;
	} // the confirm message has each location added
	let totalDistance = 0;
	for (let i = 0; i < distanceOfRoutes.length; i++) {
		totalDistance += distanceOfRoutes[i];
	}
	let duration = Math.ceil(totalDistance / AVERAGE_SPEED); // duration of trip is defined (Math.ceil is used for leyway)

	let taxiData = allocateTaxi(selectedTaxi, selectedDate, numberTime, duration / MINS_IN_HOUR); // taxi is allocated using the numerical values
	if (taxiData.type === "" || taxiList.type === "") {
		alert(`Unfortunately there are no ${selectedTaxi.toLowerCase()}s available at this time`);
		return;
	} // if no taxi is allocated then user is shown why and rest of booking is halted

	confirmMessage += `\n\nDistance : ${totalDistance.toFixed(2)}km -- Taxi Type : ${determineTaxiType()} -- Cost : $${calculateCost().toFixed(2)}`;
	confirmMessage += `\nDate / Time : ${reformatDate(`${selectedDate}-${selectedTimeSlot}`)} -- Duration : ${duration}mins`;
	confirmMessage += `\n\n Are You Sure You Want To Book?`; // confirm message is shown to display all booking information to the user before they agree to make the booking

	if (confirm(confirmMessage) === false) {
		removeTaxiTimeslot(taxiData.rego, `${selectedDate}-${selectedTimeSlot}`);
		return; // if user denies confirm function is halted
	}
	for (let i = 1; i < locations.length; i++) { // starting at i = 1 as there must be two locations to make a booking
		newTrip.addRoute(locations[i - 1].coordinates, locations[i].coordinates, dataArray[i - 1], dataArray[i]);
	} // locations are added to the Trip class defined in shared.js

	createBooking(newTrip, taxiData, `${selectedDate}-${selectedTimeSlot}`, selectedFlag, locations.length, calculateCost(), duration); // new Booking class instance is created
	alert("Booking Successful!");
	window.location.assign("viewBooking.html"); // user is taken to the homepage
}

// This function is used to verify whether the date and time selected are valid (in the future and giving at least 15 mins from current time)
// There are no parameters
// False is returned if date/time is invalid, true is returned if they are valid
function verifyDateTime() { // function to display time/date slots to the user
	document.getElementById("timeSlots").innerHTML = "";
	let inputRef = document.getElementById("timeSlots").value;
	let selectedDateRef = document.getElementById("dateInput").value;

	let inputHours = inputRef.slice(0, 2);
	let inputMinutes = inputRef.slice(3, 5); // values are retrieved from page and stored appropriately

	let currentDate = new Date;
	let currentHours = currentDate / MILLISECONDS_IN_HOUR; // converting current time into hours in order to compare with selected time

	// selected time is format YYYY-MM-DD, therefore we now have to convert so that it can be stored as a date
	let yearThousands = 0, yearHundreds = 1, yearTens = 2, yearOnes = 3; // years values are in these positions in the selectedTime string
	let monthTens = 5, monthOnes = 6; // months values are in these positions in the selectedTime string
	let dayTens = 8, dayOnes = 9; // days values are in these positions in the selectedTime string

	let selectedYear = Number(selectedDateRef[yearThousands] + selectedDateRef[yearHundreds] + selectedDateRef[yearTens] + selectedDateRef[yearOnes]);
	let selectedMonth = Number(selectedDateRef[monthTens] + selectedDateRef[monthOnes]) - 1; // -1 as months are stored as indexes that start at 0 in date object
	let selectedDay = Number(selectedDateRef[dayTens] + selectedDateRef[dayOnes]);

	let currentCentury = 2000;
	if (selectedYear < currentCentury) {
		return;
	}

	let requestedDate = new Date(selectedYear, selectedMonth, selectedDay, Number(inputHours), Number(inputMinutes));
	let selectedHours = requestedDate / MILLISECONDS_IN_HOUR; // putting time inputs in hours since 1970 form

	let hourDifference = selectedHours - currentHours;
	if (hourDifference < -HOURS_IN_DAY) {
		return false; // if selected date is a day before false is returned
	}

	if (inputRef !== "") {
		let minutesDifference = requestedDate / MILLISECONDS_IN_MINUTE - currentDate / MILLISECONDS_IN_MINUTE;
		if (minutesDifference / MINS_IN_HOUR < MIN_REST) {
			return false; // if the time input isnt blank, and the user has selected a time that doesnt allow for the minimum rest or is in the past, false is returned
		}
	}
	return true; // if the two above if statements are false, true is returned 
}

// This function is used to make the booking button available to the user only when they have valid input and completed the to do list
// There is no return value or paramters
function makeBookingAvailable() {
	let selectedDate = document.getElementById("dateInput").value;
	let selectedTime = document.getElementById("timeSlots").value;
	let makeBookingButton = document.getElementById("bookingButton"); // define references
	if (verifyDateTime() === false) {
		alert(`Date and time must be in the future \nYou can only book with at least 15 minutes notice`);
		makeBookingButton.disabled = true;
		return; // if the date and time returns false, the button is deactivated and the user is shown why
	}
	if (selectedDate !== "" && selectedTime !== "" && locations.length > 1) {
		makeBookingButton.disabled = false;
	}
	else {
		makeBookingButton.disabled = true;
	} // button now updates so that it is only active if date is not empty, time is not empty, and 2 or more locations are chosen by the user
}

/* OTHER FUNCTIONALITY */

// This function is assigned to the cancel button in order to return the home page, no parameters or returns
function cancelProcess() {
	if (confirm("Are You Sure You Want To Cancel?\nYou Will Lose All Booking Data")) {
		window.location.assign("index.html"); // if the user agrees they are redirected to the home page
	}
}

// This function is used to update a to do list, in order to show the user what they should be doing in order to complete their booking
function updateToDoList() {
	let selectedDate = document.getElementById("dateInput").value;
	let selectedTime = document.getElementById("timeSlots").value;
	let numberOfLocations = locations.length; // relevant values are collected
	let indexOfDataBadgeAttribute = 2; // in the element with id dataBadge, the index of the data-badge attribute (the one responsible for the tick or no tick) is 2
	if (selectedDate !== "") {
		document.getElementById("dateBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "✓";
	}
	else {
		document.getElementById("dateBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "";
	}
	if (selectedTime !== "empty" && selectedTime !== "") {
		document.getElementById("timeBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "✓";
	}
	else {
		document.getElementById("timeBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "";
	}
	if (numberOfLocations > 1) {
		document.getElementById("destinationBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "✓";
	}
	else {
		document.getElementById("destinationBadge").attributes[indexOfDataBadgeAttribute].nodeValue = "";
	}
	// for each badge the relevant values are checked to see whether they reach the criteria for a tick or not
	// each badge is assigned a tick or left empty if they do or dont meet the requirements respectively
}

/* ONLOAD FUNCTION */

// This function runs as the window loads in order to display all relevant information as well as add functionality
window.onload = function () {
	let inputIds = ["sedanOption", "SUVOption", "vanOption", "minibusOption", "flag"];
	for (let i = 0; i < inputIds.length; i++) {
		document.querySelector(`input[id=${inputIds[i]}`).addEventListener("change", calculateCost);
	} // adding these event listeners means that the cost will be updated every time the user changes taxi type or flagged status
	document.getElementById("dateInput").addEventListener("change", verifyDateTime);// date and time is verified
	document.getElementById("dateInput").addEventListener("change", updateToDoList); // to do list is updated
	document.getElementById("dateInput").addEventListener("change", makeBookingAvailable); // button availability is udpated

	document.getElementById("timeSlots").addEventListener("change", makeBookingAvailable); // any time the user changes the timeslot, the booking button's availability updates
	document.getElementById("timeSlots").addEventListener("change", updateToDoList); // to do list is updated
	document.getElementById("timeSlots").addEventListener("change", calculateCost); // the cost is updated
	document.getElementById("timeSlots").addEventListener("change", verifyDateTime); // date and time is verified

	document.getElementById("backButton").addEventListener("click", cancelProcess);
	document.getElementById("searchButton").addEventListener("click", search);
	document.getElementById("bookingButton").addEventListener("click", makeBooking); // onclick attributes to each of the major buttons

	updateRouteStatus(); // updates the current route so that it doesnt start empty, start with "(icon) Start at... (delete button)"
	liveClock();
	setInterval(liveClock, 1000); // shows the user the clock and updates it every second
}