import { Scene } from 'phaser'

export class Game extends Scene {
    private center!: Phaser.Geom.Point
    private worldContainer!: Phaser.GameObjects.Container
    private player!: Phaser.GameObjects.Triangle
    private playerAngle = 0
    private playerDistance = 52
    private scoreText!: Phaser.GameObjects.Text
    private score = 0

    private walls!: Phaser.GameObjects.Group
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private keyZ!: Phaser.Input.Keyboard.Key
    private keyM!: Phaser.Input.Keyboard.Key

    constructor() {
        super('Game')
    }

    create() {
        this.center = new Phaser.Geom.Point(this.scale.width / 2, this.scale.height / 2)
        this.worldContainer = this.add.container(this.center.x, this.center.y)

        this.player = this.add.triangle(0, 0, 8, 0, -4, -8, -4, 8, 0xffffff).setOrigin(0, 0)
        this.worldContainer.add(this.player)

        const hexagonRadius = 40
        const centerHexagon = this.add.graphics()
        centerHexagon.lineStyle(4, 0xffffff)
        centerHexagon.beginPath()
        for (let i = 0; i < 6; i++) {
            const angle = Phaser.Math.DegToRad(60 * i)
            const x = hexagonRadius * Math.cos(angle)
            const y = hexagonRadius * Math.sin(angle)
            if (i === 0) {
                centerHexagon.moveTo(x, y)
            } else {
                centerHexagon.lineTo(x, y)
            }
        }
        centerHexagon.closePath()
        centerHexagon.strokePath()
        this.worldContainer.add(centerHexagon)

        this.walls = this.add.group()
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnWalls,
            callbackScope: this,
            loop: true
        })

        // Collider: use worldContainer for player, walls are still managed as a group
        this.physics.add.collider(this.player, this.walls, () => this.scene.start('Menu'))

        // Score text stays on the main scene, not in the container
        this.scoreText = this.add.text(this.center.x, 20, 'Score: 0', { fontSize: '32px', color: '#fff' }).setOrigin(0.5, 0)
        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyZ = this.input.keyboard!.addKey('Z')
        this.keyM = this.input.keyboard!.addKey('M')
    }

    update(_time: number, delta: number) {
        this.score += delta / 1000
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`)
        this.worldContainer.rotation += 0.01
        if (this.cursors.left.isDown || this.keyZ.isDown) {
            this.playerAngle -= 0.14
        } else if (this.cursors.right.isDown || this.keyM.isDown) {
            this.playerAngle += 0.14
        }
        this.playerAngle = ((this.playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        this.player.x = this.playerDistance * Math.cos(this.playerAngle)
        this.player.y = this.playerDistance * Math.sin(this.playerAngle)
        this.player.rotation = this.playerAngle

        this.walls.getChildren().forEach((wall) => {
            const wallRect = wall as Phaser.GameObjects.Rectangle
            wallRect.scaleX -= 0.005
            wallRect.scaleY -= 0.005
            if (wallRect.scaleX < 0.1) {
                this.walls.remove(wall, true, true)
            }
        })
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
            const wall = this.add.rectangle(0, 0, wallLength, wallThickness, 0x00ff00)
            this.physics.add.existing(wall, true)
            wall.x = initialDistance * Math.cos(angle)
            wall.y = initialDistance * Math.sin(angle)
            wall.rotation = angle + Math.PI / 2
            this.worldContainer.add(wall)
            this.walls.add(wall)
        }
    }
}
