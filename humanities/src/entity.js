class Entity {
    constructor(x, y, w, h, maxSpeed, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.maxSpeed = maxSpeed;
        this.color = color;
    }

    getArea() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
