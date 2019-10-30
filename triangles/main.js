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
let ENEMY_AMOUNT = 20;
let mouseXY = { X: null, Y: null };

let player;
let enemies = [];
let weapons = {
    melee: new Weapon("melee", 20, 10, 10, 100),
    bomb: new Weapon("bomb", 100, 1, 50, 100),
    pistol: new Weapon("pistol", 20, 400, 100, 90),
    smg: new Weapon("smg", 30, 950, 100, 85),
    rifle: new Weapon("rifle", 50, 600, 300, 95)
};
let bullets = [];

let playerSpeed = { top: 10, X: 0, Y: 0 };
let enemySpeed = {top: 3, X: 0, Y: 0};
let bulletSpeed = {top: 20, X: 0, Y: 0};

let isPaused = false;
let isLooping = false;

let coolDowns = {
    teleportCurr: 0,
    teleportMax: 100,
    playerShootCurr: 0
};

function SetupGame(){
    ResetGame();

    CreatePlayer();
    CreateEnemies();

    if (isLooping == false)
        GameLoop();

    function ResetGame(){
        isPaused = false;
        player = null;
        enemies = [];
      
        let actorImgs = document.getElementsByClassName("actor");
      
        while (actorImgs.length > 0){
            actorImgs[0].parentNode.removeChild(actorImgs[0]);
        }
    }

    function CreatePlayer(){
        player = new Actor("p0", IMAGES.player, 100, weapons.pistol, "player");
        player.MoveTo(gameScreen.clientWidth / 2 + gameScreen.offsetLeft, gameScreen.clientHeight / 2 + gameScreen.offsetTop);
    }
    
    function CreateEnemies(){
        for(let i = 0; i < ENEMY_AMOUNT; i++){
            let randType = Math.random() * 3;
    
            if (randType <= 1)
                enemies[enemies.length] = new Actor("e" + i, IMAGES.enemyB, 100, weapons.bomb, "enemy");
            else if (randType <= 2)
                enemies[enemies.length] = new Actor("e" + i, IMAGES.enemyM, 100, weapons.melee, "enemy");
            else if (randType <= 3)
                enemies[enemies.length] = new Actor("e" + i, IMAGES.enemyR, 100, weapons.pistol, "enemy");
        }
    
        enemies.forEach(currEnemy => {
            let RandX = Math.floor(Math.random() * gameScreen.clientWidth) + gameScreen.offsetLeft;
            let RandY = Math.floor(Math.random() * gameScreen.clientHeight) + gameScreen.offsetTop;
            currEnemy.MoveTo(RandX, RandY);
        });
    }
}

function GameLoop() {
    isLooping = true;
    document.activeElement.blur();

    if (isPaused == false) {
        if (keyStates.isPause){
            keyStates.isPause = false;
            isPaused = !isPaused;
        }
        
        DoPlayerMovement();
        DoPlayerCombat();

        DoEnemyMovement();
        DoEnemyCombat();

        DoBulletMovement();

        DoCollisionCheck();
        DoCoolDown();
    }

    requestAnimationFrame(GameLoop);

    function DoPlayerMovement(){
        if (keyStates.isLeft || keyStates.isRight || keyStates.isUp || keyStates.isDown){
            CalculateSpeed();
            player.MoveBy(playerSpeed.X, playerSpeed.Y);
        }
        if (keyStates.isTeleport){
            keyStates.isTeleport = false;
            TeleportToMouse();
        }
        RotatePlayer();
    }

    function DoPlayerCombat(){
        if (keyStates.isShoot && coolDowns.playerShootCurr <= 0){
            Shoot(player, true);
            coolDowns.playerShootCurr = player.GetWeaponType().GetBulletInterval();
        }
    }

    function Shoot(shooter, isFriendly){
        let currWeapon = shooter.GetWeaponType();
        let index = bullets.length;
        let startXY = {X: (shooter.GetPos().X1 + shooter.GetPos().X2) / 2, Y: (shooter.GetPos().Y1 + shooter.GetPos().Y2) / 2};

        if (isFriendly)
            targetXY = {X: mouseXY.X, Y: mouseXY.Y};
        else
            targetXY = {X: (player.GetPos().X1 + player.GetPos().X2) / 2, Y: (player.GetPos().Y1 + player.GetPos().Y2) / 2};
        
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
        MoveEnemyTowardsPlayer();
    }

    function DoEnemyCombat(){
        enemies.forEach(enem => {
            
        });
    }

    function DoBulletMovement(){
        bullets.forEach(bullet => {
            if (bullet != null){
                bullet.actor.MoveBy(bullet.xVector, bullet.yVector);
                let bulletXY = bullet.actor.GetPos();
                let index = bullet.actor.GetId().slice(1);

                if (bulletXY.X1 <= gameScreen.offsetLeft || bulletXY.X2 >= gameScreen.offsetLeft + gameScreen.clientWidth || bulletXY.Y1 <= gameScreen.offsetTop || bulletXY.Y2 >= gameScreen.offsetTop + gameScreen.clientHeight){
                    let img = document.getElementById('b' + index);
                    img.parentNode.removeChild(img);
                    bullets[index] = null;
                }
            }
        });
    }

    function DoCollisionCheck(){
        CheckPlayerBounds();
        CheckPlayerEnemyCollision();
    }
}

