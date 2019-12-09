function main() {
    try {
        //#region Setup
        canvas = document.getElementById('canv');
        canvas.width = document.getElementById('gameScreen').clientWidth;
        canvas.height = document.getElementById('gameScreen').clientHeight;
        context = canvas.getContext('2d');
        setupGame();

        function setupGame() {
            gameStats.startTime.val = Date.now();
            gameStats.lastTime.val = gameStats.startTime;
            isGameOver = false;
            resetLets();
            createWeapons();
            createPlayer();

            if (isLooping == false)
                gameLoop();
            isLooping = true;
        }
        //#endregion

        //#region Game
        function gameLoop() {
            document.activeElement.blur();
            doGameStats();
            if (isGameOver == false) {
                if (keyStates.isPause) {
                    keyStates.isPause = false;
                    isPaused = !isPaused;
                }

                if (isPaused == false) {
                    createEnemies();
                    createCargoships();
                    checkBulletCollision();
                    drawStuff();
                    moveStuff();
                    if (canDoCombat)
                        doCombat();
                    doCountDown();
                    checkAliveness();
                    doPlayerStats();

                    gameStats.main.val++;
                }

                gameStats.game.val++;
                requestAnimationFrame(gameLoop);
            } else
                doGameOver();
        }
        //#endregion

        //#region Create
        function createWeapons() {
            weapons = {
                playerWeapon: new Weapon(
                    0,
                    playerCfg.weapons.normal.type,
                    playerCfg.weapons.normal.damage,
                    playerCfg.weapons.normal.distance,
                    playerCfg.weapons.normal.delay,
                    playerCfg.weapons.normal.accuracy,
                    playerCfg.weapons.normal.range
                ),
                playerWeaponAuto: new Weapon(
                    1,
                    playerCfg.weapons.auto.type,
                    playerCfg.weapons.auto.damage,
                    playerCfg.weapons.auto.distance,
                    playerCfg.weapons.auto.delay,
                    playerCfg.weapons.auto.accuracy,
                    playerCfg.weapons.auto.range
                ),
                enemyWeapon: new Weapon(
                    2,
                    enemyCfg.weapons.normal.type,
                    enemyCfg.weapons.normal.damage,
                    enemyCfg.weapons.normal.distance,
                    enemyCfg.weapons.normal.delay,
                    enemyCfg.weapons.normal.accuracy,
                    enemyCfg.weapons.normal.range
                ),
                cargoWeapon: new Weapon(
                    3,
                    cargoCfg.weapons.normal.type,
                    cargoCfg.weapons.normal.damage,
                    cargoCfg.weapons.normal.distance,
                    cargoCfg.weapons.normal.delay,
                    cargoCfg.weapons.normal.accuracy,
                    cargoCfg.weapons.normal.range
                )
            };
        }

        function createPlayer() {
            player = {
                actor: new Actor(
                    gameStats.playerIndex,
                    playerCfg.general.type,
                    playerCfg.general.startingHP, {
                        x: canvas.width / 2,
                        y: canvas.height / 2
                    },
                    images.playership
                ),
                currSpeed: {
                    x: 0,
                    y: 0
                },
                weapon: weapons.playerWeapon,
                autoWeapon: weapons.playerWeaponAuto,
                rad: Math.PI / 2 + Math.PI,
                shootDelay: 0,
                autoShootDelay: 0
            };
            gameStats.playerIndex++;
        }

        function createEnemies() {
            if (enemies.length < enemyCfg.general.amount) {
                if (Math.random() <= enemyCfg.general.chancePerFrame) {
                    let i = enemies.length;
                    enemies[i] = {
                        actor: new Actor(
                            gameStats.enemyIndex,
                            enemyCfg.general.type,
                            enemyCfg.general.startingHP,
                            getRandomSpawnPoint(),
                            images.enemyship
                        ),
                        iniSpeed: {x: null,y: null},
                        weapon: weapons.enemyWeapon,
                        passBy: getRandomPassByPoint(),
                        rad: null,
                        iniRad: null,
                        didEnter: false,
                        target: null,
                        didPlayerDamage: false,
                        isInCombat: false,
                        isLeaving: false,
                        shootDelay: 0
                    }
                    enemies[i].iniRad = simplifyRads(getRadToTarget(enemies[i].actor.getPos(), enemies[i].passBy));
                    enemies[i].rad = enemies[i].iniRad;
                    enemies[i].iniSpeed.x = -enemyCfg.general.speed * Math.cos(enemies[i].rad);
                    enemies[i].iniSpeed.y = -enemyCfg.general.speed * Math.sin(enemies[i].rad);
                    gameStats.enemyIndex++;
                }
            }
        }

        function createCargoships(){
            if (cargoships.length < cargoCfg.general.amount) {
                if (Math.random() <= cargoCfg.general.chancePerFrame) {
                    let i = cargoships.length;
                    cargoships[i] = {
                        actor: new Actor(
                            gameStats.cargoIndex,
                            cargoCfg.general.type,
                            cargoCfg.general.startingHP,
                            getRandomSpawnPoint(),
                            images.cargoship
                        ),
                        iniSpeed: {x: null , y: null},
                        weapon: weapons.cargoWeapon,
                        passBy: getRandomPassByPoint(),
                        rad: null,
                        didEnter: false,
                        target: null,
                        didPlayerDamage: false,
                        isAgroToPlayer: false,
                        shootDelay: 0
                    }
                    cargoships[i].rad = simplifyRads(getRadToTarget(cargoships[i].actor.getPos(), cargoships[i].passBy));
                    cargoships[i].iniSpeed.x = cargoCfg.general.speed * Math.cos(cargoships[i].rad);
                    cargoships[i].iniSpeed.y = cargoCfg.general.speed * Math.sin(cargoships[i].rad);
                    gameStats.cargoIndex++;
                }
            }
        }

        function createBullet(tp, wpn, sXY, tXY, iniSpeed = {
            x: 0,
            y: 0
        }) {
            let img;
            if (tp == playerCfg.general.type)
                img = images.playerbullet;
            else if (tp == enemyCfg.general.type)
                img = images.enemybullet;
            else if (tp == cargoCfg.general.type)
                 img = images.cargobullet;

            let accShiftMin = wpn.getAccuracy();
            let accShiftMax = wpn.getAccuracy() + 2 * (1 - wpn.getAccuracy());

            let rad = simplifyRads(getRadToTarget(sXY, tXY));

            let speed = {
                x: iniSpeed.x + bulletCfg.speed * makeMoreOrLess(Math.cos(rad), accShiftMin, accShiftMax),
                y: iniSpeed.y + bulletCfg.speed * makeMoreOrLess(Math.sin(rad), accShiftMin, accShiftMax)
            };

            bullets.push({
                actor: new Actor(gameStats.bulletIndex, bulletCfg.type, null, {
                    x: sXY.x,
                    y: sXY.y
                }, img, null),
                currSpeed: speed,
                rad: rad,
                type: tp,
                time: wpn.getDistance(),
                damage: wpn.getDamage()
            });
            gameStats.bulletIndex++;
        }
        //#endregion

        //#region Draw
        function drawStuff() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawParticles();
            drawBullets();
            drawPlayer();
            drawEnemies();
            drawCargoships();
            // drawLeadCrosshairs();
        }

        function drawPlayer() {
            doThrusterParticles(player, playerCfg);
            drawActor(player.actor.getPos(), player.actor.getSize(), player.rad + Math.PI, player.actor.getImage(), playerCfg.general.scale)
        }

        function drawEnemies() {
            enemies.forEach(enem => {
                doThrusterParticles(enem, enemyCfg);
                drawActor(enem.actor.getPos(), enem.actor.getSize(), enem.rad + Math.PI, enem.actor.getImage(), enemyCfg.general.scale);
            });
        }

        function drawCargoships(){
            cargoships.forEach(carg => {
                doThrusterParticles(carg, cargoCfg);
                drawActor(carg.actor.getPos(), carg.actor.getSize(), carg.rad + Math.PI, carg.actor.getImage(), cargoCfg.general.scale);
            });
        }

        function drawBullets() {
            bullets.forEach(blt => {
                drawActor(blt.actor.getPos(), blt.actor.getSize(), blt.rad, blt.actor.getImage(), bulletCfg.scale);
            });
        }

        function drawLeadCrosshairs() {
            enemies.forEach(enem => {
                let leadDist = calculateLeadDist(enem);
                let enemXY = enem.actor.getPos();
                let crosshairXY = {
                    x: enemXY.x + leadDist * Math.cos(enem.rad + Math.PI),
                    y: enemXY.y + leadDist * Math.sin(enem.rad + Math.PI)
                };
                let crosshairWH = {
                    w: images.crosshair.w,
                    h: images.crosshair.h
                };
                drawActor(crosshairXY, crosshairWH, 0, images.crosshair.img, 1);
            });
        }

        function drawActor(xy, wh, rad, img, scale) {
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

        function drawParticles() {
            particles.forEach(particle => {
                context.fillStyle = particle.color;
                context.fillRect(particle.pos.x, particle.pos.y, particle.size, particle.size);
            });
        }
        //#endregion

        //#region Move
        function moveStuff() {
            movePlayer();
            moveEnemies();
            moveBullets();
            moveCargoships();
            moveParticles();
        }

        function movePlayer() {
            let playerXY = player.actor.getPos();
            let playerWH = player.actor.getSize();
            player.currSpeed = {
                x: 0,
                y: 0
            };

            if (keyStates.isUp != keyStates.isDown) {
                if (keyStates.isUp) {
                    player.currSpeed.x = playerCfg.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = playerCfg.general.speed * Math.sin(player.rad);
                } else if (keyStates.isDown) {
                    player.currSpeed.x = -playerCfg.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = -playerCfg.general.speed * Math.sin(player.rad);
                }
            }

            if (keyStates.isLeft != keyStates.isRight) {
                if (keyStates.isLeft)
                    rotateActor(player, -degToRad(playerCfg.general.spinSpeed));
                else if (keyStates.isRight)
                    rotateActor(player, degToRad(playerCfg.general.spinSpeed));
            }

            if (player.currSpeed.x != 0 || player.currSpeed.y != 0) {
                player.actor.moveBy(player.currSpeed.x, player.currSpeed.y);

                playerXY = player.actor.getPos();
                playerWH = player.actor.getSize();

                x = playerXY.x;
                y = playerXY.y;
                if (playerXY.x - playerWH.w / 2 * playerCfg.general.scale <= 0)
                    x = playerWH.w / 2 * playerCfg.general.scale;
                if (playerXY.x + playerWH.w / 2 * playerCfg.general.scale >= canvas.width)
                    x = canvas.width - playerWH.w / 2 * playerCfg.general.scale;
                if (playerXY.y - playerWH.h / 2 * playerCfg.general.scale <= 0)
                    y = playerWH.h / 2 * playerCfg.general.scale;
                if (playerXY.y + playerWH.h / 2 * playerCfg.general.scale >= canvas.height)
                    y = canvas.height - playerWH.h / 2 * playerCfg.general.scale;

                player.actor.moveTo(x, y);
            }
        }

        function moveEnemies() {
            enemies.forEach(enem => {
                let enemXY = enem.actor.getPos();
                let enemWH = enem.actor.getSize();
                let spX = enem.iniSpeed.x;
                let spY = enem.iniSpeed.y;

                if (enem.isInCombat && enem.target != null){
                    rotateActor(enem, degToRad(enemyCfg.general.spinSpeed), simplifyRads(Math.PI + getRadToTarget(enem.actor.getPos(), enem.target.actor.getPos())));
                    if (getDistToTarget(enemXY, enem.target.actor.getPos()) > enemyCfg.general.hugDist){
                        spX = enemyCfg.general.speed * Math.cos(enem.rad);
                        spY = enemyCfg.general.speed * Math.sin(enem.rad);
                    }
                    else{
                        spX = 0;
                        spY = 0;
                    }
                }
                else{
                    spX = enemyCfg.general.speed * Math.cos(enem.rad);
                    spY = enemyCfg.general.speed * Math.sin(enem.rad);
                }

                enem.actor.moveBy(spX, spY);

                enemXY = enem.actor.getPos();
                enemWH = enem.actor.getSize();
                if (enemXY.x - enemWH.w / 2 < canvas.width && enemXY.x + enemWH.w / 2 > 0 ||
                    enemXY.y - enemWH.h / 2 < canvas.height && enemXY.y + enemWH.h / 2 > 0)
                    enem.didEnter = true;
            });
        }

        function moveCargoships(){
            cargoships.forEach(carg => {
                let cargXY = carg.actor.getPos();
                let cargWH = carg.actor.getSize();
                
                carg.actor.moveBy(carg.iniSpeed.x, carg.iniSpeed.y);

                if (cargXY.x - cargWH.w / 2 < canvas.width && cargXY.x + cargWH.w / 2 > 0 ||
                    cargXY.y - cargWH.h / 2 < canvas.height && cargXY.y + cargWH.h / 2 > 0)
                    carg.didEnter = true;
            });
        }

        function moveBullets() {
            bullets.forEach(blt => {
                blt.actor.moveBy(blt.currSpeed.x, blt.currSpeed.y);
            });
        }

        function moveParticles() {
            particles.forEach(particle => {
                particle.pos.x += particle.speed * Math.cos(particle.angle);
                particle.pos.y += particle.speed * Math.sin(particle.angle);
            });
        }
        //#endregion

        //#region Do
        function doPlayerStats(){
            doTables(playerStats, elementID.playerStatsContainer);
            doPlayerStatsVals();
        }

        function doPlayerStatsVals(){
            playerStats.timeScore.val = (gameStats.runTime.val / 1000) * scoreCfg.perSec;

            playerStats.totalScore.val = Math.floor(
                scoreCfg.start + 
                playerStats.timeScore.val + 
                playerStats.enemyKillScore.val + 
                playerStats.cargoKillScore.val + 
                playerStats.playerDeathScore.val + 
                playerStats.playerSpendScore.val
            );

            playerStats.hp.val = player.actor.getHealth() + "/" + playerCfg.general.startingHP;
            playerStats.mSpeed.val = playerCfg.general.speed;
            playerStats.bSpeed.val = bulletCfg.speed;
            playerStats.shSpeed.val = 1 / (player.weapon.getDelay() / 60) + "/s";
            playerStats.dmg.val = player.weapon.getDamage();
            playerStats.acc.val = player.weapon.getAccuracy() * 100 + "%";
            playerStats.range.val = player.weapon.getDistance();
        }

        function doGameStats() {
            if (isDebug)
                doTables(gameStats, elementID.gameStatsContainer);
            else
                deleteTable(document.getElementById(elementID.gameStatsContainer));
            doGameStatsVals();
        }

        function doGameStatsVals(){
            gameStats.mousePos.val = Math.floor(mouseXY.x) + ", " + Math.floor(mouseXY.y);
            gameStats.canvasSize.val = canvas.width + ", " + canvas.height;
            gameStats.particlesExist.val = particles.length;
            gameStats.enemiesExist.val = enemies.length;
            gameStats.currentTime.val = Date.now();
            gameStats.runTime.val = gameStats.currentTime.val - gameStats.startTime.val;
            if (gameStats.game.val % gameStats.fpsUpdateTime.val == 0) {
                gameStats.fps.val = Math.floor(1000 / gameStats.fpsUpdateSum.val * gameStats.fpsUpdateTime.val);
                gameStats.fpsUpdateSum.val = 0;
            } else
                gameStats.fpsUpdateSum.val += (gameStats.currentTime.val - gameStats.lastTime.val);
                gameStats.lastTime.val = gameStats.currentTime.val;
                gameStats.enemiesInCombat.val = 0;
                enemies.forEach(enem => {
                    if (enem.isInCombat)
                        gameStats.enemiesInCombat.val++;
            });
            gameStats.playerPos.val = Math.floor(player.actor.getPos().x) + ", " + Math.floor(player.actor.getPos().y);
        }

        function doTables(obj, id){
            let num = countCellsToDisplay(obj);
            let table = document.getElementById(id);
            let rows = table.getElementsByTagName('tr');
            let keys = Object.keys(obj);
            let vals = Object.values(obj);
            let currRow = 0;

            if (rows.length != num){
                deleteTable(table);
                createTable(table, obj);
                table = document.getElementById(id);
                rows = table.getElementsByTagName('tr');
            }

            for(let i = 0; i < keys.length; i++){
                if (obj[keys[i]].display){
                    writeToCell(rows[currRow], vals[i].name, vals[i].val);
                    currRow++;
                }
            }
        }

        function doPlayerCombat(){
            if (player.shootDelay <= 0) {
                if (keyStates.isShoot) {
                    if (mouseXY.x >= canvas.offsetLeft && mouseXY.x <= canvas.offsetLeft + canvas.width &&
                        mouseXY.y >= canvas.offsetTop && mouseXY.y <= canvas.offsetTop + canvas.height) {
                        createBullet(playerCfg.general.type, player.weapon, player.actor.getPos(), {
                            x: mouseXY.x - canvas.offsetLeft,
                            y: mouseXY.y - canvas.offsetTop
                        } /*, player.currSpeed*/ );
                        player.shootDelay = player.weapon.getDelay();
                    }
                }
            }
            if (player.autoShootDelay <= 0) {
                let target = getClosestTargetToPlayerInCombat();
                if (target != null) {
                    if (getDistToTarget(target.actor.getPos(), player.actor.getPos()) <= player.autoWeapon.getDistance()) {
                        createBullet(playerCfg.general.type, player.autoWeapon, player.actor.getPos(), target.actor.getPos());
                        player.autoShootDelay = player.autoWeapon.getDelay();
                    }
                }
            }
        }

        function doEnemyCombat(){
            enemies.forEach(enem => {
                if (enem.isInCombat == false && enem.isLeaving == false){
                    if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= enemyCfg.general.detectionRange) {
                        if (canPlayerBeTarget)
                            enem.isInCombat = true;
                    }
                    else{
                        cargoships.forEach(carg => {
                            if (getDistToTarget(enem.actor.getPos(), carg.actor.getPos()) <= enemyCfg.general.detectionRange)
                                enem.isInCombat = true;
                        });
                    }
                }

                if (enem.isInCombat && enem.shootDelay <= 0){
                    let enemXY = enem.actor.getPos();
                    let target = null;
                    let distToTarg = null;
                    if (canPlayerBeTarget){
                        target = player;
                        distToTarg = getDistToTarget(enemXY, target.actor.getPos());
                    }

                    cargoships.forEach(carg => {
                        let dist = getDistToTarget(enemXY, carg.actor.getPos());
                        if (target == null){
                            target = carg;
                            distToTarg = getDistToTarget(enemXY, target.actor.getPos());
                        }
                        else{
                            if (dist < distToTarg){
                                target = carg;
                                distToTarg = dist;
                            }
                        }
                    });

                    if (target != null){
                        if (distToTarg <= enem.weapon.getDistance())
                            enem.target = target;
                        else
                            enem.target = null;
                    }
                    else
                        enem.target = null;

                    if (enem.target != null){
                        if (canEnemyShoot(enem.actor.getPos(), enem.target.actor.getPos(), simplifyRads(enem.rad + Math.PI), enemyCfg.general.aimRadius * Math.PI)) {
                            createBullet(enemyCfg.general.type, enem.weapon, enem.actor.getPos(), enem.target.actor.getPos() /*, enem.currSpeed*/ );
                            enem.shootDelay = enem.weapon.getDelay();
                        }
                    }
                }
            });
        }

        function doCargoshipCombat(){
            cargoships.forEach(carg => {
                if (carg.shootDelay <= 0){
                    let cargXY = carg.actor.getPos();
                    let target = null;
                    let distToTarg = null;
                    if (carg.isAgroToPlayer && canPlayerBeTarget){
                        target = player;
                        distToTarg = getDistToTarget(cargXY, player.actor.getPos());
                    }

                    enemies.forEach(enem => {
                        if (enem.target != null){
                            if (enem.target == carg){
                                let dist = getDistToTarget(cargXY, enem.actor.getPos());
                                if (target == null || dist < targetDist){
                                    target = enem;
                                    targetDist = dist;
                                }
                            }
                        }
                    });

                    if (target != null && distToTarg < carg.weapon.getDistance())
                        carg.target = target;
                    else
                        carg.target = null;

                    if (carg.target != null){
                        createBullet(cargoCfg.general.type, carg.weapon, cargXY, carg.target.actor.getPos());
                        carg.shootDelay = carg.weapon.getDelay();
                    }
                }
            });
        }

        function doCombat() {
            doPlayerCombat();
            doEnemyCombat();
            doCargoshipCombat();
        }

        function doParticles(x, y, amnt, spd, time, size, clrMin, clrMax, angMin, angMax) {
            for (let i = 0; i < amnt; i++) {
                let ang = degToRad(getRandomBetween(radToDeg(angMin), radToDeg(angMax)));
                let r = getRandomBetween(clrMin.r, clrMax.r);
                let g = getRandomBetween(clrMin.g, clrMax.g);
                let b = getRandomBetween(clrMin.b, clrMax.b);
                let clr = "rgb(" + r + "," + g + "," + b + ")"
                particles.push({
                    id: gameStats.particleIndex,
                    pos: {
                        x: x,
                        y: y
                    },
                    speed: spd,
                    angle: ang,
                    time: time,
                    color: clr,
                    size: size
                });
                gameStats.particleIndex++;
            }
        }

        function doThrusterParticles(actor, cfg) {
            let xy = actor.actor.getPos();

            doParticles(
                xy.x, xy.y,
                cfg.thrusterInfo.amnt,
                cfg.thrusterInfo.speed,
                cfg.thrusterInfo.time,
                cfg.thrusterInfo.size,
                cfg.thrusterInfo.colors.min,
                cfg.thrusterInfo.colors.max,
                actor.rad - cfg.thrusterInfo.spread + Math.PI,
                actor.rad + cfg.thrusterInfo.spread + Math.PI
            );
        }

        function doBulletImpact(bullet, actor) {
            let i = bullets.indexOf(bullet);
            if (i != -1)
                bullets.splice(i, 1);

            actor.actor.addHealth(-bullet.damage);
        }

        function doCountDown() {
            player.shootDelay--;
            player.autoShootDelay--;

            particles.forEach(particle => {
                if (particle.time > 0)
                    particle.time--;
                else {
                    let i = particles.indexOf(particle);
                    if (i != -1)
                        particles.splice(i, 1);
                }
            });

            enemies.forEach(enem => {
                if (enem.didEnter && enem.isInCombat == false) {
                    let enemXY = enem.actor.getPos();
                    let enemWH = enem.actor.getSize();

                    if (enemXY.x - enemWH.w / 2 > canvas.width || enemXY.x + enemWH.w / 2 < 0 ||
                        enemXY.y - enemWH.h / 2 > canvas.height || enemXY.y + enemWH.h / 2 < 0) {
                        let i = enemies.indexOf(enem);
                        if (i != -1)
                            enemies.splice(i, 1);
                    }
                }

                enem.shootDelay--;
            });

            cargoships.forEach(carg => {
                if (carg.didEnter){
                    let cargXY = carg.actor.getPos();
                    let cargWH = carg.actor.getSize();

                    if (cargXY.x - cargWH.w / 2 > canvas.width || cargXY.x + cargWH.w / 2 < 0 ||
                        cargXY.y - cargWH.h / 2 > canvas.height || cargXY.y + cargWH.h / 2 < 0) {
                        let i = cargoships.indexOf(carg);
                        if (i != -1)
                            cargoships.splice(i, 1);
                    }
                }

                carg.shootDelay--;
            });

            bullets.forEach(blt => {
                let bltXY = blt.actor.getPos();
                let bltWH = blt.actor.getSize();

                if (bltXY.x - bltWH.w / 2 > canvas.width || bltXY.x + bltWH.w / 2 < 0 ||
                    bltXY.y - bltWH.h / 2 > canvas.height || bltXY.y + bltWH.h / 2 < 0 || blt.time <= 0) {
                    let i = bullets.indexOf(blt);
                    if (i != -1)
                        bullets.splice(i, 1);
                } else
                    blt.time -= bulletCfg.speed;
            });
        }
        //#endregion

        //#region Get
        function getRandomBetween(min, max) {
            return Math.random() * (max - min) + min;
        }

        function getDistToTarget(startXY, targetXY) {
            let x = Math.abs(startXY.x - targetXY.x);
            let y = Math.abs(startXY.y - targetXY.y);
            let dist = Math.sqrt(x ** 2 + y ** 2);
            return dist;
        }

        function getRadToTarget(startXY, targetXY) {
            let distX = targetXY.x - startXY.x;
            let distY = targetXY.y - startXY.y;
            let rad = Math.atan2(distY, distX);
            return rad;
        }

        function getClosestTargetToPlayerInCombat() {
            let target = null;
            let targetDist = null;
            let dist;

            enemies.forEach(enem => {
                if (enem.isInCombat){
                    dist = getDistToTarget(player.actor.getPos(), enem.actor.getPos());
                    if (target == null || dist < targetDist){
                        target = enem
                        targetDist = dist;
                    }
                }
            });

            cargoships.forEach(carg => {
                if (carg.isAgroToPlayer){
                    dist = getDistToTarget(player.actor.getPos(), carg.actor.getPos());
                    if (target == null || dist < targetDist){
                        target = carg;
                        targetDist = dist;
                    }
                }
            });

            return target;
        }

        function getRandomSpawnPoint() {
            let area = Math.random() * 4;
            let x, y;

            if (area <= 2) {
                x = getRandomBetween(0, canvas.width);

                if (area <= 1) //top
                    y = getRandomBetween(-enemyCfg.general.spawnPerim, 0);
                else //bottom
                    y = getRandomBetween(canvas.height, canvas.height + enemyCfg.general.spawnPerim);
            } else {
                y = getRandomBetween(0, canvas.height);

                if (area <= 3) //left
                    x = getRandomBetween(-enemyCfg.general.spawnPerim, 0);
                else //right
                    x = getRandomBetween(canvas.width, canvas.width + enemyCfg.general.spawnPerim);
            }

            return {
                x: x,
                y: y
            };
        }

        function getRandomPassByPoint() {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            return {
                x: x,
                y: y
            };
        }
        //#endregion

        //#region Check
        function canEnemyMove(enem) {
            let closestEnemy = enem;

            enemies.forEach(checkEnem => {
                if (enem.actor.getId() != checkEnem.actor.getId())
                    if (checkForCollision(enem, enemyCfg.general.scale, checkEnem, enemyCfg.general.scale))
                        if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) > getDistToTarget(enem.actor.getPos(), player.actor.getPos()))
                            closestEnemy = checkEnem;
            });

            if (closestEnemy == enem)
                return true;
            else
                return false;
        }

        function canEnemyShoot(startXY, targetXY, shooterRads, radius) {
            let min = shooterRads - radius;
            let max = shooterRads + radius;
            let radsToTarget = simplifyRads(getRadToTarget(startXY, targetXY) + Math.PI);
            return (radsToTarget < max && radsToTarget > min);
        }

        function checkBulletCollision() {
            bullets.forEach(blt => {
                //player
                if (checkForCollision(blt, bulletCfg.scale, player, playerCfg.general.scale)) {
                    if (blt.type != playerCfg.general.type)
                        doBulletImpact(blt, player);
                }
                //enemies
                enemies.forEach(enem => {
                    if (checkForCollision(blt, bulletCfg.scale, enem, enemyCfg.general.scale)) {
                        if (blt.type != enemyCfg.general.type){
                            doBulletImpact(blt, enem);
                            enem.isInCombat = true;
                            enem.isLeaving = false;
                            if (blt.type == playerCfg.general.type)
                                enem.didPlayerDamage = true;
                        }
                    }
                });
                //cargo
                cargoships.forEach(carg => {
                    if (checkForCollision(blt, bulletCfg.scale, carg, cargoCfg.general.scale))
                        if (blt.type != cargoCfg.general.type){
                            doBulletImpact(blt, carg);
                            if (blt.type == playerCfg.general.type){
                                carg.isAgroToPlayer = true;
                                carg.didPlayerDamage = true;
                            }
                        }
                });
            });
        }

        function checkAliveness() {
            if (player.actor.getHealth() <= 0 && isGodMode == false) {
                let xy = player.actor.getPos();
                doParticles(xy.x, xy.y, 50, 5, 5, 5, {r: 200, g: 200, b: 0}, {r: 200, g: 200, b: 0}, 0, 2 * Math.PI);
                makeEnemsInCombatLeave();
                playerStats.playerDeathScore.val += scoreCfg.playerKill;
                doPlayerStatsVals();
                cargoships.forEach(carg => {
                    if (carg.isAgroToPlayer)
                        carg.isAgroToPlayer = false;
                });
                if (playerStats.totalScore.val > 0)
                    createPlayer();
                else
                    isGameOver = true;
            }

            enemies.forEach(enem => {
                if (enem.actor.getHealth() <= 0) {
                    let xy = enem.actor.getPos();
                    doParticles(xy.x, xy.y, 50, 5, 3, 4, {r: 200, g: 200, b: 0}, {r: 200,g: 200,b: 0}, 0, 2 * Math.PI);
                    let i = enemies.indexOf(enem);
                    if (i != -1)
                        enemies.splice(i, 1);
                    if (enem.didPlayerDamage)
                        playerStats.enemyKillScore.val += scoreCfg.enemKill;
                }
            });

            cargoships.forEach(carg => {
                if (carg.actor.getHealth() <= 0){
                    let xy = carg.actor.getPos();
                    doParticles(xy.x, xy.y, 50, 5, 3, 4, {r: 200, g: 200, b: 0}, {r: 200,g: 200,b: 0}, 0, 2 * Math.PI);
                    let i = cargoships.indexOf(carg);
                    if (i != -1)
                        cargoships.splice(i, 1);
                    if (carg.didPlayerDamage)
                        playerStats.cargoKillScore.val += scoreCfg.cargoKill;
                }
            });
        }

        function checkForCollision(a, aScale, b, bScale) {
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
        //#endregion

        //#region Math
        function radToDeg(ang) {
            return ang * (180 / Math.PI);
        }

        function degToRad(ang) {
            return Math.PI / 180 * ang;

        }

        function calculateLeadDist(actor) {
            return 100;
        }
        //#endregion

        //#region Other
        function resetLets() {
            player = null;
            weapons = [];
            enemies = [];
            cargoships = [];
            bullets = [];
            particle = [];

            playerStats.timeScore.val = 0;
            playerStats.enemyKillScore.val = 0;
            playerStats.cargoKillScore.val = 0;
            playerStats.playerDeathScore.val = 0;
            playerStats.playerSpendScore.val = 0;
        }

        function makeEnemsInCombatLeave() {
            enemies.forEach(enem => {
                if (enem.isInCombat) {
                    enem.rad += Math.PI;
                    enem.isLeaving = true;
                    enem.isInCombat = false;
                }
            });
        }

        function makeMoreOrLess(num, min, max) {
            let val = getRandomBetween(min, max);
            return num * val;
        }

        function rotateActor(actor, max, targetRad = null) {
            if (targetRad == null)
                actor.rad += max;
            else {
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

        function simplifyRads(rad) {
            while (rad > Math.PI)
                rad -= (2 * Math.PI);
            while (rad < -Math.PI)
                rad += (2 * Math.PI);

            return rad;
        }

        function countCellsToDisplay(obj){
            let num = 0;
            let keys = Object.keys(obj);
            let vals = Object.values(obj);
            for(let i = 0; i < keys.length; i++)
                if (vals[i].display)
                    num++;
            return num;
        }

        function deleteTable(t){
            let r = t.getElementsByTagName('tr');
            while (r.length > 0)
                t.removeChild(r[r.length - 1]);
        }

        function createTable(t, obj){
            let keys = Object.keys(obj);
            for (let i = 0; i < keys.length; i++)
                if (obj[keys[i]].display){
                    let tr = document.createElement('tr');
                    let thn = document.createElement('th');
                    let thv = document.createElement('th');
                    thn.classList.add("th_l");
                    tr.appendChild(thn);
                    tr.appendChild(thv);
                    t.appendChild(tr);
                }
        }

        function writeToCell(r, nm, vl){
            r.getElementsByTagName('th')[0].innerHTML = nm;
            r.getElementsByTagName('th')[1].innerHTML = vl
        }
        //#endregion
        
        //#region Event Listener Stuff
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
            } else if (e.key.toUpperCase() == keyBinds.down) {
                keyStates.isDown = true;
            } else if (e.key.toUpperCase() == keyBinds.left) {
                keyStates.isLeft = true;
            } else if (e.key.toUpperCase() == keyBinds.right) {
                keyStates.isRight = true;
            } else if (e.key.toUpperCase() == keyBinds.auto) {
                keyStates.isAuto = true;
            } else if (e.key.toUpperCase() == keyBinds.pause) {
                keyStates.isPause = true;
            }
        }

        function KeyUp(e) {
            if (e.key.toUpperCase() == keyBinds.up) {
                keyStates.isUp = false;
            } else if (e.key.toUpperCase() == keyBinds.down) {
                keyStates.isDown = false;
            } else if (e.key.toUpperCase() == keyBinds.left) {
                keyStates.isLeft = false;
            } else if (e.key.toUpperCase() == keyBinds.right) {
                keyStates.isRight = false;
            } else if (e.key.toUpperCase() == keyBinds.auto) {
                keyStates.isAuto = false;
            }
        }
        //#endregion
    } catch (error) {
        alert("error: \n" + error.stack);
        console.log(error);
    }
}

function doGameOver(){
    isLooping = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = canvas.height / 5 + 'px sans-serif';
    context.fillStyle = 'red';
    context.textAlign = 'center';
    context.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    
}