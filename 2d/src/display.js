export default class Display {
    constructor(canvasID, innerWidth, innerHeight) {
        this.canvas = document.getElementById(canvasID);
        this.context = this.canvas.getContext('2d');
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        this.updateCanvasSize();
    }

    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    getMousePos() {
        return { x: this.mouseX, y: this.mouseY };
    }

    getMousePosOnCanvas() {
        let bound = this.canvas.getBoundingClientRect();
        let scaleX = this.canvas.width / bound.width;
        let scaleY = this.canvas.height / bound.height;

        let x = (this.mouseX - bound.left) * scaleX;
        let y = (this.mouseY - bound.top) * scaleY;

        if (x == null || y == null || x < 0 || y < 0 || x > this.canvas.width || y > this.canvas.height) {
            return null;
        } else {
            return { x: x, y: y };
        }
    }

    updateCanvasSize() {
        let innerW = this.canvas.parentElement.clientWidth * 1 - 10;
        let innerH = this.canvas.parentElement.clientHeight * 1 - 10;
        let ratio = this.canvas.width / this.canvas.height;

        let w, h;

        if (innerH * ratio < innerW) {
            // height too small
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

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    outlineRect({ x, y, w, h }, color, width = 3) {
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.strokeRect(x, y, w, h);
    }

    fillRect({ x, y, w, h }, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, w, h);
        this.context.closePath();
    }

    outlineCircle({ x, y }, radius, color, width = 3) {
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 360);
        this.context.stroke();
        this.context.closePath();
    }

    fillCircle({ x, y }, radius, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 360);
        this.context.fill();
        this.context.closePath();
    }

    fillText(text, x, y, size, color) {
        this.context.fillStyle = color;
        this.context.font = size + 'px sans-serif';
        this.context.textAlign = 'center';
        this.context.fillText(text, x, y);
    }
}
