import Appointment from '../models/Appointment.js';
import Inventory from '../models/Inventory.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateFinalInvoicePDF } from '../utils/pdfGenerator.js';

// @desc    Get mechanic's assigned jobs
// @route   GET /api/mechanic/jobs
// @access  Private (Mechanic)
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Appointment.find({ 
      assignedMechanic: req.user._id 
    })
      .populate('customer', 'name email')
      .populate('vehicle', 'make model vehicleNo')
      .sort({ date: 1, time: 1 });
    
    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get mechanic statistics
// @route   GET /api/mechanic/stats
// @access  Private (Mechanic)
export const getMechanicStats = async (req, res) => {
  try {
    const total = await Appointment.countDocuments({ 
      assignedMechanic: req.user._id 
    });
    const scheduled = await Appointment.countDocuments({ 
      assignedMechanic: req.user._id, 
      status: 'Scheduled' 
    });
    const inProgress = await Appointment.countDocuments({ 
      assignedMechanic: req.user._id, 
      status: 'In Progress' 
    });
    const completed = await Appointment.countDocuments({ 
      assignedMechanic: req.user._id, 
      status: 'Completed' 
    });
    
    res.json({
      success: true,
      stats: {
        total,
        scheduled,
        inProgress,
        completed,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start a job
// @route   PUT /api/mechanic/jobs/:id/start
// @access  Private (Mechanic)
export const startJob = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.assignedMechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to start this job' 
      });
    }
    
    if (appointment.status !== 'Scheduled') {
      return res.status(400).json({ 
        message: `Cannot start job with status: ${appointment.status}` 
      });
    }
    
    appointment.status = 'In Progress';
    appointment.startedAt = new Date();
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Job started successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error starting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add part to job
// @route   POST /api/mechanic/jobs/:id/parts
// @access  Private (Mechanic)
export const addPart = async (req, res) => {
  try {
    const { inventoryItemId, quantity } = req.body;
    
    if (!inventoryItemId || !quantity) {
      return res.status(400).json({ 
        message: 'Please provide inventoryItemId and quantity' 
      });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.assignedMechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to modify this job' 
      });
    }
    
    const item = await Inventory.findById(inventoryItemId);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    if (item.quantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${item.quantity}` 
      });
    }
    
    // Deduct from inventory
    item.quantity -= quantity;
    await item.save();
    
    // Add to job card
    appointment.partsUsed.push({
      inventoryItem: item._id,
      name: item.name,
      quantity: quantity,
      salePrice: item.salePrice,
    });
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Part added successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error adding part:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add labor to job
// @route   POST /api/mechanic/jobs/:id/labor
// @access  Private (Mechanic)
export const addLabor = async (req, res) => {
  try {
    const { description, cost } = req.body;
    
    if (!description || cost === undefined) {
      return res.status(400).json({ 
        message: 'Please provide description and cost' 
      });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.assignedMechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to modify this job' 
      });
    }
    
    appointment.laborItems.push({
      description,
      cost: parseFloat(cost),
    });
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Labor added successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error adding labor:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete a job
// @route   PUT /api/mechanic/jobs/:id/complete
// @access  Private (Mechanic)
export const completeJob = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('vehicle', 'make model vehicleNo');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.assignedMechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to complete this job' 
      });
    }
    
    if (appointment.status !== 'In Progress') {
      return res.status(400).json({ 
        message: `Cannot complete job with status: ${appointment.status}` 
      });
    }
    
    // Calculate totals
    let partsTotal = 0;
    appointment.partsUsed.forEach(part => {
      partsTotal += part.quantity * part.salePrice;
    });
    
    let laborTotal = 0;
    appointment.laborItems.forEach(labor => {
      laborTotal += labor.cost;
    });
    
    appointment.subtotal = partsTotal + laborTotal;
    
    // Apply discount if eligible
    if (appointment.discountEligible) {
      appointment.finalCost = appointment.subtotal * 0.95; // 5% discount
    } else {
      appointment.finalCost = appointment.subtotal;
    }
    
    appointment.status = 'Completed';
    appointment.finishedAt = new Date();
    await appointment.save();
    
    // Generate and send invoice
    try {
      const pdfBuffer = await generateFinalInvoicePDF(appointment);
      
      const emailText = `Dear ${appointment.customer.name},

Your vehicle service has been completed!

Vehicle: ${appointment.vehicle.make} ${appointment.vehicle.model} (${appointment.vehicle.vehicleNo})
Service Type: ${appointment.serviceType}

Subtotal: $${appointment.subtotal.toFixed(2)}
${appointment.discountEligible ? 'Discount (5%): -$' + (appointment.subtotal * 0.05).toFixed(2) + '\n' : ''}
Total Amount: $${appointment.finalCost.toFixed(2)}

Please find your detailed invoice attached.

Thank you for your business!`;
      
      await sendEmail(
        appointment.customer.email,
        'Service Completed - Invoice',
        emailText,
        [{
          filename: `invoice-${appointment._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }]
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Job completed successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};