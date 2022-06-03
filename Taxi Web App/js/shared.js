/*
 * Purpose : Provide the necessary shared javascript for all HTML files in this folder
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 18th of May 2021
*/

"use strict";
const APP_DATA_KEY = "appData"; // local storage key for booking data
const BOOKING_NUMBER = "bookingNumber"; // local storage key for booking number
const TAXI_DATA = "taxiList"; // local storage key for taxi data
const PAST_OR_FUTURE = "pastOrFuture";

const RADIUS_OF_EARTH = 6371; // radius of earth in km
const DEGREES_TO_RADIANS = Math.PI / 180; // used to convert degrees to radians
const FUTURE_NUMBER = 1;
const PAST_NUMBER = -1; // these numbers are used to distinguish between past and future bookings through onclick attributes

const GEOCODE_TOKEN = "e7fd6d017cee409da31897488fdd8190"; // token for geocoding API

const MILLISECONDS_IN_HOUR = 3600000; // amount of milliseconds in an hour
const MILLISECONDS_IN_MINUTE = 60000; // amount of milliseconds in a minute 
const MINS_IN_HOUR = 60; // number of minutes in an hour
const HOURS_IN_DAY = 24; // amount of hours in a day

const MONTH_ARRAY = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_ARRAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_ARRAY = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AM_PM_ARRAY = ["am", "am", "am", "am", "am", "am", "am", "am", "am", "am", "am", "am", "pm", "pm", "pm", "pm", "pm", "pm", "pm", "pm", "pm", "pm", "pm", "pm"];
// these arrays are defined in order to display appropriate info to the user in the formatted date/time

const AVERAGE_SPEED = 0.83333; // average speed in km/min of a taxi
const MIN_REST = 0.25; // mins that is the minimum rest time in between trips

// This function is used to display a clock on each page that has a formatted style
// There are no parameters or return values, it interacts with the clock element on each page in the header
function liveClock() {
    let timeNow = new Date();
    let min = timeNow.getMinutes();
    let secs = timeNow.getSeconds();
    if (min < 10) { min = `0${min}`; }
    if (secs < 10) { secs = `0${secs}`; }
    let timeString = `${DAY_ARRAY[timeNow.getDay()]} ${timeNow.getDate()} ${MONTH_ARRAY[timeNow.getMonth()]} ${HOUR_ARRAY[timeNow.getHours()]}:${min}:${secs} ${AM_PM_ARRAY[timeNow.getHours()]}`;
    document.getElementById("clock").innerHTML = timeString;
};

// This function is used to convert a date from the stored value (YYYY-MM-DD-HH:MM) to a numerical date object
// It takes one paramater which is the formatted date and returns newDate which is the objectified date
function convertDate(date) {
    let year = Number(date.slice(0, 4));
    let month = Number(date.slice(5, 7)) - 1;
    let day = Number(date.slice(8, 10));
    let hour = Number(date.slice(11, 13));
    let minutes = Number(date.slice(14, 16));
    let newDate = new Date(year, month, day, hour, minutes);
    return newDate;
}

// This function is used to reformat the way the date is stored in local storage to display a user friendly string that is easy to understand
// Takes the unformatted date as a paramter and returns the reformatted date
function reformatDate(date) {
    let year = Number(date.slice(0, 4));
    let month = Number(date.slice(5, 7)) - 1;
    let day = Number(date.slice(8, 10));
    let hour = Number(date.slice(11, 13));
    let minutes = Number(date.slice(14, 16)); // values are collected from the date as it is known that it is in the form YYYY-MM-DD-HH:MM
    let newDate = new Date(year, month, day, hour, minutes);
    if (minutes < 10) { minutes = `0${minutes}`; }
    return `${DAY_ARRAY[newDate.getDay()]} ${day} ${MONTH_ARRAY[month]} ${HOUR_ARRAY[hour]}:${minutes} ${AM_PM_ARRAY[hour]}`;
}

// Route class is defined to store each route of the booking
// Each route has a start address, end address stored as coordinated and each of those but in a formatted style
class Route {
    constructor(startAddress, endAddress, formattedStart, formattedEnd) {
        this._startAddress = startAddress;
        this._formattedStart = formattedStart;
        this._endAddress = endAddress;
        this._formattedEnd = formattedEnd;
        this._distance = haversine(startAddress, endAddress);
    }

    get startAddress() { return this._startAddress; }
    get formattedStart() { return this._formattedStart; }
    get endAddress() { return this._endAddress; }
    get formattedEnd() { return this._formattedEnd; }
    get distance() { return this._distance; }

