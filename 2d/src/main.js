import Display from './display.js';
import Obstacle from './obstacle.js';
import Character from './character.js';
import { collisionSide, isCollision } from './Collision.js';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1000;

const display = new Display('canvas', CANVAS_WIDTH, CANVAS_HEIGHT);

const BLOCK_CONTEXT_MENU = false;
const NOCLIP = false;

const OBSTACLE_LENGTH = 100;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_AMOUNT = 100;
const MAX_OBSTACLE_ATTEMPTS = 1000;
const RANDOM_OBSTACLE_COLOR = 'green';
const OBSTACLE_BOUND_COLOR = 'grey';

const PLAYER_SIZE = 20;
const PLAYER_COLOR = 'red';
const PLAYER_TYPE = 'player';
const PLAYER_SPEED = 2;

const GAME_WIDTH = 3000;
const GAME_HEIGHT = 3000;
const CENTER_X = display.canvas.width / 2;
const CENTER_Y = display.canvas.height / 2;
const MIN_X = CENTER_X - GAME_WIDTH / 2;
const MIN_Y = CENTER_Y - GAME_HEIGHT / 2;
const MAX_X = CENTER_X + GAME_WIDTH / 2;
const MAX_Y = CENTER_Y + GAME_HEIGHT / 2;

const SPAWN_AREA_RATIO = 0.2;
const SPAWN_AREA_WIDTH = GAME_WIDTH * SPAWN_AREA_RATIO;
const SPAWN_AREA_HEIGHT = GAME_HEIGHT * SPAWN_AREA_RATIO;
const SPAWN_AREA = {
    x: CENTER_X - SPAWN_AREA_WIDTH / 2,
    y: CENTER_Y - SPAWN_AREA_HEIGHT / 2,
    w: SPAWN_AREA_WIDTH,
    h: SPAWN_AREA_HEIGHT
};

const W = 87;
const A = 65;
const S = 83;
const D = 68;
const mBtns = {
    0: false, // left
    2: false // right
};
const kbBtns = {
    87: false, // w
    65: false, // a
    83: false, // s
    68: false, // d
    17: false, // control
    16: false, // shift
    18: false, // alt
    32: false // space
};

const obstacles = [];
const player = new Character(
    CENTER_X - PLAYER_SIZE / 2,
    CENTER_Y - PLAYER_SIZE / 2,
    PLAYER_SIZE,
    PLAYER_SIZE,
    PLAYER_COLOR,
    PLAYER_TYPE
);

let prevLoopEntryDate = null;
const FPS_ITER_AMOUNT = 100;
const FPS_ITER_ARRAY = [];
const FPS_FONT_SIZE = 80;
const FPS_TEXT_X = 80;
const FPS_TEXT_Y = 80;
const FPS_TEXT_COLOR = 'red';

setupEventListeners();
function setupEventListeners() {
    // document.getElementById('canvas_zoom_in').onclick = () => {
    //     display.canvas.width *= 1.1;
    //     display.canvas.height *= 1.1;
    // };
    // document.getElementById('canvas_zoom_out').onclick = () => {
    //     display.canvas.width /= 1.1;
    //     display.canvas.height /= 1.1;
    // };
    // document.getElementById('canvas_zoom_reset').onclick = () => {
    //     display.canvas.width = CANVAS_WIDTH;
    //     display.canvas.height = CANVAS_HEIGHT;
    // }
    document.body.onload = () => {
        createObstacles();
        loop();
    };
    document.body.onresize = () => {
        display.updateCanvasSize();
    };
    document.onmousemove = (e) => {
        display.onMouseMove(e);
    };
    document.body.oncontextmenu = () => {
        return !BLOCK_CONTEXT_MENU;
    };
    document.onkeydown = (e) => {
        let code = e.keyCode;
        if (kbBtns[code] != undefined) kbBtns[code] = true;
    };
    document.onkeyup = (e) => {
        let code = e.keyCode;
        if (kbBtns[code] != undefined) kbBtns[code] = false;
    };
    document.onmousedown = (e) => {
        let code = e.button;
        if (mBtns[code] != undefined) mBtns[code] = true;
    };
    document.onmouseup = (e) => {
        let code = e.button;
        if (mBtns[code] != undefined) mBtns[code] = false;
    };
}

function createObstacles() {
    createBoundWalls();
    createRandomObstacles();

    function createBoundWalls() {
        obstacles.push(new Obstacle(MIN_X, MIN_Y, GAME_WIDTH, OBSTACLE_WIDTH, OBSTACLE_BOUND_COLOR));
        obstacles.push(new Obstacle(MIN_X, MAX_Y - OBSTACLE_WIDTH, GAME_WIDTH, OBSTACLE_WIDTH, OBSTACLE_BOUND_COLOR));
        obstacles.push(new Obstacle(MIN_X, MIN_Y, OBSTACLE_WIDTH, GAME_HEIGHT, OBSTACLE_BOUND_COLOR));
        obstacles.push(new Obstacle(MAX_X - OBSTACLE_WIDTH, MIN_Y, OBSTACLE_WIDTH, GAME_HEIGHT, OBSTACLE_BOUND_COLOR));
    }

    function createRandomObstacles() {
        let attempt = 0;
        for (let i = 0; i < OBSTACLE_AMOUNT; ) {
            attempt++;
            if (attempt > MAX_OBSTACLE_ATTEMPTS) return;

            let x = randomBetween(MIN_X, MAX_X);
            let y = randomBetween(MIN_Y, MAX_Y);

            let obstacle;
            switch (Math.floor(Math.random() * 2)) {
                case 0:
                    obstacle = new Obstacle(x, y, OBSTACLE_LENGTH, OBSTACLE_WIDTH, RANDOM_OBSTACLE_COLOR);
                    break;
                case 1:
                    obstacle = new Obstacle(x, y, OBSTACLE_WIDTH, OBSTACLE_LENGTH, RANDOM_OBSTACLE_COLOR);
                    break;
            }

            if (!isObstacleInSpawnArea(obstacle) && isObstacleWithinGameArea(obstacle)) {
                obstacles.push(obstacle);
                i++;
            }
        }

        function isObstacleInSpawnArea(obst) {
            return isCollision(SPAWN_AREA, obst);
        }

        function isObstacleWithinGameArea(obst) {
            return (
                obst.x > MIN_X + OBSTACLE_WIDTH &&
                obst.y > MIN_Y + OBSTACLE_WIDTH &&
                obst.x + obst.w < MAX_X - OBSTACLE_WIDTH &&
                obst.y + obst.h < MAX_Y - OBSTACLE_WIDTH
            );
        }
    }
}

