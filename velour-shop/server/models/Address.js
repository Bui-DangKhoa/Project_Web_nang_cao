const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
        label: { type: String, default: 'Mặc định', trim: true },
        name: { type: String, trim: true },
        street: { type: String, default: '', trim: true },
        city: { type: String, default: 'Hồ Chí Minh', trim: true },
        district: { type: String, default: '', trim: true },
        phone: { type: String, default: '', trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true },
);

module.exports = mongoose.models.Address || mongoose.model('Address', addressSchema);
