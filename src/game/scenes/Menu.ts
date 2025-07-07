import { Scene } from 'phaser'

export class Menu extends Scene {
    constructor() {
        super('Menu')
    }

    create() {
        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2
        this.add.text(centerX, centerY, 'SUPER HEXAGON', { fontSize: '64px', color: '#FFFFFF' }).setOrigin(0.5)
        this.add.text(centerX, centerY + 40, 'click to start', { fontSize: '18px', color: '#FFFFFF' }).setOrigin(0.5)
        this.input.on('pointerdown', () => this.scene.start('Game'))
    }
}
