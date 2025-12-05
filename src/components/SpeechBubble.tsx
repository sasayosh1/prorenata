import Image from 'next/image';

type SpeechBubbleProps = {
    value: {
        speaker: 'sera' | 'patient' | 'nurse';
        emotion: 'normal' | 'happy' | 'sad' | 'thinking' | 'angry';
        position: 'left' | 'right';
        text: string;
    };
};

const AVATARS = {
    sera: {
        normal: '/images/avatars/sera_normal.png',
        happy: '/images/avatars/sera_happy.png',
        sad: '/images/avatars/sera_sad.png',
        thinking: '/images/avatars/sera_thinking.png',
        angry: '/images/avatars/sera_angry.png',
    },
    // Placeholders for other speakers
    patient: {
        normal: '/images/avatars/patient_normal.png',
        happy: '/images/avatars/patient_normal.png', // Fallback
        sad: '/images/avatars/patient_normal.png', // Fallback
        thinking: '/images/avatars/patient_normal.png', // Fallback
        angry: '/images/avatars/patient_normal.png', // Fallback
    },
    nurse: {
        normal: '/images/avatars/nurse_normal.png',
        happy: '/images/avatars/nurse_normal.png', // Fallback
        sad: '/images/avatars/nurse_normal.png', // Fallback
        thinking: '/images/avatars/nurse_normal.png', // Fallback
        angry: '/images/avatars/nurse_normal.png', // Fallback
    }
};

const NAMES = {
    sera: '白崎セラ',
    patient: '患者さん',
    nurse: '先輩ナース'
};

export default function SpeechBubble({ value }: SpeechBubbleProps) {
    const { speaker, emotion, position, text } = value;
    const isRight = position === 'right';

    // Get avatar URL with fallback
    const avatarUrl = AVATARS[speaker]?.[emotion] || AVATARS.sera.normal;
    const name = NAMES[speaker] || 'Unknown';

    return (
        <div className={`flex items-start gap-4 my-8 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="flex flex-col items-center shrink-0 w-16">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-100 bg-white shadow-sm">
                    <Image
                        src={avatarUrl}
                        alt={`${name} (${emotion})`}
                        fill
                        className="object-cover"
                    />
                </div>
                <span className="text-xs text-gray-500 mt-1 font-medium">{name}</span>
            </div>

            {/* Bubble */}
            <div
                className={`
          relative p-4 rounded-2xl shadow-sm text-gray-700 leading-relaxed max-w-[80%]
          ${isRight
                        ? 'bg-pink-50 rounded-tr-none border border-pink-100'
                        : 'bg-white rounded-tl-none border border-gray-100'}
        `}
            >
                {/* Triangle tail */}
                <div
                    className={`
            absolute top-4 w-3 h-3 border-t border-l rotate-45
            ${isRight
                            ? '-right-[7px] bg-pink-50 border-pink-100 border-b-0 border-l-0 border-t border-r'
                            : '-left-[7px] bg-white border-gray-100'}
          `}
                    style={{
                        borderColor: isRight ? '#fce7f3' : '#f3f4f6', // Match tail border color manually if needed
                        backgroundColor: isRight ? '#fdf2f8' : '#ffffff'
                    }}
                />
                <p className="whitespace-pre-wrap text-sm md:text-base">{text}</p>
            </div>
        </div>
    );
}
