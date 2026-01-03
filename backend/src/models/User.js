const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String, // Base64 encoded image
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'OUT', 'LEAVE'],
    default: 'ACTIVE'
  },
  consistencyScore: {
    type: Number,
    default: 100
  },
  consecutiveAbsences: {
    type: Number,
    default: 0
  },
  pendingAbsenceReason: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
