const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
const flash = document.querySelector('.flash'); // created a varible for flash

function getVideo() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(localMediaStream => {
            console.log(localMediaStream);
            video.srcObject = localMediaStream;
            video.play();
        })
        .catch(err => {
            console.log(`OH NO!!!`, err);
        })
}

function paintToCanvas() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    return setInterval(() => {
        ctx.drawImage(video, 0, 0, width, height);
        // take the pixels out
        let pixels = ctx.getImageData(0, 0, width, height);
        // mess with them
        // Apply the active filter
        if (currentFilter === 'redEffect') {
            pixels = redEffect(pixels);
        } else if (currentFilter === 'rgbSplit') {
            pixels = rgbSplit(pixels);
        } else if (currentFilter === 'greenScreen') {
            pixels = greenScreen(pixels);
        } else if (currentFilter === 'invertColors') {
            pixels = invertColors(pixels);
        } else if (currentFilter === 'grayscaleEffect') {
            pixels = grayscaleEffect(pixels);
        } else if (currentFilter === 'pixelateEffect') {
            pixels = pixelateEffect(pixels, width, height);
        } else if (currentFilter === 'kaleidoscopeEffect') {
            pixels = kaleidoscopeEffect(pixels, width, height);
        } else if (currentFilter === 'mirrorEffect') {
            pixels = mirrorEffect(pixels, width, height);
        } else if (currentFilter === 'spiralWarpEffect') {
            pixels = spiralWarpEffect(pixels, width, height, width / 2, height / 2, width);
        } 
        // put them back
        ctx.putImageData(pixels, 0, 0);
    }, 16);
}

function takePhoto() {
    // plays the sound
    snap.currentTime = 0;
    snap.play();

    // trigger the flash
    flash.style.opacity = '1';
    setTimeout(() => flash.style.opacity = '0', 100);

    // take the data out of the canvas
    const data = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.href = data;
    link.setAttribute('download', 'Me');
    link.innerHTML = `<img src="${data}" alt="Me" />`
    strip.insertBefore(link, strip.firstChild);
}

// Allows you to switch between filters
let currentFilter = 'none'; // Default filter

function redEffect(pixels) {
    for(let i = 0; i < pixels.data.length; i+=4) {
        pixels.data[i + 0] = pixels.data[i + 0] + 200; // RED
        pixels.data[i + 1] = pixels.data[i + 1] - 50; // GREEN
        pixels.data[i + 2] = pixels.data[i + 2] * 0.5; // BLUE
    }
    return pixels;
}

function rgbSplit(pixels) {
    for(let i = 0; i < pixels.data.length; i+=4) {
        pixels.data[i - 150] = pixels.data[i + 0]; // RED
        pixels.data[i + 500] = pixels.data[i + 1]; // GREEN
        pixels.data[i - 550] = pixels.data[i + 2]; // BLUE
    }
    return pixels;
}

function greenScreen(pixels) {
    const levels = {};

  document.querySelectorAll('.rgb input').forEach((input) => {
    levels[input.name] = input.value;
  });

  console.log(levels);

  for ( let i = 0; i < pixels.data.length; i = i + 4) {
    let red = pixels.data[i + 0];
    let green = pixels.data[i + 1];
    let blue = pixels.data[i + 2];
    let alpha = pixels.data[i + 3];

    if (red >= levels.rmin
      && green >= levels.gmin
      && blue >= levels.bmin
      && red <= levels.rmax
      && green <= levels.gmax
      && blue <= levels.bmax) {
      // take it out!
      pixels.data[i + 3] = 0;
    }
  }
  return pixels;
}

// added an invertColor(pixels) option
function invertColors(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] = 255 - pixels.data[i];     // Invert Red
        pixels.data[i + 1] = 255 - pixels.data[i + 1]; // Invert Green
        pixels.data[i + 2] = 255 - pixels.data[i + 2]; // Invert Blue
    }
    return pixels;
}

