let gameScreen = document.getElementById('gameArea');
let playerImg = document.getElementById('playerImage');

const ENEMY_AMOUNT = 10;
let mouseXY = { X: null, Y: null };
let player = new Player(playerImg, gameScreen.clientWidth / 2 + gameScreen.offsetLeft, gameScreen.clientHeight / 2 + gameScreen.offsetTop);
let enemies = [];
CreateEnemies();
function CreateEnemies(){
    for(let i = 0; i < ENEMY_AMOUNT; i++)
        enemies[enemies.length] = new Enemy("imgs/enemyImage.png", gameScreen, i);
}
let playerSpeed = { top: 10, X: 0, Y: 0 };
let enemySpeed = {top: 3, X: 0, Y: 0};
let isPaused = false;
function PauseGame() { isPaused = !isPaused; }

function GameLoop() {
    if (isPaused == false) {
        RotateImg();

        player.MoveBy(playerSpeed.X, playerSpeed.Y);
        
        CheckPlayerBounds();

        CheckPlayerEnemyCollision();

        MoveEnemyTowardsPlayer();
    }

    requestAnimationFrame(GameLoop);
}

function CheckPlayerBounds(){
    let playerPos = player.GetPos();
    let targetPos = {X: playerPos.X1, Y: playerPos.Y1};

    if (playerPos.X1 <= gameScreen.offsetLeft)
        targetPos.X = gameScreen.offsetLeft;
        
    if (playerPos.X2 >= (gameScreen.offsetLeft + gameScreen.clientWidth))
        targetPos.X = gameScreen.offsetLeft + gameScreen.clientWidth - (playerPos.X2 - playerPos.X1);

    if (playerPos.Y1 <= gameScreen.offsetTop)
        targetPos.Y = gameScreen.offsetTop;

    if (playerPos.Y2 >= (gameScreen.offsetTop + gameScreen.clientHeight))
        targetPos.Y = gameScreen.offsetTop + gameScreen.clientHeight - (playerPos.Y2 - playerPos.Y1);

    player.MoveTo(targetPos.X, targetPos.Y);
}

function CheckPlayerEnemyCollision(){
    let playerPos = player.GetPos();
    let enemyPos;

    enemies.forEach(currEnemy => {
        enemyPos = currEnemy.GetPos();

        if (playerPos.X1 < enemyPos.X2 && playerPos.X2 > enemyPos.X1 && playerPos.Y1 < enemyPos.Y2 && playerPos.Y2 > enemyPos.Y1)
            console.log("Collision");
    });
}

function MoveEnemyTowardsPlayer(){
    let playerPos = player.GetPos();
    let enemyPos;

    enemies.forEach(currEnemy => {
        if (CheckEnemyEnemyCollision(currEnemy)) {
            enemyPos = currEnemy.GetPos();

            if (playerPos.X1 < enemyPos.X1)
                enemySpeed.X = enemySpeed.top * -1;
            else if (playerPos.X1 > enemyPos.X1)
                enemySpeed.X = enemySpeed.top;
            else
                enemySpeed.X = 0;
        
            if (playerPos.Y1 < enemyPos.Y1)
                enemySpeed.Y = enemySpeed.top * -1;
            else if (playerPos.Y1 > enemyPos.Y1)
                enemySpeed.Y = enemySpeed.top;
            else
                enemySpeed.Y = 0;

            currEnemy.MoveBy(enemySpeed.X, enemySpeed.Y);
        }
    });
}

function CheckEnemyEnemyCollision(enem){
    let currEnemyPos = enem.GetPos();
    let playerPos = player.GetPos();
    let closestEnemy = enem;

    enemies.forEach(checkEnemy =>{
        let checkEnemyPos = checkEnemy.GetPos();
        if (enem.GetId() != checkEnemy.GetId())
            if (currEnemyPos.X1 < checkEnemyPos.X2 && currEnemyPos.X2 > checkEnemyPos.X1 && currEnemyPos.Y1 < checkEnemyPos.Y2 && currEnemyPos.Y2 > checkEnemyPos.Y1)
                if ((Math.abs(currEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(currEnemyPos.Y1 - playerPos.Y1) ^ 2) > (Math.abs(checkEnemyPos.X1 - playerPos.X1) ^ 2) + (Math.abs(checkEnemyPos.Y1 - playerPos.Y1) ^ 2))
                    closestEnemy = checkEnemy;
    });

    if (closestEnemy == enem)
        return true;
    else
        return false;
}

GameLoop();