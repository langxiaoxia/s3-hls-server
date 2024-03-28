public class m3u8 {
  // Live Playlist
  public static String GetLivePlaylist(Integer count, Integer[] seqs, Integer[] infs, String[] urls, Integer target) {
    String playhead = "#EXTM3U\r\n";

    // check array length
    if (count < 1) {
      System.out.println(String.format("invalid count: %d", count));
      return playhead;
    }
    if (count != seqs.length || count != infs.length || count != urls.length) {
      System.out.println(String.format("invalid length: count=%d, seqs=%d, infs=%d, urls=%d", count, seqs.length, infs.length, urls.length));
      return playhead;
    }

    // check EXT-X-TARGETDURATION
    if (target < 1) {
      System.out.println(String.format("invalid TARGETDURATION: %d", target));
      return playhead;
    }

    // check EXT-X-MEDIA-SEQUENCE
    if (seqs[0] < 0) {
      System.out.println(String.format("invalid SEQUENCE: %d", seqs[0]));
      return playhead;
    }

    playhead += "#EXT-X-TARGETDURATION:" + String.valueOf(target) + "\r\n";
    playhead += "#EXT-X-VERSION:1\r\n";
    playhead += "#EXT-X-MEDIA-SEQUENCE:" + String.valueOf(seqs[0]) + "\r\n";
    String playlist = playhead;

    for (int i = 0; i < count; i++) {
      // check array element
      if (seqs[i] < 0 || infs[i] < 1 || urls[i].isEmpty()) {
        System.out.println(String.format("invalid element: seq=%d, inf=%d, url=%s", seqs[i], infs[i], urls[i]));
        playlist = playhead;
        break;
      }

      // check EXT-X-DISCONTINUITY
      if (i > 0) {
        if (seqs[i] <= seqs[i-1]) {
          System.out.println(String.format("invalid DISCONTINUITY between [%d, %d]", seqs[i-1], seqs[i]));
          playlist = playhead;
          break;
        }

        for (int d = seqs[i-1]+1; d < seqs[i]; d++) {
          System.out.println(String.format("DISCONTINUITY [%d] between [%d, %d]", d, seqs[i-1], seqs[i]));
          playlist += "#EXT-X-DISCONTINUITY\r\n";
        }
      }

      playlist += "#EXTINF:" + String.valueOf(infs[i]) + ",\r\n";
      playlist += urls[i] + "\r\n";
  }

    return playlist;
  }

  // VoD Playlist
  public static String GetVoDPlaylist(Integer count, Integer[] infs, String[] urls, Integer target) {
    String playhead = "#EXTM3U\r\n";
    playhead += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";

    // check array length
    if (count < 1) {
      System.out.println(String.format("invalid count: %d", count));
      return playhead;
    }
    if (urls.length != count || infs.length != count) {
      System.out.println(String.format("invalid length: count=%d, infs=%d, urls=%d", count, infs.length, urls.length));
      return playhead;
    }

    // check EXT-X-TARGETDURATION
    if (target < 1) {
      System.out.println(String.format("invalid TARGETDURATION: %d", target));
      return playhead;
    }

    playhead += "#EXT-X-TARGETDURATION:" + String.valueOf(target) + "\r\n";
    playhead += "#EXT-X-VERSION:1\r\n";
    playhead += "#EXT-X-MEDIA-SEQUENCE:0\r\n";
    String playlist = playhead;

    for (int i = 0; i < count; i++) {
      // check array element
      if (infs[i] < 1 || urls[i].isEmpty()) {
        System.out.println(String.format("invalid element: inf=%d, url=%s", infs[i], urls[i]));
        playlist = playhead;
        break;
      }

      playlist += "#EXTINF:" + String.valueOf(infs[i]) + ",\r\n";
      playlist += urls[i] + "\r\n";
    }

    playlist += "#EXT-X-ENDLIST\r\n";
    return playlist;
  }
}
