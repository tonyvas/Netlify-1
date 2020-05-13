//#region consts
const CONFIG = {
    game: {
        width: 5000,
        height: 5000,
        move_interval: 10
    },
    canvas: {
        id: 'canvas',
        width: 2000,
        height: 1000,
        block_context_menu: true
    },
    base: { width: 500, height: 500, color: 'green', entrance_cut: 50 },
    player: {
        width: 20,
        height: 20,
        color: 'red',
        max_speed: 1,
        max_food: null
    },
    enemy: {
        width: 20,
        height: 20,
        color: 'darkgreen',
        max_speed: 1.5,
        view_range: 100,
        amount: 100,
        chance_to_move: 0.003,
        max_move_dist: 200
    },
    food: { amount: 200, width: 10, height: 10, color: 'yellow', weight: 10 },
    wall: {
        short: 40,
        long: 200,
        amount: 200,
        random_color: 'blue',
        base_color: 'purple',
        bound_color: 'gray',
        random_type: 'random',
        base_type: 'base',
        bound_type: 'bound'
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

//#region entities
let base = null;
let player = null;
let enemies = [];
let walls = [];
let foods = [];
//#endregion

//#region setup
function setup() {
    spawnBase();
    spawnPlayer();
    spawnWalls();
    spawnEnemies();
    spawnFood();

    draw();
    setInterval(() => {
        move();
    }, CONFIG.game.move_interval);
}

function spawnBase() {
    base = new Base(CONFIG.wall.short, CONFIG.wall.short, CONFIG.base.width, CONFIG.base.height, CONFIG.base.color);
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnPlayer() {
    let x = randomBetween(CONFIG.wall.short, CONFIG.wall.short + base.w - CONFIG.player.width);
    let y = randomBetween(CONFIG.wall.short, CONFIG.wall.short + base.h - CONFIG.player.height);
    player = new Player(x, y, CONFIG.player.width, CONFIG.player.height, CONFIG.player.max_speed, CONFIG.player.color);
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
    requestAnimationFrame(draw);

    display.clear();

    drawBase();
    drawWalls();
    drawPlayer();
    drawEnemies();
    drawFood();

    display.outlineRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height, 'red', 3);
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
function move() {
    movePlayer();
    moveEnemies();
}

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

    player.x += x;
    if (checkIfWallCollision(player.getArea())) {
        player.x -= x;
    }

    player.y += y;
    if (checkIfWallCollision(player.getArea())) {
        player.y -= y;
    }
}

function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        if (enemy.hasMove()) {
            let move = enemy.getMove();

            enemy.x += move.x;
            if (checkIfWallCollision(enemy.getArea())) {
                enemy.x -= move.x;
            }

            enemy.y += move.y;
            if (checkIfWallCollision(enemy.getArea())) {
                enemy.y -= move.y;
            }
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

document.body.onload = () => {
    setup();
};
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
