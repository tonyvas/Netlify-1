let gameScreen = document.getElementById('gameArea');

const IMAGES = {
    player: "imgs/playerImg.png",
    bullet: "imgs/bulletImg.png",
    enemyM: "imgs/enemyMeleeImg.png",
    enemyR: "imgs/enemyRangedImg.png",
    enemyB: "imgs/enemyBombImg.png",
    powerA: "imgs/powerupAmmoIng.png",
    powerG: "imgs/powerupGunImg.png",
    powerH: "imgs/powerupHealImg.png"
};

let ENEMY_AMOUNT = 5;
let PLAYER_SCREEN_RATIO = 1/18;
let ENEMY_SCREEN_RATIO = 1/18;
let BULLET_SCREEN_RATIO = 1/100;

let player;
let enemies;
const weapons = {
    melee: new Weapon("melee", 20, 1000, 50, 100),
    bomb: new Weapon("bomb", 100, 1, 200, 100),
    pistol: new Weapon("pistol", 20, 50, 800, 90),
    smg: new Weapon("smg", 30, 100, 1000, 85),
    rifle: new Weapon("rifle", 50, 75, 2000, 95)
};
let bullets = [];
let mouseXY = { X: null, Y: null };

let playerSpeed = { top: 10, X: 0, Y: 0 };
let enemySpeed = {top: 3, X: 0, Y: 0};
let bulletSpeed = {top: 20, X: 0, Y: 0};

let isPaused = false;
let isLooping = false;

function SetupGame(){
    ResetGame();

    CreatePlayer();
    CreateEnemies();

    if (isLooping == false)
        GameLoop();
}

function ResetGame(){
    isPaused = false;
    player = {actor: null, teleportCD: 0, teleportMax: 100, shootCD: 0};
    enemies = [];
    bullets = [];

    let actorImgs = document.getElementsByClassName("actor");
  
    while (actorImgs.length > 0){
        actorImgs[0].parentNode.removeChild(actorImgs[0]);
    }
}

function CreatePlayer(){
    player.actor = new Actor("p0", IMAGES.player, 100, weapons.smg, "player");
    player.actor.MoveTo(gameScreen.clientWidth / 2 + gameScreen.offsetLeft, gameScreen.clientHeight / 2 + gameScreen.offsetTop);
}

function CreateEnemies(){
    for(let i = 0; i < ENEMY_AMOUNT; i++){
        enemies[i] = {actor: null, shootCD: 0};

        let randType = Math.random() * 3;

        if (randType <= 1)
            enemies[i].actor = new Actor("e" + i, IMAGES.enemyB, 100, weapons.bomb, "enemyBomb");
        else if (randType <= 2)
            enemies[i].actor = new Actor("e" + i, IMAGES.enemyM, 100, weapons.melee, "enemyMelee");
        else if (randType <= 3)
            enemies[i].actor = new Actor("e" + i, IMAGES.enemyR, 100, weapons.pistol, "enemyRanged");
    }

    enemies.forEach(currEnemy => {
        let RandX = Math.floor(Math.random() * gameScreen.clientWidth) + gameScreen.offsetLeft;
        let RandY = Math.floor(Math.random() * gameScreen.clientHeight) + gameScreen.offsetTop;
        currEnemy.actor.MoveTo(RandX, RandY);
    });
}

function PauseGame(){
    isPaused = !isPaused;
}

function GameLoop() {
    isLooping = true;
    document.activeElement.blur();

    if (keyStates.isPause){
        keyStates.isPause = false;
        PauseGame();
    }

    if (isPaused == false) {        
        // if (CalculateEnemiesLeft() < ENEMY_AMOUNT)
        //     CreateEnemies();

        DoPlayerMovement();
        DoPlayerCombat();

        DoEnemyMovement();

        DoBulletMovement();

        DoCollisionCheck();
        DoCoolDown();
        console.log(enemies.length + ", " + bullets.length);
    }

    requestAnimationFrame(GameLoop);
}

function DeleteActor(){
    
}

function CalculateEnemiesLeft(){
    let count = 0;
    enemies.forEach(enem => {
        count++;
    });
    return count;
}

function DoPlayerMovement(){
    if (keyStates.isLeft || keyStates.isRight || keyStates.isUp || keyStates.isDown){
        CalculateSpeed();
        player.actor.MoveBy(playerSpeed.X, playerSpeed.Y);
    }
    if (keyStates.isTeleport){
        keyStates.isTeleport = false;
        TeleportToMouse();
    }
    RotatePlayer();
}

function DoPlayerCombat(){
    if (keyStates.isShoot && player.shootCD <= 0){
        Shoot(player, true);
        player.shootCD = player.actor.GetWeaponType().GetBulletInterval();
    }
}

