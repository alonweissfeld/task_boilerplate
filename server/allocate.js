
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

    pnrs.forEach((pnr) => {
        // Get the flight suitable for the current PNR, by comparing
        // the origin and destination.
        var relevantFlights = flights.filter((flight) => {
            return (flight.origin == pnr.origin) && (flight.dest == pnr.dest);
        })

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
function updateFlight (flights, id, amount) {
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

module.exports = allocate;
