<template>
  <div class="spouses-overlay-container">
    <div v-if="isLoading" class="spouse-loading">Loading list...</div>
    <div v-else-if="partners.length === 0" class="spouse-empty">No records found.</div>
    
    <div 
      v-else 
      v-for="partner in partners" 
      :key="partner.id" 
      class="spouse-mini-card"
    >
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
  gap: 0.5rem;
  background: #f9fafb;
  padding: 0.35rem;
  border-radius: 4px;
  border: 1px solid #f3f4f6;
}
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
</style>