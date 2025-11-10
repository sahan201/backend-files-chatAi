import mongoose from 'mongoose';

const laborChargeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  }
});

const partUsedSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  salePrice: {
    type: Number,
    required: true,
  }
});

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vehicle',
    },
    serviceType: {
      type: String,
      required: [true, 'Please specify a service type.'],
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    assignedMechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
    },
    description: {
      type: String,
    },
    // Digital Job Card Fields
    partsUsed: [partUsedSchema],
    laborItems: [laborChargeSchema],
    // Billing Fields
    subtotal: {
      type: Number,
      default: 0
    },
    finalCost: {
      type: Number,
      default: 0
    },
    discountEligible: {
      type: Boolean,
      default: false,
    },
    // Timestamps
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
    // Feedback Tracking
    feedbackSubmitted: {
        type: Boolean,
        default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;