import Display from './display.js';
import Collision from './collision.js';
import Player from './player.js';
import Enemy from './enemy.js';
import Map from './map.js';

const LOOP_INTERVAL = 1000 / 60;
const CELL_AMOUNT_ROWS = 50;
const CELL_AMOUNT_COLS = 100;
const CELL_SIZE = 30;
const OBSTACLE_AMOUNT = 60;
const OBSTACLE_MIN_SIZE = 2;
const OBSTACLE_MAX_SIZE = 10;
const OBSTACLE_CREATION_ATTEMPTS = 1000;
const OBSTACLE_COLOR = 'black';
const PLAYER_SIZE = 20;
const PLAYER_COLOR = 'red';
const ENEMY_SIZE = 20;
const ENEMY_AMOUNT = 10;
const ENEMY_COLOR = 'blue';


const keysDown = { up: false, down: false, left: false, right: false };
const display = new Display('canvas', CELL_AMOUNT_COLS * CELL_SIZE, CELL_AMOUNT_ROWS * CELL_SIZE);
const map = new Map(CELL_AMOUNT_ROWS, CELL_AMOUNT_COLS, CELL_SIZE);
map.generateObstacles(OBSTACLE_AMOUNT, OBSTACLE_MIN_SIZE, OBSTACLE_MAX_SIZE, OBSTACLE_CREATION_ATTEMPTS);
const obstacles = map.getObstacleHitboxes();

let player = new Player({ x: 0, y: 0, w: PLAYER_SIZE, h: PLAYER_SIZE });
let enemies = [];

function createEnemies() {
    enemies = [];
    for (let i = 0; i < ENEMY_AMOUNT; i++) {
        enemies.push(
            new Enemy(i, {
                x: Math.floor(Math.random() * display.getCanvasSize().w),
                y: Math.floor(Math.random() * display.getCanvasSize().h),
                w: ENEMY_SIZE,
                h: ENEMY_SIZE
            })
        );
    }
}

function loop() {
    display.clear();
    display.border(display.getDisplayArea(), 'red', 3);

    drawMap();
    movePlayer();
    moveEnemies();
    obstacleCollision();
    playerMapBounds();
    draw();
}

function drawMap() {
    for (let i = 0; i < obstacles.length; i++) {
        display.drawRect(obstacles[i], OBSTACLE_COLOR);
    }
}

function movePlayer() {
    if (keysDown.up != keysDown.down) {
        if (keysDown.up) {
            player.moveBy(0, -player.maxSpeed);
        } else {
            player.moveBy(0, player.maxSpeed);
        }
    }
    if (keysDown.left != keysDown.right) {
        if (keysDown.left) {
            player.moveBy(-player.maxSpeed, 0);
        } else {
            player.moveBy(player.maxSpeed, 0);
        }
    }
}

function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        let pHB = player.getHitbox();
        let eHB = enemies[i].getHitbox();

        let distX = eHB.x - pHB.x;
        let distY = eHB.y - pHB.y;
        let angle = Math.atan2(distY, distX);

        enemies[i].x += 3 * Math.cos(angle) * -1;
        enemies[i].y += 3 * Math.sin(angle) * -1;
    }
}

function obstacleCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        let obst = obstacles[i];

        let pHB = player.getHitbox();
        onSideCollision(player, pHB, obst, Collision.collisionSide(pHB, obst));

        for (let j = 0; j < enemies.length; j++) {
            let eHB = enemies[j].getHitbox();
            onSideCollision(enemies[j], eHB, obst, Collision.collisionSide(eHB, obst));
        }
    }

    function onSideCollision(actor, aHB, bHB, side) {
        switch (side) {
            case 'top':
                actor.moveTo(aHB.x, bHB.y - aHB.h - 1);
                break;
            case 'bottom':
                actor.moveTo(aHB.x, bHB.y + bHB.h + 1);
                break;
            case 'left':
                actor.moveTo(bHB.x - aHB.w - 1, aHB.y);
                break;
            case 'right':
                actor.moveTo(bHB.x + bHB.w + 1, aHB.y);
                break;
        }
    }
}

function playerMapBounds() {
    let phb = player.getHitbox();
    let bndObj = Collision.outOfMap(phb, display.getDisplayArea());

    let newx = phb.x;
    let newy = phb.y;

    if (bndObj.x < 0) {
        newx = 0;
    } else if (bndObj.x > 0) {
        newx = display.getCanvasSize().w - phb.w;
    }

    if (bndObj.y < 0) {
        newy = 0;
    } else if (bndObj.y > 0) {
        newy = display.getCanvasSize().h - phb.h;
    }

    player.moveTo(newx, newy);
}

function draw() {
    display.drawRect(player.getHitbox(), PLAYER_COLOR);

    for (let i = 0; i < enemies.length; i++) {
        display.drawRect(enemies[i].getHitbox(), ENEMY_COLOR);
    }
}

document.body.onload = () => {
    display.updateSize(window.innerWidth, window.innerHeight);
    createEnemies();
    setInterval(loop, LOOP_INTERVAL);
};
document.body.onresize = () => {
    display.updateSize(window.innerWidth, window.innerHeight);
};
document.body.onkeydown = (e) => {
    switch (e.key.toUpperCase()) {
        case 'W':
            keysDown.up = true;
            break;
        case 'A':
            keysDown.left = true;
            break;
        case 'S':
            keysDown.down = true;
            break;
        case 'D':
            keysDown.right = true;
            break;
    }
};
document.body.onkeyup = (e) => {
    switch (e.key.toUpperCase()) {
        case 'W':
            keysDown.up = false;
            break;
        case 'A':
            keysDown.left = false;
            break;
        case 'S':
            keysDown.down = false;
            break;
        case 'D':
            keysDown.right = false;
            break;
    }
};
