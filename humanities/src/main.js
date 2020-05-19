//#region consts
const TUTORIAL_CONTAINER_ID = 'tutorial_div';
const CANVAS_CONTAINER_ID = 'canvas_container';

const CONFIG = {
    game: {
        width: 5000,
        height: 5000,
        logic_interval: 10,
        day_duration_sec: 120
    },
    canvas: {
        id: 'canvas',
        width: 2000,
        height: 1000,
        block_context_menu: true
    },
    base: { width: 500, height: 500, color: 'green', entrance_cut: 50, food_to_survive: 20 },
    player: {
        width: 20,
        height: 20,
        color: 'red',
        max_speed: 2,
        max_food: 10
    },
    enemy: {
        width: 20,
        height: 20,
        color: 'darkgreen',
        max_speed: 1.5,
        view_range: 300,
        amount: 100,
        chance_to_move: 0.01,
        max_move_dist: 300
    },
    food: { amount: 200, width: 10, height: 10, color: 'yellow', weight: 10 },
    wall: {
        short: 40,
        long: 200,
        amount: 200,
        random_color: 'rgb(130,50,40)',
        base_color: 'rgb(100,90,77)',
        bound_color: 'gray',
        random_type: 'random',
        base_type: 'base',
        bound_type: 'bound'
    },
    output: {
        timebarColorBG: 'black',
        timebarColorFG: 'red',
        timebarStartX: 0,
        timebarCanvasWidthRatio: 1,
        timebarHeight: 60,
        timebarStartY: 0,
        textColor: 'red',
        textStartX: 10,
        textSize: 40,
        textAlign: 'left'
    }
};

const inputs = {
    up: { code: 87, state: false, type: 'keyboard' },
    down: { code: 83, state: false, type: 'keyboard' },
    left: { code: 65, state: false, type: 'keyboard' },
    right: { code: 68, state: false, type: 'keyboard' },
    take: { code: 0, state: false, type: 'mouse' }
};

const display = new Display(CONFIG.canvas.id, CONFIG.canvas.width, CONFIG.canvas.height);
//#endregion

//#region lets
let base = null;
let player = null;
let enemies = [];
let walls = [];
let foods = [];
let logicLoopIntervalId = null;
let dayNum = null;
let logicLoopIter = null;
let drawBool = null;
let totalFood = null;
let foodTaken = null;
//#endregion

function onStartButtonClick() {
    document.getElementById(TUTORIAL_CONTAINER_ID).style.display = 'none';
    document.getElementById(CANVAS_CONTAINER_ID).style.display = 'block';
    display.updateCanvasSize();
    setup();
}

function doGameOver() {
    clearInterval(logicLoopIntervalId);
    drawBool = false;
    display.clear();
    let x = CONFIG.canvas.width / 2;
    let y = CONFIG.canvas.height / 3;
    let size = 40;
    let color = 'red';

    display.fillText('Game Over!', x, y, size, color, 'center');
    y += size;
    display.fillText(`Days Survived: ${dayNum}`, x, y, size, color, 'center');
    y += size;
    display.fillText(`Food Collected: ${totalFood}`, x, y, size, color, 'center');
    y += size;
    display.fillText(`Food Taken Away: ${foodTaken}`, x, y, size, color, 'center');
}

function logicLoop() {
    logicLoopIter++;
    console.log('here');

    movePlayer();
    moveEnemies();
    checkPlayerFoodCollision();
    checkPlayerEnemyCollision();
    if (isCollision(player.getArea(), base.getArea())) {
        base.food += player.carriedFood;
        player.carriedFood = 0;

        if (base.food >= CONFIG.base.food_to_survive){
            resetup();
        }
    }

    if (getTimePassed() > CONFIG.game.day_duration_sec) {
        if (base.food >= CONFIG.base.food_to_survive) {
            resetup();
        } else {
            doGameOver();
        }
    }
}

