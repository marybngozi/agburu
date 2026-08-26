import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Lineage from './models/Lineage.js';
import LineageMember from './models/LineageMember.js';
import Person from './models/Person.js';
import Relationship from './models/Relationship.js';

dotenv.config();

const slug = process.env.LEGACY_LINEAGE_SLUG;
const name = process.env.LEGACY_LINEAGE_NAME;

if (!slug || !name) {
  throw new Error('Set LEGACY_LINEAGE_SLUG and LEGACY_LINEAGE_NAME before running this migration');
}

await connectDB();

try {
  let lineage = await Lineage.findOne({ slug });
  if (!lineage) {
    lineage = await Lineage.create({
      name,
      slug,
      status: 'approved',
      visibility: 'public',
      requestedBy: { name: 'Legacy data migration', email: process.env.LEGACY_LINEAGE_CONTACT_EMAIL || 'admin@agburu.com' },
      approvedAt: new Date()
    });
  }

  const people = await Person.find({ isDeleted: false }).lean();
  const personIdSet = new Set(people.map((person) => person._id.toString()));
  for (const person of people) {
    await LineageMember.updateOne(
      { lineageId: lineage._id, personId: person._id },
      { $setOnInsert: { modeOfJoining: person.modeOfJoining || 'birthed', isRoot: false } },
      { upsert: true }
    );
  }

  for (const person of people) {
    const childIds = new Set([...(person.childrenIds || []), ...(person.parentId ? [] : [])]);
    for (const childId of childIds) {
      if (!personIdSet.has(childId)) continue;
      await Relationship.updateOne(
        { lineageId: lineage._id, type: 'parent_child', parentPersonId: person._id, childPersonId: childId },
        { $setOnInsert: { childOrder: [...childIds].indexOf(childId) } },
        { upsert: true }
      );
    }
    if (person.parentId && personIdSet.has(person.parentId)) {
      await Relationship.updateOne(
        { lineageId: lineage._id, type: 'parent_child', parentPersonId: person.parentId, childPersonId: person._id },
        { $setOnInsert: { childOrder: 0 } },
        { upsert: true }
      );
    }
    for (const partnerId of person.partnerIds || []) {
      if (!personIdSet.has(partnerId) || person._id.toString() > partnerId) continue;
      const marriageExists = await Relationship.exists({
        lineageId: lineage._id,
        type: 'marriage',
        personIds: { $all: [person._id, partnerId] }
      });
      if (!marriageExists) {
        await Relationship.create({ lineageId: lineage._id, type: 'marriage', personIds: [person._id, partnerId] });
      }
    }
  }
  console.log(`Migrated ${people.length} people into /${lineage.slug}. Set the root manually in Admin → Manage Lineages.`);
} finally {
  await mongoose.disconnect();
}
