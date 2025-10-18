const express = require("express");
const app = express();
const PORT = 3002;
import { triggerBuildImageGithub } from "./jobs/build_image_github";
app.get("/orchestrator", (req, res) => {
  res.send("Hello from Express Services Orchestrator !");
});



app.get("/orchestrator/trigger-build", async(req,res) => { 
    const { cloneUrl, NameRepo } = req.query;
    triggerBuildImageGithub(cloneUrl, NameRepo).then(()=> {
        res.send("Build triggered successfully");
    })
})








app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
