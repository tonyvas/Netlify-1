export default class Collision {
    static outOfMap(a, m) {
        let obj = { x: 0, y: 0 };

        if (a.x < m.x) {
            obj.x = -1;
        }
        if (a.x + a.w > m.x + m.w) {
            obj.x = 1;
        }
        if (a.y < m.y) {
            obj.y = -1;
        }
        if (a.y + a.h > m.y + m.h) {
            obj.y = 1;
        }

        return obj;
    }

    static isCollision(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    static collisionSide(a, b) {
        if (this.isCollision(a, b)) {
            if (a.y < b.y) {
                return 'top';
            } else if (a.y + a.h > b.y + b.h) {
                return 'bottom';
            } else if (a.x < b.x) {
                return 'left';
            } else if (a.x + a.w > b.x + b.w) {
                return 'right';
            }
        } else {
            return null;
        }
    }
}
