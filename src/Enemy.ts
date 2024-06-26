import { GameObject } from "./GameObject";
import { Global } from "./Global";
import { Sprite } from "./Sprite";
import { Player } from "./Player";
import { checkCollision } from "./Utils";
import { Particle } from "./Particles";

export class Enemy extends GameObject {
  public frameWidth: number; // Width of a single frame
  public frameHeight: number; // Height of a single frame
  private totalFrames: number; // Total number of frames in the animation
  private currentFrame: number; // Index of the current frame
  private frameSpeed: number; // Speed of frame change in milliseconds
  private direction: string; // Possible values: 'right', 'left'
  private speed: number;
  private lastAnimationFrameTime: number | null;
  private player: Player;

  private sourceX: number;
  private sourceY: number;
  private enemyScale: number;

  private damage: number;

  private particles: Particle[] = [];
  private enemies: Enemy[]; // Reference to the enemies

  public health: number; // Add health property
  private damageTexts: {
    x: number;
    y: number;
    damage: number;
    alpha: number;
  }[];
  constructor(
    x: number,
    y: number,
    enemyIndex: number,
    player: Player,
    enemies: Enemy[]
  ) {
    super(x, y);
    this.frameWidth = 37;
    this.frameHeight = 30;
    this.totalFrames = 3;
    this.currentFrame = 0;
    this.frameSpeed = 150;
    this.direction = "right";
    this.lastAnimationFrameTime = null;
    this.speed = 0.02;

    this.sourceY = enemyIndex;
    this.enemyScale = 1.7; // Scale the enemy sprite

    this.player = player;

    this.damage = 10; // Damage amount

    this.particles = [];

    this.health = 20; // Set initial health
    this.damageTexts = []; // To store damage texts
    this.enemies = enemies; // Reference to the enemies
  }

  enemyUpdate(deltaTime: number, timestamp: number) {
    // Calculate the direction towards the player
    let dx = this.player.X - this.X;
    let dy = this.player.Y - this.Y;

    // Normalize the movement to ensure consistent speed in all directions
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx = (dx / length) * this.speed * deltaTime;
      dy = (dy / length) * this.speed * deltaTime;
    }

    // Update the enemy's position
    this.X += dx;
    this.Y += dy;

    // Update the direction based on movement
    if (dx < 0) {
      this.direction = "left";
    } else if (dx > 0) {
      this.direction = "right";
    }

    // Check if the enemy is close enough to damage the player
    if (checkCollision(this, this.player)) {
      this.player.takeDamage(this.damage, timestamp);
      this.generateBloodParticles(this.player.X, this.player.Y);
    }

    // Update particles
    this.particles = this.particles.filter((p) => p.isAlive());
    this.particles.forEach((p) => p.update(deltaTime));

    // Update damage texts
    this.damageTexts = this.damageTexts.filter((dt) => dt.alpha > 0);
    this.damageTexts.forEach((dt) => (dt.alpha -= deltaTime / 1000));
  }

  generateBloodParticles(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      // Generate 20 particles
      this.particles.push(new Particle(x, y));
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
    this.damageTexts.push({ x: this.X, y: this.Y, damage: amount, alpha: 1 });
    if (this.health <= 0) {
      this.health = 0;
      for (let enemy of this.enemies) {
        if (enemy === this) {
          this.enemies.splice(this.enemies.indexOf(enemy), 1);
        }
      }
    }
  }

  enemyAnimationUpdate(timestamp: number) {
    if (!this.lastAnimationFrameTime) {
      this.lastAnimationFrameTime = timestamp;
    }

    const animationDeltaTime = timestamp - this.lastAnimationFrameTime;
    if (animationDeltaTime > this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.lastAnimationFrameTime = timestamp;
    }
  }

  enemyDraw(sprite: Sprite) {
    this.sourceX = this.currentFrame * this.frameWidth;
    Global.CTX.save(); // Save the current state of the canvas

    if (this.direction === "left") {
      // Flip the sprite horizontally
      Global.CTX.scale(-1, 1);
      Global.CTX.drawImage(
        sprite.spriteSheet,
        this.sourceX,
        this.sourceY,
        this.frameWidth,
        this.frameHeight, // Source rectangle
        -(this.X + this.frameWidth / 2),
        this.Y - this.frameHeight / 2, // Destination rectangle (negated x to flip)
        this.frameWidth * this.enemyScale,
        this.frameHeight * this.enemyScale
      );
    } else {
      // Draw normally
      Global.CTX.drawImage(
        sprite.spriteSheet,
        this.sourceX,
        this.sourceY,
        this.frameWidth,
        this.frameHeight, // Source rectangle
        this.X - this.frameWidth / 2,
        this.Y - this.frameHeight / 2, // Destination rectangle
        this.frameWidth * this.enemyScale,
        this.frameHeight * this.enemyScale
      );
    }

    Global.CTX.restore(); // Restore the Global.CANVAS state

    // Draw particles
    this.particles.forEach((p) => p.draw());

    // Draw damage texts
    Global.CTX.font = "40px Arial";
    Global.CTX.fillStyle = "white";
    this.damageTexts.forEach((dt) => {
      Global.CTX.globalAlpha = dt.alpha;
      Global.CTX.fillText(dt.damage.toString(), dt.x, dt.y);
      Global.CTX.globalAlpha = 1;
    });
  }
  drawCollisionBorder() {
    Global.CTX.strokeStyle = "blue";
    Global.CTX.lineWidth = 2;
    Global.CTX.strokeRect(
      this.X - this.frameWidth / 2,
      this.Y - this.frameHeight / 2,
      this.frameWidth,
      this.frameHeight
    );
  }
}
