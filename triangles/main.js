let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let playerImg = document.getElementById('playerImage');
let mouseXY = { X: null, Y: null };
let player = new Player(playerImg, canvas.clientWidth / 2, canvas.clientHeight / 2);
let playerSpeed = { top: 10, X: 0, Y: 0 };
let isPaused = false;
let roomBounds = [];
function AddRoomBounds(x1, y1, x2, y2) {
    roomBounds[roomBounds.length] = { x1: x1, y1: y1, x2: x2, y2: y2 };
}

AddRoomBounds(0, 0, canvas.clientWidth, canvas.clientHeight);

function PauseGame() { isPaused = !isPaused; }



function GameLoop() {
    if (isPaused == false) {
        player.Move(playerSpeed.X, playerSpeed.Y);
        player.CheckBounds(roomBounds);
        Rotate();

    }

    requestAnimationFrame(GameLoop);
}

GameLoop();