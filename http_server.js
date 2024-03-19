const https = require('https');
const fs = require('fs');
const url = require('url');
const moment = require('moment');

const { getLivelist, getReplaylist } = require('./m3u8');

const host = '0.0.0.0';
const port = 8081;
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
  console.info(`[${nowTime.toISOString()}] ${request.url}`);
  const playlistType = url.parse(request.url, true).pathname;
  const cameraId = url.parse(request.url, true).query['camera_id'];
  if (playlistType === '/live.m3u8') {
    if (cameraId) {
      let startStr = url.parse(request.url, true).query['start'];
      if (startStr) {
        if (moment(startStr, 'YYYY-MM-DD hh:mm:ss', false).isValid()) {
          startStr += '.000Z';
          const m3u8 = await getLivelist(cameraId, new Date(startStr));
          console.info(m3u8);
          response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
          response.write(m3u8);
          response.end();
        } else {
          writeServerResponse(response, 403, 'Invalid start!' + startStr);
        }
      } else {
        const m3u8 = await getLivelist(cameraId, nowTime);
        console.info(m3u8);
        response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        response.write(m3u8);
        response.end();
      }
    } else {
      writeServerResponse(response, 403, 'Missing camera_id!');
    }
  } else if (playlistType === '/replay.m3u8') {
    if (cameraId) {
      let startStr = url.parse(request.url, true).query['start'];
      let endStr = url.parse(request.url, true).query['end'];
      if (startStr && endStr) {
        if (moment(startStr, 'YYYY-MM-DD hh:mm:ss', false).isValid() && moment(endStr, 'YYYY-MM-DD hh:mm:ss', false).isValid()) {
          // take start & end as UTC.
          startStr += '.000Z';
          endStr += '.000Z';
          const m3u8 = await getReplaylist(cameraId, new Date(startStr), new Date(endStr));
          console.info(m3u8);
          response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
          response.write(m3u8);
          response.end();
        } else {
          writeServerResponse(response, 403, 'Invalid start or end!');
        }
      } else {
        writeServerResponse(response, 403, 'Missing start or end!');
      }
    } else {
      writeServerResponse(response, 403, 'Missing camera_id!');
    }
  } else if (playlistType === "/favicon.ico") {
    response.end();
  } else {
    writeServerResponse(response, 403, 'Invalid playlist!');
  }
}

console.debug('server creating...');
const httpServer = https.createServer(options, requestListener);
console.debug('server created');

console.debug('server listening...');
httpServer.listen(port, host, () => {
  let nowTime = new Date();
  console.log(`[${nowTime}] Server running at https://${host}:${port}/`);
});

module.exports = {
  httpServer
}
