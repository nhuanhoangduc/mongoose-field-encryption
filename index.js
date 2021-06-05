const mongoose = require("mongoose");
const fs = require("fs");
const { ClientEncryption } = require("mongodb-client-encryption");

const keyVaultNamespace = "dev.datakeys";
const localMasterKey = fs.readFileSync("localMaster.key");
const kmsProviders = { local: { key: localMasterKey } };

const { Schema } = mongoose;

const URL = "mongodb+srv://admin:admin@gamerduo.b55ii.azure.mongodb.net/dev";

main();

async function main() {
  const unencryptedClient = await mongoose.createConnection(URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  try {
    console.log("1");
    const clientEncryption = new ClientEncryption(
      unencryptedClient.getClient(),
      {
        kmsProviders,
        keyVaultNamespace,
      }
    );

    console.log("2");
    const dataKeyId = await clientEncryption.createDataKey("local");

    const schemaMap = {
      "dev.passports": {
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
      console.log("3");
      console.log("3");
      console.log("3");
      console.log("3");
      console.log("3");
      await mongoose.connect(URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoEncryption: {
          keyVaultNamespace,
          kmsProviders,
          schemaMap,
        },
      });

      console.log("4");

      const Passport = mongoose.model(
        "passports",
        new Schema({
          name: String,
          passportId: String, // String is shorthand for {type: String}
        })
      );

      console.log("5");

      await Passport.create({
        name: "nhuan",
        passportId: "123 123 123 123",
      });
      const res2 = await Passport.aggregate([{ $match: { name: "nhuan" } }]);
      console.log(res2);
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  } finally {
    await unencryptedClient.close();
  }
}
