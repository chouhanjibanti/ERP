// Generates deterministic fixture documents for every non-admin schema.
const crypto = require("node:crypto");
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

const recordCount = 5;
const seedDate = new Date("2026-01-15T12:00:00.000Z");
const passwordHash = bcrypt.hashSync("TestPass123!", 10);
const enumOverrides = {
  status: ["Available", "Not Available", "Full", "Half", "Leave", "active", "under maintenance", "off-duty"],
  answer: ["option1", "option2", "option3", "option4"],
  correctAnswer: ["A", "B", "C", "D"],
  paymentStatus: ["paid", "unpaid"],
  gender: ["male", "female"],
  roomType: ["single", "double"],
};

function listModelFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listModelFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

function loadModels() {
  const models = new Map();
  for (const modelFile of listModelFiles(path.join(apiRoot, "models")).sort()) {
    const model = require(modelFile);
    if (!model?.schema || !model.modelName) {
      throw new Error(`Expected a Mongoose model export from ${modelFile}`);
    }
    if (models.has(model.modelName)) {
      throw new Error(`Duplicate Mongoose model name: ${model.modelName}`);
    }
    models.set(model.modelName, model);
  }
  return [...models.values()];
}

function fixtureId(modelName, index) {
  const hex = crypto
    .createHash("sha256")
    .update(`edupulse-schema-test:${modelName}:${index}`)
    .digest("hex")
    .slice(0, 24);
  return new mongoose.Types.ObjectId(hex);
}

function fixtureString(modelName, fieldName, index) {
  const model = modelName.toLowerCase();
  const field = fieldName.toLowerCase();
  const number = index + 1;

  if (field.includes("email")) {
    return `test-${model}-${number}@example.test`;
  }
  if (field.includes("password")) {
    return passwordHash;
  }
  if (field === "gender") {
    return index % 2 === 0 ? "female" : "male";
  }
  if (field === "roomtype") {
    return index % 2 === 0 ? "single" : "double";
  }
  if (field === "correctanswer") {
    return ["A", "B", "C", "D"][index % 4];
  }
  if (field === "answer") {
    return `option${(index % 4) + 1}`;
  }
  if (field === "status") {
    const options = enumOverrides.status;
    return options[index % options.length];
  }
  if (field === "paymentstatus") {
    return index % 2 === 0 ? "paid" : "unpaid";
  }
  if (field === "studentid" || field === "studentid") {
    return `TEST-STUDENT-${number}`;
  }
  if (field === "driverid") {
    return `TEST-DRIVER-${number}`;
  }
  if (field === "licensenumber") {
    return `TEST-LICENSE-${number}`;
  }
  if (field === "routenumber") {
    return `TEST-ROUTE-${number}`;
  }
  if (field === "busno") {
    return `TEST-BUS-${number}`;
  }
  if (field === "route" || field === "routeno") {
    return `TEST-ROUTE-${number}`;
  }
  if (field === "bookid") {
    return `TEST-BOOK-${number}`;
  }
  if (field === "title") {
    return `Test ${modelName} ${number}`;
  }
  if (field === "name" || field === "studentname" || field === "employee") {
    return `Test ${modelName} Person ${number}`;
  }
  if (field.includes("phone") || field.includes("contact")) {
    return `987650${String(1000 + index).slice(-4)}`;
  }
  if (field.includes("address")) {
    return `${number} Test Street`;
  }
  if (field.includes("city")) {
    return ["Testville", "Sample City", "Demo Town", "Fixture Bay", "Example Point"][index];
  }
  if (field.includes("date")) {
    const date = new Date(seedDate);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  }
  if (field.includes("time")) {
    return `09:${String(10 + index).padStart(2, "0")} AM`;
  }
  if (field.includes("action")) {
    return index % 2 === 0 ? "Issued" : "Returned";
  }
  if (field.includes("description") || field.includes("content") || field.includes("feedback")) {
    return `Sample test ${fieldName} for ${modelName} record ${number}.`;
  }
  if (field === "image") {
    return "";
  }
  if (field.includes("id")) {
    return `${modelName.toUpperCase()}-${number}`;
  }
  if (field === "branch" || field.includes("department")) {
    return `Test ${fieldName} ${number}`;
  }
  if (field === "category" || field === "type") {
    return "Test";
  }
  if (field === "bloodgroup") {
    return ["O+", "A+", "B+", "AB+", "O-"][index];
  }
  if (field === "allergies") {
    return "None";
  }
  if (field.includes("stop")) {
    return `Test Stop ${number}`;
  }
  if (field === "quarter") {
    return `Quarter ${number}`;
  }
  if (/^subject\d+$/.test(field)) {
    return `Test Subject ${field.slice(-1)}`;
  }
  if (/^option[1-4]$/.test(field)) {
    return `Test option ${field.slice(-1)}`;
  }
  if (/^[a-d]$/.test(field)) {
    return `Test choice ${field.toUpperCase()}`;
  }

  return `Test ${fieldName} ${number}`;
}

