<template>
  <div class="modal-backdrop-overlay" @click.self="$emit('close')">
    <div class="modal-card-surface animate-pop">
      <div class="modal-header">
        <div class="header-titles">
          <span v-if="activePerson.title || activePerson.titledName" class="title-row">
            <span v-if="activePerson.title" class="civil-tag">{{ activePerson.title }}</span>
            <span v-if="activePerson.titledName" class="native-tag">{{ activePerson.titledName }}</span>
          </span>
          <h3>{{ activePerson.name }}</h3>
        </div>
        <button type="button" class="close-modal-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body-content">
        <div class="profile-summary-block">
          <img 
            :src="activePerson.profilePicture || 'https://placehold.co/150x150?text=No+Photo'" 
            alt="Profile Avatar" 
            class="modal-profile-avatar"
          />
          
          <div class="meta-details-grid">
            <div class="meta-item">
              <span class="meta-label">Gender:</span>
              <span class="meta-value text-capitalize">{{ activePerson.gender }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Lineage Join:</span>
              <span class="meta-value text-capitalize">{{ activePerson.modeOfJoining }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Lifespan Period:</span>
              <span class="meta-value">
                {{ formatDate(activePerson.birthDate) }} — 
                {{ activePerson.deathDate ? formatDate(activePerson.deathDate) : 'Present (Alive)' }}
              </span>
            </div>
          </div>
        </div>

        <hr class="divider-line" />

        <div class="biography-teaser-section">
          <h4>Profile Summary</h4>
          <p v-if="activePerson.biographySummary">
            {{ activePerson.biographySummary }}
          </p>
          <p v-else class="placeholder-text">
            No short profile teaser summary provided for this lineage member record.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-btn" @click="$emit('close')">Close</button>
        <button type="button" class="navigate-profile-btn" @click="navigateToFullProfile">
          Read More & View Tree →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  activePerson: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const router = useRouter();

const navigateToFullProfile = () => {
  emit('close');
  // Routes user straight to the dedicated workspace page using the person unique id
  router.push({ name: 'profile', params: { id: props.activePerson.id } });
};

// Date String Formatter utility helper
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
</script>

<style scoped>
.modal-backdrop-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}

.modal-card-surface {
  background: white;
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Entry Pop Animation */
.animate-pop {
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modal-pop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-titles h3 {
  margin: 0.25rem 0 0 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 700;
}

.title-row {
  display: flex;
  gap: 0.35rem;
}
.civil-tag { background: #e0f2fe; color: #0369a1; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; }
.native-tag { background: #fef3c7; color: #b45309; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; }

.close-modal-btn {
  background: none;
  border: none;
  font-size: 1.15rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}
.close-modal-btn:hover { color: #64748b; }

.modal-body-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 60vh;
}

.profile-summary-block {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.modal-profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f1f5f9;
  background-color: #f8fafc;
}

.meta-details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.meta-item {
  font-size: 0.875rem;
  display: flex;
  gap: 0.5rem;
}
.meta-label { color: #64748b; font-weight: 500; min-width: 110px; }
.meta-value { color: #334155; font-weight: 600; }

.divider-line {
  border: 0;
  height: 1px;
  background-color: #f1f5f9;
  margin: 1.5rem 0;
}

.biography-teaser-section h4 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 0.95rem;
}
.biography-teaser-section p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}
.placeholder-text { color: #94a3b8 !important; font-style: italic; }

.modal-footer {
  background-color: #f8fafc;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.cancel-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.55rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.cancel-btn:hover { background-color: #f1f5f9; }

.navigate-profile-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.55rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.navigate-profile-btn:hover { background-color: #1d4ed8; }
.text-capitalize { text-transform: capitalize; }
</style>