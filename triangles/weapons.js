class Weapon{
    weapon = {
        name: null,
        damage: null,
        rateOfFire: null,
        range: null,
        accuracy: null
    };

    constructor(nm, dmg, rof, rng, acc){
        this.weapon.name = nm;
        this.weapon.damage = dmg;
        this.weapon.rateOfFire = rof;
        this.weapon.range = rng;
        this.weapon.accuracy = acc;
    }

    GetDamageValue(){
        return this.weapon.damage;
    }

    GetAccuracyValue(){
        return this.weapon.accuracy;
    }

    GetBulletInterval(){
        return 3600 / this.weapon.rateOfFire;
    }
}