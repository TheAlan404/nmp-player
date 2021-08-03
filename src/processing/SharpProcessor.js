const sharp = require("sharp");
const { convertColor } = require("../MapData.js");

/**
* Resize image to fit and convert to raw
* @param {buffer} data
* @param {DisplayList} displays
* @returns { { data: buffer, info: sharpImageInfo } } buffer is RGB, not RGBA
*/
async function resize(pngData, displays){
	const { data, info } = await sharp(pngData)
			.resize({
				width: displays.pixelWidth,
				height: displays.pixelHeight,
				fit: 'contain'
			})
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
	return { data, info };
};

/**
* @param {buffer} data
* @param {DisplayList} displays
* @returns {Object.<number, buffer>} number is map id, buffer is map pixel data
*/
function convert(data, displays){
	let output = {};

	// by @IceTank
	for (let sX = 0; sX < displays.width; sX++) { // Width
		for (let sY = 0; sY < displays.height; sY++) { // Height
			
			// for every section:
			let chunk = [];
			for (let dx = 0; dx < 128; dx++) { // X
				for (let dz = 0; dz < 128; dz++) { // Y
					let x = sX * 128 + dx;
					let z = sY * 128 + dz;
					if (x > displays.pixelWidth || z > displays.pixelHeight) {
						continue;
					};

					let i = (x + (z * displays.pixelWidth)) * 3;
					let r = data[i];
					let g = data[i + 1];
					let b = data[i + 2];
					chunk.push(convertColor(r, g, b));
				};
			};
			output[displays.ids[sX + (sY * displays.width)]] = Buffer.from(chunk);
			chunk = null;
			//
			
		};
	};
	
	return output;
};

/**
* Process the image
* @param {buffer} image
* @param {DisplayList} displays
* @returns {Object.<number, buffer>} number is map id, buffer is map pixel data
*/
async function process(pngData, displays){
	let { data } = await resize(pngData, displays);
	return convert(data, displays);
};

module.exports = {
	resize,
	convert,
	process,
};