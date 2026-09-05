import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    lastLoginAt: Date,
    lastLoginIp: String,
  },
  { timestamps: true }
);

adminUserSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

adminUserSchema.methods.checkPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const AdminUser = mongoose.model('AdminUser', adminUserSchema);
export default AdminUser;
