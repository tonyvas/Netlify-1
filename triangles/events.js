document.addEventListener("mousemove", MouseMoved);
document.addEventListener("mousedown", MouseDown);
document.addEventListener("mouseup", MouseUp);
document.addEventListener("keydown", KeyDown);
document.addEventListener("keyup", KeyUp);

let keyStates = {
    isL: false,
    isR: false,
    isW: false,
    isA: false,
    isS: false,
    isD: false,
    isSp: false
}

function MouseMoved(e) {
    mouseXY.X = e.clientX;
    mouseXY.Y = e.clientY;
}

function MouseDown(e) {
    if (e.button == "0") { //Left
        keyStates.isL = true;
    }
    else if (e.button == "2") { //Right
        keyStates.isR = true;
    }
}

function MouseUp(e) {
    if (e.button == "0") { //Left
        keyStates.isL = false;
    }
    else if (e.button == "2") { //Right
        keyStates.isR  = false;
    }
}

function KeyDown(e) {
    if (e.key.toUpperCase() == "W") {
        keyStates.isW = true;
    }
    else if (e.key.toUpperCase() == "A") {
        keyStates.isA = true;
    }
    else if (e.key.toUpperCase() == "S") {
        keyStates.isS = true;
    }
    else if (e.key.toUpperCase() == "D") {
        keyStates.isD = true;
    }
    else if (e.key.toUpperCase() == " ") {
        keyStates.isSp = true;
    }
    else if (e.key.toUpperCase() == "ESCAPE") {
        PauseGame();
    }

    CalculateSpeed();
}

function KeyUp(e) {
    if (e.key.toUpperCase() == "W") {
        keyStates.isW = false;
    }
    else if (e.key.toUpperCase() == "A") {
        keyStates.isA = false;
    }
    else if (e.key.toUpperCase() == "S") {
        keyStates.isS = false;
    }
    else if (e.key.toUpperCase() == "D") {
        keyStates.isD = false;
    }
    else if (e.key.toUpperCase() == " ") {
        keyStates.isSp = false;
    }

    CalculateSpeed();
}

function CalculateSpeed() {
    let topSpeed;

    if (keyStates.isSp)
        topSpeed = playerSpeed.top * 2;
    else
        topSpeed = playerSpeed.top;

    if (keyStates.isA == keyStates.isD)
        playerSpeed.X = 0;
    else if (keyStates.isA)
        playerSpeed.X = topSpeed * -1;
    else if (keyStates.isD)
        playerSpeed.X = topSpeed;

    if (keyStates.isW == keyStates.isS)
        playerSpeed.Y = 0;
    else if (keyStates.isW)
        playerSpeed.Y = topSpeed * -1;
    else if (keyStates.isS)
        playerSpeed.Y = topSpeed;
}

function Rotate() {
    let imgXY = { X: playerImg.offsetLeft + playerImg.width / 2, Y: playerImg.offsetTop + playerImg.height / 2 };
    let diffX = imgXY.X - mouseXY.X;
    let diffY = imgXY.Y - mouseXY.Y;
    let tan = diffY / diffX;

    let atan = Math.atan(tan) * 180 / Math.PI;;
    if (diffY >= 0 && diffX >= 0) {

        atan += 180;
    }
    else if (diffY <= 0 && diffX >= 0) {

        atan -= 180;
    }

    playerImg.style.transform = 'rotate(' + atan + 'deg)';
}