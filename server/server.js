import express from 'express';

const fs = require('fs');
const csv = require('csv-parser')
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();

// Defines the uploaded files destination.
const upload = multer({ dest: 'data/csv/' });

// Defines the classifier keyword for parsing PNR's vs flights.
const PNR_CLASSIFIER = 'PNR';

const PORT = 4000;

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.urlencoded({ extended:false }))

// app.post('/upload', (req, res) => {
//     console.log('got the upload post request:', req.body);
//
//     res.send({
//         'PNR01': 'F1',
//         'PNR02': 'F1'
//     })
// })


app.post('/upload', upload.array('files'), function (req, res) {
    console.log('got the upload data: ' + req)
    var pnrs = []
    var flights = [];
    var results = {};

    if (req.files.length < 2) {
        res.send('Not enough files were chosen!')
    }

    var files = req.files;
    files.forEach((file, idx) => {
        fs.createReadStream(file.path)
            .pipe(csv([0, 1, 2, 3]))
            .on('data', (row) => {
                // Identify if the parsed data is PNR or flight information.
                // With that, save the data with the correct field names.
                if (row['0'] && row['0'].indexOf(PNR_CLASSIFIER) > -1) {
                    pnrs.push({
                        id: row['0'],
                        amount: row['1'],
                        origin: row['2'],
                        dest: row['3'],
                    });
                } else if (row['0']) {
                    flights.push({
                        id: row['0'],
                        origin: row['1'],
                        dest: row['2'],
                        capacity: row['3']
                    })
                }
            })
            .on('end', () => {
                // Allocate only when done parsing all files.
                if (idx == files.length - 1) {
                    results = allocate(flights, pnrs);
                    res.send({ 'allocations': results });
                }
            });
    });
});

/**
 * Given a list of flights and PNR's, allocate the different PNR's
 * to flights by a 'Greedy Choice'. That means, try to assign as
 * many people as can to minimal number of flights.
 * First, sort the flights and PNR's by their capacity/amount of
 * passengers (from largest to smallest). Then, assign the biggest PNR
 * to a suitable flight. We'll try to fill this flight all the way to
 * get minimal number of flights.
 */
function allocate (flights, pnrs) {
    // Defines the final assignment of PNRs to flights
    var results = []

    pnrs.sort((a, b) => {
        return (a.amount > b.amount) ? -1 : 1;
    });

    flights.sort((a, b) => {
        return (a.capacity > b.capacity) ? -1 : 1;
    });

    console.log(pnrs, flights)
    pnrs.forEach((pnr) => {
        // Get the flight suitable for the current PNR, by comparing
        // the origin and destination.
        var relevantFlights = flights.filter((flight) => {
            return (flight.origin == pnr.origin) && (flight.dest == pnr.dest);
        })

        console.log('relevantFlights: ', relevantFlights);

        // The first flight in the sorted list is the one with most
        // capacity (always). We want to save flights, and therefore we
        // can just assin this one, if suitable.
        var flight = relevantFlights[0];
        if (pnr.amount <= flight.capacity) {
            // Assign current PNR to chosen flight.
            results.push({ 'pnr': pnr.id, 'flight': flight.id });
            flights = updateFlight(flights, flight.id, pnr.amount);
        }
    })

    return results;
}

/**
 * Update the flights list by a given id of a flight and
 * the amount of passengers that were last assigend to it.
 */
function updateFlight(flights, id, amount) {
    return flights
        .map((flight) => {
            if (flight.id == id) {
                flight.capacity = flight.capacity - amount;
            }

            return flight;
        })
        .filter((flight) => {
            return flight.capacity > 0;
        })
        .sort((a, b) => {
            return (a.capacity > b.capacity) ? -1 : 1;
        })
}



app.listen(PORT, () => console.log(`Rubiq flight app listening at http://localhost:${PORT}`));
