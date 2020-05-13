function collisionSide(a, b) {
    if (isCollision(a, b)) {
        let sides = { x: null, y: null };
        if (a.y < b.y) sides.y = 'top';
        else if (a.y + a.h > b.y + b.h) sides.y = 'bottom';

        if (a.x < b.x) sides.x = 'left';
        else if (a.x + a.w > b.x + b.w) sides.x = 'right';

        return sides;
    } else {
        return null;
    }
}

function isCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}