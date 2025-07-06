import { useRef } from 'react'

import type { IRefPhaserGame } from '@/PhaserGame'
import { PhaserGame } from '@/PhaserGame'

export default function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    const addSprite = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene
            if (scene) {
                const x = Phaser.Math.Between(64, scene.scale.width - 64)
                const y = Phaser.Math.Between(64, scene.scale.height - 64)
                scene.add.sprite(x, y, 'star')
            }
        }
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div>
                <div>
                    <button className="button" onClick={addSprite}>
                        Add New Sprite
                    </button>
                </div>
            </div>
        </div>
    )
}
