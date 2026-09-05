import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  year: { type: Number, required: true },
});

counterSchema.index({ _id: 1, year: 1 }, { unique: true });

export const Counter = mongoose.model('Counter', counterSchema);

export async function getNextGstApplicationId() {
  const year = new Date().getFullYear();
  const doc = await Counter.findOneAndUpdate(
    { _id: 'gstApp', year },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const padded = String(doc.seq).padStart(5, '0');
  return `SSTM-GST-${year}-${padded}`;
}

export default Counter;
