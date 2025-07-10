import { Scene } from 'phaser'

export class Game extends Scene {
    private center!: Phaser.Geom.Point
    private worldContainer!: Phaser.GameObjects.Container
    private player!: Phaser.GameObjects.Triangle
    private centerHexagon!: Phaser.GameObjects.Graphics
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

        const hexagonRadius = 40
        const outerRadius = 800
        for (let i = 0; i < 6; i++) {
            if (i % 2 === 0) {
                const g = this.add.graphics()
                g.fillStyle(0x481907, 1)
                g.beginPath()
                const angle1 = Phaser.Math.DegToRad(60 * i)
                const angle2 = Phaser.Math.DegToRad(60 * (i + 1))
                const x1 = Math.cos(angle1)
                const y1 = Math.sin(angle1)
                const x2 = Math.cos(angle2)
                const y2 = Math.sin(angle2)
                const x3 = outerRadius * Math.cos(angle1)
                const y3 = outerRadius * Math.sin(angle1)
                const x4 = outerRadius * Math.cos(angle2)
                const y4 = outerRadius * Math.sin(angle2)
                g.moveTo(x1, y1)
                g.lineTo(x2, y2)
                g.lineTo(x4, y4)
                g.lineTo(x3, y3)
                g.closePath()
                g.fillPath()
                this.worldContainer.add(g)
            }
        }

        this.player = this.add.triangle(0, 0, 8, 0, -4, -8, -4, 8, 0xf64813).setOrigin(0, 0)
        this.worldContainer.add(this.player)

        this.centerHexagon = this.add.graphics()
        this.centerHexagon.lineStyle(4, 0xba301e)
        this.centerHexagon.fillStyle(0x682207)
        this.centerHexagon.beginPath()
        for (let i = 0; i < 6; i++) {
            const angle = Phaser.Math.DegToRad(60 * i)
            const x = hexagonRadius * Math.cos(angle)
            const y = hexagonRadius * Math.sin(angle)
            if (i === 0) {
                this.centerHexagon.moveTo(x, y)
            } else {
                this.centerHexagon.lineTo(x, y)
            }
        }
        this.centerHexagon.closePath()
        this.centerHexagon.fillPath()
        this.centerHexagon.strokePath()
        this.worldContainer.add(this.centerHexagon)

        this.walls = this.add.group()
        this.time.addEvent({ delay: 1000, loop: true, callbackScope: this, callback: this.spawnWalls })
        this.physics.add.collider(this.player, this.walls, () => this.scene.start('Menu'))

        const scoreBackgroundWidth = 160
        const scoreBackgroundHeight = 52
        const scoreBackground = this.add.graphics()
        scoreBackground.fillStyle(0x000000)
        scoreBackground.fillRect(this.scale.width - scoreBackgroundWidth, 0, scoreBackgroundWidth, scoreBackgroundHeight)
        scoreBackground.setScrollFactor(0)

        this.add.text(this.scale.width - 220, 6, 'TIME', { fontSize: '22px', fontStyle: 'bold', fontFamily: 'monospace' })
        this.scoreText = this.add.text(this.scale.width - 140, 6, '0.00', { fontSize: '36px', fontStyle: 'bold', fontFamily: 'monospace' })

        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyZ = this.input.keyboard!.addKey('Z')
        this.keyM = this.input.keyboard!.addKey('M')
    }

    update(time: number, delta: number) {
        this.score += delta / 1000
        const [integerScore, decimalScore] = this.score.toFixed(2).split('.')
        this.scoreText.setText(`${integerScore}:${decimalScore.padStart(2, '0')}`)
        this.worldContainer.rotation += 0.01
        if (this.cursors.left.isDown || this.keyZ.isDown) {
            this.playerAngle -= 0.1
        } else if (this.cursors.right.isDown || this.keyM.isDown) {
            this.playerAngle += 0.1
        }
        this.playerAngle = ((this.playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

        const scale = 1 + 0.04 * Math.sin(time * 0.014)
        const scaledPlayerDistance = this.playerDistance * scale
        this.player.x = scaledPlayerDistance * Math.cos(this.playerAngle)
        this.player.y = scaledPlayerDistance * Math.sin(this.playerAngle)
        this.player.rotation = this.playerAngle
        this.centerHexagon.setScale(scale)

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
        const sides = Phaser.Math.Between(4, 6)
        const initialDistance = 800
        const gapIndex = Phaser.Math.Between(0, sides - 1)

        const wallThickness = 30
        for (let i = 0; i < sides; i++) {
            if (i === gapIndex) {
                continue
            }
            const angle1 = (i / sides) * Math.PI * 2
            const angle2 = ((i + 1) / sides) * Math.PI * 2
            const wall = this.add.graphics() as Phaser.GameObjects.Graphics & { angle1: number; angle2: number; outerRadius: number; innerRadius: number }
            wall.angle1 = angle1
            wall.angle2 = angle2
            wall.outerRadius = initialDistance
            wall.innerRadius = initialDistance - wallThickness
            wall.clear()
            wall.fillStyle(0x00ff00, 1)
            wall.beginPath()
            wall.moveTo(wall.outerRadius * Math.cos(angle1), wall.outerRadius * Math.sin(angle1))
            wall.lineTo(wall.outerRadius * Math.cos(angle2), wall.outerRadius * Math.sin(angle2))
            wall.lineTo(wall.innerRadius * Math.cos(angle2), wall.innerRadius * Math.sin(angle2))
            wall.lineTo(wall.innerRadius * Math.cos(angle1), wall.innerRadius * Math.sin(angle1))
            wall.closePath()
            wall.fillPath()
            this.worldContainer.add(wall)
            this.walls.add(wall)
        }
        this.worldContainer.bringToTop(this.centerHexagon)
    }
}
