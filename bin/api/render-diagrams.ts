#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-run

// Render diagrams
for await (const dirEntry of Deno.readDir('diagrams')) {
	let filePath = `diagrams/${dirEntry.name}`;
	if (dirEntry.name.endsWith(".png") || dirEntry.name.endsWith(".svg")) {
		await Deno.remove(filePath);
	} else if (dirEntry.name.endsWith(".mmd")) {
		console.log("Rendering", filePath);
		await renderDiagram(filePath);
	}
}

async function renderDiagram(filePath) {
	let p = Deno.run({
		cmd: ["bin/api/render_mmd", filePath, filePath.replace(".mmd", ".svg")]
	});
	const status = await p.status();
	console.log("Exit", status);
}

