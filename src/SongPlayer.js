const { loadSong, Song } = require("nbs.js");
const MediaPlayer = require("./MediaPlayer");
const States = MediaPlayer.States;

class SongPlayer extends MediaPlayer {
	constructor(){
		super();
		this.song = null;
		
	};
	load(src){
		if(typeof src === "string") {
			this.song = loadSong(src);
		} else if(src instanceof Song) {
			this.song = src;
		} else {
			throw new Error("Cannot load song: "+src);
		};
	};
	play(src){
		if(src) this.load(src);
		if(!this.song) throw new Error("No loaded song!");
		this.frames = this.song.layers;
		super.play();
	};
	// bruh.
	startInterval(){
		this.interval = setInterval(() => {
			// removed the isStream logic because it seems... dumb... with this datatype (<nbs.js>.Song)
			if(this.song.length < this.frameIndex) {
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
			this.processFrame();
		}, (1000 / this.frameRate) * this.speed);
	};
	
	processFrame(){
		for (let l in this.song.layers){
			if(this.song.layers[l].notes[this.frameIndex]) {
				let note = this.song.layers[l].notes[this.frameIndex];
				note.layerID = l;
				//note.packet.volume = this.song.layers[l].volume/100;
				this.onNote(note);
			};
		};
	};
	
	/**
	* Users HAVE TO set this function themselves.
	* You cannot broadcast a simple sound_effect packet and except everyone to hear it.
	* You can get the packet using `note.packet`, dont forget to set the `x`, `y` and `z` values!
	* @param {<nbs.js>.Note} note
	*/
	onNote(note){
		console.log("SongPlayer note:", note.packet);
	};
};

module.expors = SongPlayer;