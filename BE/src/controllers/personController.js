import Person from '../models/Person.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

// Get Paginated Members with Search & Soft Delete Toggle
export const getPeople = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const showDeleted = req.query.showDeleted === 'true';

    const query = {};
    if (!showDeleted) query.isDeleted = false;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const total = await Person.countDocuments(query);
    const people = await Person.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      people,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Batch fetch nodes by IDs (For Vue Flow Lazy Loading)
export const getPeopleByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Array of ids required' });
    }
    const people = await Person.find({ _id: { $in: ids }, isDeleted: false });
    res.json(people);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Default Anchor Root Node
export const getRootPerson = async (req, res) => {
  try {
    const root = await Person.findOne({ isDeleted: false }).sort({ createdAt: 1 });
    if (!root) return res.status(404).json({ message: 'No records found' });
    res.json(root);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Person Profile
export const getPersonById = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person || person.isDeleted) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Member
export const createPerson = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    
    // Upload picture to Cloudinary if supplied
    if (req.file) {
      data.profilePicture = await uploadToCloudinary(req.file.buffer);
    }

    const person = new Person(data);
    await person.save();

    // Reciprocal relationships update
    if (person.parentId) {
      await Person.findByIdAndUpdate(person.parentId, { $addToSet: { childrenIds: person._id.toString() } });
    }
    if (person.partnerIds?.length) {
      await Person.updateMany({ _id: { $in: person.partnerIds } }, { $addToSet: { partnerIds: person._id.toString() } });
    }
    if (person.childrenIds?.length) {
      await Person.updateMany({ _id: { $in: person.childrenIds } }, { parentId: person._id.toString() });
    }

    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Member
export const updatePerson = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');

    if (req.file) {
      data.profilePicture = await uploadToCloudinary(req.file.buffer);
    }

    const person = await Person.findByIdAndUpdate(req.params.id, data, { new: true });
    
    if (person.parentId) {
      await Person.findByIdAndUpdate(person.parentId, { $addToSet: { childrenIds: person._id.toString() } });
    }
    if (person.partnerIds?.length) {
      await Person.updateMany({ _id: { $in: person.partnerIds } }, { $addToSet: { partnerIds: person._id.toString() } });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft Delete / Restore Toggle
export const toggleSoftDelete = async (req, res) => {
  try {
    const { isDeleted } = req.body;
    const person = await Person.findByIdAndUpdate(req.params.id, { isDeleted }, { new: true });
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};