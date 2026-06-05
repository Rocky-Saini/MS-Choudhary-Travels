'use client'

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const dimensions = size === 'small' ? 'w-9 h-9' : size === 'large' ? 'w-16 h-16' : 'w-11 h-11'
  const textSize = size === 'small' ? 'text-base' : size === 'large' ? 'text-2xl' : 'text-xl'
  const subSize = size === 'small' ? 'text-[9px]' : size === 'large' ? 'text-xs' : 'text-[10px]'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dimensions} relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-600 rounded-2xl rotate-3 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center">
          <span className="text-white font-extrabold text-sm tracking-tight" style={{ fontFamily: 'inherit' }}>MS</span>
        </div>
      </div>
      <div className="leading-tight">
        <h1 className={`${textSize} font-extrabold text-gray-900 tracking-tight`}>
          MS Choudhary
        </h1>
        <p className={`${subSize} font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 tracking-widest uppercase`}>
          Travels
        </p>
      </div>
    </div>
  )
}
