## 📁 1. Vue 3 Application Folder Structure

This structure leverages standard **Vue 3 Features** like Composables (for clean separation) and a dedicated Admin module layout to keep code manageable.

```text
my-lineage-app/
├── public/
├── src/
│   ├── assets/
│   │   └── main.css             # Global styling (Tailwind / Custom styles)
│   ├── components/
│   │   ├── admin/
│   │   │   └── MilestoneInput.vue # The dynamic date/text row component
│   │   ├── canvas/
│   │   │   ├── CustomNode.vue   # Custom Vue Flow node (Expand/Collapse/Spouse buttons)
│   │   │   └── SpouseOverlay.vue# Side node or overlay showing wives
│   │   └── ui/
│   │       ├── BaseModal.vue    # Profile quick summary modal
│   │       └── TimeLine.vue     # Public chronologically sorted timeline
│   ├── composables/
│   │   ├── useAuth.js           # Auth logic wrapper
│   │   └── useLineage.js        # Lazy loading & Firestore queries logic
│   ├── router/
│   │   └── index.js             # Navigation paths + Navigation guards
│   ├── views/
│   │   ├── HomeView.vue         # Main interactive canvas viewport
│   │   ├── ProfileView.vue      # Dedicated bi-directional profile page
│   │   ├── LoginView.vue        # Admin sign-in screen
│   │   └── admin/
│   │       ├── Dashboard.vue    # Protected table listing members (with soft delete)
│   │       └── MemberForm.vue   # Protected Add/Edit form + Image optimizer
│   ├── App.vue
│   └── main.js
├── package.json
└── vite.config.js
`
```

mkdir -p src/{assets,components/{admin,canvas,ui},composables,router,views/admin}


touch \
package.json \
vite.config.js \
src/App.vue \
src/main.js \
src/assets/main.css \
src/components/admin/MilestoneInput.vue \
src/components/canvas/CustomNode.vue \
src/components/canvas/SpouseOverlay.vue \
src/components/ui/BaseModal.vue \
src/components/ui/TimeLine.vue \
src/composables/useAuth.js \
src/composables/useLineage.js \
src/router/index.js \
src/views/HomeView.vue \
src/views/ProfileView.vue \
src/views/LoginView.vue \
src/views/admin/Dashboard.vue \
src/views/admin/MemberForm.vue