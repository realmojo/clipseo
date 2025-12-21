import { google } from "googleapis";
import request from "request";

export const googleIndexingApi = async (link: string) => {
  const key = require("./devupbox.json");
  return new Promise((resolve) => {
    const jwtClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    jwtClient.authorize(function (err: any, tokens: any) {
      if (err) {
        console.log(err);
        return;
      }
      let options = {
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        // Your options, which must include the Content-Type and auth headers
        headers: {
          "Content-Type": "application/json",
        },
        auth: { bearer: tokens.access_token },
        // Define contents here. The structure of the content is described in the next step.
        json: {
          url: link,
          type: "URL_UPDATED",
        },
      };
      request(options, function (error: any, response: any, body: any): void {
        if (error) {
          console.log(error);
        } else {
          // Handle the response
          console.log(body);
        }
        resolve("ok");
      });
    });
  });
};

export const naverIndexingApi = async (link: string) => {
  try {
    const response = await fetch(
      `https://searchadvisor.naver.com/indexnow?url=${link}&key=8dbbd7d6729b4a65b7dce4b9083c65e3`
    );
    console.log(response);

    if (response.ok) {
      console.log("naverIndexingApi(성공)");
    } else {
      console.log("naverIndexingApi(실패)");
    }
  } catch (e) {
    console.log("naverIndexingApi(실패): ", e);
  }
};
