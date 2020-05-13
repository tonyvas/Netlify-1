class Enemy {
    constructor(x, y, w, h, maxSpeed, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.maxSpeed = maxSpeed;
        this.currentMove = { x: 0, y: 0, speedX: 0, speedY: 0 };
    }

    setMove(x, y, spx, spy) {
        this.currentMove.x = x;
        this.currentMove.y = y;
        this.currentMove.speedX = spx;
        this.currentMove.speedY = spy;
    }

    hasMove() {
        return this.currentMove.x > 0 && this.currentMove.y > 0;
    }

    getMove() {
        let spx = this.currentMove.speedX;
        let spy = this.currentMove.speedY;
        let distX = this.currentMove.x;
        let distY = this.currentMove.y;

        let x = 0;
        let y = 0;

        if (distX > Math.abs(spx)) {
            x = spx;
        } else {
            if (spx < 0) x = -distX;
            else x = distX;
        }

        if (distY > Math.abs(spy)) {
            y = spy;
        } else {
            if (spy < 0) y = -distY;
            else y = distY;
        }

        this.currentMove.x -= Math.abs(x);
        this.currentMove.y -= Math.abs(y);


        return { x: x, y: y };
    }

    getArea() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
