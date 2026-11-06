<template>
  <div>
    <section v-if="loaded" class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <h3 class="m-0 text-base font-semibold">
        {{ members.length ? "Quick add a relative" : "Start the tree" }}
      </h3>
      <p class="mt-1 mb-3 text-[0.85rem] text-slate-500 dark:text-slate-400">
        <template v-if="members.length">
          Pick who they're related to, say how, and type their name. They're created, added to
          this lineage and connected in one step.
        </template>
        <template v-else>Add the first person. They become the root of the map.</template>
      </p>
      <form @submit.prevent="submitQuickAdd" class="grid gap-3">
        <div v-if="members.length" class="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Related to
            <SearchableSelect v-model="quick.anchor" :options="memberOptions" placeholder="Select member" />
          </label>
          <div class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            They are their
            <div class="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
              <button
                v-for="option in QUICK_OPTIONS"
                :key="option.value"
                type="button"
                @click="quick.relation = option.value"
                :class="[
                  'px-3 py-1.5 text-sm normal-case font-medium',
                  quick.relation === option.value
                    ? 'bg-slate-900 text-white dark:bg-slate-600'
                    : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100',
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            v-model="quick.name"
            required
            maxlength="200"
            placeholder="Full name"
            class="field-input"
          />
          <div class="flex items-center gap-4 text-sm">
            <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="quick.gender" value="male" /> Male</label>
            <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="quick.gender" value="female" /> Female</label>
          </div>
          <input v-model="quick.birthDate" type="date" title="Birth date (optional)" class="field-input" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            :disabled="quickSaving || (members.length && !quick.anchor)"
            class="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {{ quickSaving ? "Adding…" : quickLabel }}
          </button>
          <span v-if="quickMessage" class="text-sm text-emerald-700 dark:text-emerald-400">{{ quickMessage }}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">Add details and a photo later from the Edit link.</span>
        </div>
      </form>
    </section>

    <details class="mt-6" :open="!!(newPerson || pinnedPerson)">
      <summary class="cursor-pointer text-base font-semibold" ref="addPersonSectionRef">
        Add someone who already exists
      </summary>
      <p class="text-slate-500 text-[0.85rem] mt-2 mb-3 dark:text-slate-400">
        Search for an existing person — including one already in this
        lineage but still "Not yet connected" — or create a new one with the full form and come
        back here.
      </p>
    <div class="flex flex-wrap items-center gap-2.4">
      <input
        v-model="search"
        @input="searchPeople"
        placeholder="Search people by name"
        class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      <RouterLink
        :to="{ name: 'add-member', query: { returnTo: props.returnTo } }"
        class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        + New person
      </RouterLink>
    </div>
    <p v-if="error" class="text-red-700 dark:text-red-400">{{ error }}</p>

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

    </details>

    <hr class="border-0 border-t border-slate-200 my-6 dark:border-slate-800" />
    <h3 class="font-semibold">Reorder children</h3>
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
    <h3 class="font-semibold">Members</h3>
    <p v-if="!loaded" class="text-slate-500 dark:text-slate-400">Loading members…</p>
    <p v-else-if="!members.length">
      Add the first person above to start the tree.
    </p>
    <template v-else>
      <input
        v-model="memberSearch"
        type="text"
        placeholder="Search members by name"
        class="field-input max-w-80 mb-3"
      />
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <PaginationSummary :page="memberPage" :limit="MEMBER_PAGE_LIMIT" :total="filteredMembers.length" noun="members" />
        <PaginationControls v-model:page="memberPage" :pages="memberTotalPages" />
      </div>
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
                <RouterLink
                  v-if="member.personId?._id"
                  :to="{ name: 'edit-member', params: { id: member.personId._id }, query: { returnTo: props.returnTo } }"
                  class="mr-2 rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  Edit
                </RouterLink>
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
      <div class="mt-3 flex justify-center">
        <PaginationControls v-model:page="memberPage" :pages="memberTotalPages" />
      </div>
    </template>
  </div>
</template>

<script setup>
// Pulled out of admin/LineagesView.vue so the exact same "add a person /
// reorder children / members table" UI can be reused by MyLineagesView.vue
// (a lineage_owner managing just their own lineage) without duplicating ~300
// lines of fiddly search/drag/pagination logic. Everything about PICKING a
// lineage and APPROVING it stays in the two parent views — this component
// only ever manages the content of whichever single lineage it's given.
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import SearchableSelect from "@/components/ui/SearchableSelect.vue";
import PaginationSummary from "@/components/ui/PaginationSummary.vue";
import PaginationControls from "@/components/ui/PaginationControls.vue";

const props = defineProps({
  lineage: { type: Object, required: true },
  // Threaded through to add-member/edit-member's own back/redirect links
  // (?returnTo=) so MemberForm.vue can return the admin to 'admin-lineages'
  // but a lineage_owner to 'my-lineages' — see MemberForm.vue's use of
  // route.query.returnTo.
  returnTo: { type: String, required: true },
});

