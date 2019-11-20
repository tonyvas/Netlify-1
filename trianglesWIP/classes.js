class Actor{
    actor = {
        id: null,
        type: null,
        health: null,
        weapon: null,
        draw: {center: null, points: null, size: null, color: null, isFilled: null}
    };

    constructor(i, tp, hp, wpn, shape) {
        this.actor.id = i;
        this.actor.type = tp;
        this.actor.health = hp;
        this.actor.weapon = wp;
        this.actor.draw = shape;

        this.moveTo(this.actor.draw.center.x, this.actor.draw.center.y);
    }

    moveTo(x, y){
        this.actor.center.draw.x = x;
        this.actor.center.draw.y = y;
    }

    moveBy(x, y){
        this.moveTo(x, y);
    }

    getID(){
        return this.actor.id;
    }

    getCenter(){
        return {
            x: this.actor.center.draw.x,
            y: this.actor.center.draw.y
        };
    }

    getHitbox(){
        return{
            x1: this.actor.draw.center.x - this.actor.draw.size.w / 2,
            y1: this.actor.draw.center.y - this.actor.draw.size.h / 2,
            x2: this.actor.draw.center.x + this.actor.draw.size.w / 2,
            y2: this.actor.draw.center.y + this.actor.draw.size.h / 2
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