class Actor{
    actor = {
        id: null,
        health: null,
        weapon: null,
        image: null,
        xPos: null,
        yPos: null,
        type: null
    };

    constructor(idNum, img, hp, weap, tp){
        this.actor.id = idNum;
        this.actor.type = tp;
        this.actor.image = new Image();
        this.actor.image.src = img;
        this.actor.image.setAttribute("draggable", false);
        this.actor.image.classList.add(this.actor.type);
        this.actor.image.classList.add("actor");
        document.getElementById('gameArea').appendChild(this.actor.image);
        this.actor.health = hp;
        this.actor.weapon = weap;
    }

    MoveBy(x, y){
        this.actor.xPos += x;
        this.actor.yPos += y;

        this.MoveTo(this.actor.xPos, this.actor.yPos);
    }

    MoveTo(x, y){
        this.actor.xPos = x;
        this.actor.yPos = y;

        this.actor.image.style.left = this.actor.xPos + 'px';
        this.actor.image.style.top = this.actor.yPos + 'px';
    }

    GetPos(){
        return {
            X1: this.actor.xPos,
            Y1: this.actor.yPos,
            X2: this.actor.xPos + this.actor.image.width,
            Y2: this.actor.yPos + this.actor.image.height
        };
    }

    GetId(){
        return this.actor.id;
    }
}