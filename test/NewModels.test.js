var utils = require("web3-utils");
var Patches = artifacts.require("./Patches.sol");
var Metadata = artifacts.require("./Metadata.sol");
var Controller = artifacts.require("./Controller.sol");

let gasPrice = 1000000000; // 1GWEI

let _ = "        ";

contract("Patches", async function(accounts) {
  let patches, metadata, controller;

  let newmodels = accounts[0];
  let billy = accounts[1];
  let artist = accounts[2];
  let artist2 = accounts[3];
  let buyer = accounts[9];

  before(done => {
    (async () => {
      try {
        var totalGas = new web3.BigNumber(0);

        // Deploy Patches.sol (NFT)
        patches = await Patches.new("Patches", "BDF");
        var tx = web3.eth.getTransactionReceipt(patches.transactionHash);
        totalGas = totalGas.plus(tx.gasUsed);
        console.log(_ + tx.gasUsed + " - Deploy patches");
        patches = await Patches.deployed();

        // Deploy Metadata.sol
        // -w Patches address
        metadata = await Metadata.new();
        var tx = web3.eth.getTransactionReceipt(metadata.transactionHash);
        totalGas = totalGas.plus(tx.gasUsed);
        console.log(_ + tx.gasUsed + " - Deploy metadata");
        metadata = await Metadata.deployed();

        // Update Patches.sol
        // -w Metadata address
        var tx = await patches.updateMetadataAddress(metadata.address);
        totalGas = totalGas.plus(tx.receipt.gasUsed);
        console.log(_ + tx.receipt.gasUsed + " - Update patches");

        // Deploy Controller.sol
        // -w Patches address
        controller = await Controller.new(patches.address);
        var tx = web3.eth.getTransactionReceipt(controller.transactionHash);
        totalGas = totalGas.plus(tx.gasUsed);
        console.log(_ + tx.gasUsed + " - Deploy controller");
        controller = await Controller.deployed();

        // Update Patches.sol
        // -w Controller address
        var tx = await patches.updateWalletAddress(newmodels);
        totalGas = totalGas.plus(tx.receipt.gasUsed);
        console.log(_ + tx.receipt.gasUsed + " - Update patches");

        var tx = await patches.updateBillyAddress(billy);
        totalGas = totalGas.plus(tx.receipt.gasUsed);
        console.log(_ + tx.receipt.gasUsed + " - Update patches");

        var tx = await patches.updateControllerAddress(controller.address);
        totalGas = totalGas.plus(tx.receipt.gasUsed);
        console.log(_ + tx.receipt.gasUsed + " - Update patches");

        var tx = await patches.updateMetadataAddress(metadata.address);
        totalGas = totalGas.plus(tx.receipt.gasUsed);
        console.log(_ + tx.receipt.gasUsed + " - Update patches");

        console.log(_ + totalGas.toFormat(0) + " - Total Gas");
        done();
      } catch (error) {
        console.error(error);
        done(false);
      }
    })();
  });

  describe("Patches.sol", function() {
    it("should be able to read metadata", async function() {
      let meta = await patches.tokenURI(666);
      let _meta = await metadata.tokenURI(666);
      console.log(_ + "metadata 666: ", meta);
      assert(
        _meta === meta,
        "_metadata (" + _meta + ") != metadata (" + meta + ") "
      );
    });

    it("should read parameters that were set", async function() {
      let _walletAddress = await patches.getWallet();
      assert(_walletAddress === newmodels, "wallet address not equal");

      let _billyAddress = await patches.getBilly();
      assert(_billyAddress === billy, "billy address not equal");

      let _controllerAddress = await patches.getController();
      assert(
        _controllerAddress === controller.address,
        "controller address not equal"
      );

      let _metadataAddress = await patches.getMetadata();
      assert(
        _metadataAddress === metadata.address,
        "metadata address not equal"
      );
    });

    it("should calculate work id from token id", async function() {
      let _tokenId = 123;
      let _workId = 2;
      let workId = await patches.getWorkFromToken(_tokenId);
      assert(
        _workId.toString() === workId.toString(),
        "workIds not equal (" + _workId + ", " + workId + ")"
      );

      _tokenId = 1245;
      _workId = 13;
      workId = await patches.getWorkFromToken(_tokenId);
      assert(
        _workId.toString() === workId.toString(),
        "workIds not equal (" + _workId + ", " + workId + ")"
      );

      _tokenId = 16;
      _workId = 1;
      workId = await patches.getWorkFromToken(_tokenId);
      assert(
        _workId.toString() === workId.toString(),
        "workIds not equal (" + _workId + ", " + workId + ")"
      );
    });

    it("should hash a work the same as the contract", async function() {
      let work = "asdf";
      let hash = utils.soliditySha3(work);
      let soliditySha3 = await patches.hashWork(work);
      assert(
        hash == soliditySha3,
        "hashes are not the same " + hash + " !== " + soliditySha3
      );
    });

    it("should make a new work", async function() {
      let workId = "1";
      _workExists = await patches.workExists(workId);
      let work = "asdf";
      let hash = utils.soliditySha3(work);
      tx = patches.addWork(workId, artist, hash);
      workExists = await patches.workExists(workId);
      assert(_workExists !== workExists, "workExists after work is created");

      let workHash = await patches.workHash(workId);
      assert(workHash == hash, "Hash wasn't stored properly");

      let workArtist = await patches.workArtist(workId);
      assert(workArtist == artist, "Artist wasn't stored properly");
    });
  });

  describe("Controller.sol", function() {
    it("should fail checking a patch that doesnt exist", async function() {
      let _tokenId = 0;
      try {
        let ownerOf = await patches.ownerOf(_tokenId);
        assert(false, "ownerOf should have failed while no one owns it");
      } catch (error) {
        // console.log(_ + error)
        assert(true);
      }
    });

    function getPrice(soldSoFar = 0) {
      let expectedWorkPrice = utils.toWei(new utils.BN("1"), "finney");
      let foo = new utils.BN(soldSoFar);
      return expectedWorkPrice.mul(
        foo
          .sub(new utils.BN("10"))
          .add(new utils.BN("1"))
          .mul(new utils.BN("10"))
      );
    }

    it("should make sure buy works", async function() {
      try {
        await buyWorks();
      } catch (error) {
        console.log(_ + "buyWorks", error);
        assert(false, "buyWorks should not fail");
      }
    });

    const buyWorks = (i = 10, limit = 100) => {
      return new Promise(async (resolve, reject) => {
        if (i >= 100) {
          resolve();
        } else {
          let workId = "1";
          let expectedWorkPrice = getPrice(i);
          var workPrice = await controller.getPrice(workId);
          if (i <= 12 || i >= 97) {
            console.log(
              _ +
                "edition number " +
                (i + 1) +
                " (purchase number " +
                (i + 1 - 10) +
                ") costs " +
                utils.fromWei(workPrice.toString(), "Ether")
            );
          } else if (i === 21) {
            console.log(_ + "...");
          }
          assert(
            expectedWorkPrice.toString() === workPrice.toString(),
            "price for work id " +
              workId +
              " edition number " +
              i +
              " was not as expected (" +
              utils.fromWei(expectedWorkPrice.toString()) +
              ", " +
              utils.fromWei(workPrice.toString()) +
              ")"
          );
          var tx = await controller.buy(buyer, workId, {
            from: accounts[i % 10],
            value: workPrice.toString()
          });
          return buyWorks(i + 1, limit)
            .then(resolve)
            .catch(reject);
        }
      });
    };
    it("should fail trying to buy a finished series", async function() {
      let _tokenId = 0;
      try {
        let expectedWorkPrice = getPrice(i);
        assert(false, "getPrice should have failed with a finished set");
      } catch (error) {
        assert(true);
      }
      try {
        let highPrice = utils.toWei("1");
        let workId = "1";
        var tx = await controller.buy(buyer, workId, {
          from: buyer,
          value: highPrice.toString()
        });
        console.log(_ + tx);
        assert(false, "buy should have failed with a finished set");
      } catch (error) {
        assert(true);
      }
    });

    it("should fail trying to buy a work without enough money", async function() {
      try {
        let workId = "2";
        let work = "asdf";
        let hash = utils.soliditySha3(work);
        let tx = await patches.addWork(workId, artist2, hash);
        let workPrice = await controller.getPrice(workId);
        let spend = workPrice.sub(1);
        tx = await controller.buy(buyer, workId, {
          from: buyer,
          value: spend.toString()
        });
        assert(
          false,
          "buy should have failed when spending only " + spend.toString()
        );
      } catch (error) {
        assert(true);
      }
    });

    it("should succeed collecting reserved editions", async function() {
      try {
        let tokenOwner = await patches.ownerOf("1");
        assert(false, "ownerOf should have failed before token is claimed");
      } catch (error) {
        assert(true);
      }
      try {
        let workId = "1";
        let woksSoldBefore = await patches.workSold(workId);

        var tx = await controller.reserved(workId);

        let woksSoldAfter = await patches.workSold(workId);
        assert(
          woksSoldBefore.toString() === woksSoldAfter.sub(10).toString(),
          "workSold did not update correctly, " +
            woksSoldBefore.toString() +
            " !== " +
            woksSoldAfter.sub(10).toString()
        );

        let tokenCount = await patches.balanceOf(artist);
        assert(
          tokenCount.toString() === "3",
          "artist did not receive 3 tokens rather " + tokenCount.toString()
        );

        let tokenOwner = await patches.ownerOf("1");
        assert(
          tokenOwner === artist,
          tokenOwner + " did not equal artist token owner" + artist
        );

        tokenCount = await patches.balanceOf(newmodels);
        assert(
          tokenCount.toString() === "5",
          "newmodels did not receive 5 tokens rather " + tokenCount.toString()
        );

        tokenOwner = await patches.ownerOf("6");
        assert(
          tokenOwner === newmodels,
          tokenOwner + " did not equal artist token owner" + newmodels
        );

        tokenCount = await patches.balanceOf(billy);
        assert(
          tokenCount.toString() === "2",
          "billy did not receive 2 tokens rather " + tokenCount.toString()
        );

        tokenOwner = await patches.ownerOf("5");
        assert(
          tokenOwner === billy,
          tokenOwner + " did not equal artist token owner" + billy
        );
      } catch (error) {
        console.log(_ + "error", error);
        assert(false, "reserved should not had failed");
      }
    });
  });
});

function getBlockNumber() {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });
}

function increaseBlocks(blocks) {
  return new Promise((resolve, reject) => {
    increaseBlock().then(() => {
      blocks -= 1;
      if (blocks == 0) {
        resolve();
      } else {
        increaseBlocks(blocks).then(resolve);
      }
    });
  });
}

function increaseBlock() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: 12345
      },
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
}

function decodeEventString(hexVal) {
  return hexVal
    .match(/.{1,2}/g)
    .map(a =>
      a
        .toLowerCase()
        .split("")
        .reduce(
          (result, ch) => result * 16 + "0123456789abcdefgh".indexOf(ch),
          0
        )
    )
    .map(a => String.fromCharCode(a))
    .join("");
}
