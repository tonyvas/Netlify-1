class Actor{
    actor = {
        id: null,
        type: null,
        health: null,
        position: null,
        image: null,
        weapon: null
    };

    constructor(i, tp, hp, pos, img, wpn) {
        this.actor.id = i;
        this.actor.type = tp;
        this.actor.health = hp;
        this.actor.position = pos;
        this.actor.image = img;
        this.actor.weapon = wpn;

        this.moveTo(this.actor.position.x, this.actor.position.y);
    }

    moveTo(x, y){
        this.actor.position.x = x;
        this.actor.position.y = y;
    }

    moveBy(x, y){
        this.moveTo(this.actor.position.x + x, this.actor.position.y + y);
    }

    getId(){
        return this.actor.id;
    }

    getImage(){
        return this.actor.image.img;
    }

    getPos(){
        return {
            x: this.actor.position.x,
            y: this.actor.position.y
        };
    }

    getSize(){
        return {
            w: this.actor.image.w,
            h: this.actor.image.h
        };
    }
}

class Weapon{
    weapon = {
        id: null,
        type: null,
        damage: null,
        range: null,
        speed: null,
        accuracy: null
    };

    constructor(i, tp, dmg, rng, spd, acc) {
        this.weapon.id = i;
        this.weapon.type = tp;
        this.weapon.damage = dmg;
        this.weapon.range = rng;
        this.weapon.speed = spd;
        this.weapon.accuracy = acc;
    }

    getId(){
        return this.weapon.id;
    }

    getType(){
        return this.weapon.type;
    }

    getDamage(){
        return this.weapon.damage;
    }

    getRange(){
        return this.weapon.range;
    }

    getSpeed(){
        return this.weapon.speed;
    }

    getAccuracy(){
        return this.weapon.accuracy;
    }
}