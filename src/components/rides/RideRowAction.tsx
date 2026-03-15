"use client"

export function RideRowAction({ children }: { children: React.ReactNode }) {
  return (
    <span
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="flex items-center"
    >
      {children}
    </span>
  )
}
