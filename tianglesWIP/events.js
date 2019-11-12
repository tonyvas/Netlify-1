document.addEventListener("mousemove", MouseMoved);
document.addEventListener("mousedown", MouseDown);
document.addEventListener("mouseup", MouseUp);
document.addEventListener("keydown", KeyDown);
document.addEventListener("keyup", KeyUp);

let keyBinds = {
    left: "A",
    right: "D",
    up: "W",
    down: "S",
    teleport: "2",
    sprint: " ",
    pause: "ESCAPE",
    shoot: "0"
}

let keyStates = {
    isLeft: false,
    isRight: false,
    isUp: false,
    isDown: false,
    isTeleport: false,
    isSprint: false,
    isShoot: false,
    isPause: false,
}

function MouseMoved(e) {
    mouseXY.X = e.clientX;
    mouseXY.Y = e.clientY;
}

function MouseDown(e) {
    if (e.button == keyBinds.shoot) {
        keyStates.isShoot = true;
    }
    else if (e.button == keyBinds.teleport){
        keyStates.isTeleport = true;
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
    // else if (e.key.toUpperCase() == keyBinds.teleport) {
    //     keyStates.isTeleport = true;
    // }
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