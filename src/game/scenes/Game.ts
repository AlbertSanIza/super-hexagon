import { Scene } from 'phaser'
import { loadBestScore, saveBestScore } from '../../lib/score-storage'

const hexagonRadius = 40
const outerRadius = 800

interface Wall extends Phaser.GameObjects.Graphics {
    angle1: number
    angle2: number
    outerRadius: number
    innerRadius: number
    groupId: number
    wallSpeed: number
}

export class Game extends Scene {
    private center!: Phaser.Geom.Point
    private prevWallType: string | null = null
    private worldContainer!: Phaser.GameObjects.Container
    private perspectiveContainer!: Phaser.GameObjects.Container
    private player!: Phaser.GameObjects.Triangle
    private centerHexagon!: Phaser.GameObjects.Graphics
    private playerAngle = 0
    private playerDistance = 58
    private scoreText!: Phaser.GameObjects.Text
    private score = 0
    private bestScore = 0

    private baseRotationSpeed = 0.009
    private rotationDirection = 1
    private timeSinceLastDirectionChange = 0
    private nextDirectionChangeTime = Phaser.Math.Between(10, 20)
    private baseSpawnDelay = 1000
    private nextSpawnTime = 0
    private prevGapIndex: number | null = null

    private walls!: Phaser.GameObjects.Group
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private keyZ!: Phaser.Input.Keyboard.Key
    private keyM!: Phaser.Input.Keyboard.Key
    private keyA!: Phaser.Input.Keyboard.Key
    private keyD!: Phaser.Input.Keyboard.Key

    private wallGroups = new Map<number, Wall[]>()
    private cosCache = new Map<number, number>()
    private sinCache = new Map<number, number>()

    private gameState: 'menu' | 'playing' | 'transitioning' = 'menu'
    private menuZoom = 5
    private gameZoom = 1

    constructor() {
        super('Game')
    }

    create() {
        this.center = new Phaser.Geom.Point(this.scale.width / 2, this.scale.height / 2)
        this.worldContainer = this.add.container(0, 0)
        this.perspectiveContainer = this.add.container(this.center.x, this.center.y)
        this.perspectiveContainer.add(this.worldContainer)
        this.cameras.main.setZoom(this.menuZoom)
        this.perspectiveContainer.setScale(1, 0.8)
        loadBestScore().then((score) => {
            this.bestScore = score
        })

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

        const timeLabel = this.add.text(this.scale.width - 220, 6, 'TIME', { fontSize: '22px', fontStyle: 'bold', fontFamily: 'monospace' })
        timeLabel.setVisible(false)
        timeLabel.setData('isScoreUI', true)

        this.scoreText = this.add.text(this.scale.width - 140, 6, '0.00', { fontSize: '36px', fontStyle: 'bold', fontFamily: 'monospace' })
        this.scoreText.setVisible(false)
        this.scoreText.setData('isScoreUI', true)

        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyZ = this.input.keyboard!.addKey('Z')
        this.keyM = this.input.keyboard!.addKey('M')
        this.keyA = this.input.keyboard!.addKey('A')
        this.keyD = this.input.keyboard!.addKey('D')

        this.scene.get('Menu').events.on('startGame', this.startGame, this)
        this.scene.launch('Menu')
    }

    update(time: number, delta: number) {
        this.worldContainer.rotation += (this.baseRotationSpeed + this.score * 0.00001) * this.rotationDirection
        if (this.gameState === 'playing') {
            this.updateGameplay(time, delta)
        } else if (this.gameState === 'menu') {
            const scale = 1 + 0.05 * Math.sin(time * 0.014)
            this.centerHexagon.setScale(scale)
        }
    }

    private updateGameplay(time: number, delta: number) {
        this.timeSinceLastDirectionChange += delta / 1000
        if (this.timeSinceLastDirectionChange >= this.nextDirectionChangeTime) {
            this.rotationDirection *= -1
            this.timeSinceLastDirectionChange = 0
            this.nextDirectionChangeTime = Phaser.Math.Between(10, 20)
        }
        if (this.time.now >= this.nextSpawnTime) {
            this.spawnWalls()
            const currentDelay = this.baseSpawnDelay - this.score * 3
            this.nextSpawnTime = this.time.now + Math.max(200, currentDelay)
        }
        let hit = false
        const hexRadius = 40

        this.score += delta / 1000
        const [integerScore, decimalScore] = this.score.toFixed(2).split('.')
        this.scoreText.setText(`${integerScore}:${decimalScore.padStart(2, '0')}`)

        if (this.cursors.left.isDown || this.keyZ.isDown || this.keyA.isDown) {
            this.playerAngle -= 0.1
        } else if (this.cursors.right.isDown || this.keyM.isDown || this.keyD.isDown) {
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
            const wallPoly = wall as Wall
            if (!this.wallGroups.has(wallPoly.groupId)) {
                this.wallGroups.set(wallPoly.groupId, [])
            }
            this.wallGroups.get(wallPoly.groupId)!.push(wallPoly)
        })

