const mongoose = require('mongoose');
const Submission = require('./submission');
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 10
  },
  lastName: {
    type: String,
    minLength: 3,
    maxLength: 10
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    immutable: true
  },
  age: {
    type: Number,
    min: 6,
    max: 80
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
 problemSolved:{
  type:[{
    type:Schema.Types.ObjectId,
    ref:'problem',
    default: []
  }],
  unique:true
 },
  password: {
    type: String
  }
}, {
  timestamps: true
});
userSchema.index({ email: 1 }, { unique: true });
userSchema.post('findOneAndDelete',async function (userInfo){
  if(userInfo){
    await mongoose.model('submission').deleteMany({userId: userInfo._id });
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;

