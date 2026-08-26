<template>
  <div class="spouses-overlay-container">
    <div v-if="isLoading" class="spouse-loading">Loading list...</div>
    <div v-else-if="partners.length === 0" class="spouse-empty">No records found.</div>

    <article v-else v-for="partner in partners" :key="partner.id" class="spouse-mini-card">
      <div class="spouse-identity">
        <img
          :src="partner.profilePicture || 'https://placehold.co/100x100?text=No+Photo'"
          alt="Spouse avatar"
          class="mini-avatar"
        />
        <div class="mini-details">
          <span v-if="partner.titledName" class="native-title">{{ partner.titledName }}</span>
          <span class="partner-name">{{ partner.name }}</span>
        </div>
      </div>
      <button type="button" class="spouse-info-btn" @click="$emit('show-info', partner)">ℹ️ Info</button>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const props = defineProps({
  partnerIds: {
    type: Array,
    required: true,
    default: () => []
  }
});

defineEmits(['show-info']);

const partners = ref([]);
const isLoading = ref(false);

onMounted(async () => {
  if (props.partnerIds && props.partnerIds.length > 0) {
    isLoading.value = true;
    try {
      const res = await api.getPeopleByIds(props.partnerIds);
      // Filter out any archived/deleted records locally if needed
      partners.value = (res || []).filter(p => !p.isDeleted);
    } catch (err) {
      console.error("Failed to query lateral partners:", err);
    } finally {
      isLoading.value = false;
    }
  }
});
</script>

<style scoped>
.spouses-overlay-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.spouse-loading, .spouse-empty {
  font-size: 0.7rem;
  color: #9ca3af;
  text-align: center;
  padding: 0.5rem 0;
}
.spouse-mini-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: #fff;
  padding: 0.55rem;
  border-radius: 6px;
  border: 1px solid #fbcfe8;
}
.spouse-identity { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e7eb;
}
.mini-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.native-title {
  font-size: 0.6rem;
  color: #b45309;
  font-weight: 500;
}
.partner-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spouse-info-btn { border: 0; border-radius: 4px; padding: 0.28rem 0.4rem; background: #fdf2f8; color: #9d174d; cursor: pointer; font-size: 0.7rem; font-weight: 600; }
.spouse-info-btn:hover { background: #fce7f3; }

[data-theme="dark"] .spouse-mini-card {
  background: var(--surface);
  border-color: #831843;
}
[data-theme="dark"] .partner-name {
  color: var(--text);
}
</style>
