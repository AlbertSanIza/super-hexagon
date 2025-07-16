import { Scene } from 'phaser'

export class Score extends Scene {
    private text!: Phaser.GameObjects.Text

    constructor() {
        super({ key: 'Score', active: true })
    }

    create() {
        const score = parseFloat(localStorage.getItem('super-hexagon') || '0').toFixed(2)
        this.text = this.add.text(16, 10, `BEST TIME: ${score}`, { fontSize: '22px', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0, 0)
        this.game.events.on('updateScore', (newScore: string) => {
            this.text.setText(`BEST TIME: ${newScore}`)
            localStorage.setItem('super-hexagon', newScore)
        })
    }
}
