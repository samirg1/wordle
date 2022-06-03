/*
 * Purpose : Provide the necessary javascript for the use of taxis
 * Organisation/Team : Assigment for Monash University
 * Author : Samir Gupta
 * Last Modified : 18th of May 2021
*/

const TAXI_FARE = [
    { name: "Sedan", flag: 4.20, fareRate: 1.622, levy: 1.10 },
    { name: "SUV", flag: 4.20, fareRate: 1.622, levy: 4.60 },
    { name: "Van", flag: 4.20, fareRate: 1.622, levy: 7.10 },
    { name: "Minibus", flag: 4.20, fareRate: 1.622, levy: 11.10 }
]; // provides the fare structure for each taxi

let taxiList = [
    { "rego": "VOV-887", "type": "Sedan", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "OZS-293", "type": "Van", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "WRE-188", "type": "SUV", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "FWZ-490", "type": "Sedan", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "NYE-874", "type": "SUV", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "TES-277", "type": "Sedan", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "GSP-874", "type": "SUV", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "UAH-328", "type": "Minibus", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "RJQ-001", "type": "SUV", "bookedTimes": [{ date: "", time: "", duration: "" }] },
    { "rego": "AGD-793", "type": "Minibus", "bookedTimes": [{ date: "", time: "", duration: "" }] }
]; // provides the taxi list to use when assigning taxis
// the first index of bookedTimes is blank so that when each variable is called upon, a value is returned even if there hasnt been any bookings yet
// this doesn't affect any other functions as no booking date, time or duration will clash with this empty attributed array