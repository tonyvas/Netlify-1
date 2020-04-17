export default class Cell{
    constructor(type) {
        this.type = type;
    }

    getType(){
        return this.type;
    }

    setType(type){
        this.type = type;
    }
}