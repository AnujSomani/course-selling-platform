import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";


function Input({ label, type = "text", name, error, className = "", ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          className={`w-full px-4 py-3 ${isPassword ? "pr-11" : ""} rounded-xl border bg-white
            text-gray-900 text-sm outline-none transition placeholder:text-gray-400
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;
