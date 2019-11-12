class Actor{
    actor = {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null,
        hp: null
    };

    constructor(ID, centerX, centerY, width, height, health) {
        this.actor.id = ID;
        this.actor.x = centerX;
        this.actor.y = centerY;
        this.actor.w = width;
        this.actor.h = height;
        this.actor.hp = health;

        this.moveTo(centerX, centerY);
    }

    moveTo(x, y){
        this.actor.x = x;
        this.actor.y = y;
    }

    moveBy(x, y){
        this.moveTo(x, y);
    }

    getID(){
        return this.actor.id;
    }

    getPos(){
        return {
            x1: this.actor.x - this.actor.w / 2, 
            y1: this.actor.y - this.actor.h / 2, 
            x2: this.actor.x + this.actor.w / 2, 
            y2: this.actor.y + this.actor.h / 2
        };
    }

    getHP(){
        return this.actor.hp;
    }
    addHP(num){
        this.actor.hp += num;
    }
}

class Weapon{
    weapon = {

    };
}