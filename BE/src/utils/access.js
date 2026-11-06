import Lineage from '../models/Lineage.js';
import LineageMember from '../models/LineageMember.js';
import Relationship from '../models/Relationship.js';

export const isPlatformAdmin = (user) => user?.role === 'platform_admin';

// Which lineages' people the caller may see in full. `null` means "all"
// (platform_admin). Everyone else sees approved public lineages, plus any
// lineage they own, plus any lineage that contains the profile they are
// assigned to edit. People who are only in a private/pending lineage the
// caller can't see are therefore invisible to them.
export const getVisibleLineageIds = async (user) => {
  if (isPlatformAdmin(user)) return null;
  const ids = new Set((await Lineage.find({ status: 'approved', visibility: 'public' }).distinct('_id')).map(String));
  if (user?.role === 'lineage_owner') {
    (await Lineage.find({ ownerId: user._id }).distinct('_id')).forEach((id) => ids.add(String(id)));
  }
  if (user?.assignedPersonId) {
    (await LineageMember.find({ personId: user.assignedPersonId, isDeleted: false }).distinct('lineageId'))
      .forEach((id) => ids.add(String(id)));
  }
  return [...ids];
};

export const filterVisiblePeople = async (people, user, visibleLineageIds) => {
  if (visibleLineageIds === null) return people;
  if (!people.length) return people;
  const memberIds = new Set(
    (await LineageMember.find({
      personId: { $in: people.map((person) => person._id) },
      lineageId: { $in: visibleLineageIds },
      isDeleted: false
    }).distinct('personId')).map(String)
  );
  return people.filter((person) =>
    memberIds.has(String(person._id)) || (user && person.createdBy && String(person.createdBy) === String(user._id))
  );
};

// parentId / childrenIds / partnerIds on the Person document are a legacy
// shape: nothing writes them any more, but the profile-page family tree
// still reads them. The Relationship collection is the source of truth, so
// they're derived from it here at read time. A person with no relationship
// records (legacy data that predates the migration) keeps whatever the
// document itself holds.
export const withRelationshipFields = async (people, visibleLineageIds) => {
  if (!people.length) return people;
  const ids = people.map((person) => String(person.id || person._id));
  const filter = { $or: [{ parentPersonId: { $in: ids } }, { childPersonId: { $in: ids } }, { personIds: { $in: ids } }] };
  if (visibleLineageIds !== null) filter.lineageId = { $in: visibleLineageIds };
  const relationships = await Relationship.find(filter).sort({ childOrder: 1 }).lean();

  const info = new Map(ids.map((id) => [id, { parents: new Set(), children: new Set(), partners: new Set() }]));
  relationships.forEach((relationship) => {
    if (relationship.type === 'parent_child') {
      const parent = String(relationship.parentPersonId);
      const child = String(relationship.childPersonId);
      info.get(parent)?.children.add(child);
      info.get(child)?.parents.add(parent);
    } else {
      const [first, second] = (relationship.personIds || []).map(String);
      info.get(first)?.partners.add(second);
      info.get(second)?.partners.add(first);
    }
  });

  return people.map((person) => {
    const entry = info.get(String(person.id || person._id));
    if (!entry || (!entry.parents.size && !entry.children.size && !entry.partners.size)) return person;
    return {
      ...person,
      parentId: [...entry.parents][0] || null,
      childrenIds: [...entry.children],
      partnerIds: [...entry.partners]
    };
  });
};