//#region setup
function setup() {
    dayNum = 0;
    logicLoopIter = 0;
    totalFood = 0;
    foodTaken = 0;
    spawnBase();
    spawnWalls();
    spawnPlayer();
    spawnEnemies();
    spawnFood();

    drawBool = true;
    draw();
    logicLoopIntervalId = setInterval(() => {
        logicLoop();
    }, CONFIG.game.logic_interval);
}

function resetup() {
    dayNum++;
    logicLoopIter = 0;
    base.food = 0;
    enemies = [];
    spawnPlayer();
    spawnEnemies();

    if (dayNum % 5 == 0) {
        foods = [];
        spawnFood();
    }
}

function spawnBase() {
    base = new Base(CONFIG.wall.short, CONFIG.wall.short, CONFIG.base.width, CONFIG.base.height, CONFIG.base.color);
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnPlayer() {
    if (player) if (player.carriedFood != 0) foodTaken += player.carriedFood;

    while (true) {
        let x = randomBetween(CONFIG.wall.short, CONFIG.wall.short + base.w - CONFIG.player.width);
        let y = randomBetween(CONFIG.wall.short, CONFIG.wall.short + base.h - CONFIG.player.height);
        player = new Player(
            x,
            y,
            CONFIG.player.width,
            CONFIG.player.height,
            CONFIG.player.max_speed,
            CONFIG.player.color
        );
        if (!checkIfWallCollision(player)) {
            return;
        }
    }
}

function spawnWalls() {
    spawnBoundWalls();
    spawnBaseWalls();
    spawnRandomWalls();
}

function spawnBoundWalls() {
    walls.push(new Wall(0, 0, CONFIG.game.width, CONFIG.wall.short, CONFIG.wall.bound_color, CONFIG.wall.bound_type));
    walls.push(
        new Wall(
            0,
            CONFIG.game.height - CONFIG.wall.short,
            CONFIG.game.width,
            CONFIG.wall.short,
            CONFIG.wall.bound_color,
            CONFIG.wall.bound_type
        )
    );
    walls.push(new Wall(0, 0, CONFIG.wall.short, CONFIG.game.height, CONFIG.wall.bound_color, CONFIG.wall.bound_type));
    walls.push(
        new Wall(
            CONFIG.game.width - CONFIG.wall.short,
            0,
            CONFIG.wall.short,
            CONFIG.game.height,
            CONFIG.wall.bound_color,
            CONFIG.wall.bound_type
        )
    );
}

function spawnBaseWalls() {
    walls.push(
        new Wall(
            CONFIG.wall.short,
            base.h,
            base.w / 2 - CONFIG.base.entrance_cut,
            CONFIG.wall.short,
            CONFIG.wall.base_color,
            CONFIG.wall.base_type
        )
    );
    walls.push(
        new Wall(
            CONFIG.wall.short + base.w / 2 + CONFIG.base.entrance_cut,
            base.h,
            base.w / 2 - CONFIG.base.entrance_cut,
            CONFIG.wall.short,
            CONFIG.wall.base_color,
            CONFIG.wall.base_type
        )
    );
    walls.push(
        new Wall(
            base.w,
            CONFIG.wall.short,
            CONFIG.wall.short,
            base.h / 2 - CONFIG.base.entrance_cut,
            CONFIG.wall.base_color,
            CONFIG.wall.base_type
        )
    );
    walls.push(
        new Wall(
            base.w,
            CONFIG.wall.short + base.h / 2 + CONFIG.base.entrance_cut,
            CONFIG.wall.short,
            base.h / 2 - CONFIG.base.entrance_cut,
            CONFIG.wall.base_color,
            CONFIG.wall.base_type
        )
    );
}

function canSpawn(area, wallsToCheck, checkPlayer, checkEnemies, checkFood, checkBase) {
    if (wallsToCheck.length > 0) {
        for (let i = 0; i < walls.length; i++) {
            let wall = walls[i];

            if (wallsToCheck.indexOf(wall.type) >= 0) {
                if (isCollision(wall.getArea(), area)) {
                    return false;
                }
            }
        }
    }

    if (checkPlayer) {
        if (isCollision(player.getArea(), area)) {
            return false;
        }
    }

    if (checkEnemies) {
        for (let i = 0; i < enemies.length; i++) {
            let enemy = enemies[i];
            if (isCollision(enemy.getArea(), area)) {
                return false;
            }
        }
    }

    if (checkFood) {
        for (let i = 0; i < foods.length; i++) {
            let food = foods[i];
            if (isCollision(food.getArea(), area)) {
                return false;
            }
        }
    }

    if (checkBase) {
        if (isCollision(base.getArea(), area)) {
            return false;
        }
    }

    return true;
}

function spawnRandomWalls() {
    let attempt = 0;
    for (let i = 0; i < CONFIG.wall.amount; ) {
        attempt++;
        if (attempt > 10000) {
            alert('too many failed random wall spawn attempts!');
            return;
        }
        let x = randomBetween(0, CONFIG.game.width);
        let y = randomBetween(0, CONFIG.game.height);
        let w;
        let h;

        if (Math.random() < 0.5) {
            w = CONFIG.wall.long;
            h = CONFIG.wall.short;
        } else {
            w = CONFIG.wall.short;
            h = CONFIG.wall.long;
        }

        let wall = new Wall(x, y, w, h, CONFIG.wall.random_color, CONFIG.wall.random_type);

        if (canSpawn(wall.getArea(), [ CONFIG.wall.base_type, CONFIG.wall.bound_type ], false, false, false, true)) {
            walls.push(wall);
            i++;
        }
    }
}

function spawnEnemies() {
    let attempt = 0;
    for (let i = 0; i < CONFIG.enemy.amount; ) {
        attempt++;
        if (attempt > 1000) {
            alert('too many failed enemy spawn attempts!');
            return;
        }
        let x = randomBetween(0, CONFIG.game.width);
        let y = randomBetween(0, CONFIG.game.height);

        let enemy = new Enemy(
            x,
            y,
            CONFIG.enemy.width,
            CONFIG.enemy.height,
            CONFIG.enemy.max_speed,
            CONFIG.enemy.color
        );

        if (
            canSpawn(
                enemy.getArea(),
                [ CONFIG.wall.base_type, CONFIG.wall.bound_type, CONFIG.wall.random_type ],
                false,
                false,
                false,
                true
            )
        ) {
            enemies.push(enemy);
            i++;
        }
    }
}

function spawnFood() {
    let attempt = 0;
    for (let i = 0; i < CONFIG.food.amount; ) {
        attempt++;
        if (attempt > 1000) {
            alert('too many failed food spawn attempts!');
            return;
        }
        let x = randomBetween(0, CONFIG.game.width);
        let y = randomBetween(0, CONFIG.game.height);

        let food = new Food(x, y, CONFIG.food.width, CONFIG.food.height, CONFIG.food.weight, CONFIG.food.color);

        if (
            canSpawn(
                food.getArea(),
                [ CONFIG.wall.base_type, CONFIG.wall.bound_type, CONFIG.wall.random_type ],
                false,
                false,
                true,
                true
            )
        ) {
            foods.push(food);
            i++;
        }
    }
}
//#endregion

//#region draw
function draw() {
    if (!drawBool) return;

    requestAnimationFrame(draw);

    display.clear();

    drawBase();
    drawWalls();
    drawPlayer();
    drawEnemies();
    drawFood();

    drawTimeBar();
    drawText();

    display.outlineRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height, 'red', 3);
}

