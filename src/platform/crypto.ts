// HACK
// expo-modules-core tries to require('crypto') in uuid.web.js
// and while it tries to detect web crypto before doing so, our
// build fails when it tries to do this require. We use a babel
// and tsconfig alias to direct it here
// -prf
export default crypto
