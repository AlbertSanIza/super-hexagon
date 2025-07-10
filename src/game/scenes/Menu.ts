import { Scene } from 'phaser'

export class Menu extends Scene {
    private menuContainer!: Phaser.GameObjects.Container

    constructor() {
        super('Menu')
    }

    create() {
        const overlay = this.add.graphics()
        overlay.fillStyle(0x000000, 0.3)
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
        this.menuContainer = this.add.container()
        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2

        const title = this.add
            .text(centerX, centerY, 'SUPER HEXAGON', {
                color: '#FFFFFF',
                fontSize: '72px',
                stroke: '#ff4444',
                strokeThickness: 4,
                fontFamily: 'Arial Black, Arial',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 0,
                    stroke: false,
                    fill: true
                }
            })
            .setOrigin(0.5)
        this.tweens.add({
            yoyo: true,
            repeat: -1,
            duration: 3000,
            targets: title,
            ease: 'Sine.easeInOut',
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 1.1 }
        })

        const startText = this.add
            .text(centerX, this.cameras.main.height - 40, 'CLICK ANYWHERE TO START', { fontSize: '18px', color: '#FFFFFF', fontFamily: 'Arial' })
            .setOrigin(0.5)
        this.tweens.add({
            yoyo: true,
            repeat: -1,
            duration: 1000,
            targets: startText,
            ease: 'Sine.easeInOut',
            alpha: { from: 1, to: 0.1 }
        })

        this.input.on('pointerdown', this.startGame, this)
        this.input.keyboard?.on('keydown-SPACE', this.startGame, this)
        this.input.keyboard?.on('keydown-ENTER', this.startGame, this)
    }

    private startGame() {
        this.tweens.add({
            alpha: 0,
            duration: 300,
            targets: this.menuContainer,
            onComplete: () => {
                this.events.emit('startGame')
                this.scene.stop('Menu')
            }
        })
    }
}
