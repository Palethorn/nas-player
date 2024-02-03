import { TechInterface } from "./tech/tech-interface";
import { Quality } from "./models/quality";
import { Logger } from "nas-logger";

/**
 * Abstraction
 */
export class Player {
    url: string = '';
    player: any = null;
    volume: number = .5;
    headers: any = null;
    protData: any = null;
    logger: Logger = null;
    debug: boolean = false;
    muted: boolean = false;
    eventHandlers: any = {};
    is_live: boolean = false;
    autoplay: boolean = false;
    onLicenseError: any = null;
    subtitlesUrl: string|null = '';
    tech: TechInterface|null = null;
    event_handler_count: number = 0;
    videoElement: HTMLMediaElement = document.createElement('video');

    available_events = [
        "manifestLoaded",
        "streamInitialized",
        "abort",
        "canplay",
        "canplaythrough",
        "durationchange",
        "emptied",
        "encrypted",
        "ended",
        "error",
        "interruptbegin",
        "loadeddata", 
        "loadedmetadata",
        "loadstart",
        "pause",
        "play",
        "playing",
        "progress",
        "ratechange",
        "seeked",
        "seeking",
        "stalled",
        "suspend", 
        "timeupdate",
        "volumechange",
        "waiting"
    ];

    constructor() {
        this.logger = new Logger('Player');
    }

    init(
        tech: TechInterface,
        videoElement: HTMLMediaElement,
        url: string,
        autoplay: boolean,
        debug: boolean,
        headers: any,
        protData: any,
        onLicenseError: any
    ) {
        this.logger.debug = debug;

        this.url = url;
        this.tech = tech;
        this.videoElement = videoElement;

        this.url = url;
        this.debug = debug;
        this.muted = false;
        this.volume = .5;
        this.headers = headers;
        this.autoplay = autoplay;
        this.protData = protData;
        this.videoElement = videoElement;
        this.onLicenseError = onLicenseError;

        this.assignEventListeners();

        this.tech.init(
            this.videoElement,
            this.url,
            this.autoplay,
            this.debug,
            this.handleEvent,
            this.headers,
            this.protData,
            this.onLicenseError
        );
    }

    getUrl() {
        return this.url;
    }

    getTech() {
        return this.tech;
    }

    play() {
        this.videoElement.play();
    }

    pause() {
        this.videoElement.pause();
    }

    seek(seconds: number) {
        var v = this.videoElement;
        v.currentTime = seconds;
    }

    getCurrentTime() {
        return this.videoElement.currentTime;
    }

    getDuration() {
        return this.videoElement.duration;
    }

    isLive() {
        return null != this.tech ? this.tech.isLive() : false;
    }

    setAudioTrack(index: number) {
        null != this.tech ? this.tech.setAudioTrack(index) : null;
    }

    getQualities() {
        return null != this.tech ? this.tech.getQualities() : [];
    }

    setQuality(index: number) {
        null != this.tech ? this.tech.setQuality(index) : null;
    }

    getCurrentQuality(): Quality {
        return null != this.tech ? this.tech.getCurrentQuality() : { 
            index: 0, 
            width: 0, 
            height: 0, 
            bitrate: 0, 
            bitrateStr: 
            '0k' 
        };
    }

    getAudioTracks() {
        return null != this.tech ? this.tech.getAudioTracks() : [];
    }

    setMaxQuality() {
        null != this.tech ? this.tech.setMaxQuality() : null;
    }

    setPlaybackRate(value: number) {
        this.videoElement.playbackRate = value;
    }

    setVolume(volume: number) {
        this.muted = false;

        // Crazy bug if the volume is set to 1 on first load then player volumechange event is not fired
        if(1 == volume) {
            this.videoElement.volume = .99;
        } else {
            this.videoElement.volume = volume;
        }

        this.volume = volume;
    }

    getVolume() {
        return this.volume;
    }

    mute() {
        this.muted = true;
        this.videoElement.volume = 0;
    }

    unmute() {
        this.muted = false;
        this.videoElement.volume = this.volume;
    }

    isMuted() {
        return this.muted;
    }

    loadSubtitles(url: string) {
        this.subtitlesUrl = url;
        this.clearVideoElement();
        var track = document.createElement('track');
        track.label = 'Subtitle';
        track.kind = 'subtitles';
        track.default = true;
        track.src = url;
        this.videoElement.appendChild(track);
    }

    getSubtitlesUrl(): string|null {
        return this.subtitlesUrl;
    }

    clearVideoElement() {
        this.clearNode(this.videoElement);
    }

    handleEvent = (event: any) => {
        if((event.type in this.eventHandlers)) {
            if('metricChanged' != event.type && 'timeupdate' != event.type) {
                this.logger.d(event.type);
            }

            for(var event_handler_id in this.eventHandlers[event.type]) {
                this.eventHandlers[event.type][event_handler_id](event);
            }
        }
    }

    addEventHandler(event: any, handler: any) {
        if(!(event in this.eventHandlers)) {
            this.eventHandlers[event] = {};
        }


        var id = 'handler_' + this.event_handler_count++;
        this.eventHandlers[event][id] = handler;
        return id;
    }

    removeEventHandler(event: string, id: string) {
        delete this.eventHandlers[event][id];
    }

    assignEventListeners() {
        for(var i = 0; i < this.available_events.length; i++) {
            this.videoElement.addEventListener(this.available_events[i], this.handleEvent, false);
        }
    }

    clearEventHandlers() {
        for(var i = 0; i < this.available_events.length; i++) {
            this.videoElement.removeEventListener(this.available_events[i], this.handleEvent, false);
        }
    }

    clearNode(target: any) {
        while(target.hasChildNodes()) {
            target.removeChild(target.lastChild);
        }
    }

    destroy() {
        this.logger.d("Player destroy");
        this.clearVideoElement();
        this.clearEventHandlers();

        if(null != this.tech) {
            this.tech.destroy();
        }
        
        this.tech = null;
    }
}
