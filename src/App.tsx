import { useRef } from 'react'

import type { IRefPhaserGame } from '@/PhaserGame'
import { PhaserGame } from '@/PhaserGame'

export default function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-stone-500">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}
