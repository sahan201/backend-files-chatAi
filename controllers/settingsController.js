import Settings from '../models/Settings.js';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private (Manager)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        offPeakDays: ['Monday', 'Tuesday']
      });
    }
    
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Manager)
export const updateSettings = async (req, res) => {
  try {
    const { offPeakDays } = req.body;
    
    if (!offPeakDays || !Array.isArray(offPeakDays)) {
      return res.status(400).json({ 
        message: 'Please provide offPeakDays as an array' 
      });
    }
    
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = offPeakDays.filter(day => !validDays.includes(day));
    
    if (invalidDays.length > 0) {
      return res.status(400).json({ 
        message: `Invalid days: ${invalidDays.join(', ')}` 
      });
    }
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ offPeakDays });
    } else {
      settings.offPeakDays = offPeakDays;
      await settings.save();
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};