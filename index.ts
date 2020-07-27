const polka = require("polka");
const send = require("@polka/send-type");
import axios from "axios";
import { Octokit } from "@octokit/rest";
import { config } from "dotenv";
config();

const octokit = new Octokit({
  auth: process.env.GH_PAT,
  userAgent: "KojBot",
});

const server = polka()
  .post("/", (_: any, response: any) => {
    console.log("Triggering Netlify build", new Date());
    axios
      .post(process.env.NETLIFY_WEBHOOK ?? "")
      .then(() =>
        send(response, 200, {
          text: "Okay, I'm triggering a build on Netlify 🚀",
        })
      )
      .catch((error) => {
        console.log(error);
        send(response, 200, {
          text: "I got an error in trying to deploy the site.",
        });
      });
  })
  .post("/:repo/:event", async (request: any, response: any) => {
    const repo = request.params.repo;
    const event_type = request.params.repo;
    console.log("Triggering repository event", repo, event_type, new Date());
    try {
      await octokit.repos.createDispatchEvent({
        owner: "koj-co",
        repo,
        event_type,
      });
      return send(response, 200, {
        text: "Okay, triggering! 🚀",
      });
    } catch (error) {
      return send(response, 200, {
        text: "I got an error in trying to trigger this event.",
      });
    }
  });

(server as any).listen(process.env.PORT ?? 3003, (error: any) => {
  if (error) console.log(error);
  console.log(`> Running on localhost:${process.env.PORT ?? 3003}`);
});
