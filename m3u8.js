const { TS_CLIP_DURATION, getSeq, getUrl, getKeysLatest, getKeysBetween } = require('./s3_client');

async function getLivePlaylist(cameraId, nowTime) {
  let m3u8 = "";
  let keys = await getKeysLatest(cameraId, nowTime);
  console.debug('live keys: ' + keys);
  if (keys.length == 0) {
    m3u8 += '#EXTM3U\r\n';
    m3u8 += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION.toString() + '\r\n';
    return m3u8;
  }

  let seq = getSeq(keys[0]);

  m3u8 += '#EXTM3U\r\n';
  m3u8 += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION.toString() + '\r\n';
  m3u8 += '#EXT-X-MEDIA-SEQUENCE:' + seq + '\r\n';

  for (let key of keys) {
    const url = await getUrl(key);
    m3u8 += '#EXTINF:' + TS_CLIP_DURATION.toString() + ',\r\n';
    m3u8 += url + '\r\n';
  }
  return m3u8;
}

async function getMediaPlaylist(cameraId, startTime, endTime) {
  let m3u8 = "";
  let keys = await getKeysBetween(cameraId, startTime, endTime);
  console.debug('replay keys: ' + keys);
  if (keys.length == 0) {
    m3u8 += '#EXTM3U\r\n';
    m3u8 += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION.toString() + '\r\n';
    m3u8 += '#EXT-X-PLAYLIST-TYPE:VOD\r\n';
    m3u8 += '#EXT-X-ENDLIST\r\n';
    return m3u8;
  }

  m3u8 += '#EXTM3U\r\n';
  m3u8 += '#EXT-X-TARGETDURATION:' + TS_CLIP_DURATION.toString() + '\r\n';
  m3u8 += '#EXT-X-PLAYLIST-TYPE:VOD\r\n';
  for (let key of keys) {
    const url = await getUrl(key);
    m3u8 += '#EXTINF:' + TS_CLIP_DURATION.toString() + ',\r\n';
    m3u8 += url + '\r\n';
  }
  m3u8 += '#EXT-X-ENDLIST\r\n';
  return m3u8;
}

module.exports = {
  getLivePlaylist,
  getMediaPlaylist
}
