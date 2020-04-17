export default class Move {
    constructor(dir, dist) {
        this.direction = dir;
        this.distance = dist;
    }

    getDir(){
        return this.direction;
    }

    getDist(){
        return this.distance;
    }

    subtrace(amnt){
        this.distance -= amnt;
        if (this.distance < 0){
            alert('Negative Distance!');
        }
    }
}
