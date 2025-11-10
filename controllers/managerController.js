import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import { sendEmail } from '../utils/sendEmail.js';
import bcrypt from 'bcryptjs';

/**
 * @desc    Create a new mechanic (Manager only)
 * @route   POST /api/manager/mechanics
 * @access  Private (Manager)
 */
export const createMechanic = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create mechanic
    const mechanic = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Mechanic',
    });

    res.status(201).json({
      _id: mechanic._id,
      name: mechanic.name,
      email: mechanic.email,
      role: mechanic.role,
      message: 'Mechanic created successfully.',
    });
  } catch (error) {
    console.error('Error creating mechanic:', error);
    res.status(500).json({ message: 'Server error while creating mechanic.' });
  }
};

/**
 * @desc    Get all appointments that are not yet assigned to a mechanic
 * @route   GET /api/manager/appointments/unassigned
 * @access  Private (Manager)
 */
export const getUnassignedJobs = async (req, res) => {
  try {
    const unassignedAppointments = await Appointment.find({
      status: 'Scheduled',
      $or: [
        { assignedMechanic: null },
        { assignedMechanic: { $exists: false } }
      ]
    })
      .populate('customer', 'name email')
      .populate('vehicle', 'make model vehicleNo')
      .sort({ date: 1, time: 1 });

    res.json({ appointments: unassignedAppointments });
  } catch (error) {
    console.error('Error fetching unassigned appointments:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Assign a mechanic to a specific appointment
 * @route   PUT /api/manager/appointments/:id/assign
 * @access  Private (Manager)
 */
export const assignJobToMechanic = async (req, res) => {
  try {
    const { mechanicId } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.assignedMechanic) {
      return res.status(400).json({ message: 'This appointment is already assigned.' });
    }

    const mechanic = await User.findById(mechanicId);
    if (!mechanic || mechanic.role !== 'Mechanic') {
      return res.status(404).json({ message: 'Mechanic not found or user is not a mechanic.' });
    }

    appointment.assignedMechanic = mechanicId;
    const updatedAppointment = await appointment.save();

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error assigning appointment:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Get a list of all users with the role 'Mechanic'
 * @route   GET /api/manager/mechanics
 * @access  Private (Manager)
 */
export const getMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'Mechanic' }).select('name email');
    res.json({ mechanics });
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Delete a mechanic
 * @route   DELETE /api/manager/mechanics/:id
 * @access  Private (Manager)
 */
export const deleteMechanic = async (req, res) => {
  try {
    const mechanic = await User.findById(req.params.id);

    if (!mechanic || mechanic.role !== 'Mechanic') {
      return res.status(404).json({ message: 'Mechanic not found.' });
    }

    await mechanic.deleteOne();
    res.json({ message: 'Mechanic removed successfully.' });
  } catch (error) {
    console.error('Error deleting mechanic:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Receive new stock and update inventory quantity
 * @route   POST /api/manager/inventory/:id/receive
 * @access  Private (Manager)
 */
export const receiveInventoryStock = async (req, res) => {
  try {
    const { quantityReceived } = req.body;
    const itemId = req.params.id;

    if (!quantityReceived || quantityReceived <= 0) {
      return res.status(400).json({ message: 'Please provide a valid quantity.' });
    }

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    item.quantity += quantityReceived;
    const updatedItem = await item.save();

    res.json({ message: 'Stock received successfully', item: updatedItem });
  } catch (error) {
    console.error('Error receiving stock:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Send a manual order email to a supplier for a low-stock item
 * @route   POST /api/manager/inventory/:id/order
 * @access  Private (Manager)
 */
export const orderInventoryItem = async (req, res) => {
  try {
    const { orderQuantity, supplierEmail } = req.body;
    const itemId = req.params.id;

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    if (!supplierEmail || !orderQuantity) {
        return res.status(400).json({ message: 'Supplier email and order quantity are required.' });
    }

    const emailText = `
      Hello,

      This is an order request from the Vehicle Service Center.
      Please prepare the following item for shipment:

      Item Name: ${item.name}
      Quantity: ${orderQuantity} ${item.unit}

      Please reply to this email to confirm the order and provide an estimated delivery date.

      Thank you,
      Management
    `;

    await sendEmail(
        supplierEmail,
        `Stock Order Request: ${item.name}`,
        emailText
    );

    res.json({ message: 'Order email has been sent to the supplier.' });
  } catch (error) {
    console.error('Error sending order email:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};