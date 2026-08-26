<template>
  <main class="page">
    <div class="header">
      <div>
        <h1>Lineages</h1>
        <p>Approve requests, add members, and set each map's root.</p>
      </div>
      <button @click="$router.push('/admin')">Back to directory</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="layout">
      <div class="panel">
        <h2>All lineages</h2>
        <button
          v-for="lineage in lineages"
          :key="lineage._id"
          class="lineage"
          :class="{ selected: selected?._id === lineage._id }"
          @click="selectLineage(lineage)"
        >
          <strong>{{ lineage.name }}</strong>
          <small
            >/{{ lineage.slug }} · {{ lineage.status }} ·
            {{ lineage.visibility }}</small
          >
        </button>
      </div>

      <div v-if="selected" class="panel">
        <div class="section-head">
          <div>
            <h2>{{ selected.name }}</h2>
            <p>/{{ selected.slug }}</p>
          </div>
          <button
            v-if="selected.status === 'pending'"
            @click="approve"
            class="primary"
          >
            Approve lineage
          </button>
        </div>

        <div v-if="selected.status === 'approved'">
          <h3 ref="addPersonSectionRef">Add a person</h3>
          <p class="hint">
            Search for an existing person — including one already in this
            lineage but still "Not yet connected" — or create a new one and
            come back here. Either way, choose how they connect to the family
            so they never sit unconnected.
          </p>
          <input
            v-model="search"
            @input="searchPeople"
            placeholder="Search people by name"
          />

          <div
            v-for="person in addCandidates"
            :key="person.id"
            class="candidate-card"
          >
            <div class="candidate-identity">
              <RouterLink
                :to="{ name: 'profile', params: { id: person.id } }"
                target="_blank"
                rel="noopener"
                class="candidate-name"
              >
                {{ person.name }}
              </RouterLink>
              <span v-if="person.__isNew" class="new-badge">Newly created</span>
              <span v-else-if="person.__pinned" class="new-badge pinned-badge"
                >Already a member — connect below</span
              >
            </div>
            <div class="candidate-controls">
              <label class="control-label">
                Membership
                <select v-model="joining[person.id]">
                  <option value="birthed">Birthed</option>
                  <option value="married">Married</option>
                  <option value="adopted">Adopted</option>
                </select>
              </label>
              <label class="control-label">
                Connect as
                <select
                  v-model="connectAs[person.id]"
                  @change="onConnectAsChange(person.id)"
                >
                  <option value="none">Not connected yet</option>
                  <option value="child">Child of…</option>
                  <option value="parent">Parent of…</option>
                  <option value="spouse">Spouse of…</option>
                </select>
              </label>
              <label class="control-label">
                To
                <select
                  v-model="connectTo[person.id]"
                  :disabled="connectAs[person.id] === 'none'"
                >
                  <option value="">Select member</option>
                  <option
                    v-for="member in members"
                    :key="member._id"
                    :value="member.personId?._id"
                  >
                    {{ member.personId?.name }}
                  </option>
                </select>
              </label>
              <button
                @click="addMember(person.id)"
                :disabled="person.__pinned && connectAs[person.id] === 'none'"
              >
                {{ candidateActionLabel(person) }}
              </button>
            </div>
          </div>

          <hr />
          <h3>Marriage</h3>
          <div class="relationship-form">
            <select v-model="spouseOneId">
              <option value="">First person</option>
              <option
                v-for="member in members"
                :key="member._id"
                :value="member.personId?._id"
              >
                {{ member.personId?.name }}
              </option>
            </select>
            <select v-model="spouseTwoId">
              <option value="">Second person</option>
              <option
                v-for="member in members"
                :key="member._id"
                :value="member.personId?._id"
              >
                {{ member.personId?.name }}
              </option>
            </select>
            <button @click="linkMarriage">Add marriage</button>
          </div>

          <hr />
          <h3>Reorder children</h3>
          <p class="hint">
            Pick a parent, then drag their children — or use the arrows — into
            the order they should appear on the family map. Changes stay on this
            page until you click "Save order".
          </p>
          <select v-model="reorderParentId">
            <option value="">Select a parent</option>
            <option
              v-for="member in members"
              :key="member._id"
              :value="member.personId?._id"
            >
              {{ member.personId?.name }}
            </option>
          </select>
          <div v-if="reorderParentId" class="children">
            <div
              v-for="(child, index) in localChildOrder"
              :key="child.id"
              class="child-row"
              :class="{ dragging: dragIndex === index }"
              draggable="true"
              @dragstart="dragIndex = index"
              @dragend="dragIndex = null"
              @dragover.prevent
              @drop="dropChild(index)"
            >
              <span class="drag-handle" aria-hidden="true">☰</span>
              <span class="child-name">{{ child.name }}</span>
              <div class="reorder-buttons">
                <button
                  type="button"
                  :disabled="index === 0"
                  title="Move up"
                  @click="moveChild(index, index - 1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  :disabled="index === localChildOrder.length - 1"
                  title="Move down"
                  @click="moveChild(index, index + 1)"
                >
                  ↓
                </button>
              </div>
            </div>
            <p v-if="!localChildOrder.length">
              No children are linked to this parent yet.
            </p>
            <div v-if="localChildOrder.length" class="reorder-save-row">
              <span v-if="isReorderDirty" class="unsaved-hint"
                >Unsaved changes</span
              >
              <button
                type="button"
                class="primary"
                :disabled="!isReorderDirty || isSavingOrder"
                @click="saveChildOrder"
              >
                {{ isSavingOrder ? "Saving…" : "Save order" }}
              </button>
            </div>
          </div>

          <hr />
          <h3>Members</h3>
          <p v-if="!members.length">
            Add a person below, then select them as the root.
          </p>
          <div v-for="member in members" :key="member._id" class="member">
            <span>
              <RouterLink
                v-if="member.personId?._id"
                :to="{ name: 'profile', params: { id: member.personId._id } }"
                target="_blank"
                rel="noopener"
                class="member-name"
              >
                {{ member.personId?.name }}
              </RouterLink>
              <template v-else>{{ member.personId?.name }}</template>
              <em v-if="member.isRoot">Root</em>
            </span>
            <button v-if="!member.isRoot" @click="setRoot(member._id)">
              Make root
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
<script setup>
import { computed, onMounted, ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";

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
const spouseOneId = ref("");
const spouseTwoId = ref("");
const reorderParentId = ref("");
const localChildOrder = ref([]);
const isReorderDirty = ref(false);
const isSavingOrder = ref(false);
const dragIndex = ref(null);
const addPersonSectionRef = ref(null);
let timer;

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
  // A person routed in via the "Connect" link on the public map (or found
  // through search) may already be a lineage member and only missing a
  // relationship — re-adding them would fail with a duplicate-member error,
  // so skip straight to connecting in that case.
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
};

