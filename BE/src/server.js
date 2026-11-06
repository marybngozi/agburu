import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

connectDB();

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});