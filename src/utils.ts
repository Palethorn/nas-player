export class Utils {
    static calcBitrateStr(bitrate: number): string {
        var b = bitrate + 'bps';

        if(bitrate > 1000) {
            b = Math.floor(bitrate / 1000) + 'kbps';
        }

        if(bitrate > 1000000) {
            b = Math.floor(bitrate / 1000000) + 'mbps';
        }

        return b;
    }
}