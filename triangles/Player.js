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
        if (this.player.xPos <= screen.offsetLeft)
            this.MoveTo(screen.offsetLeft, this.player.yPos);
        if ((this.player.xPos + this.player.image.width) >= (screen.offsetLeft + screen.clientWidth))
            this.MoveTo(screen.offsetLeft + screen.clientWidth - this.player.image.width, this.player.yPos);
        if (this.player.yPos <= screen.offsetTop)
            this.MoveTo(this.player.xPos, screen.offsetTop);
        if ((this.player.yPos + this.player.image.height) >= (screen.offsetTop + screen.clientHeight))
            this.MoveTo(this.player.xPos, screen.offsetTop + screen.clientHeight - this.player.image.height);
    }
}