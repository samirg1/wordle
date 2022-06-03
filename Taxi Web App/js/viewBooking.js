/*
 * Purpose : Provide the necessary javascript for the HTML file "viewBooking.html"
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 18th of May 2021
*/

"use strict";


let futureBookings = [];
let pastBookings = []; // two empty arrays are defined in order to distinguish between future and past bookings

// This function sorts the current booking array into past and future booking and puts them into the respective variable
// No parameters or return values
function determineBookingType() {
    for (let i = 0; i < bookingArray.length; i++) {
        if (timeComparison(bookingArray[i].time) === "upcoming") {
            futureBookings.push(bookingArray[i]);
        }
        else {
            pastBookings.push(bookingArray[i]);
        }
    }
}

// This function is used to compare the bookingTime with the current time to see if the booking is future or past
// It required the booking time as a parameter and returns "upcoming" for a future booking and "history" for a past booking
function timeComparison(bookingTime) {
    let currentDate = new Date();
    let bookedDate = convertDate(bookingTime);

    let timeDifference = bookedDate - currentDate;
    if (timeDifference > 0) {
        return "upcoming";
    }
    else {
        return "history";
    }
}

// This function is used to display each booking on the page
// No parameters or return values
function displayBookings() {
    let futureTripsRef = document.getElementById("futureTrips");
    let pastTripsRef = document.getElementById("pastTrips"); // parts of the html page are defined
    let futureOutput = "";
    let pastOutput = ""; // outputs to be stored in their respecitve parts of the page are initialised

    let numberOfBookings = 0; // number of bookings is initialised in order to be able to still use functionality with the bookings even though they are stored in different arrays
    for (let i = 0; i < futureBookings.length; i++) {
        let routes = futureBookings[i].tripDetails.routes;
        let startLocation = routes[0].formattedStart;
        let endLocation = routes[routes.length - 1].formattedEnd;
        futureOutput += `
                <div class="mdl-grid">
                    <div class="mdl-cell mdl-cell--12-col">
                        <div class="mdl-grid inside">
                            <div class="mdl-cell mdl-cell--2-col">
                                <h2 class="mdl-layout__title" style="color:red;">Booking ${i + 1}</h2>
                            </div>
                            <div class="mdl-cell mdl-cell--3-col">
                                <b class="labels">Date/Time</b>
                                <p>${reformatDate(futureBookings[i].time)}</p>
                                <b class="labels">Stops</b>
                                <p>${futureBookings[i].numberOfStops}</p>
                            </div>
                            <div class="mdl-cell mdl-cell--3-col">
                                <b class="labels">Pick Up</b>
                                <p>${startLocation}</p>
                                <b class="labels"> Duration </b>
                                <p>${futureBookings[i].duration} mins (${futureBookings[i].tripDetails.totalDistance.toFixed(2)}km)</p>
                            </div>
                            <div class="mdl-cell mdl-cell--3-col">
                                <b class="labels">Drop Off</b>
                                <p>${endLocation}</p>
                                <b class="labels">Fare</b>
                                <p> ${futureBookings[i].cost.toFixed(2)} AUD </p>
                            </div>
                            <div class="mdl-cell mdl-cell--1-col">
                                <button
                                    class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--accent" onclick="viewTrip(${numberOfBookings},${FUTURE_NUMBER})">
                                    <i class="material-icons">info</i>
                                </button>
                                <button
                                    class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--accent" onclick="removeTrip(${numberOfBookings})">
                                    <i class="material-icons">delete</i>
                                </button>
                            </div>
                        </div>
                    </div> 
                </div>`;
        numberOfBookings++;
    } // each future booking has its information displayed

    for (let i = 0; i < pastBookings.length; i++) {
        let routes = pastBookings[i].tripDetails.routes;
        let startLocation = routes[0].formattedStart;
        let endLocation = routes[routes.length - 1].formattedEnd;
        pastOutput += `<div class="mdl-grid">
                <div class="mdl-cell mdl-cell--12-col">
                    <div class="mdl-grid inside">
                        <div class="mdl-cell mdl-cell--2-col">
                            <h2 class="mdl-layout__title" style="color:red;">Booking ${i + 1}</h2>
                        </div>
                        <div class="mdl-cell mdl-cell--3-col">
                            <b class="labels">Date/Time</b>
                            <p>${reformatDate(pastBookings[i].time)}</p>
                            <b class="labels">Stops</b>
                            <p>${pastBookings[i].numberOfStops}</p>
                        </div>
                        <div class="mdl-cell mdl-cell--3-col">
                            <b class="labels">Pick Up</b>
                            <p>${startLocation}</p>
                            <b class="labels"> Duration </b>
                            <p>${pastBookings[i].duration} mins (${pastBookings[i].tripDetails.totalDistance.toFixed(2)}km)</p>
                        </div>
                        <div class="mdl-cell mdl-cell--3-col">
                            <b class="labels">Drop Off</b>
                            <p>${endLocation}</p>
                            <b class="labels">Fare</b>
                            <p> ${pastBookings[i].cost.toFixed(2)} AUD </p>
                        </div>
                        <div class="mdl-cell mdl-cell--1-col">
                            <button
                                class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--accent" onclick="viewTrip(${numberOfBookings},${PAST_NUMBER})">
                                <i class="material-icons">info</i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        numberOfBookings++;
    } // each past booking has its information displayed

    if (futureOutput === "") {
        futureOutput += `
        <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--12-col">
            <span>No Trips To Display</span>
        </div>`;
    }
    if (pastOutput === "") {
        pastOutput += `
        <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--12-col">
            <span>No Trips To Display</span>
        </div>`;
    } // if either of the outputs are still empty it means there are no trips to display and so user is shown that

    futureTripsRef.innerHTML = futureOutput;
    pastTripsRef.innerHTML = pastOutput; // parts of the page are updated with the respective outputs
}

// This function is used to sort the bookings by date and time
// It takes one parameter which is whether the booking is in the past or future
function dateSort(futureOrPast) {
    let futureButtonRef = document.getElementById("futureDateOption");
    let pastButtonRef = document.getElementById("pastDateOption"); // buttons are defined
    if (futureOrPast === FUTURE_NUMBER) {
        if (futureButtonRef.title === "descending") {
            futureBookings.sort(function (a, b) { return convertDate(b.time) - convertDate(a.time); });
            futureButtonRef.title = "ascending";
        }
        else {
            futureBookings.sort(function (a, b) { return convertDate(a.time) - convertDate(b.time); });
            futureButtonRef.title = "descending";
        }
    } // for future bookings, it is initially closest upcoming to furthest in the future, with each button it changes
    else {
        if (pastButtonRef.title === "ascending") {
            pastBookings.sort(function (a, b) { return convertDate(a.time) - convertDate(b.time); });
            pastButtonRef.title = "descending";
        }
        else {
            pastBookings.sort(function (a, b) { return convertDate(b.time) - convertDate(a.time); });
            pastButtonRef.title = "ascending";
        }
    } // for past booking, it is initially most recent to least recent, with each click it changes
    bookingArray = [];
    for (let i = 0; i < futureBookings.length; i++) {
        bookingArray.push(futureBookings[i]);
    }
    for (let i = 0; i < pastBookings.length; i++) {
        bookingArray.push(pastBookings[i]);
    } // booking array is redefined with the new booking data
    updateLocalStorage(APP_DATA_KEY, bookingArray);
    displayBookings(); // display and local storage is updated
}

// This function is used to sort the bookings by cost
// It takes one parameter which is whether the booking is in the past or future
function costSort(futureOrPast) {
    let futureButtonRef = document.getElementById("futureCostOption");
    let pastButtonRef = document.getElementById("pastCostOption");
    if (futureOrPast === FUTURE_NUMBER) {
        if (futureButtonRef.title === "descending") {
            futureBookings.sort(function (a, b) { return b.cost - a.cost; });
            futureButtonRef.title = "ascending";
        }
        else {
            futureBookings.sort(function (a, b) { return a.cost - b.cost; });
            futureButtonRef.title = "descending";
        }
    }
    else {
        if (pastButtonRef.title === "descending") {
            pastBookings.sort(function (a, b) { return b.cost - a.cost; });
            pastButtonRef.title = "ascending";
        }
        else {
            pastBookings.sort(function (a, b) { return a.cost - b.cost; });
            pastButtonRef.title = "descending";
        }
    } // for both future and past bookings the first click of the button will go from low to high
    bookingArray = [];
    for (let i = 0; i < futureBookings.length; i++) {
        bookingArray.push(futureBookings[i]);
    }
    for (let i = 0; i < pastBookings.length; i++) {
        bookingArray.push(pastBookings[i]);
    }
    updateLocalStorage(APP_DATA_KEY, bookingArray);
    displayBookings(); // booking array is updated in local storage and display is updated
}

// This function is used to sort the bookings by duration
// It takes one parameter which is whether the booking is in the past or future
function durationSort(futureOrPast) {
    let futureButtonRef = document.getElementById("futureDurationOption");
    let pastButtonRef = document.getElementById("pastDurationOption");
    if (futureOrPast === FUTURE_NUMBER) {
        if (futureButtonRef.title === "descending") {
            futureBookings.sort(function (a, b) { return b.duration - a.duration; });
            futureButtonRef.title = "ascending";
        }
        else {
            futureBookings.sort(function (a, b) { return a.duration - b.duration; });
            futureButtonRef.title = "descending";
        }
    }
    else {
        if (pastButtonRef.title === "descending") {
            pastBookings.sort(function (a, b) { return b.duration - a.duration; });
            pastButtonRef.title = "ascending";
        }
        else {
            pastBookings.sort(function (a, b) { return a.duration - b.duration; });
            pastButtonRef.title = "descending";
        }
    } // for both future and past bookings the first click of the button will go from low to high
    bookingArray = [];
    for (let i = 0; i < futureBookings.length; i++) {
        bookingArray.push(futureBookings[i]);
    }
    for (let i = 0; i < pastBookings.length; i++) {
        bookingArray.push(pastBookings[i]);
    }
    updateLocalStorage(APP_DATA_KEY, bookingArray);
    displayBookings(); // booking array is updated in local storage and display is updated
}

// This function is assigned to the info icon button of each booking
// It takes two paramters, the booking number and a number indicating whether the booking is in the future or in the past
function viewTrip(bookingNumber, pastOrFuture) {
    updateLocalStorage(BOOKING_NUMBER, bookingNumber);
    updateLocalStorage(PAST_OR_FUTURE, pastOrFuture);
    // local storage is updated with relevant info to be used by view.js
    window.location = "view.html"; // user is redirected
}

// This function is assigned to the delete button of each future booking
// It takes the booking number as a parameter
function removeTrip(bookingNumber) {
    if (confirm("Are you sure you want to cancel? \nThis cannot be reversed")) {
        removeBooking(bookingNumber);
        alert("Cancellation successful"); // user is asked to confirm and is informed of successful cancellation
        determineBookingType();
        displayBookings(); // everything is updated
        window.location = "viewBooking.html"; // user is redirected
    }
}

// This function is used to display relevant information when the page loads
window.onload = function () {
    if (verifyData(APP_DATA_KEY) == true) {
        determineBookingType();
        dateSort(FUTURE_NUMBER);
        dateSort(PAST_NUMBER); // past and future bookings are initially sorted by date
    }
    liveClock();
    setInterval(liveClock, 1000); // clock is defined on the page
}