let canvas;
let context
let isDebug = false;
let isPaused = false;

function main(){
    try {
        canvas = document.getElementById('canv');
        canvas.width = document.getElementById('gameScreen').clientWidth;
        canvas.height = document.getElementById('gameScreen').clientHeight;
        context = canvas.getContext('2d');

        let mouseXY = {x: 0, x: 0};
        let keyBinds = {left: "A", right: "D", up: "W", down: "S", sprint: " ", pause: "ESCAPE", shoot: "0"};
        let keyStates = {isLeft: false, isRight: false, isUp: false, isDown: false, isSprint: false, isShoot: false, isPause: false};
        let gameStats = {
            fps: 0, 
            fpsUpdateTime: 10, 
            fpsUpdateSum: 0,
            mousePos: "0, 0",
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

        let createImg = function (src, w, h){
            let img = new Image();
            img.src = src;
            return {img: img, w: w, h: h};
        }
        let images = {
            playership: createImg("imgs/enemyship.png", 150, 75),
            cargoship: createImg("imgs/cargoship.png", 125, 80),
            enemyship: createImg("imgs/spaceship.png", 100, 100)
        };

        let playerStats = {
            scale: 0.5,
            speed: 5,
            startingHP: 100,
            type: "player"
        };

        let enemyStats = {
            amount: 10,
            scale: 0.5,
            speed: 4,
            startingHP: 100,
            type: "enemy",
            spawnPerim: 100,
            detectionRange: 100,
            hugDist: 50
        };

        let cargoStats = {
            scale: 0.5,
            speed: 3,
            startingHP: 100,
            type: "cargo"
        };

        let player;
        let enemies = [];
        let bullets = [];
        let weapons = [];
        let particles = [];

        setupGame();
        function setupGame(){
            gameStats.startTime = Date.now();
            gameStats.lastTime = gameStats.startTime;
            document.getElementById('btn_debug').disabled = false;
            createWeapons();
            createPlayer();
            gameLoop();
        }

        function createWeapons(){
            weapons = {
                playerWeapon: new Weapon(0, "playerWeapon", 20, 300, 100)
            };
        }

        function createPlayer(){
            player = {
                actor: new Actor(
                    gameStats.playerIndex, 
                    playerStats.type, 
                    playerStats.startingHP, 
                    {x: canvas.width / 2, y: canvas.height / 2}, 
                    images.playership, 
                    weapons.playerWeapon
                ),
                rad: 0,
                scale: playerStats.scale,
                speed: playerStats.speed
            };
            gameStats.playerIndex++;
        }

        function gameLoop(){
            if (keyStates.isPause){
                keyStates.isPause = false;
                isPaused = !isPaused;
            }

            doStats();
        
            if (isPaused == false){
                gameStats.main++;
                createEnemies();
                drawStuff();
                moveStuff();
                doCombat();
                CheckLifeLeft();
            }            

            gameStats.game++;
            requestAnimationFrame(gameLoop);
        }

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

            gameStats.mousePos = mouseXY.x + ", " + mouseXY.y;
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
        }

        function createEnemies(){
            if (enemies.length < enemyStats.amount){
                for (let i = enemies.length; i < enemyStats.amount; i++){
                    enemies[i] = {
                        actor: new Actor(
                            gameStats.enemyIndex,
                            enemyStats.type,
                            enemyStats.startingHP,
                            getRandomSpawnPoint(),
                            images.enemyship,
                            null
                        ),
                        passBy: getRandomPassByPoint(),
                        rad: null,
                        scale: enemyStats.scale,
                        speed: enemyStats.speed,
                        didEnter: false,
                        isInCombat: false
                    }
                    enemies[i].rad = calculateRad(enemies[i].actor.getPos(), enemies[i].passBy);
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

            function calculateRad(startXY, targetXY){
                let distX = startXY.x - targetXY.x;
                let distY = startXY.y - targetXY.y;
                let rad = Math.atan2(distY, distX);
                return rad;
            }
        }

        function drawStuff(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawPlayer();
            drawEnemy();
            drawParticles();
        }

        function moveStuff(){
            movePlayer();
            moveEnemy();
            moveParticles();
        }

        function doCombat(){
            if (keyStates.isShoot){
                if (mouseXY.x >= canvas.offsetLeft && mouseXY.x <= canvas.offsetLeft + canvas.width &&
                    mouseXY.y >= canvas.offsetTop && mouseXY.y <= canvas.offsetTop + canvas.height){
                    doParticles(
                        mouseXY.x - canvas.offsetLeft, mouseXY.y - canvas.offsetTop, 
                        50, 
                        5, 5, 
                        {r:0,g:0,b:0}, {r:255,g:255,b:255}, 
                        0, 2 * Math.PI, 
                        5
                    );
                }
            }

            enemies.forEach(enem => {
                if (getDistToPlayer(enem) <= enemyStats.detectionRange && enem.isInCombat == false){
                    enem.isInCombat = true;
                }
            });
        }

        function CheckLifeLeft(){
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
            });
        }

        function drawPlayer(){
            let playerXY = player.actor.getPos();

            let diffX = mouseXY.x - playerXY.x - canvas.offsetLeft;
            let diffY = mouseXY.y - playerXY.y - canvas.offsetTop;
            let rads = Math.atan2(diffY, diffX) + Math.PI;
            
            player.rad = rads;

            drawActor(player.actor.getPos(), player.actor.getSize(), player.rad, player.actor.getImage(), player.scale)
        }

        function drawEnemy(){
            enemies.forEach(enem => {
                drawActor(enem.actor.getPos(), enem.actor.getSize(), enem.rad, enem.actor.getImage(), enem.scale)
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

        function movePlayer(){
            let x;
            let y;
            let playerXY;
            let playerWH;
            let didMove = false;

            if (keyStates.isLeft == keyStates.isRight)
                x = 0;
            if (keyStates.isLeft){
                x = -player.speed;
                didMove = true;
            }
            if (keyStates.isRight){
                x = player.speed;
                didMove = true;
            }

            if (keyStates.isUp == keyStates.isDown)
                y = 0;
            if (keyStates.isUp){
                y = -player.speed;
                didMove = true;
            }
            if (keyStates.isDown){
                y = player.speed;
                didMove = true;
            }

            player.actor.moveBy(x, y);

            if (didMove){
                playerXY = player.actor.getPos();
                playerWH = player.actor.getSize();
                x = playerXY.x;
                y = playerXY.y;
                if (playerXY.x - playerWH.w / 2 * player.scale <= 0)
                    x = playerWH.w / 2 * player.scale;
                if (playerXY.x + playerWH.w / 2 * player.scale >= canvas.width)
                    x = canvas.width - playerWH.w / 2 * player.scale;
                if (playerXY.y - playerWH.h / 2 * player.scale <= 0)
                    y = playerWH.h / 2 * player.scale;
                if (playerXY.y + playerWH.h / 2 * player.scale >= canvas.height)
                    y = canvas.height - playerWH.h / 2 * player.scale;

                player.actor.moveTo(x, y);

                // doParticles(
                //     playerXY.x, playerXY.y + playerWH.h / 2, 
                //     50, 5, 5, 
                //     {r:0,g:0,b:0}, {r:255,g:0,b:0}, 
                //     player.rad, 180, 
                //     5
                // );
            }
        }

        function moveEnemy(){
            enemies.forEach(enem => {
                let enemXY = enem.actor.getPos();
                let enemWH = enem.actor.getSize();

                if (enem.isInCombat)
                    enem.rad = -getRadsToPlayer(enem);

                if (getDistToPlayer(enem) > enemyStats.hugDist && enem.isInCombat || enem.isInCombat == false){
                    if (CheckEnemyMovePriority(enem) && enem.isInCombat || enem.isInCombat == false){
                        let x = -enem.speed * Math.cos(enem.rad);
                        let y = -enem.speed * Math.sin(enem.rad);
                        enem.actor.moveBy(x, y);

                        doParticles(
                            enemXY.x, enemXY.y,
                            10, 1, 5,
                            {r:0,g:0,b:0}, {r:255,g:0,b:0},
                            enem.rad - Math.PI / 4, enem.rad + Math.PI / 4,
                            5
                        )
                    }
                }
                
                enemXY = enem.actor.getPos();
                enemWH = enem.actor.getSize();
                if (enemXY.x - enemWH.w / 2 < canvas.width && enemXY.x + enemWH.w / 2 > 0 ||
                    enemXY.y - enemWH.h / 2 < canvas.height && enemXY.y + enemWH.h / 2 > 0)
                    enem.didEnter = true;
            });
        }

        function CheckEnemyMovePriority(enem){
            let currEnemyXY = enem.actor.getPos();
            let currEnemyWH = enem.actor.getSize();
            let playerXY = player.actor.getPos();
            let closestEnemy = enem;
        
            enemies.forEach(checkEnem =>{
                let checkEnemXY = checkEnem.actor.getPos();
                let checkEnemWH = checkEnem.actor.getSize();
                    if (enem.actor.getId() != checkEnem.actor.getId())
                        if (currEnemyXY.x - currEnemyWH.w / 2 < checkEnemXY.x + checkEnemWH.w / 2 && 
                            currEnemyXY.x + currEnemyWH.w / 2 > checkEnemXY.x - checkEnemWH.w / 2 && 
                            currEnemyXY.y - currEnemyWH.h / 2 < checkEnemXY.y + checkEnemWH.h / 2 && 
                            currEnemyXY.y + currEnemyWH.h / 2 > checkEnemXY.y - checkEnemWH.h / 2)
                            if (
                                (Math.abs(currEnemyXY.x - playerXY.x) ** 2) + (Math.abs(currEnemyXY.y - playerXY.y) ** 2) > 
                                (Math.abs(checkEnemXY.x - playerXY.x) ** 2) + (Math.abs(checkEnemXY.y - playerXY.y) ** 2))
                                closestEnemy = checkEnem;
            });
        
            if (closestEnemy == enem)
                return true;
            else
                return false;
        }

        function moveParticles(){
            particles.forEach(particle => {
                particle.pos.x += particle.speed * Math.cos(particle.angle);
                particle.pos.y += particle.speed * Math.sin(particle.angle);
            });
        }

        function doParticles(x, y, amnt, spd, time, clrMin, clrMax, angMin, angMax, size){
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
        
        function getRandomBetween(min, max){
            return Math.floor(Math.random() * (max - min) + min);
        }

        function getDistToPlayer(actor){
            let actorXY = actor.actor.getPos();
            let playerXY = player.actor.getPos();
            let x = Math.abs(actorXY.x - playerXY.x);
            let y = Math.abs(actorXY.y - playerXY.y);
            let dist = Math.sqrt(x ** 2 + y ** 2);
            return dist;
        }

        function getRadsToPlayer(actor){
            let actorXY = actor.actor.getPos();
            let playerXY = player.actor.getPos();
            let diffX = actorXY.x - playerXY.x;
            let diffY = actorXY.y - playerXY.y;
            let angle = Math.atan2(diffY, diffX);
            return -angle;
        }

        function radToDeg(ang){
            return ang * (180 / Math.PI);
        }

        function degToRad(ang){
            return Math.PI / 180 * ang;
            
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
            else if (e.key.toUpperCase() == keyBinds.sprint) {
                keyStates.isSprint = true;
            }
            else if (e.key.toUpperCase() == keyBinds.pause) {
                keyStates.isPause = true;
            }

            console.log(e.key);
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
            else if (e.key.toUpperCase() == keyBinds.sprint) {
                keyStates.isSprint = false;
            }
        }
    } catch (error) {
        alert("error: \n" + error.stack);
        console.log(error);
    }
}