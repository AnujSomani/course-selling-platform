function Input({
    type,
    placeholder,
    value,
    onChange,
    name
}) {
    return(<div>
         <input type={type} placeholder={placeholder}
         value={value} onChange={onChange} name={name}
        className="w-full p-3 rounded-xl border border-gray-300 bg-white
         text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
         />
    </div>
    )
}
export default Input