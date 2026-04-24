import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { registerSchema, loginSchema } from '../utils/validators';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = registerSchema.parse(req.body);
    const { name, email, password, role } = parsedData;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, error: { message: 'User already exists' } });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Custom ID (P001, D001, A001)
    const prefix = role === 'driver' ? 'D' : role === 'admin' ? 'A' : 'P';
    const lastUser = await User.findOne({ role }).sort({ createdAt: -1 });
    
    let nextNum = 1;
    if (lastUser && lastUser.customId) {
      const match = lastUser.customId.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const customId = `${prefix}${nextNum.toString().padStart(3, '0')}`;

    const user: any = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      customId
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, error: { message: error.errors[0].message } });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = loginSchema.parse(req.body);
    const { email, password } = parsedData;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, error: { message: error.errors[0].message } });
      return;
    }
    next(error);
  }
};
