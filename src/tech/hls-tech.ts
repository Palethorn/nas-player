import { TechInterface } from './tech-interface';
import Hls from 'hls.js';
import { Quality } from '../models/quality';
import { Logger } from 'nas-logger';
import { Utils } from '../utils';

export class HlsTech implements TechInterface {
    url: string = '';
    player: any = null;
    headers: any = null;
    logger: Logger = new Logger('HlsTech');
    recover_take: number = 0;
    is_live: boolean = false;
    eventHandler: any = null;
    autoplay: boolean = false;
    onLicenseError: any = null;
    videoElement: HTMLMediaElement = document.createElement('video');

    manifestParsedHandler: any = (event: any, data: any) => {
        data.type = event;
        this.eventHandler(data);

        if(this.autoplay === true) {
            this.videoElement.play();
        }
    }

    levelLoadedHandler: any = (event: any, data: any) => {
        if(data.details != undefined && data.details.type !== 'VOD') {
            this.is_live = true;
        }

        data.type = event;
        this.eventHandler(data);
    }

    errorHandler: any = (event: any, data: any) => {
        data.type = event;
        this.logger.i({ event, data });
        this.eventHandler(data);

        if(data.fatal) {
            switch(data.type) {
                case Hls.ErrorTypes.MEDIA_ERROR: 
                    this.logger.e("Media error");
                    
                    if(this.recover_take == 1) {
                        this.player.swapAudioCodec();
                    }

                    this.player.recoverMediaError();
                    this.recover_take++;
                    break;
                case Hls.ErrorTypes.NETWORK_ERROR:
                    this.logger.e("Network error");
                    this.player.startLoad();
                    break;
                default:
                    this.logger.e("Unrecoverable error");
                    this.destroy();
                    break;
            }
        }
    }

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
        this.logger.debug = debug;
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

        this.attachHandlers();
        this.eventHandler = eventHandler;
        this.player.loadSource(this.url);
        this.player.attachMedia(this.videoElement);
    }

    private attachHandlers() {
        this.player.on(Hls.Events.MANIFEST_PARSED, this.manifestParsedHandler);
        this.player.on(Hls.Events.LEVEL_LOADED, this.levelLoadedHandler);
        this.player.on(Hls.Events.ERROR, this.errorHandler);
    }

    private detachHandlers() {
        this.player.off(Hls.Events.MANIFEST_PARSED, this.manifestParsedHandler);
        this.player.off(Hls.Events.LEVEL_LOADED, this.levelLoadedHandler);
        this.player.off(Hls.Events.ERROR, this.errorHandler);
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

        var b = { index: -1, bitrate: 0, bitrateStr: 'Auto', width: 0, height: 0 };
        bitrates.push(b);

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
            b.bitrateStr = Utils.calcBitrateStr(u[i].bitrate);
            b.height = u[i].height;
            bitrates.push(b);
        }

        return bitrates;
    }

    setQuality(index: number) {
        this.player.currentLevel = index;
    }

    getCurrentQuality(): Quality {

        var qualities = this.getQualities();

        for(var i in qualities) {
            if(this.player.currentLevel == qualities[i].index) {
                return qualities[i];
            }
        }

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
            this.logger.d("Hlsjs destroy");
            this.detachHandlers();
            this.player.destroy();
            this.player = null;
        }
    }
}