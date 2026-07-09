import { motion } from 'framer-motion'

export function CardWrapper({ children, isClosed, isBoosted, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.05 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
        isClosed
          ? 'border-slate-200 opacity-60'
          : isBoosted
            ? 'border-emerald-200 shadow-md shadow-emerald-100/30 hover:shadow-lg hover:shadow-emerald-100/40 hover:-translate-y-0.5'
            : 'border-slate-200 hover:border-primary/30 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >

      {/* Closed overlay */}
      {isClosed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-[1px]">
          <span className="rounded-full bg-slate-800/80 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            Applications Closed
          </span>
        </div>
      )}

      <div className={`flex flex-1 flex-col p-4 sm:p-5 ${isClosed ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
    </motion.div>
  )
}