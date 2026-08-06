# Agburu BE

mkdir -p src/{config,controllers,middleware,models,routes,utils}

touch \
src/server.js \
src/app.js \
src/seedAdmin.js \
src/config/db.js \
src/config/cloudinary.js \
src/controllers/authController.js \
src/controllers/personController.js \
src/middleware/authMiddleware.js \
src/middleware/uploadMiddleware.js \
src/models/Admin.js \
src/models/Person.js \
src/routes/authRoutes.js \
src/routes/personRoutes.js \
src/utils/cloudinaryUpload.js