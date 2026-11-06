import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Person from './models/Person.js';
import { validateSlug } from './utils/slugs.js';

// Usage: npm run set-person-slug -- <personId> <slug>
// Gives a profile a readable address, e.g. /profile/basil-umeh.
dotenv.config();
const [personId, slug] = process.argv.slice(2);
const problem = validateSlug(slug);
if (!personId || problem) {
  console.error(problem || 'Usage: npm run set-person-slug -- <personId> <slug>');
  process.exit(1);
}
await connectDB();
const person = await Person.findByIdAndUpdate(personId, { slug }, { new: true });
console.log(person ? `Profile "${person.name}" is now at /profile/${person.slug}` : 'No person found with that id');
process.exit();
