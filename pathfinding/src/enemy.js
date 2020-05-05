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

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    moveBy(x, y) {
        this.moveTo(this.x + x, this.y + y);
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    setMoves(moves) {
        this.moveIndex = 0;
        this.moves = moves;
    }

    moveNext() {
        let moveDist = (dir, dist) => {
            switch (dir) {
                case 'up':
                    this.moveBy(0, -dist);
                    break;
                case 'down':
                    this.moveBy(0, dist);
                    break;
                case 'left':
                    this.moveBy(-dist, 0);
                    break;
                case 'right':
                    this.moveBy(dist, 0);
                    break;
                default:
                    console.log('def');
                    break;
            }
        };

        let distCanMove = this.maxSpeed;
        while (distCanMove > 0 && this.moves.length > 0) {
            console.log('here');
            let dirCurrentMove = this.moves[0].getDir();
            let distCurrentMove = this.moves[0].getDist();

            if (distCurrentMove <= distCanMove) {
                moveDist(dirCurrentMove, distCurrentMove);
                distCanMove -= distCurrentMove;
                this.moves.splice(0, 1);
            } else if (distCurrentMove > distCanMove) {
                this.moves[0].subtract(distCanMove);
                moveDist(dirCurrentMove, distCanMove);
            }
        }
    }
}
