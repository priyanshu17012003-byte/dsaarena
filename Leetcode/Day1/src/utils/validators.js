const validator = require('validator')

const validate=(data)=>{
  
   const mandatoryField=['firstName','email','password'];

   const IsAllowed=mandatoryField.every((k)=>Object.keys(data).includes(k));

  if(!IsAllowed)
    throw new Error("Some field missing");

  if(!validator.isEmail(data.email))
    throw new Error("Invalid email");

  if(!validator.isStrongPassword(data.password))
    throw new Error("Weak password");



}
module.exports=validate;