function Shoot(shooter, isFriendly){
    let currWeapon = shooter.actor.GetWeaponType();
    let index = bullets.length;
    let startXY = {X: (shooter.actor.GetPos().X1 + shooter.actor.GetPos().X2) / 2, Y: (shooter.actor.GetPos().Y1 + shooter.actor.GetPos().Y2) / 2};

    if (isFriendly)
        targetXY = {X: mouseXY.X, Y: mouseXY.Y};
    else
        targetXY = {X: (player.actor.GetPos().X1 + player.actor.GetPos().X2) / 2, Y: (player.actor.GetPos().Y1 + player.actor.GetPos().Y2) / 2};
    
    let distX = startXY.X - targetXY.X;
    let distY = startXY.Y - targetXY.Y;
    let angle = Math.atan2(distY, distX);

    if (Math.random() <= 0.5)
        angle += (Math.random() * (100 - currWeapon.GetAccuracyValue())) / 100;
    else
        angle -= (Math.random() * (100 - currWeapon.GetAccuracyValue())) / 100;

    bullets[index] = {
        actor: new Actor('b' + index, IMAGES.bullet, null, null, "bullet"),
        damage: currWeapon.GetDamageValue(),
        xVector: bulletSpeed.top * Math.cos(angle) * - 1,
        yVector: bulletSpeed.top * Math.sin(angle) * -1,
        isFriend: isFriendly
    };

    bullets[index].actor.MoveTo(startXY.X, startXY.Y);
}

function DoEnemyMovement(){
    enemies.forEach(enem => {
        enemXY = {X: enem.actor.GetPos().X1, Y:enem.actor.GetPos().Y1};
        playerXY = {X: player.actor.GetPos().X1, Y: player.actor.GetPos().Y1}
        let enemRange = enem.actor.GetWeaponType().GetRangeValue();

        if ((enemXY.X - playerXY.X) ** 2 + (enemXY.Y - playerXY.Y) ** 2 < enemRange ** 2){
            DoEnemyCombat(enem, false);
        }
        else{
            if (enem.actor.GetType() != "enemyBomb"){
                MoveEnemyTowardsPlayer(enem);
            }
        }
    });
}

function DoEnemyCombat(enem){
    if (enem.shootCD <= 0){
        if (enem.actor.GetType() == "enemyBomb"){

        }
        else if (enem.actor.GetType() == "enemyMelee"){

        }
        else if (enem.actor.GetType() == "enemyRanged"){                
            Shoot(enem, false);
            enem.shootCD = enem.actor.GetWeaponType().GetBulletInterval();
        }
    }
}

function DoBulletMovement(){
    bullets.forEach(bullet => {
        bullet.actor.MoveBy(bullet.xVector, bullet.yVector);
            let bulletXY = bullet.actor.GetPos();
            let index = bullet.actor.GetId().slice(1);

            if (bulletXY.X1 <= gameScreen.offsetLeft || bulletXY.X2 >= gameScreen.offsetLeft + gameScreen.clientWidth || bulletXY.Y1 <= gameScreen.offsetTop || bulletXY.Y2 >= gameScreen.offsetTop + gameScreen.clientHeight){
                let img = document.getElementById(bullet.actor.GetId());
                if (img != null)
                    img.parentNode.removeChild(img);
                bullets.splice(index, 1);
            }
    });
}

function DoCollisionCheck(){
    CheckPlayerBounds();
    CheckBulletCollision();
}

function CheckBulletCollision(){
    bullets.forEach(bullet => {
        let bulletPos = bullet.actor.GetPos();
        let playerPos = player.actor.GetPos();

        if (bulletPos.X1 <= playerPos.X2 && bulletPos.X2 >= playerPos.X1 && bulletPos.Y1 <= playerPos.Y2 && bulletPos.Y2 >= playerPos.Y1 && bullet.isFriend == false){
            let imgP = document.getElementById(player.actor.GetId());
            let imgB = document.getElementById(bullet.actor.GetId());
            if (imgP != null)
                // imgP.parentNode.removeChild(imgP);
            if (imgB != null)
                imgB.parentNode.removeChild(imgB);
            // alert("ded");
            bullets.splice(bullet.actor.GetId().slice(1), 1);
        }

        enemies.forEach(enem => {
            let enemyPos = enem.actor.GetPos();
            if (bulletPos.X1 <= enemyPos.X2 && bulletPos.X2 >= enemyPos.X1 && bulletPos.Y1 <= enemyPos.Y2 && bulletPos.Y2 >= enemyPos.Y1 && bullet.isFriend){
                let imgE = document.getElementById(enem.actor.GetId());
                let imgB = document.getElementById(bullet.actor.GetId());
                if (imgE != null)
                    imgE.parentNode.removeChild(imgE);
                if (imgB != null)
                    imgB.parentNode.removeChild(imgB);
                enemies.splice(bullet.actor.GetId().slice(1), 1);
                bullets.splice(bullet.actor.GetId().slice(1), 1);
            }
        });
    });
}

