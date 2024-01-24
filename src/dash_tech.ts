import { AudioTrack } from './models/audio-track';
import { Quality } from './models/quality';
import { Tech } from './tech';
import { MediaPlayer } from 'dashjs'

export class DashTech implements Tech {
    url: string = '';
    player: any = null;
    is_live: boolean = false;
    autoplay: boolean = false;
    eventHandler: any = null;
    videoElement: HTMLMediaElement|null = null;
    onLicenseError: any = null;
    headers: any = null;

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
        this.url = url;
        this.headers = headers;
        this.autoplay = autoplay;
        this.videoElement = videoElement;
        this.onLicenseError = onLicenseError;

        this.player = MediaPlayer().create();
        this.eventHandler = eventHandler;

        if(typeof this.player.setFastSwitchEnabled != 'undefined') {
            this.player.setFastSwitchEnabled(true);
        }

        if(typeof this.player.getDebug().setLogToBrowserConsole !== 'undefined') {
            this.player.getDebug().setLogToBrowserConsole(debug);
        }

        if(protData != null) {
            this.player.getProtectionController().setRobustnessLevel('SW_SECURE_CRYPTO')
            this.player.setProtectionData(protData);
        }

        this.player.on(MediaPlayer.events.METRIC_CHANGED, (e: any) => {
            eventHandler(e);
        });
    
        this.player.on(MediaPlayer.events.STREAM_INITIALIZED, (e: any) => {
            eventHandler(e);
        });
    
        this.player.on(MediaPlayer.events.MANIFEST_LOADED, (e: any) => {
            if(e.data.type == 'dynamic') {
                this.is_live = true;
            }
    
            eventHandler(e);
        });
    
        this.player.on(MediaPlayer.events.ERROR, (e: any) => {
            console.error(e.error.message);
    
            if('undefined' !== typeof(eventHandler)) {
                eventHandler(e);
            } else {
                console.warn('eventHandler is undefined');
            }
    
            if(e.error.code == 111) {
                this.onLicenseError();
            }
    
            if(e.error == 'key_session') {
                this.onLicenseError();
                return;
            }
    
            this.destroy();
        });
    
        var requestHeadersMod = (xhr: any) => {
            for(var header_name in this.headers) {
                xhr.setRequestHeader(header_name, this.headers[header_name]);
            }

            return xhr;
        }

        var requestUrlMod = (xhr: any) => {
            return this.url;
        }

        if(null != this.headers) {
            this.player.extend("RequestModifier", () => {
                    return {
                        modifyRequestHeader: requestHeadersMod,
                        modifyRequestURL: requestUrlMod
                    };
                },
                true
            );
        }
    
        this.player.label = "dash";
        this.player.initialize(this.videoElement, this.url, this.autoplay);
    }

    getPlayer() {
        return this.player;
    }

    isLive() {
        return this.is_live;
    }

    getAudioTracks() : AudioTrack[] {
        var u = this.player.getTracksFor('audio');
        var audio_list = [];

        for(var i = 0; i < u.length; i++) {

            if('' == u[i].lang) {
                u[i].lang = 'Audio ' + i;
            }

            if('' == u[i].name) {
                u[i].name = 'Audio ' + i;
            }

            audio_list.push({
                lang: u[i].lang,
                name: u[i].name,
                index: u[i].index
            });
        }

        return audio_list;
    }

    setAudioTrack(index: number) {
        var tracks = this.player.getTracksFor('audio');

        for(var i = 0; i < tracks.length; i++) {
            if(tracks[i].index == index) {
                this.player.setCurrentTrack(tracks[i]);
                return;
            }
        }
    }

    getQualities(): Quality[] {
        var u = this.player.getBitrateInfoListFor("video");
        var bitrates = [];

        for(var i = 0; i < u.length; i++) {
            var b = { index: 0, bitrate: 0, bitrateStr: '0k', width: 0, height: 0 };
            b.index = u[i].qualityIndex;
            b.bitrate = u[i].bitrate;
            b.bitrateStr = Math.floor(u[i].bitrate / 1024) + 'k';
            b.width = u[i].width;
            b.height = u[i].height;
            bitrates.push(b);
        }

        return bitrates;
    }

    setQuality(index: any) {
        index = parseInt(index);

        if(index == -1) {
            if(typeof this.player.setAutoSwitchQuality !== 'undefined') {
                this.player.setAutoSwitchQuality(true);
            } else if(typeof this.player.setAutoSwitchQualityFor !== 'undefined') {
                this.player.setAutoSwitchQualityFor('video', true);
            } else if(typeof this.player.updateSettings !== 'undefined') {
                this.player.updateSettings({
                    'streaming': {
                        'abr': {
                            'autoSwitchBitrate': {
                                'video': true
                            }
                        }
                    }
                });
            }

            return;
        }

        if(typeof this.player.setAutoSwitchQuality !== 'undefined') {
            this.player.setAutoSwitchQuality(false);
        } else if(typeof this.player.setAutoSwitchQualityFor !== 'undefined') {
            this.player.setAutoSwitchQualityFor('video', false);
        } else if(typeof this.player.updateSettings !== 'undefined') {
            this.player.updateSettings({
                'streaming': {
                    'abr': {
                        'autoSwitchBitrate': {
                            'video': false
                        }
                    }
                }
            });
        }

        this.player.setQualityFor("video", index);
    }

    getCurrentQuality(): Quality {
        var q = this.player.getQualityFor('video');
        var qualities = this.getQualities();

        for(var quality in qualities) {
            if(q == qualities[quality].index) {
                return qualities[quality];
            }
        }

        var b = { index: 0, bitrate: 0, bitrateStr: '0k', width: 0, height: 0 };
        b.index = q.qualityIndex;
        b.bitrate = q.bitrate;
        b.bitrateStr = Math.floor(q.bitrate / 1000) + 'k'; 
        b.width = q.width;
        b.height = q.height;

        return b;
    }

    setMaxQuality() {
        var qualities = this.getQualities();
        var quality = qualities[0];
        
        for(var i = 1; i < qualities.length; i++) {
            if(qualities[i].bitrate > quality.bitrate) {
                quality = qualities[i];
            }
        }

        this.setQuality(quality.index);
    }

    destroy() {
        if(this.player != null) {
            this.player.reset();
            this.player = null;
        }
    }
}