function loop() {
    draw();
    move();
    doFPS();

    requestAnimationFrame(loop);

    function doFPS() {
        let diff = calculateDiff();
        if (diff == null) return;
        FPS_ITER_ARRAY.push(diff);
        if (FPS_ITER_ARRAY.length > FPS_ITER_AMOUNT) FPS_ITER_ARRAY.splice(0, 1);
        outputFPS(Math.round(calculateFPS()));

        function outputFPS(num) {
            display.fillText(num, FPS_TEXT_X, FPS_TEXT_Y, FPS_FONT_SIZE, FPS_TEXT_COLOR);
        }

        function calculateFPS() {
            let sum = 0;
            for (let i = 0; i < FPS_ITER_ARRAY.length; i++) sum += FPS_ITER_ARRAY[i];
            let avg = sum / FPS_ITER_ARRAY.length;
            return 1000 / avg;
        }

        function calculateDiff() {
            let diff = null;
            let now = Date.now();
            if (prevLoopEntryDate != null) diff = now - prevLoopEntryDate;
            prevLoopEntryDate = now;
            return diff;
        }
    }

    function move() {
        let speed = getPlayerSpeed();
        if (speed.x != 0 || speed.y != 0) {
            let canmove = canPlayerMove(speed.x, speed.y);

            if (canmove.x || NOCLIP) {
                for (let i = 0; i < obstacles.length; i++) {
                    obstacles[i].x += speed.x;
                }
                SPAWN_AREA.x += speed.x;
            }

            if (canmove.y || NOCLIP) {
                for (let i = 0; i < obstacles.length; i++) {
                    obstacles[i].y += speed.y;
                }
                SPAWN_AREA.y += speed.y;
            }
        }

        function canPlayerMove(x, y) {
            let canmoveHoriz = true;
            let canmoveVert = true;

            for (let i = 0; i < obstacles.length; i++) {
                let obstPosNewHoriz = {
                    x: obstacles[i].x + x,
                    y: obstacles[i].y,
                    w: obstacles[i].w,
                    h: obstacles[i].h
                };
                let obstPosNewVert = { x: obstacles[i].x, y: obstacles[i].y + y, w: obstacles[i].w, h: obstacles[i].h };

                if (isCollision(player.getPos(), obstPosNewHoriz)) {
                    canmoveHoriz = false;
                }
                if (isCollision(player.getPos(), obstPosNewVert)) {
                    canmoveVert = false;
                }
            }

            return { x: canmoveHoriz, y: canmoveVert };
        }

        function getPlayerSpeed() {
            let x = 0;
            let y = 0;

            if (kbBtns[W] != kbBtns[S]) {
                if (kbBtns[W]) {
                    y = PLAYER_SPEED;
                } else {
                    y = -PLAYER_SPEED;
                }
            }

            if (kbBtns[A] != kbBtns[D]) {
                if (kbBtns[A]) {
                    x = PLAYER_SPEED;
                } else {
                    x = -PLAYER_SPEED;
                }
            }

            return { x: x, y: y };
        }
    }

    function draw() {
        display.clear();

        drawMouseClick();
        drawObstacles();
        drawPlayer();
        drawSpawnArea();
        drawBorder();
        drawCrosshair();

        function drawCrosshair() {
            display.fillRect({ x: display.canvas.width / 2, y: 0, w: 1, h: display.canvas.height }, 'black');
            display.fillRect({ x: 0, y: display.canvas.height / 2, w: display.canvas.width, h: 1 }, 'black');
        }

        function drawMouseClick() {
            if (mBtns[0]) {
                let xy = display.getMousePosOnCanvas();
                if (xy != null) {
                    display.fillCircle({ x: xy.x, y: xy.y }, 5, 'red');
                }
            }
        }

        function drawObstacles() {
            for (let i = 0; i < obstacles.length; i++) {
                display.fillRect(obstacles[i].getPos(), obstacles[i].color);
            }
        }

        function drawPlayer() {
            display.fillRect(player.getPos(), player.color);
        }

        function drawSpawnArea() {
            display.outlineRect(SPAWN_AREA, 'blue', 3);
        }

        function drawBorder() {
            display.outlineRect({ x: 0, y: 0, w: display.canvas.width, h: display.canvas.height }, 'red', 3);
        }
    }
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
