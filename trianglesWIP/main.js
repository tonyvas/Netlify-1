let canvas;
let context;
let isDebug = false;
let isPaused = false;
let isGameOver = false;
let isGodMode = false;

function main(){
    try {
        canvas = document.getElementById('canv');
        canvas.width = document.getElementById('gameScreen').clientWidth;
        canvas.height = document.getElementById('gameScreen').clientHeight;
        context = canvas.getContext('2d');

        const INVULNERABILITY_TIME = 0;
        let mouseXY = {x: 0, x: 0};
        let keyBinds = {left: "A", right: "D", up: "W", down: "S", auto: "SHIFT", pause: "ESCAPE", shoot: "0"};
        let keyStates = {isLeft: false, isRight: false, isUp: false, isDown: false, isAuto: false, isShoot: false, isPause: false};
        let gameStats = {
            fps: 0, 
            fpsUpdateTime: 10, 
            fpsUpdateSum: 0,
            mousePos: "0, 0",
            playerPos: "0, 0",
            canvasSize: "0, 0",
            startTime: 0, 
            currentTime: 0, 
            runTime: 0, 
            lastTime: 0, 
            game: 0,
            main: 0,
            playerIndex: 0,
            enemyIndex: 0,
            bulletIndex: 0,
            particleIndex: 0,
            particlesExist: 0,
            enemiesExist: 0,
            enemiesInCombat: 0
        };

        let images = {
            playership: createImg("imgs/enemyship.png", 150, 75),
            cargoship: createImg("imgs/cargoship.png", 125, 80),
            enemyship: createImg("imgs/spaceship.png", 100, 100),
            playerbullet: createImg("imgs/bluelaser.png", 100, 30),
            enemybullet: createImg("imgs/redlaser.png", 100, 30),
            crosshair: createImg("imgs/crosshair.png", 50, 50)
        };

        let playerStats = {
            scale: 0.5,
            speed: 5,
            spinSpeed: 3,
            startingHP: 150,
            type: "player",
            thrusterInfo: {
                colors: {min: {r:0,g:100,b:200}, max: {r:0,g:100,b:255}},
                spread: Math.PI / 8,
                amnt: 50,
                speed: 6,
                time: 2,
                size: 5
            }
        };

        let enemyStats = {
            chancePerFrame: 0.1,
            amount: 3,
            scale: 0.5,
            speed: 2,
            spinSpeed: 3,
            startingHP: 80,
            type: "enemy",
            spawnPerim: 100,
            detectionRange: 150,
            hugDist: 200,
            aimRadius: 0.2,
            thrusterInfo: {
                colors: {min: {r:0,g:0,b:0}, max: {r:255,g:0,b:0}},
                spread: Math.PI / 8,
                amnt: 15,
                speed: 3,
                time: 3,
                size: 3
            }
        };

        let cargoStats = {
            chancePerFrame: 0.01,
            amount: 2,
            scale: 0.5,
            speed: 3,
            startingHP: 100,
            type: "cargo"
        };

        let bulletStats = {
            scale: 0.1,
            speed: 10,
            type: "bullet"
        };

        let playerWeaponStats = {
            type: "playerWeapon",
            damage: 30,
            distance: 400,
            delay: 15,
            accuracy: 0.9
        };

        let playerWeaponAutoStats = {
            type: "playerWeaponAuto",
            damage: 15,
            distance: 300,
            delay: 30,
            accuracy: 0.9
        };

        let enemyWeaponStats = {
            type: "enemyWeapon",
            damage: 20,
            distance: 300,
            delay: 10,
            accuracy: 0.9
        };

        let player;
        let weapons;
        let enemies = [];
        let bullets = [];
        let particles = [];

        //Setup

        setupGame();
        function setupGame(){
            gameStats.startTime = Date.now();
            gameStats.lastTime = gameStats.startTime;
            document.getElementById('btn_debug').disabled = false;
            createWeapons();
            createPlayer();
            gameLoop();
        }

        //Game

        function gameLoop(){
            document.activeElement.blur();
            doStats();

            if (isGameOver == false){
                if (keyStates.isPause){
                    keyStates.isPause = false;
                    isPaused = !isPaused;
                }
            
                if (isPaused == false){
                    gameStats.main++;
                    createEnemies();
                    checkBulletCollision();
                    drawStuff();
                    moveStuff();
                    doCombat();
                    doCountDown();
                    checkAliveness();
                }            
    
                gameStats.game++;
                requestAnimationFrame(gameLoop);
            }
            else
                context.clearRect(0, 0, canvas.width, canvas.height);
        }

        //Create

        function createImg(src, w, h){
            let img = new Image();
            img.src = src;
            return {img: img, w: w, h: h};
        }

        function createWeapons(){
            weapons = {
                playerWeapon: new Weapon(
                    0, 
                    playerWeaponStats.type, 
                    playerWeaponStats.damage, 
                    playerWeaponStats.distance, 
                    playerWeaponStats.delay, 
                    playerWeaponStats.accuracy,
                    playerWeaponStats.range
                ),
                playerWeaponAuto: new Weapon(
                    1,
                    playerWeaponAutoStats.type,
                    playerWeaponAutoStats.damage,
                    playerWeaponAutoStats.distance,
                    playerWeaponAutoStats.delay,
                    playerWeaponAutoStats.accuracy,
                    playerWeaponAutoStats.range
                ),
                enemyWeapon: new Weapon(
                    2, 
                    enemyWeaponStats.type, 
                    enemyWeaponStats.damage, 
                    enemyWeaponStats.distance, 
                    enemyWeaponStats.delay, 
                    enemyWeaponStats.accuracy,
                    enemyWeaponStats.range
                )
            };
        }

        function createPlayer(){
            player = {
                actor: new Actor(
                    gameStats.playerIndex, 
                    playerStats.type, 
                    playerStats.startingHP, 
                    {x: canvas.width / 2, y: canvas.height / 2}, 
                    images.playership
                ),
                currSpeed: {x: 0, y: 0},
                weapon: weapons.playerWeapon,
                autoWeapon: weapons.playerWeaponAuto,
                rad: Math.PI / 2,
                shootDelay: 0,
                autoShootDelay: 0,
                invulTime: 0
            };
            gameStats.playerIndex++;
        }

        function createEnemies(){
            if (enemies.length < enemyStats.amount){
                if (Math.random() <= enemyStats.chancePerFrame){
                    let i = enemies.length;
                    enemies[i] = {
                        actor: new Actor(
                            gameStats.enemyIndex,
                            enemyStats.type,
                            enemyStats.startingHP,
                            getRandomSpawnPoint(),
                            images.enemyship
                        ),
                        currSpeed: {x: 0, y: 0},
                        weapon: weapons.enemyWeapon,
                        passBy: getRandomPassByPoint(),
                        rad: null,
                        didEnter: false,
                        isInCombat: false,
                        isInRange: false,
                        isLeaving: false,
                        shootDelay: 0,
                        invulTime: 0
                    }
                    enemies[i].rad = -getRadToTarget(enemies[i].actor.getPos(), enemies[i].passBy);
                    gameStats.enemyIndex++;
                }
            }

            function getRandomSpawnPoint(){
                let area = Math.random() * 4;
                let x, y;

                if (area <= 2){
                    x = getRandomBetween(0, canvas.width);

                    if (area <= 1) //top
                        y = getRandomBetween(-enemyStats.spawnPerim, 0);
                    else //bottom
                        y = getRandomBetween(canvas.height, canvas.height + enemyStats.spawnPerim);
                }
                else{
                    y = getRandomBetween(0, canvas.height);

                    if (area <= 3) //left
                        x = getRandomBetween(-enemyStats.spawnPerim, 0);
                    else //right
                        x = getRandomBetween(canvas.width, canvas.width + enemyStats.spawnPerim);
                }

                return {x: x, y: y};
            }

            function getRandomPassByPoint(){
                let x = Math.random() * canvas.width;
                let y = Math.random() * canvas.height;
                return {x: x, y: y};
            }
        }

        function createBullet(friendly, wpn, sXY, tXY, iniSpeed = {x: 0, y: 0}){
            let img;
            if (friendly)
                img = images.playerbullet;
            else
                img = images.enemybullet;

            let accShiftMin = wpn.getAccuracy();
            let accShiftMax = wpn.getAccuracy() + 2 * (1 - wpn.getAccuracy());

            let rad = simplifyRads(getRadToTarget(sXY, tXY));

            let speed = {
                x: iniSpeed.x + bulletStats.speed * makeMoreOrLess(Math.cos(rad), accShiftMin, accShiftMax), 
                y: iniSpeed.y + bulletStats.speed * makeMoreOrLess(Math.sin(rad), accShiftMin, accShiftMax)
            };

            bullets.push({
                actor: new Actor(gameStats.bulletIndex, bulletStats.type, null, {x:sXY.x,y:sXY.y}, img, null),
                currSpeed: speed,
                rad: rad,
                isFriend: friendly,
                time: wpn.getDistance(),
                damage: wpn.getDamage()
            });
            gameStats.bulletIndex++;
        }

        //Draw

        function drawStuff(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawParticles();
            drawBullets();
            drawPlayer();
            drawEnemies();
            // drawLeadCrosshairs();
        }

        function drawPlayer(){
            doThrusterParticles(player);
            drawActor(player.actor.getPos(), player.actor.getSize(), player.rad, player.actor.getImage(), playerStats.scale)
        }

        function drawEnemies(){
            enemies.forEach(enem => {
                doThrusterParticles(enem);
                drawActor(enem.actor.getPos(), enem.actor.getSize(), enem.rad, enem.actor.getImage(), enemyStats.scale);
            });
        }

        function drawBullets(){
            bullets.forEach(blt => {
                drawActor(blt.actor.getPos(), blt.actor.getSize(), blt.rad, blt.actor.getImage(), bulletStats.scale);
            });
        }

        function drawLeadCrosshairs(){
            enemies.forEach(enem => {
                let leadDist = calculateLeadDist(enem);
                let enemXY = enem.actor.getPos();
                let crosshairXY = {
                    x: enemXY.x + leadDist * Math.cos(enem.rad + Math.PI), 
                    y: enemXY.y + leadDist * Math.sin(enem.rad + Math.PI)
                };
                let crosshairWH = {w: images.crosshair.w, h: images.crosshair.h};
                drawActor(crosshairXY, crosshairWH, 0, images.crosshair.img, 1);
            });
        }

        function drawActor(xy, wh, rad, img, scale){
            context.save();
            context.translate(xy.x, xy.y);
            context.rotate(rad + Math.PI);
            context.translate(-xy.x, -xy.y);
            context.drawImage(
                img, 
                xy.x - wh.w / 2 * scale, 
                xy.y - wh.h / 2 * scale, 
                wh.w * scale, 
                wh.h * scale);
            context.restore();
        }

        function drawParticles(){
            particles.forEach(particle => {
                context.fillStyle = particle.color;
                context.fillRect(particle.pos.x, particle.pos.y, particle.size, particle.size);
            });
        }

        //Move

        function moveStuff(){
            movePlayer();
            moveEnemies();
            moveBullets();
            moveParticles();
        }

        function movePlayer(){
            let playerXY = player.actor.getPos();
            let playerWH = player.actor.getSize();
            player.currSpeed = {x: 0, y: 0};

            if (keyStates.isUp != keyStates.isDown){
                if (keyStates.isUp){
                    player.currSpeed.x = -playerStats.speed * Math.cos(player.rad);
                    player.currSpeed.y = -playerStats.speed * Math.sin(player.rad);
                }
                else if (keyStates.isDown){
                    player.currSpeed.x = playerStats.speed * Math.cos(player.rad);
                    player.currSpeed.y = playerStats.speed * Math.sin(player.rad);
                }
            }

            if (keyStates.isLeft != keyStates.isRight){
                if (keyStates.isLeft)
                    rotateActor(player, -degToRad(playerStats.spinSpeed));
                else if (keyStates.isRight)
                    rotateActor(player, degToRad(playerStats.spinSpeed));
            }

            if (player.currSpeed.x != 0 || player.currSpeed.y != 0){
                player.actor.moveBy(player.currSpeed.x, player.currSpeed.y);

                playerXY = player.actor.getPos();
                playerWH = player.actor.getSize();

                x = playerXY.x;
                y = playerXY.y;
                if (playerXY.x - playerWH.w / 2 * playerStats.scale <= 0)
                    x = playerWH.w / 2 * playerStats.scale;
                if (playerXY.x + playerWH.w / 2 * playerStats.scale >= canvas.width)
                    x = canvas.width - playerWH.w / 2 * playerStats.scale;
                if (playerXY.y - playerWH.h / 2 * playerStats.scale <= 0)
                    y = playerWH.h / 2 * playerStats.scale;
                if (playerXY.y + playerWH.h / 2 * playerStats.scale >= canvas.height)
                    y = canvas.height - playerWH.h / 2 * playerStats.scale;

                player.actor.moveTo(x, y);
            }
        }

        function moveEnemies(){
            enemies.forEach(enem => {
                let enemXY = enem.actor.getPos();
                let enemWH = enem.actor.getSize();
                enem.currSpeed = {x: 0, y: 0};

                if (enem.isInCombat)
                    rotateActor(enem, degToRad(enemyStats.spinSpeed), getRadToTarget(enem.actor.getPos(), player.actor.getPos()));

                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) > enemyStats.hugDist && enem.isInCombat || enem.isInCombat == false){
                    if (canEnemyMove(enem) && enem.isInCombat || enem.isInCombat == false){
                        enem.currSpeed.x = -enemyStats.speed * Math.cos(enem.rad);
                        enem.currSpeed.y = -enemyStats.speed * Math.sin(enem.rad);
                        enem.actor.moveBy(enem.currSpeed.x, enem.currSpeed.y);
                    }
                }

                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= enemyStats.hugDist && enem.isInCombat)
                    enem.isInRange = true;
                
                enemXY = enem.actor.getPos();
                enemWH = enem.actor.getSize();
                if (enemXY.x - enemWH.w / 2 < canvas.width && enemXY.x + enemWH.w / 2 > 0 ||
                    enemXY.y - enemWH.h / 2 < canvas.height && enemXY.y + enemWH.h / 2 > 0)
                    enem.didEnter = true;
            });
        }

        function moveBullets(){
            bullets.forEach(blt => {
                blt.actor.moveBy(blt.currSpeed.x, blt.currSpeed.y);
            });
        }

        function moveParticles(){
            particles.forEach(particle => {
                particle.pos.x += particle.speed * Math.cos(particle.angle);
                particle.pos.y += particle.speed * Math.sin(particle.angle);
            });
        }

        //Do

        function doStats(){
            let statKeys = Object.keys(gameStats);
            let statVals = Object.values(gameStats);
            let table = document.getElementById('game_debug_info_table');
            let cells = document.getElementsByClassName('game_debug_info');

            if (isDebug)
                if (cells.length == 0){
                    for (let i = 0; i < statKeys.length; i++){
                        let row = document.createElement('tr');
                        let cell = document.createElement('th');
                        cell.classList.add('game_debug_info');
                        cell.innerHTML = statKeys[i] + ": " + statVals[i];

                        row.appendChild(cell);
                        table.appendChild(row);
                    }
                }
                else
                    for (let i = 0; i < cells.length; i++)
                        cells[i].innerHTML = statKeys[i] + ": " + statVals[i];
            else{
                let rows = table.getElementsByTagName('tr');
                if (rows.length != 0)
                    for (let i = 0; i < rows.length; i++)
                        rows[i].parentNode.removeChild(rows[i]);
            }

            gameStats.mousePos = Math.floor(mouseXY.x) + ", " + Math.floor(mouseXY.y);
            gameStats.canvasSize = canvas.width + ", " + canvas.height;
            gameStats.particlesExist = particles.length;
            gameStats.enemiesExist = enemies.length;
            gameStats.currentTime = Date.now();
            gameStats.runTime = gameStats.currentTime - gameStats.startTime;
            if (gameStats.game % gameStats.fpsUpdateTime == 0){
                gameStats.fps = Math.floor(1000 / gameStats.fpsUpdateSum * gameStats.fpsUpdateTime);
                gameStats.fpsUpdateSum = 0;
            }
            else
                gameStats.fpsUpdateSum += gameStats.currentTime - gameStats.lastTime;
            gameStats.lastTime = gameStats.currentTime;
            gameStats.enemiesInCombat = 0;
            enemies.forEach(enem => {
                if (enem.isInCombat)
                    gameStats.enemiesInCombat++;
            });
            gameStats.playerPos = Math.floor(player.actor.getPos().x) + ", " + Math.floor(player.actor.getPos().y);
        }

        function doCombat(){
            if (player.shootDelay <= 0){
                if (keyStates.isShoot){
                    if (mouseXY.x >= canvas.offsetLeft && mouseXY.x <= canvas.offsetLeft + canvas.width &&
                        mouseXY.y >= canvas.offsetTop && mouseXY.y <= canvas.offsetTop + canvas.height){
                        createBullet(true, player.weapon, player.actor.getPos(), {x: mouseXY.x - canvas.offsetLeft, y: mouseXY.y - canvas.offsetTop}/*, player.currSpeed*/);
                        player.shootDelay = player.weapon.getDelay();
                    }
                }
            }
            if (player.autoShootDelay <= 0){
                let cEnem = getClosestEnemToPlayerInCombat();
                    if (cEnem != null){
                        if (getDistToTarget(cEnem.actor.getPos(), player.actor.getPos()) <= player.autoWeapon.getDistance()){
                            createBullet(true, player.autoWeapon, player.actor.getPos(), cEnem.actor.getPos());
                            player.autoShootDelay = player.autoWeapon.getDelay();
                        }
                    }
            }

            enemies.forEach(enem => {
                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= enemyStats.detectionRange && enem.isInCombat == false && enem.isLeaving == false){
                    enem.isInCombat = true;
                }

                if (enem.isInCombat && enem.isInRange && getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= weapons.enemyWeapon.getDistance() && enem.shootDelay <= 0){
                    if (canEnemyShoot(enem.actor.getPos(), player.actor.getPos(), enem.rad, enemyStats.aimRadius * Math.PI)){
                        createBullet(false, enem.weapon, enem.actor.getPos(), player.actor.getPos()/*, enem.currSpeed*/);
                        enem.shootDelay = enem.weapon.getDelay();
                    }
                }
            });
        }

        function doParticles(x, y, amnt, spd, time, size, clrMin, clrMax, angMin, angMax){
            for (let i = 0; i < amnt; i++){
                let ang = degToRad(getRandomBetween(radToDeg(angMin), radToDeg(angMax)));
                let r = getRandomBetween(clrMin.r, clrMax.r);
                let g = getRandomBetween(clrMin.g, clrMax.g);
                let b = getRandomBetween(clrMin.b, clrMax.b);
                let clr = "rgb("+r+","+g+","+b+")"
                particles.push({
                    id: gameStats.particleIndex,
                    pos: {x: x, y: y},
                    speed: spd,
                    angle: ang,
                    time: time,
                    color: clr,
                    size: size
                });
                gameStats.particleIndex++;
            }
        }

        function doThrusterParticles(actor){
            let xy = actor.actor.getPos();

            if (actor.actor.getType() == "player"){
                doParticles(
                    xy.x, xy.y, 
                    playerStats.thrusterInfo.amnt,
                    playerStats.thrusterInfo.speed,
                    playerStats.thrusterInfo.time,
                    playerStats.thrusterInfo.size,
                    playerStats.thrusterInfo.colors.min,
                    playerStats.thrusterInfo.colors.max,
                    actor.rad - playerStats.thrusterInfo.spread,
                    actor.rad + playerStats.thrusterInfo.spread
                );
            }
            else if (actor.actor.getType() == "enemy"){
                doParticles(
                    xy.x, xy.y, 
                    enemyStats.thrusterInfo.amnt,
                    enemyStats.thrusterInfo.speed,
                    enemyStats.thrusterInfo.time,
                    enemyStats.thrusterInfo.size,
                    enemyStats.thrusterInfo.colors.min,
                    enemyStats.thrusterInfo.colors.max,
                    actor.rad - enemyStats.thrusterInfo.spread,
                    actor.rad + enemyStats.thrusterInfo.spread
                );
            }
        }

        function doBulletImpact(bullet, actor, dmg){
            if (actor.invulTime <= 0){
                let i = bullets.indexOf(bullet);
                if (i != -1)
                    bullets.splice(i, 1);

                actor.actor.addHealth(-dmg);
                actor.invulTime = INVULNERABILITY_TIME;

                if (actor.actor.getType() != "player"){
                    actor.isLeaving = false;
                    actor.isInCombat = true;
                }
            }
        }

        function doCountDown(){
            player.shootDelay--;
            player.autoShootDelay--;
            player.invulTime--;

            particles.forEach(particle => {
                if (particle.time > 0)
                    particle.time--;
                else{
                    let i = particles.indexOf(particle);
                    if (i != -1)
                        particles.splice(i, 1);
                }
            });

            enemies.forEach(enem => {
                if (enem.didEnter && enem.isInCombat == false){
                    let enemXY = enem.actor.getPos();
                    let enemWH = enem.actor.getSize();

                    if (enemXY.x - enemWH.w / 2 > canvas.width || enemXY.x + enemWH.w / 2 < 0 ||
                        enemXY.y - enemWH.h / 2 > canvas.height || enemXY.y + enemWH.h / 2 < 0){
                        let i = enemies.indexOf(enem);
                        if (i != -1)
                            enemies.splice(i, 1);
                    }
                }

                enem.shootDelay--;
                enem.invulTime--;
            });

            bullets.forEach(blt => {
                let bltXY = blt.actor.getPos();
                let bltWH = blt.actor.getSize();

                if (bltXY.x - bltWH.w / 2 > canvas.width || bltXY.x + bltWH.w / 2 < 0 ||
                    bltXY.y - bltWH.h / 2 > canvas.height || bltXY.y + bltWH.h / 2 < 0 || blt.time <= 0){
                        let i = bullets.indexOf(blt);
                        if (i != -1)
                            bullets.splice(i, 1);
                    }
                else
                    blt.time -= bulletStats.speed;
            });
        }

        //Get
        
        function getRandomBetween(min, max){
            return Math.random() * (max - min) + min;
        }

        function getDistToTarget(startXY, targetXY){
            let x = Math.abs(startXY.x - targetXY.x);
            let y = Math.abs(startXY.y - targetXY.y);
            let dist = Math.sqrt(x ** 2 + y ** 2);
            return dist;
        }

        function getRadToTarget(startXY, targetXY){
            let distX = targetXY.x - startXY.x;
            let distY = targetXY.y -  startXY.y;
            let rad = Math.atan2(distY, distX);
            return rad;
        }

        function getClosestEnemToPlayerInCombat(){
            let closestEnem = null;

            enemies.forEach(enem => {
                if (enem.isInCombat)
                    if (closestEnem == null)
                        closestEnem = enem
                    else if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) < getDistToTarget(enem.actor.getPos(), player.actor.getPos()))
                        closestEnem = enem;
            });
        
            return closestEnem;
        }

        //Check

        function canEnemyMove(enem){
            let closestEnemy = enem;
        
            enemies.forEach(checkEnem =>{
                    if (enem.actor.getId() != checkEnem.actor.getId())
                        if (checkForCollision(enem, enemyStats.scale, checkEnem, enemyStats.scale))
                            if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) > getDistToTarget(enem.actor.getPos(), player.actor.getPos()))
                                closestEnemy = checkEnem;
            });
        
            if (closestEnemy == enem)
                return true;
            else
                return false;
        }

        function canEnemyShoot(startXY, targetXY, shooterRads, radius){
            let min = shooterRads - radius;
            let max = shooterRads + radius;
            let radsToTarget = simplifyRads(getRadToTarget(startXY, targetXY) + Math.PI);
            return (radsToTarget < max && radsToTarget > min);
        }

        function checkBulletCollision(){
            bullets.forEach(blt => {
                let bulletXY = blt.actor.getPos();
                let bulletWH = blt.actor.getSize();
                if (blt.isFriend){
                    enemies.forEach(enem => {
                        let enemXY = enem.actor.getPos();
                        let enemWH = enem.actor.getSize();

                        if (bulletXY.x - bulletWH.w / 2 * bulletStats.scale < enemXY.x + enemWH.w / 2 * playerStats.scale &&
                            bulletXY.x + bulletWH.w / 2 * bulletStats.scale > enemXY.x - enemWH.w / 2 * playerStats.scale &&
                            bulletXY.y - bulletWH.h / 2 * bulletStats.scale < enemXY.y + enemWH.h / 2 * playerStats.scale &&
                            bulletXY.y + bulletWH.h / 2 * bulletStats.scale > enemXY.y - enemWH.h / 2 * playerStats.scale){
                            doBulletImpact(blt, enem, enem.weapon.getDamage());
                        }
                    });
                }
                else{
                    let playerXY = player.actor.getPos();
                    let playerWH = player.actor.getSize();

                    if (bulletXY.x - bulletWH.w / 2 * bulletStats.scale < playerXY.x + playerWH.w / 2 * playerStats.scale &&
                        bulletXY.x + bulletWH.w / 2 * bulletStats.scale > playerXY.x - playerWH.w / 2 * playerStats.scale &&
                        bulletXY.y - bulletWH.h / 2 * bulletStats.scale < playerXY.y + playerWH.h / 2 * playerStats.scale &&
                        bulletXY.y + bulletWH.h / 2 * bulletStats.scale > playerXY.y - playerWH.h / 2 * playerStats.scale){
                        doBulletImpact(blt, player, player.weapon.getDamage());
                    }
                }
            });
        }

        function checkAliveness(){
            if (player.actor.getHealth() <= 0 && isGodMode == false){
                let xy = player.actor.getPos();
                doParticles(xy.x, xy.y, 50, 5, 5, 5, {r:200,g:200,b:0}, {r:200,g:200,b:0}, 0, 2 * Math.PI);
                makeEnemsInCombatLeave();
                createPlayer();
                // isGameOver = true;
                // alert("you ded");
            }

            enemies.forEach(enem => {
                if (enem.actor.getHealth() <= 0){
                    let xy = enem.actor.getPos();
                    doParticles(xy.x, xy.y, 50, 5, 3, 4, {r:200,g:200,b:0}, {r:200,g:200,b:0}, 0, 2 * Math.PI);
                    let i = enemies.indexOf(enem);
                    if (i != -1)
                        enemies.splice(i, 1);
                }
            });
        }

        function checkForCollision(a, aScale, b, bScale){
            let aXY = a.actor.getPos();
            let aWH = a.actor.getSize();
            let bXY = b.actor.getPos();
            let bWH = b.actor.getSize();

            if (aXY.x - aWH.w / 2 * aScale <= bXY.x + bWH.w / 2 * bScale)
                if (aXY.x + aWH.w / 2 * aScale >= bXY.x - bWH.w / 2 * bScale)
                    if (aXY.y - aWH.h / 2 * aScale <= bXY.y + bWH.h / 2 * bScale)
                        if (aXY.y + aWH.h / 2 * aScale >= bXY.y - bWH.h / 2 * bScale)
                            return true;
            return false;
        }

        //Math

        function radToDeg(ang){
            return ang * (180 / Math.PI);
        }

        function degToRad(ang){
            return Math.PI / 180 * ang;
            
        }

        function calculateLeadDist(actor){
            return 100;
        }

        //Other

        function makeEnemsInCombatLeave(){
            enemies.forEach(enem => {
                if (enem.isInCombat){
                    enem.rad += Math.PI;
                    enem.isLeaving = true;
                    enem.isInCombat = false;
                }
            });
        }

        function makeMoreOrLess(num, min, max){
            let val = getRandomBetween(min, max);
            return num * val;
        }

        function rotateActor(actor, max, targetRad = null){
            if (targetRad == null)
                actor.rad += max;
            else{
                let rads = max;
                let orientation;

                if (Math.sin(actor.rad - targetRad) > 0)
                    orientation = 1;
                else if (Math.sin(actor.rad - targetRad) < 0)
                    orientation = -1;
                else
                    rads = 0;
                actor.rad += (rads * orientation);
            }

            actor.rad = simplifyRads(actor.rad);
        }

        function simplifyRads(rad){
            while (rad > Math.PI)
                rad -= (2 * Math.PI);
            while (rad < -Math.PI)
                rad += (2 * Math.PI);

            return rad;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //                                              ---//-START OF EVENT STUFF-//---                                              //
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        document.addEventListener("mousemove", MouseMoved);
        document.addEventListener("mousedown", MouseDown);
        document.addEventListener("mouseup", MouseUp);
        document.addEventListener("keydown", KeyDown);
        document.addEventListener("keyup", KeyUp);

        function MouseMoved(e) {
            mouseXY.x = e.clientX;
            mouseXY.y = e.clientY;
        }

        function MouseDown(e) {
            if (e.button == keyBinds.shoot) {
                keyStates.isShoot = true;
            }
        }   

        function MouseUp(e) {
            if (e.button == keyBinds.shoot) {
                keyStates.isShoot = false;
            }
        }

        function KeyDown(e) {
            if (e.key.toUpperCase() == keyBinds.up) {
                keyStates.isUp = true;
            }
            else if (e.key.toUpperCase() == keyBinds.down) {
                keyStates.isDown = true;
            }
            else if (e.key.toUpperCase() == keyBinds.left) {
                keyStates.isLeft = true;
            }
            else if (e.key.toUpperCase() == keyBinds.right) {
                keyStates.isRight = true;
            }
            else if (e.key.toUpperCase() == keyBinds.auto) {
                keyStates.isAuto = true;
            }
            else if (e.key.toUpperCase() == keyBinds.pause) {
                keyStates.isPause = true;
            }
        }

        function KeyUp(e) {
            if (e.key.toUpperCase() == keyBinds.up) {
                keyStates.isUp = false;
            }
            else if (e.key.toUpperCase() == keyBinds.down) {
                keyStates.isDown = false;
            }
            else if (e.key.toUpperCase() == keyBinds.left) {
                keyStates.isLeft = false;
            }
            else if (e.key.toUpperCase() == keyBinds.right) {
                keyStates.isRight = false;
            }
            else if (e.key.toUpperCase() == keyBinds.auto) {
                keyStates.isAuto = false;
            }
        }
    } catch (error) {
        alert("error: \n" + error.stack);
        console.log(error);
    }
}