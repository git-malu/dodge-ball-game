var canvas = document.getElementById('the-canvas');
var ctx = canvas.getContext('2d');
var playground = game.playground;

canvas.width = 550;
canvas.height = window.innerHeight;
var player = new game.Player(canvas.width / 2, canvas.height * 3 / 4);
var robot = new game.Robot(canvas.width / 2, canvas.height / 4);
var storage = window.localStorage;

playground.init(canvas.width, canvas.height);
canvas.addEventListener('mousemove', game.mouse.mouseMoveHandler.bind(game.mouse));
canvas.addEventListener('click', player.shoot.bind(player));
document.addEventListener('keydown', game.keyboard.keyDownHandler.bind(game.keyboard));
document.addEventListener('keyup', game.keyboard.keyUpHandler.bind(game.keyboard));
var winsInfo = document.getElementById("wins");
var lossesInfo = document.getElementById("losses");
var startBtn = document.getElementById("start-button");
var difficulty = document.getElementById("difficulty");
var easyBtn = document.getElementById("easy-button");
var hardBtn = document.getElementById("hard-button");
// var stopBtn = document.getElementById("stop-button");

startBtn.addEventListener('click', () => {
    if (startBtn.innerHTML === "Start Game") {
        gameRestart(0); // immediately
        startBtn.innerHTML = "Stop";
    } else if (startBtn.innerHTML === "Stop") {
        gameStop = true;
        startBtn.innerHTML = "Start Game";
    }
});

easyBtn.addEventListener('click', () => {
    game.setDifficulty("easy", ctx);
    difficulty.innerHTML = "Easy";
});

hardBtn.addEventListener('click', () => {
    game.setDifficulty("hard", ctx);
    difficulty.innerHTML = "hard";
});

// stopBtn.addEventListener('click', () => {
//     robot.reset();
//     player.reset();
//     gameStop = true;
// });

var raf;
var gameStop = false;
updateScore(); // init
updateAccuracy();
playground.drawBoundary(ctx);

// raf = window.requestAnimationFrame(drawCanvasFrame);

function drawCanvasFrame() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    playground.drawBoundary(ctx);
    player.drawNextFrame(ctx);
    robot.drawNextFrame(ctx);
    let over = game.ballList.some((eachBall) => {
        let res = eachBall.hitCheck();
        if (res && res instanceof game.Robot) {
            printText("YOU WIN");
            updateScore("win");
            updateAccuracy();
            return true;
        } else if (res && res instanceof game.Player) {
            printText("YOU LOSE");
            updateScore("loss");
            return true;
        }
        eachBall.drawNextFrame(ctx);
    });

    if (over) {
        gameRestart(2000); // restart in 2 seconds
        return;
    } else if (gameStop) {
        window.cancelAnimationFrame(raf);
        return;
    } else {
        raf = window.requestAnimationFrame(drawCanvasFrame);
    }
}


function updateScore(option) {
    let wins = storage.getItem("wins");
    let losses = storage.getItem("losses");
    if (!wins) { // init
        storage.setItem("wins", '0');
        wins = '0';
    }
    if (!losses) { // init
        storage.setItem("losses", '0');
        losses = '0';
    }
    wins = parseInt(wins, 10);
    losses = parseInt(losses, 10);

    if (option === "win") {
        storage.setItem("wins", wins + 1);
        winsInfo.innerHTML = wins + 1;
    } else if (option === "loss") {
        storage.setItem("losses", losses + 1);
        lossesInfo.innerHTML = losses + 1;
    } else {
        winsInfo.innerHTML = wins;
        lossesInfo.innerHTML = losses;
    }
}

function printText(text) { // print text to canvas
    ctx.font = '48px serif'; ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function gameRestart(time) { // game over, and another round
    gameStop = false; // reset to false
    robot.reset(); // random setter using reset point immediately
    player.reset();
    // window.cancelAnimationFrame(raf);
    setTimeout(() => {
        game.ballList.length = 0;
        robot.startRobot(ctx);
        player.startPlayer();
        raf = window.requestAnimationFrame(drawCanvasFrame);
    }, time);
}

function updateAccuracy() {
    // update metric shoot count
    var shootCount = window.localStorage.getItem("shoot-count");
    if (shootCount) {
        shootCount = parseInt(shootCount, 10);
    } else {
        shootCount = 0;
    }
    window.localStorage.setItem("shoot-count", shootCount); // no need for plus 1
    var wins = window.localStorage.getItem("wins") || 0;
    if (wins != 0 && shootCount != 0) {
        wins = parseInt(wins, 10);
        var accuracy = document.getElementById("accuracy");
        accuracy.innerHTML = (wins / shootCount * 100).toFixed(2);
    }
}



