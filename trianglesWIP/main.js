function main() {
    try {
        //#region Setup
        setupGame();

        //Does setup stuff when users hits Start
        function setupGame() {
            GAME_STATS.startTime.val = Date.now();
            GAME_STATS.lastTime.val = GAME_STATS.startTime;
            isGameOver = false;
            GAME_STATS.enemyCarryOverSpawnBonus.val++;
            resetLets();
            resetSfx();
            createWeapons();
            createPlayer();
            createSound(SOUNDS_SRC.music);

            //this mess is used to avoid having the gameLoop be called many time per frame if the user spammed Start
            if (isLooping == false)
                gameLoop();
            isLooping = true;
        }
        //#endregion

        //#region Game
        //The main loop of the game, calls draw, move, create, delete and other methods
        function gameLoop() {
            document.activeElement.blur();
            doGameStats();
            if (isGameOver == false) {
                if (KEYSTATES.isPause) {
                    KEYSTATES.isPause = false;
                    isPaused = !isPaused;
                }

                if (isPaused == false) {
                    createEnemies();
                    createCargoships();
                    checkBulletCollision();
                    drawStuff();
                    moveStuff();
                    if (CAN_DO_COMBAT)
                        doCombat();
                    doCountDown();
                    checkAliveness();
                    doPlayerStats();
                    checkSounds();

                    GAME_STATS.main.val++;
                }

                GAME_STATS.game.val++;
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
                    PLAYER_CFG.weapons.normal.type,
                    PLAYER_CFG.weapons.normal.damage,
                    PLAYER_CFG.weapons.normal.distance,
                    PLAYER_CFG.weapons.normal.delay,
                    PLAYER_CFG.weapons.normal.accuracy,
                    PLAYER_CFG.weapons.normal.range
                ),
                playerWeaponAuto: new Weapon(
                    1,
                    PLAYER_CFG.weapons.auto.type,
                    PLAYER_CFG.weapons.auto.damage,
                    PLAYER_CFG.weapons.auto.distance,
                    PLAYER_CFG.weapons.auto.delay,
                    PLAYER_CFG.weapons.auto.accuracy,
                    PLAYER_CFG.weapons.auto.range
                ),
                enemyWeapon: new Weapon(
                    2,
                    ENEMY_CFG.weapons.normal.type,
                    ENEMY_CFG.weapons.normal.damage,
                    ENEMY_CFG.weapons.normal.distance,
                    ENEMY_CFG.weapons.normal.delay,
                    ENEMY_CFG.weapons.normal.accuracy,
                    ENEMY_CFG.weapons.normal.range
                ),
                cargoWeapon: new Weapon(
                    3,
                    CARGO_CFG.weapons.normal.type,
                    CARGO_CFG.weapons.normal.damage,
                    CARGO_CFG.weapons.normal.distance,
                    CARGO_CFG.weapons.normal.delay,
                    CARGO_CFG.weapons.normal.accuracy,
                    CARGO_CFG.weapons.normal.range
                )
            };
        }

        function createPlayer() {
            player = {
                actor: new Actor(
                    GAME_STATS.playerIndex,
                    PLAYER_CFG.general.type,
                    PLAYER_CFG.general.startingHP, {
                        x: canvas.width / 2,
                        y: canvas.height / 2
                    },
                    IMAGES.playership
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
            GAME_STATS.playerIndex++;
        }

        function createEnemies() {
            if (enemies.length < ENEMY_CFG.general.amount + GAME_STATS.enemyCarryOverSpawnBonus.val) {
                if (Math.random() <= ENEMY_CFG.general.chancePerFrame) {
                    let i = enemies.length;
                    enemies[i] = {
                        actor: new Actor(
                            GAME_STATS.enemyIndex,
                            ENEMY_CFG.general.type,
                            ENEMY_CFG.general.startingHP,
                            getRandomSpawnPoint(),
                            IMAGES.enemyship
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
                    enemies[i].iniSpeed.x = -ENEMY_CFG.general.speed * Math.cos(enemies[i].rad);
                    enemies[i].iniSpeed.y = -ENEMY_CFG.general.speed * Math.sin(enemies[i].rad);
                    GAME_STATS.enemyIndex++;
                }
            }
        }

        function createCargoships(){
            if (cargoships.length < CARGO_CFG.general.amount) {
                if (Math.random() <= CARGO_CFG.general.chancePerFrame) {
                    let i = cargoships.length;
                    cargoships[i] = {
                        actor: new Actor(
                            GAME_STATS.cargoIndex,
                            CARGO_CFG.general.type,
                            CARGO_CFG.general.startingHP,
                            getRandomSpawnPoint(),
                            IMAGES.cargoship
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
                    cargoships[i].iniSpeed.x = CARGO_CFG.general.speed * Math.cos(cargoships[i].rad);
                    cargoships[i].iniSpeed.y = CARGO_CFG.general.speed * Math.sin(cargoships[i].rad);
                    GAME_STATS.cargoIndex++;
                }
            }
        }

        function createBullet(tp, wpn, sXY, tXY, iniSpeed = {x: 0,y: 0}) {
            createSound(SOUNDS_SRC.shoot);
            //choose which img to use based on who shot
            let img;
            if (tp == PLAYER_CFG.general.type)
                img = IMAGES.playerbullet;
            else if (tp == ENEMY_CFG.general.type)
                img = IMAGES.enemybullet;
            else if (tp == CARGO_CFG.general.type)
                 img = IMAGES.cargobullet;

            //used to give randomness and spread to the aim when firing
            let accShiftMin = wpn.getAccuracy();
            let accShiftMax = wpn.getAccuracy() + 2 * (1 - wpn.getAccuracy());

            let rad = simplifyRads(getRadToTarget(sXY, tXY));

            let speed = {
                x: iniSpeed.x + BULLET_CFG.speed * makeMoreOrLess(Math.cos(rad), accShiftMin, accShiftMax),
                y: iniSpeed.y + BULLET_CFG.speed * makeMoreOrLess(Math.sin(rad), accShiftMin, accShiftMax)
            };

            bullets.push({
                actor: new Actor(GAME_STATS.bulletIndex, BULLET_CFG.type, null, {
                    x: sXY.x,
                    y: sXY.y
                }, img, null),
                currSpeed: speed,
                rad: rad,
                type: tp,
                time: wpn.getDistance(),
                damage: wpn.getDamage()
            });
            GAME_STATS.bulletIndex++;
        }

        function createSound(src){
            let sound = document.createElement('audio');
            sound.src = src;
            sound.autoplay = true;
            document.body.appendChild(sound);
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
        }

        function drawPlayer() {
            doThrusterParticles(player, PLAYER_CFG);
            drawActor(player.actor.getPos(), player.actor.getSize(), player.rad + Math.PI, player.actor.getImage(), PLAYER_CFG.general.scale)
        }

        function drawEnemies() {
            enemies.forEach(enem => {
                doThrusterParticles(enem, ENEMY_CFG);
                drawActor(enem.actor.getPos(), enem.actor.getSize(), enem.rad + Math.PI, enem.actor.getImage(), ENEMY_CFG.general.scale);
            });
        }

        function drawCargoships(){
            cargoships.forEach(carg => {
                doThrusterParticles(carg, CARGO_CFG);
                drawActor(carg.actor.getPos(), carg.actor.getSize(), carg.rad + Math.PI, carg.actor.getImage(), CARGO_CFG.general.scale);
            });
        }

        function drawBullets() {
            bullets.forEach(blt => {
                drawActor(blt.actor.getPos(), blt.actor.getSize(), blt.rad, blt.actor.getImage(), BULLET_CFG.scale);
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

            if (KEYSTATES.isUp != KEYSTATES.isDown) {
                if (KEYSTATES.isUp) {
                    player.currSpeed.x = PLAYER_CFG.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = PLAYER_CFG.general.speed * Math.sin(player.rad);
                } else if (KEYSTATES.isDown) {
                    player.currSpeed.x = -PLAYER_CFG.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = -PLAYER_CFG.general.speed * Math.sin(player.rad);
                }
            }

            if (KEYSTATES.isLeft != KEYSTATES.isRight) {
                if (KEYSTATES.isLeft)
                    rotateActor(player, -degToRad(PLAYER_CFG.general.spinSpeed));
                else if (KEYSTATES.isRight)
                    rotateActor(player, degToRad(PLAYER_CFG.general.spinSpeed));
            }

            //Game boundary collision checking
            if (player.currSpeed.x != 0 || player.currSpeed.y != 0) {
                player.actor.moveBy(player.currSpeed.x, player.currSpeed.y);

                playerXY = player.actor.getPos();
                playerWH = player.actor.getSize();

                x = playerXY.x;
                y = playerXY.y;
                if (playerXY.x - playerWH.w / 2 * PLAYER_CFG.general.scale <= 0)
                    x = playerWH.w / 2 * PLAYER_CFG.general.scale;
                if (playerXY.x + playerWH.w / 2 * PLAYER_CFG.general.scale >= canvas.width)
                    x = canvas.width - playerWH.w / 2 * PLAYER_CFG.general.scale;
                if (playerXY.y - playerWH.h / 2 * PLAYER_CFG.general.scale <= 0)
                    y = playerWH.h / 2 * PLAYER_CFG.general.scale;
                if (playerXY.y + playerWH.h / 2 * PLAYER_CFG.general.scale >= canvas.height)
                    y = canvas.height - playerWH.h / 2 * PLAYER_CFG.general.scale;

                player.actor.moveTo(x, y);
            }
        }

        //enemies move in a straight line decided when they spawn, unless theyre in combat
        //if in combat, they move towards their target
        function moveEnemies() {
            enemies.forEach(enem => {
                let enemXY = enem.actor.getPos();
                let enemWH = enem.actor.getSize();
                let spX = enem.iniSpeed.x;
                let spY = enem.iniSpeed.y;

                //if enemy is in combat and has a target, rotate and move to target until in range of firing
                if (enem.isInCombat && enem.target != null){
                    rotateActor(enem, degToRad(ENEMY_CFG.general.spinSpeed), simplifyRads(Math.PI + getRadToTarget(enem.actor.getPos(), enem.target.actor.getPos())));
                    if (getDistToTarget(enemXY, enem.target.actor.getPos()) > ENEMY_CFG.general.hugDist){
                        spX = ENEMY_CFG.general.speed * Math.cos(enem.rad);
                        spY = ENEMY_CFG.general.speed * Math.sin(enem.rad);
                    }
                    else{
                        spX = 0;
                        spY = 0;
                    }
                }
                //else just continue on its merry path
                else{
                    spX = ENEMY_CFG.general.speed * Math.cos(enem.rad);
                    spY = ENEMY_CFG.general.speed * Math.sin(enem.rad);
                }

                enem.actor.moveBy(spX, spY);

                //checks if the enemy entered the game screen
                enemXY = enem.actor.getPos();
                enemWH = enem.actor.getSize();
                if (enemXY.x - enemWH.w / 2 < canvas.width && enemXY.x + enemWH.w / 2 > 0 ||
                    enemXY.y - enemWH.h / 2 < canvas.height && enemXY.y + enemWH.h / 2 > 0)
                    enem.didEnter = true;
            });
        }

        //cargoships move in a straight line decided when they spawn, and keep moving in that line
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
        function doGameOver(){
            resetSfx();
            createSound(SOUNDS_SRC.gameover);
            isLooping = false;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.font = canvas.height / 5 + 'px sans-serif';
            context.fillStyle = 'red';
            context.textAlign = 'center';
            context.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        }

        function doPlayerStats(){
            doTables(PLAYER_STATS, ELEMENT_ID.playerStatsContainer);
            doPlayerStatsVals();
        }

        function doPlayerStatsVals(){
            PLAYER_STATS.timeScore.val = (GAME_STATS.runTime.val / 1000) * SCORE_CFG.perSec;

            PLAYER_STATS.totalScore.val = Math.floor(
                SCORE_CFG.start + 
                PLAYER_STATS.timeScore.val + 
                PLAYER_STATS.enemyKillScore.val + 
                PLAYER_STATS.cargoKillScore.val + 
                PLAYER_STATS.playerDeathScore.val
            );

            PLAYER_STATS.hp.val = player.actor.getHealth() + "/" + PLAYER_CFG.general.startingHP;
        }

        function doGameStats() {
            if (isDebug)
                doTables(GAME_STATS, ELEMENT_ID.gameStatsContainer);
            else
                deleteTable(document.getElementById(ELEMENT_ID.gameStatsContainer));
            doGameStatsVals();
        }

        function doGameStatsVals(){
            //this is a mess, this was used to debug, 
            //left it as a souvenir if you feel like checking some stats, 
            //and bc im too lazy to bother cleaning it up
            GAME_STATS.mousePos.val = Math.floor(MOUSE_XY.x) + ", " + Math.floor(MOUSE_XY.y);
            GAME_STATS.canvasSize.val = canvas.width + ", " + canvas.height;
            GAME_STATS.particlesExist.val = particles.length;
            GAME_STATS.enemiesExist.val = enemies.length;
            GAME_STATS.currentTime.val = Date.now();
            GAME_STATS.runTime.val = GAME_STATS.currentTime.val - GAME_STATS.startTime.val;
            if (GAME_STATS.game.val % GAME_STATS.fpsUpdateTime.val == 0) {
                GAME_STATS.fps.val = Math.floor(1000 / GAME_STATS.fpsUpdateSum.val * GAME_STATS.fpsUpdateTime.val);
                GAME_STATS.fpsUpdateSum.val = 0;
            } else
                GAME_STATS.fpsUpdateSum.val += (GAME_STATS.currentTime.val - GAME_STATS.lastTime.val);
                GAME_STATS.lastTime.val = GAME_STATS.currentTime.val;
                GAME_STATS.enemiesInCombat.val = 0;
                enemies.forEach(enem => {
                    if (enem.isInCombat)
                        GAME_STATS.enemiesInCombat.val++;
            });
            GAME_STATS.playerPos.val = Math.floor(player.actor.getPos().x) + ", " + Math.floor(player.actor.getPos().y);
            GAME_STATS.isGodMode.val = IS_GOD_MODE;
            GAME_STATS.canPlayerBeTarget.val = CAN_PLAYER_BE_TARGET;
            GAME_STATS.canDoCombat.val = CAN_DO_COMBAT;
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

        //player has 2 weapons, a gun that shoots when the player holds left click
        //and a gun that shoots towards the nearest hostile target
        function doPlayerCombat(){
            if (player.shootDelay <= 0) {
                if (KEYSTATES.isShoot) {
                    if (MOUSE_XY.x >= canvas.offsetLeft && MOUSE_XY.x <= canvas.offsetLeft + canvas.width &&
                        MOUSE_XY.y >= canvas.offsetTop && MOUSE_XY.y <= canvas.offsetTop + canvas.height) {
                        createBullet(PLAYER_CFG.general.type, player.weapon, player.actor.getPos(), {
                            x: MOUSE_XY.x - canvas.offsetLeft,
                            y: MOUSE_XY.y - canvas.offsetTop
                        });
                        player.shootDelay = player.weapon.getDelay();
                    }
                }
            }
            if (player.autoShootDelay <= 0) {
                let target = getClosestTargetToPlayerInCombat();
                if (target != null) {
                    if (getDistToTarget(target.actor.getPos(), player.actor.getPos()) <= player.autoWeapon.getDistance()) {
                        createBullet(PLAYER_CFG.general.type, player.autoWeapon, player.actor.getPos(), target.actor.getPos());
                        player.autoShootDelay = player.autoWeapon.getDelay();
                    }
                }
            }
        }

        //enemies shoot at their target but they can only fire in front of them
        function doEnemyCombat(){
            enemies.forEach(enem => {
                if (enem.isInCombat == false && enem.isLeaving == false){
                    if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= ENEMY_CFG.general.detectionRange) {
                        if (CAN_PLAYER_BE_TARGET)
                            enem.isInCombat = true;
                    }
                    else{
                        cargoships.forEach(carg => {
                            if (getDistToTarget(enem.actor.getPos(), carg.actor.getPos()) <= ENEMY_CFG.general.detectionRange)
                                enem.isInCombat = true;
                        });
                    }
                }

                if (enem.isInCombat && enem.shootDelay <= 0){
                    let enemXY = enem.actor.getPos();
                    let target = null;
                    let distToTarg = null;
                    if (CAN_PLAYER_BE_TARGET){
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
                        if (canEnemyShoot(enem.actor.getPos(), enem.target.actor.getPos(), simplifyRads(enem.rad + Math.PI), ENEMY_CFG.general.aimRadius * Math.PI)) {
                            createBullet(ENEMY_CFG.general.type, enem.weapon, enem.actor.getPos(), enem.target.actor.getPos() /*, enem.currSpeed*/ );
                            enem.shootDelay = enem.weapon.getDelay();
                        }
                    }
                }
            });
        }

        //cargoships fire at whatever aggroed them
        function doCargoshipCombat(){
            cargoships.forEach(carg => {
                if (carg.shootDelay <= 0){
                    let cargXY = carg.actor.getPos();
                    let target = null;
                    let distToTarg = null;
                    if (carg.isAgroToPlayer && CAN_PLAYER_BE_TARGET){
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
                        createBullet(CARGO_CFG.general.type, carg.weapon, cargXY, carg.target.actor.getPos());
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
            //creates a bunch of particles and sends them in random direction between limits
            for (let i = 0; i < amnt; i++) {
                let ang = degToRad(getRandomBetween(radToDeg(angMin), radToDeg(angMax)));
                let r = getRandomBetween(clrMin.r, clrMax.r);
                let g = getRandomBetween(clrMin.g, clrMax.g);
                let b = getRandomBetween(clrMin.b, clrMax.b);
                let clr = "rgb(" + r + "," + g + "," + b + ")"
                particles.push({
                    id: GAME_STATS.particleIndex,
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
                GAME_STATS.particleIndex++;
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

            createSound(SOUNDS_SRC.impact);
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
                    blt.time -= BULLET_CFG.speed;
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

            //enems
            enemies.forEach(enem => {
                if (enem.isInCombat){
                    dist = getDistToTarget(player.actor.getPos(), enem.actor.getPos());
                    if (target == null || dist < targetDist){
                        target = enem
                        targetDist = dist;
                    }
                }
            });

            //cargoships
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
                    y = getRandomBetween(-ENEMY_CFG.general.spawnPerim, 0);
                else //bottom
                    y = getRandomBetween(canvas.height, canvas.height + ENEMY_CFG.general.spawnPerim);
            } else {
                y = getRandomBetween(0, canvas.height);

                if (area <= 3) //left
                    x = getRandomBetween(-ENEMY_CFG.general.spawnPerim, 0);
                else //right
                    x = getRandomBetween(canvas.width, canvas.width + ENEMY_CFG.general.spawnPerim);
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
        //this checks if the enemy is facing its target
        function canEnemyShoot(startXY, targetXY, shooterRads, radius) {
            let min = shooterRads - radius;
            let max = shooterRads + radius;
            let radsToTarget = simplifyRads(getRadToTarget(startXY, targetXY) + Math.PI);
            return (radsToTarget < max && radsToTarget > min);
        }

        function checkBulletCollision() {
            bullets.forEach(blt => {
                //player
                if (checkForCollision(blt, BULLET_CFG.scale, player, PLAYER_CFG.general.scale)) {
                    if (blt.type != PLAYER_CFG.general.type)
                        doBulletImpact(blt, player);
                }
                //enemies
                enemies.forEach(enem => {
                    if (checkForCollision(blt, BULLET_CFG.scale, enem, ENEMY_CFG.general.scale)) {
                        if (blt.type != ENEMY_CFG.general.type){
                            doBulletImpact(blt, enem);
                            enem.isInCombat = true;
                            enem.isLeaving = false;
                            if (blt.type == PLAYER_CFG.general.type)
                                enem.didPlayerDamage = true;
                        }
                    }
                });
                //cargo
                cargoships.forEach(carg => {
                    if (checkForCollision(blt, BULLET_CFG.scale, carg, CARGO_CFG.general.scale))
                        if (blt.type != CARGO_CFG.general.type){
                            doBulletImpact(blt, carg);
                            if (blt.type == PLAYER_CFG.general.type){
                                carg.isAgroToPlayer = true;
                                carg.didPlayerDamage = true;
                            }
                        }
                });
            });
        }

        //this checks the health values of all actors, kills them if its <= 0
        function checkAliveness() {
            if (player.actor.getHealth() <= 0 && IS_GOD_MODE == false) {
                let xy = player.actor.getPos();
                doParticles(xy.x, xy.y, 50, 5, 5, 5, {r: 200, g: 200, b: 0}, {r: 200, g: 200, b: 0}, 0, 2 * Math.PI);
                createSound(SOUNDS_SRC.explosion);
                makeEnemsInCombatLeave();
                PLAYER_STATS.playerDeathScore.val += SCORE_CFG.playerKill;
                doPlayerStatsVals();
                cargoships.forEach(carg => {
                    if (carg.isAgroToPlayer)
                        carg.isAgroToPlayer = false;
                });
                if (PLAYER_STATS.totalScore.val > 0)
                    createPlayer();
                else
                    isGameOver = true;
            }

            enemies.forEach(enem => {
                if (enem.actor.getHealth() <= 0) {
                    let xy = enem.actor.getPos();
                    doParticles(xy.x, xy.y, 50, 5, 3, 4, {r: 200, g: 200, b: 0}, {r: 200,g: 200,b: 0}, 0, 2 * Math.PI);
                    createSound(SOUNDS_SRC.explosion);
                    let i = enemies.indexOf(enem);
                    if (i != -1)
                        enemies.splice(i, 1);
                    if (enem.didPlayerDamage)
                        PLAYER_STATS.enemyKillScore.val += SCORE_CFG.enemKill;
                }
            });

            cargoships.forEach(carg => {
                if (carg.actor.getHealth() <= 0){
                    let xy = carg.actor.getPos();
                    doParticles(xy.x, xy.y, 50, 5, 3, 4, {r: 200, g: 200, b: 0}, {r: 200,g: 200,b: 0}, 0, 2 * Math.PI);
                    createSound(SOUNDS_SRC.explosion);
                    let i = cargoships.indexOf(carg);
                    if (i != -1)
                        cargoships.splice(i, 1);
                    if (carg.didPlayerDamage)
                        PLAYER_STATS.cargoKillScore.val += SCORE_CFG.cargoKill;
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

        function checkSounds(){
            let sounds = document.getElementsByTagName('audio');
            for (let i = 0; i < sounds.length; i++)
                if (sounds[i].ended)
                    deleteSound(sounds[i]);
        }
        //#endregion

        //#region Math
        function radToDeg(ang) {
            return ang * (180 / Math.PI);
        }

        function degToRad(ang) {
            return Math.PI / 180 * ang;

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

            PLAYER_STATS.timeScore.val = 0;
            PLAYER_STATS.enemyKillScore.val = 0;
            PLAYER_STATS.cargoKillScore.val = 0;
            PLAYER_STATS.playerDeathScore.val = 0;
        }

        //makes all enemies that were fighting the player turn around and leave
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

        //simplifies rads to be between -PI and PI (bc comparing 0 to 2 PI should be the same but it isnt)
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

        function deleteSound(elem){
            elem.parentNode.removeChild(elem);
        }

        function resetSfx(){
            let sounds = document.getElementsByTagName('audio');
            for (let i = 0; i < sounds.length; i++)
                deleteSound(sounds[i]);
        }
        //#endregion
        
        //#region Event Listener Stuff
        document.addEventListener("mousemove", MouseMoved);
        document.addEventListener("mousedown", MouseDown);
        document.addEventListener("mouseup", MouseUp);
        document.addEventListener("keydown", KeyDown);
        document.addEventListener("keyup", KeyUp);

        function MouseMoved(e) {
            MOUSE_XY.x = e.clientX;
            MOUSE_XY.y = e.clientY;
        }

        function MouseDown(e) {
            if (e.button == KEYBINDS.shoot) {
                KEYSTATES.isShoot = true;
            }
        }

        function MouseUp(e) {
            if (e.button == KEYBINDS.shoot) {
                KEYSTATES.isShoot = false;
            }
        }

        function KeyDown(e) {
            if (e.key.toUpperCase() == KEYBINDS.up) {
                KEYSTATES.isUp = true;
            } else if (e.key.toUpperCase() == KEYBINDS.down) {
                KEYSTATES.isDown = true;
            } else if (e.key.toUpperCase() == KEYBINDS.left) {
                KEYSTATES.isLeft = true;
            } else if (e.key.toUpperCase() == KEYBINDS.right) {
                KEYSTATES.isRight = true;
            } else if (e.key.toUpperCase() == KEYBINDS.auto) {
                KEYSTATES.isAuto = true;
            } else if (e.key.toUpperCase() == KEYBINDS.pause) {
                KEYSTATES.isPause = true;
            }
        }

        function KeyUp(e) {
            if (e.key.toUpperCase() == KEYBINDS.up) {
                KEYSTATES.isUp = false;
            } else if (e.key.toUpperCase() == KEYBINDS.down) {
                KEYSTATES.isDown = false;
            } else if (e.key.toUpperCase() == KEYBINDS.left) {
                KEYSTATES.isLeft = false;
            } else if (e.key.toUpperCase() == KEYBINDS.right) {
                KEYSTATES.isRight = false;
            } else if (e.key.toUpperCase() == KEYBINDS.auto) {
                KEYSTATES.isAuto = false;
            }
        }
        //#endregion
    } catch (error) {
        alert("error: \n" + error.stack);
        console.log(error);
    }
}

function doTutorial(){
    let str = [
        "",
        "Game Thing, Yes I Am Bad With Titles",
        "",
        "To Play:",
        KEYBINDS.up + " / " + KEYBINDS.down + " to move forward/backward",
        KEYBINDS.left + " / " + KEYBINDS.right + " to rotate left/right",
        "small white ships are hostile to all but themselves and will attack",
        "large brown ships are neutral and will only attack when provoked",
        "left mouse buttom to shoot",
        "",
        "Score:",
        "you gain score by being alive, at " + SCORE_CFG.perSec + " points per second",
        "killing an enemy gives " + SCORE_CFG.enemKill + " points",
        "killing a cargoship gives " + SCORE_CFG.cargoKill + " points",
        "dying costs you " + -SCORE_CFG.playerKill + " points",
        "",
        "also you cannot right-click to bring the menu here",
        "do so on the sidebars on either side",
        ""
    ];

    if (isLooping){
        isPaused = true;
        str.push("press " + KEYBINDS.pause + " to return");
    }
    else
        str.push("press Start to start");

    let fsize = canvas.height / (str.length + 2);
    let startY = fsize;

    context.font = fsize + 'px sans-serif';
    context.fillStyle = 'lime';
    context.textAlign = 'center';

    str.forEach(s => {
        context.fillText(s, canvas.width / 2, startY); 
        startY += fsize;
    });

    //i just had to
    if (didTheMagicHappen == false){
        window.open("https://www.youtube.com/watch?v=oHg5SJYRHA0", "_blank");
        didTheMagicHappen = true;
    }
}