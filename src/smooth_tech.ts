import { MediaPlayer } from "hasplayer.js";
import { Tech } from "./tech";
import { Quality } from "./models/quality";

export class SmoothTech implements Tech {
    player: MediaPlayer;

    init(
        videoElement: HTMLMediaElement,
        url: string,
        autoplay: boolean,
        debug: boolean,
        eventHandler: any,
        headers: any,
        protData: any,
        onLicenseError: any
    ) {
        var stream = {
            url: url
        };

        this.player = new MediaPlayer();
        this.player.init(videoElement);
        this.player.load(stream);
        this.player.addEventListener("error", eventHandler);
        this.player.addEventListener("warning", eventHandler);
        this.player.addEventListener("cueEnter", eventHandler);
        this.player.addEventListener("cueExit", eventHandler);
        this.player.addEventListener("play_bitrate", eventHandler);
        this.player.addEventListener("download_bitrate", eventHandler);
        this.player.addEventListener("manifestUrlUpdate", eventHandler);
        this.player.addEventListener("metricAdded", eventHandler);
        this.player.addEventListener("metricChanged", eventHandler);
        this.player.addEventListener("bufferLevel_updated", eventHandler);
        this.player.addEventListener("state_changed", eventHandler);
        this.player.addEventListener("loadeddata", eventHandler);
        this.player.addEventListener("play", eventHandler);
        this.player.addEventListener("pause", eventHandler);
        this.player.addEventListener("timeupdate", eventHandler);
        this.player.addEventListener("volumechange", eventHandler);
    }


    getPlayer() {
        return this.player;
    }

    isLive() {
        return this.player.isLive();
    }

    getAudioTracks() {
        return [];
    }

    setAudioTrack() {
    }

    getQualities() {
        var u = this.player.getVideoBitrates();

        var bitrates: any = [];

        for(var i = 0; i < u.length; i++) {
            var b = {
                index: 0,
                bitrate: 0
            };

            b.index = i;
            b.bitrate = u[i];
            bitrates.push(b);
        }

        return bitrates;
    }

    setQuality(index) {
        if(index == -1) {
            this.player.setAutoSwitchQuality(true);
            return;
        }

        this.player.setAutoSwitchQuality(false);
        this.player.setQualityFor('video', index);
    }

    setMaxQuality(): void {
        
    }

    getCurrentQuality(): Quality {
        return {
            index: 0,
            width: 0,
            height: 0,
            bitrate: 0,
            bitrateStr: '0k'
        }
    }

    destroy() {
        if(this.player != null) {
            this.player = null;
        }
    }
}
