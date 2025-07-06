import { Scene } from 'phaser'

export class Game extends Scene {
    private player!: Phaser.GameObjects.Triangle
    private center!: Phaser.Geom.Point
    private walls!: Phaser.GameObjects.Group
    private score = 0
    private scoreText!: Phaser.GameObjects.Text
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private keyZ!: Phaser.Input.Keyboard.Key
    private keyM!: Phaser.Input.Keyboard.Key
    private playerAngle = 0
    private playerDistance = 50

    constructor() {
        super('Game')
    }

    create() {
        this.center = new Phaser.Geom.Point(this.scale.width / 2, this.scale.height / 2)
        const hexagon = this.add.graphics()
        hexagon.lineStyle(4, 0xffffff) // White border with 4px thickness
        hexagon.strokePoints(
            new Phaser.Geom.Polygon([
                new Phaser.Geom.Point(this.center.x, this.center.y - 40),
                new Phaser.Geom.Point(this.center.x + 35, this.center.y - 20),
                new Phaser.Geom.Point(this.center.x + 35, this.center.y + 20),
                new Phaser.Geom.Point(this.center.x, this.center.y + 40),
                new Phaser.Geom.Point(this.center.x - 35, this.center.y + 20),
                new Phaser.Geom.Point(this.center.x - 35, this.center.y - 20)
            ]).points,
            true
        )

        this.player = this.add.triangle(0, 0, 0, 0, 10, 10, 5, -5, 0xffffff).setOrigin(0.5, 1)

        this.updatePlayerPosition()

        this.walls = this.add.group()

        this.time.addEvent({
            delay: 2000,
            callback: this.spawnWalls,
            callbackScope: this,
            loop: true
        })

        this.physics.add.collider(this.player, this.walls, () => {
            this.scene.start('Menu')
        })

        this.scoreText = this.add
            .text(this.center.x, 20, 'Score: 0', {
                fontSize: '32px',
                color: '#fff'
            })
            .setOrigin(0.5, 0)

        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyZ = this.input.keyboard!.addKey('Z')
        this.keyM = this.input.keyboard!.addKey('M')
    }

    update(_time: number, delta: number) {
        this.score += delta / 1000
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`)
        if (this.cursors.left.isDown || this.keyZ.isDown) {
            this.playerAngle -= 0.3
        } else if (this.cursors.right.isDown || this.keyM.isDown) {
            this.playerAngle += 0.3
        }
        this.updatePlayerPosition()
        this.walls.getChildren().forEach((wall) => {
            const wallSprite = wall as Phaser.GameObjects.Sprite
            wallSprite.scaleX -= 0.005
            wallSprite.scaleY -= 0.005
            wallSprite.rotation += 0.01
            if (wallSprite.scaleX < 0.1) {
                this.walls.remove(wall, true, true)
            }
        })
    }

    private updatePlayerPosition() {
        this.player.x = this.center.x + this.playerDistance * Math.cos(this.playerAngle)
        this.player.y = this.center.y + this.playerDistance * Math.sin(this.playerAngle)
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.center.x, this.center.y) + Math.PI / 2
    }

    private spawnWalls() {
        const sides = 6
        const wallLength = 200
        const wallThickness = 20
        const initialDistance = 500
        const gapIndex = Phaser.Math.Between(0, sides - 1)

        for (let i = 0; i < sides; i++) {
            if (i === gapIndex) {
                continue
            }

            const angle = (i / sides) * Math.PI * 2
            const wall = this.add.rectangle(this.center.x, this.center.y, wallLength, wallThickness, 0x00ff00)
            this.physics.add.existing(wall, true)

            wall.x = this.center.x + initialDistance * Math.cos(angle)
            wall.y = this.center.y + initialDistance * Math.sin(angle)
            wall.rotation = angle + Math.PI / 2

            this.walls.add(wall)
        }
    }
}