    // This function uses a data parameter to remake the route instance
    fromData(data) {
        this._startAddress = data._startAddress;
        this._formattedStart = data._formattedStart;
        this._endAddress = data._endAddress;
        this._formattedEnd = data._formattedEnd;
        this._distance = data._distance;
    }
}

// Trip is defined as a class to store all relevant information about a specific trip
// Each trip has an array of route class instances and a total distance that stores the total distance in all of the routes
class Trip {
    constructor() {
        this._routes = [];
        this._totalDistance = 0;
    }

    get routes() { return this._routes; }
    get totalDistance() { return this._totalDistance; }

    // This function takes all the variables used to create a route in order to create a new instance and add it into the Trip class routes attribute
    addRoute(startAddress, endAddress, formattedStart, formattedEnd) {
        let newRoute = new Route(startAddress, endAddress, formattedStart, formattedEnd);
        this._routes.push(newRoute);
        this._totalDistance += newRoute._distance;
    }

    // This function uses the paramter data to remake the trip instance
    fromData(data) {
        let dataHold = data._routes;
        for (let i = 0; i < dataHold.length; i++) {
            let newRoute = new Route();
            newRoute.fromData(dataHold[i]);
            this._routes.push(newRoute);
        }
        this._totalDistance = data._totalDistance;
    }
}

// This booking class is used to store all information about a particular booking
// Each booking contains a trip instance, taxi data, time, flag option, number of stops, cost and duration that can all be accessed by the user
class Booking {
    constructor(tripDetails, taxiData, time, flag, numberOfStops, cost, duration) {
        this._tripDetails = tripDetails;
        this._taxiData = taxiData;
        this._time = time;
        this._flag = flag;
        this._numberOfStops = numberOfStops;
        this._cost = cost;
        this._duration = duration;
    }

    get tripDetails() { return this._tripDetails; }
    get taxiData() { return this._taxiData; }
    get time() { return this._time; }
    get flag() { return this._flag; }
    get numberOfStops() { return this._numberOfStops; }
    get cost() { return this._cost; }
    get duration() { return this._duration; }

    // This function restores the booking class from the data parameter
    fromData(data) {
        let newTrip = new Trip();
        newTrip.fromData(data._tripDetails);
        this._tripDetails = newTrip;
        this._time = data._time;
        this._taxiData = data._taxiData;
        this._flag = data._flag;
        this._numberOfStops = data._numberOfStops;
        this._cost = data._cost;
        this._duration = data._duration;
    }
}

// This function takes two parameters, the start address and the end address in coordinate form and returns the distance between the two using the haversine formula
function haversine(startAddress, endAddress) {
    let longitudesIndex = 0; // index of the address' longitude
    let latitudesIndex = 1; // index of the address' latitude
    if (startAddress === undefined || endAddress === undefined) {
        return; // haversine does not go ahead if the addresses are undefined
    }
    let startLng = startAddress[longitudesIndex] * DEGREES_TO_RADIANS;
    let startLat = startAddress[latitudesIndex] * DEGREES_TO_RADIANS;
    let endLng = endAddress[longitudesIndex] * DEGREES_TO_RADIANS;
    let endLat = endAddress[latitudesIndex] * DEGREES_TO_RADIANS;
    // coordinates are converted into radians

    let deltaLat = endLat - startLat;
    let deltaLon = endLng - startLng; // change in lat and lng are defined

    let a = (Math.sin(deltaLat / 2)) ** 2 + Math.cos(startLat) * Math.cos(endLat) * (Math.sin(deltaLon / 2)) ** 2;
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = RADIUS_OF_EARTH * c; // haversine formula is used
    return distance; // distance is returned
}

// This function is used to create a new booking using all the parameters that form a booking
function createBooking(tripDetails, taxiData, time, flag, numberOfStops, totalCost, duration) {
    let newBooking = new Booking(tripDetails, taxiData, time, flag, numberOfStops, totalCost, duration);
    bookingArray.push(newBooking);
    updateLocalStorage(APP_DATA_KEY, bookingArray); // the array of bookings is updated and is stored in local storage
}

// This function takes the booking number and deletes the specific booking as well as the taxi data defined in bookedTimes in taxiData.js
function removeBooking(bookingNumber) {
    removeTaxiTimeslot(bookingArray[bookingNumber].taxiData.rego, bookingArray[bookingNumber].time,);
    bookingArray.splice(bookingNumber, 1);
    updateLocalStorage(APP_DATA_KEY, bookingArray); // the booking array is spliced and local storage is updated with all the new data
}

