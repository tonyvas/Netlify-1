let canvas;

function main(){
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                               ---//-START OF MAIN CODE-//---                                               //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let isPaused = false;
    canvas = document.getElementById('canv');
    canvas.width = document.getElementById('gameScreen').clientWidth;
    canvas.height = document.getElementById('gameScreen').clientHeight;
    let context = canvas.getContext('2d');
    let mouseXY = {X: 0, Y: 0};
    let pos = 0;
    
    let keyBinds = {
        left: "A",
        right: "D",
        up: "W",
        down: "S",
        sprint: " ",
        pause: "ESCAPE",
        shoot: "0"
    }

    let keyStates = {
        isLeft: false,
        isRight: false,
        isUp: false,
        isDown: false,
        isSprint: false,
        isShoot: false,
        isPause: false,
    }

    let i = 0;

    function gameLoop(){
        if (keyStates.isPause){
            keyStates.isPause = false;
            pauseGame();
        }
        
        if (isPaused == false){
            drawStuff();
            moveStuff();
        }

        if (i >= 360)
            i = 0;
        else
            i+= 0.1;
        context.rotate(Math.PI / 180 * i);
        context.fillStyle='black';
        context.strokeRect(100, 100, 100, 100);
        context.restore();
        console.log(i);

        requestAnimationFrame(gameLoop);
    }

    function drawStuff(){
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle='black';
        context.beginPath();
        context.arc(pos, canvas.height / 2, 10, 0, Math.PI * 2, false);
        context.stroke();
    }

    function moveStuff(){
        pos+= 5;
        if (pos + 10 > canvas.width)
            pos = 0;
    }

    function pauseGame(){
        isPaused = !isPaused;
    }



    gameLoop();
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                              ---//-START OF EVENT STUFF-//---                                              //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    document.addEventListener("mousemove", MouseMoved);
    document.addEventListener("mousedown", MouseDown);
    document.addEventListener("mouseup", MouseUp);
    document.addEventListener("keydown", KeyDown);
    document.addEventListener("keyup", KeyUp);

    function MouseMoved(e) {
        mouseXY.X = e.clientX;
        mouseXY.Y = e.clientY;
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
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                              ---//-START OF CLASS STUFF-//---                                              //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}