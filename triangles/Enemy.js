class Enemy {
    enemy = {
        id: null,
        health: null,
        damage: null,
        image: null,
        xPos: null,
        yPos: null
    };

    constructor(img, area, num){
        this.id = num;
        this.enemy.health = 100;
        this.enemy.damage = 20;
        this.enemy.image = new Image();
        this.enemy.image.src = img;
        this.enemy.image.classList.add("enemyImage");
        document.body.appendChild(this.enemy.image);
    
        this.RandomSpawn(area);
    }

    RandomSpawn(spawnArea){
        let RandomX = Math.floor(spawnArea.clientWidth * Math.random() + spawnArea.offsetLeft);
        let RandomY = Math.floor(spawnArea.clientHeight * Math.random() + spawnArea.offsetTop);

        this.MoveTo(RandomX, RandomY);
    }

    MoveBy(x, y) {
        this.enemy.xPos += x;
        this.enemy.yPos += y;

        this.MoveTo(this.enemy.xPos, this.enemy.yPos)
    }

    MoveTo(x, y){
        this.enemy.xPos = x;
        this.enemy.yPos = y;

        this.enemy.image.style.left = this.enemy.xPos + 'px';
        this.enemy.image.style.top = this.enemy.yPos + 'px';
    }

    GetPos(){
        return {
            X1: this.enemy.xPos, 
            Y1: this.enemy.yPos, 
            X2: this.enemy.xPos + this.enemy.image.width, 
            Y2: this.enemy.yPos + this.enemy.image.height
        };
    }

    GetId(){
        return this.id;
    }
}