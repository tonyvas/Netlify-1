class Base {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
    }

    getArea() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
