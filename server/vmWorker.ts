import config from "./config.ts";
import { getBgVMManagers } from "./vm/utils.ts";
import express from "express";
import bodyParser from "body-parser";

const app = express();
const vmManagers = getBgVMManagers();

app.use(bodyParser.json());

Object.values(vmManagers).forEach((manager) => {
  manager?.runBackgroundJobs();
});

app.post("/assignVM", async (req, res) => {
  try {
    // Find a pool that matches the size and region requirements
    const pools = Object.values(vmManagers).filter((mgr) => {
      return (
        mgr.getIsLarge() === Boolean(req.body.isLarge) &&
        (mgr.getRegion() === req.body.region || !req.body.region)
      );
    });
    let vm = null;
    // Sequentially try each to give earlier pools preference
    // We might want to add the ability to load balance as well by randomly selecting between pools with same priority
    for (let pool of pools) {
      console.log(
        "try assignVM from pool:",
        pool.getPoolName(),
        req.body.roomId,
        req.body.uid,
      );
      vm = await pool.assignVM(req.body.roomId, req.body.uid);
      if (vm) {
        res.json(vm);
        return;
      }
    }
    res.json(null);
  } catch (e) {
    console.warn(e);
    res.status(500).end();
  }
});

app.post("/releaseVM", async (req, res) => {
  try {
    const pool =
      vmManagers[
        req.body.provider + (req.body.isLarge ? "Large" : "") + req.body.region
      ];
    if (req.body.id) {
      await pool?.resetVM(req.body.id, req.body.roomId);
    }
    res.end();
  } catch (e) {
    console.warn(e);
    res.status(500).end();
  }
});

app.get("/stats", async (req, res) => {
  const vmManagerStats: AnyDict = {};
  for (let [key, vmManager] of Object.entries(vmManagers)) {
    const availableVBrowsers = await vmManager?.getAvailableVBrowsers();
    const stagingVBrowsers = await vmManager?.getStagingVBrowsers();
    const size = await vmManager?.getCurrentSize();
    if (key && vmManager) {
      vmManagerStats[key] = {
        availableVBrowsers,
        stagingVBrowsers,
        bufferSize: vmManager?.getTargetBuffer(),
        // terminationVBrowsers,
        size,
      };
    }
  }
  res.json(vmManagerStats);
});

app.get("/isStandardPoolFull", async (req, res) => {
  const standardPools = Object.values(vmManagers).filter((mgr) => {
    return mgr?.getIsLarge() === false && mgr?.getLimitSize() > 0;
  });
  const fullResult = await Promise.all<Boolean>(
    standardPools.map(async (pool) => {
      let isFull = false;
      if (pool) {
        const availableCount = await pool.getAvailableCount();
        const limitSize = pool?.getLimitSize() ?? 0;
        const currentSize = await pool.getCurrentSize();
        isFull = Boolean(
          limitSize > 0 &&
          (Number(availableCount) === 0 ||
            Number(currentSize) - Number(availableCount) > limitSize * 0.95),
        );
      }
      return isFull;
    }),
  );
  const isFull = standardPools.length && fullResult.every(Boolean);
  res.json({ isFull });
});

app.post("/updateSnapshot", async (req, res) => {
  const pool = vmManagers[req.body.provider + req.body.region];
  const result = await pool?.updateSnapshot();
  res.send(result?.toString() + "\n");
});

app.listen(config.VMWORKER_PORT, () => {
  console.log("vmWorker listening on %s", config.VMWORKER_PORT);
});
