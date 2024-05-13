const use_gzip = true;
const append_num = 3; // EVENT playlist

const https = require('https');
const fs = require('fs');
const url = require('url');
const moment = require('moment');
const zlib = require('zlib');

const { getLivePlaylist, getVoDPlaylist, getEventPlaylist } = ((require.main === module) ? require('./m3u8_jar') : require('./m3u8'));

const host = '0.0.0.0';
const port = 8081;
const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

const mime_type = 'application/vnd.apple.mpegURL';
const time_format = 'YYYY-MM-DD HH:mm:ss'

function writeServerResponse(response, statusCode, statusMessage) {
  response.writeHead(statusCode);
  response.write(statusMessage);
  response.end();
}

function getTime(timeStr, defaultTime) {
  if (timeStr) {
    // timeStr must have valid format
    if (!moment(timeStr, time_format, true).isValid()) {
      return null;
    }
    // take timeStr as UTC.
    return new Date(timeStr + '.000Z');
  }
  return defaultTime;
}

const requestListener = async function (request, response) {
  const nowTime = new Date();
  var connKey = request.socket.remoteAddress + ':' + request.socket.remotePort.toString();
  console.info(`[${connKey}] [${nowTime.toISOString()}] ${request.url} <--------`);

  const playlistType = url.parse(request.url, true).pathname;
  var cameraId = url.parse(request.url, true).query['camera_id'];
  if (!cameraId) {
    cameraId = 'demo';
  }

  var playlist = {m3u8: null, seq: -1};
  if (playlistType === '/live.m3u8') {
    var lastSeq = connectionStore[connKey].lastSeq;
    playlist = await getLivePlaylist(cameraId, nowTime, lastSeq);
    if (playlist.m3u8 === null) {
      writeServerResponse(response, 404, 'Not found playlist!');
      return;
    }
    connectionStore[connKey].lastSeq = playlist.seq;
    console.info(`[${connKey}] [${new Date().toISOString()}] live ${lastSeq} -> ${playlist.seq} -------->`);
    response.setHeader('Last-Modified', nowTime.toUTCString());
  } else if (playlistType === '/vod.m3u8') {
    let startTime = getTime(url.parse(request.url, true).query['start'], new Date(nowTime.getTime() - 600 * 1000));
    if (!startTime) {
      writeServerResponse(response, 403, 'Invalid start time!');
      return;
    }
    let endTime = getTime(url.parse(request.url, true).query['end'], nowTime);
    if (!endTime) {
      writeServerResponse(response, 403, 'Invalid end time!');
      return;
    }
    console.info(`[${connKey}] vod ${startTime.toISOString()} ~ ${endTime.toISOString()}`);
    playlist = await getVoDPlaylist(cameraId, startTime, endTime);
    if (playlist.m3u8 === null) {
      writeServerResponse(response, 404, 'Not found playlist!');
      return;
    }
    console.info(`[${connKey}] [${new Date().toISOString()}] vod ${playlist.seq} -------->`);
  } else if (playlistType === '/event.m3u8') {
    var lastM3U8 = connectionStore[connKey].lastM3U8;
    var lastSeq = connectionStore[connKey].lastSeq;
    if (lastSeq == -1) {
      connectionStore[connKey].startTime = getTime(url.parse(request.url, true).query['start'], new Date(nowTime.getTime() - 600 * 1000));
      connectionStore[connKey].endTime = getTime(url.parse(request.url, true).query['end'], nowTime);
    }
    const startTime = connectionStore[connKey].startTime;
    const endTime = connectionStore[connKey].endTime;
    if (!startTime) {
      writeServerResponse(response, 403, 'Invalid start time!');
      return;
    }
    if (!endTime) {
      writeServerResponse(response, 403, 'Invalid end time!');
      return;
    }
    console.info(`[${connKey}] event ${startTime.toISOString()} ~ ${endTime.toISOString()}`);
    playlist = await getEventPlaylist(cameraId, startTime, endTime, lastM3U8, lastSeq, append_num);
    if (playlist.m3u8 === null) {
      writeServerResponse(response, 404, 'Not found playlist!');
      return;
    }
    connectionStore[connKey].lastM3U8 = playlist.m3u8;
    connectionStore[connKey].lastSeq = playlist.seq;
    console.info(`[${connKey}] [${new Date().toISOString()}] event ${lastSeq} -> ${playlist.seq} -------->`);
  } else if (playlistType === "/favicon.ico") {
    response.end();
    return;
  } else {
    writeServerResponse(response, 403, 'Invalid playlist type!');
    return;
  }

  if (use_gzip) {
    playlist.m3u8 = zlib.gzipSync(playlist.m3u8);
    response.setHeader('Content-Encoding', 'gzip');
  }
  response.setHeader('Content-Type', mime_type);
  response.setHeader('Content-Length', playlist.m3u8.length);
  response.setHeader('Connection', 'keep-alive');
  response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
  response.write(playlist.m3u8);
  response.end();
}

// console.debug(`[${process.pid}] server creating...`);
const httpServer = https.createServer(options, requestListener);
// console.debug(`[${process.pid}] server created`);

httpServer.keepAliveTimeout = 0; // http long connection!!!

let connectionStore = {};
httpServer.on('connection', function (socket) {
  const connTime = new Date();
  const connKey = socket.remoteAddress + ':' + socket.remotePort.toString();
  console.info(`[${connKey}] [${connTime.toISOString()}] connection`);
  connectionStore[connKey] = {lastM3U8: null, lastSeq: -1, startTime: null, endTime: null};
  socket.on('close', () => {
    const closeTime = new Date();
    console.log(`[${connKey}] [${closeTime.toISOString()}] close`);
    setTimeout(() => {
      const cleanTime = new Date();
      console.log(`[${connKey}] [${cleanTime.toISOString()}] clean`);
      connectionStore[connKey] = null;
    }, 5000);
  });
});

if (require.main === module) {
  // console.debug(`[${process.pid}] server starting...`);
  httpServer.listen(port, host, () => {
    let nowTime = new Date();
    console.log(`[${process.pid}] [${nowTime.toISOString()}] server running at https://${host}:${port}/`);
  });
  // console.debug(`[${process.pid}] server started`);
}

module.exports = {
  httpServer,
  port,
  host,
  append_num,
}
