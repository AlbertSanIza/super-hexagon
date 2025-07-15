import { Scene } from 'phaser'

export class Game extends Scene {
    private center!: Phaser.Geom.Point
    private worldContainer!: Phaser.GameObjects.Container
    private perspectiveContainer!: Phaser.GameObjects.Container
    private player!: Phaser.GameObjects.Triangle
    private centerHexagon!: Phaser.GameObjects.Graphics
    private playerAngle = 0
    private playerDistance = 58
    private scoreText!: Phaser.GameObjects.Text
    private score = 0

    private walls!: Phaser.GameObjects.Group
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private keyZ!: Phaser.Input.Keyboard.Key
    private keyM!: Phaser.Input.Keyboard.Key

    private wallGroups = new Map<
        number,
        (Phaser.GameObjects.Graphics & { angle1: number; angle2: number; outerRadius: number; innerRadius: number; groupId: number })[]
    >()
    private cosCache = new Map<number, number>()
    private sinCache = new Map<number, number>()

    private gameState: 'menu' | 'playing' | 'transitioning' = 'menu'
    private menuZoom = 5
    private gameZoom = 1
    private wallSpawnTimer?: Phaser.Time.TimerEvent

    constructor() {
        super('Game')
    }

    create() {
        this.center = new Phaser.Geom.Point(this.scale.width / 2, this.scale.height / 2)
        this.perspectiveContainer = this.add.container(this.center.x, this.center.y)
        this.worldContainer = this.add.container(0, 0)
        this.perspectiveContainer.add(this.worldContainer)
        this.cameras.main.setZoom(this.menuZoom)
        this.perspectiveContainer.setScale(1, 0.8)

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

        this.player = this.add.triangle(0, 0, 0, 0, -12, -8, -12, 8, 0xf64813).setOrigin(0, 0)
        this.player.setVisible(false)
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
        this.physics.add.collider(this.player, this.walls, () => this.gameOver())

        const scoreBackgroundWidth = 160
        const scoreBackgroundHeight = 52
        const scoreBackground = this.add.graphics()
        scoreBackground.fillStyle(0x000000)
        scoreBackground.fillRect(this.scale.width - scoreBackgroundWidth, 0, scoreBackgroundWidth, scoreBackgroundHeight)
        scoreBackground.setScrollFactor(0)
        scoreBackground.setVisible(false)
        scoreBackground.setData('isScoreUI', true)

        const timeLabel = this.add.text(this.scale.width - 220, 6, 'TIME', { fontSize: '22px', fontStyle: 'bold', fontFamily: 'monospace' })
        timeLabel.setVisible(false)
        timeLabel.setData('isScoreUI', true)

        this.scoreText = this.add.text(this.scale.width - 140, 6, '0.00', { fontSize: '36px', fontStyle: 'bold', fontFamily: 'monospace' })
        this.scoreText.setVisible(false)
        this.scoreText.setData('isScoreUI', true)

        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyZ = this.input.keyboard!.addKey('Z')
        this.keyM = this.input.keyboard!.addKey('M')
    }

