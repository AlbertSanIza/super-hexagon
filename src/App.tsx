import { useRef } from 'react'

import type { IRefPhaserGame } from '@/Phaser'
import { PhaserGame } from '@/Phaser'

export default function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-stone-300">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}
