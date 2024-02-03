export class Logger {
    debug: boolean;
    context: string;

    constructor(context: string, debug: boolean = false) {
        this.debug = debug;
        this.context = context;
    }

    d(message: any) {
        if(this.debug) {
            console.debug('DEBUG:' + (new Date()).toJSON() + ': ', message, this.context);
        }
    }

    i(message: any) {
        console.info('INFO:' + (new Date()).toJSON() + ': ', message, this.context);
    }

    e(message: any) {
        console.error('ERROR:' + (new Date()).toJSON() + ': ', message, this.context);
    }

    w(message: any) {
        console.warn('WARN:' + (new Date()).toJSON() + ': ', message, this.context);
    }
}