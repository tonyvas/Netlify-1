class Food {
    constructor(x, y, w, h, weight, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.weight = weight;
    }

    getArea() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
