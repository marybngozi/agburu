import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Lineage from '../models/Lineage.js';
import LineageMember from '../models/LineageMember.js';
import Person from '../models/Person.js';
import Relationship from '../models/Relationship.js';

const toSlug = (value = '') => value.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const canViewFullLineage = async (lineageId, user) => {
  if (!user) return false;
  if (user.role === 'platform_admin') return true;
  if (!user.assignedPersonId) return false;
  return Boolean(await LineageMember.exists({ lineageId, personId: user.assignedPersonId, isDeleted: false }));
};

export const requestLineage = async (req, res) => {
  try {
    const { name, slug: requestedSlug, description = '', visibility = 'public', requesterName, requesterEmail } = req.body;
    const slug = toSlug(requestedSlug || name);
    if (!name || !slug || !requesterName || !requesterEmail) {
      return res.status(400).json({ message: 'Name, slug, and requester contact details are required' });
    }
    const lineage = await Lineage.create({
      name, slug, description, visibility,
      requestedBy: { name: requesterName, email: requesterEmail }
    });
    res.status(201).json({ id: lineage._id, slug: lineage.slug, status: lineage.status });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'That lineage URL is already in use' : error.message });
  }
};

export const listPublicLineages = async (req, res) => {
  const lineages = await Lineage.find({ status: 'approved', visibility: 'public' })
    .select('name slug description branding visibility')
    .sort({ name: 1 });
  res.json(lineages);
};

