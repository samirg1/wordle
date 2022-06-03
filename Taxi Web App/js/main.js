/*
 * Purpose : Provide the necessary javascript for the HTML file "main.html"
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 19th of May 2021
*/

"use strict";


/* Function Name: directBkng
 * Purpose : Redirect user to the booking page
 * Parameters: None
 * Return Value: None
*/
function directBkng() {
    window.location = "booking.html";
}


/* Function Name: directView
 * Purpose : Redirect user to the view page
 * Parameters: None
 * Return Value: None
*/
function directView() {
    window.location = "viewBooking.html";   //  direct user too view booking history page
}


/* Function Name: personalPage
 * Purpose : Add personalised aspects to the home page such as: short list of previous bookings, return welcome message
 * Parameters: None
 * Return Value: None
*/
function personalPage() { //  create personalised html page
    let maxBookingsDisplayed = 8;      //  max number of bookings displayed before the user has to press the "view all" button
    let pageContentRef = document.getElementById("pageContent"); //  reference
    let output =    //  apend
        `<!--spacing row-->
        <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--12-col"></div>
        </div>
        <div class="mdl-grid" id="customPage">                         
            <div class="mdl-cell mdl-cell--6-col mdl-cell--4-col-phone">
                <span id="returnMsg" class="headings"> Welcome Back! </span>
            </div>
            <div class="mdl-cell mdl-cell--6-col mdl-cell--4-col-phone"></div>
        </div>
    
        <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--5-col mdl-cell--4-col-phone" id="disPrevBkng">
                <h4 class="headings"> List of Bookings: </h4>`;

    for (let i = 0; i < bookingArray.length; i++) {         //  for loop for number of bookings in the array
        let booking = bookingArray[i];  //  variable for the given booking in the array
        let cost = booking.cost.toFixed(2); //  get cost of the trip to 2 dec places
        let displayTime = reformatDate(booking.time);   // reformat 24 hr time to nicer format

        if (i == maxBookingsDisplayed) {   //  if the number of bookings displayed is equal to the max value, stop displaying bookings
            output += `                                                             
                <span class="homeText">...more</span>
                <br></br>`;
            break;  //  exit the for loop
        }
        output += `                                                             
                <span class="homeText">-<b> Booking ${i + 1}:</b> ${displayTime} - $${cost}</span>
                <br></br>`; // append
    }


    if (bookingArray.length === 0) {    // if the user has used the site before, but has cleared their booking data, they only get this line of text
        output += ` 
                <span class="homeText"><b>No history of bookings.</b></span>
                <br></br>`;
    }
    else {  //  if the user has used the site before and hasnt cleared their booking data, they can go to view.html.
        output += `
                <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" 
                    id="viewBtn" onclick="directView()">
                    View All
                </button>`;
    }

    output +=   //  append. add the booking button and insert background image
        `       <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
                    id="returnBkingBtn" onclick="directBkng()">
                    Make a Booking
                </button>
            </div>    
            <div class="mdl-cell mdl-cell--7-col mdl-cell--4-col-phone">
                <img src="img/taxi-image.jpeg" alt="taxi" id="taxiImg">
            </div>
        </div>`;

    pageContentRef.innerHTML = output;   //  insert into html page
}

if (verifyData(APP_DATA_KEY) === true) { //  if booking data exists, run personalPage function (give the user a personalised page if they're a return user)
    personalPage();
}

liveClock();    //  declare liveClock function from shared.js
setInterval(liveClock, 1000);   //  refresh clock every 1 second

