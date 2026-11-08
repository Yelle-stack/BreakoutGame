class Player {
    constructor(boardWidth, boardHeight) {
        this.width = 80;
        this.height = 10;
        this.velocityX = 400;
        this.x = boardWidth / 2 - this.width / 2;
        this.y = boardHeight - this.height - 5;
    }

    // Déplacement au clavier
    move(direction, deltaTime, boardWidth) {
        let nextX = this.x + direction * this.velocityX * deltaTime;
        this.x = Math.max(0, Math.min(nextX, boardWidth - this.width));
    }

    // Déplacement à la souris ou au doigt
    moveTo(centerX, boardWidth) {
        let nextX = centerX - this.width / 2;
        this.x = Math.max(0, Math.min(nextX, boardWidth - this.width));
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
        this.baseSpeed = 250;
        this.reset(boardWidth, boardHeight, 1);
    }

    // Replace la balle au centre, avec une direction aléatoire vers le bas
    reset(boardWidth, boardHeight, speedFactor = 1) {
        this.x = boardWidth / 2 - this.width / 2;
        this.y = boardHeight / 2;
        this.speed = this.baseSpeed * speedFactor;

        let side = Math.random() < 0.5 ? -1 : 1;
        let angle = side * (10 + Math.random() * 25) * Math.PI / 180;
        this.velocityX = this.speed * Math.sin(angle);
        this.velocityY = this.speed * Math.cos(angle);
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
        this.broken = false;
    }

    draw(ctx) {
        if (this.broken) return;
        ctx.fillStyle = "skyblue";
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
        this.highScore = this.loadHighScore();
        this.lives = 3;
        this.level = 1;
        this.speedFactor = 1;

        this.gameOver = false;
        this.paused = false;
        this.waiting = true;   // la balle attend le lancement

        this.keys = { left: false, right: false };
        this.lastTime = performance.now();

        this.bounceSound = document.getElementById("bounceSound");
        this.gameOverSound = document.getElementById("gameOverSound");
        this.pauseBtn = document.getElementById("pauseBtn");

        this.createBlocks();
        this.addControls();
        requestAnimationFrame((time) => this.loop(time));
    }

    // ---------- Contrôles ----------
    addControls() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft") this.keys.left = true;
            if (e.code === "ArrowRight") this.keys.right = true;
            if (e.code === "KeyP") this.togglePause();
            if (e.code === "Space") this.action();

            // Empêche la page de défiler
            if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft") this.keys.left = false;
            if (e.code === "ArrowRight") this.keys.right = false;
        });

        // Souris et doigt
        this.board.addEventListener("pointermove", (e) => {
            let rect = this.board.getBoundingClientRect();
            let scale = this.boardWidth / this.board.clientWidth;
            let x = (e.clientX - rect.left - this.board.clientLeft) * scale;
            if (!this.paused && !this.gameOver) {
                this.player.moveTo(x, this.boardWidth);
            }
        });

        this.board.addEventListener("pointerdown", () => this.action());

        this.pauseBtn.addEventListener("click", () => {
            this.togglePause();
            this.pauseBtn.blur();   // évite que la touche Espace rappuie sur le bouton
        });
    }

    // Espace ou clic : lancer la balle, ou rejouer après une défaite
    action() {
        if (this.gameOver) this.resetGame();
        else if (this.waiting && !this.paused) this.waiting = false;
    }

    direction() {
        return (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    }

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        this.pauseBtn.textContent = this.paused ? "▶ Resume" : "⏸ Pause";
    }

    // ---------- Niveaux et blocs ----------
    createBlocks() {
        this.blocks = [];
        let startX = 15;
        let startY = 45;

        for (let c = 0; c < this.blockColumns; c++) {
            for (let r = 0; r < this.blockRows; r++) {
                this.blocks.push(new Block(startX + c * 60, startY + r * 20));
            }
        }
    }

    nextLevel() {
        this.level++;
        this.blockRows = Math.min(this.blockRows + 1, this.blockMaxRows);
        this.speedFactor = Math.min(this.speedFactor * 1.1, 2);
        this.addScore(1000);
        this.createBlocks();
        this.ball.reset(this.boardWidth, this.boardHeight, this.speedFactor);
        this.waiting = true;
    }

    // ---------- Boucle de jeu ----------
    loop(time) {
        // Limite le deltaTime (onglet en arrière-plan, premier affichage)
        let deltaTime = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        if (!this.paused && !this.gameOver) this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        this.player.move(this.direction(), deltaTime, this.boardWidth);
        if (this.waiting) return;

        this.ball.update(deltaTime);
        this.handleWallCollision();
        this.handlePlayerCollision();
        this.handleBlockCollision();
    }

    // ---------- Collisions ----------
    detectCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    handleWallCollision() {
        let ball = this.ball;

        if (ball.y <= 0) {
            ball.y = 0;
            ball.velocityY = Math.abs(ball.velocityY);
            this.playSound(this.bounceSound);
        }

        if (ball.x <= 0) {
            ball.x = 0;
            ball.velocityX = Math.abs(ball.velocityX);
            this.playSound(this.bounceSound);
        } else if (ball.x + ball.width >= this.boardWidth) {
            ball.x = this.boardWidth - ball.width;
            ball.velocityX = -Math.abs(ball.velocityX);
            this.playSound(this.bounceSound);
        }

        if (ball.y + ball.height >= this.boardHeight) this.loseLife();
    }

    handlePlayerCollision() {
        let ball = this.ball;
        let player = this.player;

        if (ball.velocityY > 0 && this.detectCollision(ball, player)) {
            // L'angle dépend de l'endroit où la balle touche la raquette
            let ballCenter = ball.x + ball.width / 2;
            let paddleCenter = player.x + player.width / 2;
            let hit = (ballCenter - paddleCenter) / (player.width / 2);
            hit = Math.max(-1, Math.min(1, hit));

            let angle = hit * 60 * Math.PI / 180;
            ball.velocityX = ball.speed * Math.sin(angle);
            ball.velocityY = -ball.speed * Math.cos(angle);
            ball.y = player.y - ball.height;

            this.playSound(this.bounceSound);
        }
    }

    handleBlockCollision() {
        for (let block of this.blocks) {
            if (!block.broken && this.detectCollision(this.ball, block)) {
                block.broken = true;
                this.ball.velocityY *= -1;
                this.addScore(100);
                this.playSound(this.bounceSound);
                break;   // un seul bloc par image
            }
        }

        if (this.blocks.every((block) => block.broken)) this.nextLevel();
    }

    loseLife() {
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver = true;
            this.playSound(this.gameOverSound);
        } else {
            this.ball.reset(this.boardWidth, this.boardHeight, this.speedFactor);
            this.waiting = true;
        }
    }

    // ---------- Score ----------
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    loadHighScore() {
        try {
            return Number(localStorage.getItem("breakoutHighScore")) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem("breakoutHighScore", this.highScore);
        } catch (e) {
            // Stockage indisponible : on ignore
        }
    }

    // ---------- Son ----------
    playSound(sound) {
        if (!sound) return;
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Son bloqué par le navigateur ou fichier absent : on ignore
        });
    }

    // ---------- Affichage ----------
    render() {
        this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);
        this.blocks.forEach((block) => block.draw(this.ctx));
        this.player.draw(this.ctx);
        this.ball.draw(this.ctx);
        this.drawUI();
    }

    drawUI() {
        let ctx = this.ctx;
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";

        ctx.textAlign = "left";
        ctx.fillText("Score: " + this.score, 10, 25);
        ctx.fillText("Level: " + this.level, 125, 25);
        ctx.fillText("High Score: " + this.highScore, 205, 25);

        ctx.textAlign = "right";
        ctx.fillText("Lives: " + this.lives, this.boardWidth - 10, 25);

        ctx.textAlign = "center";
        let centerX = this.boardWidth / 2;

        if (this.gameOver) {
            ctx.font = "30px sans-serif";
            ctx.fillText("Game Over", centerX, 250);
            ctx.font = "18px sans-serif";
            ctx.fillText("Press Space or tap to restart", centerX, 285);
        } else if (this.paused) {
            ctx.font = "30px sans-serif";
            ctx.fillText("PAUSED", centerX, 250);
        } else if (this.waiting) {
            ctx.font = "18px sans-serif";
            ctx.fillText("Press Space or tap to launch", centerX, 330);
        }

        ctx.textAlign = "left";
    }

    // ---------- Nouvelle partie ----------
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.blockRows = 3;
        this.speedFactor = 1;
        this.gameOver = false;
        this.paused = false;
        this.waiting = true;
        this.pauseBtn.textContent = "⏸ Pause";

        this.player = new Player(this.boardWidth, this.boardHeight);
        this.ball.reset(this.boardWidth, this.boardHeight, 1);
        this.createBlocks();
    }
}

window.onload = () => {
    window.game = new Game();
};
