public class m3u8 {
  // Live Playlist
  public static String GetLivePlaylist(Integer target, Integer count, Integer[] seqs, Integer[] infs, String[] urls) {
    // check EXT-X-TARGETDURATION
    if (target < 1) {
      System.out.println(String.format("invalid TARGETDURATION: %d", target));
      return "";
    }

    // check array length
    if (count < 1) {
      System.out.println(String.format("invalid count: %d", count));
      return "";
    }
    if (count != seqs.length || count != infs.length || count != urls.length) {
      System.out.println(String.format("invalid length: count=%d, seqs=%d, infs=%d, urls=%d", count, seqs.length, infs.length, urls.length));
      return "";
    }

    // check EXT-X-MEDIA-SEQUENCE
    if (seqs[0] < 0) {
      System.out.println(String.format("invalid SEQUENCE: %d", seqs[0]));
      return "";
    }

    String playlist = "#EXTM3U\r\n";
    playlist += "#EXT-X-VERSION:1\r\n";
    playlist += "#EXT-X-TARGETDURATION:" + String.valueOf(target) + "\r\n";
    playlist += "#EXT-X-MEDIA-SEQUENCE:" + String.valueOf(seqs[0]) + "\r\n";

    for (int i = 0; i < count; i++) {
      // check array element
      if (seqs[i] < 0 || infs[i] < 1 || urls[i].isEmpty()) {
        System.out.println(String.format("invalid element: seq=%d, inf=%d, url=%s", seqs[i], infs[i], urls[i]));
        return "";
      }

      // check EXT-X-DISCONTINUITY
      if (i > 0) {
        if (seqs[i] <= seqs[i-1]) {
          System.out.println(String.format("invalid DISCONTINUITY between [%d, %d]", seqs[i-1], seqs[i]));
          return "";
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

  // VOD Playlist
  public static String GetVoDPlaylist(Integer target, Integer seq, Integer count, Integer[] infs, String[] urls) {
    // check EXT-X-TARGETDURATION
    if (target < 1) {
      System.out.println(String.format("invalid TARGETDURATION: %d", target));
      return "";
    }

    // check EXT-X-MEDIA-SEQUENCE
    if (seq < 0) {
      System.out.println(String.format("invalid SEQUENCE: %d", seq));
      return "";
    }

    // check array length
    if (count < 1) {
      System.out.println(String.format("invalid count: %d", count));
      return "";
    }
    if (urls.length != count || infs.length != count) {
      System.out.println(String.format("invalid length: count=%d, infs=%d, urls=%d", count, infs.length, urls.length));
      return "";
    }

    String playlist = "#EXTM3U\r\n";
    playlist += "#EXT-X-VERSION:1\r\n";
    playlist += "#EXT-X-PLAYLIST-TYPE:VOD\r\n";
    playlist += "#EXT-X-TARGETDURATION:" + String.valueOf(target) + "\r\n";
    playlist += "#EXT-X-MEDIA-SEQUENCE:" + String.valueOf(seq) + "\r\n";

    for (int i = 0; i < count; i++) {
      // check array element
      if (infs[i] < 1 || urls[i].isEmpty()) {
        System.out.println(String.format("invalid element: inf=%d, url=%s", infs[i], urls[i]));
        return "";
      }

      playlist += "#EXTINF:" + String.valueOf(infs[i]) + ",\r\n";
      playlist += urls[i] + "\r\n";
    }

    playlist += "#EXT-X-ENDLIST\r\n";
    return playlist;
  }

  // EVENT Playlist
  public static String GetEventPlaylist(Integer target, Integer seq, Integer count, Integer[] infs, String[] urls, Boolean head, Boolean end) {
    // check EXT-X-TARGETDURATION
    if (target < 1) {
      System.out.println(String.format("invalid TARGETDURATION: %d", target));
      return "";
    }

    // check EXT-X-MEDIA-SEQUENCE
    if (seq < 0) {
      System.out.println(String.format("invalid SEQUENCE: %d", seq));
      return "";
    }

    // check array length
    if (count < 1) {
      System.out.println(String.format("invalid count: %d", count));
      return "";
    }
    if (urls.length != count || infs.length != count) {
      System.out.println(String.format("invalid length: count=%d, infs=%d, urls=%d", count, infs.length, urls.length));
      return "";
    }

    String playlist = "";
    if (head) {
      playlist += "#EXTM3U\r\n";
      playlist += "#EXT-X-VERSION:1\r\n";
      playlist += "#EXT-X-PLAYLIST-TYPE:EVENT\r\n";
      playlist += "#EXT-X-TARGETDURATION:" + String.valueOf(target) + "\r\n";
      playlist += "#EXT-X-MEDIA-SEQUENCE:" + String.valueOf(seq) + "\r\n";
    }

    for (int i = 0; i < count; i++) {
      // check array element
      if (infs[i] < 1 || urls[i].isEmpty()) {
        System.out.println(String.format("invalid element: inf=%d, url=%s", infs[i], urls[i]));
        return "";
      }

      playlist += "#EXTINF:" + String.valueOf(infs[i]) + ",\r\n";
      playlist += urls[i] + "\r\n";
    }

    if (end) {
      playlist += "#EXT-X-ENDLIST\r\n";
    }
    return playlist;
  }
}