const linkMarriage = async () => {
  error.value = "";
  const response = await api.createRelationship(selected.value._id, {
    type: "marriage",
    personIds: [spouseOneId.value, spouseTwoId.value],
  });
  if (response.message) return (error.value = response.message);
  spouseOneId.value = "";
  spouseTwoId.value = "";
  await selectLineage(selected.value);
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
<style scoped>
.page {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
  color: #0f172a;
}
.header,
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.header h1,
.section-head h2 {
  margin: 0;
}
.header p,
.section-head p {
  color: #64748b;
}
.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
}
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: white;
}
.lineage {
  width: 100%;
  display: grid;
  gap: 0.25rem;
  text-align: left;
  margin: 0.5rem 0;
  padding: 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
.lineage.selected {
  border-color: #2563eb;
  background: #eff6ff;
}
.lineage small {
  color: #64748b;
}
.member {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.member em {
  font-style: normal;
  color: #047857;
  font-size: 0.75rem;
  margin-left: 0.4rem;
}
.member-name,
.candidate-name {
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;
}
.member-name:hover,
.candidate-name:hover {
  text-decoration: underline;
}
button,
select,
input {
  padding: 0.45rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: white;
  font: inherit;
}
.primary {
  background: #0f172a;
  color: white;
}
.error {
  color: #b91c1c;
}
.hint {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0.2rem 0 0.75rem;
}
hr {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
}
.candidate-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  margin: 0.6rem 0;
  background: #f8fafc;
}
.candidate-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
  flex-wrap: wrap;
}
.new-badge {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 99px;
}
.pinned-badge {
  background: #fef3c7;
  color: #b45309;
}
.candidate-controls {
  display: flex;
  align-items: end;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.control-label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.control-label select {
  min-width: 140px;
}
.candidate-controls > button {
  align-self: end;
  white-space: nowrap;
}
.relationship-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
}
.children {
  margin-top: 1rem;
}
.children p {
  color: #64748b;
  font-size: 0.85rem;
}
.child-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem;
  margin: 0.35rem 0;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #f8fafc;
  cursor: grab;
}
.child-row.dragging {
  opacity: 0.5;
  border-style: dashed;
}
.drag-handle {
  color: #94a3b8;
}
.child-name {
  flex: 1;
}
.reorder-buttons {
  display: flex;
  gap: 0.3rem;
}
.reorder-buttons button {
  padding: 0.2rem 0.5rem;
  line-height: 1;
}
.reorder-buttons button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.reorder-save-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.unsaved-hint {
  font-size: 0.8rem;
  color: #b45309;
  font-weight: 600;
}
.reorder-save-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 700px) {
  .reorder-save-row {
    justify-content: space-between;
  }
  .layout {
    grid-template-columns: 1fr;
  }
  .relationship-form {
    grid-template-columns: 1fr;
  }
  .candidate-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .candidate-controls > button {
    align-self: stretch;
  }
  .control-label select {
    width: 100%;
    min-width: 0;
  }
}

