// Require the framework and instantiate it
const fastify = require("fastify")({
  logger: { prettyPrint: true, level: "debug" },
});
// const DB = JSON.parse(fs.readFileSync("data.json"));
const fastifyStatic = require("fastify-static");
const fs = require("fs");
const path = require("path");

const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const util = require("util");
let DB = require("./data.json");
// DEBUG
const DEBUG = true;
const PORT = process.env.PORT || 3111;

fastify.register(require("fastify-routes"));
fastify.register(require("fastify-cors"), {
  // put your options here
});

// Declare a route
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// fastify.register(fastifyStatic, {
//   root: path.join(__dirname, "sites"),
//   prefix: "/css/",
//   list: true,
//   decorateReply: false, // the reply decorator has been added by the first plugin registration
// });

// fastify.get("/", async (request, reply) => {
//   return reply.sendFile("public/index.html");
// });

fastify.get("/sites", async (request, reply) => {
  return DB.sites;
});

const loadSites = () => {
  fastify.log.debug(`DATA: ${util.inspect(DB)}`);
  DB.sites.forEach((site) => {
    if (!fs.existsSync(`./sites/${site.uuid}`)) {
      setupSite(site);
    }
    fastify.log.debug(`SITE: ${site.name}`);
    fastify.get(`/css/${site.uuid}.css`, async (request, reply) => {
      const stream = fs.createReadStream(
        path.join(__dirname, `sites/${site.uuid}/style.css`)
      );
      return reply.type("text/css").send(stream);
    });
  });
};

const write = (data) => {
  fs.writeFileSync("data.json", JSON.stringify(data));
};

const setupSite = (site) => {
  fastify.log.debug("SETUP SITE", site.name);
  // create site folder
  fs.mkdirSync(`./sites/${site.uuid}`);
  // create template.css
  //   fs.writeFileSync(
  //     `./sites/${site.uuid}/template.css`,
  //     `@tailwind base;
  // @tailwind components;
  // @tailwind utilities;
  // `
  //   );
  // add tailwind.config.js
  fs.writeFileSync(
    `./sites/${site.uuid}/tailwind.config.js`,
    `module.exports = {
  purge: ["./**/*.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require("daisyui")],
  //   plugins: [require("sailui")],
};`
  );
  importSite(site);
  // Compile site
  compileSite(site);
};

const importSite = (site) => {
  fastify.log.debug("IMPORT SITE", site.name);

  fs.cpSync(site.source.path, `./sites/${site.uuid}/index.html`);
};

// Refresh site API handler /api/sites/:uuid/refresh
fastify.post("/api/sites/:uuid/refresh", async (request, reply) => {
  const site = DB.sites.find((s) => s.uuid === request.params.uuid);
  if (!site) {
    return reply.code(404).send({ error: "Site not found" });
  }
  compileSite(site);
  return site;
});

// Import site API handler /api/sites/:uuid/import
fastify.post("/api/sites/:uuid/import", async (request, reply) => {
  const site = DB.sites.find((s) => s.uuid === request.params.uuid);
  if (!site) {
    return reply.code(404).send({ error: "Site not found" });
  }
  importSite(site);
  return site;
});

const compileSite = (site) => {
  fastify.log.debug("Compile SITE", site.name);
  const tw = spawn(
    "tailwind",
    [
      "-o",
      "style.css",
      "--jit",
      // "--purge",
      // "index.html",
      // "--minify",
      "--config",
      "tailwind.config.js",
    ],
    {
      cwd: `./sites/${site.uuid}/`,
    }
  );

  tw.stdout.on("data", (data) => {
    fastify.log.debug(`stdout: ${data}`);
  });

  tw.stderr.on("data", (data) => {
    fastify.log.debug(`stderr: ${data}`);
  });

  tw.on("exit", (code, signal) => {
    fastify.log.debug(
      `child process exited with code ${code} and signal ${signal}`
    );
  });
};

const addSite = (site) => {
  site.uuid = uuidv4();
  DB.sites.push(site);
  fs.mkdirSync(`./sites/${site.uuid}`);
  compileSite(site);
  write(DB);
};

const removeSite = (uuid) => {
  DB.sites = DB.sites.filter((site) => site.uuid !== uuid);
  fs.rm(`./sites/${uuid}`, { recursive: true, force: true }, (err) => {});
  write(DB);
};

const updateSite = (uuid, site) => {
  DB.sites.forEach((s) => {
    if (s.uuid === uuid) {
      s.name = site.name;
      s.url = site.url;
      s.compiled = site.compiled;
    }
  });
  write(DB);
};

// Run the fastify!
const start = async () => {
  try {
    loadSites();
    // compileSite(DB.sites[0]);
    console.log("routes:", fastify.routes);
    // util.log(fastify);
    console.log(fastify.printRoutes());
    await fastify.listen(PORT, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info(`server listening on ${address}`);
      console.log(fastify.routes);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
// loadSites();
