const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PermissionSchema = new Schema ({
    job: {
        type: Schema.ObjectId,
        ref: 'Job'
    },

    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },

    actions: [{
        type: String,
        enum: ['read', 'update', 'create']
    }]
})

module.exports = mongoose.model('Permission', PermissionSchema);