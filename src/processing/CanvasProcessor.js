const { createCanvas, loadImage } = require("canvas");
const { convertColor } = require("../MapData.js");

/**
* Resize image to fit and return the canvas
* @param {buffer} image data
* @param {DisplayList} displays
* @returns { { canvas: Canvas, ctx: Canvas2DRenderingContext } }
*/
async function resize(pngData, displays){
	let canvas = createCanvas(displays.pixelWidth, displays.pixelHeight);
	let ctx = canvas.getContext("2d");
	let img = await loadImage(pngData);
	// math stolen from stackoverflow (tm)
	let wrh = img.width / img.height;
	let newWidth = canvas.width;
	let newHeight = newWidth / wrh;
	if (newHeight > canvas.height) {
		newHeight = canvas.height;
		newWidth = newHeight * wrh;
	}
	ctx.drawImage(img, 0, 0, newWidth, newHeight);
	return { canvas, ctx };
};

/**
* @param {Canvas2DRenderingContext} ctx
* @param {DisplayList} displays
* @param {Boolean} useSharp - if true, uses sharp to remove alpha
* @returns {Object.<number, buffer>} number is map id, buffer is map pixel data
*/
function convert(ctx, displays){
	let output = {};
	
	let i = 0;
	for (let y = 0; y < displays.height; y++) {
		for (let x = 0; x < displays.width; x++) {
			let dataRGBA = ctx.getImageData(x * 128, y * 128, 128, 128).data;
			let chunk = [];
			let j = 0;
			for (let k = 0; k < dataRGBA.length; k += 4) {
				chunk.push(convertColor(dataRGBA[k], dataRGBA[k + 1], dataRGBA[k + 2]));
			};
			output[displays.ids[i]] = Buffer.from(chunk);
			i++;
			chunk = null;
		}
	}

	return output;
};

/**
* Process the image
* @param {buffer} image
* @param {DisplayList} displays
* @returns {Object.<number, buffer>} number is map id, buffer is map pixel data
*/
async function process(pngData, displays){
	let { ctx } = await resize(pngData, displays);
	return convert(ctx, displays);
};

module.exports = {
	resize,
	convert,
	process,
};