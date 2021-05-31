const mongoose = require("mongoose");
const fs = require("fs");
const { ClientEncryption } = require("mongodb-client-encryption");

const keyVaultNamespace = "admin.datakeys";
const localMasterKey = fs.readFileSync("localMaster.key");
const kmsProviders = { local: { key: localMasterKey } };

const { Schema } = mongoose;

const URL = "mongodb://localhost:27017/dev";

main();

async function main() {
  const unencryptedClient = await mongoose.createConnection(URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  try {
    const clientEncryption = new ClientEncryption(
      unencryptedClient.getClient(),
      {
        kmsProviders,
        keyVaultNamespace,
      }
    );

    const dataKeyId = await clientEncryption.createDataKey("local");

    const schemaMap = {
      "test.passports": {
        bsonType: "object",
        properties: {
          passportId: {
            encrypt: {
              keyId: [dataKeyId],
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
              bsonType: "string",
            },
          },
        },
      },
    };

    try {
      await mongoose.connect(URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoEncryption: {
          keyVaultNamespace,
          kmsProviders,
          schemaMap,
        },
      });

      const Passport = mongoose.model(
        "passports",
        new Schema({
          passportId: String, // String is shorthand for {type: String}
        })
      );

      await Passport.create({ passportId: Date.now() });
      await Passport.insertMany([{ passportId: Date.now() }]);
      const res = await Passport.find();
      console.log(res);

      // await encryptedClient.connect();
      // const res = await encryptedClient
      //   .db("test")
      //   .collection("passports")
      //   .find()
      //   .toArray();
      // console.log(res);
    } catch (error) {
      console.log(error);
    }
  } finally {
    await unencryptedClient.close();
  }
}
