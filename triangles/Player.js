class Player {
    player = {
        health: null,
        damage: null,
        image: null,
        xPos: null,
        yPos: null
    };

    constructor(img, centerX, centerY) {
        this.player.health = 100;
        this.player.damage = 20;
        this.player.image = img;

        this.MoveTo(centerX, centerY);
    }

    MoveBy(x, y) {
        this.player.xPos += x;
        this.player.yPos += y;

        this.MoveTo(this.player.xPos, this.player.yPos)
    }

    MoveTo(x, y){
        this.player.xPos = x;
        this.player.yPos = y;

        this.player.image.style.left = this.player.xPos + 'px';
        this.player.image.style.top = this.player.yPos + 'px';
    }

    CheckBounds(screen) {
        let targetX;
        let targetY;
    }
}