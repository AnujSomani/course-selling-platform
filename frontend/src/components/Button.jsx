const VARIANTS = {
  solid: "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white",
  primary:
    "bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
  outline: "border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white",
  ghost: "text-blue-900 hover:bg-blue-50",
};

function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "solid",
  fullWidth = true,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? "w-full" : ""} ${VARIANTS[variant] || VARIANTS.solid}
        font-semibold py-3 px-4 rounded-xl cursor-pointer transition-all duration-150
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:translate-y-0
        ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
