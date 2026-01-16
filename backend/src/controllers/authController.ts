import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import crypto from 'crypto';
import { sendEmail } from '../services/notificationService';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, phone, assignedSite } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'worker',
    phone,
    assignedSite
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken((user._id as unknown) as string),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, employeeId, password } = req.body;

  const user = await User.findOne(email ? { email } : { employeeId });

  if (user && (await bcrypt.compare(password, user.password as string))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken((user._id as unknown) as string),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  const { email, employeeId } = req.body;
  const user = await User.findOne(email ? { email } : { employeeId });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  user.otpCode = code;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  // Send OTP via Email
  try {
    await sendEmail([user.email], 'Your Login OTP', `Your OTP for login is: ${code}. It expires in 5 minutes.`);
    console.log(`[AUTH] OTP for ${user.email}: ${code}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }

  res.json({ message: 'OTP sent' });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, employeeId, otp } = req.body;
  const user = await User.findOne(email ? { email } : { employeeId });
  if (!user || !user.otpCode || !user.otpExpires) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (user.otpCode !== otp || user.otpExpires.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: jwt.sign({ id: (user._id as unknown) as string }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' }),
  });
};
export const getMe = async (req: any, res: Response) => {
  const user = await User.findById(req.user._id).populate('assignedSite', 'name description location geofenceRadius isActive');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedSite: (user as any).assignedSite || null,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
