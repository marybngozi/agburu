<template>
  <main class="max-w-275 mx-auto my-8 px-4 font-sans text-slate-900 dark:text-slate-100">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="m-0">Lineages</h1>
        <p class="text-slate-500 dark:text-slate-400">Approve requests, add members, and set each map's root.</p>
      </div>
      <button
        @click="$router.push('/admin')"
        class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        Back to directory
      </button>
    </div>
    <p v-if="error" class="text-red-700 dark:text-red-400">{{ error }}</p>
    <section class="grid grid-cols-1 sm:grid-cols-[320px_1fr] gap-4">
      <div class="card p-4">
        <h2>All lineages</h2>
        <button
          v-for="lineage in lineages"
          :key="lineage._id"
          :class="[
            'w-full grid gap-1 text-left my-2 rounded-md border p-2.8 cursor-pointer dark:text-slate-100',
            selected?._id === lineage._id
              ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
          ]"
          @click="selectLineage(lineage)"
        >
          <strong>{{ lineage.name }}</strong>
          <small class="text-slate-500 dark:text-slate-400"
            >/{{ lineage.slug }} · {{ lineage.status }} ·
            {{ lineage.visibility }}</small
          >
        </button>
      </div>

      <div v-if="selected" class="card p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="m-0">{{ selected.name }}</h2>
            <p class="text-slate-500 dark:text-slate-400">/{{ selected.slug }}</p>
          </div>
          <button
            v-if="selected.status === 'pending'"
            @click="approve"
            class="rounded-[5px] border border-slate-300 bg-slate-900 px-2.8 py-1.8 text-sm text-white hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Approve lineage
          </button>
        </div>

        <div v-if="selected.status === 'approved'">
          <h3 ref="addPersonSectionRef">Add a person</h3>
          <p class="text-slate-500 text-[0.85rem] mt-0.8 mb-3 dark:text-slate-400">
            Search for an existing person — including one already in this
            lineage but still "Not yet connected" — or create a new one and
            come back here. Either way, choose how they connect to the family
            so they never sit unconnected.
          </p>
          <input
            v-model="search"
            @input="searchPeople"
            placeholder="Search people by name"
            class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />

          <div
            v-for="person in addCandidates"
            :key="person.id"
            class="rounded-lg border border-slate-200 bg-slate-50 p-3 my-2.4 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div class="flex items-center gap-2 mb-2.2 flex-wrap">
              <RouterLink
                :to="{ name: 'profile', params: { id: person.id } }"
                target="_blank"
                rel="noopener"
                class="text-blue-700 font-semibold no-underline hover:underline dark:text-blue-400"
              >
                {{ person.name }}
              </RouterLink>
              <span
                v-if="person.__isNew"
                class="badge bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                >Newly created</span
              >
              <span
                v-else-if="person.__pinned"
                class="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                >Already a member — connect below</span
              >
            </div>
            <div class="flex flex-col items-stretch gap-2.4 flex-wrap sm:flex-row sm:items-end">
              <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 w-full sm:w-auto sm:min-w-35">
                Membership
                <select
                  v-model="joining[person.id]"
                  class="w-full rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="birthed">Birthed</option>
                  <option value="married">Married</option>
                  <option value="adopted">Adopted</option>
                </select>
              </label>
              <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 w-full sm:w-auto sm:min-w-35">
                Connect as
                <select
                  v-model="connectAs[person.id]"
                  @change="onConnectAsChange(person.id)"
                  class="w-full rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="none">Not connected yet</option>
                  <option value="child">Child of…</option>
                  <option value="parent">Parent of…</option>
                  <option value="spouse">Spouse of…</option>
                </select>
              </label>
              <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 w-full sm:w-auto sm:min-w-35">
                To
                <SearchableSelect
                  v-model="connectTo[person.id]"
                  :options="memberOptions"
                  :disabled="connectAs[person.id] === 'none'"
                  placeholder="Select member"
                />
              </label>
              <button
                @click="addMember(person.id)"
                :disabled="
                  (person.__pinned && connectAs[person.id] === 'none') ||
                  isSubmitting[person.id]
                "
                class="inline-flex items-center justify-center whitespace-nowrap self-stretch sm:self-end rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm disabled:opacity-65 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <span
                  v-if="isSubmitting[person.id]"
                  class="inline-block w-[0.8em] h-[0.8em] mr-[0.4em] rounded-full border-2 border-current border-r-transparent animate-[spin_0.6s_linear_infinite]"
                  aria-hidden="true"
                ></span>
                {{
                  isSubmitting[person.id]
                    ? "Saving…"
                    : candidateActionLabel(person)
                }}
              </button>
            </div>
          </div>

          <hr class="border-0 border-t border-slate-200 my-6 dark:border-slate-800" />
          <h3>Reorder children</h3>
          <p class="text-slate-500 text-[0.85rem] mt-0.8 mb-3 dark:text-slate-400">
            Pick a parent, then drag their children — or use the arrows — into
            the order they should appear on the family map. Changes stay on this
            page until you click "Save order".
          </p>
          <select
            v-model="reorderParentId"
            class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Select a parent</option>
            <option
              v-for="member in members"
              :key="member._id"
              :value="member.personId?._id"
            >
              {{ member.personId?.name }}
            </option>
          </select>
          <div v-if="reorderParentId" class="mt-4">
            <div
              v-for="(child, index) in localChildOrder"
              :key="child.id"
              :class="[
                'flex items-center gap-2.4 p-2.6 my-1.4 rounded-[5px] border cursor-grab',
                dragIndex === index
                  ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-600'
                  : 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800',
              ]"
              draggable="true"
              @dragstart="dragIndex = index"
              @dragend="dragIndex = null"
              @dragover.prevent
              @drop="dropChild(index)"
            >
              <span class="text-slate-400 dark:text-slate-500" aria-hidden="true">☰</span>
              <span class="flex-1">{{ child.name }}</span>
              <div class="flex gap-1.2">
                <button
                  type="button"
                  :disabled="index === 0"
                  title="Move up"
                  @click="moveChild(index, index - 1)"
                  class="rounded-[5px] border border-slate-300 bg-white leading-none px-2 py-0.8 disabled:opacity-35 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  ↑
                </button>
                <button
                  type="button"
                  :disabled="index === localChildOrder.length - 1"
                  title="Move down"
                  @click="moveChild(index, index + 1)"
                  class="rounded-[5px] border border-slate-300 bg-white leading-none px-2 py-0.8 disabled:opacity-35 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  ↓
                </button>
              </div>
            </div>
            <p v-if="!localChildOrder.length" class="text-slate-500 text-[0.85rem] dark:text-slate-400">
              No children are linked to this parent yet.
            </p>
            <div v-if="localChildOrder.length" class="flex items-center justify-between gap-3 mt-3 sm:justify-end">
              <span v-if="isReorderDirty" class="text-[0.8rem] text-amber-700 font-semibold dark:text-amber-400"
                >Unsaved changes</span
              >
              <button
                type="button"
                :disabled="!isReorderDirty || isSavingOrder"
                @click="saveChildOrder"
                class="rounded-[5px] border border-slate-300 bg-slate-900 px-2.8 py-1.8 text-sm text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {{ isSavingOrder ? "Saving…" : "Save order" }}
              </button>
            </div>
          </div>

          <hr class="border-0 border-t border-slate-200 my-6 dark:border-slate-800" />
          <h3>Members</h3>
          <p v-if="!members.length">
            Add a person below, then select them as the root.
          </p>
          <template v-else>
            <input
              v-model="memberSearch"
              type="text"
              placeholder="Search members by name"
              class="field-input max-w-80 mb-3"
            />
            <div class="rounded-lg border border-slate-200 overflow-x-auto [-webkit-overflow-scrolling:touch] sm:overflow-hidden dark:border-slate-800">
              <table class="w-full min-w-120 border-collapse text-left text-[0.9rem]">
                <thead>
                  <tr>
                    <th class="bg-slate-50 text-slate-600 px-3.4 py-2.6 font-semibold text-xs border-b border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Name</th>
                    <th class="bg-slate-50 text-slate-600 px-3.4 py-2.6 font-semibold text-xs border-b border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Role</th>
                    <th class="bg-slate-50 text-slate-600 px-3.4 py-2.6 font-semibold text-xs border-b border-slate-200 text-right dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!paginatedMembers.length" class="[&:last-child>td]:border-b-0">
                    <td colspan="3" class="text-center !p-6 text-slate-400 italic dark:text-slate-500">
                      No members match "{{ memberSearch }}".
                    </td>
                  </tr>
                  <tr
                    v-for="member in paginatedMembers"
                    :key="member._id"
                    class="[&:last-child>td]:border-b-0"
                  >
                    <td class="px-3.4 py-2.6 border-b border-slate-100 dark:border-slate-800 dark:text-slate-100">
                      <RouterLink
                        v-if="member.personId?._id"
                        :to="{ name: 'profile', params: { id: member.personId._id } }"
                        target="_blank"
                        rel="noopener"
                        class="text-blue-700 font-semibold no-underline hover:underline dark:text-blue-400"
                      >
                        {{ member.personId?.name }}
                      </RouterLink>
                      <template v-else>{{ member.personId?.name }}</template>
                    </td>
                    <td class="px-3.4 py-2.6 border-b border-slate-100 dark:border-slate-800 dark:text-slate-100">
                      <em v-if="member.isRoot" class="badge not-italic bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Root</em>
                    </td>
                    <td class="px-3.4 py-2.6 border-b border-slate-100 text-right dark:border-slate-800 dark:text-slate-100">
                      <button
                        v-if="!member.isRoot"
                        @click="setRoot(member._id)"
                        class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      >
                        Make root
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="memberTotalPages > 1" class="flex flex-wrap items-center justify-center gap-2 mt-3 sm:flex-nowrap sm:justify-between">
              <button
                type="button"
                :disabled="memberPage <= 1"
                @click="memberPage -= 1"
                class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                ← Previous
              </button>
              <span class="text-[0.85rem] text-slate-500 dark:text-slate-400"
                >Page {{ memberPage }} of {{ memberTotalPages }}</span
              >
              <button
                type="button"
                :disabled="memberPage >= memberTotalPages"
                @click="memberPage += 1"
                class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                Next →
              </button>
            </div>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>
