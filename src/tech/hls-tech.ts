import { TechInterface } from './tech-interface';
import Hls from 'hls.js';
import { Quality } from '../models/quality';

export class HlsTech implements TechInterface {
    url: string = '';
    player: any = null;
    headers: any = null;
    is_live: boolean = false;
    eventHandler: any = null;
    videoElement: HTMLMediaElement = document.createElement('video');
    autoplay: boolean = false;
    onLicenseError: any = null;
    recover_take: number = 0;

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
        this.videoElement = videoElement;

        this.player = new Hls({
            enableWorker: false,
            debug: debug,
    
            xhrSetup: (xhr: any, url: string) => {
                for(var header_name in this.headers) {
                    xhr.setRequestHeader(header_name, this.headers[header_name]);
                }
            }
        });

        this.eventHandler = eventHandler;

        this.player.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
            data.type = event;
            this.eventHandler(data);
    
            if(this.autoplay === true) {
                this.videoElement.play();
            }
        });

        this.player.on(Hls.Events.LEVEL_LOADED, (event: any, data: any) => {
            if(data.details != undefined && data.details.type !== 'VOD') {
                this.is_live = true;
            }
    
            data.type = event;
            this.eventHandler(data);
        });
    
        this.player.on(Hls.Events.ERROR, (event: any, data: any) => {
            data.type = event;
            console.info(event, data);
    
            if(data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.MEDIA_ERROR: 
                        console.error("Media error");
                        this.eventHandler(data);
    
                        if(this.recover_take == 1) {
                            this.player.swapAudioCodec();
                        }
    
                        this.player.recoverMediaError();
                        this.recover_take++;
                        break;
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error("Network error");
                        this.eventHandler(data);
                        this.player.startLoad();
                        break;
                    default:
                        console.error("Unrecoverable error");
                        this.eventHandler(data);
                        this.destroy();
                        break;
                }
            }
        });

        this.player.loadSource(this.url);
        this.player.attachMedia(this.videoElement);
    }

    getPlayer() {
        return this.player;
    }

    isLive() {
        return this.is_live;
    }

    getAudioTracks() {
        var tracks = this.player.audioTracks;
        var tr = [];
        
        for(var i = 0; i < tracks.length; i++) {
            tr.push({
                name: tracks[i].name,
                index: i,
                lang: tracks[i].lang
            });
        }
        
        return tr;
    }

    setAudioTrack(index: number) {
        this.player.audioTrack = index + 1;
    }

    getQualities(): Quality[] {
        var u = this.player.levels;
        var bitrates = [];

        for(var i = 0; i < u.length; i++) {
            var b = {
                index: 0,
                bitrate: 0,
                bitrateStr: '0k',
                width: 0,
                height: 0,
            };
            
            b.index = u[i].level != undefined ? u[i].level : i;
            b.bitrate = u[i].bitrate;
            b.bitrateStr = Math.floor(b.bitrate / 1024) + 'k';
            b.height = u[i].height;
            bitrates.push(b);
        }

        return bitrates;
    }

    setQuality(index: number) {
        this.player.currentLevel = index;
    }

    getCurrentQuality(): Quality {
        console.log(this.player.currentLevel);

        return {
            index: 0,
            bitrate: 0,
            bitrateStr: '0k',
            height: 0,
            width: 0
        };
    }

    setMaxQuality() {
        var qualities = this.getQualities();
        var maxQualityIndex = -1;
        var bitrate = 0;

        for(var i = 0; i < qualities.length; i++) {
            if(qualities[i].bitrate > bitrate) {
                bitrate = qualities[i].bitrate;
                maxQualityIndex = i;
            }
        }

        this.setQuality(maxQualityIndex);
    }

    destroy() {
        if(this.player != null) {
            this.player.destroy();
            this.player = null;
        }
    }
}