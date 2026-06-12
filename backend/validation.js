const {z} = require ("zod");

const signupSchema = z.object({
    firstname:z.string().min(2).max(40),
    lastname:z.string().min(2).max(40),
    email:z.string().email("Invalid email"),
    password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(50)
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

const signinSchema = z.object({
    email:z.string().email("Invalid email"),
    password:z.string().min(1,"Password is required"),

});

const emailSchema = z.object({
    email:z.string().email("Invalid Email"),
});

module.exports = {
    signupSchema,
    signinSchema,
    emailSchema
};