function getTimePassed() {
    return logicLoopIter * CONFIG.game.logic_interval / 1000;
}

function drawTimeBar() {
    let ratio = getTimePassed() / CONFIG.game.day_duration_sec;

    let width = CONFIG.output.timebarCanvasWidthRatio * CONFIG.canvas.width;

    display.fillRect(
        CONFIG.output.timebarStartX,
        CONFIG.output.timebarStartY,
        width,
        CONFIG.output.timebarHeight,
        CONFIG.output.timebarColorBG
    );
    display.fillRect(
        CONFIG.output.timebarStartX,
        CONFIG.output.timebarStartY,
        width * ratio,
        CONFIG.output.timebarHeight,
        CONFIG.output.timebarColorFG
    );
}

function drawText() {
    let day = `Days Survived: ${dayNum}`;
    let strP = `Carried Food: ${player.carriedFood}/${CONFIG.player.max_food}`;
    let strB = `Food at Camp: ${base.food}/${CONFIG.base.food_to_survive}`;

    let y = CONFIG.output.timebarStartY + CONFIG.output.timebarHeight + CONFIG.output.textSize;
    for (let str of [ day, strP, strB ]) {
        display.fillText(
            str,
            CONFIG.output.textStartX,
            y,
            CONFIG.output.textSize,
            CONFIG.output.textColor,
            CONFIG.output.textAlign
        );
        y += CONFIG.output.textSize;
    }
}

