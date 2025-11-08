import Feedback from '../models/Feedback.js';
import Appointment from '../models/Appointment.js';

// @desc    Submit feedback for completed appointment
// @route   POST /api/feedback
// @access  Private (Customer)
export const submitFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    
    if (!appointmentId || !rating) {
      return res.status(400).json({ 
        message: 'Please provide appointmentId and rating' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to submit feedback for this appointment' 
      });
    }
    
    if (appointment.status !== 'Completed') {
      return res.status(400).json({ 
        message: 'Can only submit feedback for completed appointments' 
      });
    }
    
    const existingFeedback = await Feedback.findOne({ appointment: appointmentId });
    if (existingFeedback) {
      return res.status(400).json({ 
        message: 'Feedback already submitted for this appointment' 
      });
    }
    
    const feedback = await Feedback.create({
      appointment: appointmentId,
      customer: req.user._id,
      rating,
      comment: comment || '',
    });
    
    appointment.feedbackSubmitted = true;
    await appointment.save();
    
    await feedback.populate('customer', 'name email');
    await feedback.populate('appointment', 'serviceType date');
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all feedback (Manager)
// @route   GET /api/feedback
// @access  Private (Manager)
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('customer', 'name email')
      .populate({
        path: 'appointment',
        select: 'serviceType date assignedMechanic',
        populate: {
          path: 'assignedMechanic',
          select: 'name',
        }
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get customer's feedback
// @route   GET /api/feedback/my-feedback
// @access  Private (Customer)
export const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ customer: req.user._id })
      .populate('appointment', 'serviceType date')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get average rating by mechanic
// @route   GET /api/feedback/mechanic-ratings
// @access  Private (Manager)
export const getMechanicRatings = async (req, res) => {
  try {
    const ratings = await Feedback.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentData'
        }
      },
      { $unwind: '$appointmentData' },
      {
        $group: {
          _id: '$appointmentData.assignedMechanic',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mechanic'
        }
      },
      { $unwind: '$mechanic' },
      {
        $project: {
          mechanicId: '$_id',
          mechanicName: '$mechanic.name',
          mechanicEmail: '$mechanic.email',
          averageRating: { $round: ['$averageRating', 2] },
          totalReviews: 1
        }
      },
      { $sort: { averageRating: -1 } }
    ]);
    
    res.json({
      success: true,
      count: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error('Error fetching mechanic ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};