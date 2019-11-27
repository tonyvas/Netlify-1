class Actor{
    actor = {
        id: null,
        type: null,
        health: null,
        position: null,
        image: null
    };

    constructor(i, tp, hp, pos, img) {
        this.actor.id = i;
        this.actor.type = tp;
        this.actor.health = hp;
        this.actor.position = pos;
        this.actor.image = img;

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

    getType(){
        return this.actor.type;
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

    getHealth(){
        return this.actor.health;
    }

    addHealth(num){
        this.actor.health += num;
    }
}

class Weapon{
    weapon = {
        id: null,
        type: null,
        damage: null,
        range: null,
        delay: null,
        accuracy: null
    };

    constructor(i, tp, dmg, rng, dly, acc) {
        this.weapon.id = i;
        this.weapon.type = tp;
        this.weapon.damage = dmg;
        this.weapon.range = rng;
        this.weapon.delay = dly;
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

    getDelay(){
        return this.weapon.delay;
    }

    getAccuracy(){
        return this.weapon.accuracy;
    }
}