function fixtureValue(schemaType, modelName, fieldName, index) {
  if (schemaType.enumValues?.length) {
    return schemaType.enumValues[index % schemaType.enumValues.length];
  }

  switch (schemaType.instance) {
    case "String":
      return fixtureString(modelName, fieldName, index);
    case "Number": {
      const field = fieldName.toLowerCase();
      if (field.includes("contact") || field.includes("phone")) {
        return 9876501000 + index;
      }
      if (field.includes("rating")) {
        return (index % 5) + 1;
      }
      if (field.includes("status") || field.includes("questionid")) {
        return index + 1;
      }
      if (field.includes("fuelcapacity")) {
        return 60 + index;
      }
      if (field.includes("currentfuel")) {
        return 40 + index;
      }
      if (field.includes("quantity") || field.includes("rooms")) {
        return index + 1;
      }
      if (field.includes("deduction")) {
        return 25 + index;
      }
      if (field.includes("allowance")) {
        return 100 + index * 10;
      }
      return 500 + index * 25;
    }
    case "Date": {
      const date = new Date(seedDate);
      date.setUTCDate(date.getUTCDate() + index);
      return date;
    }
    case "Boolean":
      return index % 2 === 0;
    case "ObjectID":
      return fixtureId(modelName, index);
    case "Array":
      return [];
    case "Mixed":
      return { sample: true, record: index + 1 };
    case "Map":
      return new Map([["sample", `Test ${modelName} ${index + 1}`]]);
    default:
      return undefined;
  }
}

function setNestedValue(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function recordData(Model, index) {
  const data = { _id: fixtureId(Model.modelName, index) };

  for (const [fieldName, schemaType] of Object.entries(Model.schema.paths)) {
    if (fieldName === "_id" || fieldName === "__v" || fieldName === "questions" || fieldName === "stops") {
      continue;
    }
    const value = fixtureValue(schemaType, Model.modelName, fieldName, index);
    if (value !== undefined) {
      setNestedValue(data, fieldName, value);
    }
  }

  if (Model.modelName === "Quiz") {
    data.questions = [{
      questionId: index + 1,
      questionText: `Sample test question ${index + 1}?`,
      options: {
        A: "First test answer",
        B: "Second test answer",
        C: "Third test answer",
        D: "Fourth test answer",
      },
      correctAnswer: ["A", "B", "C", "D"][index % 4],
      points: 1,
    }];
  }

  if (Model.modelName === "BusRoute") {
    data.stops = [{
      stopName: `Test Stop ${index + 1}`,
      arrivalTime: "08:15 AM",
      departureTime: "08:20 AM",
    }];
  }

  return data;
}

async function seedModel(Model, dryRun) {
  const replacements = [];
  for (let index = 0; index < recordCount; index += 1) {
    const document = new Model(recordData(Model, index));
    await document.validate();
    replacements.push({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document.toObject({ depopulate: true }),
        upsert: true,
      },
    });
  }

  if (dryRun) {
    return {
      model: Model.modelName,
      collection: Model.collection.collectionName,
      records: recordCount,
      inserted: 0,
      updated: 0,
      validated: true,
    };
  }

  const result = await Model.bulkWrite(replacements, { ordered: true });
  return {
    model: Model.modelName,
    collection: Model.collection.collectionName,
    records: recordCount,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/erp";
  const dryRun = process.argv.includes("--dry-run");
  const models = loadModels();
  if (models.length !== 30) {
    throw new Error(`Expected 30 schema modules, found ${models.length}. Refusing to seed an incomplete model set.`);
  }
  const fixtureModels = models.filter((Model) => Model.modelName.toLowerCase() !== "admin");
  if (fixtureModels.length !== 29) {
    throw new Error(`Expected 29 non-admin schemas, found ${fixtureModels.length}. Refusing to seed an incomplete model set.`);
  }

  if (!dryRun) {
    await mongoose.connect(uri);
  }

  const results = [];
  for (const Model of fixtureModels) {
    results.push(await seedModel(Model, dryRun));
  }

  console.table(results);
  console.log(
    dryRun
      ? `Validated ${recordCount} test records for each of ${fixtureModels.length} non-admin schemas; database was not changed.`
      : `Seeded ${recordCount} test records for each of ${fixtureModels.length} non-admin schemas.`,
  );
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
