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
                    checkBulletCollision();
                    drawStuff();
                    moveStuff();
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
                rad: Math.PI / 2,
                shootDelay: 0,
                autoShootDelay: 0,
                invulTime: 0
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
                        currSpeed: {
                            x: 0,
                            y: 0
                        },
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
        }

        function createBullet(friendly, wpn, sXY, tXY, iniSpeed = {
            x: 0,
            y: 0
        }) {
            let img;
            if (friendly)
                img = images.playerbullet;
            else
                img = images.enemybullet;

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
                isFriend: friendly,
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
            // drawLeadCrosshairs();
        }

        function drawPlayer() {
            doThrusterParticles(player);
            drawActor(player.actor.getPos(), player.actor.getSize(), player.rad, player.actor.getImage(), playerCfg.general.scale)
        }

        function drawEnemies() {
            enemies.forEach(enem => {
                doThrusterParticles(enem);
                drawActor(enem.actor.getPos(), enem.actor.getSize(), enem.rad, enem.actor.getImage(), enemyCfg.general.scale);
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
                    player.currSpeed.x = -playerCfg.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = -playerCfg.general.speed * Math.sin(player.rad);
                } else if (keyStates.isDown) {
                    player.currSpeed.x = playerCfg.general.speed * Math.cos(player.rad);
                    player.currSpeed.y = playerCfg.general.speed * Math.sin(player.rad);
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
                enem.currSpeed = {
                    x: 0,
                    y: 0
                };

                if (enem.isInCombat)
                    rotateActor(enem, degToRad(enemyCfg.general.spinSpeed), getRadToTarget(enem.actor.getPos(), player.actor.getPos()));

                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) > enemyCfg.general.hugDist && enem.isInCombat || enem.isInCombat == false) {
                    if (canEnemyMove(enem) && enem.isInCombat || enem.isInCombat == false) {
                        enem.currSpeed.x = -enemyCfg.general.speed * Math.cos(enem.rad);
                        enem.currSpeed.y = -enemyCfg.general.speed * Math.sin(enem.rad);
                        enem.actor.moveBy(enem.currSpeed.x, enem.currSpeed.y);
                    }
                }

                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= enemyCfg.general.hugDist && enem.isInCombat)
                    enem.isInRange = true;

                enemXY = enem.actor.getPos();
                enemWH = enem.actor.getSize();
                if (enemXY.x - enemWH.w / 2 < canvas.width && enemXY.x + enemWH.w / 2 > 0 ||
                    enemXY.y - enemWH.h / 2 < canvas.height && enemXY.y + enemWH.h / 2 > 0)
                    enem.didEnter = true;
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

        function doCombat() {
            if (player.shootDelay <= 0) {
                if (keyStates.isShoot) {
                    if (mouseXY.x >= canvas.offsetLeft && mouseXY.x <= canvas.offsetLeft + canvas.width &&
                        mouseXY.y >= canvas.offsetTop && mouseXY.y <= canvas.offsetTop + canvas.height) {
                        createBullet(true, player.weapon, player.actor.getPos(), {
                            x: mouseXY.x - canvas.offsetLeft,
                            y: mouseXY.y - canvas.offsetTop
                        } /*, player.currSpeed*/ );
                        player.shootDelay = player.weapon.getDelay();
                    }
                }
            }
            if (player.autoShootDelay <= 0) {
                let cEnem = getClosestEnemToPlayerInCombat();
                if (cEnem != null) {
                    if (getDistToTarget(cEnem.actor.getPos(), player.actor.getPos()) <= player.autoWeapon.getDistance()) {
                        createBullet(true, player.autoWeapon, player.actor.getPos(), cEnem.actor.getPos());
                        player.autoShootDelay = player.autoWeapon.getDelay();
                    }
                }
            }

            enemies.forEach(enem => {
                if (getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= enemyCfg.general.detectionRange && enem.isInCombat == false && enem.isLeaving == false) {
                    enem.isInCombat = true;
                }

                if (enem.isInCombat && enem.isInRange && getDistToTarget(enem.actor.getPos(), player.actor.getPos()) <= weapons.enemyWeapon.getDistance() && enem.shootDelay <= 0) {
                    if (canEnemyShoot(enem.actor.getPos(), player.actor.getPos(), enem.rad, enemyCfg.general.aimRadius * Math.PI)) {
                        createBullet(false, enem.weapon, enem.actor.getPos(), player.actor.getPos() /*, enem.currSpeed*/ );
                        enem.shootDelay = enem.weapon.getDelay();
                    }
                }
            });
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

        function doThrusterParticles(actor) {
            let xy = actor.actor.getPos();

            if (actor.actor.getType() == "player") {
                doParticles(
                    xy.x, xy.y,
                    playerCfg.thrusterInfo.amnt,
                    playerCfg.thrusterInfo.speed,
                    playerCfg.thrusterInfo.time,
                    playerCfg.thrusterInfo.size,
                    playerCfg.thrusterInfo.colors.min,
                    playerCfg.thrusterInfo.colors.max,
                    actor.rad - playerCfg.thrusterInfo.spread,
                    actor.rad + playerCfg.thrusterInfo.spread
                );
            } else if (actor.actor.getType() == "enemy") {
                doParticles(
                    xy.x, xy.y,
                    enemyCfg.thrusterInfo.amnt,
                    enemyCfg.thrusterInfo.speed,
                    enemyCfg.thrusterInfo.time,
                    enemyCfg.thrusterInfo.size,
                    enemyCfg.thrusterInfo.colors.min,
                    enemyCfg.thrusterInfo.colors.max,
                    actor.rad - enemyCfg.thrusterInfo.spread,
                    actor.rad + enemyCfg.thrusterInfo.spread
                );
            }
        }

        function doBulletImpact(bullet, actor, dmg) {
            if (actor.invulTime <= 0) {
                let i = bullets.indexOf(bullet);
                if (i != -1)
                    bullets.splice(i, 1);

                actor.actor.addHealth(-dmg);
                actor.invulTime = INVULNERABILITY_TIME;

                if (actor.actor.getType() != "player") {
                    actor.isLeaving = false;
                    actor.isInCombat = true;
                }
            }
        }

        function doCountDown() {
            player.shootDelay--;
            player.autoShootDelay--;
            player.invulTime--;

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
                enem.invulTime--;
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

        function getClosestEnemToPlayerInCombat() {
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
                let bulletXY = blt.actor.getPos();
                let bulletWH = blt.actor.getSize();
                if (blt.isFriend) {
                    enemies.forEach(enem => {
                        let enemXY = enem.actor.getPos();
                        let enemWH = enem.actor.getSize();

                        if (bulletXY.x - bulletWH.w / 2 * bulletCfg.scale < enemXY.x + enemWH.w / 2 * playerCfg.general.scale &&
                            bulletXY.x + bulletWH.w / 2 * bulletCfg.scale > enemXY.x - enemWH.w / 2 * playerCfg.general.scale &&
                            bulletXY.y - bulletWH.h / 2 * bulletCfg.scale < enemXY.y + enemWH.h / 2 * playerCfg.general.scale &&
                            bulletXY.y + bulletWH.h / 2 * bulletCfg.scale > enemXY.y - enemWH.h / 2 * playerCfg.general.scale) {
                            doBulletImpact(blt, enem, enem.weapon.getDamage());
                        }
                    });
                } else {
                    let playerXY = player.actor.getPos();
                    let playerWH = player.actor.getSize();

                    if (bulletXY.x - bulletWH.w / 2 * bulletCfg.scale < playerXY.x + playerWH.w / 2 * playerCfg.general.scale &&
                        bulletXY.x + bulletWH.w / 2 * bulletCfg.scale > playerXY.x - playerWH.w / 2 * playerCfg.general.scale &&
                        bulletXY.y - bulletWH.h / 2 * bulletCfg.scale < playerXY.y + playerWH.h / 2 * playerCfg.general.scale &&
                        bulletXY.y + bulletWH.h / 2 * bulletCfg.scale > playerXY.y - playerWH.h / 2 * playerCfg.general.scale) {
                        doBulletImpact(blt, player, player.weapon.getDamage());
                    }
                }
            });
        }

        function checkAliveness() {
            if (player.actor.getHealth() <= 0 && isGodMode == false) {
                let xy = player.actor.getPos();
                doParticles(xy.x, xy.y, 50, 5, 5, 5, {r: 200, g: 200, b: 0}, {r: 200, g: 200, b: 0}, 0, 2 * Math.PI);
                makeEnemsInCombatLeave();
                playerStats.playerDeathScore.val += scoreCfg.playerKill;
                doPlayerStatsVals();
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
                    playerStats.enemyKillScore.val += scoreCfg.enemKill;
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