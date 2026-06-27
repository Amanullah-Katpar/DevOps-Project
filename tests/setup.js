const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// MongoMemoryServer downloads a MongoDB binary (~500MB) on first run.
// This timeout covers that download. Subsequent runs are fast (<5s).
jest.setTimeout(600000); // 10 minutes

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 60000);

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