    update(time: number, delta: number) {
        let hit = false
        const hexRadius = 40
        const wallMoveSpeed = 3
        this.score += delta / 1000
        const [integerScore, decimalScore] = this.score.toFixed(2).split('.')
        this.scoreText.setText(`${integerScore}:${decimalScore.padStart(2, '0')}`)
        this.worldContainer.rotation += 0.009

        if (this.cursors.left.isDown || this.keyZ.isDown) {
            this.playerAngle -= 0.1
        } else if (this.cursors.right.isDown || this.keyM.isDown) {
            this.playerAngle += 0.1
        }

        this.playerAngle = ((this.playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const scale = 1 + 0.05 * Math.sin(time * 0.014)
        const scaledPlayerDistance = this.playerDistance * scale
        this.player.x = scaledPlayerDistance * this.getCachedCos(this.playerAngle)
        this.player.y = scaledPlayerDistance * this.getCachedSin(this.playerAngle)
        this.player.rotation = this.playerAngle

        this.wallGroups.clear()
        this.walls.getChildren().forEach((wall) => {
            const wallPoly = wall as Phaser.GameObjects.Graphics & { angle1: number; angle2: number; outerRadius: number; innerRadius: number; groupId: number }
            if (!this.wallGroups.has(wallPoly.groupId)) {
                this.wallGroups.set(wallPoly.groupId, [])
            }
            this.wallGroups.get(wallPoly.groupId)!.push(wallPoly)
        })

        // Update walls by group
        this.wallGroups.forEach((groupWalls) => {
            if (groupWalls.length === 0) {
                return
            }
            // Use first wall as reference for the group
            const refWall = groupWalls[0]
            refWall.outerRadius -= wallMoveSpeed
            refWall.innerRadius -= wallMoveSpeed

            // Sync all other walls in group to reference wall
            groupWalls.forEach((wallPoly) => {
                wallPoly.outerRadius = refWall.outerRadius
                wallPoly.innerRadius = refWall.innerRadius
                wallPoly.clear()
                wallPoly.fillStyle(0xf64813, 1)
                wallPoly.beginPath()
                wallPoly.moveTo(wallPoly.outerRadius * this.getCachedCos(wallPoly.angle1), wallPoly.outerRadius * this.getCachedSin(wallPoly.angle1))
                wallPoly.lineTo(wallPoly.outerRadius * this.getCachedCos(wallPoly.angle2), wallPoly.outerRadius * this.getCachedSin(wallPoly.angle2))
                wallPoly.lineTo(wallPoly.innerRadius * this.getCachedCos(wallPoly.angle2), wallPoly.innerRadius * this.getCachedSin(wallPoly.angle2))
                wallPoly.lineTo(wallPoly.innerRadius * this.getCachedCos(wallPoly.angle1), wallPoly.innerRadius * this.getCachedSin(wallPoly.angle1))
                wallPoly.closePath()
                wallPoly.fillPath()
                if (wallPoly.outerRadius < hexRadius + 2) {
                    this.walls.remove(wallPoly, true, true)
                }
                if (this.pointInWall(this.player.x, this.player.y, wallPoly.angle1, wallPoly.angle2, wallPoly.innerRadius, wallPoly.outerRadius)) {
                    hit = true
                }
            })
        })

        this.centerHexagon.setScale(scale)
        if (hit) {
            this.scene.start('Menu')
        }
    }

    private spawnWalls() {
        const sides = 6
        const wallThickness = 26
        const groupId = Date.now()
        const initialDistance = 800
        const gapIndex = Phaser.Math.Between(0, sides - 1)
        for (let i = 0; i < sides; i++) {
            if (i === gapIndex) {
                continue
            }
            const wall = this.add.graphics() as Phaser.GameObjects.Graphics & {
                angle1: number
                angle2: number
                outerRadius: number
                innerRadius: number
                groupId: number
            }
            wall.angle1 = (i / sides) * Math.PI * 2
            wall.angle2 = ((i + 1) / sides) * Math.PI * 2
            wall.outerRadius = initialDistance
            wall.innerRadius = initialDistance - wallThickness
            wall.groupId = groupId
            this.worldContainer.add(wall)
            this.walls.add(wall)
        }
        this.worldContainer.bringToTop(this.centerHexagon)
    }

    private pointInWall(px: number, py: number, angle1: number, angle2: number, innerRadius: number, outerRadius: number) {
        const r = Math.sqrt(px * px + py * py)
        let theta = Math.atan2(py, px)
        if (theta < 0) {
            theta += Math.PI * 2
        }
        const a1 = angle1
        let a2 = angle2
        if (a2 < a1) {
            a2 += Math.PI * 2
        }
        if (theta < a1) {
            theta += Math.PI * 2
        }
        return r > innerRadius && r < outerRadius && theta >= a1 && theta <= a2
    }

    private getCachedCos(angle: number): number {
        const key = Math.round(angle * 1000)
        if (!this.cosCache.has(key)) {
            if (this.cosCache.size > 100) {
                this.cosCache.clear()
            }
            this.cosCache.set(key, Math.cos(angle))
        }
        return this.cosCache.get(key)!
    }

    private getCachedSin(angle: number): number {
        const key = Math.round(angle * 1000)
        if (!this.sinCache.has(key)) {
            if (this.sinCache.size > 100) {
                this.sinCache.clear()
            }
            this.sinCache.set(key, Math.sin(angle))
        }
        return this.sinCache.get(key)!
    }
}
