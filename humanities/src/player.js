class Player {
    constructor(x, y, w, h, maxSpeed, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.maxSpeed = maxSpeed;
    }

    getArea() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
