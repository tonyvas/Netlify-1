export default class Enemy {
    constructor(id, xywh) {
        this.id = id;

        this.x = xywh.x;
        this.y = xywh.y;
        this.w = xywh.w;
        this.h = xywh.h;

        this.maxSpeed = 3;

        this.moves = [];
        this.moveIndex = 0;
    }

    moveTo(x, y){
        this.x = x;
        this.y = y;
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    setMoves(moves) {
        this.moveIndex = 0;
        this.moves = moves;
    }

    move() {
        let distCanMove = this.maxSpeed;
    }
}