function getOffset(entity) {
    let x = CONFIG.canvas.width / 2 - player.x - player.w / 2;
    let y = CONFIG.canvas.height / 2 - player.y - player.w / 2;

    let clone = Object.assign({}, entity);
    clone.x += x;
    clone.y += y;

    return clone;
}

function drawBase() {
    let offsetXY = getOffset(base);
    display.fillRect(offsetXY.x, offsetXY.y, base.w, base.h, base.color);
}

function drawWalls() {
    for (let i = 0; i < walls.length; i++) {
        let wall = walls[i];
        let offsetXY = getOffset(wall);
        display.fillRect(offsetXY.x, offsetXY.y, wall.w, wall.h, wall.color);
    }
}

function drawPlayer() {
    display.fillRect(
        CONFIG.canvas.width / 2 - player.w / 2,
        CONFIG.canvas.height / 2 - player.h / 2,
        player.w,
        player.h,
        player.color
    );
}

function drawEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        let offsetXY = getOffset(enemy);
        display.fillRect(offsetXY.x, offsetXY.y, enemy.w, enemy.h, enemy.color);
    }
}

function drawFood() {
    for (let i = 0; i < foods.length; i++) {
        let food = foods[i];
        let offsetXY = getOffset(food);
        display.fillRect(offsetXY.x, offsetXY.y, food.w, food.h, food.color);
    }
}
//#endregion

//#region move
function movePlayer() {
    let x = 0;
    let y = 0;
    if (inputs.up.state != inputs.down.state) {
        if (inputs.up.state) {
            y = -player.maxSpeed;
        } else {
            y = player.maxSpeed;
        }
    }

    if (inputs.left.state != inputs.right.state) {
        if (inputs.left.state) {
            x = -player.maxSpeed;
        } else {
            x = player.maxSpeed;
        }
    }

    moveActor(player, { x: x, y: y });
}

function checkPlayerFoodCollision() {
    if (player.carriedFood >= CONFIG.player.max_food) return;

    for (let i = 0; i < foods.length; i++) {
        if (isCollision(foods[i].getArea(), player.getArea())) {
            player.carriedFood++;
            totalFood++;
            foods.splice(i, 1);
        }
    }
}

function checkPlayerEnemyCollision() {
    let p = player.getArea();
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i].getArea();
        if (isCollision(p, e) && !isCollision(p, base.getArea())) {
            spawnPlayer();
            return;
        }
    }
}

function isEnemyCloseToPlayer(enemy) {
    let distX = Math.abs(enemy.x - player.x);
    let distY = Math.abs(enemy.y - player.y);

    let dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    return dist <= CONFIG.enemy.view_range;
}