<script setup>
import { computed, onMounted, ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import SearchableSelect from "@/components/ui/SearchableSelect.vue";

const route = useRoute();
const lineages = ref([]);
const selected = ref(null);
const members = ref([]);
const tree = ref({ people: [], relationships: [] });
const results = ref([]);
const search = ref("");
const error = ref("");
const joining = reactive({});
const connectAs = reactive({});
const connectTo = reactive({});
const newPerson = ref(null);
const pinnedPerson = ref(null);
const isSubmitting = reactive({});
const reorderParentId = ref("");
const localChildOrder = ref([]);
const isReorderDirty = ref(false);
const isSavingOrder = ref(false);
const dragIndex = ref(null);
const addPersonSectionRef = ref(null);
const memberSearch = ref("");
const memberPage = ref(1);
const MEMBER_PAGE_LIMIT = 8;
let timer;

// Shared option list for every member-picking control on this page (the
// "To" dropdown here, powering SearchableSelect's typeahead filtering).
const memberOptions = computed(() =>
  members.value
    .filter((member) => member.personId?._id)
    .map((member) => ({ value: member.personId._id, label: member.personId.name })),
);

// Members table is filtered/paginated client-side rather than via the API
// — a lineage's member count is small enough (family trees, not user
// databases) that fetching the whole list once and slicing it here is
// simpler than adding server-side pagination to this endpoint.
const filteredMembers = computed(() => {
  const query = memberSearch.value.trim().toLowerCase();
  if (!query) return members.value;
  return members.value.filter((member) =>
    (member.personId?.name || "").toLowerCase().includes(query),
  );
});

const memberTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMembers.value.length / MEMBER_PAGE_LIMIT)),
);

