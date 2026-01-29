class Timeout {
    constructor(callbackFunction, time) {
        this.time = time;
        this.callback = callbackFunction; 
        this.run(); // It will be automatically invoked when the constructor is run
    }
    run() {
        this.startedTime = new Date().getTime();
        if (this.time > 0) {
            this.timeout = setTimeout(this.callback, this.time); // Timeout must be set if this.time is greater than 0
        }
    }
    pause() {
        let currentTime = new Date().getTime();
        this.time = this.time - (currentTime - this.startedTime); // The time that was given when initializing the timeout is subtracted from the amount of time spent
        clearTimeout(this.timeout);
    }
}