        this.wallGroups.forEach((groupWalls) => {
            if (groupWalls.length === 0) {
                return
            }
            const refWall = groupWalls[0]
            const wallMoveSpeed = Math.max(3 + this.score * groupWalls[0].wallSpeed, 3.2)
            refWall.outerRadius -= wallMoveSpeed
            refWall.innerRadius -= wallMoveSpeed
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
            this.gameOver()
        }
    }

    private startGame() {
        this.gameState = 'transitioning'
        this.tweens.add({
            duration: 400,
            zoom: this.gameZoom,
            ease: 'Power2.easeOut',
            targets: this.cameras.main,
            onComplete: () => {
                this.gameState = 'playing'
                this.nextSpawnTime = this.time.now + this.baseSpawnDelay
                this.player.setVisible(true)
                this.player.setAlpha(0)
                this.tweens.add({ targets: this.player, alpha: 1, duration: 300, ease: 'Power2.easeOut' })
                this.scoreText.setVisible(true)
                this.children.getAll().forEach((child) => {
                    const gameObject = child as Phaser.GameObjects.GameObject & { getData?: (key: string) => boolean; setVisible?: (visible: boolean) => void }
                    if (gameObject.getData?.('isScoreUI') && gameObject.setVisible) {
                        gameObject.setVisible(true)
                    }
                })
                this.score = 0
            }
        })
    }

    private gameOver() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score
            this.game.events.emit('updateScore', this.bestScore.toFixed(2))
            saveBestScore(this.bestScore)
        }
        this.gameState = 'transitioning'
        this.cameras.main.shake(80, 0.02)
        this.cameras.main.flash(10, 255, 255, 255, false)
        this.scoreText.setVisible(false)
        this.children.getAll().forEach((child) => {
            const gameObject = child as Phaser.GameObjects.GameObject & {
                getData?: (key: string) => boolean
                setVisible?: (visible: boolean) => void
            }
            if (gameObject.getData?.('isScoreUI') && gameObject.setVisible) {
                gameObject.setVisible(false)
            }
        })
        this.tweens.add({
            duration: 1000,
            zoom: this.menuZoom,
            ease: 'Power2.easeIn',
            targets: this.cameras.main,
            onComplete: () => {
                const MenuScene = this.scene.get('Menu').constructor as { lastScore?: number }
                if (MenuScene && typeof MenuScene.lastScore !== 'undefined') {
                    MenuScene.lastScore = this.score
                }
                this.gameState = 'menu'
                this.walls.clear(true, true)
                this.player.setVisible(false)
                if (!this.scene.isActive('Menu')) {
                    this.scene.launch('Menu')
                }
            }
        })
        this.tweens.add({ targets: this.player, alpha: 0, duration: 500, ease: 'Power2.easeOut' })
    }

    private spawnWalls() {
        const sides = 6
        const wallThickness = 26
        const groupId = Date.now()
        const initialDistance = 800
        let wallTypes = ['pentagon', 'holes', 'snake']
        if (this.prevWallType === 'snake') {
            wallTypes = ['pentagon', 'holes']
        }
        const wallType = wallTypes[Phaser.Math.Between(0, wallTypes.length - 1)]
        this.prevWallType = wallType
        if (wallType === 'pentagon') {
            let gapIndex: number
            do {
                gapIndex = Phaser.Math.Between(0, sides - 1)
            } while (gapIndex === this.prevGapIndex)
            this.prevGapIndex = gapIndex
            for (let i = 0; i < sides; i++) {
                if (i === gapIndex) {
                    continue
                }
                const wall = this.add.graphics() as Wall
                wall.angle1 = (i / sides) * Math.PI * 2
                wall.angle2 = ((i + 1) / sides) * Math.PI * 2
                wall.outerRadius = initialDistance
                wall.innerRadius = initialDistance - wallThickness
                wall.groupId = groupId
                wall.wallSpeed = 0.02
                this.worldContainer.add(wall)
                this.walls.add(wall)
            }
        } else if (wallType === 'holes') {
            const start = Phaser.Math.Between(0, sides - 1)
            for (let j = 0; j < 3; j++) {
                const i = (start + j * 2) % sides
                const wall = this.add.graphics() as Wall
                wall.angle1 = (i / sides) * Math.PI * 2
                wall.angle2 = ((i + 1) / sides) * Math.PI * 2
                wall.outerRadius = initialDistance
                wall.innerRadius = initialDistance - wallThickness
                wall.groupId = groupId
                wall.wallSpeed = 0.02
                this.worldContainer.add(wall)
                this.walls.add(wall)
            }
        } else if (wallType === 'snake') {
            const offset = 28
            const segments = 7
            const direction = Phaser.Math.Between(0, 1) === 0 ? 1 : -1
            const startAngleIndex = Phaser.Math.Between(0, sides - 1)
            for (let k = 0; k < segments; k++) {
                const angleIndex = (startAngleIndex + direction * k + sides) % sides
                const radius = initialDistance + k * offset
                const wall = this.add.graphics() as Wall
                wall.angle1 = (angleIndex / sides) * Math.PI * 2
                wall.angle2 = ((angleIndex + 1) / sides) * Math.PI * 2
                wall.outerRadius = radius
                wall.innerRadius = radius - wallThickness
                wall.groupId = groupId + k
                wall.wallSpeed = 0.03
                this.worldContainer.add(wall)
                this.walls.add(wall)
            }
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