function doesEnemyHaveLineOfSightToPlayer(enemy) {
    let sx = enemy.x + enemy.w / 2;
    let sy = enemy.y + enemy.h / 2;
    let ex = player.x + player.w / 2;
    let ey = player.y + player.h / 2;

    for (let i = 0; i < walls.length; i++) {
        let rx = walls[i].x;
        let ry = walls[i].y;
        let rw = walls[i].w;
        let rh = walls[i].h;

        if (lineRect(sx, sy, ex, ey, rx, ry, rw, rh)) {
            return false;
        }
    }
    return true;

    // http://www.jeffreythompson.org/collision-detection/line-rect.php
    function lineRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        let left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        let right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        let top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        let bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

        return left || right || top || bottom;
    }

    function lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

        return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
    }
}

function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        if (
            !isCollision(player.getArea(), base.getArea()) &&
            isEnemyCloseToPlayer(enemy) &&
            doesEnemyHaveLineOfSightToPlayer(enemy)
        ) {
            moveEnemyToPlayer(enemy);
        } else {
            moveEnemyRandomly(enemy);
        }
    }
}

function getRadBetweenTwoPoints(start, end) {
    let distX = end.x - start.x;
    let distY = end.y - start.y;
    return Math.atan2(distY, distX);
}

function moveEnemyToPlayer(enemy) {
    let rad = getRadBetweenTwoPoints(
        { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2 },
        { x: player.x + player.w / 2, y: player.y + player.h / 2 }
    );
    let speed = { x: Math.cos(rad) * enemy.maxSpeed, y: Math.sin(rad) * enemy.maxSpeed };
    moveActor(enemy, speed);
}

function moveActor(actor, speed) {
    actor.x += speed.x;
    if (checkIfWallCollision(actor.getArea())) {
        actor.x -= speed.x;
    }

    actor.y += speed.y;
    if (checkIfWallCollision(actor.getArea())) {
        actor.y -= speed.y;
    }
}

function moveEnemyRandomly(enemy) {
    if (enemy.hasMove()) {
        moveActor(enemy, enemy.getMove());
    } else {
        if (Math.random() < CONFIG.enemy.chance_to_move) {
            let x = randomBetween(0, CONFIG.enemy.max_move_dist);
            let y = randomBetween(0, CONFIG.enemy.max_move_dist);
            let speedX = randomBetween(CONFIG.enemy.max_speed / 2, CONFIG.enemy.max_speed);
            let speedY = randomBetween(CONFIG.enemy.max_speed / 2, CONFIG.enemy.max_speed);

            if (Math.random() < 0.5) {
                speedX = -speedX;
            }

            if (Math.random() < 0.5) {
                speedY = -speedY;
            }

            enemy.setMove(x, y, speedX, speedY);
        }
    }
}

function checkIfWallCollision(area) {
    for (let i = 0; i < walls.length; i++) {
        let wall = walls[i];
        if (isCollision(area, wall.getArea())) {
            return true;
        }
    }
    return false;
}
//#endregion

//#region events
function setInput(e) {
    let code;
    let type;
    let state;
    if (e.type == 'keydown' || e.type == 'keyup') {
        code = e.keyCode;
        type = 'keyboard';
        state = e.type == 'keydown';
    } else if (e.type == 'mousedown' || e.type == 'mouseup') {
        code = e.button;
        type = 'mouse';
        state = e.type == 'mousedown';
    } else {
        return;
    }

    for (let action in inputs) {
        if (inputs[action].type == type && inputs[action].code == code) {
            inputs[action].state = state;
        }
    }
}
document.body.onresize = (e) => {
    display.updateCanvasSize();
};
document.oncontextmenu = () => {
    return !(BLOCK_CONTEXT_MENU && display.getMousePosOnCanvas() != null);
};
document.onkeydown = (e) => {
    setInput(e);
};
document.onkeyup = (e) => {
    setInput(e);
};
document.onmousedown = (e) => {
    setInput(e);
};
document.onmouseup = (e) => {
    setInput(e);
};
document.onmousemove = (e) => {
    display.onMouseMove(e);
};
//#endregion
