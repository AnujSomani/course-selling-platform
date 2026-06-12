function Button({
      children,
      type = "button",
      onClick,
      disabled = false,   // ← add this
      className = ""
}) {
    return (
        <button type={type}
                onClick={onClick}
                disabled={disabled}   // ← wire it up
         className={`w-full bg-blue-600
         hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 px-4 rounded-xl 
         cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 mb-2
         disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
         ${className}`}>
            {children}
        </button>
    )
}
export default Button