let canvas;
let context

function main(){
    try {
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //                                               ---//-START OF MAIN CODE-//---                                               //
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        canvas = document.getElementById('canv');
        canvas.width = document.getElementById('gameScreen').clientWidth;
        canvas.height = document.getElementById('gameScreen').clientHeight;
        context = canvas.getContext('2d');

        let isPaused = false;
        function pauseGame(){isPaused = !isPaused;}

        let mouseXY = {X: 0, Y: 0};
        let keyBinds = {left: "A",right: "D",up: "W",down: "S",sprint: " ",pause: "ESCAPE",shoot: "0"};
        let keyStates = {isLeft: false,isRight: false,isUp: false,isDown: false,isSprint: false,isShoot: false,isPause: false};

        let player;
        let enemies;
        let bullets;
        let test = {
            center:{x:100,y:100},
            hitbox:{w:75,h:45},
            points:[
                {x:-30,y:-22.5},
                {x:15,y:-22.5},
                {x:30,y:-15},
                {x:15,y:-7.5},
                {x:45,y:0},
                {x:15,y:7.5},
                {x:30,y:15},
                {x:15,y:22.5},
                {x:-30,y:22.5},
                {x:-15,y:15},
                {x:-20,y:3},
                {x:-20,y:-3},
                {x:-15,y:-15}
            ]
        };
        let testdeg = 0;
        let testcol = "red";

        setInterval(() => {
            testcol = 
                "rgb(" + Math.floor(Math.random() * 255) + 
                "," + Math.floor(Math.random() * 255) + 
                "," + Math.floor(Math.random() * 255) + 
                ")";
        }, 200);

        setupGame();
        function setupGame(){
            gameLoop();
        }

        function gameLoop(){
            if (keyStates.isPause){
                keyStates.isPause = false;
                pauseGame();
            }
        
            if (isPaused == false){
                drawStuff();
                moveStuff();
            }

            requestAnimationFrame(gameLoop);
        }

        function drawStuff(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawShape(test, testdeg, testcol, true);
        }

        function moveStuff(){
            if (keyStates.isLeft)
                test.center.x -= 15;
            if (keyStates.isRight)
                test.center.x += 15;
            if (keyStates.isUp)
                test.center.y -= 15;
            if (keyStates.isDown)
                test.center.y += 15;
            if (keyStates.isShoot){
                test.center.x = mouseXY.X - canvas.offsetLeft;
                test.center.y = mouseXY.Y - canvas.offsetTop;
            }

            if (test.center.x - test.hitbox.w / 2 <= 0)
                test.center.x = test.hitbox.w / 2;
            else if (test.center.x + test.hitbox.w / 2 >= canvas.width)
                test.center.x = canvas.width - test.hitbox.w / 2;
            if (test.center.y - test.hitbox.h / 2 <= 0)
                test.center.y = test.hitbox.h / 2;
            else if (test.center.y + test.hitbox.h / 2 >= canvas.height)
                test.center.y = canvas.height - test.hitbox.h / 2;

            let diffX = test.center.x - mouseXY.X + canvas.offsetLeft;
            let diffY = test.center.y - mouseXY.Y + canvas.offsetTop;
            let tan = diffY / diffX;
            testdeg = Math.atan(tan) * 180 / Math.PI;
            
            if (diffY >= 0 && diffX >= 0)
                testdeg += 180;
            else if (diffY <= 0 && diffX >= 0)
                testdeg -= 180;
        }

        function drawShape(coords, deg, color, isFill){
            context.save();
            context.translate(coords.center.x, coords.center.y);
            context.rotate(Math.PI / 180 * deg);
            context.translate(-coords.center.x, -coords.center.y);
            context.fillStyle = color;
            
            context.beginPath();
            for (let i = 0; i < coords.points.length; i++) {
                if (i == 0)
                    context.moveTo(coords.center.x + coords.points[i].x, coords.center.y + coords.points[i].y);
                else
                    context.lineTo(coords.center.x + coords.points[i].x, coords.center.y + coords.points[i].y);
            }
            context.closePath();

            if(isFill)
                context.fill()
            else
                context.stroke();

            context.restore();
        }
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
    } catch (error) {
        alert("error: \n" + error)
    }
}