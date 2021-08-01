const { EventEmitter } = require("events");

const States = {
	Play: "play",
	Paused: "paused",
	Idle: "idle",
	Buffering: "buffering",
};

class MediaPlayer extends EventEmitter {
	/**
	* A media player.
	* The implementer must set the `processFrame` function
	* @class
	* @abstract
	* @param {object} [opts={}]
	*/
	constructor(opts = {}){
		super();
		this.setVolume(opts.volume); // %
		this.setSpeed(opts.speed);
		this.playReverse = opts.playReverse ?? false;
		this.loop = opts.loop ?? false;
		this.interval = null;
		this.frameIndex = opts.frames ?? 0;
		this.frames = Array.isArray(opts.frames) ? opts.frames : [];
		this.frameRate = opts.frameRate || 1; // FPS
		this.processFrame = this.processFrame || opts.processFrame || (() => {}); // fallback.
		
		this.isStream = opts.isStream ?? false;
		this._buffering = false;
		this._ended = false;
		this.state = States.Idle;
	};
	/**
	* Set the media's volume
	* Volume must be implemented by the child class
	* @param {number} volume - percentage
	*/
	setVolume(v = 100){
		this.volume = v;
	};
	/**
	* Set the media's playback speed
	* @param {number} speed - default 1
	*/
	setSpeed(s = 1){
		this.speed = s;
		this.setIntervalSpeed();
	};
	/**
	* Set the media's frame rate / FPS
	* @param {number} fps
	*/
	setFrameRate(fps = 1){
		this.frameRate = fps;
		this.setIntervalSpeed();
	};
	
	/**
	* Gets the current progress.
	* If stream mode is on, always returns `100`
	* @return {number} progress - percentage
	*/
	get progress(){
		if(this.isStream) return 100;
		return ( this.frames.length / ( this.frames.length / this.frameIndex ) ) / this.frames.length;
	};
	
	/**
	* Gets the duration of the media in milliseconds (?)
	* @return {number} duration
	*/
	get duration(){
		return (this.frames.length / this.frameRate) * this.speed;
	};
	
	/**
	* Plays the media.
	* Implementers might overwrite this (to do stuff like `play(URL)`/`play(filename)`/etc) and call `super.play()` instead
	* If the media player is paused, resumes it.
	* @param {boolean} [playFromBeginning=false] Play from the beginning, dont unpause if paused
	*/
	play(playFromBeginning = false){
		if(this.interval) {
			this.emit("forceStop", this.frameIndex);
			this.deleteInterval();
		};
		if(playFromBeginning || this._ended) this.frameIndex = 0;
		this._ended = false;
		this.startInterval();
		this.state = States.Play;
		this.emit("started");
	};
	/**
	* Pauses the media. Use `play()` to resume
	*/
	pause(){
		this.state = States.Paused;
		this.deleteInterval();
		this.emit("paused");
	};
	/**
	* Stops the media and rewinds to the beginning
	*/
	stop(){
		if(this.interval) {
			this.deleteInterval();
		};
		this.state = States.Idle;
		this.emit("stop", this.frameIndex);
		this.frameIndex = 0;
	};
	
	seekTo(frameIndex = 0){
		if(!this.frames[frameIndex]) throw new Error("Index out of bounds"); // is this neccesary?
		this.frameIndex = frameIndex;
	};
	seek(frameCount = 0){
		this.seekTo(this.frameIndex + frameCount);
	};
	rewind(amount = 0){
		this.seek(-amount);
	};
	forward(amount = 0){
		this.seek(amount);
	};
	
	seekToSeconds(seconds = 0){
		this.seekTo(this.frameRate * seconds);
	};
	seekSeconds(seconds = 0){
		this.seek(this.frameRate * seconds);
	};
	rewindSeconds(seconds = 0){
		this.rewind(this.frameRate * seconds);
	};
	forwardSeconds(seconds = 0){
		this.forward(this.frameRate * seconds);
	};
	
	addFrame(frame){
		// literally push it. the interval code handles it
		this.frames.push(frame);
	};
	addBulkFrames(frames){
		this.frames.push(...frames);
	};
	
	startInterval(){
		this.interval = setInterval(() => {
			let data = this.frames[this.frameIndex];
			if(!data) {
				if(this.isStream) {
					if(!this._buffering) {
						this.emit("buffering");
						this._buffering = true;
						this.state = States.Buffering;
					};
					return;
				} else {
					this._ended = true;
					this.deleteInterval();
					if(this.loop) {
						this.play();
						this.emit("loopRestart");
						return;
					};
					this.state = States.Idle;
					this.emit("end");
					return;
				};
			};
			if(this.isStream && this._buffering) {
				this._buffering = false;
				this.emit("bufferingEnd");
				this.state = States.Play;
			};
			this.processFrame(data);
			if(this.isStream) {
				this.frames.shift();
			} else {
				this.frameIndex++;
			};
		}, (1000 / this.frameRate) * this.speed);
	};
	setIntervalSpeed(){
		if(!this.interval) return;
		this.interval._repeat = (1000 / this.frameRate) * this.speed;
	};
	deleteInterval(){
		if(this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		};
	};
};

MediaPlayer.States = States;

module.exports = MediaPlayer;