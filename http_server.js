const https = require('https');
const fs = require('fs');
const url = require('url');
const moment = require('moment');

const { writeLivePlaylist, writeMediaPlaylist } = require('./s3_client');

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

function writeServerResponse(response, statusCode, statusMessage) {
    response.writeHead(statusCode);
    response.write(statusMessage);
    response.end(); 
}

const requestListener = async function (request, response) {
    const nowTime = new Date();
    console.log(`[${nowTime.toISOString()}] ${request.url}`);

    const playlistType = url.parse(request.url, true).pathname;
    const cameraId = url.parse(request.url, true).query['camera_id'];
    if (playlistType === '/live.m3u8') {
        if (cameraId) {
            let startStr = url.parse(request.url, true).query['start'];
            if (startStr) {
                if (moment(startStr, 'YYYY-MM-DD hh:mm:ss', false).isValid()) {
                    startStr += '.000Z';
                    await writeLivePlaylist(response, cameraId, new Date(startStr));
                } else {
                    writeServerResponse(response, 403, 'Invalid start!' + startStr);
                }
            } else {
                await writeLivePlaylist(response, cameraId, nowTime);
            }
        } else {
            writeServerResponse(response, 403, 'Missing camera_id!');
        }
    } else if (playlistType === '/replay.m3u8') {
        if (cameraId) {
            let startStr = url.parse(request.url, true).query['start'];
            let endStr = url.parse(request.url, true).query['end'];
            if (startStr && endStr) {
                if (moment(startStr, 'YYYY-MM-DD hh:mm:ss', true).isValid() && moment(endStr, 'YYYY-MM-DD hh:mm:ss', true).isValid()) {
                    // take start & end as UTC.
                    startStr += '.000Z';
                    endStr += '.000Z';
                    await writeMediaPlaylist(response, cameraId, new Date(startStr), new Date(endStr));
                } else {
                    writeServerResponse(response, 403, 'Invalid start or end!');
                }
            } else {
                writeServerResponse(response, 403, 'Missing start or end!');
            }
        } else {
            writeServerResponse(response, 403, 'Missing camera_id!');
        }
    } else {
        writeServerResponse(response, 403, 'Invalid playlist');
    }
}

const httpServer = https.createServer(options, requestListener);

module.exports = {
    httpServer
}
