let canvas;
let context;

let isDebug = false;
let isPaused = false;
let isLooping = false;
let isGameOver = false;
let isGodMode = false;
let canPlayerBeTarget = true;

let mouseXY = {x: 0,x: 0};
let keyBinds = {left: "A",right: "D",up: "W",down: "S",auto: "SHIFT",pause: "ESCAPE",shoot: "0"};
let keyStates = {isLeft: false,isRight: false,isUp: false,isDown: false,isAuto: false,isShoot: false,isPause: false};
let elementID = {gameStatsContainer: "game_stats_table",playerStatsContainer: "player_stats_table"};
let gameStats = {
    fps: {name: "FPS", val: 0, display: true},
    fpsUpdateTime: {name: "FPS Update Interv", val: 10, display: false},
    fpsUpdateSum: {name: "FPS Update Sum", val: 0, display: false},
    mousePos: {name: "Mouse Pos", val: 0, display: true},
    playerPos: {name: "Player Pos", val: 0, display: true},
    canvasSize: {name: "Canvas Size", val: 0, display: false},
    startTime: {name: "Starting Time", val: 0, display: false},
    currentTime: {name: "Current Time", val: 0, display: false},
    runTime: {name: "Run Time", val: 0, display: false},
    lastTime: {name: "Last Time", val: 0, display: false},
    game: {name: "Game Loop", val: 0, display: true},
    main: {name: "Main Loop", val: 0, display: true},
    playerIndex: {name: "Player Ind", val: 0, display: false},
    enemyIndex: {name: "Enemy Ind", val: 0, display: false},
    cargoIndex: {name: "Cargoship Ind", val: 0, display: false},
    bulletIndex: {name: "Bullet Ind", val: 0, display: false},
    particleIndex: {name: "Particle Ind", val: 0, display: false},
    particlesExist: {name: "Particles Existing", val: 0, display: true},
    enemiesExist: {name: "Enemies Existing", val: 0, display: true},
    enemiesInCombat: {name: "Enemies In Combat", val: 0, display: true}
    //add cargostuff exists in combat
};
let playerStats = {
    totalScore: {name: "Score", val: 0, display: true},
    timeScore: {name: "", val: 0, display: false},
    enemyKillScore: {name: "", val: 0, display: false},
    cargoKillScore: {name: "", val: 0, display: false},
    playerDeathScore: {name: "", val: 0, display: false},
    playerSpendScore: {name: "", val: 0, display: false},
    hp: {name: "Health", val: 0, display: true},
    mSpeed: {name: "Movement Speed", val: 0, display: true},
    bSpeed: {name: "Bullet Speed", val: 0, display: true},
    shSpeed: {name: "Shoot Speed", val: 0, display: true},
    dmg: {name: "Damage", val: 0, display: true},
    acc: {name: "Accuracy", val: 0, display: true},
    range: {name: "Range", val: 0, display: true}
}

let images = {
    playership: createImg("imgs/enemyship.png", 150, 75),
    cargoship: createImg("imgs/cargoship.png", 125, 80),
    enemyship: createImg("imgs/spaceship.png", 100, 100),
    playerbullet: createImg("imgs/bluelaser.png", 100, 30),
    enemybullet: createImg("imgs/redlaser.png", 100, 30),
    cargobullet: createImg("imgs/greenlaser.png", 100, 30),
    crosshair: createImg("imgs/crosshair.png", 50, 50)
};

function createImg(src, w, h) {
    let img = new Image();
    img.src = src;
    return {img: img,w: w,h: h};
}

let playerCfg = {
    general: {
        scale: 0.5,
        speed: 5,
        spinSpeed: 3,
        startingHP: 150,
        type: "player"
    },
    thrusterInfo: {
        colors: {
            min: {
                r: 0,
                g: 100,
                b: 200
            },
            max: {
                r: 0,
                g: 100,
                b: 255
            }
        },
        spread: Math.PI / 8,
        amnt: 50,
        speed: 6,
        time: 2,
        size: 5
    },
    weapons: {
        normal: {
            type: "playerWeapon",
            damage: 30,
            distance: 400,
            delay: 15,
            accuracy: 0.9
        },
        auto: {
            type: "playerWeaponAuto",
            damage: 15,
            distance: 300,
            delay: 30,
            accuracy: 0.9
        }
    }
};

let enemyCfg = {
    general: {
        chancePerFrame: 0.1,
        amount: 3,
        scale: 0.5,
        speed: 2,
        spinSpeed: 3,
        startingHP: 80,
        type: "enemy",
        spawnPerim: 100,
        detectionRange: 150,
        hugDist: 200,
        aimRadius: 0.2
    },
    thrusterInfo: {
        colors: {
            min: {
                r: 0,
                g: 0,
                b: 0
            },
            max: {
                r: 255,
                g: 0,
                b: 0
            }
        },
        spread: Math.PI / 8,
        amnt: 25,
        speed: 3,
        time: 3,
        size: 3
    },
    weapons: {
        normal: {
            type: "enemyWeapon",
            damage: 20,
            distance: 300,
            delay: 10,
            accuracy: 0.9
        }
    }
};

let cargoCfg = {
    general: {
        chancePerFrame: 0.01,
        amount: 2,
        scale: 0.5,
        speed: 1,
        spinSpeed: 0,
        startingHP: 300,
        type: "cargo",
        spawnPerim: 100
    },
    thrusterInfo: {
        colors: {
            min: {
                r: 0,
                g: 0,
                b: 0
            },
            max: {
                r: 0,
                g: 255,
                b: 0
            }
        },
        spread: Math.PI / 8,
        amnt: 50,
        speed: 4,
        time: 4,
        size: 4
    },
    weapons: {
        normal: {
            type: "cargoWeapon",
            damage: 40,
            distance: 500,
            delay: 30,
            accuracy: 0.9
        }
    }
};

let bulletCfg = {
    scale: 0.1,
    speed: 10,
    type: "bullet"
};

let scoreCfg = {
    start: 0,
    enemKill: 100,
    cargoKill: 300,
    playerKill: -300,
    perSec: 5
};

let player;
let weapons;
let enemies = [];
let cargoships = [];
let bullets = [];
let particles = [];