// This function is used to update local storage
// It takes two parameters, the key to store the data under and the data to store
function updateLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// This function is used to retrieve data from local storage at a specified key and return that data
function getLocalStorageData(key) {
    let retrievedData = localStorage.getItem(key);
    try {
        retrievedData = JSON.parse(retrievedData);
    }
    catch (error) { }
    finally {
        return retrievedData;
    } // if data can be parsed it will be
}

// This function is used to verify if the data exists at the given key. returns false if nothing there, else returns true
function verifyData(key) {
    let retrievedData = getLocalStorageData(key);
    if (retrievedData === null) {
        return false;
    }
    else {
        return true;
    }
}

// This function is used to allocate a taxi using the taxiList defined in taxiData.js
// It takes four parameters
// - the user's selected taxi
// - the user's selected date
// - the user's selected time
// - the calculated duration of the trip
// The function returns the taxi data found that is to be placed into the booking
function allocateTaxi(selectedTaxi, date, time, duration) {
    let taxiData = { type: "", rego: "" } // taxiData is initialised
    let storedTaxiList = ""; // the taxiList is initialised
    if (verifyData(TAXI_DATA)) {
        storedTaxiList = getLocalStorageData(TAXI_DATA);
    }
    else {
        storedTaxiList = taxiList;
    } // the stored list stores the current data if it has been stored before or instead stores the default list
    for (let i = 0; i < storedTaxiList.length; i++) {
        if (selectedTaxi === storedTaxiList[i].type) {
            let numberOfBookedTimes = storedTaxiList[i].bookedTimes.length;
            let numberOfNotClashes = 0; // this value is used later to see how many times do not clash with the selected time
            for (let j = 0; j < storedTaxiList[i].bookedTimes.length; j++) {
                let bookedDates = storedTaxiList[i].bookedTimes[j].date;
                let bookedTimes = storedTaxiList[i].bookedTimes[j].time;
                let bookedDurations = storedTaxiList[i].bookedTimes[j].duration;
                if (bookedDates !== date || (bookedTimes) - (time + duration) > MIN_REST || (bookedTimes + bookedDurations) - time < -MIN_REST) {
                    numberOfNotClashes++;
                } // this if statement adds 1 to numberOfNotClashes if the time and date are found to not clash with all current times
            }
            if (numberOfNotClashes === numberOfBookedTimes) {
                taxiData.type = storedTaxiList[i].type;
                taxiData.rego = storedTaxiList[i].rego;
                let bookingTime = { date: date, time: time, duration: duration };
                storedTaxiList[i].bookedTimes.push(bookingTime);
                updateLocalStorage(TAXI_DATA, storedTaxiList);
                break; // if there are all non-clashes, taxi data is updated and the taxi list is updated
                // if there are clashes, the for loop goes on to the next taxi
            }
        }
    }
    return taxiData; // taxi data is returned
}

// This function takes the rego and date/time parameter to remove a taxi time slot 
function removeTaxiTimeslot(rego, dateTime) {
    let bookedRego = rego;
    let bookedDate = dateTime.slice(0, 10);
    let bookedTime = Number(dateTime.slice(11, 13)) + Number(dateTime.slice(14, 16)) / MINS_IN_HOUR;
    // values are retrieves knowing that the format of the date inside the booking is YYYY-MM-DD-HH:MM
    let storedTaxiBookings = getLocalStorageData(TAXI_DATA);
    for (let i = 0; i < storedTaxiBookings.length; i++) {
        if (storedTaxiBookings[i].rego === bookedRego) {
            for (let j = 0; j < storedTaxiBookings[i].bookedTimes.length; j++) {
                if (storedTaxiBookings[i].bookedTimes[j].date === bookedDate && storedTaxiBookings[i].bookedTimes[j].time === bookedTime) {
                    storedTaxiBookings[i].bookedTimes.splice(j, 1);
                    break;
                }
            }
            break;
        }
    } // this for loop iterates over the taxi data stored in local storage to find the specified taxi and specified booking time that must be removed from the taxi list
    updateLocalStorage(TAXI_DATA, storedTaxiBookings); // storage is updated
}

let bookingArray = []; // defining locally stored booking data into an array to use in any page
if (verifyData(APP_DATA_KEY)) {
    let bookingData = getLocalStorageData(APP_DATA_KEY);
    for (let i = 0; i < bookingData.length; i++) {
        let newBooking = new Booking();
        newBooking.fromData(bookingData[i]);
        bookingArray.push(newBooking);
    } // recreating each instance of booking in the booking array from the data stored in local storage
}
let newTrip = new Trip(); // defining a new trip in order to access it on the booking page