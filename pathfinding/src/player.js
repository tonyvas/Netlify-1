export default class Player {
    constructor(xywh) {
        this.x = xywh.x;
        this.y = xywh.y;
        this.w = xywh.w;
        this.h = xywh.h;

        this.maxSpeed = 5;
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    moveBy(x, y) {
        this.moveTo(this.x + x, this.y + y);
    }
}
