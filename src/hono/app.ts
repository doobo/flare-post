import { Hono } from "hono";
import { Bindings } from "../types";
import postsApi from "../api/posts";
import authApi from "../api/auth";
import usersApi from "../api/users";
import dictionariesApi from "../api/dictionaries";
import menusApi from "../api/menus";
import redirectApi from "../api/redirect";
import uploadApi from "../api/upload";
import uploadConfigsApi from "../api/uploadConfigs";
import filesApi from "../api/files";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/api/posts", postsApi);
app.route("/api/auth", authApi);
app.route("/api/users", usersApi);
app.route("/api/dictionaries", dictionariesApi);
app.route("/api/menus", menusApi);
app.route("/api/upload", uploadApi);
app.route("/api/upload-configs", uploadConfigsApi);
app.route("/api/files", filesApi);
app.route("/", redirectApi);

export default app;
