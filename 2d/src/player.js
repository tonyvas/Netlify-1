export default class Character {
    constructor(x, y, w, h, color, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.type = type;

        this.relativeX = 0;
        this.relativeY = 0;
    }

    getPos() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    getRelativePos() {
        return { x: this.relativeX, y: this.relativeY };
    }
}
