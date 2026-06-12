
import {useState} from "react";
import {Link, useNavigate, useLocation } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import API from "../api/axios";
import toast,{Toaster} from "react-hot-toast";


function Signup(){
    const navigate = useNavigate();
    const location=useLocation();
    const params=new URLSearchParams(location.search);
    const roleParam=params.get("role");
    const [role,setRole]=useState(roleParam === "admin" ? "admin" : "user");

    const[formData , setFormData] = useState({
        firstname :"",
        lastname :"",
        email : "",
        password : ""
    });

    const[loading , setloading] = useState(false);

    function handleChange(e){
        setFormData({
            ...formData,
        [e.target.name]:e.target.value
        });
    }
    
   async function handleSignup(e){

        e.preventDefault();
        try{
            setloading(true);
            const endpoint = role === "admin" ? "/admin/signup" : "/user/signup";
            await API.post(endpoint,formData);
            navigate("/verify-email", { state: { email: formData.email, role } });
        }catch(error){

            toast.error( error.response?.data?.message || "signup failed");
    } finally {
        setloading(false);
    }
}

    return (
    <div className = "min-h-screen flex justify-center items-center bg-gradient-to-br from-white via-gray-50 to-blue-50" >
        <Toaster position = "top-right"/>

        <form onSubmit = {handleSignup} 
        className="w-full max-w-md h-fit bg-white  rounded-2xl  space-y-5 shadow-xl px-8 py-10">

            <div className = "space-y-2">
                <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200">
                    <Button type="button"
                    onClick={()=>setRole("user")}
                    className={`w-full py-3 ${role ==="user" ? "bg-blue-900 text-white"
                               :"bg-white text-gray-500 hover:bg-gray-50"}`}>
                            User
                        </Button>
                    <Button type = "button"
                    onClick = {()=>setRole("admin")}
                    className={`w-full py-3 ${role ==="admin" ? "bg-blue-900 text-white"
                               :"bg-white text-gray-500 hover:bg-gray-50"}`}>
                        Admin
                        </Button>

                </div>
                <h1 className = "text-3xl font-bold text-center">
                    Create Account</h1>
                <p className="text-slate-600 text-center font-semibold">
                 {role === "admin" ? "Start Teaching on SkillHub": "Start Learning Today"}</p>
                    </div>

                    <Input type= "text" placeholder="First Name" value={formData.firstname} 
                    onChange={handleChange} name="firstname" autoComplete="given-name" required/>
                    
                    <Input type= "text" placeholder="Last Name" value={formData.lastname} 
                    onChange={handleChange} name="lastname" autoComplete="family-name" required/>
                    
                    <Input type= "email" placeholder="Email" value={formData.email} 
                    onChange={handleChange} name="email" autoComplete="email" required/>
                    
                    <Input type= "password" placeholder="Password" value={formData.password} 
                    onChange={handleChange} name="password" autoComplete="new-password" minLength={6} required/>

                    <p className="text-center text-gray-600">Already have an account?
                    <Link to={`/signin?role=${role}`} className="text-blue-600 font-semibold hover:underline ml-2">Signin</Link>
                    </p>

                    <Button type = "submit" disabled = {loading}
                  className="w-full bg-blue-900 hover:bg-blue-800
                              text-white rounded-xl hover:shadow-md">
                        {
                            loading ? "Creating Account..." : "Signup"
                        }
                    </Button>
                    </form>
    </div> 
    )
}
export default Signup
