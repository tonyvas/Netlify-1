export default class Character {
    constructor(x, y, w, h, color, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.type = type;
    }

    getPos() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
