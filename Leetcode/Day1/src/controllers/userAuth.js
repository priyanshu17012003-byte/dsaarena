const redisClient = require('../config/redis');
const Submission = require('../models/submission');
const User = require('../models/user')
const validate = require('../utils/validators')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, email, password } = req.body;
    console.log("BODY ", req.body);

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'user';

    const user = await User.create(req.body);
    const token = jwt.sign({ _id: user._id, email: email , role:'user'}, process.env.JWT_KEY, { expiresIn: 60 * 60 });

     const reply = {
      firstName:user.firstName,
      email:user.email,
      _id:user._id
    }

    res.cookie('token', token, { maxAge: 60 * 60 * 1000 });
    res.status(201).json({ 
      user:reply,
      message:"Registered Successfully"
     });

  } catch (err) {
    res.status(400).json({ message: err.message });
    
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({email: email });

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const reply = {
      firstName:user.firstName,
      email:user.email,
      _id:user._id,
      role: user.role 
    }

    const token = jwt.sign({ _id: user._id, email: email , role:user.role}, process.env.JWT_KEY, { expiresIn: 60 * 60 });
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 });
    res.status(200).json({
      user:reply,
      message:"Loggin Successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    
    const {token} = req.cookies;

    const payload = jwt.decode(token);


    await redisClient.set(`token:${token}`,'Blocked');
    await redisClient.expireAt(`token:${token}`,payload.exp);

    res.cookie("token",null,{expires:new Date(Date.now())});
    res.send("Logged Out Successfully");

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminRegister = async (req, res) => {

   try {
    validate(req.body);

    const { firstName, email, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'admin';

    const user = await User.create(req.body);
    const token = jwt.sign({ _id: user._id, email: email , role:'admin'}, process.env.JWT_KEY, { expiresIn: 60 * 60 });
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 });
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

const deleteProfile = async (req,res)=>{
  try{

    await User.findByIdAndDelete(userId);

    

  }
  catch(err){
     res.status(500).send("Internal server error:"+err);
  }
}


module.exports={register,login,logout,adminRegister,deleteProfile};
