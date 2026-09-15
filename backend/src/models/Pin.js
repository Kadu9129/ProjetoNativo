const mongoose = require('mongoose');

const PinSchema = new mongoose.Schema(
  {
    clientId: { type: String, trim: true, maxlength: 100, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Pin', PinSchema);

