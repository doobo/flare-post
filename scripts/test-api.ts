import { sign } from "hono/jwt";
import Database from "better-sqlite3";
import path from "path";

async function runTests() {
  console.log("=== Running Publish & Redirect API Integration Tests ===");
  const secret = "default_jwt_secret_key";
  const payload = {
    id: 1,
    username: "admin",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
  };
  
  const token = await sign(payload, secret);
  console.log("Generated Admin JWT Token:", token);

  const baseUrl = "http://localhost:3000";

  // Test 1: Publish Markdown post
  console.log("\n--- Test 1: Publish Markdown Post ---");
  const markdownPayload = {
    title: "Test Markdown Post with External Links",
    category: "虚拟机 / KVM",
    category_id: 107,
    tags: "kvm,test",
    content: "Check out [Google](https://google.com) and also [VueJS](https://vuejs.org/guide/introduction.html). Support link: [Local Node](http://localhost:3000/info).",
    content_type: "markdown"
  };

  const postRes1 = await fetch(`${baseUrl}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(markdownPayload)
  });

  if (!postRes1.ok) {
    throw new Error(`Failed to publish markdown post: ${await postRes1.text()}`);
  }

  const postData1 = await postRes1.json() as any;
  console.log("Markdown Post Created, ID:", postData1.id);

  // Test 2: Fetch and verify URL redirection in Markdown
  console.log("\n--- Test 2: Fetch and Verify Markdown URL Replacement ---");
  const getRes1 = await fetch(`${baseUrl}/api/posts/${postData1.id}`);
  if (!getRes1.ok) {
    throw new Error(`Failed to fetch post ${postData1.id}`);
  }
  const getData1 = await getRes1.json() as any;
  console.log("Fetched Content:");
  console.log(getData1.content_md);

  if (getData1.content_md.includes("/redirect?url=https%3A%2F%2Fgoogle.com") &&
      getData1.content_md.includes("/redirect?url=https%3A%2F%2Fvuejs.org")) {
    console.log("✅ Success: External links correctly rewritten to redirect URLs!");
  } else {
    throw new Error("❌ Error: External links were not correctly rewritten.");
  }

  if (getData1.content_md.includes("[Local Node](http://localhost:3000/info)")) {
    console.log("✅ Success: Local host link was NOT rewritten (whitelisted)!");
  } else {
    throw new Error("❌ Error: Local host link should not be rewritten.");
  }

  // Test 3: Publish HTML Rich Text post
  console.log("\n--- Test 3: Publish HTML Rich Text Post ---");
  const htmlPayload = {
    title: "Test HTML Rich Text Post with Links",
    category: "VPN / 自建VPN",
    category_id: 110,
    tags: "vpn,html",
    content: "Try <a href=\"https://google.com/search?q=vpn\">Google VPN Search</a> and <a href=\"https://github.com\">Github</a>. Local: <a href=\"http://localhost:3000/api\">API</a>.",
    content_type: "richtext"
  };

  const postRes2 = await fetch(`${baseUrl}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(htmlPayload)
  });

  if (!postRes2.ok) {
    throw new Error(`Failed to publish HTML post: ${await postRes2.text()}`);
  }

  const postData2 = await postRes2.json() as any;
  console.log("HTML Post Created, ID:", postData2.id);

  // Test 4: Fetch and verify URL redirection in HTML
  console.log("\n--- Test 4: Fetch and Verify HTML URL Replacement ---");
  const getRes2 = await fetch(`${baseUrl}/api/posts/${postData2.id}`);
  if (!getRes2.ok) {
    throw new Error(`Failed to fetch post ${postData2.id}`);
  }
  const getData2 = await getRes2.json() as any;
  console.log("Fetched Content:");
  console.log(getData2.content_md);

  if (getData2.content_md.includes("href=\"/redirect?url=https%3A%2F%2Fgoogle.com%2Fsearch%3Fq%3Dvpn\"") &&
      getData2.content_md.includes("href=\"/redirect?url=https%3A%2F%2Fgithub.com\"")) {
    console.log("✅ Success: External HTML links correctly rewritten to redirect URLs!");
  } else {
    throw new Error("❌ Error: External HTML links were not correctly rewritten.");
  }

  // Test 5: Verify /redirect endpoint and redirect_logs entry
  console.log("\n--- Test 5: Verify /redirect Logging ---");
  const targetUrl = "https://google.com/search?q=vpn";
  const redirectRes = await fetch(`${baseUrl}/redirect?url=${encodeURIComponent(targetUrl)}`, {
    headers: {
      "User-Agent": "AntigravityTestAgent",
      "Referer": "http://localhost:5173/post/1"
    }
  });

  if (!redirectRes.ok) {
    throw new Error(`Redirect page failed: ${await redirectRes.text()}`);
  }
  console.log("Redirect page status:", redirectRes.status);
  
  // Wait a short moment to ensure executionCtx.waitUntil finishes sqlite write
  await new Promise(resolve => setTimeout(resolve, 500));

  // Query D1 directly from SQLite file
  const db = new Database(path.resolve(__dirname, "../local-node.db"));
  const log = db.prepare("SELECT * FROM redirect_logs WHERE user_agent = ? ORDER BY id DESC").get("AntigravityTestAgent") as any;
  db.close();

  if (log && log.target_url === targetUrl) {
    console.log("✅ Success: Redirect logged correctly in DB!");
    console.log("Log Details:", log);
  } else {
    throw new Error("❌ Error: Redirect log was not found or incorrect in DB.");
  }

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