[data-theme="dark"] .page {
  color: var(--text);
}
[data-theme="dark"] .header p,
[data-theme="dark"] .section-head p {
  color: var(--text-muted);
}
[data-theme="dark"] .panel {
  background: var(--surface);
  border-color: var(--border);
}
[data-theme="dark"] .lineage {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}
[data-theme="dark"] .lineage small {
  color: var(--text-muted);
}
[data-theme="dark"] .lineage.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}
[data-theme="dark"] .member {
  border-bottom-color: var(--border);
}
[data-theme="dark"] .member em {
  color: var(--success);
}
[data-theme="dark"] .member-name,
[data-theme="dark"] .candidate-name {
  color: var(--accent-strong);
}
[data-theme="dark"] button,
[data-theme="dark"] select,
[data-theme="dark"] input {
  border-color: var(--border-strong);
  background: var(--surface-muted);
  color: var(--text);
}
[data-theme="dark"] .primary {
  background: var(--accent);
  color: var(--accent-contrast);
}
[data-theme="dark"] .error {
  color: var(--danger);
}
[data-theme="dark"] .hint {
  color: var(--text-muted);
}
[data-theme="dark"] hr {
  border-top-color: var(--border);
}
[data-theme="dark"] .candidate-card {
  background: var(--surface-muted);
  border-color: var(--border);
}
[data-theme="dark"] .new-badge {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
[data-theme="dark"] .pinned-badge {
  background: var(--warning-soft, rgba(245, 158, 11, 0.15));
  color: var(--warning, #f59e0b);
}
[data-theme="dark"] .control-label {
  color: var(--text-muted);
}
[data-theme="dark"] .children p {
  color: var(--text-muted);
}
[data-theme="dark"] .child-row {
  background: var(--surface-muted);
  border-color: var(--border-strong);
}
[data-theme="dark"] .drag-handle {
  color: var(--text-subtle);
}
[data-theme="dark"] .unsaved-hint {
  color: var(--warning, #f59e0b);
}
</style>
