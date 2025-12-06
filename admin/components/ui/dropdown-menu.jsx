"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react"

const DropdownMenuContext = createContext(null)

export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, toggle, close }}>
      <div className="relative" ref={menuRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild, className = "" }) {
  const { toggle } = useContext(DropdownMenuContext)

  if (asChild) {
    return (
      <div onClick={toggle} className={className}>
        {children}
      </div>
    )
  }

  return (
    <button onClick={toggle} className={className}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, className = "", align = "end" }) {
  const { isOpen } = useContext(DropdownMenuContext)

  if (!isOpen) return null

  const alignClasses = {
    end: "right-0",
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
  }

  return (
    <div
      className={`absolute top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${alignClasses[align] || alignClasses.end} ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, className = "", onClick, ...props }) {
  const { close } = useContext(DropdownMenuContext)

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    }
    // Don't close if it's a button inside (like delete button)
    if (!e.defaultPrevented && !e.target.closest("button")) {
      close()
    }
  }

  return (
    <div
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className = "" }) {
  return (
    <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className = "" }) {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />
}

