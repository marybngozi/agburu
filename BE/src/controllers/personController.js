import mongoose from 'mongoose';
import Person from '../models/Person.js';
import { filterVisiblePeople, getVisibleLineageIds, isPlatformAdmin, withRelationshipFields } from '../utils/access.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { validateSlug } from '../utils/slugs.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asString = (value) => (typeof value === 'string' ? value : '');

// Only these fields are ever taken from a request body. The old code passed
// the whole parsed body straight into the model, which let any caller set
// fields like isDeleted/createdBy or rewrite other people's relationship
// arrays. `slug` is added for platform admins only.
const parsePersonData = (req) => {
  let raw;
  try {
    raw = JSON.parse(req.body?.data || '{}');
  } catch {
    const error = new Error('Invalid person data');
    error.status = 400;
    throw error;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    const error = new Error('Invalid person data');
    error.status = 400;
    throw error;
  }
  const data = {};
  ['title', 'titledName', 'name', 'birthDate', 'biographySummary'].forEach((field) => {
    if (field in raw) data[field] = asString(raw[field]).trim().slice(0, field === 'biographySummary' ? 1000 : 200);
  });
  if ('gender' in raw) data.gender = raw.gender;
  if ('modeOfJoining' in raw) data.modeOfJoining = raw.modeOfJoining;
  if ('deathDate' in raw) data.deathDate = raw.deathDate ? asString(raw.deathDate).slice(0, 40) : null;
  if ('detailedBiography' in raw) data.detailedBiography = sanitizeRichText(raw.detailedBiography).slice(0, 200000);
  if (Array.isArray(raw.milestones)) {
    data.milestones = raw.milestones
      .slice(0, 100)
      .map((milestone) => ({ date: asString(milestone?.date).slice(0, 60), description: asString(milestone?.description).slice(0, 1000) }))
      .filter((milestone) => milestone.date && milestone.description);
  }
  if (isPlatformAdmin(req.user) && 'slug' in raw) {
    const slug = asString(raw.slug).trim().toLowerCase();
    if (slug) {
      const problem = validateSlug(slug);
      if (problem || mongoose.isValidObjectId(slug)) {
        const error = new Error(problem || 'That profile URL is not allowed');
        error.status = 400;
        throw error;
      }
      data.slug = slug;
    }
  }
  return data;
};

const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: 'That profile URL is already in use' });
  return res.status(500).json({ message: error.message });
};

// Directory search. A platform_admin sees everyone; a lineage_owner sees only
// the people they created themselves — which is also exactly the set of
// people they're allowed to add to a lineage or edit.
export const getPeople = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = asString(req.query.search).trim().slice(0, 100);
    const admin = isPlatformAdmin(req.user);

    const query = {};
    if (!admin) query.createdBy = req.user._id;
    if (!(admin && req.query.showDeleted === 'true')) query.isDeleted = false;
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };

    const [total, people] = await Promise.all([
      Person.countDocuments(query),
      Person.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit)
    ]);
    res.json({ people, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    sendError(res, error);
  }
};

// Batch fetch (used by the profile page's lazily-loaded family tree). Only
// people the caller is allowed to see come back; the rest are silently left out.
export const getPeopleByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length > 200 || !ids.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'An array of up to 200 valid ids is required' });
    }
    const visibleLineageIds = await getVisibleLineageIds(req.user);
    const found = await Person.find({ _id: { $in: ids }, isDeleted: false });
    const visible = await filterVisiblePeople(found, req.user, visibleLineageIds);
    res.json(await withRelationshipFields(visible.map((person) => person.toJSON()), visibleLineageIds));
  } catch (error) {
    sendError(res, error);
  }
};

// Accepts either a Mongo id or a profile slug.
export const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = mongoose.isValidObjectId(id)
      ? await Person.findById(id)
      : await Person.findOne({ slug: id.toLowerCase() });
    if (!person || person.isDeleted) return res.status(404).json({ message: 'Member not found' });

    const visibleLineageIds = await getVisibleLineageIds(req.user);
    const [visible] = await filterVisiblePeople([person], req.user, visibleLineageIds);
    if (!visible) return res.status(404).json({ message: 'Member not found' });

    const [result] = await withRelationshipFields([visible.toJSON()], visibleLineageIds);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
};

export const createPerson = async (req, res) => {
  try {
    const data = parsePersonData(req);
    if (req.file) data.profilePicture = await uploadToCloudinary(req.file.buffer);
    const person = await Person.create({ ...data, createdBy: req.user._id });
    res.status(201).json(person);
  } catch (error) {
    sendError(res, error);
  }
};

export const updatePerson = async (req, res) => {
  try {
    const data = parsePersonData(req);
    if (req.file) data.profilePicture = await uploadToCloudinary(req.file.buffer);
    const person = await Person.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!person) return res.status(404).json({ message: 'Member not found' });
    res.json(person);
  } catch (error) {
    sendError(res, error);
  }
};

export const toggleSoftDelete = async (req, res) => {
  try {
    if (typeof req.body?.isDeleted !== 'boolean') return res.status(400).json({ message: 'isDeleted must be true or false' });
    const person = await Person.findByIdAndUpdate(req.params.id, { isDeleted: req.body.isDeleted }, { new: true });
    if (!person) return res.status(404).json({ message: 'Member not found' });
    res.json(person);
  } catch (error) {
    sendError(res, error);
  }
};