const paginatedMembers = computed(() => {
  const start = (memberPage.value - 1) * MEMBER_PAGE_LIMIT;
  return filteredMembers.value.slice(start, start + MEMBER_PAGE_LIMIT);
});

watch(memberSearch, () => {
  memberPage.value = 1;
});

// Keeps memberPage valid if the result set shrinks out from under it (a
// narrower search, or a member being removed elsewhere) rather than
// landing on a blank page.
watch(memberTotalPages, (totalPages) => {
  if (memberPage.value > totalPages) memberPage.value = totalPages;
});

// A fresh lineage's member list shouldn't inherit the previous lineage's
// leftover search text/page position.
watch(
  () => selected.value?._id,
  () => {
    memberSearch.value = "";
    memberPage.value = 1;
  },
);

const addCandidates = computed(() => {
  const list = [];
  if (newPerson.value) list.push({ ...newPerson.value, __isNew: true });
  if (pinnedPerson.value && pinnedPerson.value.id !== newPerson.value?.id) {
    list.push({ ...pinnedPerson.value, __pinned: true });
  }
  results.value.forEach((person) => {
    if (person.id !== newPerson.value?.id && person.id !== pinnedPerson.value?.id) {
      list.push(person);
    }
  });
  return list;
});

// __pinned candidates are already lineage members (routed here via the
// public map's "Connect" link) — they just need a relationship, not a
// second membership record.
const candidateActionLabel = (person) => {
  const mode = connectAs[person.id];
  if (person.__pinned) return mode && mode !== "none" ? "Connect" : "Already a member";
  return mode && mode !== "none" ? "Add & connect" : "Add";
};