const route = useRoute();

const members = ref([]);
const loaded = ref(false);
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
const MEMBER_PAGE_LIMIT = 10;
let timer;

const QUICK_OPTIONS = [
  { value: "child", label: "Child" },
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
];
const quick = reactive({ anchor: "", relation: "child", name: "", gender: "male", birthDate: "" });
const quickSaving = ref(false);
const quickMessage = ref("");
const quickLabel = computed(() => {
  if (!members.value.length) return "Add as root";
  return `Add ${quick.relation}`;
});

const memberOptions = computed(() =>
  members.value
    .filter((member) => member.personId?._id)
    .map((member) => ({ value: member.personId._id, label: member.personId.name })),
);

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

watch(memberTotalPages, (totalPages) => {
  if (memberPage.value > totalPages) memberPage.value = totalPages;
});

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

const syncLocalChildOrder = () => {
  localChildOrder.value = [...orderedChildren.value];
  isReorderDirty.value = false;
};

watch(reorderParentId, () => {
  syncLocalChildOrder();
});

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
  members.value = await api.getLineageMembers(props.lineage._id);
  tree.value = await api.getLineageTree(props.lineage.slug);
  loaded.value = true;
  // Default "Related to" to the root (or the first member) so the common
  // case is just: type a name, click Add.
  const stillThere = members.value.some((m) => m.personId?._id === quick.anchor);
  if (!stillThere) {
    const fallback = members.value.find((m) => m.isRoot) || members.value[0];
    quick.anchor = fallback?.personId?._id || "";
  }
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

const addMember = async (personId) => {
  error.value = "";
  isSubmitting[personId] = true;
  try {
    const alreadyMember = members.value.some(
      (member) => member.personId?._id === personId,
    );
    let membershipResponse = null;
    if (!alreadyMember) {
      try {
        membershipResponse = await api.addLineageMember(
          props.lineage._id,
          personId,
          joining[personId] || "birthed",
        );
      } catch (requestError) {
        return (error.value = requestError.message);
      }
    }

    const mode = connectAs[personId];
    const targetId = connectTo[personId];
    if (mode && mode !== "none" && targetId) {
      let relationshipError = null;
      try {
      if (mode === "child") {
        await api.createRelationship(props.lineage._id, {
          type: "parent_child",
          parentPersonId: targetId,
          childPersonId: personId,
        });
      } else if (mode === "parent") {
        await api.createRelationship(props.lineage._id, {
          type: "parent_child",
          parentPersonId: personId,
          childPersonId: targetId,
        });
      } else if (mode === "spouse") {
        await api.createRelationship(props.lineage._id, {
          type: "marriage",
          personIds: [personId, targetId],
        });
      }
      } catch (requestError) {
        relationshipError = requestError.message;
      }
      if (relationshipError) {
        const prefix = alreadyMember
          ? ""
          : membershipResponse?._id
            ? "Added to the lineage, but "
            : "Added, but ";
        error.value = `${prefix}The connection failed: ${relationshipError}`;
      }
    }

    if (newPerson.value?.id === personId) newPerson.value = null;
    if (pinnedPerson.value?.id === personId) pinnedPerson.value = null;
    delete joining[personId];
    delete connectAs[personId];
    delete connectTo[personId];
    await load();
    search.value = "";
    results.value = [];
  } finally {
    delete isSubmitting[personId];
  }
};

const submitQuickAdd = async () => {
  error.value = "";
  quickMessage.value = "";
  quickSaving.value = true;
  try {
    const isFirst = !members.value.length;
    const result = await api.quickAddPerson(props.lineage._id, {
      relation: isFirst ? "root" : quick.relation,
      anchorPersonId: isFirst ? undefined : quick.anchor,
      person: { name: quick.name, gender: quick.gender, birthDate: quick.birthDate },
    });
    quickMessage.value = `Added ${result.person.name}.`;
    // Keep the anchor and relation so several siblings/children can be added
    // in a row; a spouse or parent usually means moving on, so reset the type.
    quick.name = "";
    quick.birthDate = "";
    await load();
    if (isFirst) quick.anchor = result.person._id;
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    quickSaving.value = false;
  }
};

const setRoot = async (memberId) => {
  await api.setLineageRoot(props.lineage._id, memberId);
  await load();
};

const saveChildOrder = async () => {
  isSavingOrder.value = true;
  try {
    await api.reorderChildren(
      props.lineage._id,
      reorderParentId.value,
      localChildOrder.value.map((child) => child.id),
    );
    await load();
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
    // Deep-link from the public lineage map's "Connect" action, or from
    // MemberForm.vue's "Create Person and Choose Lineage" redirect — both
    // land here (via the parent view re-rendering this component, keyed by
    // lineage id) with the relevant id(s) in the query string.
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
    loaded.value = true;
  }
});
</script>
