const {parallelScan} = require('@shelf/dynamodb-parallel-scan');

async function getTrips(){
    let params = {
        TableName: process.env.dynamodb_table_name,
        ProjectionExpression: "trip_id, etd, driver_id, available_seats, route_points"
    };
    let data = await parallelScan(params, {concurrency: 1000});
    return data;
}

exports.handler = async (event) => {
    let query = await getTrips();
    const response = {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify(query)
    };
    return response;
};
