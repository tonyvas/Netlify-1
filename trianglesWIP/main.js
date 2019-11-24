let canvas;
let context
let isDebug = false;

function main(){
    try {
        canvas = document.getElementById('canv');
        canvas.width = document.getElementById('gameScreen').clientWidth;
        canvas.height = document.getElementById('gameScreen').clientHeight;
        context = canvas.getContext('2d');

        let isPaused = false;
        function pauseGame(){isPaused = !isPaused;}

        let mouseXY = {x: 0, x: 0};
        let keyBinds = {left: "A", right: "D", up: "W", down: "S", sprint: " ", pause: "ESCAPE", shoot: "0"};
        let keyStates = {isLeft: false, isRight: false, isUp: false, isDown: false, isSprint: false, isShoot: false, isPause: false};
        let gameStats = {
            fps: 0, 
            fpsUpdateTime: 10, 
            startTime: 0, 
            currentTime: 0, 
            runTime: 0, 
            lastTime: 0, 
            main: 0,
            playerIndex: 0,
            enemyIndex: 0,
            bulletIndex: 0,
            particleIndex: 0
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

        let ENEMY_AMOUNT = 10;
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
            createEnemies();
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
                    "player", 
                    100, 
                    {x: canvas.width / 2, y: canvas.height / 2}, 
                    images.playership, 
                    weapons.playerWeapon
                ),
                deg: 0,
                scale: 1,
                speed: 10
            };
            gameStats.playerIndex++;
        }

        function createEnemies(){
            
        }

        function gameLoop(){
            if (keyStates.isPause){
                keyStates.isPause = false;
                pauseGame();
            }
        
            if (isPaused == false){
                doStats();

                drawStuff();
                moveStuff();
                doCooldowns();

                if (keyStates.isShoot){
                    doParticles(
                        mouseXY.x - canvas.offsetLeft, mouseXY.y - canvas.offsetTop, 
                        50, 
                        5, 5, 
                        {r:0,g:0,b:0}, {r:255,g:255,b:255}, 
                        0, 360, 
                        5
                    );
                }
            }

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

            gameStats.main++;
            gameStats.currentTime = Date.now();
            gameStats.runTime = gameStats.currentTime - gameStats.startTime;
            if (gameStats.main % gameStats.fpsUpdateTime == 0)
                gameStats.fps = Math.floor(1000 / (gameStats.currentTime - gameStats.lastTime));
            gameStats.lastTime = gameStats.currentTime;
        }

        function drawStuff(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawPlayer();
            drawParticles();
        }

        function moveStuff(){
            movePlayer();
            moveParticles();
        }

        function doCooldowns(){
            particles.forEach(particle => {
                if (particle.time > 0)
                    particle.time--;
                else{
                    let i = particles.indexOf(particle);
                    if (i != -1)
                        particles.splice(i, 1);
                }
            });
        }

        function drawPlayer(){
            let playerXY = player.actor.getPos();
            let playerWH = player.actor.getSize();
            
            context.save();
            context.translate(playerXY.x, playerXY.y);
            context.rotate(Math.PI / 180 * player.deg);
            context.translate(-playerXY.x, -playerXY.y);
            context.drawImage(
                player.actor.getImage(), 
                playerXY.x - playerWH.w / 2 * player.scale, 
                playerXY.y - playerWH.h / 2 * player.scale, 
                playerWH.w * player.scale, 
                playerWH.h * player.scale);
            context.restore();
        }

        function movePlayer(){
            let x;
            let y;
            let playerXY;
            let playerWH;

            if (keyStates.isLeft == keyStates.isRight)
                x = 0;
            if (keyStates.isLeft)
                x = -player.speed;
            if (keyStates.isRight)
                x = player.speed;

            if (keyStates.isUp == keyStates.isDown)
                y = 0;
            if (keyStates.isUp)
                y = -player.speed;
            if (keyStates.isDown)
                y = player.speed;

            player.actor.moveBy(x, y);

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

            playerXY = player.actor.getPos();
            playerWH = player.actor.getSize();

            let diffX = playerXY.x - mouseXY.x + canvas.offsetLeft;
            let diffY = playerXY.y - mouseXY.y + canvas.offsetTop;
            let tan = diffY / diffX;
            let degs = Math.atan(tan) * 180 / Math.PI;
            
            if (diffY >= 0 && diffX >= 0)
                degs += 180;
            else if (diffY <= 0 && diffX >= 0)
                degs -= 180;
            
            player.deg = degs;
        }

        function drawParticles(){
            particles.forEach(particle => {
                context.fillStyle = particle.color;
                context.fillRect(particle.pos.x, particle.pos.y, particle.size, particle.size);
            });
        }

        function moveParticles(){
            particles.forEach(particle => {
                particle.pos.x += particle.speed * Math.cos(Math.PI / 180 * particle.angle);
                particle.pos.y += particle.speed * Math.sin(Math.PI / 180 * particle.angle);
            });
        }

        function doParticles(x, y, amnt, spd, time, clrMin, clrMax, angMin, angMax, size){
            for (let i = 0; i < amnt; i++){
                let ang = Math.floor(Math.random() * (angMax - angMin) + angMin);
                let r = Math.floor(Math.random() * (clrMax.r - clrMin.r) + clrMin.r);
                let g = Math.floor(Math.random() * (clrMax.g - clrMin.g) + clrMin.g);
                let b = Math.floor(Math.random() * (clrMax.b - clrMin.b) + clrMin.b);
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