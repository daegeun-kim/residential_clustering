const vh = window.innerHeight / 1440;
const vw = window.innerWidth / 2560;
const width = 1480*vw;
const height = 720*vh;
const paddingY = 100*vh;

d3.json("nodeLink.json")
    .then(nodeLink => {
        const svg = d3.select("#nodelink")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

        const nodeById = new Map(nodeLink.nodes.map(d => [d.id, d]));

        const groupNames = Array.from(new Set(nodeLink.nodes.map(d => d.group)));
        const layers = {};
        groupNames.forEach(g => layers[g] = []);
        nodeLink.nodes.forEach(d => layers[d.group].push(d));

        Object.entries(layers).forEach(([group, nodes], i) => {
            const layerSpacing = 1000;
            const totalLayoutWidth = (groupNames.length - 1) * layerSpacing;
            const offsetX = (width - totalLayoutWidth) / 2;
            nodes.forEach((node, j) => {
                node.x = offsetX + i * layerSpacing;
                node.y = paddingY + j * 26 - 36*vh;
            });
        });

        Object.entries(layers).forEach(([group, nodes], i) => {
            const layerSpacing = 450;
            const totalLayoutWidth = (groupNames.length - 1) * layerSpacing;
            const offsetX = (width - totalLayoutWidth) / 2;
            const verticalGap = (group === "cluster") ? 150*vh : 50*vh;
            const blockHeight = (nodes.length - 1) * verticalGap;
            const startY = (height - blockHeight) / 2;

            nodes.forEach((node, j) => {
                node.x = offsetX + i * layerSpacing;
                node.y = startY + j * verticalGap;
            });
        });

        const linkGen = d3.linkHorizontal().x(d => d.x).y(d => d.y);

        svg.attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet");

        const clusterSection = document.querySelector(".cluster");
        const labelToBgId = {
        "Evolutionary Clusters": "bg-evolutionary",
        "Architectural Clusters": "bg-architectural",
        "Socio Spatial Clusters": "bg-socio",
        "Economic Financial Clusters": "bg-economic"
        };

        const labels = svg.selectAll("g.label")
        .data(nodeLink.nodes)
        .enter()
        .append("g")
        .attr("class", "label");

        const buttonIDs = new Set([
        "Socio Spatial Clusters",
        "Architectural Clusters",
        "Evolutionary Clusters",
        "Economic Financial Clusters"
        ]);

        const labelToClass = {
        "Socio Spatial Clusters": ".socio-spatial",
        "Architectural Clusters": ".architectural",
        "Evolutionary Clusters": ".evolutionary",
        "Economic Financial Clusters": ".eco-fin"
        };

        const clickable = labels
        .filter(d => buttonIDs.has(d.id))
        .classed("button", true)     // <-- tag for CSS
        .style("cursor", "pointer")
        .on("click", (event, d) => { 
            // --- Show the correct description ---
            const targetClass = labelToClass[d.id];
            if (targetClass) {
            clusterSection.querySelectorAll(".cluster-des > div")
                .forEach(div => div.classList.remove("active"));
            const target = clusterSection.querySelector(targetClass);
            if (target) target.classList.add("active");
            }

            // --- Your existing background / fade logic ---
            const bgId = labelToBgId[d.id];
            if (!bgId || !clusterSection) return;

            clusterSection.classList.add("fade");
            setTimeout(() => { clusterSection.id = bgId; }, 250);
            links.attr("stroke-opacity", l =>
            (l.source === d.id || l.target === d.id) ? 0.7 : 0.06
            );
            setTimeout(() => { clusterSection.classList.remove("fade"); }, 500);

            // --- Update active state on labels ---
            svg.selectAll("g.label").classed("active", false);
            d3.select(event.currentTarget).classed("active", true);
        });


labels.filter(d => !buttonIDs.has(d.id)).style("cursor", "default");

// Nodes ===================================================================

        labels.append("rect")
        .filter(d => buttonIDs.has(d.id))
        .attr("rx", 20).attr("ry", 20) // rounded corners
        .attr("fill", "#232323ff")
        .attr("fill", "rgba(255, 255, 255, 0.11)");

        // append text on top
        labels.append("text")
        .attr("x", d => (d.group === "original data" ? d.x - 15 : d.x + 24))
        .attr("y", d => d.y)
        .attr("text-anchor", d => (d.group === "original data" ? "end" : "start"))
        .attr("alignment-baseline", "middle")
        .attr("font-size", "1vw")
        .attr("fill", "#e5e5e5ff")
        .text(d => d.id);

        labels.each(function(d) {
        const g = d3.select(this);
        const text = g.select("text");
        const rect = g.select("rect");

        // measure text
        const bbox = text.node().getBBox();
        rect
            .filter(d => buttonIDs.has(d.id))
            .attr("x", bbox.x - 30)           // padding left
            .attr("y", bbox.y - 6)            // padding top
            .attr("width", bbox.width + 60)   // text width + padding
            .attr("height", bbox.height + 12);
        });

// Links ===================================================================

    const links = svg.selectAll("path.link")
    .data(nodeLink.links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d => {
        const r = 6;
        const s = nodeById.get(d.source);
        const t = nodeById.get(d.target);
        const dx = t.x - s.x;
        const sx = s.x + (dx > 0 ? r : -r);
        const tx = t.x - (dx > 0 ? r : -r);
        return linkGen({ source: { x: sx, y: s.y }, target: { x: tx, y: t.y } });
    })
    .attr("fill", "none")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", d => {
        if (
        (d.source === "Time to Closest Subway Station" && d.target === "Socio Spatial Clusters") ||
        (d.source === "Building Height" && d.target === "Socio Spatial Clusters") ||
        (d.source === "Average Property Value" && d.target === "Economic Financial Clusters") ||
        (d.source === "Property Value Per Sqft" && d.target === "Economic Financial Clusters") ||
        (d.source === "Property Value Increase 2024-2025" && d.target === "Economic Financial Clusters") ||
        (d.source === "Building Stories" && d.target === "Architectural Clusters") ||
        (d.source === "Building Height" && d.target === "Architectural Clusters")
        ) return 7;

        if (d.source === "Building Construction Year" && d.target === "Evolutionary Clusters") return 12;

        if (
        (d.source === "Building Construction Year" && d.target === "Evolutionary Clusters") ||
        (d.source === "Building Height" && d.target === "Evolutionary Clusters") ||
        (d.source === "Accessibility" && d.target === "Evolutionary Clusters") ||
        (d.source === "Residential Gross Area" && d.target === "Architectural Clusters") ||
        (d.source === "Residential Area Share" && d.target === "Architectural Clusters")
        ) return 4;

        return 2; // default
    })
    // initial opacity: highlight Socio Spatial Cluster (since your HTML starts with id="bg-socio")
    .attr("stroke-opacity", d =>
        (d.source === "Socio Spatial Clusters" || d.target === "Socio Spatial Clusters") ? 0.5 : 0.1
    );

// ===================================================================


    svg.selectAll("g.label")
    .classed("active", d => labelToBgId[d.id] === "bg-socio");
    })
    .catch(err => console.error("Failed to load nodeLink.json:", err));
