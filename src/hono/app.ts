import { Hono } from "hono";
import { Bindings } from "../types";
import postsApi from "../api/posts";
import authApi from "../api/auth";
import usersApi from "../api/users";
import dictionariesApi from "../api/dictionaries";
import menusApi from "../api/menus";
import redirectApi from "../api/redirect";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/api/posts", postsApi);
app.route("/api/auth", authApi);
app.route("/api/users", usersApi);
app.route("/api/dictionaries", dictionariesApi);
app.route("/api/menus", menusApi);
app.route("/", redirectApi);

export default app;
