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

        this.Move(centerX, centerY);
    }

    Move(x, y) {
        this.player.xPos += x;
        this.player.yPos += y;

        this.player.image.style.left = this.player.xPos + 'px';
        this.player.image.style.top = this.player.yPos + 'px';
    }

    CheckBounds(bounds) {
        if () {
            console.log("Collision!");
        }
        else
            console.log("nein");
    }
}