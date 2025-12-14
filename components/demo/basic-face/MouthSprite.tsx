/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import type { WawaViseme } from '../../../hooks/demo/use-face';

// Import all mouth SVGs
import MouthAE from '../mouths/AE.svg';
import MouthBMP from '../mouths/BMP.svg';
import MouthCDGKNSTXYZ from '../mouths/CDGKNSTXYZ.svg';
import MouthFV from '../mouths/FV.svg';
import MouthL from '../mouths/L.svg';
import MouthO from '../mouths/O.svg';
import MouthQW from '../mouths/QW.svg';
import MouthR from '../mouths/R.svg';
import MouthTH from '../mouths/TH.svg';

/**
 * Maps WawaViseme to the appropriate mouth sprite
 */
function getMouthSprite(viseme: WawaViseme): string {
    switch (viseme) {
        // Silence - use closed mouth (BMP)
        case 'sil':
            return MouthBMP;

        // Bilabials P, B, M - closed/pressed lips
        case 'PP':
            return MouthBMP;

        // Labiodentals F, V - teeth on lip
        case 'FF':
            return MouthFV;

        // Dental TH
        case 'TH':
            return MouthTH;

        // Alveolars D, T, N - teeth visible
        case 'DD':
            return MouthCDGKNSTXYZ;

        // Velars K, G
        case 'kk':
            return MouthCDGKNSTXYZ;

        // Postalveolars CH, SH, J
        case 'CH':
            return MouthCDGKNSTXYZ;

        // Sibilants S, Z
        case 'SS':
            return MouthCDGKNSTXYZ;

        // Nasals/Laterals N, L
        case 'nn':
            return MouthL;

        // R sounds
        case 'RR':
            return MouthR;

        // Vowel A (open) and E
        case 'aa':
        case 'E':
            return MouthAE;

        // Vowel I (EE) - wide/spread
        case 'I':
            return MouthCDGKNSTXYZ;

        // Vowel O - rounded
        case 'O':
            return MouthO;

        // Vowel U (OO) - puckered
        case 'U':
            return MouthQW;

        default:
            return MouthBMP;
    }
}

type MouthSpriteProps = {
    viseme: WawaViseme;
    className?: string;
    style?: React.CSSProperties;
};

export default function MouthSprite({ viseme, className, style }: MouthSpriteProps) {
    const mouthSrc = useMemo(() => getMouthSprite(viseme), [viseme]);

    return (
        <img
            src={mouthSrc}
            alt={`Mouth shape for ${viseme}`}
            className={className}
            style={{
                transition: 'opacity 0.05s ease-out',
                ...style,
            }}
            draggable={false}
        />
    );
}