const orderedChildren = computed(() =>
  tree.value.relationships
    .filter(
      (relationship) =>
        relationship.type === "parent_child" &&
        relationship.parentPersonId === reorderParentId.value,
    )
    .sort((first, second) => first.childOrder - second.childOrder)
    .map((relationship) =>
      tree.value.people.find(
        (person) => person.id === relationship.childPersonId,
      ),
    )
    .filter(Boolean),
);

// Dragging/arrow moves only touch this local copy — no network call per
// move, which is what made reordering feel laggy before. The order is only
// persisted when "Save order" is clicked.
const syncLocalChildOrder = () => {
  localChildOrder.value = [...orderedChildren.value];
  isReorderDirty.value = false;
};

watch(reorderParentId, () => {
  syncLocalChildOrder();
});

// Pick up server-side changes to the tree (e.g. from the "Add a person" or
// relationship sections above) as long as there's no unsaved local edit to
// clobber.
watch(
  tree,
  () => {
    if (!isReorderDirty.value) syncLocalChildOrder();
  },
  { deep: true },
);

const ensureCandidateDefaults = (personId) => {
  if (!(personId in joining)) joining[personId] = "birthed";
  if (!(personId in connectAs))
    connectAs[personId] = members.value.length ? "child" : "none";
  if (!(personId in connectTo)) connectTo[personId] = "";
};

const onConnectAsChange = (personId) => {
  if (connectAs[personId] === "spouse") joining[personId] = "married";
};

const load = async () => {
  lineages.value = await api.getAdminLineages();
};

const selectLineage = async (lineage) => {
  selected.value = lineage;
  members.value = await api.getLineageMembers(lineage._id);
  results.value = [];
  if (lineage.status === "approved")
    tree.value = await api.getLineageTree(lineage.slug);
};

const approve = async () => {
  await api.approveLineage(selected.value._id);
  await load();
  selected.value.status = "approved";
};

const setRoot = async (memberId) => {
  await api.setLineageRoot(selected.value._id, memberId);
  await selectLineage(selected.value);
};

const searchPeople = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (search.value.trim().length < 2) return (results.value = []);
    const data = await api.getPeople(
      `search=${encodeURIComponent(search.value.trim())}&limit=8`,
    );
    results.value = data.people || [];
    results.value.forEach((person) => ensureCandidateDefaults(person.id));
  }, 250);
};

