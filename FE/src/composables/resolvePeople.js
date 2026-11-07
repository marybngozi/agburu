import { api } from "@/api";

// Turns person ids into person records: from `known` where possible, and by
// asking the API for the rest (e.g. a spouse who isn't a member of this map).
export const resolvePeople = async (ids, known = []) => {
  const wanted = [...new Set(ids || [])];
  const byId = new Map(known.map((person) => [person.id, person]));
  const missing = wanted.filter((id) => !byId.has(id));
  if (missing.length) {
    try {
      (await api.getPeopleByIds(missing)).forEach((person) => byId.set(person.id, person));
    } catch {
      /* fall back to whoever we already know */
    }
  }
  return wanted.map((id) => byId.get(id)).filter(Boolean);
};
