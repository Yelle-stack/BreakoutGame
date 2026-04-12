class Player {
    constructor(boardWidth, boardHeight) {
        this.width = 80;
        this.height = 10;
        this.velocityX = 400;
        this.x = boardWidth / 2 - this.width / 2;
        this.y = boardHeight - this.height - 5;
    }

    move(direction, deltaTime, boardWidth) {
        let nextX = this.x + direction * this.velocityX * deltaTime;

        if (nextX >= 0 && nextX + this.width <= boardWidth) {
            this.x = nextX;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    }

class Ball {
    constructor(boardWidth, boardHeight) {
        this.width = 10;
        this.height = 10;
        this.reset(boardWidth, boardHeight);
    }

    reset(boardWidth, boardHeight) {
        this.x = boardWidth / 2;
        this.y = boardHeight / 2;
        this.velocityX = 200;
        this.velocityY = 150;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
    }
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Block {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 10;
        this.break = false;
    }

    draw(ctx) {
        if (!this.break) {
            ctx.fillStyle = "skyblue";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
class Game {
    constructor() {
        this.board = document.getElementById("board");
        this.ctx = this.board.getContext("2d");

        this.boardWidth = 500;
        this.boardHeight = 500;

        this.board.width = this.boardWidth;
        this.board.height = this.boardHeight;

        this.player = new Player(this.boardWidth, this.boardHeight);
        this.ball = new Ball(this.boardWidth, this.boardHeight);

        this.blocks = [];
        this.blockRows = 3;
        this.blockColumns = 8;
        this.blockMaxRows = 10;
        this.score = 0;
        this.lives = 3;

        this.gameOver = false;
        this.paused = false;

        this.lastTime = 0;
        this.direction = 0;

        this.createBlocks();
        this.addControls();

        requestAnimationFrame((time) => this.update(time));
    }
     addControls() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft") this.direction = -1;
            if (e.code === "ArrowRight") this.direction = 1;

            if (e.code === "KeyP") {
                this.paused = !this.paused;
            }

            if (this.gameOver && e.code === "Space") {
                this.resetGame();
            }
        });

        document.addEventListener("keyup", () => {
            this.direction = 0;
        });
    }
    createBlocks() {
        this.blocks = [];

        let startX = 15;
        let startY = 45;

        for (let c = 0; c < this.blockColumns; c++) {
            for (let r = 0; r < this.blockRows; r++) {
                let x = startX + c * 60;
                let y = startY + r * 20;
                this.blocks.push(new Block(x, y));
            }
        }
    }
    detectCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
     update(time) {
        let deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        requestAnimationFrame((t) => this.update(t));

        if (this.paused || this.gameOver) return;

        this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

        this.player.move(this.direction, deltaTime, this.boardWidth);
        this.player.draw(this.ctx);

        this.ball.update(deltaTime);
        this.ball.draw(this.ctx);

        this.handleWallCollision();
        this.handlePlayerCollision();
        this.handleBlockCollision();

        this.drawUI();
    }
    handleWallCollision() {
        if (this.ball.y <= 0) {
            this.ball.velocityY *= -1;
        }

        if (
            this.ball.x <= 0 ||
            this.ball.x + this.ball.width >= this.boardWidth
        ) {
            this.ball.velocityX *= -1;
        }

        if (this.ball.y + this.ball.height >= this.boardHeight) {
            this.lives--;

            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.ball.reset(this.boardWidth, this.boardHeight);
            }
        }
    }
     handlePlayerCollision() {
        if (this.detectCollision(this.ball, this.player)) {
            this.ball.velocityY = -Math.abs(this.ball.velocityY);
        }
    }

    handleBlockCollision() {
        let remaining = 0;

        for (let block of this.blocks) {
            if (!block.break) {
                if (this.detectCollision(this.ball, block)) {
                    block.break = true;
                    this.ball.velocityY *= -1;
                    this.score += 100;
                } else {
                    remaining++;
                }

                block.draw(this.ctx);
            }
        }
         if (remaining === 0) {
            this.blockRows = Math.min(
                this.blockRows + 1,
                this.blockMaxRows
            );

            this.score += 1000;
            this.createBlocks();
        }
    }

    drawUI() {
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px sans-serif";

        this.ctx.fillText("Score: " + this.score, 10, 25);
        this.ctx.fillText("Lives: " + this.lives, 400, 25);

        if (this.paused) {
            this.ctx.fillText("PAUSED", 220, 250);
        }
         if (this.gameOver) {
            this.ctx.fillText(
                "Game Over — Press Space",
                140,
                250
            );
        }
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.blockRows = 3;
        this.gameOver = false;

        this.player = new Player(
            this.boardWidth,
            this.boardHeight
        );

        this.ball.reset(
            this.boardWidth,
            this.boardHeight
        );
                this.createBlocks();
    }
}

// Lancer le jeu quand la page est chargée
window.onload = () => {
    new Game();
};      