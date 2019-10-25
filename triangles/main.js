let gameScreen = document.getElementById('gameArea');
let playerImg = document.getElementById('playerImage');

let mouseXY = { X: null, Y: null };
let player = new Player(playerImg, gameScreen.clientWidth / 2 + gameScreen.offsetLeft, gameScreen.clientHeight / 2 + gameScreen.offsetTop);
let playerSpeed = { top: 10, X: 0, Y: 0 };
let isPaused = false;
function PauseGame() { isPaused = !isPaused; }

function GameLoop() {
    if (isPaused == false) {
        player.MoveBy(playerSpeed.X, playerSpeed.Y);
        player.CheckBounds(gameScreen);
        Rotate();
    }

    requestAnimationFrame(GameLoop);
}

GameLoop();