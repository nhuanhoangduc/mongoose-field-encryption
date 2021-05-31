const mongoose = require("mongoose");
const fs = require("fs");
const { ClientEncryption } = require("mongodb-client-encryption");

const keyVaultNamespace = "admin.datakeys";
const localMasterKey = fs.readFileSync("localMaster.key");
const kmsProviders = { local: { key: localMasterKey } };

const { Schema } = mongoose;

const URL =
  "mongodb://mongodb0:27018,mongodb1:27019,mongodb2:27020/dev?replicaSet=rs0";

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

      await Passport.create({ passportId: Date.now(), name: "nhuan" });
      // await Passport.insertMany([{ passportId: Date.now(), name: "nhuan" }]);
      const res = await Passport.aggregate([{ $match: { name: "nhuan" } }]);
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
  } catch (error) {
    console.log(error);
  } finally {
    await unencryptedClient.close();
  }
}
