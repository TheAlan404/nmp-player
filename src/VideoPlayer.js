const MediaPlayer = require("./MediaPlayer");
const DisplayList = require("./DisplayList");
const States = {
	...MediaPlayer.States,
	Processing: "processing",
};

class VideoPlayer extends MediaPlayer {
	constructor(displays, opts){
		super(opts);
		this.displays = displays ?? new DisplayList(1, 1, [1]);
	};
	setDisplays(displays){
		if(!displays) throw new Error("displays is not specified");
		if(!isNaN(displays)) displays = new DisplayList(1, 1, [displays]);
		this.displays = displays;
	};
	async load(){
		
	};
	async play(){
		
	};
	processFrame(frame){
		
	};
};