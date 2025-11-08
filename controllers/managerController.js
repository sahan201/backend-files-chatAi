import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// @desc    Get unassigned appointments
// @route   GET /api/manager/appointments/unassigned
// @access  Private (Manager)
export const getUnassignedAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      assignedMechanic: null,
      status: 'Scheduled'
    })
      .populate('customer', 'name email')
      .populate('vehicle', 'make model vehicleNo')
      .sort({ date: 1, time: 1 });
    
    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Error fetching unassigned appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all mechanics
// @route   GET /api/manager/mechanics
// @access  Private (Manager)
export const getMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'Mechanic' })
      .select('-password')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: mechanics.length,
      mechanics,
    });
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign appointment to mechanic
// @route   PUT /api/manager/appointments/:id/assign
// @access  Private (Manager)
export const assignAppointment = async (req, res) => {
  try {
    const { mechanicId } = req.body;
    
    if (!mechanicId) {
      return res.status(400).json({ message: 'Please provide mechanicId' });
    }
    
    const mechanic = await User.findOne({ _id: mechanicId, role: 'Mechanic' });
    if (!mechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointment.assignedMechanic = mechanicId;
    await appointment.save();
    
    await appointment.populate('assignedMechanic', 'name email');
    await appointment.populate('customer', 'name email');
    await appointment.populate('vehicle', 'make model vehicleNo');
    
    res.json({
      success: true,
      message: 'Appointment assigned successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error assigning appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/manager/stats
// @access  Private (Manager)
export const getDashboardStats = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const scheduled = await Appointment.countDocuments({ status: 'Scheduled' });
    const inProgress = await Appointment.countDocuments({ status: 'In Progress' });
    const completed = await Appointment.countDocuments({ status: 'Completed' });
    const cancelled = await Appointment.countDocuments({ status: 'Cancelled' });
    const unassigned = await Appointment.countDocuments({ 
      assignedMechanic: null, 
      status: 'Scheduled' 
    });
    
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalMechanics = await User.countDocuments({ role: 'Mechanic' });
    
    res.json({
      success: true,
      stats: {
        appointments: {
          total: totalAppointments,
          scheduled,
          inProgress,
          completed,
          cancelled,
          unassigned,
        },
        users: {
          customers: totalCustomers,
          mechanics: totalMechanics,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create mechanic account
// @route   POST /api/manager/mechanics
// @access  Private (Manager)
export const createMechanic = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide name, email, and password' 
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const mechanic = await User.create({
      name,
      email,
      password,
      role: 'Mechanic',
    });
    
    res.status(201).json({
      success: true,
      message: 'Mechanic created successfully',
      mechanic: {
        _id: mechanic._id,
        name: mechanic.name,
        email: mechanic.email,
        role: mechanic.role,
      },
    });
  } catch (error) {
    console.error('Error creating mechanic:', error);
    res.status(500).json({ message: 'Server error' });
  }
};