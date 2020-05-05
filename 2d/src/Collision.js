export function collisionSide(a, b) {
    if (isCollision(a, b)) {
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

export function isCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}