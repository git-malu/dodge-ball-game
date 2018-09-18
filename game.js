var game = function () {
    // singleton
    const keyboard = {
        rightPressed: false,
        leftPressed: false,
        upPressed: false,
        downPressed: false,
        keyDownHandler: function (event) {
            if (event.which === 68) {
                this.rightPressed = true;
            }
            else if (event.which === 65) {
                this.leftPressed = true;
            }
            if (event.which === 83) {
                this.downPressed = true;
            }
            else if (event.which === 87) {
                this.upPressed = true;
            }
        },

        keyUpHandler: function (event) {
            if (event.which === 68) {
                this.rightPressed = false;
            }
            else if (event.which === 65) {
                this.leftPressed = false;
            }
            if (event.which === 83) {
                this.downPressed = false;
            }
            else if (event.which === 87) {
                this.upPressed = false;
            }
        }
    };

    const mouse = {
        x: 0,
        y: 0,
        mouseMoveHandler : function (event) {
            var rect = event.target.getBoundingClientRect();
            this.x = event.clientX - rect.x;
            this.y = event.clientY - rect.y;
        }
    };

    const playground = {
        x : 0,
        y : 0,
        midY : 0,
        init : function(x, y) {
            this.x = x;
            this.y = y;
            this.midY = y / 2;
        },
        drawBoundary(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(this.x, 0);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(0, this.y);
            ctx.closePath();
            ctx.moveTo(0, this.midY);
            ctx.lineTo(this.x, this.midY);
            ctx.stroke();
            ctx.restore();
        }

    };

    const ballList = [];
    const playerList = [];

    function setDifficulty(difficulty, ctx) {
        let findRobot;
        for (let i = 0; i < playerList.length; i++) {
            if (playerList[i] instanceof Robot) {
                findRobot = playerList[i];
            }
        }
        if (findRobot) {
            findRobot.setDifficulty(difficulty, ctx);
        }
        if (difficulty === "easy") {
            playground.midY = ctx.canvas.height / 2;
        } else if (difficulty === "hard") {
            playground.midY = ctx.canvas.height * 2 / 3;
        }
    }


    class MovingObject {

        constructor () {
            this.x = 100;
            this.y = 100;
            this.vx = 5;
            this.vy = 2;
            this.radius = 25;
            this.color = 'blue';
        }

        moveByInertia() {
            this.x += this.vx;
            this.y += this.vy;
        }


    }

    class FlyingBall extends MovingObject {
        constructor (shooter, targetLoc) {
            super();
            if (arguments.length) {
                this.init(shooter, targetLoc);
            }
        }

        init(shooter, targetLoc) {
            let dx = targetLoc.x - shooter.x,
                dy = targetLoc.y - shooter.y;
            let dist = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2)); // from mouse to this ball
            let absVelocity = 8;
            let ratio = dist / absVelocity;
            this.vx = dx / ratio;
            this.vy = dy / ratio;
            this.shooter = shooter;
            this.targetLoc = targetLoc;
            let temp = (this.radius + shooter.radius) / dist * 1.3; // make sure the ball won't touch the shooter himself
            this.x = temp * dx + shooter.x; // start center point
            this.y = temp * dy + shooter.y; // start center point
        }

        hitCheck() {
            for (let i = 0; i < playerList.length; i++) {
                let dx = playerList[i].x - this.x, dy = playerList[i].y - this.y;
                let dist = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2)); // distance from each player to this ball
                if (dist < this.radius * 2) {
                    return playerList[i];
                }
            }
            return null;
        }

        bounce(ctx) {
            if (this.x + this.radius > ctx.canvas.width || this.x - this.radius < 0) {
                this.vx = -this.vx;
            }

            if (this.y + this.radius > ctx.canvas.height || this.y - this.radius < 0) {
                this.vy = -this.vy;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        drawNextFrame(ctx) {
            this.bounce(ctx);
            this.moveByInertia();
            this.draw(ctx);
        }
    }

    class Player extends MovingObject {
        constructor (startX , startY) {
            super();
            this.vx = 5;
            this.vy = 5;
            this.x = startX;
            this.y = startY;
            this.xReset = startX;
            this.yReset = startY;
            this.color = 'red';
            this.loaded = false; // ready to shoot
            playerList.push(this); // add to list
        }

        reset() {
            this.x = this.xReset;
            this.y = this.yReset;
            this.loaded = false;
        }

        startPlayer() {
            setTimeout(() => {
                this.loaded = true;
            }, 1500); // count down
        }
        moveByKeyboardInput(ctx) {
            let dx = 0, dy = 0;
            if (keyboard.rightPressed) {
                dx += this.vx
            }

            if (keyboard.leftPressed) {
                dx -= this.vx;
            }

            if (keyboard.upPressed) {
                dy -= this.vy;
            }

            if (keyboard.downPressed) {
                dy += this.vy;
            }


            var nextX = this.x + dx;
            let nextY = this.y + dy;
            if (nextX + this.radius < ctx.canvas.width && nextX - this.radius > 0) {
                this.x = nextX;
            }
            if (nextY + this.radius < ctx.canvas.height && nextY - this.radius > playground.midY) {
                this.y = nextY;
            }
        }

        draw(ctx) {

            //draw ball
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            // draw arrow
            if (this.loaded) {
                ctx.rotate(this.rotationAngle());
                ctx.beginPath();
                ctx.moveTo(0, 0); // center of ball
                ctx.lineTo(this.radius * 2, 0);
                ctx.moveTo(33, -12);
                ctx.lineTo(this.radius * 2, 0);
                ctx.lineTo(33, 12);
                ctx.stroke();
            }
            ctx.restore();
        }

        rotationAngle() {
            let dy = mouse.y - this.y;
            let dx = mouse.x - this.x;
            let angle = Math.asin(dy / Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2)));

            if (mouse.x < this.x) {
                angle = Math.PI - angle;
            }
            return angle;
        }

        drawNextFrame(ctx) {
            this.moveByKeyboardInput(ctx);
            this.draw(ctx);
        }

        shoot() {
            if (this.loaded) {
                ballList.push(new FlyingBall(this, {x : mouse.x, y : mouse.y}));
                this.loaded = false;
                setTimeout(() => {
                    this.loaded = true;
                }, 2000);
                // update metric shoot count
                var shootCount = window.localStorage.getItem("shoot-count");
                if (shootCount) {
                    shootCount = parseInt(shootCount, 10);
                } else {
                    shootCount = 0;
                }
                window.localStorage.setItem("shoot-count", ++shootCount);
                var wins = window.localStorage.getItem("wins") || 0;
                if (wins != 0 && shootCount != 0) {
                    wins = parseInt(wins, 10);
                    var accuracy = document.getElementById("accuracy");
                    accuracy.innerHTML = (wins / shootCount * 100).toFixed(2);
                }
            }
        }
    }

    class Robot extends MovingObject {
        constructor (startX, startY) {
            super();
            this.x = startX;
            this.y = startY;
            this.xReset = startX;
            this.yReset = startY;
            this.absVelocity = 6.5;
            this.vx = 0;
            this.vy = 0;
            this.destX = 0;
            this.destY = 0;
            this.color = 'red';
            this.loaded = false; // ready to shoot
            this.responseTime = 3000;
            this.started = false;
            this.interval = null; // interval 1
            this.rand = null; // interval 2
            playerList.push(this); // add to list
        }

        reset() {
            this.stopRobot();
            this.x = this.xReset;
            this.y = this.yReset;
            this.loaded = false;
        }

        stopRobot() {
            if (this.started) {
                if (this.interval) clearInterval(this.interval); // shut down interval 1
                if (this.rand) clearInterval(this.rand); // shut down interval 2
                this.started = false;
            }
        }

        startRobot(ctx) {
            if (!this.started) {
                this.startRandomDestSetter(ctx); // start interval 2
                this.interval = setInterval(() => { // start interval 1
                    this.shoot();
                }, 3000);
                this.started = true;
                setTimeout(() => {
                    this.loaded = true;
                }, 1500); // count down


                // todo
                this.x = this.xReset;
                this.y = this.yReset;



            }
        }

        startRandomDestSetter(ctx) {
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * Math.floor(max - min) + Math.floor(min));
            }

            var nextRandDest = () => {
                this.destX = getRandomInt(this.radius, ctx.canvas.width - this.radius);
                this.destY = getRandomInt(this.radius, playground.midY - this.radius);
                let dx = this.destX - this.x, dy = this.destY - this.y;
                let dist = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
                let ratio = this.absVelocity / dist;
                this.vx = ratio * dx;
                this.vy = ratio * dy;
                // console.log(this.destX + " " + this.destY + " max X: " +  (ctx.canvas.width - this.radius) + " max Y :" + (playground.midY - this.radius));
                // console.log("current position: " + this.x + " "  + this.y);
                // console.log("speed: " + this.vx + " " + this.vy);
            };

            nextRandDest(); // do it now!!!
            this.rand = setInterval(() => {
                nextRandDest();
            }, this.responseTime);

            // console.log("set interval rand: " + this.rand );
        }

        setDifficulty(difficulty, ctx) {
            if (difficulty === "easy") {
                this.responseTime = 3000;
                if (this.rand) {
                    clearInterval(this.rand);
                    this.startRandomDestSetter(ctx);
                }
            }

            if (difficulty === "hard") {
                this.responseTime = 1000;
                if (this.rand) {
                    clearInterval(this.rand);
                    this.startRandomDestSetter(ctx);
                }
            }
        }

        reachCheck() { // reach destination?
            let dx = this.destX - this.x, dy = this.destY - this.y;
            let dist = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
            if (dist < 10) {
                return true;
            }
            return false;
        }

        rotationAngle() {
            let findPlayer;
            for (let i = 0; i < playerList.length; i++) {
                if (playerList[i] instanceof Player) {
                    findPlayer = playerList[i];
                }
            }
            if (findPlayer) {
                let dy = findPlayer.y - this.y;
                let dx = findPlayer.x - this.x;
                let angle = Math.asin(dy / Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2)));

                if (findPlayer.x < this.x) {
                    angle = Math.PI - angle;
                }
                return angle;
            }
            return 0;
        }

        shoot() {
            if (this.loaded) {
                let findPlayer;
                for (let i = 0; i < playerList.length; i++) {
                    if (playerList[i] instanceof Player) {
                        findPlayer = playerList[i];
                    }
                }
                if (findPlayer) {
                    ballList.push(new FlyingBall(this, {x : findPlayer.x, y : findPlayer.y}));
                    this.loaded = false;
                    setTimeout(() => {
                        this.loaded = true;
                    }, 2000);
                }
            }
        }

        draw(ctx) {
            //draw ball
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            // draw arrow
            if (this.loaded) {
                ctx.rotate(this.rotationAngle());
                ctx.beginPath();
                ctx.moveTo(0, 0); // center of ball
                ctx.lineTo(this.radius * 2, 0);
                ctx.moveTo(33, -12);
                ctx.lineTo(this.radius * 2, 0);
                ctx.lineTo(33, 12);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawNextFrame(ctx) {
            if (!this.reachCheck()) {
                this.moveByInertia();
            }
            this.draw(ctx);
        }
    }

    return {
        FlyingBall : FlyingBall,
        Player : Player,
        Robot : Robot,
        keyboard : keyboard,
        mouse : mouse,
        ballList : ballList,
        playerList : playerList,
        playground : playground,
        setDifficulty : setDifficulty
    }
}();

