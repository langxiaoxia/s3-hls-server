const http = require('http');
const url = require('url');

const { writeLivePlaylist, writeMediaPlaylist } = require('./s3_client');

function writeServerResponse(response, statusCode, statusMessage) {
    response.writeHead(statusCode);
    response.write(statusMessage);
    response.end(); 
}

const requestListener = function (request, response) {
    let nowTime = new Date();
    console.log(`[${nowTime.toISOString()}] ${request.url}`);

    var playlistType = url.parse(request.url, true).pathname;
    var cameraId = url.parse(request.url, true).query['camera_id'];
    if (playlistType === '/live.m3u8') {
        if (cameraId) {
            writeLivePlaylist(response, cameraId, nowTime);
        } else {
            writeServerResponse(response, 403, 'Invalid camera_id!');
        }
    } else if (playlistType === '/replay.m3u8') {
        if (cameraId) {
            var startStr = url.parse(request.url, true).query['start'];
            var endStr = url.parse(request.url, true).query['end'];
            if (startStr && endStr) {
                writeMediaPlaylist(response, cameraId, new Date(startStr), new Date(endStr));
            } else {
                writeServerResponse(response, 403,'Invalid start or end!');
            }
        } else {
            writeServerResponse(response, 403, 'Invalid camera_id!');
        }
    } else {
        writeServerResponse(response, 403, 'Invalid playlist:' + playlistType);
    }
}

const httpServer = http.createServer(requestListener);

module.exports = {
    httpServer
}
