const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const projectRoot = path.resolve(__dirname, "..");
const apiRoot = path.join(projectRoot, "src", "server", "api");

for (const envFile of [
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
  path.join(apiRoot, ".env"),
]) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

const accounts = [
  { email: "admin@schoolerp.com", password: process.env.ADMIN_ONE_PASSWORD },
  { email: "superadmin@schoolerp.com", password: process.env.ADMIN_TWO_PASSWORD },
];

async function main() {
  for (const account of accounts) {
    if (!account.password || account.password.length < 12) {
      throw new Error(`Set a password of at least 12 characters for ${account.email}.`);
    }
  }

  if (accounts[0].password === accounts[1].password) {
    throw new Error("The two admin accounts must use different passwords.");
  }

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/erp";
  await mongoose.connect(uri);
  const Admin = require(path.join(apiRoot, "models", "admin.js"));

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    const admin = await Admin.findOneAndUpdate(
      { email: account.email },
      {
        $set: { email: account.email, password: passwordHash },
        $setOnInsert: { organization: "EduPulse" },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        collation: { locale: "en", strength: 2 },
      },
    );
    if (!admin || !(await bcrypt.compare(account.password, admin.password))) {
      throw new Error(`Could not verify the provisioned password for ${account.email}.`);
    }
    console.log(`Provisioned admin account: ${account.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Admin account provisioning failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
