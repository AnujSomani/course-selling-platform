const {z} = require ("zod");

const signupSchema = z.object({
    firstname:z.string().min(2).max(40),
    lastname:z.string().min(2).max(40),
    email:z.string().email("Invalid email"),
    password:z.string().min(8).max(50).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
});

const signinSchema = z.object({
    email:z.string().email("Invalid email"),
    password:z.string().min(1),

});

const emailSchema = z.object({
    email:z.string().email("Invalid Email"),
});

module.exports = {
    signupSchema,
    signinSchema,
    emailSchema
};