function CheckPlayerBounds(){
    let playerPos = player.GetPos();
    let targetPos = {X: playerPos.X1, Y: playerPos.Y1};

    if (playerPos.X1 <= gameScreen.offsetLeft)
        targetPos.X = gameScreen.offsetLeft;
        
    if (playerPos.X2 >= (gameScreen.offsetLeft + gameScreen.clientWidth))
        targetPos.X = gameScreen.offsetLeft + gameScreen.clientWidth - (playerPos.X2 - playerPos.X1);

    if (playerPos.Y1 <= gameScreen.offsetTop)
        targetPos.Y = gameScreen.offsetTop;

    if (playerPos.Y2 >= (gameScreen.offsetTop + gameScreen.clientHeight))
        targetPos.Y = gameScreen.offsetTop + gameScreen.clientHeight - (playerPos.Y2 - playerPos.Y1);

    player.MoveTo(targetPos.X, targetPos.Y);
}

function CheckPlayerEnemyCollision(){
    let playerPos = player.GetPos();
    let enemyPos;

    enemies.forEach(currEnemy => {
        enemyPos = currEnemy.GetPos();

        if (playerPos.X1 < enemyPos.X2 && playerPos.X2 > enemyPos.X1 && playerPos.Y1 < enemyPos.Y2 && playerPos.Y2 > enemyPos.Y1)
            console.log("Collision");
    });
}

function MoveEnemyTowardsPlayer(){
    let playerPos = player.GetPos();
    let enemyPos;

    enemies.forEach(currEnemy => {
        if (CheckEnemyEnemyCollision(currEnemy)) {
            enemyPos = currEnemy.GetPos();
            let distX = enemyPos.X1 - playerPos.X1;
            let distY = enemyPos.Y1 - playerPos.Y1;
            let angle = Math.atan2(distY, distX);

            enemySpeed.X = enemySpeed.top * Math.cos(angle) * - 1;
            enemySpeed.Y = enemySpeed.top * Math.sin(angle) * - 1;

            currEnemy.MoveBy(enemySpeed.X, enemySpeed.Y);
        }
    });

    function CheckEnemyEnemyCollision(enem){
        let currEnemyPos = enem.GetPos();
        let playerPos = player.GetPos();
        let closestEnemy = enem;
    
        enemies.forEach(checkEnemy =>{
            let checkEnemyPos = checkEnemy.GetPos();
            if (enem.GetId() != checkEnemy.GetId())
                if (currEnemyPos.X1 < checkEnemyPos.X2 && currEnemyPos.X2 > checkEnemyPos.X1 && currEnemyPos.Y1 < checkEnemyPos.Y2 && currEnemyPos.Y2 > checkEnemyPos.Y1)
                    if ((Math.abs(currEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(currEnemyPos.Y1 - playerPos.Y1) ^ 2) > (Math.abs(checkEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(checkEnemyPos.Y1 - playerPos.Y1) ^ 2))
                        closestEnemy = checkEnemy;
        });
    
        if (closestEnemy == enem)
            return true;
        else
            return false;
    }
}

function DoCoolDown(){
    coolDowns.teleportCurr--;
    coolDowns.playerShootCurr--;
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
    if (coolDowns.teleportCurr <= 0){
        player.MoveTo(mouseXY.X, mouseXY.Y);
        coolDowns.teleportCurr = coolDowns.teleportMax;
    }
}

