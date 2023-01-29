#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write

import yaml from "npm:yaml";
import { emptyDir } from "https://deno.land/std/fs/mod.ts";

await Deno.copyFile("../backend/openapi/openapi.yml", "openapi.yml");

const spec = yaml.parse(await Deno.readTextFile("openapi.yml"));
let mintJson = JSON.parse(await Deno.readTextFile("mint.base.json"));

let importantEndpoints = {
	"matchmaker": [
		"POST /lobbies/find",
		"POST /lobbies/join",
		"POST /lobbies/ready",
		"POST /players/connected",
		"POST /players/disconnected",
	],
	"identity": [
		"POST /identities",
		"POST /game-links",
		"POST /game-links/complete",
		"GET /game-links/complete",
	],
};

let apiTemplates = {};
for (let navigation of mintJson.navigation) {
	if (navigation.__apiTemplate) {
		apiTemplates[navigation.__apiTemplate] = navigation;
		navigation.pages = [];
		delete navigation.__apiTemplate;
	}
}

await emptyDir("matchmaker/api");
await emptyDir("identity/api");

for (let pathName in spec.paths) {
	for (let method in spec.paths[pathName]) {
		let path = spec.paths[pathName][method];

		console.log('Registering', method, pathName);

		// TODO: Hack
		let product;
		if (pathName.startsWith("/lobbies") || pathName.startsWith("/players")) {
			product = "matchmaker";
		} else {
			product = "identity";
		}

		let indexableName = `${method.toUpperCase()} ${pathName}`;
		let importantIndex = importantEndpoints[product].indexOf(indexableName);
		let isImportant = importantIndex != -1;

		let title = path.operationId.replace("Service.", ".");
		if (isImportant) title = "⭐️ " + title;

		let file = `---\ntitle: "${title}"\nopenapi: "${method.toUpperCase()} ${pathName}"\n---`;

		let pathStripped = pathName.replace(/\/\{.*\}/g, "").replace(/\//g, "-");
		let filePath = new String(`${product}/api/${method}${pathStripped}`);

		// Sort by grouping similar endpoints together and move important endpoints first
		filePath.sortingKey = `${isImportant ? "0" : `999 ${importantIndex}`} ${pathName} ${method}`;  

		await Deno.writeTextFile(`${filePath}.mdx`, file);

		apiTemplates[product].pages.push(filePath);
		apiTemplates[product].pages.sort((a, b) => {
			if (a.sortingKey < b.sortingKey) return -1;
			else if (a.sortingKey > b.sortingKey) return 1;
			else return 0;
		});

	}
}

await Deno.writeTextFile("mint.json", JSON.stringify(mintJson, null, 4));

