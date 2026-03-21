import Image from 'next/image'

interface SeraAdviceBubbleProps {
  content: string
}

export default function SeraAdviceBubble({ content }: SeraAdviceBubbleProps) {
  return (
    <div className="flex gap-4 items-start my-12 max-w-4xl mx-auto px-4">
      {/* Icon */}
      <div className="flex-shrink-0 w-14 h-14 md:w-20 md:h-20 relative rounded-full overflow-hidden border-2 border-cyan-100 dark:border-cyan-900 shadow-md">
        <Image
          src="/sera-icon.png"
          alt="白崎セラ"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 56px, 80px"
        />
      </div>
      
      {/* Speech Bubble */}
      <div className="relative flex-grow bg-white dark:bg-gray-900 border border-cyan-100 dark:border-cyan-800 rounded-3xl rounded-tl-none p-6 md:p-8 shadow-sm">
        {/* Header/Label */}
        <div className="text-[10px] font-black tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 uppercase">
          Sera&apos;s Advice
        </div>
        
        {/* Content */}
        <div className="text-gray-800 dark:text-gray-100 leading-loose text-base md:text-lg font-medium">
          {content.split('\n').map((line, i) => (
            <span key={i} className="block mb-2 last:mb-0">{line}</span>
          ))}
        </div>

        {/* Subtle Decorative Element */}
        <div className="absolute bottom-4 right-6 opacity-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-600">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21Z" />
            <path d="M3.01709 21L3.01709 18C3.01709 16.8954 3.91252 16 5.01709 16H8.01709C9.12166 16 10.0171 16.8954 10.0171 18V21C10.0171 22.1046 9.12166 23 8.01709 23H5.01709C3.91252 23 3.01709 22.1046 3.01709 21Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