// Grayscale
function grayscaleEffect(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        let r = pixels.data[i + 0];
        let g = pixels.data[i + 1];
        let b = pixels.data[i + 2];

        let avg = (r + g + b) / 3;

        pixels.data[i + 0] = avg; // Red
        pixels.data[i + 1] = avg; // Green
        pixels.data[i + 2] = avg; // Blue
    }
    return pixels;
}

// Pixelated
function pixelateEffect(pixels, width, height, pixelSize = 10) {
    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            // Get the average color of the pixels in the block
            let r = 0, g = 0, b = 0;
            let count = 0;

            for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                    let i = ((y + dy) * width + (x + dx)) * 4;
                    if (i < pixels.data.length) {
                        r += pixels.data[i]; // Red
                        g += pixels.data[i + 1]; // Green
                        b += pixels.data[i + 2]; // Blue
                        count++;
                    }
                }
            }

            // Calculate the average color
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            // Apply the average color to the block of pixels
            for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                    let i = ((y + dy) * width + (x + dx)) * 4;
                    if (i < pixels.data.length) {
                        pixels.data[i] = r; // Red
                        pixels.data[i + 1] = g; // Green
                        pixels.data[i + 2] = b; // Blue
                    }
                }
            }
        }
    }
    return pixels;
}

// Kaleidoscope Filter
function kaleidoscopeEffect(pixels, width, height, segments = 8) {
    const segmentWidth = width / segments;
    const segmentHeight = height / segments;

    for (let i = 0; i < pixels.data.length; i += 4) {
        let x = (i / 4) % width;
        let y = Math.floor(i / 4 / width);

        // Calculate the corresponding segment for the kaleidoscope
        let segmentX = Math.floor(x / segmentWidth);
        let segmentY = Math.floor(y / segmentHeight);

        // Reflect across both axes
        let newX = segmentWidth * (segments - 1 - segmentX);
        let newY = segmentHeight * (segments - 1 - segmentY);

        // Set the pixel at the new location to the original value
        let newI = (newY * width + newX) * 4;
        pixels.data[i] = pixels.data[newI]; // Red
        pixels.data[i + 1] = pixels.data[newI + 1]; // Green
        pixels.data[i + 2] = pixels.data[newI + 2]; // Blue
    }

    return pixels;
}

// Mirror Filter
function mirrorEffect(pixels, width, height) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width / 2; x++) {
            let i = (y * width + x) * 4;
            let mirrorX = width - x - 1;
            let mirrorI = (y * width + mirrorX) * 4;

            // Swap the pixels horizontally
            for (let j = 0; j < 3; j++) {
                let temp = pixels.data[i + j];
                pixels.data[i + j] = pixels.data[mirrorI + j];
                pixels.data[mirrorI + j] = temp;
            }
        }
    }
    return pixels;
}

// Spiral Wrap Effect 
function spiralWarpEffect(pixels, width, height, centerX, centerY, maxDistance) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = (y * width + x) * 4;
            let dx = x - centerX;
            let dy = y - centerY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) + (distance / maxDistance) * Math.PI; // Add rotation based on distance
            let newX = Math.floor(centerX + distance * Math.cos(angle));
            let newY = Math.floor(centerY + distance * Math.sin(angle));

            // Wrap around if new position is out of bounds
            newX = Math.min(Math.max(0, newX), width - 1);
            newY = Math.min(Math.max(0, newY), height - 1);

            let newI = (newY * width + newX) * 4;
            pixels.data[i] = pixels.data[newI];     // Red
            pixels.data[i + 1] = pixels.data[newI + 1]; // Green
            pixels.data[i + 2] = pixels.data[newI + 2]; // Blue
        }
    }
    return pixels;
}

// Update the active filter
function setFilter(filterName) {
    currentFilter = filterName;
}

// Paint to canvas with selected filter 

getVideo();

video.addEventListener('canplay', paintToCanvas);