// Adding a person to a lineage used to be a separate step from connecting
// them into the tree, which is how people ended up stuck under "Not yet
// connected" even after being "added". Now the connection (if one is
// chosen) is created right after the membership, in the same action.
const addMember = async (personId) => {
  error.value = "";
  // Drives the button's spinner/"Saving…" state — cleared in `finally` so it
  // resets whether the request succeeds, fails validation, or throws.
  isSubmitting[personId] = true;
  try {
    // A person routed in via the "Connect" link on the public map (or found
    // through search) may already be a lineage member and only missing a
    // relationship — re-adding them would fail with a duplicate-member
    // error, so skip straight to connecting in that case. This is also how
    // marrying two already-connected members works now that the standalone
    // Marriage section is gone: search for either person here and connect
    // them as "Spouse of…" the other.
    const alreadyMember = members.value.some(
      (member) => member.personId?._id === personId,
    );
    let membershipResponse = null;
    if (!alreadyMember) {
      membershipResponse = await api.addLineageMember(
        selected.value._id,
        personId,
        joining[personId] || "birthed",
      );
      if (membershipResponse.message)
        return (error.value = membershipResponse.message);
    }

    const mode = connectAs[personId];
    const targetId = connectTo[personId];
    if (mode && mode !== "none" && targetId) {
      let relationshipResponse;
      if (mode === "child") {
        relationshipResponse = await api.createRelationship(selected.value._id, {
          type: "parent_child",
          parentPersonId: targetId,
          childPersonId: personId,
        });
      } else if (mode === "parent") {
        relationshipResponse = await api.createRelationship(selected.value._id, {
          type: "parent_child",
          parentPersonId: personId,
          childPersonId: targetId,
        });
      } else if (mode === "spouse") {
        relationshipResponse = await api.createRelationship(selected.value._id, {
          type: "marriage",
          personIds: [personId, targetId],
        });
      }
      if (relationshipResponse?.message) {
        const prefix = alreadyMember
          ? ""
          : membershipResponse.id
            ? "Added to the lineage, but "
            : "Added, but ";
        error.value = `${prefix}The connection failed: ${relationshipResponse.message}`;
      }
    }

    if (newPerson.value?.id === personId) newPerson.value = null;
    if (pinnedPerson.value?.id === personId) pinnedPerson.value = null;
    delete joining[personId];
    delete connectAs[personId];
    delete connectTo[personId];
    await selectLineage(selected.value);
    search.value = "";
    results.value = [];
  } finally {
    delete isSubmitting[personId];
  }
};

// Persists localChildOrder to the server. Everything up to this point
// (dragging, ↑/↓) is purely local state, so this is the only network call
// in the whole reordering flow.
const saveChildOrder = async () => {
  isSavingOrder.value = true;
  try {
    await api.reorderChildren(
      selected.value._id,
      reorderParentId.value,
      localChildOrder.value.map((child) => child.id),
    );
    await selectLineage(selected.value);
    syncLocalChildOrder();
  } finally {
    isSavingOrder.value = false;
  }
};

const dropChild = (targetIndex) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;
  const reordered = [...localChildOrder.value];
  const [movedChild] = reordered.splice(dragIndex.value, 1);
  reordered.splice(targetIndex, 0, movedChild);
  dragIndex.value = null;
  localChildOrder.value = reordered;
  isReorderDirty.value = true;
};

const moveChild = (fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= localChildOrder.value.length) return;
  const reordered = [...localChildOrder.value];
  const [movedChild] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, movedChild);
  localChildOrder.value = reordered;
  isReorderDirty.value = true;
};

onMounted(async () => {
  try {
    await load();
    // Deep-link from the public lineage map's "Connect" action: preselect
    // the lineage and drop the unconnected person into the candidate list,
    // defaulted to "Child of…" since that's the common case.
    if (route.query.lineageId) {
      const targetLineage = lineages.value.find(
        (lineageItem) => lineageItem._id === route.query.lineageId,
      );
      if (targetLineage) await selectLineage(targetLineage);
    }
    if (route.query.personId) {
      const person = await api.getPersonById(route.query.personId);
      if (person?.id) newPerson.value = person;
    }
    if (route.query.connectPersonId) {
      const person = await api.getPersonById(route.query.connectPersonId);
      if (person?.id) {
        pinnedPerson.value = person;
        ensureCandidateDefaults(person.id);
        connectAs[person.id] = "child";
      }
      addPersonSectionRef.value?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
    }
    if (newPerson.value) ensureCandidateDefaults(newPerson.value.id);
  } catch (requestError) {
    error.value = requestError.message;
  }
});
</script>

