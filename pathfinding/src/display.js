const DEFAULT_CANVAS_INNER_WIDTH = 2000;
const DEFAULT_CANVAS_INNER_HEIGHT = 1000;
const CANVAS_OUTER_WIDTH_CONTAINER_RATIO = 1;
const CANVAS_OUTER_HEIGHT_CONTAINER_RATIO = 1;
const CANVAS_MARGIN = 20;

export default class Display {
    constructor(canvasId, canvWidth = DEFAULT_CANVAS_INNER_WIDTH, canvHeight = DEFAULT_CANVAS_INNER_HEIGHT) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = canvWidth;
        this.canvas.height = canvHeight;
        this.context = this.canvas.getContext('2d');
        this.clear();

        this.mouseX = null;
        this.mouseY = null;
        document.addEventListener('mousemove', (e) => {
            let canvBound = this.canvas.getBoundingClientRect();
            let scaleX = this.canvas.width / canvBound.width;
            let scaleY = this.canvas.height / canvBound.height;

            this.mouseX = (e.clientX - canvBound.left) * scaleX;
            this.mouseY = (e.clientY - canvBound.top) * scaleY;
        });
    }

    getMousePosition() {
        if (
            this.mouseX == null ||
            this.mouseY == null ||
            this.mouseX < 0 ||
            this.mouseY < 0 ||
            this.mouseX > this.canvas.width ||
            this.mouseY > this.canvas.height
        ) {
            return null;
        } else {
            return { x: this.mouseX, y: this.mouseY };
        }
    }

    getDisplayArea() {
        return { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
    }

    getCanvasSize() {
        return { w: this.canvas.width, h: this.canvas.height };
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    border({ x, y, w, h }, color, width = 3) {
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.strokeRect(x, y, w, h);
    }

    drawCircle(pos, radius, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        this.context.fill();
    }

    drawRect(coords, color) {
        this.context.fillStyle = color;
        this.context.fillRect(coords.x, coords.y, coords.w, coords.h);
    }

    updateSize(containerW, containerH) {
        let innerW = containerW * CANVAS_OUTER_WIDTH_CONTAINER_RATIO - CANVAS_MARGIN;
        let innerH = containerH * CANVAS_OUTER_HEIGHT_CONTAINER_RATIO - CANVAS_MARGIN;
        let ratio = this.canvas.width / this.canvas.height;

        let w, h;

        // height too small
        if (innerH * ratio < innerW) {
            h = innerH;
            w = innerH * ratio;
        } else {
            // width too small
            w = innerW;
            h = innerW / ratio;
        }

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
    }
}
