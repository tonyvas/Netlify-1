class Weapon{
    weapon = {
        name: null,
        damage: null,
        rateOfFire: null,
        range: null
    };

    constructor(nm, dmg, rof, rng){
        this.weapon.name = nm;
        this.weapon.damage = dmg;
        this.weapon.rateOfFire = rof;
        this.weapon.range = rng;
    }
}