export const getLineageTree = async (req, res) => {
  try {
    const lineage = await Lineage.findOne({ slug: req.params.slug, status: 'approved' });
    if (!lineage) return res.status(404).json({ message: 'Lineage not found' });

    const fullAccess = lineage.visibility === 'public' || await canViewFullLineage(lineage._id, req.user);
    const members = await LineageMember.find({ lineageId: lineage._id, isDeleted: false }).lean();
    const people = await Person.find({ _id: { $in: members.map((member) => member.personId) }, isDeleted: false }).lean();
    const peopleById = new Map(people.map((person) => [person._id.toString(), person]));
    const visiblePeople = members.flatMap((member) => {
      const person = peopleById.get(member.personId.toString());
      if (!person) return [];
      const record = fullAccess ? person : { _id: person._id, name: person.name, profilePicture: person.profilePicture };
      return [{ ...record, id: person._id.toString(), memberId: member._id.toString(), modeOfJoining: member.modeOfJoining, isRoot: member.isRoot }];
    });
    const relationships = await Relationship.find({ lineageId: lineage._id }).sort({ childOrder: 1 }).lean();
    res.json({
      lineage: { id: lineage._id, name: lineage.name, slug: lineage.slug, description: lineage.description, visibility: lineage.visibility, branding: lineage.branding, fullAccess },
      people: visiblePeople,
      relationships: relationships.map((relationship) => ({ ...relationship, id: relationship._id.toString() }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listPendingLineages = async (req, res) => {
  const lineages = await Lineage.find({ status: 'pending' }).sort({ createdAt: 1 });
  res.json(lineages);
};

export const listAdminLineages = async (req, res) => {
  const lineages = await Lineage.find().sort({ status: 1, name: 1 });
  res.json(lineages);
};

export const listLineageMembers = async (req, res) => {
  // .lean() matters here: without it, Mongoose calls Person's own toJSON
  // transform on the populated personId sub-document, which deletes _id in
  // favor of id — silently breaking every `member.personId._id` reference
  // on the frontend (the parent/child and marriage relationship pickers).
  const members = await LineageMember.find({ lineageId: req.params.lineageId, isDeleted: false })
    .populate('personId', 'name profilePicture gender')
    .sort({ isRoot: -1, createdAt: 1 })
    .lean();
  res.json(members);
};

export const addLineageMember = async (req, res) => {
  try {
    const { personId, modeOfJoining = 'birthed' } = req.body;
    const [lineage, person] = await Promise.all([Lineage.findById(req.params.lineageId), Person.findById(personId)]);
    if (!lineage) return res.status(404).json({ message: 'Lineage not found' });
    if (!person || person.isDeleted) return res.status(404).json({ message: 'Person not found' });
    const member = await LineageMember.create({ lineageId: lineage._id, personId: person._id, modeOfJoining });
    await AuditLog.create({ actorId: req.user._id, action: 'lineage.member_added', entityType: 'LineageMember', entityId: member._id });
    res.status(201).json(member);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'This person is already in the lineage' : error.message });
  }
};

export const createRelationship = async (req, res) => {
  try {
    const { type, parentPersonId, childPersonId, personIds = [] } = req.body;
    if (!['parent_child', 'marriage'].includes(type)) return res.status(400).json({ message: 'A valid relationship type is required' });
    if (type === 'parent_child' && (!parentPersonId || !childPersonId || parentPersonId === childPersonId)) {
      return res.status(400).json({ message: 'A distinct parent and child are required' });
    }
    if (type === 'marriage' && (personIds.length !== 2 || personIds[0] === personIds[1])) {
      return res.status(400).json({ message: 'Marriage requires two distinct people' });
    }
    const connectedPersonIds = type === 'parent_child' ? [parentPersonId, childPersonId] : personIds;
    const memberCount = await LineageMember.countDocuments({ lineageId: req.params.lineageId, personId: { $in: connectedPersonIds }, isDeleted: false });
    if (memberCount !== connectedPersonIds.length) return res.status(400).json({ message: 'Every connected person must belong to this lineage' });
    const childOrder = type === 'parent_child'
      ? await Relationship.countDocuments({ lineageId: req.params.lineageId, type, parentPersonId })
      : 0;
    const relationship = await Relationship.create({ lineageId: req.params.lineageId, type, parentPersonId, childPersonId, personIds, childOrder });
    await AuditLog.create({ actorId: req.user._id, action: 'relationship.created', entityType: 'Relationship', entityId: relationship._id });
    res.status(201).json(relationship);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'This relationship already exists' : error.message });
  }
};

export const approveLineage = async (req, res) => {
  const lineage = await Lineage.findByIdAndUpdate(req.params.id, {
    status: 'approved', approvedBy: req.user._id, approvedAt: new Date()
  }, { new: true });
  if (!lineage) return res.status(404).json({ message: 'Lineage request not found' });
  await AuditLog.create({ actorId: req.user._id, action: 'lineage.approved', entityType: 'Lineage', entityId: lineage._id });
  res.json(lineage);
};

export const setRootMember = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const member = await LineageMember.findOne({ _id: req.params.memberId, lineageId: req.params.lineageId, isDeleted: false }).session(session);
      if (!member) throw new Error('Lineage member not found');
      await LineageMember.updateMany({ lineageId: member.lineageId }, { isRoot: false }, { session });
      member.isRoot = true;
      await member.save({ session });
    });
    await AuditLog.create({ actorId: req.user._id, action: 'lineage.root_set', entityType: 'LineageMember', entityId: req.params.memberId });
    res.json({ message: 'Root member updated' });
  } catch (error) {
    res.status(error.message === 'Lineage member not found' ? 404 : 500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

export const reorderChildren = async (req, res) => {
  const { childIds } = req.body;
  if (!Array.isArray(childIds) || !childIds.length) return res.status(400).json({ message: 'Ordered child IDs are required' });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Operations sharing one transaction session can't run concurrently —
      // MongoDB rejects a second op on the same session before the first
      // finishes, with "Only servers in a sharded cluster can start a new
      // transaction at the active transaction number". Promise.all here was
      // firing every updateOne on the same session at once, so it broke as
      // soon as a parent had more than one child. Awaiting them in sequence
      // keeps them on the same transaction without racing it.
      for (let index = 0; index < childIds.length; index += 1) {
        await Relationship.updateOne({
          lineageId: req.params.lineageId,
          type: 'parent_child',
          parentPersonId: req.params.parentPersonId,
          childPersonId: childIds[index]
        }, { $set: { childOrder: index } }, { session });
      }
    });
    await AuditLog.create({ actorId: req.user._id, action: 'relationship.children_reordered', entityType: 'Lineage', entityId: req.params.lineageId, metadata: { parentPersonId: req.params.parentPersonId } });
    res.json({ message: 'Child order updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};
