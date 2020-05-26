import express from 'express';

const fs = require('fs');
const csv = require('csv-parser')
const multer = require('multer');
const allocate = require('./allocate');
const bodyParser = require('body-parser');

const app = express();

// Defines the uploaded files destination.
const upload = multer({ dest: 'data/csv/' });

// Defines the classifier keyword for parsing PNR's vs flights.
const PNR_CLASSIFIER = 'PNR';

const PORT = 4000;
const CLIENT_PORT = 3000;

app.use(function (req, res, next) {
    // Allow requesting code from the client local host origin to access the resource
    res.setHeader('Access-Control-Allow-Origin', `http://localhost:${CLIENT_PORT}`);

    next();
});

app.use(bodyParser.urlencoded({ extended:false }))

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


app.listen(PORT, () => console.log(`Rubiq flight app listening at http://localhost:${PORT}`));