function CheckPlayerBounds(){
    let playerPos = player.actor.GetPos();
    let targetPos = {X: playerPos.X1, Y: playerPos.Y1};

    if (playerPos.X1 <= gameScreen.offsetLeft)
        targetPos.X = gameScreen.offsetLeft;
        
    if (playerPos.X2 >= (gameScreen.offsetLeft + gameScreen.clientWidth))
        targetPos.X = gameScreen.offsetLeft + gameScreen.clientWidth - (playerPos.X2 - playerPos.X1);

    if (playerPos.Y1 <= gameScreen.offsetTop)
        targetPos.Y = gameScreen.offsetTop;

    if (playerPos.Y2 >= (gameScreen.offsetTop + gameScreen.clientHeight))
        targetPos.Y = gameScreen.offsetTop + gameScreen.clientHeight - (playerPos.Y2 - playerPos.Y1);

    player.actor.MoveTo(targetPos.X, targetPos.Y);
}

function MoveEnemyTowardsPlayer(enemy){
    let playerPos = player.actor.GetPos();
    let enemyPos = enemy.actor.GetPos();

    if (CheckEnemyEnemyCollision(enemy)) {
        let distX = enemyPos.X1 - playerPos.X1;
        let distY = enemyPos.Y1 - playerPos.Y1;
        let angle = Math.atan2(distY, distX);

        enemySpeed.X = enemySpeed.top * Math.cos(angle) * - 1;
        enemySpeed.Y = enemySpeed.top * Math.sin(angle) * - 1;

        enemy.actor.MoveBy(enemySpeed.X, enemySpeed.Y);
    }
}

function CheckEnemyEnemyCollision(enem){
    let currEnemyPos = enem.actor.GetPos();
    let playerPos = player.actor.GetPos();
    let closestEnemy = enem;

    enemies.forEach(checkEnemy =>{
        if (checkEnemy.actor.GetType() != "enemyBomb")
            if (enem.actor.GetType() == checkEnemy.actor.GetType()){
                let checkEnemyPos = checkEnemy.actor.GetPos();
                if (enem.actor.GetId() != checkEnemy.actor.GetId())
                    if (currEnemyPos.X1 < checkEnemyPos.X2 && currEnemyPos.X2 > checkEnemyPos.X1 && currEnemyPos.Y1 < checkEnemyPos.Y2 && currEnemyPos.Y2 > checkEnemyPos.Y1)
                        if ((Math.abs(currEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(currEnemyPos.Y1 - playerPos.Y1) ^ 2) > (Math.abs(checkEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(checkEnemyPos.Y1 - playerPos.Y1) ^ 2))
                            closestEnemy = checkEnemy;
            }
    });

    if (closestEnemy == enem)
        return true;
    else
        return false;
}

function DoCoolDown(){
    player.shootCD--;
    player.teleportCD--;
    enemies.forEach(enem => {
        enem.shootCD--;
    });
}

function RotatePlayer() {
    let playerImg = document.getElementsByClassName('player')[0];
    
    if (playerImg != null){
        let imgXY = { X: playerImg.offsetLeft + playerImg.width / 2, Y: playerImg.offsetTop + playerImg.height / 2 };
        let diffX = imgXY.X - mouseXY.X;
        let diffY = imgXY.Y - mouseXY.Y;
        let tan = diffY / diffX;
        let atan = Math.atan(tan) * 180 / Math.PI;;
        
        if (diffY >= 0 && diffX >= 0)
            atan += 180;
        else if (diffY <= 0 && diffX >= 0)
            atan -= 180;
    
        playerImg.style.transform = 'rotate(' + atan + 'deg)';
    }
}

function CalculateSpeed() {
    let topSpeed;

    if (keyStates.isSprint)
        topSpeed = playerSpeed.top * 2;
    else
        topSpeed = playerSpeed.top;

    if (keyStates.isLeft == keyStates.isRight)
        playerSpeed.X = 0;
    else if (keyStates.isLeft)
        playerSpeed.X = topSpeed * -1;
    else if (keyStates.isRight)
        playerSpeed.X = topSpeed;

    if (keyStates.isUp == keyStates.isDown)
        playerSpeed.Y = 0;
    else if (keyStates.isUp)
        playerSpeed.Y = topSpeed * -1;
    else if (keyStates.isDown)
        playerSpeed.Y = topSpeed;
}

function TeleportToMouse(){
    if (player.teleportCD <= 0){
        player.actor.MoveTo(mouseXY.X, mouseXY.Y);
        player.teleportCD = player.teleportMax;
    }
}

