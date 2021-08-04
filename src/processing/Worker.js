const {
	parentPort, workerData
} = require("worker_threads");
const VideoProcessor = require("../VideoProcessor.js");

function main(data){
	let processor = new VideoProcessor(data.displays, { frameRate: data.frameRate });
	processor.on("frame", parentPort.postMessage);
	
	parentPort.on("message", (d) => {
		let [cmd, extra] = d;
		if(cmd === "CLEAR") return processor.clear();
		processor.setMode(cmd);
		processor.start(extra);
	});
};

main(workerData);