import { AudioTrack } from "./models/audio-track";
import { Quality } from "./models/quality";

export interface Tech {

    init(
        videoElement: HTMLMediaElement,
        url: string,
        autoplay: boolean,
        debug: boolean,
        eventHandler: any,
        headers: any,
        protData: any,
        onLicenseError: any
    ): void;

    getPlayer(): any;
    isLive(): boolean;
    getAudioTracks(): AudioTrack[];
    setAudioTrack(index: number): void;
    getQualities(): any;
    setQuality(index: any): void;
    getCurrentQuality(): Quality;
    setMaxQuality(): void;
    destroy(): void;
}