class Actor{
    constructor(i, tp, hp, pos, img) {
        this.id = i;
        this.type = tp;
        this.health = hp;
        this.position = pos;
        this.image = img;

        this.moveTo(this.position.x, this.position.y);
    }

    moveTo(x, y){
        this.position.x = x;
        this.position.y = y;
    }

    moveBy(x, y){
        this.moveTo(this.position.x + x, this.position.y + y);
    }

    getId(){
        return this.id;
    }

    getType(){
        return this.type;
    }

    getImage(){
        return this.image.img;
    }

    getPos(){
        return {
            x: this.position.x,
            y: this.position.y
        };
    }

    getSize(){
        return {
            w: this.image.w,
            h: this.image.h
        };
    }

    getHealth(){
        return this.health;
    }

    addHealth(num){
        this.health += num;
    }
}

class Weapon{
    constructor(i, tp, dmg, dist, dly, acc) {
        this.id = i;
        this.type = tp;
        this.damage = dmg;
        this.distance = dist;
        this.delay = dly;
        this.accuracy = acc;
    }

    getId(){
        return this.id;
    }

    getType(){
        return this.type;
    }

    getDamage(){
        return this.damage;
    }

    getDistance(){
        return this.distance;
    }

    getDelay(){
        return this.delay;
    }

    getAccuracy(){
        return this.accuracy;
    }
}